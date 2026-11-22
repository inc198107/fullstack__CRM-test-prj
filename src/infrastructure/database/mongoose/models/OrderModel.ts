import { InferSchemaType, model, Schema } from "mongoose";

const orderSchema = new Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  order: {
    type: Number,
    required: true,
  },
  list: [
    {
      name: {
        type: String,
      },
      quantity: {
        type: Number,
      },
      cost: {
        type: Number,
      },
    },
  ],
  user: {
    ref: "users",
    type: Schema.Types.ObjectId,
  },
});

export type OrderDocument = InferSchemaType<typeof orderSchema>;
export const OrderModel = model("orders", orderSchema);
