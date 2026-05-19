-- RLS Smoke Tests — Noronha Delivery
-- Validam que a migration 0014_rls_hardening está ativa e funcionando.
-- Rodar via supabase MCP execute_sql ou psql em ambiente de staging.
-- Cada bloco é IDEMPOTENTE e ROLLBACK-SAFE (não altera estado de prod).
--
-- Última execução: 2026-05-19 (todos passaram).

-- ============================================================
-- TESTE 1: função current_role() existe, é stable + security definer
-- e GRANT está correto (authenticated + service_role).
-- ============================================================
select
  proname,
  prosecdef as security_definer,
  provolatile as volatility,  -- esperado 's' (stable)
  proowner::regrole as owner,
  array_to_string(proacl::text[], ',') as acl
from pg_proc
where proname = 'current_role'
  and pronamespace = 'public'::regnamespace;
-- Esperado: 1 linha, security_definer=true, volatility='s',
--           acl com authenticated=X e service_role=X

-- ============================================================
-- TESTE 2: policy profiles_update_own tem with check de freeze do role.
-- ============================================================
select polname,
       pg_get_expr(polqual, polrelid) as using_clause,
       pg_get_expr(polwithcheck, polrelid) as with_check_clause
  from pg_policy
 where polrelid = 'public.profiles'::regclass
   and polname = 'profiles_update_own';
-- Esperado: with_check_clause contém '(role = "current_role"())'

-- ============================================================
-- TESTE 3: ataque de escalation/downgrade via update_own é REJEITADO.
-- Roda em transaction com rollback. NÃO altera nada.
-- A policy "profiles_manage_admin" (FOR ALL via is_admin) é o bypass
-- legítimo; pra isolar profiles_update_own, desabilita ela dentro do tx.
-- ============================================================
begin;

select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from public.profiles where role = 'admin' limit 1),
    'role', 'authenticated',
    'aud', 'authenticated'
  )::text,
  true
);

savepoint disable_admin_policy;
alter policy profiles_manage_admin on public.profiles using (false) with check (false);

set local role authenticated;

-- Tentativa de drift de role: admin tentando virar customer via update_own.
-- Esperado: ERROR 42501 "new row violates row-level security policy".
update public.profiles
   set role = 'customer'
 where id = auth.uid()
returning id, role;

-- Se chegou aqui, RLS FUROU. Rollback imediato.
reset role;
rollback to disable_admin_policy;
rollback;

-- ============================================================
-- TESTE 4: trigger businesses_owner_update_lock impede owner não-admin
-- de alterar owner_id / is_verified / is_eco_certified.
-- ============================================================
select tgname, tgenabled, pg_get_triggerdef(oid) as definition
  from pg_trigger
 where tgrelid = 'public.businesses'::regclass
   and tgname = 'businesses_owner_update_lock';
-- Esperado: 1 linha, tgenabled='O' (enabled)

-- ============================================================
-- TESTE 5: orders tem 4 UPDATE policies (customer_cancel, business,
-- driver_claim, driver_progress) + admin_all.
-- ============================================================
select polname
  from pg_policy
 where polrelid = 'public.orders'::regclass
   and polcmd = 'w'  -- 'w' = UPDATE em pg_policy
 order by polname;
-- Esperado: orders_admin_all, orders_update_business,
--           orders_update_customer_cancel, orders_update_driver_claim,
--           orders_update_driver_progress

-- ============================================================
-- TESTE 6: order_items + ratings têm UPDATE/DELETE controlado
-- ============================================================
select tablename, polname, polcmd
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  join (
    select c2.oid, c2.relname as tablename
      from pg_class c2 join pg_namespace n2 on n2.oid = c2.relnamespace
     where n2.nspname = 'public'
  ) t on t.oid = p.polrelid
 where n.nspname = 'public'
   and t.tablename in ('order_items', 'ratings')
   and polcmd in ('w', 'd')
 order by t.tablename, polcmd;
-- Esperado:
--   order_items | order_items_delete_pending  | d
--   order_items | order_items_update_pending  | w
--   ratings     | ratings_delete_own          | d
--   ratings     | ratings_reply_owner         | w
--   ratings     | ratings_update_own          | w
