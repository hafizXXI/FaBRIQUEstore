# FaBRIQUE

FaBRIQUE is a JSX-only React marketplace foundation for independent fabric sellers. Phase 1 establishes Vite, the responsive customer shell, client-side routes, Tailwind CSS v4, and optional Supabase client configuration.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Supabase project for database-backed features (not required to start the shell)

## Local setup

```sh
npm install
copy .env.example .env.local
npm run dev
```

On macOS/Linux, use `cp .env.example .env.local` instead of `copy`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local` when a Supabase project is available. The app also accepts the older `VITE_SUPABASE_ANON_KEY` fallback for compatibility. These are public client values only; never put service-role or payment secrets in Vite environment variables.

## Commands

- `npm run dev` starts the Vite development server.
- `npm run lint` runs Oxlint.
- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves the production build locally.

## Architecture

- `src/layouts/` contains shared application shells.
- `src/pages/` contains route-level views.
- `src/lib/supabase.js` creates the browser client only when both public environment variables are present.
- `src/styles/` contains app styling; `src/index.css` defines Tailwind v4 and brand tokens.
- `supabase/migrations/` contains the ordered PostgreSQL schema, indexes/integrity triggers, RLS/views, Storage policies, and development category seed.

## Database foundation

The migrations define profiles, vendors and private verification documents, riders and private verification documents, categories, products/images/variants, addresses, carts, wishlists, customer and vendor orders, status history, payments, multi-vendor deliveries, reviews, notifications, commissions, payouts, rider earnings, settings, and featured marketplace records. RLS is enabled on every application table. New users receive the `customer` role; elevated roles must be provisioned through trusted server/database administration. See [migration notes](supabase/migrations/README.md) for storage paths, admin provisioning, and migration order.

The schema/migrations are local only. No Supabase project credentials or CLI are configured, so remote deployment is unverified. Product/catalog queries, authentication UI, checkout, payment provider verification, vendor/rider/admin workflows, and trusted transactional order creation remain unimplemented. Browser roles cannot create orders, payments, commissions, payouts, or earnings; do not enable checkout until trusted server functions and Supabase-side tests exist. The current UI continues to show explicit unavailable states without sample marketplace activity.

## Phase 6 order architecture

This phase adds the customer cart and order pipeline to the marketplace without introducing live payment flows. The app now includes persistent cart services backed by the `carts` and `cart_items` tables, checkout preparation with saved addresses, order history pages, and customer order detail pages. Customer flows use Supabase as the source of truth and do not rely on localStorage as the authoritative data source.

### Cart behavior

- A single active cart is created per authenticated customer when needed.
- Products are validated before being added, including published status, approved vendor status, and available inventory.
- Duplicate items are merged rather than duplicated in the cart.
- Quantity changes re-check against current stock before updating the item.
- Cart items are grouped and displayed by vendor before checkout.

### Checkout and order creation

- The checkout flow selects a saved delivery address and prepares a customer order.
- The client sends only the chosen address and optional delivery notes to the database function.
- The database is responsible for calculating totals, creating the parent order, splitting vendor sub-orders, creating order items, and recording initial order history.
- Payment remains intentionally unconfirmed in this phase; the order starts in `pending_payment` and does not pretend a payment is complete.

### Known limitations

- Live payment processing, Paystack/Flutterwave initialization, and confirmation logic remain for Phase 7.
- Delivery dispatch, rider assignment, and payouts are intentionally deferred.
- The app can only prove transactional order creation once a Supabase project with the Phase 6 RPC is connected and live.
