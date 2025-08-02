import mongoose from "mongoose";

let Schema = mongoose.Schema;
let String = Schema.Types.String;
let Number = Schema.Types.Number;

export const WishlistSchema = new Schema(
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
    // Thứ tự hiển thị trong wishlist
    displayOrder: {
      type: Number,
      default: 0,
    },
    // Snapshot thông tin sản phẩm tại thời điểm thêm vào wishlist
    productSnapshot: {
      name: String,
      price: Number,
      originalPrice: Number,
      images: [String],
      sku: String,
      brand: String,
      category: String,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "wishlists",
    timestamps: true,
  }
);

// Index để query nhanh
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
WishlistSchema.index({ userId: 1, displayOrder: 1 });
WishlistSchema.index({ userId: 1, addedAt: -1 });

// Pre-save middleware để tự động set displayOrder
WishlistSchema.pre('save', async function(next) {
  if (this.isNew && !this.displayOrder) {
    // Tìm displayOrder cao nhất hiện tại của user này
    const maxOrder = await mongoose.model('Wishlist').findOne(
      { userId: this.userId },
      { displayOrder: 1 }
    ).sort({ displayOrder: -1 });
    
    this.displayOrder = maxOrder ? maxOrder.displayOrder + 1 : 1;
  }
  next();
}); 