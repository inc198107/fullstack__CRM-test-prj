import type { UserRepository } from "../../application/ports/UserRepository";
import type { PassportStatic } from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import type { StrategyOptions, VerifiedCallback } from "passport-jwt";

function userIdFromPayload(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    typeof payload.userId === "string" &&
    /^[a-f\d]{24}$/i.test(payload.userId)
  ) {
    return payload.userId;
  }
  return null;
}

export function configurePassport(
  passport: PassportStatic,
  users: UserRepository,
  jwtSecret: string,
): void {
  const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
  };

  passport.use(new JwtStrategy(options, (payload: unknown, done: VerifiedCallback): void => {
    const userId = userIdFromPayload(payload);
    if (!userId) {
      done(null, false);
      return;
    }

    void users.findById(userId).then(
      (user) => done(null, user ?? false),
      (error: unknown) => done(error),
    );
  }));
}
