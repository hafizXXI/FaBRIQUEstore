create function private.owns_vendor(target_vendor_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.vendors v
    where v.id::text = target_vendor_id and v.owner_id = (select auth.uid())
  );
$$;

create function private.is_approved_vendor(target_vendor_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.vendors v
    where v.id::text = target_vendor_id and v.status = 'approved'
  );
$$;

create function private.is_approved_rider(target_rider_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.riders r
    where r.id::text = target_rider_id and r.status = 'approved'
  );
$$;

create function private.can_access_order(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (select 1 from public.orders o where o.id = target_order_id and o.customer_id = (select auth.uid()))
    or exists (
      select 1 from public.vendor_orders vo
      join public.vendors v on v.id = vo.vendor_id
      where vo.order_id = target_order_id and v.owner_id = (select auth.uid())
    );
$$;

create function private.can_access_order_item(target_order_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = target_order_item_id and o.customer_id = (select auth.uid())
    )
    or exists (
      select 1 from public.order_items oi
      join public.vendors v on v.id = oi.vendor_id
      where oi.id = target_order_item_id and v.owner_id = (select auth.uid())
    );
$$;

create function private.is_approved_vendor(target_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.vendors v
    where v.id = target_vendor_id and v.status = 'approved'
  );
$$;

create function private.is_approved_rider(target_rider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.riders r
    where r.id = target_rider_id and r.status = 'approved'
  );
$$;

create function private.can_access_vendor_order(target_vendor_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1 from public.vendor_orders vo
      join public.vendors v on v.id = vo.vendor_id
      where vo.id = target_vendor_order_id and v.owner_id = (select auth.uid())
    )
    or exists (
      select 1 from public.vendor_orders vo
      join public.orders o on o.id = vo.order_id
      where vo.id = target_vendor_order_id and o.customer_id = (select auth.uid())
    );
$$;

create function private.can_access_delivery(target_delivery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1 from public.deliveries d
      join public.riders r on r.id = d.rider_id
      where d.id = target_delivery_id and r.profile_id = (select auth.uid())
    )
    or exists (
      select 1 from public.deliveries d
      join public.orders o on o.id = d.order_id
      where d.id = target_delivery_id and o.customer_id = (select auth.uid())
    )
    or exists (
      select 1 from public.deliveries d
      join public.vendor_orders vo on vo.id = d.vendor_order_id
      join public.vendors v on v.id = vo.vendor_id
      where d.id = target_delivery_id and v.owner_id = (select auth.uid())
    );
$$;

revoke all on function private.can_access_order(uuid) from public, anon;
revoke all on function private.owns_vendor(text) from public, anon;
revoke all on function private.is_approved_vendor(text) from public, anon;
revoke all on function private.is_approved_rider(text) from public, anon;
revoke all on function private.can_access_order_item(uuid) from public, anon;
revoke all on function private.is_approved_vendor(uuid) from public, anon;
revoke all on function private.is_approved_rider(uuid) from public, anon;
revoke all on function private.can_access_vendor_order(uuid) from public, anon;
revoke all on function private.can_access_delivery(uuid) from public, anon;
grant execute on function private.can_access_order(uuid) to authenticated;
grant execute on function private.can_access_order_item(uuid) to authenticated;
grant execute on function private.is_approved_vendor(uuid) to anon, authenticated;
grant execute on function private.is_approved_rider(uuid) to anon, authenticated;
grant execute on function private.owns_vendor(text) to authenticated;
grant execute on function private.is_approved_vendor(text) to anon, authenticated;
grant execute on function private.is_approved_rider(text) to anon, authenticated;
grant execute on function private.can_access_vendor_order(uuid) to authenticated;
grant execute on function private.can_access_delivery(uuid) to authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.owns_vendor(uuid) to anon, authenticated;

create function private.guard_profile_role()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and current_user not in ('postgres', 'supabase_admin', 'service_role')
    and not private.is_admin() then
    raise exception 'Only a provisioned admin may change application roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

create function private.guard_vendor_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (new.owner_id is distinct from old.owner_id or new.status is distinct from old.status)
    and current_user not in ('postgres', 'supabase_admin', 'service_role')
    and not private.is_admin() then
    raise exception 'Only a provisioned admin may change vendor ownership or status' using errcode = '42501';
  end if;
  return new;
end;
$$;

create function private.guard_rider_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (new.profile_id is distinct from old.profile_id or new.status is distinct from old.status)
    and current_user not in ('postgres', 'supabase_admin', 'service_role')
    and not private.is_admin() then
    raise exception 'Only a provisioned admin may change rider identity or status' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_profile_role() from public, anon, authenticated;
revoke all on function private.guard_vendor_identity() from public, anon, authenticated;
revoke all on function private.guard_rider_identity() from public, anon, authenticated;
create trigger profiles_guard_role before update of role on public.profiles for each row execute function private.guard_profile_role();
create trigger vendors_guard_identity before update of owner_id, status on public.vendors for each row execute function private.guard_vendor_identity();
create trigger riders_guard_identity before update of profile_id, status on public.riders for each row execute function private.guard_rider_identity();

create view public.marketplace_vendors with (security_barrier = true) as
select id, store_name, slug, description, logo_url, cover_image_url, city, state,
       operating_hours, offers_delivery, created_at
from public.vendors
where status = 'approved';

create view public.marketplace_reviews with (security_barrier = true) as
select r.id, r.product_id, r.vendor_id, r.product_rating, r.vendor_rating,
       r.delivery_rating, r.body, r.created_at
from public.reviews r
where
  (r.product_id is not null and exists (
    select 1 from public.products p join public.vendors v on v.id = p.vendor_id
    where p.id = r.product_id and p.status = 'published' and v.status = 'approved'
  ))
  or (r.vendor_id is not null and exists (
    select 1 from public.vendors v where v.id = r.vendor_id and v.status = 'approved'
  ) and (r.product_id is null or exists (
    select 1 from public.products p join public.vendors v on v.id = p.vendor_id
    where p.id = r.product_id and p.status = 'published' and v.status = 'approved'
  )));

create view public.vendor_fulfillment_orders with (security_barrier = true) as
select vo.id as vendor_order_id, vo.order_id, vo.vendor_id, o.order_number,
       vo.status as vendor_order_status, vo.subtotal, vo.delivery_fee,
       o.status as customer_order_status,
       o.delivery_address_snapshot ->> 'recipient_name' as recipient_name,
       o.delivery_address_snapshot ->> 'phone' as recipient_phone,
       o.delivery_address_snapshot ->> 'address' as delivery_address,
       o.delivery_address_snapshot ->> 'city' as delivery_city,
       o.delivery_address_snapshot ->> 'state' as delivery_state,
       o.delivery_address_snapshot ->> 'postal_code' as delivery_postal_code,
       o.delivery_address_snapshot ->> 'instructions' as delivery_instructions,
       vo.created_at
from public.vendor_orders vo
join public.orders o on o.id = vo.order_id
where (select private.owns_vendor(vo.vendor_id)) or (select private.is_admin());

grant usage on schema public to anon, authenticated;
grant usage on schema private to anon;
revoke all on all tables in schema public from public, anon, authenticated;

grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant select on public.marketplace_vendors, public.marketplace_reviews to anon, authenticated;
grant select on public.vendor_fulfillment_orders to authenticated;
grant select on public.vendors, public.vendor_documents, public.riders to authenticated;
grant select on public.profiles, public.addresses, public.carts, public.cart_items,
  public.wishlists, public.wishlist_items, public.orders, public.order_items,
  public.vendor_orders, public.vendor_order_items, public.order_status_history,
  public.vendor_order_status_history, public.payments, public.deliveries,
  public.delivery_status_history, public.reviews, public.notifications,
  public.commissions, public.vendor_payouts, public.rider_earnings,
  public.rider_documents,
  public.platform_settings, public.featured_products, public.featured_vendors
  to authenticated;

grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant insert on public.vendors to authenticated;
grant update (store_name, slug, description, logo_url, cover_image_url, phone, email,
  address, city, state, postal_code, latitude, longitude, operating_hours, offers_delivery,
  owner_id, status)
  on public.vendors to authenticated;
grant insert on public.vendor_documents to authenticated;
grant update (status, reviewed_by, review_note, reviewed_at) on public.vendor_documents to authenticated;
grant insert on public.riders to authenticated;
grant update (vehicle_type, profile_photo_path, is_online, status) on public.riders to authenticated;
grant insert on public.rider_documents to authenticated;
grant update (status, reviewed_by, review_note, reviewed_at) on public.rider_documents to authenticated;
grant insert on public.products to authenticated;
grant update (category_id, name, slug, description, price, quantity, unit, color,
  pattern, condition, status, location) on public.products to authenticated;
grant insert, update, delete on public.product_images, public.product_variants to authenticated;
grant insert, update, delete on public.addresses to authenticated;
grant insert, update on public.carts to authenticated;
grant insert, update, delete on public.cart_items to authenticated;
grant insert, update on public.wishlists to authenticated;
grant insert, delete on public.wishlist_items to authenticated;
grant update (status) on public.vendor_orders to authenticated;
grant update (is_read) on public.notifications to authenticated;
grant insert on public.reviews to authenticated;
grant update (product_rating, vendor_rating, delivery_rating, body) on public.reviews to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant update (status) on public.orders to authenticated;
grant update (status, rider_id, assigned_at) on public.deliveries to authenticated;
grant insert, update, delete on public.featured_products, public.featured_vendors to authenticated;
grant update on public.platform_settings to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_documents enable row level security;
alter table public.riders enable row level security;
alter table public.rider_documents enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.vendor_orders enable row level security;
alter table public.vendor_order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.vendor_order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_status_history enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.commissions enable row level security;
alter table public.vendor_payouts enable row level security;
alter table public.rider_earnings enable row level security;
alter table public.platform_settings enable row level security;
alter table public.featured_products enable row level security;
alter table public.featured_vendors enable row level security;

create policy profiles_select_self_or_admin on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_self_or_admin on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()))
  with check (id = (select auth.uid()) or (select private.is_admin()));

create policy vendors_select_owner_or_admin on public.vendors for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));
create policy vendors_insert_pending_owner on public.vendors for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'pending');
create policy vendors_update_owner_or_admin on public.vendors for update to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()))
  with check (owner_id = (select auth.uid()) or (select private.is_admin()));

create policy vendor_documents_select_owner_or_admin on public.vendor_documents for select to authenticated
  using ((select private.owns_vendor(vendor_id)) or (select private.is_admin()));
create policy vendor_documents_insert_pending_owner on public.vendor_documents for insert to authenticated
  with check ((select private.owns_vendor(vendor_id)) and status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy vendor_documents_admin_update on public.vendor_documents for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy rider_documents_select_owner_or_admin on public.rider_documents for select to authenticated
  using (exists (select 1 from public.riders r where r.id = rider_id and r.profile_id = (select auth.uid())) or (select private.is_admin()));
create policy rider_documents_insert_pending_owner on public.rider_documents for insert to authenticated
  with check (exists (select 1 from public.riders r where r.id = rider_id and r.profile_id = (select auth.uid())) and status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy rider_documents_admin_update on public.rider_documents for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy riders_select_self_or_admin on public.riders for select to authenticated
  using (profile_id = (select auth.uid()) or (select private.is_admin()));
create policy riders_insert_pending_self on public.riders for insert to authenticated
  with check (profile_id = (select auth.uid()) and status = 'pending' and not is_online);
create policy riders_update_self_or_admin on public.riders for update to authenticated
  using (profile_id = (select auth.uid()) or (select private.is_admin()))
  with check ((profile_id = (select auth.uid()) and (status = 'approved' or not is_online)) or (select private.is_admin()));

create policy categories_public_read on public.categories for select to anon, authenticated
  using (is_active or (select private.is_admin()));
create policy categories_admin_insert on public.categories for insert to authenticated
  with check ((select private.is_admin()));
create policy categories_admin_update on public.categories for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy categories_admin_delete on public.categories for delete to authenticated
  using ((select private.is_admin()));

create policy products_public_or_owner_read on public.products for select to anon, authenticated
  using (
    (status = 'published' and (select private.is_approved_vendor(vendor_id)))
    or (select private.owns_vendor(vendor_id))
    or (select private.is_admin())
  );
create policy products_owner_insert on public.products for insert to authenticated
  with check ((select private.owns_vendor(vendor_id)) and status = 'draft');
create policy products_owner_or_admin_update on public.products for update to authenticated
  using ((select private.owns_vendor(vendor_id)) or (select private.is_admin()))
  with check (
    ((select private.owns_vendor(vendor_id)) and (
      status not in ('published', 'out_of_stock') or (select private.is_approved_vendor(vendor_id))
    ))
    or (select private.is_admin())
  );

create policy product_images_public_or_owner_read on public.product_images for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'published'
      and (select private.is_approved_vendor(p.vendor_id)))
    or exists (select 1 from public.products p where p.id = product_id and (select private.owns_vendor(p.vendor_id)))
    or (select private.is_admin())
  );
create policy product_images_owner_insert on public.product_images for insert to authenticated
  with check (exists (select 1 from public.products p where p.id = product_id and (select private.owns_vendor(p.vendor_id))));
create policy product_images_owner_update on public.product_images for update to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (select private.owns_vendor(p.vendor_id))) or (select private.is_admin()))
  with check (exists (select 1 from public.products p where p.id = product_id and ((select private.owns_vendor(p.vendor_id)) or (select private.is_admin()))));
create policy product_images_owner_delete on public.product_images for delete to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and ((select private.owns_vendor(p.vendor_id)) or (select private.is_admin()))));

create policy product_variants_public_or_owner_read on public.product_variants for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.products p where p.id = product_id
      and p.status = 'published' and (select private.is_approved_vendor(p.vendor_id))))
    or exists (select 1 from public.products p where p.id = product_id and (select private.owns_vendor(p.vendor_id)))
    or (select private.is_admin())
  );
create policy product_variants_owner_insert on public.product_variants for insert to authenticated
  with check (exists (select 1 from public.products p where p.id = product_id and (select private.owns_vendor(p.vendor_id))));
create policy product_variants_owner_update on public.product_variants for update to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and (select private.owns_vendor(p.vendor_id))) or (select private.is_admin()))
  with check (exists (select 1 from public.products p where p.id = product_id and ((select private.owns_vendor(p.vendor_id)) or (select private.is_admin()))));
create policy product_variants_owner_delete on public.product_variants for delete to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and ((select private.owns_vendor(p.vendor_id)) or (select private.is_admin()))));

create policy addresses_owner_all on public.addresses for all to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));
create policy carts_owner_all on public.carts for all to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));
create policy cart_items_owner_all on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())) or (select private.is_admin()))
  with check (
    (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())) or (select private.is_admin()))
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
        and (select private.is_approved_vendor(p.vendor_id))
    )
    and (variant_id is null or exists (select 1 from public.product_variants pv where pv.id = variant_id and pv.product_id = product_id and pv.is_active))
  );
create policy wishlists_owner_all on public.wishlists for all to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));
create policy wishlist_items_owner_all on public.wishlist_items for all to authenticated
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = (select auth.uid())) or (select private.is_admin()))
  with check (
    (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = (select auth.uid())) or (select private.is_admin()))
    and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
  );

create policy orders_customer_or_admin_read on public.orders for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));
create policy orders_admin_update on public.orders for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy order_items_order_participant_read on public.order_items for select to authenticated
  using ((select private.can_access_order_item(id)));

create policy vendor_orders_participant_read on public.vendor_orders for select to authenticated
  using ((select private.can_access_vendor_order(id)));
create policy vendor_orders_owner_or_admin_update on public.vendor_orders for update to authenticated
  using ((select private.owns_vendor(vendor_id)) or (select private.is_admin()))
  with check ((select private.owns_vendor(vendor_id)) or (select private.is_admin()));
create policy vendor_order_items_participant_read on public.vendor_order_items for select to authenticated
  using ((select private.can_access_vendor_order(vendor_order_id)));
create policy order_history_participant_read on public.order_status_history for select to authenticated
  using ((select private.can_access_order(order_id)));
create policy vendor_order_history_participant_read on public.vendor_order_status_history for select to authenticated
  using ((select private.can_access_vendor_order(vendor_order_id)));

create policy payments_customer_or_admin_read on public.payments for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));

create policy deliveries_participant_read on public.deliveries for select to authenticated
  using ((select private.can_access_delivery(id)));
create policy deliveries_assigned_rider_update on public.deliveries for update to authenticated
  using (rider_id is not null and (select private.owns_rider(rider_id)))
  with check (rider_id is not null and (select private.owns_rider(rider_id)));
create policy deliveries_admin_update on public.deliveries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy delivery_history_participant_read on public.delivery_status_history for select to authenticated
  using ((select private.can_access_delivery(delivery_id)));

create policy reviews_owner_read on public.reviews for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_admin()));
create policy reviews_completed_order_insert on public.reviews for insert to authenticated
  with check (customer_id = (select auth.uid()));
create policy reviews_owner_update on public.reviews for update to authenticated
  using (customer_id = (select auth.uid())) with check (customer_id = (select auth.uid()));

grant select on public.marketplace_vendors, public.marketplace_reviews to anon, authenticated;

create policy notifications_owner_read on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy notifications_owner_mark_read on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy commissions_vendor_or_admin_read on public.commissions for select to authenticated
  using ((select private.owns_vendor(vendor_id)) or (select private.is_admin()));
create policy vendor_payouts_vendor_or_admin_read on public.vendor_payouts for select to authenticated
  using ((select private.owns_vendor(vendor_id)) or (select private.is_admin()));
create policy rider_earnings_rider_or_admin_read on public.rider_earnings for select to authenticated
  using (exists (select 1 from public.riders r where r.id = rider_id and r.profile_id = (select auth.uid())) or (select private.is_admin()));

create policy platform_settings_admin_read on public.platform_settings for select to authenticated
  using ((select private.is_admin()));
create policy platform_settings_admin_update on public.platform_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy featured_products_public_read on public.featured_products for select to anon, authenticated
  using (
    (active and exists (select 1 from public.products p where p.id = product_id
      and p.status = 'published' and (select private.is_approved_vendor(p.vendor_id))))
    or (select private.is_admin())
  );
create policy featured_products_admin_all on public.featured_products for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy featured_vendors_public_read on public.featured_vendors for select to anon, authenticated
  using ((active and (select private.is_approved_vendor(vendor_id))) or (select private.is_admin()));
create policy featured_vendors_admin_all on public.featured_vendors for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
