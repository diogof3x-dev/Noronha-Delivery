-- Avaliação universal (1 por pedido, polimórfica sobre business/driver/service)
create table public.ratings (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  business_id     uuid references public.businesses(id) on delete set null,
  service_id      uuid references public.services(id) on delete set null,
  rated_entity    rated_entity_kind not null,
  rated_entity_id uuid not null,
  rated_by        uuid not null references public.profiles(id) on delete cascade,
  stars           int not null check (stars between 1 and 5),
  tags            text[] not null default '{}',
  comment         text,
  photo_urls      text[] not null default '{}',
  reply           text,
  reply_at        timestamptz,
  flagged         boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (order_id, rated_entity)
);

create index ratings_business_idx on public.ratings (business_id) where business_id is not null;
create index ratings_service_idx on public.ratings (service_id) where service_id is not null;
create index ratings_entity_idx on public.ratings (rated_entity, rated_entity_id);
create index ratings_user_idx on public.ratings (rated_by, created_at desc);

alter table public.ratings enable row level security;

create policy "ratings_select_public" on public.ratings
  for select to anon, authenticated using (true);

create policy "ratings_insert_own_order" on public.ratings
  for insert to authenticated
  with check (
    rated_by = auth.uid()
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.customer_id = auth.uid()
        and o.status in ('delivered', 'completed')
    )
  );

create policy "ratings_reply_owner" on public.ratings
  for update to authenticated
  using (
    business_id is not null
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    business_id is not null
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- Score público com média bayesiana (m=10, prior=4.0) — evita item novo dominar
create materialized view public.business_scores as
select
  business_id,
  count(*)::int as total_reviews,
  (avg(stars))::numeric(3,2) as avg_stars,
  ((count(*) * avg(stars) + 10 * 4.0) / (count(*) + 10))::numeric(3,2) as bayesian_score
from public.ratings
where business_id is not null
group by business_id;

create unique index business_scores_pk on public.business_scores (business_id);

create or replace function public.refresh_business_scores()
returns trigger language plpgsql security definer as $$
begin
  refresh materialized view concurrently public.business_scores;
  return null;
end;
$$;

create trigger ratings_refresh_scores
  after insert or update or delete on public.ratings
  for each statement execute function public.refresh_business_scores();
