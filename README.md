# PCForge

PC hardware shopping and custom PC configurator demo built with React, Vite, Tailwind CSS, Lucide React, and Framer Motion. The standalone Java Spring Boot API lives in `backend/` and uses MongoDB Atlas.

## Run locally

Install frontend dependencies with `corepack pnpm install` (or `npm.cmd install` if pnpm is unavailable). Install Java 21 and Maven, set `MONGODB_URI` and `FRONTEND_ORIGINS` as described in [`backend/README.md`](backend/README.md), then run `mvn -f backend/pom.xml spring-boot:run` and `corepack pnpm dev` in separate terminals. On Windows PowerShell, `corepack.cmd pnpm dev` and `npm.cmd run dev` are equivalent fallbacks when `pnpm` is not directly on PATH. If port 5173 is occupied and Vite starts on 5174, set `FRONTEND_ORIGINS=http://localhost:5174` for the backend. Vite forwards `/api` requests to Spring Boot on port 8080 by default.

The API exposes health and active catalogue endpoints plus recommendations, conservative compatibility checks, and private saved-build CRUD. Configuration, schemas, API examples, and test instructions are documented in [`backend/README.md`](backend/README.md).

## Demo storefront

The component shop and configurator use the Java API for live database catalogue results and recommendations. Configurator checkout can create server-priced orders from saved builds and use Razorpay Test Mode when test credentials are configured. Curated highlights, prebuilt PCs, campaigns, and peripherals remain illustrative frontend content. The wishlist and cart are saved in this browser's local storage; the general cart and prebuilt-PC checkout still offer simulated success and failure only.

Sample campaigns live in `src/config/campaigns.js`. The “Manage demo campaign examples” panel lets you edit campaign copy and pause or resume placements for the current browser session. All advertisements, brands, stock labels, and prices are illustrative; there are no real advertisers, affiliate links, live inventory, orders, or payments.

## PC studio visual

The landing hero and Hardware Explorer use a lightweight CSS 3D component study in `src/components/PCStudioScene.jsx`. The Hardware Explorer lets visitors select components and move the layers between assembled and exploded layouts. It is an illustrative geometry diagram, not a manufacturer CAD model or fit guarantee. It uses no WebGL and remains usable when WebGL is unavailable. Reduced-motion preferences disable scene animation.

## Add catalogue products and photos

Product records are maintained in `src/data/products.js`; image-source notes are in `src/data/productImageSources.js` and `src/data/CATALOG.md`. Prefer a local, rights-cleared exact-model image in `public/images/`. Use the neutral product placeholder if the model cannot be matched or the image source is not permitted. Keep demo catalogue records visibly labelled as illustrative. The component shop reads active catalogue records from Spring Boot when available and marks its local preview products and prices as demo data when the API is empty or unreachable.

The catalogue supports search, category and brand filtering, price sorting, and incremental loading of API results. The builder uses the active backend catalogue rather than the local demo records.

## Frontend routes

The React app uses React Router with a shared PCForge header and footer. The available pages are `/`, `/builder`, `/components`, `/prebuilt`, `/showcase`, `/hardware-explorer`, `/about`, and `/contact`. The contact form validates its fields and shows a local demo confirmation; it does not deliver enquiries to a business.

GitHub Pages deployment is configured in `.github/workflows/deploy.yml`. The Vite build sets the repository base path in GitHub Actions, and `public/404.html` restores deep links after GitHub Pages serves its 404 document. The production build and direct route rendering should be checked before publishing changes.
