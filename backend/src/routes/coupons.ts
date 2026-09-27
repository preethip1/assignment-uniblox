import { Router } from "express";
import { coupons } from "../store";
import { AppError } from "../errors";

export const couponsRouter = Router();

couponsRouter.get("/:code", (req, res) => {
  const coupon = coupons.get(req.params.code);
  if (!coupon) throw new AppError(404, "COUPON_NOT_FOUND", `No coupon ${req.params.code}`);
  res.json({ code: coupon.code, percentOff: coupon.percentOff, redeemed: coupon.redeemed });
});
