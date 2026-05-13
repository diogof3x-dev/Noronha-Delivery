-- Configuração singleton da plataforma (take rate default + janela D+N)
create table public.platform_settings (
  id                    int primary key default 1 check (id = 1),
  default_take_rate_bps int not null default 1000 check (default_take_rate_bps between 0 and 10000),
  d_plus_days           int not null default 8 check (d_plus_days >= 0 and d_plus_days <= 60),
  updated_at            timestamptz not null default now()
);
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

-- Campanhas que sobrescrevem a taxa em janelas temporais
create table public.take_rate_campaigns (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  notes         text,
  take_rate_bps int not null check (take_rate_bps between 0 and 10000),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null check (ends_at > starts_at),
  applies_to    text not null default 'all' check (applies_to in ('all','category','business')),
  applies_id    text,
  priority      int not null default 0,
  is_active     boolean not null default true,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
create index take_rate_campaigns_window_idx on public.take_rate_campaigns (starts_at, ends_at) where is_active;
create index take_rate_campaigns_applies_idx on public.take_rate_campaigns (applies_to, applies_id) where is_active;

-- Resolve a taxa efetiva (em basis points) pra um pedido no instante atual
create or replace function public.effective_take_rate_bps(
  p_business_id uuid,
  p_category_id text
) returns int
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with picked as (
    select take_rate_bps
    from public.take_rate_campaigns
    where is_active = true
      and now() between starts_at and ends_at
      and (
        applies_to = 'all'
        or (applies_to = 'business' and applies_id = p_business_id::text)
        or (applies_to = 'category' and applies_id = p_category_id)
      )
    order by priority desc, take_rate_bps asc
    limit 1
  )
  select coalesce(
    (select take_rate_bps from picked),
    (select default_take_rate_bps from public.platform_settings where id = 1),
    1000
  )::int;
$$;
revoke execute on function public.effective_take_rate_bps(uuid, text) from anon, authenticated;
grant execute on function public.effective_take_rate_bps(uuid, text) to service_role;

alter table public.platform_settings  enable row level security;
alter table public.take_rate_campaigns enable row level security;

create policy "platform_settings_select_all" on public.platform_settings
  for select to anon, authenticated using (true);
create policy "platform_settings_update_admin" on public.platform_settings
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "take_rate_campaigns_select_all" on public.take_rate_campaigns
  for select to anon, authenticated using (true);
create policy "take_rate_campaigns_manage_admin" on public.take_rate_campaigns
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Trigger pra updated_at em platform_settings
create trigger platform_settings_touch_updated
  before update on public.platform_settings
  for each row execute function public.touch_updated_at();
