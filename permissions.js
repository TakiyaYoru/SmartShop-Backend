// File: server/permissions.js - ALLOW CUSTOMER TO CANCEL THEIR OWN ORDERS

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
  'brands'
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

// ✅ NEW: Allow customers to cancel their own orders
const canCancelOrder = async (next, parent, args, ctx, info) => {
  if (!ctx.user) {
    throw new GraphQLError("Authentication required.");
  }
  
  // Admin and Manager can cancel any order
  if (ctx.user.role === "admin" || ctx.user.role === "manager") {
    return next();
  }
  
  // Customer can only cancel their own pending/confirmed orders
  // Additional validation will be done in the resolver
  return next();
};

export const permissions = {
  Query: {
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
    getAllReviewsForAdmin: isAdmin,
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
    
    // Cart operations - Customer access required
    addToCart: isAuthenticated,
    updateCartItem: isAuthenticated,
    removeFromCart: isAuthenticated,
    clearCart: isAuthenticated,
    
    // Order operations
    createOrderFromCart: isAuthenticated,     // Customer can create orders
    updateOrderStatus: isAdminOrManager,      // Admin/Manager can update status
    updatePaymentStatus: isAdminOrManager,    // Admin/Manager can update payment
    cancelOrder: canCancelOrder,             // ✅ FIXED: Customer can cancel their own orders

    createReview: isAuthenticated,
    adminReplyToReview: isAdmin,
  },
};