import { Router } from "express";
import { products } from "../store";
import { formatCents } from "../money";

export const productsRouter = Router();

productsRouter.get("/", (_req, res) => {
  const list = [...products.values()].map((p) => ({
    ...p,
    price: formatCents(p.priceCents),
  }));
  res.json({ products: list });
});
