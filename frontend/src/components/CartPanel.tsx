import { useEffect, useState } from "react";
import { Add, Remove, ShoppingCartOutlined } from "@mui/icons-material";
import { Box, Button, Divider, IconButton, Paper, Stack, TextField, Typography } from "@mui/material";

import { api } from "../api";
import { brandGradient } from "../theme";
import type { Cart } from "../types";

type Props = {
  cart: Cart | null;
  coupon: string;
  activeCoupon: { code: string; percentOff: number } | null;
  onCoupon: (value: string) => void;
  onChangeQty: (productId: string, qty: number) => void;
  onCheckout: () => void;
};

const usd = (cents: number) => (cents / 100).toFixed(2);

export default function CartPanel({ cart, coupon, activeCoupon, onCoupon, onChangeQty, onCheckout }: Props) {
  const items = cart?.items ?? [];
  const subtotalCents = cart?.subtotalCents ?? 0;

  const [couponInfo, setCouponInfo] = useState<{ percentOff: number; redeemed: boolean } | null>(null);
  const [couponError, setCouponError] = useState(false);

  // Look up the entered coupon (debounced) so we can preview the discount.
  useEffect(() => {
    const code = coupon.trim();
    if (!code) {
      setCouponInfo(null);
      setCouponError(false);
      return;
    }
    const timer = setTimeout(() => {
      api
        .getCoupon(code)
        .then((c) => {
          setCouponInfo({ percentOff: c.percentOff, redeemed: c.redeemed });
          setCouponError(false);
        })
        .catch(() => {
          setCouponInfo(null);
          setCouponError(true);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [coupon]);

  const discountApplies = couponInfo !== null && !couponInfo.redeemed && subtotalCents > 0;
  const discountCents = discountApplies ? Math.floor((subtotalCents * couponInfo.percentOff) / 100) : 0;
  const totalCents = subtotalCents - discountCents;

  const couponHelp = couponError
    ? "No coupon with that code"
    : couponInfo?.redeemed
      ? "This coupon has already been used"
      : discountApplies
        ? `${couponInfo.percentOff}% off applied`
        : " ";

  return (
    <Paper variant="outlined" sx={{ p: 3, borderColor: "divider", position: { md: "sticky" }, top: 88 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <ShoppingCartOutlined fontSize="small" color="primary" />
        <Typography variant="h6">Your cart</Typography>
      </Stack>

      {items.length === 0 ? (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">Your cart is empty.</Typography>
          <Typography variant="caption" color="text.secondary">Add products to get started.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5} divider={<Divider flexItem />}>
          {items.map((i) => (
            <Box key={i.productId} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{i.name}</Typography>
                <Typography variant="caption" color="text.secondary">${i.price} · line ${i.lineTotal}</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", border: 1, borderColor: "divider", borderRadius: 2 }}>
                <IconButton size="small" onClick={() => onChangeQty(i.productId, i.qty - 1)}><Remove fontSize="small" /></IconButton>
                <Typography variant="body2" sx={{ width: 22, textAlign: "center" }}>{i.qty}</Typography>
                <IconButton size="small" onClick={() => onChangeQty(i.productId, i.qty + 1)}><Add fontSize="small" /></IconButton>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Divider sx={{ my: 2.5 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
        <Typography color="text.secondary">Subtotal</Typography>
        <Typography sx={{ textDecoration: discountApplies ? "line-through" : "none" }} color="text.secondary">
          ${usd(subtotalCents)}
        </Typography>
      </Box>

      {discountApplies && (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography color="success.main">Discount ({couponInfo.percentOff}%)</Typography>
            <Typography color="success.main">−${usd(discountCents)}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="h6">Total</Typography>
            <Typography variant="h6">${usd(totalCents)}</Typography>
          </Box>
        </>
      )}

      <TextField
        label="Coupon code"
        size="small"
        fullWidth
        value={coupon}
        onChange={(e) => onCoupon(e.target.value)}
        error={couponError || couponInfo?.redeemed === true}
        helperText={couponHelp}
        sx={{ mt: 1.5, mb: 1.5 }}
      />

      {activeCoupon ? (
        coupon.trim() === activeCoupon.code ? (
          <Typography variant="caption" color="success.main" sx={{ display: "block", mb: 1.5 }}>
            Coupon applied: {activeCoupon.code}
          </Typography>
        ) : (
          <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: 1.25, mb: 1.5, borderRadius: 2, bgcolor: "background.default" }}
          >
            <Typography variant="caption">
              Coupon available: <strong>{activeCoupon.code}</strong> ({activeCoupon.percentOff}% off)
            </Typography>
            <Button size="small" onClick={() => onCoupon(activeCoupon.code)}>Apply</Button>
          </Box>
        )
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
          No coupons are active.
        </Typography>
      )}

      <Button
        fullWidth
        size="large"
        variant="contained"
        disableElevation
        disabled={items.length === 0}
        onClick={onCheckout}
        sx={{ py: 1.25, background: items.length ? brandGradient : undefined }}
      >
        Checkout · ${usd(totalCents)}
      </Button>
    </Paper>
  );
}
