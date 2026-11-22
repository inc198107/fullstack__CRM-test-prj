import type { PasswordHasher } from "../../ports/PasswordHasher";
import type { TokenIssuer } from "../../ports/TokenIssuer";
import type { UserRepository } from "../../ports/UserRepository";

export type LoginResult =
  | { kind: "authenticated"; token: string }
  | { kind: "user-not-found" }
  | { kind: "wrong-credentials" };

export class Login {
  private readonly users: UserRepository;
  private readonly passwords: PasswordHasher;
  private readonly tokens: TokenIssuer;

  constructor(users: UserRepository, passwords: PasswordHasher, tokens: TokenIssuer) {
    this.users = users;
    this.passwords = passwords;
    this.tokens = tokens;
  }

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return { kind: "user-not-found" };
    }

    if (!(await this.passwords.verify(password, user.passwordHash))) {
      return { kind: "wrong-credentials" };
    }

    return {
      kind: "authenticated",
      token: this.tokens.issue({ email: user.email, userId: user.id }),
    };
  }
}
