import { Router } from "express";
import type { PassportStatic } from "passport";

import { create, getAll, getById, remove, update } from "../controllers/category";

export function createCategoryRouter(passport: PassportStatic): Router {
  const router = Router();
  router.get("/", passport.authenticate("jwt", { session: false }), getAll);
  router.get("/:id", getById);
  router.delete("/:id", remove);
  router.post("/", create);
  router.patch("/:id", update);
  return router;
}
