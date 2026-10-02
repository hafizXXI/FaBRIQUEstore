insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('vendor-assets', 'vendor-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('rider-avatars', 'rider-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('vendor-verification', 'vendor-verification', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png']),
  ('rider-verification', 'rider-verification', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated;
grant execute on function storage.foldername(text) to anon, authenticated;
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

create policy published_product_images_public_read on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.products p
      where p.id::text = (storage.foldername(objects.name))[2]
        and p.vendor_id::text = (storage.foldername(objects.name))[1]
        and p.status = 'published'
    )
  );
create policy approved_vendor_assets_public_read on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'vendor-assets'
    and array_length(storage.foldername(objects.name), 1) = 1
    and (select private.is_approved_vendor((storage.foldername(objects.name))[1]))
  );
create policy approved_rider_avatars_public_read on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'rider-avatars'
    and array_length(storage.foldername(objects.name), 1) = 1
    and (select private.is_approved_rider((storage.foldername(objects.name))[1]))
  );

create policy product_images_vendor_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and array_length(storage.foldername(objects.name), 1) = 2
    and exists (
      select 1 from public.products p
      where p.id::text = (storage.foldername(objects.name))[2]
        and p.vendor_id::text = (storage.foldername(objects.name))[1]
        and (select private.owns_vendor(p.vendor_id))
    )
  );
create policy product_images_vendor_update on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.products p
      where p.id::text = (storage.foldername(objects.name))[2]
        and p.vendor_id::text = (storage.foldername(objects.name))[1]
        and (select private.owns_vendor(p.vendor_id))
    )
  )
  with check (
    bucket_id = 'product-images'
    and array_length(storage.foldername(objects.name), 1) = 2
    and exists (
      select 1 from public.products p
      where p.id::text = (storage.foldername(objects.name))[2]
        and p.vendor_id::text = (storage.foldername(objects.name))[1]
        and (select private.owns_vendor(p.vendor_id))
    )
  );
create policy product_images_vendor_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.products p
      where p.id::text = (storage.foldername(objects.name))[2]
        and p.vendor_id::text = (storage.foldername(objects.name))[1]
        and (select private.owns_vendor(p.vendor_id))
    )
  );

create policy vendor_assets_owner_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vendor-assets'
    and array_length(storage.foldername(objects.name), 1) = 1
    and (select private.owns_vendor((storage.foldername(objects.name))[1]))
  );
create policy vendor_assets_owner_update on storage.objects for update to authenticated
  using (
    bucket_id = 'vendor-assets'
    and (select private.owns_vendor((storage.foldername(objects.name))[1]))
  )
  with check (
    bucket_id = 'vendor-assets'
    and array_length(storage.foldername(objects.name), 1) = 1
    and (select private.owns_vendor((storage.foldername(objects.name))[1]))
  );
create policy vendor_assets_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'vendor-assets'
    and (select private.owns_vendor((storage.foldername(objects.name))[1]))
  );

create policy rider_avatars_owner_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'rider-avatars'
    and array_length(storage.foldername(objects.name), 1) = 1
    and exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(objects.name))[1]
        and r.profile_id = (select auth.uid())
    )
  );
create policy rider_avatars_owner_update on storage.objects for update to authenticated
  using (
    bucket_id = 'rider-avatars'
    and exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(objects.name))[1]
        and r.profile_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'rider-avatars'
    and array_length(storage.foldername(objects.name), 1) = 1
    and exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(objects.name))[1]
        and r.profile_id = (select auth.uid())
    )
  );
create policy rider_avatars_owner_read on storage.objects for select to authenticated
  using (
    bucket_id = 'rider-avatars'
    and exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(objects.name))[1]
        and r.profile_id = (select auth.uid())
    )
  );
create policy rider_avatars_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'rider-avatars'
    and exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(objects.name))[1]
        and r.profile_id = (select auth.uid())
    )
  );

create policy vendor_verification_owner_select on storage.objects for select to authenticated
  using (
    bucket_id = 'vendor-verification'
    and ((select private.owns_vendor((storage.foldername(objects.name))[1])) or (select private.is_admin()))
  );
create policy vendor_verification_owner_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'vendor-verification'
    and array_length(storage.foldername(objects.name), 1) = 1
    and (select private.owns_vendor((storage.foldername(objects.name))[1]))
  );
create policy vendor_verification_owner_update on storage.objects for update to authenticated
  using (
    bucket_id = 'vendor-verification'
    and ((select private.owns_vendor((storage.foldername(objects.name))[1])) or (select private.is_admin()))
  )
  with check (
    bucket_id = 'vendor-verification'
    and array_length(storage.foldername(objects.name), 1) = 1
    and ((select private.owns_vendor((storage.foldername(objects.name))[1])) or (select private.is_admin()))
  );
create policy vendor_verification_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'vendor-verification'
    and ((select private.owns_vendor((storage.foldername(objects.name))[1])) or (select private.is_admin()))
  );

create policy rider_verification_owner_select on storage.objects for select to authenticated
  using (
    bucket_id = 'rider-verification'
    and (
      exists (
        select 1 from public.riders r
        where r.id::text = (storage.foldername(objects.name))[1]
          and r.profile_id = (select auth.uid())
      )
      or (select private.is_admin())
    )
  );
create policy rider_verification_owner_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'rider-verification'
    and array_length(storage.foldername(objects.name), 1) = 1
    and exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(objects.name))[1]
        and r.profile_id = (select auth.uid())
    )
  );
create policy rider_verification_owner_update on storage.objects for update to authenticated
  using (
    bucket_id = 'rider-verification'
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'rider-verification'
    and array_length(storage.foldername(objects.name), 1) = 1
    and (select private.is_admin())
  );
create policy rider_verification_owner_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'rider-verification'
    and ((select private.is_admin()) or exists (
      select 1 from public.riders r
      where r.id::text = (storage.foldername(objects.name))[1]
        and r.profile_id = (select auth.uid())
    ))
  );
