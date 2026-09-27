import express, { type Express, type Request, type Response } from "express";

// Kept separate from server.ts so tests can hit the app without opening a port.
export function createApp(): Express {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  return app;
}
