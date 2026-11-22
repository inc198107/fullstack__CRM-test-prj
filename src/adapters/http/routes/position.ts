import { Router } from "express";

import { create, getByCategoryId, remove, update } from "../controllers/position";

export function createPositionRouter(): Router {
  const router = Router();
  router.get("/:categoryId", getByCategoryId);
  router.post("/", create);
  router.patch("/:id", update);
  router.delete("/:id", remove);
  return router;
}
