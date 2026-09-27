import { randomUUID } from "node:crypto";

import {
  carts,
  products,
  orders,
  coupons,
  idempotencyKeys,
  counters,
  type Order,
  type OrderItem,
  type Coupon,
} from "../store";
import { applyPercent } from "../money";
import { AppError } from "../errors";
import { Mutex } from "../lock";

const checkoutLock = new Mutex();

type CheckoutInput = {
  cartId: string;
  couponCode?: string | null;
  idempotencyKey?: string | null;
};

type CheckoutResult = { order: Order; created: boolean };

export function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  return checkoutLock.runExclusive(() => runCheckout(input));
}

// Runs inside the mutex; validates everything before mutating, so a failed checkout changes nothing.
function runCheckout({ cartId, couponCode, idempotencyKey }: CheckoutInput): CheckoutResult {
  if (idempotencyKey) {
    const existingId = idempotencyKeys.get(idempotencyKey);
    if (existingId) return { order: orders.get(existingId)!, created: false };
  }

  const cart = carts.get(cartId);
  if (!cart) throw new AppError(404, "CART_NOT_FOUND", `No cart with id ${cartId}`);
  if (cart.status === "CHECKED_OUT") {
    throw new AppError(409, "CART_ALREADY_CHECKED_OUT", "This cart was already checked out");
  }
  if (cart.items.size === 0) {
    throw new AppError(422, "EMPTY_CART", "Cannot checkout an empty cart");
  }

  const lines: OrderItem[] = [];
  for (const [productId, qty] of cart.items) {
    const product = products.get(productId);
    if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", `No product with id ${productId}`);
    if (qty > product.stock) {
      throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${product.stock} of ${product.name} in stock`);
    }
    lines.push({ productId, name: product.name, unitPriceCents: product.priceCents, qty });
  }

  const coupon = couponCode ? requireRedeemableCoupon(couponCode) : null;

  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.qty, 0);
  const discountCents = coupon ? applyPercent(subtotalCents, coupon.percentOff) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);

  // Past this point we only mutate state; no more throwing.
  for (const line of lines) {
    products.get(line.productId)!.stock -= line.qty;
  }

  const order: Order = {
    id: randomUUID(),
    cartId,
    items: lines,
    subtotalCents,
    discountCents,
    totalCents,
    couponCode: coupon?.code ?? null,
    createdAt: new Date().toISOString(),
  };
  orders.set(order.id, order);

  if (coupon) {
    coupon.redeemed = true;
    coupon.redeemedOrderId = order.id;
  }
  cart.status = "CHECKED_OUT";
  counters.ordersPlaced += 1;
  if (idempotencyKey) idempotencyKeys.set(idempotencyKey, order.id);

  return { order, created: true };
}

function requireRedeemableCoupon(code: string): Coupon {
  const coupon = coupons.get(code);
  if (!coupon) throw new AppError(404, "COUPON_NOT_FOUND", `No coupon ${code}`);
  if (coupon.redeemed) throw new AppError(409, "COUPON_ALREADY_REDEEMED", "This coupon was already used");
  return coupon;
}
