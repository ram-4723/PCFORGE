# PCForge

Frontend-only PC hardware shopping and custom PC configurator demo built with React, Vite, Tailwind CSS, Lucide React, and Framer Motion.

## Run locally

Install dependencies with `pnpm install`, then run `pnpm dev` and open the local URL Vite prints. Create a production bundle with `pnpm build`.

## Demo storefront

The component shop includes local product data, category and brand filters, search, price sorting, a wishlist, and a shared cart for individual products, prebuilt PCs, and configured builds. Cart and wishlist contents are saved in this browser's local storage. Demo checkout offers simulated success and failure only.

Sample campaigns live in `src/config/campaigns.js`. The “Manage demo campaign examples” panel lets you edit campaign copy and pause or resume placements for the current browser session. All advertisements, brands, stock labels, and prices are illustrative; there are no real advertisers, affiliate links, live inventory, orders, or payments.

## Replace the hero visual

The landing page currently uses the supplied looping GIF in the right-side hero area. To replace it with another asset, put it in `public/images/pcforge-hero.webp`, `public/videos/pcforge-hero.mp4`, or `public/animations/pcforge-hero.gif`, then set `type` and `src` in `src/config/heroConfig.js`. If the selected asset cannot load, the CSS PC case visual appears instead.

The hero and the rest of the site remain usable without a hero asset. Contact and checkout details are not sent to a service.

## Add component photos

The component category tiles, product catalogue, prebuilt PCs, and campaign cards use representative photos loaded directly from their source websites. They are sample imagery and may not show the exact model named on a card; an internet connection is needed to load them, and source sites may change their links. If an image cannot load, the existing illustrated product visual appears instead. For local images, copy approved photos into `public/images/components/` and set that product's `image` in `src/data/products.js`, for example `image: '/images/components/rtx-4060.webp'`. Confirm image rights before publishing the site.
