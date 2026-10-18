# PCForge Java backend

Spring Boot 3, Java 21, Maven, Spring Data MongoDB, Bean Validation, PDFBox, and Razorpay's official Java SDK power the API. The payment gateway integration is restricted to Razorpay Test Mode keys (`rzp_test_…`); the API secret stays in the backend environment.

## Local setup

1. Install Java 21 and Maven 3.9 or newer.
2. Configure `MONGODB_URI` with a MongoDB Atlas URI and allow the development machine in Atlas Network Access.
3. Set `FRONTEND_ORIGINS=http://localhost:5173` for local Vite. If Vite reports that 5173 is occupied and starts on 5174, use `FRONTEND_ORIGINS=http://localhost:5174` instead; otherwise browser requests will be rejected by CORS with HTTP 403.
4. From the Razorpay Dashboard's Test Mode, copy the Key ID and Key Secret into the backend process environment as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. The key ID must begin with `rzp_test_`. Do not place the secret in Vite variables or frontend files. Configure `RAZORPAY_WEBHOOK_SECRET` only if a webhook is configured in the Razorpay Test Mode dashboard.
5. From `backend/`, run `mvn test` and then `mvn spring-boot:run`. In another terminal, run the frontend with `corepack pnpm dev` from the repository root. On Windows PowerShell where `pnpm` is not directly recognized, use `corepack.cmd pnpm dev` or `npm.cmd run dev`.

### Local demo catalog (optional)

The configurator reads its parts from MongoDB. The product cards in the frontend are separate demo content and do not populate MongoDB. To try recommendations before entering verified inventory, start the backend with `PCFORGE_SEED_DEMO=true`. It seeds 37 clearly labeled demo components across budget tiers, including fictional demo records and illustrative sample prices. The seeder inserts into an empty `components` collection, or appends missing entries when every existing record is already marked `demoData`; it never updates existing components and skips a collection containing any non-demo record. Every seeded entry is active for recommendation testing but marked `out_of_stock` and `demoData`, so it cannot be ordered; the builder displays a demo warning and disables order/cart actions. Turn the flag off after seeding. Do not use demo records as real inventory or customer quotations. For normal use, load verified product models, prices, specifications, and stock through a trusted catalog-management process.

PowerShell example (from the repository root; use your existing Maven settings file if needed):

```powershell
$env:PCFORGE_SEED_DEMO = "true"
mvn -f backend\pom.xml spring-boot:run
```

After startup completes, stop the backend and set `$env:PCFORGE_SEED_DEMO = "false"` before starting it normally.

### Razorpay checkout with the isolated test catalogue

For local builder and order-review testing, use a **separate Atlas database named `pcforge_test`**. The backend refuses to seed unless the `test-catalog` Spring profile is active and `PCFORGE_TEST_CATALOG_ENABLED=true`; Razorpay credentials are not needed to start, seed the isolated catalogue, or reach server-priced order review. It also refuses to seed a database containing non-demo catalog records. The 26 stable test records provide three or four choices across CPUs, motherboards, RAM, storage, PSUs, cases, GPUs, and coolers. They are idempotently inserted/refreshed, explicitly marked `demoData`, and use `in_stock` only in this isolated test database. Their INR amounts are illustrative values, not verified live quotations. Demo payment orders are rejected outside this guarded profile/database. To continue from order review to Razorpay Checkout, configure matching Razorpay Test Mode credentials; signature verification and order confirmation remain enforced.

PowerShell from the repository root (the URI must explicitly use the dedicated `pcforge_test` database):

```powershell
$env:SPRING_PROFILES_ACTIVE = "test-catalog"
$env:PCFORGE_TEST_CATALOG_ENABLED = "true"
$env:MONGODB_URI = "mongodb+srv://<test-user>:<encoded-password>@<cluster-host>/pcforge_test?retryWrites=true&w=majority"
# Optional until you want to test Razorpay payment:
# $env:RAZORPAY_KEY_ID = "rzp_test_..."
# $env:RAZORPAY_KEY_SECRET = "<test-secret>"
mvn -s work\maven\settings.xml -f backend\pom.xml spring-boot:run
```

Use a database user scoped to the test database; never use a production database URI for this. When startup completes, the seed log reports how many test entries were added/refreshed and GET `/api/health` should report MongoDB connected. Recommendation responses indicate whether the test-only checkout gate is enabled; the builder shows a test-data warning. Orders remain pending until Razorpay verifies a captured payment signature.

The Spring backend does not load `.env` files automatically. `backend/.env.example` documents placeholders; export values in your shell or use a local environment launcher. Never commit real credentials. The frontend API base is `VITE_API_URL` (default `/api`); Vite proxies `/api` to `VITE_API_PROXY_TARGET` (default `http://localhost:8080`).

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | Yes | — | MongoDB Atlas URI |
| `PCFORGE_SEED_DEMO` | No | `false` | Opt-in one-time sample catalogue seed; inserts only into an empty components collection and marks entries demo/out of stock |
| `SPRING_PROFILES_ACTIVE` | For test catalogue | — | Set to `test-catalog` only for isolated payment testing |
| `PCFORGE_TEST_CATALOG_ENABLED` | For test catalogue | `false` | Explicitly enable the test dataset; requires database `pcforge_test`; Razorpay keys are needed only to start payment |
| `PORT` | No | `8080` | HTTP port |
| `FRONTEND_ORIGINS` | No | `http://localhost:5173` | Comma-separated exact CORS origins |
| `RAZORPAY_KEY_ID` | For payments | empty | Public Razorpay Test Mode key; live keys are rejected |
| `RAZORPAY_KEY_SECRET` | For payments | empty | Server-only Test Mode secret |
| `RAZORPAY_WEBHOOK_SECRET` | For webhooks | empty | Secret used to verify the exact raw webhook body |
| `INVOICE_SELLER_NAME` | No | empty | Seller name copied into immutable invoice snapshot |
| `INVOICE_SELLER_ADDRESS` | No | empty | Seller address copied into invoice snapshot |
| `INVOICE_SELLER_GSTIN` | No | empty | Seller GSTIN; never inferred or fabricated |
| `INVOICE_TAX_RATE_BPS` | No | `0` | Configured tax rate in basis points; 1800 means 18%; allowed 0–2800 |
| `MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE` | No | `health,info` | Actuator endpoint exposure |

Configure tax only after confirming the correct tax treatment for the seller and items. The default tax is zero. A PDF is labelled a **TAX INVOICE** only when seller name, address, GSTIN, and a non-zero configured tax rate are present. Otherwise a paid order gets a payment receipt explicitly labelled as not a GST tax invoice. Unpaid orders may download an estimate marked as neither an invoice nor proof of payment.

## API

Successful JSON responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code": ..., "message": ... } }`. Production responses do not expose stack traces.

### Recommendations and compatibility

- `GET /api/components?category=GPU&page=1&limit=20` lists active catalogue entries with pagination; `GET /api/components/{id}` returns one active entry.
- `POST /api/builds/recommendations` accepts an integer `budgetInr`, one `intendedUse` (`gaming`, `programming`, `video_editing`, `office`, or `3d_rendering`), and one `preference` (`balanced`, `gaming_performance`, `upgrade_friendly`, or `budget_focused`). It chooses only active database products, calculates totals from stored integer INR prices, and returns an error when the catalogue cannot support a build within the budget.
- `POST /api/builds/compatibility` checks submitted component IDs against structured specifications. Missing data returns `unverified`; the API does not infer compatibility from names.
- `POST /api/builds` saves a build; it does not create a confirmed order.

### Saved builds and orders

- `POST /api/builds` saves an unconfirmed build. The response includes its one-time `sessionToken`; store it in this browser session and send it as `X-Build-Session`.
- `POST /api/orders` accepts `{ "buildId": "<id>", "customer": { "name": "...", "email": "...", "phone": "...", "address": "..." } }`, `X-Build-Session`, and a unique `Idempotency-Key` header. The server checks every referenced component is active and in stock, reads its current price, calculates the total and configured tax, and stores an immutable item snapshot. The response returns the order and a one-time `accessToken`.
- `GET /api/orders/{id}` requires `X-Order-Access` and returns only that order.
- `GET /api/orders/{id}/invoice` requires `X-Order-Access`; returns a PDF estimate while unpaid, then a payment receipt or configured tax invoice after server-confirmed capture.

Example order creation:

```sh
curl -X POST http://localhost:8080/api/orders \
  -H 'Content-Type: application/json' \
  -H 'X-Build-Session: <saved-build-token>' \
  -H 'Idempotency-Key: <random-unique-key>' \
  -d '{"buildId":"<mongo-id>","customer":{"name":"Example Customer","email":"customer@example.com","phone":"+91 9876543210","address":"Pune, Maharashtra"}}'
```

Order and payment endpoints are limited to 20 requests per minute per client address per backend instance. The in-memory limit is a basic safeguard; production should also apply edge rate limiting at the hosting proxy.

### Razorpay Test Mode

- `POST /api/orders/{id}/payments` requires `X-Order-Access` and `Idempotency-Key`. It rechecks current product availability/prices, converts the server amount from integer INR to integer paise, and creates/reuses the provider order. It returns only the public test key, provider order ID, amount in paise, and currency.
- The frontend passes that provider order to Razorpay Checkout. It must not send a price or payment status.
- `POST /api/orders/{id}/payments/verify` requires `X-Order-Access` and `{ "razorpayPaymentId": "...", "razorpaySignature": "..." }`. The server verifies the HMAC against the provider order ID stored in MongoDB, fetches the payment from Razorpay, checks order association, amount, currency and `captured` status, then atomically marks the order paid and issues its document. Duplicate verification of the same captured payment is idempotent.
- `POST /api/orders/{id}/payments/fail` accepts the payment ID from Razorpay's failure callback, fetches it server-side, and marks the order failed only when Razorpay confirms the matching order, amount, currency, and `failed` status. This never confirms an order; it lets a retry create a fresh provider order.
- `POST /api/payments/webhook` accepts Razorpay payment events and verifies `X-Razorpay-Signature` against the raw request bytes. Captured events are checked against the stored provider order, amount, and currency; failed events cannot change an already-paid order. Configure `payment.captured` and `payment.failed` events in Test Mode if using webhooks.

If an order payment fails, the order stays unpaid and can be retried. A verified failed provider payment allows the backend to create a fresh Razorpay order on retry, after rechecking the saved item snapshot, current price, and stock. An order whose component is now out of stock or repriced cannot proceed; return to the builder and create a current order. Recommendations include only active, positively priced, in-stock products. The explicitly enabled test catalogue is available only in the isolated `pcforge_test` database.

### Local test payment

Run the Spring backend with the guarded `test-catalog` profile and dedicated `pcforge_test` database shown above, then run Vite in another terminal (`pnpm dev`); its `/api` proxy should target `http://localhost:8080`. The 26 test products will be inserted or refreshed idempotently as `in_stock` test data, and each selected component row will offer the other active choices in its category. For gaming recommendations, the sample compatible builds are ₹29,300 at a ₹30,000 budget (GTX 1650), ₹38,300 at ₹40,000 (RTX 3050), and ₹48,300 at ₹50,000 (RTX 4060). Balanced and gaming-performance preferences select the strongest GPU that fits; budget-focused chooses the least expensive. You can enter delivery details and review the server-calculated total without Razorpay keys. To make payment, add matching `rzp_test_` credentials to the backend environment and restart it, then continue to Razorpay Checkout and use a Razorpay Test Mode payment method. PCForge confirms the order only after the server verifies the returned signature and confirms the provider payment is captured. Cancellation and failure leave the order unpaid; retrying after a server-confirmed failure creates a fresh provider order. Never use live keys for this flow. These catalogue prices are illustrative values for isolated payment testing, not live retail quotes.

After a successful test payment, query the `orders` collection in `pcforge_test` using the displayed order ID/order number. The document should have `paymentStatus: "paid"`, `orderStatus: "confirmed"`, the matching `razorpayOrderId`/`razorpayPaymentId`, and the server-calculated `totalInr`. A cancelled or failed attempt must remain `paymentStatus: "pending"` or `"failed"` and must never be `confirmed`.

This implementation deliberately rejects `rzp_live_` keys. Razorpay's server flow creates an order before checkout and verifies the returned signature; PCForge also fetches payment status and confirms the stored amount before setting `paid`. The backend uses the [official Razorpay Java SDK](https://github.com/razorpay/razorpay-java) for provider order creation and payment retrieval.

### Customer access and limits

PCForge does not yet have user accounts. It returns a high-entropy order-access capability once and stores only its hash. This protects order retrieval from someone who only knows the order ID; it is **not account authentication**. The frontend stores the capability in `sessionStorage`. A customer who clears the browser session loses access, and a script running in the same origin could access it. There is no order-history/list endpoint because no reliable account identity exists.

Inventory has only a stock-status field, not a quantity ledger or reservation system. Order creation and payment initiation check `active`, `in_stock`, and the current price, but concurrent orders can still oversell. No discounts, shipping fees, refunds, cancellations, or admin fulfillment controls are implemented. The existing general cart checkout, campaign content, and prebuilt PCs remain demo UI; real orders are created from the configurator's saved build flow.

## Tests and build

From `backend/`, run `mvn test`. Tests cover the Pass 2 compatibility/recommendation code, order totals and access, payment signatures and amount mismatch handling, webhook raw-body signatures, and PDF generation/numbering behavior. MongoDB and Razorpay credentials are not required for unit tests. From the repository root, run `pnpm build` for the frontend production build.

## Deployment preparation

`Dockerfile` builds and tests the backend in a Java 21 Maven stage and runs it on a Java 21 JRE. Example build/run commands:

```sh
docker build -t pcforge-backend ./backend
docker run --rm -p 8080:8080 \
  -e MONGODB_URI="$MONGODB_URI" \
  -e FRONTEND_ORIGINS="https://your-approved-frontend.example" \
  -e RAZORPAY_KEY_ID="$RAZORPAY_KEY_ID" \
  -e RAZORPAY_KEY_SECRET="$RAZORPAY_KEY_SECRET" \
  pcforge-backend
```

Production launch command: `java -jar app.jar`; set `SPRING_PROFILES_ACTIVE=prod`, `PORT`, MongoDB, exact CORS origins, and only Test Mode payment credentials until live payments are explicitly approved. `/api/health` reports MongoDB reachability and returns 503 when it is unavailable. Actuator health probes are enabled with details hidden.

Before deployment, configure Atlas network access and database credentials in the hosting secret manager; use HTTPS; configure a Razorpay Test Mode webhook and test key pair; configure seller/tax data only after review; set `FRONTEND_ORIGINS` to the exact site origin; apply edge rate limits; verify `/api/health`, component listing, order create/retrieve, payment signature, webhook, and PDF download in a staging environment. This repository has not been deployed, and live MongoDB/Razorpay connectivity has not been verified from this workspace.
