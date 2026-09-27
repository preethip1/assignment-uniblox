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
so there is no separate build step. State is seeded on startup and resets when
the process restarts. No database or external service is needed — `npm install`
then `npm start` is the whole setup.

## Configuration

| Env var            | Default | Meaning                              |
| ------------------ | ------- | ------------------------------------ |
| `PORT`             | `3000`  | HTTP port                            |
| `NTH_ORDER`        | `5`     | Every nth order earns a coupon       |
| `DISCOUNT_PERCENT` | `10`    | Coupon value, in percent             |

## Seed data

Five products are seeded on startup, one with deliberately limited stock so
overselling and concurrency are easy to exercise:

| id | name                | price  | stock |
| -- | ------------------- | ------ | ----- |
| p1 | Mechanical Keyboard | 79.99  | 25    |
| p2 | Wireless Mouse      | 29.99  | 3     |
| p3 | USB-C Hub           | 45.50  | 40    |
| p4 | 27" Monitor         | 219.99 | 10    |
| p5 | Laptop Stand        | 34.99  | 15    |

## Tests

```bash
npm test
```

The suite targets the risky paths, not just the happy path: concurrent checkout
on the last units (no overselling), idempotent retries (one order, stock consumed
once), single-use coupons, a coupon surviving a failed checkout, and the
money/report math.

## Money and errors

- All amounts are **integer cents** (`priceCents`, `subtotalCents`, ...).
  Responses also include a formatted string (`"29.99"`) for convenience.
- Errors share one shape: `{ "error": { "code": "...", "message": "..." } }`.
  Clients branch on `code`; common ones are `CART_NOT_FOUND`,
  `PRODUCT_NOT_FOUND`, `INVALID_QUANTITY`, `INSUFFICIENT_STOCK`,
  `CART_ALREADY_CHECKED_OUT`, `EMPTY_CART`, `COUPON_NOT_FOUND`,
  `COUPON_ALREADY_REDEEMED`, `NO_MILESTONE_REACHED`, `COUPON_ALREADY_GENERATED`,
  and `ORDER_NOT_FOUND`.

## API

### Health

**`GET /health`** — liveness check. `200` → `{ "status": "ok" }`.

### Catalog

**`GET /products`** — list the seeded catalog. `200`.

### Carts

**`POST /carts`** — create an empty cart. `201` → `{ id, status, items, subtotalCents, subtotal }`.

**`GET /carts/:id`** — view a cart with current per-line and subtotal pricing.
`200`, or `404 CART_NOT_FOUND`.

**`POST /carts/:id/items`** — add an item; body `{ productId, qty }`. Quantity
accumulates if the product is already in the cart. `200` with the cart, or
`400 INVALID_QUANTITY` / `404 PRODUCT_NOT_FOUND` / `409 INSUFFICIENT_STOCK`.

**`PATCH /carts/:id/items/:productId`** — set an item's quantity; body `{ qty }`.
`200`, or `400` / `404` / `409` as above.

**`DELETE /carts/:id/items/:productId`** — remove an item. `200`, or
`404 ITEM_NOT_IN_CART`.

### Checkout

**`POST /carts/:id/checkout`** — turn a cart into an order.

- Optional body: `{ "couponCode": "..." }`.
- Optional header: `Idempotency-Key: <key>` — retrying with the same key returns
  the same order instead of creating another.
- `201` on a new order, `200` on an idempotent retry. Errors:
  `409 CART_ALREADY_CHECKED_OUT`, `422 EMPTY_CART`, `409 INSUFFICIENT_STOCK`,
  `404 COUPON_NOT_FOUND`, `409 COUPON_ALREADY_REDEEMED`.
- The order snapshots each line's name and unit price, so later price changes
  never rewrite past orders.

### Orders

**`GET /orders/:id`** — fetch an order. `200`, or `404 ORDER_NOT_FOUND`.

### Coupons

**`GET /coupons/:code`** — look up a coupon's `percentOff` and `redeemed` status
(used to preview a discount before checkout). `200`, or `404 COUPON_NOT_FOUND`.

### Admin

**`POST /admin/coupons/generate`** — mint a coupon for the latest reached
milestone. `201` with the coupon, `422 NO_MILESTONE_REACHED` before the first
milestone, or `409 COUPON_ALREADY_GENERATED` if the current milestone already
produced one.

**`GET /admin/report`** — read-only summary: units sold per product, gross /
discount / net revenue, coupon counts (generated / available / redeemed), and
total orders. `200`.

A ready-to-run Postman collection is in [`postman_collection.json`](postman_collection.json).

## Frontend

An optional React (Vite + Material UI) storefront lives in
[`../frontend`](../frontend); see its README to run it against this API.

## Project layout

```
backend/
  src/
    app.ts             # wires middleware and mounts routers
    server.ts          # starts the HTTP server
    store.ts           # in-memory state, seed data, config
    money.ts           # integer-cents helpers
    lock.ts            # async mutex for the checkout critical section
    errors.ts          # AppError + error-handling middleware
    async-handler.ts   # forwards async route errors
    services/checkout.ts
    routes/            # health, products, carts, orders, coupons, admin
  tests/               # node:test + supertest
  tsconfig.json
  README.md
  DECISIONS.md         # design decisions, trade-offs, invariants
```
