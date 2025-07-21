// File: server/data/models/user.js
// COMPLETE USER MODEL WITH GOOGLE AUTH

import mongoose from "mongoose";
import bcrypt from 'bcrypt';

let Schema = mongoose.Schema;
let String = Schema.Types.String;

export const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: function() {
        // Password chỉ bắt buộc nếu không phải Google user
        return !this.isGoogleUser;
      },
      minlength: 6
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: false, // Sẽ bắt buộc sau khi complete profile
      trim: true
    },
    address: {
      type: String,
      required: false, // Sẽ bắt buộc sau khi complete profile
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'customer'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    
    // Password Reset Fields
    passwordResetOTP: {
      type: String,
      default: null
    },
    passwordResetOTPExpires: {
      type: Date,
      default: null
    },
    passwordResetEmail: {
      type: String, // Email được dùng để reset
      default: null
    },
    
    // ===== GOOGLE OAUTH FIELDS =====
    googleId: {
      type: String,
      unique: true,
      sparse: true // Cho phép null, chỉ unique khi có giá trị
    },
    avatar: {
      type: String, // URL của Google profile picture
      default: null
    },
    isGoogleUser: {
      type: Boolean,
      default: false
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },
    // ===== END GOOGLE OAUTH FIELDS =====
    
  },
  {
    collection: "users",
    timestamps: true,
  }
);

// Index cho Google ID - chỉ define một lần
UserSchema.index({ googleId: 1 }, { sparse: true });

// Virtual cho full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook để hash password
UserSchema.pre('save', async function(next) {
  // Chỉ hash nếu password được modified và user không phải Google user
  if (!this.isModified('password') || this.isGoogleUser) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method để check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isGoogleUser) {
    return false; // Google user không có password
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method để check profile completion
UserSchema.methods.isProfileComplete = function() {
  return !!(this.phone && this.address && this.firstName && this.lastName);
};

// Update profileCompleted khi save
UserSchema.pre('save', function(next) {
  this.profileCompleted = this.isProfileComplete();
  next();
});

export const User = mongoose.model('User', UserSchema);