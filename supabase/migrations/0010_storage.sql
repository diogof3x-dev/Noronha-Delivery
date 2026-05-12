-- Buckets de Storage (logos, banners, fotos de serviço, fotos de avaliação, KYC)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('business-logos',    'business-logos',    true,  2097152,  array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('business-banners',  'business-banners',  true,  5242880,  array['image/png','image/jpeg','image/webp']),
  ('service-photos',    'service-photos',    true,  5242880,  array['image/png','image/jpeg','image/webp']),
  ('rating-photos',     'rating-photos',     true,  5242880,  array['image/png','image/jpeg','image/webp']),
  ('kyc-docs',          'kyc-docs',          false, 10485760, array['image/png','image/jpeg','application/pdf'])
on conflict (id) do nothing;

create policy "public_read_business_logos" on storage.objects for select using (bucket_id = 'business-logos');
create policy "public_read_business_banners" on storage.objects for select using (bucket_id = 'business-banners');
create policy "public_read_service_photos" on storage.objects for select using (bucket_id = 'service-photos');
create policy "public_read_rating_photos" on storage.objects for select using (bucket_id = 'rating-photos');

create policy "auth_upload_logos" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('business-logos','business-banners','service-photos','rating-photos'));

create policy "owner_manage_kyc" on storage.objects
  for all to authenticated
  using (bucket_id = 'kyc-docs' and owner = auth.uid())
  with check (bucket_id = 'kyc-docs' and owner = auth.uid());
