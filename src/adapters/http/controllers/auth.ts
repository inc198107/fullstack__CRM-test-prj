import type { Request, RequestHandler, Response } from "express";

import type { Login } from "../../../application/use-cases/auth/Login";
import type { Register } from "../../../application/use-cases/auth/Register";
import type { User } from "../../../domain/user/User";

type AuthBody = {
  email: string;
  password: string;
};

type LoginResponse = { accessToken: string } | { message: string };
type RegisterResponse = { new_user: RegisteredUser } | { message: string };
type LogoutResponse = { message: string };
type RegisteredUser = { _id: string; email: string; password: string };

export interface AuthControllerDependencies {
  login: Login;
  register: Register;
}

export interface AuthController {
  login: RequestHandler<unknown, LoginResponse, AuthBody>;
  register: RequestHandler<unknown, RegisterResponse, AuthBody>;
  logout: RequestHandler<unknown, LogoutResponse>;
}

function registeredUserResponse(user: User): RegisteredUser {
  return { _id: user.id, email: user.email, password: user.passwordHash };
}

export function createAuthController({ login, register }: AuthControllerDependencies): AuthController {
  return {
    login: async (
      req: Request<unknown, LoginResponse, AuthBody>,
      res: Response<LoginResponse>,
    ): Promise<void> => {
      const result = await login.execute(req.body.email, req.body.password);
      switch (result.kind) {
        case "authenticated":
          res.status(200).json({ accessToken: `Bearer ${result.token}` });
          return;
        case "user-not-found":
          res.status(404).json({ message: "User not found" });
          return;
        case "wrong-credentials":
          res.status(401).json({ message: "Wrong credentials" });
      }
    },
    register: async (
      req: Request<unknown, RegisterResponse, AuthBody>,
      res: Response<RegisterResponse>,
    ): Promise<void> => {
      const result = await register.execute(req.body.email, req.body.password);
      if (result.kind === "email-already-exists") {
        res.status(409).json({ message: "Email already exist" });
        return;
      }
      res.status(201).json({ new_user: registeredUserResponse(result.user) });
    },
    logout: (_req, res): void => {
      res.status(200).json({ message: "logged out " });
    },
  };
}
