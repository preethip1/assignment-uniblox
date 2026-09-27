import express, { type Express } from "express";
import { healthRouter } from "./routes/health";
import { productsRouter } from "./routes/products";
import { cartsRouter } from "./routes/carts";
import { errorHandler } from "./errors";

// Kept separate from server.ts so tests can hit the app without opening a port.
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/products", productsRouter);
  app.use("/carts", cartsRouter);

  app.use(errorHandler);
  return app;
}
