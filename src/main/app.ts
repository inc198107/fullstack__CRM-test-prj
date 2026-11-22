import passport from "passport";

import { createAuthController } from "../adapters/http/controllers/auth";
import { createHttpApplication } from "../adapters/http/app";
import { Login } from "../application/use-cases/auth/Login";
import { Register } from "../application/use-cases/auth/Register";
import { configurePassport } from "../infrastructure/auth/passportJwt";
import { runtime } from "../infrastructure/config";
import { MongooseUserRepository } from "../infrastructure/database/mongoose/repositories/MongooseUserRepository";
import { BcryptPasswordHasher } from "../infrastructure/security/BcryptPasswordHasher";
import { JwtTokenIssuer } from "../infrastructure/security/JwtTokenIssuer";

export function createApplication() {
  const users = new MongooseUserRepository();
  const passwords = new BcryptPasswordHasher();
  const tokens = new JwtTokenIssuer(runtime.jwt);
  const authController = createAuthController({
    login: new Login(users, passwords, tokens),
    register: new Register(users, passwords),
  });

  configurePassport(passport, users, runtime.jwt);
  return createHttpApplication({ passport, authController });
}

export const app = createApplication();
