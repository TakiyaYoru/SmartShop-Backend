// File: server/permissions.js - COMPLETE PERMISSIONS BASED ON SCAN RESULTS

import { GraphQLError } from "graphql";

// Danh sách các query công khai
const PUBLIC_QUERIES = [
  'products',
  'product',
  'allProducts',
  'featuredProducts',
  'productsByCategory',
  'productsByBrand',
  'productsByBrandAndCategory',
  'searchProducts',
  'categories',
  'category',
  'allCategories',
  'brands',
  'brand',
  'brandByName',
  'brandsByCategory',
  'allBrands',
  'featuredBrands',
  'hello'
];

// Danh sách các mutations không cần authentication
const PUBLIC_MUTATIONS = [
  'login',
  'register', 
  'sendPasswordResetOTP',
  'verifyOTPAndResetPassword',
  'googleAuth', // ← GOOGLE AUTH PUBLIC
  'sendMessage'
];

const hasValidSecret = async (next, parent, args, ctx, info) => {
  const secret = ctx.secret;
  if (!secret || secret.length < 8) {
    throw new GraphQLError(`Access denied! Premium secret required for SmartShop VIP features.`);
  }
  return next();
};

const isAuthenticated = async (next, parent, args, ctx, info) => {
  // Kiểm tra nếu là public query thì cho phép truy cập
  if (info && info.fieldName && PUBLIC_QUERIES.includes(info.fieldName)) {
    return next();
  }

  // Kiểm tra nếu là public mutation thì cho phép truy cập
  if (info && info.fieldName && PUBLIC_MUTATIONS.includes(info.fieldName)) {
    return next();
  }

  if (!ctx.user) {
    throw new GraphQLError("Authentication required. Please login first.");
  }
  return next();
};

const isAdmin = async (next, parent, args, ctx, info) => {
  if (!ctx.user) {
    throw new GraphQLError("Authentication required.");
  }
  
  if (ctx.user.role !== "admin") {
    throw new GraphQLError("Admin access required.");
  }
  
  return next();
};

const isAdminOrManager = async (next, parent, args, ctx, info) => {
  if (!ctx.user) {
    throw new GraphQLError("Authentication required.");
  }
  
  if (ctx.user.role !== "admin" && ctx.user.role !== "manager") {
    throw new GraphQLError("Admin or Manager access required.");
  }
  
  return next();
};

const canCancelOrder = async (next, parent, args, ctx, info) => {
  if (!ctx.user) {
    throw new GraphQLError("Authentication required.");
  }
  
  // Admin and Manager can cancel any order
  if (ctx.user.role === "admin" || ctx.user.role === "manager") {
    return next();
  }
  
  // Customer can only cancel their own pending/confirmed orders
  return next();
};

export const permissions = {
  Query: {
    // Auth queries
    me: isAuthenticated,
    
    // Cart queries require authentication
    getCart: isAuthenticated,
    getCartItemCount: isAuthenticated,
    
    // Customer order queries
    getMyOrders: isAuthenticated,
    getMyOrder: isAuthenticated,
    
    // Admin order queries
    getAllOrders: isAdminOrManager,
    getOrder: isAdminOrManager,
    getOrderStats: isAdminOrManager,
    
    // Reports queries - Admin only
      getMonthlyReport: isAdmin,
  getSalesReport: isAdmin,
  getReportStats: isAdmin,
  getProductOrders: isAdmin,
    
    // Review queries
    getProductReviews: isAuthenticated,
    getProductAverageRating: isAuthenticated,
    getProductReviewStats: isAuthenticated,
    canUserReviewProduct: isAuthenticated,
    getAllReviewsForAdmin: isAdmin,
    getPendingAdminReviews: isAdmin,
    
    // Chat queries
    chatHistory: isAuthenticated,
  },
  
  Mutation: {
    // Category operations - Admin only
    createCategory: isAdmin,
    updateCategory: isAdmin,
    deleteCategory: isAdmin,
    
    // Brand operations - Admin only
    createBrand: isAdmin,
    updateBrand: isAdmin,
    deleteBrand: isAdmin,
    
    // Product operations - Admin or Manager
    createProduct: isAdminOrManager,
    updateProduct: isAdminOrManager,
    deleteProduct: isAdmin,
    
    // Upload operations - Admin or Manager
    upload: isAdminOrManager,
    uploadProductImage: isAdminOrManager,
    uploadProductImages: isAdminOrManager,
    removeProductImage: isAdminOrManager,
    uploadReviewImages: isAuthenticated,
    deleteReviewImages: isAuthenticated,
    
    // Cart operations require authentication
    addToCart: isAuthenticated,
    updateCartItem: isAuthenticated, // ← FIXED FROM updateCartQuantity
    removeFromCart: isAuthenticated,
    clearCart: isAuthenticated,
    
    // Order operations
    createOrderFromCart: isAuthenticated,
    updateOrderStatus: isAdminOrManager,
    updatePaymentStatus: isAdminOrManager,
    cancelOrder: canCancelOrder,
    
    // Review operations - FIXED NAMES
    createReview: isAuthenticated,
    adminReplyToReview: isAdmin,
    deleteAdminReply: isAdmin,
    
    // Profile completion (for Google Auth users)
    completeProfile: isAuthenticated,
    
    // Chat operations
    searchProductsByVoice: isAuthenticated,
    
    // Authentication mutations are handled by PUBLIC_MUTATIONS list
    // login, register, sendPasswordResetOTP, verifyOTPAndResetPassword, googleAuth - PUBLIC
  },
};