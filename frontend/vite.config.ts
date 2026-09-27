import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy the API routes to the backend so the browser can use relative paths.
const backend = "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    proxy: {
      "/products": backend,
      "/carts": backend,
      "/orders": backend,
      "/coupons": backend,
      "/admin": backend,
      "/health": backend,
    },
  },
});
