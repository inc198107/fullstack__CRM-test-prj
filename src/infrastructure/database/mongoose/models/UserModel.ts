import { InferSchemaType, model, Schema } from "mongoose";

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    default: "",
  },
  password: {
    type: String,
    required: true,
  },
});

export type UserDocument = InferSchemaType<typeof userSchema>;
export const UserModel = model("users", userSchema);
