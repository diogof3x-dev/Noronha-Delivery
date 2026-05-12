-- Itens vendáveis: prato, passeio, veículo, quarto, ingresso, serviço
create table public.services (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  kind            service_kind not null,
  name            text not null,
  description     text,
  price_cents     int not null check (price_cents >= 0),
  image_url       text,
  position        int not null default 0,
  is_active       boolean not null default true,
  stock           int,
  duration_minutes int,
  capacity         int,
  meta            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index services_business_idx on public.services (business_id) where is_active;
create index services_kind_idx on public.services (kind) where is_active;
create index services_search_idx on public.services using gin (name gin_trgm_ops);

create trigger services_touch_updated
  before update on public.services
  for each row execute function public.touch_updated_at();

alter table public.services enable row level security;

create policy "services_select_public" on public.services
  for select to anon, authenticated using (is_active = true);

create policy "services_manage_owner" on public.services
  for all to authenticated
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
