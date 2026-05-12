-- Pedidos polimórficos
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null default ('ND' || to_char(now(),'YYMMDD') || lpad(floor(random()*100000)::text, 5, '0')),
  customer_id       uuid not null references public.profiles(id) on delete restrict,
  business_id       uuid not null references public.businesses(id) on delete restrict,
  driver_id         uuid references public.profiles(id),
  status            order_status not null default 'pending',
  subtotal_cents    int not null,
  delivery_fee_cents int not null default 0,
  discount_cents    int not null default 0,
  total_cents       int not null,
  platform_fee_cents int not null default 0,
  destination_kind  text,
  destination_label text,
  destination_geo   jsonb,
  destination_notes text,
  payment_method    payment_method not null,
  payment_status    payment_status not null default 'pending',
  payment_id        text,
  coupon_code       text,
  scheduled_for     timestamptz,
  placed_at         timestamptz,
  confirmed_at      timestamptz,
  ready_at          timestamptz,
  delivered_at      timestamptz,
  cancelled_at      timestamptz,
  cancellation_reason text,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index orders_customer_idx on public.orders (customer_id, created_at desc);
create index orders_business_idx on public.orders (business_id, created_at desc);
create index orders_driver_idx on public.orders (driver_id, created_at desc) where driver_id is not null;
create index orders_status_idx on public.orders (status);

create trigger orders_touch_updated
  before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  service_id      uuid not null references public.services(id),
  name_snapshot   text not null,
  quantity        int not null check (quantity > 0),
  unit_price_cents int not null,
  total_cents     int not null,
  notes           text,
  customizations  jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "orders_select_customer" on public.orders
  for select to authenticated
  using (customer_id = auth.uid());

create policy "orders_select_business" on public.orders
  for select to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

create policy "orders_select_driver" on public.orders
  for select to authenticated
  using (driver_id = auth.uid());

create policy "orders_insert_customer" on public.orders
  for insert to authenticated
  with check (customer_id = auth.uid());

create policy "orders_admin_all" on public.orders
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "order_items_select_via_order" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.customer_id = auth.uid()
          or o.driver_id = auth.uid()
          or exists (
            select 1 from public.businesses b
            where b.id = o.business_id and b.owner_id = auth.uid()
          )
        )
    )
  );

create policy "order_items_insert_via_order" on public.order_items
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = auth.uid()
    )
  );
