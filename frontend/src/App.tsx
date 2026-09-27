import { useEffect, useState } from "react";
import { ShoppingCartOutlined } from "@mui/icons-material";
import { Alert, AppBar, Badge, Box, Container, Grid, Snackbar, Tab, Tabs, Toolbar, Typography } from "@mui/material";

import { api } from "./api";
import { brandGradient } from "./theme";
import type { Cart, Product } from "./types";
import ProductGrid from "./components/ProductGrid";
import CartPanel from "./components/CartPanel";
import AdminPanel from "./components/AdminPanel";

type Toast = { msg: string; kind: "success" | "error" };

export default function App() {
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [coupon, setCoupon] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; percentOff: number } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const notify = (msg: string, kind: Toast["kind"] = "success") => setToast({ msg, kind });
  const loadProducts = () => api.products().then((r) => setProducts(r.products));
  const startCart = () => api.createCart().then(setCart);

  useEffect(() => {
    Promise.all([loadProducts(), startCart()]).catch((e) => notify(e.message, "error"));
  }, []);

  const runOnCart = async (action: () => Promise<Cart>) => {
    try {
      setCart(await action());
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  const addToCart = (productId: string) => cart && runOnCart(() => api.addItem(cart.id, productId, 1));
  const changeQty = (productId: string, qty: number) =>
    cart && runOnCart(() => (qty <= 0 ? api.removeItem(cart.id, productId) : api.updateItem(cart.id, productId, qty)));

  const checkout = async () => {
    if (!cart) return;
    try {
      const order = await api.checkout(cart.id, coupon || null);
      notify(`Order placed — total $${(order.totalCents / 100).toFixed(2)}`);
      if (coupon) setActiveCoupon(null);
      setCoupon("");
      await Promise.all([loadProducts(), startCart()]);
    } catch (e) {
      notify((e as Error).message, "error");
    }
  };

  const cartCount = cart?.items.reduce((sum, i) => sum + i.qty, 0) ?? 0;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)" }}
      >
        <Toolbar>
          <Box
            sx={{ width: 34, height: 34, borderRadius: 2, background: brandGradient, color: "#fff", fontWeight: 800, display: "grid", placeItems: "center", mr: 1.5 }}
          >
            R
          </Box>
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>Rewards Store</Typography>
          <Badge badgeContent={cartCount} color="primary">
            <ShoppingCartOutlined />
          </Badge>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Shop" />
          <Tab label="Admin" />
        </Tabs>

        {tab === 0 ? (
          <>
            <Box sx={{ background: "linear-gradient(135deg,#eef2ff,#faf5ff)", border: 1, borderColor: "divider", borderRadius: 3, p: { xs: 3, md: 4 }, mb: 3 }}>
              <Typography variant="h4" gutterBottom>Shop the essentials</Typography>
              <Typography color="text.secondary">Add your gear and earn reward coupons as you order.</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <ProductGrid products={products} onAdd={addToCart} />
              </Grid>
              <Grid item xs={12} md={4}>
                <CartPanel cart={cart} coupon={coupon} onCoupon={setCoupon} onChangeQty={changeQty} onCheckout={checkout} activeCoupon={activeCoupon} />
              </Grid>
            </Grid>
          </>
        ) : (
          <AdminPanel notify={notify} onCouponGenerated={setActiveCoupon} />
        )}
      </Container>

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toast ? (
          <Alert severity={toast.kind} onClose={() => setToast(null)} variant="filled">
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
