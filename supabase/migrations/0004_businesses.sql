-- Catálogo de categorias (espelha as 24 demandas do administrador)
create table public.categories (
  id          text primary key,
  label       text not null,
  group_id    text not null,
  icon        text,
  position    int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Negócios (multi-tenant: restaurantes, operadores, pousadas, locadoras, motoristas, prestadores)
create table public.businesses (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.profiles(id) on delete restrict,
  type                business_type not null,
  category_id         text references public.categories(id),
  name                text not null,
  slug                text unique,
  description         text,
  cnpj                text,
  whatsapp            text,
  email               text,
  district            text,
  address             text,
  geo                 jsonb,
  logo_url            text,
  cover_url           text,
  is_active           boolean not null default false,
  is_verified         boolean not null default false,
  is_eco_certified    boolean not null default false,
  opening_hours       jsonb not null default '{}'::jsonb,
  delivery_enabled    boolean not null default false,
  delivery_fee_cents  int,
  min_order_cents     int,
  avg_prep_minutes    int,
  payout_pix_key      text,
  payout_pix_kind     text,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index businesses_type_idx on public.businesses (type) where is_active;
create index businesses_category_idx on public.businesses (category_id) where is_active;
create index businesses_owner_idx on public.businesses (owner_id);
create index businesses_search_idx on public.businesses using gin (name gin_trgm_ops);

create trigger businesses_touch_updated
  before update on public.businesses
  for each row execute function public.touch_updated_at();

alter table public.businesses enable row level security;
alter table public.categories enable row level security;

create policy "categories_select_all" on public.categories
  for select to anon, authenticated using (true);

create policy "businesses_select_public" on public.businesses
  for select to anon, authenticated using (is_active = true);

create policy "businesses_manage_owner" on public.businesses
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "businesses_manage_admin" on public.businesses
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
