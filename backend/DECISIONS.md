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

## Checkout is one guarded, all-or-nothing step

Checkout is where every invariant meets, so it's a single critical section. A
small async mutex serializes checkouts, and inside it everything is validated —
cart open and non-empty, every line still in stock, coupon present and unused —
before anything is mutated. Only after all checks pass do I decrement stock,
write the order, mark the coupon used, and close the cart. Because that section
is synchronous and serialized, two checkouts can't both grab the last units (the
second sees the reduced stock and is rejected), and retries are handled with an
`Idempotency-Key`: the first checkout records key -> order, and a repeat with the
same key returns that same order instead of charging twice. A checked-out cart
also flips to `CHECKED_OUT`, so re-posting it is a plain 409. Node being
single-threaded already prevents interleaving, but the mutex states the intent
and still holds if an `await` is added later; at multiple instances this becomes
a DB transaction with row locks.

## Orders snapshot their line items

An order copies each line's name and unit price at checkout rather than pointing
at the live product. Later catalog changes never rewrite history, and an order
always shows what the customer actually paid.

## Coupons are single-use and survive failed checkouts

A coupon is only marked redeemed in the commit part of checkout, after every
other check has passed. So a checkout that fails on stock never burns the coupon,
and since redemption happens inside the same guarded section, two checkouts can't
both redeem one code — the second sees it already used.

## Admin generation and a read-only report

Coupons aren't minted automatically at checkout — an admin endpoint mints one,
and only when the order count has actually crossed a milestone (every nth order).
I track how many milestones have been reached versus how many coupons already
carry a `milestoneIndex`, so a milestone can only ever produce one coupon and a
second call for the same one is rejected. The report just reads the orders and
coupons and adds them up (units sold, gross, discount, net, coupon counts); it
never writes anything, so it can't drift from the real state — net always equals
gross minus discount because that's exactly what each order stored.

## Invariants I'm holding to

- Stock is never negative and never oversold.
- A checkout creates at most one order; a retried checkout returns the original.
- A coupon is redeemed at most once, and only by a checkout that succeeds.
- A cart can be checked out only once.
- Order totals are whole cents and never negative. A percentage discount is
  floored to whole cents with `floor(subtotal * percent / 100)`, and the total is
  the subtotal minus that discount.
- The report never changes state and always reconciles with it.

## Ambiguities I had to settle

- Price changing between add and checkout: the cart always shows the current
  catalog price, and the order locks the price in at checkout via a snapshot.
  Nobody gets surprised, and past orders never change.
- What counts toward "every nth order": only orders that were actually placed. A
  failed checkout doesn't move the counter, and each milestone yields one coupon.
- Cart lifecycle: a cart is single-use. Once it's checked out, it's closed.
- Discount larger than the total: the total is clamped at zero, so a coupon can
  never make an order negative.
- Bad input like an empty cart, a non-positive quantity, or an unknown product:
  rejected before any state changes, each with its own error code.

## Running more than one instance

Right now correctness comes from a single process: an in-memory store plus one
mutex that serializes checkout. That doesn't survive horizontal scaling, since
separate processes wouldn't share the lock or the data. The same guarantees would
move into a database. Stock becomes a conditional `UPDATE ... WHERE stock >= qty`
(or a `SELECT ... FOR UPDATE`) inside a transaction, the idempotency key becomes a
unique constraint, and coupon redemption becomes a single-row conditional update.
The service stays stateless, and the database becomes both the source of truth and
the thing that arbitrates concurrency. A distributed lock like Redis would also
work, but I'd rather let the database enforce it than run a lock of my own.

## What I left out on purpose

Auth, real persistence and migrations, payments, pagination, and rate limiting.
All of them are reasonable for production, and none are needed to show the
checkout and coupon correctness this task is about. State resets on restart, which
I'm treating as fine for the timebox.

## With more time

- Move the store to Postgres and re-express these invariants as transactions and constraints, as above.
- Add concurrency tests aimed specifically at coupon redemption, not just stock.
- Give idempotency keys a TTL instead of keeping them in memory forever.
- A little structured logging and stricter input validation at the edges.

## How I used AI

I used an AI assistant mainly to move faster on the repetitive parts, like route
wiring, test scaffolding, and boilerplate types, so I could spend my own time on
the decisions that actually matter here: the invariants, the concurrency and
idempotency approach, and the shape of the API. I treated its output as a draft
and reshaped it rather than taking it as-is. Where it leaned toward heavier
abstractions, I kept things deliberately small, for example a single `AppError`
with one error middleware and in-memory stores instead of a database. I
understand every part of the result and can change it.
