alter table public.products
  add column search_document tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(color, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(pattern, '')), 'C')
  ) stored;

create index products_search_document_idx on public.products using gin (search_document);
create index products_public_listing_idx on public.products (created_at desc) where status = 'published';
create index products_vendor_status_idx on public.products (vendor_id, status, created_at desc);
create index products_category_status_idx on public.products (category_id, created_at desc) where status = 'published';
create index products_price_idx on public.products (price) where status = 'published';
create index products_condition_idx on public.products (condition) where status = 'published';
create index vendors_status_idx on public.vendors (status);
create index vendor_documents_vendor_status_idx on public.vendor_documents (vendor_id, status);
create index rider_documents_rider_status_idx on public.rider_documents (rider_id, status);
create index riders_status_online_idx on public.riders (status, is_online);
create index product_images_product_order_idx on public.product_images (product_id, sort_order);
create unique index product_images_one_primary_idx on public.product_images (product_id) where is_primary;
create index product_variants_product_active_idx on public.product_variants (product_id) where is_active;
create index addresses_user_idx on public.addresses (user_id);
create unique index addresses_one_default_per_user_idx on public.addresses (user_id) where is_default;
create index cart_items_cart_idx on public.cart_items (cart_id);
create index wishlist_items_wishlist_idx on public.wishlist_items (wishlist_id);
create index orders_customer_created_idx on public.orders (customer_id, created_at desc);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_vendor_idx on public.order_items (vendor_id, created_at desc);
create index vendor_orders_vendor_status_idx on public.vendor_orders (vendor_id, status, created_at desc);
create index vendor_order_items_vendor_order_idx on public.vendor_order_items (vendor_order_id);
create index order_status_history_order_created_idx on public.order_status_history (order_id, created_at);
create index vendor_order_status_history_vendor_order_created_idx on public.vendor_order_status_history (vendor_order_id, created_at);
create index payments_customer_created_idx on public.payments (customer_id, created_at desc);
create index payments_order_status_idx on public.payments (order_id, status);
create index deliveries_rider_status_idx on public.deliveries (rider_id, status);
create index deliveries_order_status_idx on public.deliveries (order_id, status);
create index deliveries_vendor_order_idx on public.deliveries (vendor_order_id);
create index delivery_status_history_delivery_created_idx on public.delivery_status_history (delivery_id, created_at);
create index reviews_product_created_idx on public.reviews (product_id, created_at desc) where product_rating is not null;
create index reviews_vendor_created_idx on public.reviews (vendor_id, created_at desc) where vendor_rating is not null;
create index reviews_delivery_created_idx on public.reviews (delivery_id, created_at desc) where delivery_rating is not null;
create unique index reviews_one_product_review_idx on public.reviews (customer_id, order_item_id) where product_rating is not null;
create unique index reviews_one_vendor_review_idx on public.reviews (customer_id, vendor_order_id) where vendor_rating is not null;
create unique index reviews_one_delivery_review_idx on public.reviews (customer_id, delivery_id) where delivery_rating is not null;
create index notifications_user_unread_created_idx on public.notifications (user_id, created_at desc) where not is_read;
create index commissions_vendor_status_created_idx on public.commissions (vendor_id, status, created_at desc);
create index vendor_payouts_vendor_status_created_idx on public.vendor_payouts (vendor_id, status, created_at desc);
create index rider_earnings_rider_status_created_idx on public.rider_earnings (rider_id, status, created_at desc);
create index featured_products_active_order_idx on public.featured_products (sort_order) where active;
create index featured_vendors_active_order_idx on public.featured_vendors (sort_order) where active;

create function private.guard_delivery_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_rider_status public.rider_status;
  assigned_rider_online boolean;
begin
  if new.rider_id is null then
    if new.status = 'assigned' then
      raise exception 'Assigned deliveries require an approved online rider' using errcode = '23514';
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' or old.rider_id is distinct from new.rider_id
    or (old.status is distinct from new.status and new.status = 'assigned') then
    select r.status, r.is_online into assigned_rider_status, assigned_rider_online
      from public.riders r where r.id = new.rider_id;
    if not found or assigned_rider_status <> 'approved' or not assigned_rider_online then
      raise exception 'Deliveries may only be assigned to approved online riders' using errcode = '23514';
    end if;
    new.assigned_at := coalesce(new.assigned_at, now());
  end if;
  return new;
end;
$$;

revoke all on function private.guard_delivery_assignment() from public, anon, authenticated;
create trigger deliveries_guard_assignment before insert or update of rider_id, status on public.deliveries
  for each row execute function private.guard_delivery_assignment();

create function private.validate_vendor_order_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected record;
begin
  select oi.order_id, oi.vendor_id, oi.product_id, oi.quantity, oi.unit_price, oi.subtotal
    into expected
    from public.order_items oi
    where oi.id = new.order_item_id;

  if not found or expected.order_id <> new.order_id or expected.vendor_id <> new.vendor_id
    or expected.product_id <> new.product_id or expected.quantity <> new.quantity
    or expected.unit_price <> new.unit_price or expected.subtotal <> new.subtotal then
    raise exception 'Vendor order item must match its parent order item' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger vendor_order_items_validate
  before insert or update on public.vendor_order_items
  for each row execute function private.validate_vendor_order_item();

create function private.validate_order_item_product()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  product_vendor_id uuid;
  variant_product_id uuid;
  variant_is_active boolean;
begin
  select p.vendor_id into product_vendor_id
    from public.products p where p.id = new.product_id;
  if not found or product_vendor_id <> new.vendor_id then
    raise exception 'Order item vendor must match the product vendor' using errcode = '23514';
  end if;

  if new.variant_id is not null then
    select pv.product_id, pv.is_active into variant_product_id, variant_is_active
      from public.product_variants pv where pv.id = new.variant_id;
    if not found or variant_product_id <> new.product_id or not variant_is_active then
      raise exception 'Order item variant must be active and belong to its product' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger order_items_product_consistency
  before insert or update on public.order_items
  for each row execute function private.validate_order_item_product();

create function private.assert_order_subtotal(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_subtotal numeric(12, 2);
  expected_delivery_fee numeric(12, 2);
  item_subtotal numeric(14, 2);
  vendor_subtotal numeric(14, 2);
  allocated_delivery_fee numeric(14, 2);
begin
  select o.subtotal, o.delivery_fee into expected_subtotal, expected_delivery_fee
    from public.orders o where o.id = target_order_id;
  if not found then return; end if;

  select coalesce(sum(oi.subtotal), 0) into item_subtotal
    from public.order_items oi where oi.order_id = target_order_id;
  select coalesce(sum(vo.subtotal), 0), coalesce(sum(vo.delivery_fee), 0)
    into vendor_subtotal, allocated_delivery_fee
    from public.vendor_orders vo where vo.order_id = target_order_id;

  if expected_subtotal <> item_subtotal then
    raise exception 'Order subtotal must equal the sum of order items' using errcode = '23514';
  end if;
  if expected_subtotal <> vendor_subtotal then
    raise exception 'Order subtotal must equal the sum of vendor orders' using errcode = '23514';
  end if;
  if expected_delivery_fee <> allocated_delivery_fee then
    raise exception 'Order delivery fee must equal vendor delivery allocations' using errcode = '23514';
  end if;
end;
$$;

create function private.assert_vendor_order_subtotal(target_vendor_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_subtotal numeric(12, 2);
  item_subtotal numeric(14, 2);
begin
  select vo.subtotal into expected_subtotal
    from public.vendor_orders vo where vo.id = target_vendor_order_id;
  if not found then return; end if;

  select coalesce(sum(voi.subtotal), 0) into item_subtotal
    from public.vendor_order_items voi where voi.vendor_order_id = target_vendor_order_id;
  if expected_subtotal <> item_subtotal then
    raise exception 'Vendor order subtotal must equal the sum of its items' using errcode = '23514';
  end if;
end;
$$;

create function private.check_order_subtotal_deferred()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'orders' then
    if tg_op = 'DELETE' then
      perform private.assert_order_subtotal(old.id);
    else
      perform private.assert_order_subtotal(new.id);
    end if;
  else
    if tg_op <> 'INSERT' then
      perform private.assert_order_subtotal(old.order_id);
    end if;
    if tg_op <> 'DELETE' then
      perform private.assert_order_subtotal(new.order_id);
    end if;
  end if;
  return null;
end;
$$;

create function private.check_vendor_order_subtotal_deferred()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'vendor_orders' then
    if tg_op = 'DELETE' then
      perform private.assert_vendor_order_subtotal(old.id);
    else
      perform private.assert_vendor_order_subtotal(new.id);
    end if;
  else
    if tg_op <> 'INSERT' then
      perform private.assert_vendor_order_subtotal(old.vendor_order_id);
    end if;
    if tg_op <> 'DELETE' then
      perform private.assert_vendor_order_subtotal(new.vendor_order_id);
    end if;
  end if;
  return null;
end;
$$;

create constraint trigger orders_subtotal_consistency
  after insert or update on public.orders
  deferrable initially deferred for each row
  execute function private.check_order_subtotal_deferred();
create constraint trigger order_items_subtotal_consistency
  after insert or update or delete on public.order_items
  deferrable initially deferred for each row
  execute function private.check_order_subtotal_deferred();
create constraint trigger vendor_order_partition_consistency
  after insert or update or delete on public.vendor_orders
  deferrable initially deferred for each row
  execute function private.check_order_subtotal_deferred();
create constraint trigger vendor_orders_subtotal_consistency
  after insert or update on public.vendor_orders
  deferrable initially deferred for each row
  execute function private.check_vendor_order_subtotal_deferred();
create constraint trigger vendor_order_items_subtotal_consistency
  after insert or update or delete on public.vendor_order_items
  deferrable initially deferred for each row
  execute function private.check_vendor_order_subtotal_deferred();

create function private.validate_review_purchase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_customer_id uuid;
  order_current_status public.order_status;
  item_order_id uuid;
  item_product_id uuid;
  item_vendor_id uuid;
  vendor_order_parent_id uuid;
  vendor_order_vendor_id uuid;
  vendor_order_current_status public.vendor_order_status;
  delivery_parent_id uuid;
  delivery_current_status public.delivery_status;
begin
  select o.customer_id, o.status into order_customer_id, order_current_status
    from public.orders o where o.id = new.order_id;
  if not found or order_customer_id <> new.customer_id or order_current_status <> 'completed' then
    raise exception 'Reviews require the customer''s completed order' using errcode = '23514';
  end if;

  if new.order_item_id is not null then
    select oi.order_id, oi.product_id, oi.vendor_id into item_order_id, item_product_id, item_vendor_id
      from public.order_items oi where oi.id = new.order_item_id;
    if not found or item_order_id <> new.order_id or item_product_id <> new.product_id then
      raise exception 'Review product must match an item in the completed order' using errcode = '23514';
    end if;
  end if;

  if new.vendor_order_id is not null then
    select vo.order_id, vo.vendor_id, vo.status
      into vendor_order_parent_id, vendor_order_vendor_id, vendor_order_current_status
      from public.vendor_orders vo where vo.id = new.vendor_order_id;
    if not found or vendor_order_parent_id <> new.order_id or vendor_order_vendor_id <> new.vendor_id
      or vendor_order_current_status <> 'completed' then
      raise exception 'Vendor review must match a completed vendor order' using errcode = '23514';
    end if;
  end if;

  if new.delivery_id is not null then
    select d.order_id, d.status into delivery_parent_id, delivery_current_status
      from public.deliveries d where d.id = new.delivery_id;
    if not found or delivery_parent_id <> new.order_id or delivery_current_status <> 'delivered' then
      raise exception 'Delivery review must match a delivered order' using errcode = '23514';
    end if;
  end if;

  if new.vendor_id is not null and new.order_item_id is not null and item_vendor_id <> new.vendor_id then
    raise exception 'Reviewed vendor must match the purchased product vendor' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger reviews_validate_purchase
  before insert or update on public.reviews
  for each row execute function private.validate_review_purchase();

create function private.validate_commission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_vendor_id uuid;
  expected_gross numeric(12, 2);
begin
  select vo.vendor_id, vo.subtotal into expected_vendor_id, expected_gross
    from public.vendor_orders vo where vo.id = new.vendor_order_id;
  if not found or expected_vendor_id <> new.vendor_id or expected_gross <> new.gross_amount then
    raise exception 'Commission must match its vendor order and gross subtotal' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger commissions_validate_vendor_order
  before insert or update on public.commissions
  for each row execute function private.validate_commission();

create function private.validate_rider_earning()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_rider_id uuid;
begin
  select d.rider_id into assigned_rider_id
    from public.deliveries d where d.id = new.delivery_id;
  if not found or assigned_rider_id is null or assigned_rider_id <> new.rider_id then
    raise exception 'Rider earning must match the delivery rider' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger rider_earnings_validate_delivery
  before insert or update on public.rider_earnings
  for each row execute function private.validate_rider_earning();

revoke all on function private.validate_vendor_order_item() from public, anon, authenticated;
revoke all on function private.validate_order_item_product() from public, anon, authenticated;
revoke all on function private.assert_order_subtotal(uuid) from public, anon, authenticated;
revoke all on function private.assert_vendor_order_subtotal(uuid) from public, anon, authenticated;
revoke all on function private.check_order_subtotal_deferred() from public, anon, authenticated;
revoke all on function private.check_vendor_order_subtotal_deferred() from public, anon, authenticated;
revoke all on function private.validate_review_purchase() from public, anon, authenticated;
revoke all on function private.validate_commission() from public, anon, authenticated;
revoke all on function private.validate_rider_earning() from public, anon, authenticated;
