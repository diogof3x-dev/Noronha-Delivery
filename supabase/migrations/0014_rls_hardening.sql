-- Hardening de RLS:
-- 1) Bloquear escalation de role em profiles (a 0013 removeu o freeze de role
--    inadvertidamente -> usuário podia se promover a admin via update do
--    próprio profile). Restaurado via with check + função stable.
-- 2) Adicionar UPDATE policies controladas em orders por persona
--    (customer cancela, business avança status, driver assume e finaliza).
-- 3) Travar campos sensíveis em businesses (owner_id, is_verified, is_eco_certified)
--    para que owners não auto-elevem.
-- 4) UPDATE/DELETE em ratings: só autor; reply só dono do negócio (já existe).
-- 5) order_items: UPDATE só enquanto o pedido está pendente.

------------------------------------------------------------------
-- 1) profiles: bloquear escalation de role
------------------------------------------------------------------
create or replace function public.current_role()
returns user_role
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke execute on function public.current_role() from anon;
grant execute on function public.current_role() to authenticated, service_role;

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = public.current_role()
  );

------------------------------------------------------------------
-- 2) orders: UPDATE policies por persona
------------------------------------------------------------------

-- Cliente cancela enquanto pending/confirmed
create policy "orders_update_customer_cancel" on public.orders
  for update to authenticated
  using (
    customer_id = auth.uid()
    and status in ('pending', 'confirmed')
  )
  with check (
    customer_id = auth.uid()
    and status in ('pending', 'confirmed', 'cancelled')
  );

-- Lojista avança status do próprio negócio
create policy "orders_update_business" on public.orders
  for update to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- Motoboy assume entrega que está pronta e sem driver
create policy "orders_update_driver_claim" on public.orders
  for update to authenticated
  using (
    driver_id is null
    and status = 'ready'
    and public.current_role() = 'driver'
  )
  with check (
    driver_id = auth.uid()
    and public.current_role() = 'driver'
  );

-- Motoboy atualiza status enquanto entrega
create policy "orders_update_driver_progress" on public.orders
  for update to authenticated
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

------------------------------------------------------------------
-- 3) order_items: UPDATE só enquanto pedido pending
------------------------------------------------------------------
create policy "order_items_update_pending" on public.order_items
  for update to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_id = auth.uid()
        and o.status = 'pending'
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_id = auth.uid()
        and o.status = 'pending'
    )
  );

create policy "order_items_delete_pending" on public.order_items
  for delete to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_id = auth.uid()
        and o.status = 'pending'
    )
  );

------------------------------------------------------------------
-- 4) businesses: bloquear owner_id / is_verified / is_eco_certified
--    Owner pode editar o próprio negócio MAS não pode transferir
--    ownership ou auto-elevar selo. Admin segue podendo tudo.
------------------------------------------------------------------
create or replace function public.businesses_owner_update_locked()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if public.is_admin(auth.uid()) then
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id é imutável para o owner';
  end if;
  if new.is_verified is distinct from old.is_verified then
    raise exception 'is_verified só pode ser alterado pelo admin';
  end if;
  if new.is_eco_certified is distinct from old.is_eco_certified then
    raise exception 'is_eco_certified só pode ser alterado pelo admin';
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_owner_update_lock on public.businesses;
create trigger businesses_owner_update_lock
  before update on public.businesses
  for each row execute function public.businesses_owner_update_locked();

------------------------------------------------------------------
-- 5) ratings: UPDATE/DELETE pelo autor
------------------------------------------------------------------
create policy "ratings_update_own" on public.ratings
  for update to authenticated
  using (rated_by = auth.uid())
  with check (rated_by = auth.uid());

create policy "ratings_delete_own" on public.ratings
  for delete to authenticated
  using (rated_by = auth.uid());

-- 6) withdrawal_requests: cancelamento self-service depende de migração
--    posterior que adicione 'cancelled' ao enum withdrawal_status.
--    Hoje, cancelar fica restrito ao admin via withdrawals_admin_all.
