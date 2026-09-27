import { Router } from "express";
import { randomUUID } from "node:crypto";

import { orders, coupons, counters, config, type Coupon } from "../store";
import { formatCents } from "../money";
import { AppError } from "../errors";

export const adminRouter = Router();

adminRouter.post("/coupons/generate", (_req, res) => {
  const reached = Math.floor(counters.ordersPlaced / config.nthOrder);
  if (reached === 0) {
    throw new AppError(
      422,
      "NO_MILESTONE_REACHED",
      `Need at least ${config.nthOrder} orders before a coupon can be generated`,
    );
  }

  const alreadyGenerated = [...coupons.values()].filter((c) => c.milestoneIndex !== undefined).length;
  if (alreadyGenerated >= reached) {
    throw new AppError(409, "COUPON_ALREADY_GENERATED", "The current milestone already has a coupon");
  }

  const coupon: Coupon = {
    code: `SAVE${config.discountPercent}-${randomUUID().slice(0, 8).toUpperCase()}`,
    percentOff: config.discountPercent,
    redeemed: false,
    redeemedOrderId: null,
    milestoneIndex: alreadyGenerated + 1,
  };
  coupons.set(coupon.code, coupon);
  res.status(201).json(coupon);
});

adminRouter.get("/report", (_req, res) => {
  const soldByProduct = new Map<string, { productId: string; name: string; qty: number }>();
  let grossRevenueCents = 0;
  let totalDiscountCents = 0;
  let netRevenueCents = 0;

  for (const order of orders.values()) {
    grossRevenueCents += order.subtotalCents;
    totalDiscountCents += order.discountCents;
    netRevenueCents += order.totalCents;
    for (const item of order.items) {
      const row = soldByProduct.get(item.productId) ?? { productId: item.productId, name: item.name, qty: 0 };
      row.qty += item.qty;
      soldByProduct.set(item.productId, row);
    }
  }

  const couponList = [...coupons.values()];
  const redeemed = couponList.filter((c) => c.redeemed).length;

  res.json({
    totalOrders: orders.size,
    couponEveryNOrders: config.nthOrder,
    discountPercent: config.discountPercent,
    itemsSold: [...soldByProduct.values()],
    grossRevenueCents,
    grossRevenue: formatCents(grossRevenueCents),
    totalDiscountCents,
    totalDiscount: formatCents(totalDiscountCents),
    netRevenueCents,
    netRevenue: formatCents(netRevenueCents),
    coupons: {
      generated: couponList.length,
      available: couponList.length - redeemed,
      redeemed,
    },
  });
});
