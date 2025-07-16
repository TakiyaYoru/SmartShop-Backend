import mongoose from "mongoose";

let Schema = mongoose.Schema;
let String = Schema.Types.String;
let Number = Schema.Types.Number;
let Boolean = Schema.Types.Boolean;

export const BrandSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: String,
    banner: String,
    website: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    categories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
  },
  {
    collection: "brands",
    timestamps: true,
  }
);

// Pre-save middleware to generate slug
BrandSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});