export interface AuthTokenClaims {
  email: string;
  userId: string;
}

export interface TokenIssuer {
  issue(claims: AuthTokenClaims): string;
}
