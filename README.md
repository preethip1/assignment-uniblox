# Ecommerce Checkout & Rewards

A checkout and rewards service: products, carts, checkout with idempotent retries
and safe concurrency, and a coupon earned every nth order. Storage is in-memory;
the focus is correctness under retries and concurrent checkouts.

## Layout

- **`backend/`** — the API (TypeScript + Node + Express). The main service.
- **`frontend/`** — an optional React + Material UI storefront that talks to the API.

## Requirements

- Node.js 18+

## Backend setup

```bash
cd backend
npm install
npm start          # runs the API on http://localhost:3000
npm test           # run the test suite
npm run typecheck  # type-check without emitting files
```

No database or external service is needed. State is seeded on startup (five
products, one with limited stock) and resets when the process restarts. Optional
config via env vars: `PORT` (default 3000), `NTH_ORDER` (default 5),
`DISCOUNT_PERCENT` (default 10).

The full API reference, status codes, and error cases are in
[`backend/README.md`](backend/README.md).

## Frontend setup (optional)

Start the backend first, then:

```bash
cd frontend
npm install
npm run dev        # runs the UI on http://localhost:5000
```

The dev server proxies API calls to the backend on port 3000. More detail is in
[`frontend/README.md`](frontend/README.md).

## Design notes

The invariants, concurrency and idempotency strategy, money handling, trade-offs,
and deferred work are written up in [`backend/DECISIONS.md`](backend/DECISIONS.md).
