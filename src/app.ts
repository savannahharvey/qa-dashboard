import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { authRoutes } from "./routes/authRoutes.js";
import { teamRoutes } from "./routes/teamRoutes.js";
import { metricsRoutes } from "./routes/metricsRoutes.js";

export function createApp() {
  const app = express();

  app.use(cors({ credentials: true, origin: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "qa-dashboard-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/teams", teamRoutes);
  app.use("/api/metrics", metricsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  };

  app.use(errorHandler);

  return app;
}
