-- Hardening: search_path explícito + revogar EXECUTE de SECURITY DEFINER + remover
-- listagem ampla nos buckets públicos (URLs ainda funcionam, listagem do diretório não)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.refresh_business_scores()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  refresh materialized view concurrently public.business_scores;
  return null;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.refresh_business_scores() from anon, authenticated;

drop policy if exists "public_read_business_logos"   on storage.objects;
drop policy if exists "public_read_business_banners" on storage.objects;
drop policy if exists "public_read_service_photos"   on storage.objects;
drop policy if exists "public_read_rating_photos"    on storage.objects;
