import { Router } from "express";

import { create, getAll } from "../controllers/orders";

export function createOrdersRouter(): Router {
  const router = Router();
  router.get("/", getAll);
  router.post("/", create);
  return router;
}
