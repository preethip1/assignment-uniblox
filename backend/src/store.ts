export type Product = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
};

// A cart holds quantities only; prices are read from the catalog when needed.
export type Cart = {
  id: string;
  items: Map<string, number>; // productId -> quantity
  status: "OPEN" | "CHECKED_OUT";
};

export type OrderItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
};

export type Order = {
  id: string;
  cartId: string;
  items: OrderItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  couponCode: string | null;
  createdAt: string;
};

export type Coupon = {
  code: string;
  percentOff: number;
  redeemed: boolean;
  redeemedOrderId: string | null;
  milestoneIndex?: number; // set when the coupon was generated for an nth-order milestone
};

export const products = new Map<string, Product>();
export const carts = new Map<string, Cart>();
export const orders = new Map<string, Order>();
export const coupons = new Map<string, Coupon>();
export const idempotencyKeys = new Map<string, string>(); // Idempotency-Key -> orderId
export const counters = { ordersPlaced: 0 };

// Coupon rule: every nth order earns one coupon worth this percent off.
export const config = {
  nthOrder: Number(process.env.NTH_ORDER) || 5,
  discountPercent: Number(process.env.DISCOUNT_PERCENT) || 10,
};

function seed(): void {
  products.clear();
  const catalog: Product[] = [
    { id: "p1", name: "Mechanical Keyboard", priceCents: 7999, stock: 25 },
    { id: "p2", name: "Wireless Mouse", priceCents: 2999, stock: 3 }, // kept low to test overselling later
    { id: "p3", name: "USB-C Hub", priceCents: 4550, stock: 40 },
    { id: "p4", name: '27" Monitor', priceCents: 21999, stock: 10 },
    { id: "p5", name: "Laptop Stand", priceCents: 3499, stock: 15 },
  ];
  for (const p of catalog) products.set(p.id, { ...p });
}

// Reseed to a clean state; tests call this so every run starts identical.
export function reset(): void {
  carts.clear();
  orders.clear();
  coupons.clear();
  idempotencyKeys.clear();
  counters.ordersPlaced = 0;
  seed();
}

seed();
