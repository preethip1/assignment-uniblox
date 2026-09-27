import type { RequestHandler } from "express";

// Forwards async handler rejections to the error middleware (Express 4 won't).
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
