# Seller-model photos and listing types

## Scope
FaBRIQUE supports two listing types: fabric for sale and finished outfit for sale. Actual item photos remain required for trustworthy listings. Model photos are optional, especially encouraged for pre-owned listings, and never replace actual-item photos.

## Recommended implementation order

1. **Database and image roles**
   - Apply migration `006_listing_types_and_model_photos.sql`.
   - Verify existing products default to `fabric` and existing product images default to `item`.
   - Confirm the database rejects invalid listing types/image roles and model photos as primary item images.

2. **Vendor experience**
   - Select the listing type in the vendor form.
   - Upload actual-item photos and model photos into separate groups.
   - Allow model photos for any listing, with an extra prompt for pre-owned listings.
   - Keep products unpublished/draft until at least one actual-item photo exists.

3. **Customer experience**
   - Display actual-item photos and model photos separately in the product gallery.
   - Show listing type and model-photo indicators on product cards.
   - Add the live-data “Pre-owned & Styled” collection to the home page.

4. **Security and regression testing**
   - Apply migrations in the intended Supabase environment.
   - Verify vendor ownership and Storage RLS with separate vendor accounts.
   - Test uploads, replacement/removal, primary-image rules, product detail, and responsive layouts.
   - Re-test cart, checkout, and order history for both listing types.

## Notes
- Existing records are migrated as fabric listings because the old schema did not reliably distinguish finished outfits.
- Existing product images are classified as actual-item photos.
- Model photos are optional and do not prove item condition.
- A fabric listing does not include the modeled garment unless the seller explicitly states that it is included.
- The repository branch changes do not apply migrations to a live Supabase project. Runtime verification requires a configured project.
