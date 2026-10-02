create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.app_role as enum ('customer', 'vendor', 'rider', 'admin');
create type public.vendor_status as enum ('pending', 'under_review', 'approved', 'suspended', 'rejected');
create type public.rider_status as enum ('pending', 'approved', 'suspended');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.product_condition as enum ('new', 'old_stock', 'vintage', 'pre_owned', 'limited_stock');
create type public.product_status as enum ('draft', 'published', 'unpublished', 'out_of_stock', 'archived');
create type public.order_status as enum ('pending_payment', 'paid', 'processing', 'partially_fulfilled', 'out_for_delivery', 'completed', 'cancelled', 'refunded', 'partially_refunded');
create type public.vendor_order_status as enum ('new', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'completed', 'rejected', 'cancelled');
create type public.delivery_status as enum ('pending', 'assigned', 'accepted', 'en_route_to_vendor', 'at_vendor', 'picked_up', 'en_route_to_customer', 'at_customer', 'delivered', 'failed', 'cancelled');
create type public.payment_status as enum ('pending', 'processing', 'successful', 'failed', 'refunded', 'partially_refunded');
create type public.payment_provider as enum ('paystack', 'flutterwave');
create type public.financial_status as enum ('pending', 'processing', 'paid', 'failed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'customer',
  full_name text not null default '' check (char_length(full_name) <= 160),
  phone text check (phone is null or char_length(phone) <= 32),
  email text check (email is null or char_length(email) <= 320),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles (id) on delete restrict,
  store_name text not null check (char_length(store_name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 5000),
  logo_url text,
  cover_image_url text,
  phone text check (phone is null or char_length(phone) <= 32),
  email text check (email is null or char_length(email) <= 320),
  address text,
  city text,
  state text,
  postal_code text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  status public.vendor_status not null default 'pending',
  operating_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(operating_hours) = 'object'),
  offers_delivery boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendor_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  document_type text not null check (char_length(document_type) between 1 and 80),
  storage_path text not null unique,
  status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  review_note text check (review_note is null or char_length(review_note) <= 2000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.riders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete restrict,
  vehicle_type text not null check (char_length(vehicle_type) between 1 and 80),
  profile_photo_path text,
  status public.rider_status not null default 'pending',
  is_online boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rider_documents (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders (id) on delete restrict,
  document_type text not null check (char_length(document_type) between 1 and 80),
  storage_path text not null unique,
  status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  review_note text check (review_note is null or char_length(review_note) <= 2000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 10000),
  price numeric(12, 2) not null check (price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  unit text not null default 'yard' check (char_length(unit) between 1 and 32),
  color text check (color is null or char_length(color) <= 80),
  pattern text check (pattern is null or char_length(pattern) <= 120),
  condition public.product_condition not null default 'new',
  status public.product_status not null default 'draft',
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  storage_path text not null unique,
  alt_text text check (alt_text is null or char_length(alt_text) <= 300),
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  sku text,
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  price_adjustment numeric(12, 2) not null default 0,
  quantity integer not null default 0 check (quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, sku),
  check (price_adjustment >= 0)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  label text not null check (char_length(label) between 1 and 80),
  recipient_name text not null check (char_length(recipient_name) between 1 and 160),
  phone text not null check (char_length(phone) between 3 and 32),
  address text not null check (char_length(address) between 1 and 500),
  city text not null,
  state text not null,
  postal_code text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  instructions text check (instructions is null or char_length(instructions) <= 2000),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (cart_id, product_id, variant_id)
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  order_number text not null unique,
  status public.order_status not null default 'pending_payment',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(12, 2) not null check (total >= 0),
  currency char(3) not null default 'NGN',
  delivery_address_snapshot jsonb not null check (jsonb_typeof(delivery_address_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total = subtotal + delivery_fee),
  check (delivery_address_snapshot ?& array['recipient_name', 'phone', 'address', 'city', 'state']),
  unique (id, customer_id)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  unit text not null,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  check (subtotal = unit_price * quantity)
);

create table public.vendor_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  status public.vendor_order_status not null default 'new',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, vendor_id),
  unique (id, order_id),
  unique (id, vendor_id),
  unique (id, order_id, vendor_id)
);

create table public.vendor_order_items (
  id uuid primary key default gen_random_uuid(),
  vendor_order_id uuid not null,
  order_id uuid not null,
  vendor_id uuid not null,
  order_item_id uuid not null unique references public.order_items (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now(),
  foreign key (vendor_order_id, order_id, vendor_id)
    references public.vendor_orders (id, order_id, vendor_id) on delete restrict,
  check (subtotal = unit_price * quantity)
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  old_status public.order_status,
  new_status public.order_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create table public.vendor_order_status_history (
  id uuid primary key default gen_random_uuid(),
  vendor_order_id uuid not null references public.vendor_orders (id) on delete restrict,
  old_status public.vendor_order_status,
  new_status public.vendor_order_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  provider public.payment_provider not null,
  provider_reference text not null unique,
  amount numeric(12, 2) not null check (amount >= 0),
  currency char(3) not null default 'NGN',
  status public.payment_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (order_id, customer_id) references public.orders (id, customer_id) on delete restrict
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  vendor_order_id uuid not null,
  rider_id uuid references public.riders (id) on delete restrict,
  pickup_address_snapshot jsonb not null check (jsonb_typeof(pickup_address_snapshot) = 'object'),
  customer_address_snapshot jsonb not null check (jsonb_typeof(customer_address_snapshot) = 'object'),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  status public.delivery_status not null default 'pending',
  distance_km numeric(8, 2) check (distance_km is null or distance_km >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (vendor_order_id, order_id)
    references public.vendor_orders (id, order_id) on delete restrict,
  check (pickup_address_snapshot ?& array['address', 'city', 'state']),
  check (customer_address_snapshot ?& array['recipient_name', 'phone', 'address', 'city', 'state']),
  check (status <> 'assigned' or rider_id is not null),
  check (status <> 'pending' or rider_id is null)
);

create table public.delivery_status_history (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries (id) on delete restrict,
  old_status public.delivery_status,
  new_status public.delivery_status not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete restrict,
  order_item_id uuid references public.order_items (id) on delete restrict,
  vendor_order_id uuid references public.vendor_orders (id) on delete restrict,
  product_id uuid references public.products (id) on delete restrict,
  vendor_id uuid references public.vendors (id) on delete restrict,
  delivery_id uuid references public.deliveries (id) on delete restrict,
  product_rating smallint check (product_rating between 1 and 5),
  vendor_rating smallint check (vendor_rating between 1 and 5),
  delivery_rating smallint check (delivery_rating between 1 and 5),
  body text check (body is null or char_length(body) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (product_rating is not null or vendor_rating is not null or delivery_rating is not null),
  check ((product_rating is null) or (order_item_id is not null and product_id is not null)),
  check ((vendor_rating is null) or (vendor_order_id is not null and vendor_id is not null)),
  check ((delivery_rating is null) or delivery_id is not null)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  type text not null check (char_length(type) between 1 and 80),
  title text not null check (char_length(title) between 1 and 200),
  message text not null check (char_length(message) <= 2000),
  related_order_id uuid references public.orders (id) on delete set null,
  related_delivery_id uuid references public.deliveries (id) on delete set null,
  related_product_id uuid references public.products (id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  vendor_order_id uuid not null unique,
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  gross_amount numeric(12, 2) not null check (gross_amount >= 0),
  commission_amount numeric(12, 2) not null check (commission_amount >= 0),
  vendor_amount numeric(12, 2) not null check (vendor_amount >= 0),
  status public.financial_status not null default 'pending',
  created_at timestamptz not null default now(),
  foreign key (vendor_order_id, vendor_id)
    references public.vendor_orders (id, vendor_id) on delete restrict,
  check (gross_amount = commission_amount + vendor_amount)
);

create table public.vendor_payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  status public.financial_status not null default 'pending',
  reference text unique,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.rider_earnings (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references public.riders (id) on delete restrict,
  delivery_id uuid not null unique references public.deliveries (id) on delete restrict,
  amount numeric(12, 2) not null check (amount >= 0),
  status public.financial_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  singleton boolean primary key default true check (singleton),
  platform_name text not null default 'FaBRIQUE',
  currency char(3) not null default 'NGN',
  default_commission_rate numeric(5, 4) check (default_commission_rate is null or default_commission_rate between 0 and 1),
  minimum_order_value numeric(12, 2) not null default 0 check (minimum_order_value >= 0),
  delivery_settings jsonb not null default '{}'::jsonb check (jsonb_typeof(delivery_settings) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

comment on column public.platform_settings.delivery_settings is
  'Expected JSON object: default_fee, fee_per_km, max_delivery_km, and optional zone_overrides; monetary values use platform currency.';

create table public.featured_products (
  product_id uuid primary key references public.products (id) on delete restrict,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.featured_vendors (
  vendor_id uuid primary key references public.vendors (id) on delete restrict,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create function private.owns_vendor(target_vendor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.vendors v
    where v.id = target_vendor_id and v.owner_id = (select auth.uid())
  );
$$;

create function private.owns_rider(target_rider_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.riders r
    where r.id = target_rider_id and r.profile_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.owns_vendor(uuid) from public;
revoke all on function private.owns_rider(uuid) from public;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.owns_vendor(uuid) to authenticated;
grant execute on function private.owns_rider(uuid) to authenticated;

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 160)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create function public.guard_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = new.status then return new; end if;
  if new.status in ('paid', 'refunded', 'partially_refunded')
    and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'Payment state transitions require trusted server-side verification' using errcode = '42501';
  end if;
  if not (
    (old.status = 'pending_payment' and new.status in ('paid', 'cancelled')) or
    (old.status = 'paid' and new.status in ('processing', 'refunded')) or
    (old.status = 'processing' and new.status in ('partially_fulfilled', 'out_for_delivery', 'completed', 'cancelled')) or
    (old.status = 'partially_fulfilled' and new.status in ('out_for_delivery', 'completed', 'cancelled')) or
    (old.status = 'out_for_delivery' and new.status in ('completed', 'cancelled')) or
    (old.status = 'completed' and new.status in ('refunded', 'partially_refunded')) or
    (old.status = 'partially_refunded' and new.status = 'refunded')
  ) then
    raise exception 'Invalid order status transition: % -> %', old.status, new.status using errcode = '23514';
  end if;
  return new;
end;
$$;

create function public.guard_vendor_order_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = new.status then return new; end if;
  if old.status = 'picked_up' and new.status = 'completed'
    and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'Vendor completion follows verified delivery' using errcode = '42501';
  end if;
  if not (
    (old.status = 'new' and new.status in ('accepted', 'rejected', 'cancelled')) or
    (old.status = 'accepted' and new.status in ('preparing', 'cancelled')) or
    (old.status = 'preparing' and new.status in ('ready_for_pickup', 'cancelled')) or
    (old.status = 'ready_for_pickup' and new.status = 'picked_up') or
    (old.status = 'picked_up' and new.status = 'completed')
  ) then
    raise exception 'Invalid vendor order status transition: % -> %', old.status, new.status using errcode = '23514';
  end if;
  return new;
end;
$$;

create function public.guard_delivery_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = new.status then return new; end if;
  if not (
    (old.status = 'pending' and new.status in ('assigned', 'cancelled')) or
    (old.status = 'assigned' and new.status in ('accepted', 'cancelled')) or
    (old.status = 'accepted' and new.status in ('en_route_to_vendor', 'cancelled', 'failed')) or
    (old.status = 'en_route_to_vendor' and new.status in ('at_vendor', 'failed', 'cancelled')) or
    (old.status = 'at_vendor' and new.status in ('picked_up', 'failed')) or
    (old.status = 'picked_up' and new.status in ('en_route_to_customer', 'failed')) or
    (old.status = 'en_route_to_customer' and new.status in ('at_customer', 'failed')) or
    (old.status = 'at_customer' and new.status in ('delivered', 'failed'))
  ) then
    raise exception 'Invalid delivery status transition: % -> %', old.status, new.status using errcode = '23514';
  end if;
  return new;
end;
$$;

create function public.record_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.order_status_history (order_id, old_status, new_status, changed_by)
  values (new.id, case when tg_op = 'INSERT' then null else old.status end, new.status, auth.uid());
  return new;
end;
$$;

create function public.record_vendor_order_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.vendor_order_status_history (vendor_order_id, old_status, new_status, changed_by)
  values (new.id, case when tg_op = 'INSERT' then null else old.status end, new.status, auth.uid());
  return new;
end;
$$;

create function public.record_delivery_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.delivery_status_history (delivery_id, old_status, new_status, changed_by)
  values (new.id, case when tg_op = 'INSERT' then null else old.status end, new.status, auth.uid());
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger vendors_set_updated_at before update on public.vendors for each row execute function public.set_updated_at();
create trigger vendor_documents_set_updated_at before update on public.vendor_documents for each row execute function public.set_updated_at();
create trigger rider_documents_set_updated_at before update on public.rider_documents for each row execute function public.set_updated_at();
create trigger riders_set_updated_at before update on public.riders for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger addresses_set_updated_at before update on public.addresses for each row execute function public.set_updated_at();
create trigger carts_set_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
create trigger wishlists_set_updated_at before update on public.wishlists for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger vendor_orders_set_updated_at before update on public.vendor_orders for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger deliveries_set_updated_at before update on public.deliveries for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews for each row execute function public.set_updated_at();
create trigger platform_settings_set_updated_at before update on public.platform_settings for each row execute function public.set_updated_at();

create trigger orders_guard_status before update of status on public.orders for each row execute function public.guard_order_status_transition();
create trigger vendor_orders_guard_status before update of status on public.vendor_orders for each row execute function public.guard_vendor_order_status_transition();
create trigger deliveries_guard_status before update of status on public.deliveries for each row execute function public.guard_delivery_status_transition();

create trigger orders_record_status after insert or update of status on public.orders for each row execute function public.record_order_status();
create trigger vendor_orders_record_status after insert or update of status on public.vendor_orders for each row execute function public.record_vendor_order_status();
create trigger deliveries_record_status after insert or update of status on public.deliveries for each row execute function public.record_delivery_status();
