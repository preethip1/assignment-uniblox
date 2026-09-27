# Design decisions

Short notes on the choices I made, written as I hit them. I used an AI assistant
to help build this; I've gone through all of it and note where I redirected it
at the end.

## Setup: TypeScript + Node + Express

Uniblox's stack is mostly TypeScript/Node, so I started there, and I wanted type
safety for the money and coupon logic coming later. Express keeps the HTTP layer
small enough to explain. To save setup time in a few-hour window I run the
TypeScript straight through `tsx` instead of compiling to a `dist/` folder — I
still get strict checking via `npm run typecheck`, just without a build step to
maintain. Easy to add a real `tsc` build if this ever shipped.

## Testing from the first commit

Node's built-in test runner plus supertest, rather than Jest — nothing extra to
configure, and running it through `tsx` keeps the tests in TypeScript too. I
split app creation (`app.ts`) from starting the server (`server.ts`) so a test
can build the app and call it directly, without binding a real port.

## Money as integer cents

Floats can't represent values like 0.10 exactly, so totals drift. Every price is
integer cents, turned into a string only for display (`/products` returns both
`priceCents` and a formatted `price`). Discounts stay plain integer math.

## In-memory storage

The prompt allows it as long as the invariants still hold under concurrency, and
the real work here is the checkout/coupon logic, not database wiring. State lives
in `Map`s seeded at startup, with a `reset()` for tests. Trade-off: it resets on
restart and is single-process — I'll note what changes for multiple instances
alongside the concurrency work.

## One router per resource

`app.ts` only wires middleware and mounts routers; each resource has its own file
under `routes/`. Keeps `app.ts` readable and each area easy to test. Handlers
stay inline for now; I'll pull checkout into a service once it grows, so routes
stay thin.

## Predictable errors

Every failure throws a small `AppError` carrying an HTTP status and a stable
code, and a single error-handling middleware turns those into
`{ error: { code, message } }`. Clients can branch on the code
(`PRODUCT_NOT_FOUND`, `INVALID_QUANTITY`, `INSUFFICIENT_STOCK`, ...) instead of
parsing text, and the routes stay focused on the happy path.

## Carts store quantities, not prices

A cart holds only `productId -> qty`; the price is read from the catalog when the
cart is viewed. So if a price changes while a cart is open, the customer just
sees the current price — nothing stale is frozen into the cart. What price an
order locks in at checkout is a separate decision I'll make with the order code.
Quantity and stock are checked as an item goes in, so an invalid item never
enters the cart in the first place.
