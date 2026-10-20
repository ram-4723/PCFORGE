# PCForge API (Pass 1)

Standalone Express API using MongoDB Atlas through Mongoose. The app loads no demo inventory and does not implement authentication, orders, payment processing, build creation, or compatibility checks. `PCBuild` and `Order` are persistence schemas only; a saved build is not a confirmed order.

## Requirements and setup

- Node.js 20 or newer
- MongoDB Atlas database and a database user

From this directory, install dependencies and copy `.env.example` to `.env`. Replace the `MONGODB_URI` placeholder with your Atlas connection string. In Atlas, allow the development machine's IP address in Network Access. Keep the real `.env` private; it is ignored by Git.

```sh
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, copy the environment example with `Copy-Item .env.example .env` instead. The API exits with a clear startup error if `MONGODB_URI` is missing or MongoDB cannot be reached; it never starts as if the database were connected.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection URI. Store credentials only in `.env` or the deployment secret manager. |
| `PORT` | No | HTTP port; defaults to `3001`. |
| `NODE_ENV` | No | Set to `production` to hide internal error details. |
| `FRONTEND_ORIGINS` | No | Comma-separated allowed browser origins; defaults to `http://localhost:5173`. |

If you change `PORT`, set the matching target in the root `vite.config.js` proxy for local frontend development.

## API

All responses are JSON and use `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code", "message" } }`. Database errors from component requests return `503 DATABASE_UNAVAILABLE` when the connection is down. Inactive components are never returned by public routes.

### Health

```http
GET /api/health
```

Returns HTTP 200 while connected and HTTP 503 with `database: "disconnected"` otherwise.

### List active components

```http
GET /api/components?category=Processors%20(CPU)&page=1&limit=20
```

`category` is optional and must match a supported category. `page` defaults to 1. `limit` defaults to 20 and must be between 1 and 100. The response includes pagination metadata:

```json
{
  "success": true,
  "data": { "components": [] },
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

### Get one active component

```http
GET /api/components/507f1f77bcf86cd799439011
```

The `id` must be a 24-character MongoDB ObjectId. Inactive and missing records both return 404.

## Models and money

`Component`, `PCBuild`, and `Order` schemas use Mongoose timestamps and validation. `priceInr`, `budgetInr`, `calculatedTotalInr`, `unitPriceInr`, and `totalInr` are non-negative safe integers in whole Indian rupees; the API does not use floating-point currency arithmetic. Component specifications are stored as a string-valued map. Build and order status fields are separate; schemas do not transition orders or collect payments.

No seed data is included. Add real component records through a future protected management workflow. Never treat the frontend's illustrative sample prices as live inventory.

## Tests

```sh
npm test
```

Tests use Node's test runner, Supertest, Mongoose schema validation, and a stubbed component model. They do not require an Atlas connection and cover health/connection behavior, category and pagination validation, ObjectId validation, inactive-record hiding, error responses, and money/schema constraints.
