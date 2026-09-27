# Rewards Store — UI

A minimal React + Material UI front end for the checkout & rewards API.

## Requirements

- Node.js 18+
- The backend running on `http://localhost:3000` (see [`../backend`](../backend))

## Run

Start the backend first (`cd ../backend && npm start`), then:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5000
```

The dev server proxies `/products`, `/carts`, `/orders`, `/coupons`, and `/admin`
to the backend on `http://localhost:3000` (see `vite.config.ts`).

- **Shop** — browse products, add to cart, adjust quantities, apply a coupon, checkout.
- **Admin** — generate a milestone coupon and view the sales report.
