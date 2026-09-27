import type { Cart, Coupon, Order, Product, Report } from "./types";

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

export const api = {
  products: () => req<{ products: Product[] }>("/products"),
  createCart: () => req<Cart>("/carts", { method: "POST" }),
  addItem: (id: string, productId: string, qty: number) =>
    req<Cart>(`/carts/${id}/items`, { method: "POST", body: JSON.stringify({ productId, qty }) }),
  updateItem: (id: string, productId: string, qty: number) =>
    req<Cart>(`/carts/${id}/items/${productId}`, { method: "PATCH", body: JSON.stringify({ qty }) }),
  removeItem: (id: string, productId: string) =>
    req<Cart>(`/carts/${id}/items/${productId}`, { method: "DELETE" }),
  getCoupon: (code: string) =>
    req<{ code: string; percentOff: number; redeemed: boolean }>(`/coupons/${encodeURIComponent(code)}`),
  checkout: (id: string, couponCode: string | null) =>
    req<Order>(`/carts/${id}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({ couponCode }),
    }),
  generateCoupon: () => req<Coupon>("/admin/coupons/generate", { method: "POST" }),
  report: () => req<Report>("/admin/report"),
};
