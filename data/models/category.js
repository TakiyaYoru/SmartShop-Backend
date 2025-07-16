import mongoose from "mongoose";

let Schema = mongoose.Schema;
let String = Schema.Types.String;

export const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    image: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "categories",
    timestamps: true,
  }
);