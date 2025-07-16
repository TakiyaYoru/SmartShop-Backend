import mongoose from "mongoose";

let Schema = mongoose.Schema;
let Number = Schema.Types.Number;

export const CartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    productName: {
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    collection: "carts",
    timestamps: true,
  }
);

// Compound index để đảm bảo 1 user chỉ có 1 item cho 1 product
CartSchema.index({ userId: 1, productId: 1 }, { unique: true });