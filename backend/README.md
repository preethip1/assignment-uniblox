# Ecommerce Checkout & Rewards Service

A small backend that manages products, carts, checkout, and a coupon reward
system (every _n_th order generates an _x_% discount coupon). Written in
TypeScript on Node.js. Storage is in-memory; the focus is correctness under
retries and concurrent checkouts.

## Requirements

- Node.js 18+

## Setup

```bash
cd backend
npm install
npm start        # runs the server (via tsx) on http://localhost:3000
npm test         # runs the test suite
npm run typecheck # type-checks the project without emitting files
```

We run TypeScript directly with [`tsx`](https://github.com/privatenumber/tsx),
so there is no separate build step to configure.

## API

_Documented as endpoints are added (see the phases below)._

- `GET /health` — liveness check.

## Project layout

```
backend/
  src/
    app.ts       # builds the Express app (routes, middleware)
    server.ts    # starts the HTTP server
  tsconfig.json  # TypeScript compiler options (strict mode)
  README.md
  DECISIONS.md   # design decisions, trade-offs, invariants
```
