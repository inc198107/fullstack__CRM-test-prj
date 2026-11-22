import jwt from "jsonwebtoken";

import type { AuthTokenClaims, TokenIssuer } from "../../application/ports/TokenIssuer";

export class JwtTokenIssuer implements TokenIssuer {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  issue(claims: AuthTokenClaims): string {
    return jwt.sign(claims, this.secret, { expiresIn: 60 * 60 });
  }
}
