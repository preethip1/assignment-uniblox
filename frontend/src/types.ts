export type Product = { id: string; name: string; priceCents: number; stock: number; price: string };

export type CartItem = {
  productId: string;
  name: string;
  priceCents: number;
  price: string;
  qty: number;
  lineTotalCents: number;
  lineTotal: string;
};

export type Cart = { id: string; status: string; items: CartItem[]; subtotalCents: number; subtotal: string };

export type Order = {
  id: string;
  totalCents: number;
  discountCents: number;
  couponCode: string | null;
};

export type Coupon = { code: string; percentOff: number };

export type Report = {
  totalOrders: number;
  couponEveryNOrders: number;
  discountPercent: number;
  itemsSold: { productId: string; name: string; qty: number }[];
  grossRevenue: string;
  totalDiscount: string;
  netRevenue: string;
  coupons: { generated: number; available: number; redeemed: number };
};
