-- Seller-model photos and listing types.
-- Existing listings remain fabric listings and existing images remain actual-item photos.
alter table public.products
  add column if not exists listing_type text not null default 'fabric';

alter table public.products
  drop constraint if exists products_listing_type_check;

alter table public.products
  add constraint products_listing_type_check
  check (listing_type in ('fabric', 'finished_outfit'));

alter table public.product_images
  add column if not exists image_role text not null default 'item';

alter table public.product_images
  drop constraint if exists product_images_image_role_check;

alter table public.product_images
  add constraint product_images_image_role_check
  check (image_role in ('item', 'model'));

-- The main product image must always represent the actual item for sale.
create or replace function public.guard_product_image_primary_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_primary and new.image_role <> 'item' then
    raise exception 'A model photo cannot be the primary item photo'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists product_images_guard_primary_role on public.product_images;
create trigger product_images_guard_primary_role
  before insert or update of is_primary, image_role
  on public.product_images
  for each row execute function public.guard_product_image_primary_role();

create index if not exists product_images_product_role_order_idx
  on public.product_images (product_id, image_role, sort_order);

comment on column public.products.listing_type is
  'fabric means the fabric itself is for sale; finished_outfit means a completed garment/outfit is for sale.';
comment on column public.product_images.image_role is
  'item photos show the actual item for sale; model photos show it styled or worn.';
