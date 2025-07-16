import mongoose from "mongoose";

let Schema = mongoose.Schema;
let String = Schema.Types.String;
let Number = Schema.Types.Number;

export const OrderItemSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productSku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // Snapshot thông tin product tại thời điểm đặt hàng
    productSnapshot: {
      description: String,
      images: [String],
      brand: String,
      category: String,
    }
  },
  {
    collection: "orderItems",
    timestamps: true,
  }
);

// Index để query nhanh
OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ productId: 1 });
OrderItemSchema.index({ orderId: 1, createdAt: 1 });