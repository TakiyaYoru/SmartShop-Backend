import mongoose from "mongoose";

let Schema = mongoose.Schema;
let String = Schema.Types.String;
let Number = Schema.Types.Number;

export const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: Number,
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand', // Changed from String to ObjectId reference
      required: true,
    },
    images: [String],
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "products",
    timestamps: true,
  }
);