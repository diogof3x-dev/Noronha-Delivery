-- Leads da landing (waitlist + pré-cadastros)
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  type        lead_type not null,
  name        text not null,
  whatsapp    text not null,
  email       text,
  payload     jsonb not null default '{}'::jsonb,
  contacted   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index leads_type_idx on public.leads (type);
create index leads_created_idx on public.leads (created_at desc);
create index leads_whatsapp_idx on public.leads (whatsapp);

alter table public.leads enable row level security;

create policy "leads_insert_anon" on public.leads
  for insert to anon, authenticated
  with check (true);

create policy "leads_select_admin" on public.leads
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
