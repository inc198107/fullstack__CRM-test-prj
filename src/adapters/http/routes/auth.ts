import { Router } from "express";

import type { AuthController } from "../controllers/auth";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  router.post("/login", controller.login);
  router.post("/register", controller.register);
  router.get("/logout", controller.logout);
  return router;
}
