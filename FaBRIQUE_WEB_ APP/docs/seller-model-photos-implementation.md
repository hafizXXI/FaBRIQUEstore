# Seller-model photos and listing types

## Scope
FaBRIQUE supports two listing types: fabric for sale and finished outfit for sale. Actual item photos remain required for published listings. Model photos are optional, encouraged for pre-owned listings, and never replace actual-item photos.

## Recommended implementation order

1. **Database and image roles**
   - Apply `supabase/migrations/006_listing_types_and_model_photos.sql`.
   - Verify existing products default to `fabric` and existing product images default to `item`.
   - Confirm invalid listing types/image roles and model photos as primary item photos are rejected.

2. **Vendor experience**
   - Select fabric-for-sale or finished-outfit-for-sale in the vendor form.
   - Upload actual-item photos and model photos into separate groups.
   - Show the optional “Show it styled” prompt for pre-owned items; model photos remain optional for every condition.
   - Save new products as drafts first. Publish only after at least one actual item photo exists.

3. **Customer experience**
   - Show actual-item and model photos in separate gallery tabs.
   - Show listing type and a model-photo indicator on product cards.
   - Add the live-data “Pre-owned & Styled” collection and listing-type/model-photo filters in Explore.
   - Clearly state that a modeled garment is not included in a fabric listing unless the seller says so.

4. **Security and regression testing**
   - Apply migrations to the intended Supabase development environment.
   - Verify vendor ownership and Storage RLS with separate vendor accounts.
   - Test upload, removal, primary-image rules, product detail, filters, empty states, and responsive layouts.
   - Re-test cart, checkout, and order history for both listing types.

## Compatibility and rollout notes
- Existing records default to `fabric` because the old schema does not reliably distinguish finished outfits.
- Existing product images default to `item`.
- Model photos do not prove item condition. Sellers should disclose wear, flaws, repairs, and alterations.
- The repository migration is not applied to any live Supabase project automatically.
- Build/lint and real Supabase runtime verification must be reported separately.
