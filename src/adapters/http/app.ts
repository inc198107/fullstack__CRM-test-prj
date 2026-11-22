import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import type { PassportStatic } from "passport";

import { errorHandler } from "./middleware/error";
import { createAnalyticsRouter } from "./routes/analytics";
import { createAuthRouter } from "./routes/auth";
import { createCategoryRouter } from "./routes/category";
import { createOrdersRouter } from "./routes/orders";
import { createPositionRouter } from "./routes/position";
import type { AuthController } from "./controllers/auth";

export interface HttpApplicationDependencies {
  passport: PassportStatic;
  authController: AuthController;
}

export function createHttpApplication({ passport, authController }: HttpApplicationDependencies): express.Express {
  const app = express();
  app.use(morgan("dev"));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cors());
  app.use(passport.initialize());

  app.use("/api/auth", createAuthRouter(authController));
  app.use("/api/analytics", createAnalyticsRouter());
  app.use("/api/category", createCategoryRouter(passport));
  app.use("/api/orders", createOrdersRouter());
  app.use("/api/position", createPositionRouter());
  app.use(errorHandler);
  return app;
}
