-- Carteira do usuário e do parceiro (saldo + extrato)
create table public.wallet_accounts (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  business_id   uuid references public.businesses(id) on delete cascade,
  balance_cents int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (owner_id, business_id)
);

create index wallet_accounts_owner_idx on public.wallet_accounts (owner_id);
create index wallet_accounts_business_idx on public.wallet_accounts (business_id) where business_id is not null;

create trigger wallet_accounts_touch_updated
  before update on public.wallet_accounts
  for each row execute function public.touch_updated_at();

create table public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.wallet_accounts(id) on delete cascade,
  type          wallet_tx_type not null,
  amount_cents  int not null,
  balance_after_cents int not null,
  order_id      uuid references public.orders(id),
  withdrawal_id uuid,
  description   text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index wallet_tx_account_idx on public.wallet_transactions (account_id, created_at desc);

create table public.withdrawal_requests (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.wallet_accounts(id) on delete restrict,
  business_id     uuid references public.businesses(id) on delete set null,
  requested_by    uuid not null references public.profiles(id),
  amount_cents    int not null check (amount_cents > 0),
  pix_key         text not null,
  pix_kind        text not null,
  status          withdrawal_status not null default 'requested',
  asaas_transfer_id text,
  rejection_reason text,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger withdrawals_touch_updated
  before update on public.withdrawal_requests
  for each row execute function public.touch_updated_at();

alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.withdrawal_requests enable row level security;

create policy "wallet_select_own" on public.wallet_accounts
  for select to authenticated
  using (
    owner_id = auth.uid()
    or (business_id is not null and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    ))
  );

create policy "wallet_tx_select_own" on public.wallet_transactions
  for select to authenticated
  using (
    exists (
      select 1 from public.wallet_accounts w
      where w.id = account_id
        and (w.owner_id = auth.uid()
          or (w.business_id is not null and exists (
            select 1 from public.businesses b
            where b.id = w.business_id and b.owner_id = auth.uid()
          )))
    )
  );

create policy "withdrawals_select_own" on public.withdrawal_requests
  for select to authenticated
  using (
    requested_by = auth.uid()
    or (business_id is not null and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    ))
  );

create policy "withdrawals_insert_own" on public.withdrawal_requests
  for insert to authenticated
  with check (requested_by = auth.uid());

create policy "wallet_admin_all" on public.wallet_accounts
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "wallet_tx_admin_all" on public.wallet_transactions
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "withdrawals_admin_all" on public.withdrawal_requests
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
