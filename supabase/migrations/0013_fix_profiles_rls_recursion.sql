-- Fix: 'infinite recursion detected in policy for relation profiles'
-- A policy admin de profiles fazia EXISTS(SELECT FROM profiles ...) que
-- disparava as próprias policies de SELECT em profiles → loop infinito.

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = uid),
    false
  );
$$;

revoke execute on function public.is_admin(uuid) from anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using (public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_manage_admin" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "businesses_manage_admin" on public.businesses;
create policy "businesses_manage_admin" on public.businesses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "leads_select_admin" on public.leads;
create policy "leads_select_admin" on public.leads
  for select to authenticated
  using (public.is_admin());

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "wallet_admin_all" on public.wallet_accounts;
create policy "wallet_admin_all" on public.wallet_accounts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "wallet_tx_admin_all" on public.wallet_transactions;
create policy "wallet_tx_admin_all" on public.wallet_transactions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "withdrawals_admin_all" on public.withdrawal_requests;
create policy "withdrawals_admin_all" on public.withdrawal_requests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
