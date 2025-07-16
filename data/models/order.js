import mongoose from "mongoose";

let Schema = mongoose.Schema;
let String = Schema.Types.String;
let Number = Schema.Types.Number;

export const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerInfo: {
      fullName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      notes: String, // Ghi chú từ khách hàng
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'bank_transfer'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: Date,
    processedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    customerNotes: String,
    adminNotes: String,
  },
  {
    collection: "orders",
    timestamps: true,
  }
);

// Index để query nhanh
OrderSchema.index({ userId: 1, orderDate: -1 });
OrderSchema.index({ status: 1, orderDate: -1 });
OrderSchema.index({ orderNumber: 1 });