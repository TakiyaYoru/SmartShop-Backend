import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Types.ObjectId, required: true, ref: "Product" },
  userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  orderId: { type: mongoose.Types.ObjectId, required: false, ref: "Order" },
  rating: { type: Number, required: true, min: 0, max: 5 },
  comment: String,
  images: [String],
  createdAt: { type: Date, default: Date.now },
  adminReply: { type: String, default: null },
  adminReplyUpdatedAt: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },
}, {
  timestamps: true
});

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ isVerified: 1 });

export const Review = mongoose.model("Review", reviewSchema);