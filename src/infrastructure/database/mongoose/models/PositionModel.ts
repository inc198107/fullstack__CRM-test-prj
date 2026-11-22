import { InferSchemaType, model, Schema } from "mongoose";

const positionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  category: {
    ref: "categories",
    type: Schema.Types.ObjectId,
  },
  user: {
    ref: "users",
    type: Schema.Types.ObjectId,
  },
});

export type PositionDocument = InferSchemaType<typeof positionSchema>;
export const PositionModel = model("positions", positionSchema);
