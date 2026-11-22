import { InferSchemaType, model, Schema } from "mongoose";

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  imageSrc: {
    type: String,
    default: "",
  },
  user: {
    ref: "users",
    type: Schema.Types.ObjectId,
  },
});

export type CategoryDocument = InferSchemaType<typeof categorySchema>;
export const CategoryModel = model("categories", categorySchema);
