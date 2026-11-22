import type { PasswordHasher } from "../../ports/PasswordHasher";
import type { UserRepository } from "../../ports/UserRepository";
import type { User } from "../../../domain/user/User";

export type RegisterResult =
  | { kind: "registered"; user: User }
  | { kind: "email-already-exists" };

export class Register {
  private readonly users: UserRepository;
  private readonly passwords: PasswordHasher;

  constructor(users: UserRepository, passwords: PasswordHasher) {
    this.users = users;
    this.passwords = passwords;
  }

  async execute(email: string, password: string): Promise<RegisterResult> {
    if (await this.users.findByEmail(email)) {
      return { kind: "email-already-exists" };
    }

    const passwordHash = await this.passwords.hash(password);
    const user = await this.users.create({ email, passwordHash });
    return { kind: "registered", user };
  }
}
