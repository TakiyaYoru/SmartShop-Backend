// File: server/data/models/user.js
// CẬP NHẬT User Schema để thêm các field cho forgot password

import mongoose from "mongoose";

let Schema = mongoose.Schema;
let String = Schema.Types.String;

export const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: String,
    lastName: String,
    role: {
      type: String,
      enum: ['admin', 'manager', 'customer'],
      default: 'customer',
    },
    phone: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    

    passwordResetOTP: {
      type: String,
      default: null
    },
    passwordResetOTPExpires: {
      type: Date,
      default: null
    },
    passwordResetEmail: {
      type: String, // Email được dùng để reset (để tránh confusion)
      default: null
    },
    
    // Email verification (giữ lại nếu cần)
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      default: null
    }
  },
  {
    collection: "users",
    timestamps: true,
  }
);