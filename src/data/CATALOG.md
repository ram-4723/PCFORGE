# Product catalog data

The storefront catalog lives in `products.js` as a list of product records. Keep each record's
stable `id`, `name`, `brand`, `category`, `specs`, and demo `price` together. Add a photo by adding
its product ID to the `productImages` map; do not use a category-wide fallback for product cards.
Products without a verified matching image use the shared neutral placeholder.

The Spring API component document exposes its stored `brand` and `imageUrl` fields directly in
`data.components`. A missing verified brand may be stored as null; the storefront shows the
category instead of inventing a manufacturer. Set `imageUrl` to either an HTTPS product-specific
image URL or a local `/images/<filename>` path under the frontend `public/` directory. Local paths
are resolved against the deployed Vite base path. Do not copy category artwork or another model's
photo into a product record. The demo seeder does not update existing records, so correct or add an
image to existing demo records through MongoDB Atlas or recreate only the demo dataset deliberately.

Add attribution in `productImageSources.js` whenever a source is known. Manufacturer photo URLs
should point directly to the image, with the manufacturer's product page saved alongside it. Never
put retailer product links, affiliate links, or redirects in the storefront catalog. Existing local
images are preserved; when their original URL is missing, attribution says so instead of guessing.

All displayed demo prices and stock labels are illustrative. Verify current product availability,
prices, specifications, and image-use rights before treating the catalog as a sales inventory.
