# FaBRIQUE

FaBRIQUE is a multi-vendor fabric marketplace for trusted vendors and customers across Nigeria. The app is built with React, Vite, and Supabase, with a database-first design for catalog browsing, saved items, cart flows, order history, and future payment workflows.

![FaBRIQUE Preview](FaBRIQUE_WEB_%20APP/public/social-preview.svg)

## Highlights

- Customer marketplace browsing and product discovery
- Vendor storefront and product management views
- Saved items and persistent cart experience
- Checkout preparation with address selection and order history
- Supabase-driven architecture with migration-backed schema
- Ready for incremental Phase 7 payment and order confirmation work

## Stack

- React 19
- Vite
- Tailwind CSS v4
- Supabase
- Lucide icons

## Project structure

- `FaBRIQUE_WEB_ APP/` contains the actual frontend project and database migration files
- `FaBRIQUE_WEB_ APP/src/` contains app pages, services, hooks, and routes
- `FaBRIQUE_WEB_ APP/supabase/migrations/` stores the database schema and security rules

## Local development

```bash
cd "FaBRIQUE_WEB_ APP"
npm install
cp .env.example .env.local
npm run dev
```

Use real public Supabase values in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## Production build

```bash
cd "FaBRIQUE_WEB_ APP"
npm run build
```

## Deployment notes

This app is Vite-based and deploys well on Vercel or Netlify.

- For Vercel: set the project root to `FaBRIQUE_WEB_ APP`
- For Netlify: set the publish directory to `FaBRIQUE_WEB_ APP/dist`
- Keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the host environment, not in source control

## Status

Phase 6 is database-backed and pending live runtime verification against the real Supabase project before claiming full marketplace completion.
