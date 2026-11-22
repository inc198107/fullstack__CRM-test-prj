import type { UserRepository, CreateUserInput } from "../../../../application/ports/UserRepository";
import type { User } from "../../../../domain/user/User";
import { UserModel } from "../models/UserModel";

function toDomainUser(document: InstanceType<typeof UserModel>): User {
  return {
    id: document._id.toString(),
    email: document.email,
    passwordHash: document.password,
  };
}

export class MongooseUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const document = await UserModel.findOne({ email });
    return document ? toDomainUser(document) : null;
  }

  async findById(id: string): Promise<User | null> {
    const document = await UserModel.findById(id).select("email password");
    return document ? toDomainUser(document) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const document = await new UserModel({
      email: input.email,
      password: input.passwordHash,
    }).save();
    return toDomainUser(document);
  }
}
