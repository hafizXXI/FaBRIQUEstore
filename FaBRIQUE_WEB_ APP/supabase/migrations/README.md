# Supabase migrations

Apply these files in lexical order with the Supabase CLI. They create the marketplace schema, indexes and integrity triggers, RLS/views, Storage buckets and object policies, and the development category taxonomy.

1. `001_initial_schema.sql` creates profile, vendor/rider, catalog, cart/wishlist, multi-vendor order, payment, delivery, reviews, notification, and finance tables. It also installs safe profile creation and status/history triggers.
2. `002_indexes_and_integrity.sql` creates listing/search indexes, unique image/default-address constraints, purchase-context review checks, parent/child subtotal checks, and financial relationship checks.
3. `003_rls_and_views.sql` enables RLS on every application table, restricts client writes, exposes narrow marketplace/vendor-fulfillment views, and sets trusted service-role grants.
4. `004_storage.sql` creates public marketplace image/avatar buckets and private vendor/rider verification buckets. Object paths are scoped by owner IDs.
5. `005_seed_development_categories.sql` seeds only the nine fabric categories. It creates no accounts, products, orders, reviews, or financial activity.

## Storage object paths

- `product-images/{vendor_uuid}/{product_uuid}/{filename}`
- `vendor-assets/{vendor_uuid}/{filename}`
- `rider-avatars/{rider_uuid}/{filename}`
- `vendor-verification/{vendor_uuid}/{filename}`
- `rider-verification/{rider_uuid}/{filename}`

The two verification buckets are private. Do not make them public or store their contents in public buckets.

## Admin provisioning

New Auth users receive a `customer` profile. Client-side metadata cannot set the role. Provision the first administrator only from the trusted Supabase SQL editor or a secured administrative migration, using the intended Auth user ID:

```sql
update public.profiles
set role = 'admin'
where id = '<auth.users UUID>';
```

Never expose this operation through the browser. Vendor and rider applications also remain pending until a trusted admin workflow approves them.

## Applying migrations

After configuring a Supabase project and CLI link, use `supabase db push` for a remote project or `supabase db reset` against a local Supabase stack. Review the SQL and take a backup before applying to a database with existing data. No remote project is currently configured, so these migrations have not been deployed.

The local validation harness used PGlite with minimal `auth` and `storage` stubs. It checks PostgreSQL DDL and selected RLS/integrity cases, but does not replace testing against Supabase Auth, PostgREST, Storage, and a real local Supabase stack.

Checkout/order/payment creation is intentionally not granted to browser roles. Add trusted transactional server functions before enabling commerce workflows; never treat frontend payment callbacks as verification.