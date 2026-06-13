import { Router } from "express";
import { repository } from "../db/index.js";

export const metricsRoutes = Router();

metricsRoutes.get("/tests-over-time", async (req, res, next) => {
  try {
    const repo = typeof req.query.repo === "string" ? req.query.repo : undefined;
    const branch = typeof req.query.branch === "string" ? req.query.branch : undefined;
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const granularity = typeof req.query.granularity === "string" ? req.query.granularity : undefined;

    const data = await repository.getTestsOverTime(repo, branch, from, to, granularity);

    res.json({ data, meta: { repo: repo ?? null, branch: branch ?? null, granularity: granularity ?? null } });
  } catch (error) {
    next(error);
  }
});
