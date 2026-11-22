import { Router } from "express";

import { analytics, overview } from "../controllers/analytics";

export function createAnalyticsRouter(): Router {
  const router = Router();
  router.get("/overview", overview);
  router.get("/analytics", analytics);
  return router;
}
