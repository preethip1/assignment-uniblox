import { Router } from "express";
import { orders } from "../store";
import { AppError } from "../errors";

export const ordersRouter = Router();

ordersRouter.get("/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", `No order with id ${req.params.id}`);
  res.json(order);
});
