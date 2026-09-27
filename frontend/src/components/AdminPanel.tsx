import { useEffect, useState } from "react";
import { ContentCopy } from "@mui/icons-material";
import { Alert, Box, Button, Grid, IconButton, LinearProgress, Paper, Stack, Typography } from "@mui/material";

import { api } from "../api";
import { tileGradients } from "../theme";
import type { Coupon, Report } from "../types";

type Props = { notify: (msg: string, kind?: "success" | "error") => void };

export default function AdminPanel({ notify }: Props) {
  const [report, setReport] = useState<Report | null>(null);
  const [lastCoupon, setLastCoupon] = useState<Coupon | null>(null);

  const loadReport = () => api.report().then(setReport).catch((e) => notify(e.message, "error"));
  useEffect(() => {
    loadReport();
  }, []);

  const generate = () =>
    api
      .generateCoupon()
      .then((c) => {
        setLastCoupon(c);
        loadReport();
      })
      .catch((e) => notify(e.message, "error"));

  const n = report?.couponEveryNOrders ?? 0;
  const totalOrders = report?.totalOrders ?? 0;
  const generated = report?.coupons.generated ?? 0;
  const reached = n ? Math.floor(totalOrders / n) : 0;
  const canGenerate = reached > generated;
  const ordersIntoMilestone = n ? totalOrders % n : 0;
  const ordersUntilNext = n - ordersIntoMilestone;

  const progress = !report
    ? "Loading order count…"
    : n === 0
      ? "Place orders to unlock a reward coupon."
      : canGenerate
        ? "Milestone reached — generate your reward coupon."
        : `A coupon unlocks every ${n} orders (${report.discountPercent}% off). ${ordersUntilNext} more to go — ${totalOrders} placed so far.`;

  const dash = (v: string | number | undefined): string => (v === undefined ? "—" : String(v));

  return (
    <Grid container spacing={3}>
      <Grid item xs={6} sm={3}><StatTile i={0} label="Total orders" value={dash(report?.totalOrders)} /></Grid>
      <Grid item xs={6} sm={3}><StatTile i={2} label="Gross revenue" value={`$${dash(report?.grossRevenue)}`} /></Grid>
      <Grid item xs={6} sm={3}><StatTile i={1} label="Discounts" value={`$${dash(report?.totalDiscount)}`} /></Grid>
      <Grid item xs={6} sm={3}><StatTile i={4} label="Net revenue" value={`$${dash(report?.netRevenue)}`} /></Grid>

      <Grid item xs={12} md={7}>
        <Paper variant="outlined" sx={{ p: 3, borderColor: "divider" }}>
          <Typography variant="h6" gutterBottom>Reward coupons</Typography>
          <Typography variant="body2" color={canGenerate ? "success.main" : "text.secondary"} sx={{ mb: 1 }}>
            {progress}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={n ? (canGenerate ? 100 : (ordersIntoMilestone / n) * 100) : 0}
            sx={{ mb: 2.5, borderRadius: 1, height: 8 }}
          />

          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" disableElevation disabled={!canGenerate} onClick={generate}>Generate coupon</Button>
            <Button variant="outlined" onClick={loadReport}>Refresh</Button>
          </Stack>

          {lastCoupon && (
            <Alert
              severity="success"
              sx={{ mt: 2 }}
              action={
                <IconButton size="small" onClick={() => navigator.clipboard?.writeText(lastCoupon.code)}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              }
            >
              <strong>{lastCoupon.code}</strong> — {lastCoupon.percentOff}% off. Paste it into the cart's coupon field on the Shop tab.
            </Alert>
          )}
        </Paper>
      </Grid>

      <Grid item xs={12} md={5}>
        <Paper variant="outlined" sx={{ p: 3, borderColor: "divider", height: "100%" }}>
          <Typography variant="h6" gutterBottom>Coupon status</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <MiniStat label="Generated" value={dash(report?.coupons.generated)} />
            <MiniStat label="Available" value={dash(report?.coupons.available)} />
            <MiniStat label="Used" value={dash(report?.coupons.redeemed)} />
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
}

function StatTile({ label, value, i }: { label: string; value: string | number; i: number }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderColor: "divider", height: "100%" }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 2, background: tileGradients[i % tileGradients.length], mb: 1.5 }} />
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight={800}>{value}</Typography>
    </Paper>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ flex: 1, textAlign: "center", py: 1.5, borderRadius: 2, bgcolor: "background.default" }}>
      <Typography variant="h5" fontWeight={800}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );
}
