import { Router } from "express";
import { randomUUID } from "node:crypto";

import { carts, products, type Cart, type Product } from "../store";
import { formatCents } from "../money";
import { AppError } from "../errors";

export const cartsRouter = Router();

function requireCart(id: string): Cart {
  const cart = carts.get(id);
  if (!cart) throw new AppError(404, "CART_NOT_FOUND", `No cart with id ${id}`);
  return cart;
}

function requireProduct(id: unknown): Product {
  if (typeof id !== "string") throw new AppError(400, "INVALID_PRODUCT", "productId is required");
  const product = products.get(id);
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", `No product with id ${id}`);
  return product;
}

function assertPositiveQuantity(qty: unknown): asserts qty is number {
  if (typeof qty !== "number" || !Number.isInteger(qty) || qty <= 0) {
    throw new AppError(400, "INVALID_QUANTITY", "qty must be a positive integer");
  }
}

function assertStockAvailable(product: Product, wantedQty: number): void {
  if (wantedQty > product.stock) {
    throw new AppError(409, "INSUFFICIENT_STOCK", `Only ${product.stock} of ${product.name} in stock`);
  }
}

// Prices are resolved from the current catalog, so a cart always reflects
// today's price rather than whatever it was when the item was added.
function toCartView(cart: Cart) {
  const items = [...cart.items.entries()].map(([productId, qty]) => {
    const product = products.get(productId)!;
    const lineTotalCents = product.priceCents * qty;
    return {
      productId,
      name: product.name,
      priceCents: product.priceCents,
      price: formatCents(product.priceCents),
      qty,
      lineTotalCents,
      lineTotal: formatCents(lineTotalCents),
    };
  });
  const subtotalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
  return { id: cart.id, items, subtotalCents, subtotal: formatCents(subtotalCents) };
}

cartsRouter.post("/", (_req, res) => {
  const cart: Cart = { id: randomUUID(), items: new Map() };
  carts.set(cart.id, cart);
  res.status(201).json(toCartView(cart));
});

cartsRouter.get("/:id", (req, res) => {
  res.json(toCartView(requireCart(req.params.id)));
});

cartsRouter.post("/:id/items", (req, res) => {
  const cart = requireCart(req.params.id);
  const product = requireProduct(req.body?.productId);
  assertPositiveQuantity(req.body?.qty);

  const newQty = (cart.items.get(product.id) ?? 0) + req.body.qty;
  assertStockAvailable(product, newQty);

  cart.items.set(product.id, newQty);
  res.json(toCartView(cart));
});

cartsRouter.patch("/:id/items/:productId", (req, res) => {
  const cart = requireCart(req.params.id);
  const product = requireProduct(req.params.productId);
  assertPositiveQuantity(req.body?.qty);
  assertStockAvailable(product, req.body.qty);

  cart.items.set(product.id, req.body.qty);
  res.json(toCartView(cart));
});

cartsRouter.delete("/:id/items/:productId", (req, res) => {
  const cart = requireCart(req.params.id);
  if (!cart.items.delete(req.params.productId)) {
    throw new AppError(404, "ITEM_NOT_IN_CART", "That product is not in the cart");
  }
  res.json(toCartView(cart));
});
