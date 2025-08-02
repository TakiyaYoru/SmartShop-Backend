// graphql/schema.js - PERFECT COMPLETE SCHEMA WITH ALL RESOLVERS

import { createSchema } from "graphql-yoga";
import _ from "lodash";

// Import all resolvers
import { resolvers as helloResolvers } from "./hello.js";
import { resolvers as categoriesResolvers } from "./categories.js";
import { resolvers as productsResolvers } from "./products.js";
import { resolvers as brandsResolvers } from "./brands.js";
import { resolvers as authenticationResolvers } from "./authentication.js";
import { resolvers as uploadResolvers } from "./upload.js";
import { resolvers as cartsResolvers } from "./carts.js";
import { resolvers as ordersResolvers } from "./orders.js";
import { resolvers as reviewsResolvers } from "./reviews.js";
import { resolvers as reviewUploadResolvers } from "./reviewUpload.js";
import { resolvers as chatResolvers } from "./chat.js";
import { resolvers as productComparisonResolvers } from "./productComparison.js";
import { resolvers as wishlistResolvers } from "./wishlist.js";
// import { imageSearchResolvers } from "./imageSearch.js";
import { resolvers as googleAuthResolvers } from "./googleAuth.js";
import { analyzeImageWithAI, searchProductsByImageAnalysis } from "../services/imageAnalysisService.js";

console.log('🔄 Perfect Schema - Loading with ALL resolvers...');

// COMPLETE TYPEDEFS WITH ALL RESOLVERS MAPPED
const completeTypeDefs = `
  scalar File

  # ===== MAIN TYPES =====
  type Query {
    _empty: String
    
    # Hello
    hello: String
    
    # Categories
    categories(
      first: Int = 10,
      offset: Int = 0,
      orderBy: CategoriesOrderBy = CREATED_DESC,
      condition: CategoryConditionInput
    ): CategoryConnection
    category(id: ID!): Category
    allCategories: [Category]
    
    # Products - ALL RESOLVERS INCLUDED
    products(
      first: Int = 10,
      offset: Int = 0,
      orderBy: ProductsOrderBy = CREATED_DESC,
      condition: ProductConditionInput
    ): ProductConnection
    product(id: ID!): Product
    searchProducts(query: String!): [Product]
    allProducts: [Product]
    featuredProducts: [Product]
    productsByCategory(categoryId: ID!): [Product]
    productsByBrand(brandId: ID!): [Product]
    productsByBrandAndCategory(brandId: ID!, categoryId: ID!): [Product]
    
    # Brands - ALL RESOLVERS INCLUDED
    brands(
      first: Int = 10,
      offset: Int = 0,
      orderBy: BrandsOrderBy = CREATED_DESC,
      condition: BrandConditionInput
    ): BrandConnection
    brand(id: ID, slug: String): Brand
    brandByName(name: String!): Brand
    brandsByCategory(categoryId: ID!): [Brand]
    allBrands: [Brand]
    featuredBrands: [Brand]
    
    # Auth
    me: UserInfo
    
    # Cart
    getCart: CartSummary
    getCartItemCount: Int
    
    # Orders
    getMyOrders: [Order]
    getMyOrder(orderNumber: String!): Order
    getAllOrders: OrderConnection
    getOrder(orderNumber: String!): Order
    getOrderStats: OrderStats
    
    # Reviews - ALL RESOLVERS INCLUDED
    getProductReviews(productId: ID!, filter: ReviewFilter): ReviewConnection!
    getProductAverageRating(productId: ID!): Float
    getProductReviewStats(productId: ID!): ReviewStats
    canUserReviewProduct(productId: ID!): ReviewEligibility
    getAllReviewsForAdmin(filter: ReviewFilter): ReviewConnection!
    getPendingAdminReviews(filter: ReviewFilter): ReviewConnection!
    
    # Chat
    chatHistory(userId: ID!): [ChatMessage]
    
    # Wishlist
    isProductInWishlist(productId: ID!): Boolean!
    getMyWishlist(first: Int = 20, offset: Int = 0): WishlistConnection!
    getWishlistItemCount: Int!
  }
  
  type Mutation {
    _empty: String
    
    # Categories
    createCategory(input: CategoryInput!): Category
    updateCategory(id: ID!, input: CategoryInput!): Category
    deleteCategory(id: ID!): ID
    
    # Products
    createProduct(input: ProductInput!): Product
    updateProduct(id: ID!, input: ProductInput!): Product
    deleteProduct(id: ID!): ID
    
    # Brands
    createBrand(input: BrandInput!): Brand
    updateBrand(id: ID!, input: BrandInput!): Brand
    deleteBrand(id: ID!): ID
    
    # Auth
    login(input: LoginInput!): LoginResponse
    register(input: RegisterInput!): RegisterResponse
    sendPasswordResetOTP(input: SendOTPInput!): GenericResponse
    verifyOTPAndResetPassword(input: VerifyOTPAndResetPasswordInput!): GenericResponse
    
    # Google Auth - INCLUDED
    googleAuth(input: GoogleAuthInput!): GoogleAuthResponse!
    completeProfile(input: CompleteProfileInput!): CompleteProfileResponse!
    
    # Upload
    upload(file: File!): String!
    uploadProductImage(productId: ID!, file: File!): UploadResult!
    uploadProductImages(productId: ID!, files: [File!]!): UploadResult!
    removeProductImage(productId: ID!, filename: String!): Boolean!
    
    # Cart
    addToCart(input: CartInput!): CartItem
    updateCartItem(input: UpdateCartInput!): CartItem
    removeFromCart(productId: ID!): Boolean
    clearCart: Boolean
    
    # Orders
    createOrderFromCart(input: CreateOrderInput!): Order
    updateOrderStatus(orderNumber: String!, status: OrderStatus!, adminNotes: String): Order
    updatePaymentStatus(orderNumber: String!, status: PaymentStatus!): Order
    cancelOrder(orderNumber: String!, reason: String): Order
    
    # Reviews
    createReview(input: ReviewInput!): Review
    adminReplyToReview(reviewId: ID!, reply: String!): Review
    deleteAdminReply(reviewId: ID!): Review
    uploadReviewImages(files: [File!]!): ReviewUploadResult!
    deleteReviewImages(filenames: [String!]!): Boolean!
    
    # Chat
    sendMessage(input: ChatInput!): ChatResponse!
    searchProductsByVoice(audioUrl: String!): ChatResponse!
    
    # Product Comparison
    compareProducts(input: CompareProductsInput!): ProductComparison!
    
    # Image Search
    searchByImage(input: ImageSearchInput!): ImageSearchResult!
    
    # Wishlist
    addToWishlist(productId: ID!): WishlistItem!
    removeFromWishlist(productId: ID!): Boolean!
    reorderWishlist(input: ReorderWishlistInput!): WishlistItem!
    moveWishlistItemUp(itemId: ID!): WishlistItem!
    moveWishlistItemDown(itemId: ID!): WishlistItem!
    removeMultipleFromWishlist(productIds: [ID!]!): Boolean!
  }

  # ===== GOOGLE AUTH TYPES =====
  input GoogleAuthInput {
    token: String!
  }

  type GoogleAuthResponse {
    success: Boolean!
    message: String!
    token: String
    user: UserInfo
    requiresProfileCompletion: Boolean!
  }

  input CompleteProfileInput {
    phone: String!
    address: String!
    firstName: String
    lastName: String
  }

  type CompleteProfileResponse {
    success: Boolean!
    message: String!
    user: UserInfo
  }

  # ===== AUTH TYPES =====
  type LoginResult {
    jwt: String!
    user: UserInfo!
  }

  type UserInfo {
    _id: ID!
    username: String!
    email: String!
    firstName: String
    lastName: String
    role: String!
  }

  type LoginResponse {
    success: Boolean!
    message: String!
    data: LoginResult
  }

  type RegisterResponse {
    success: Boolean!
    message: String!
    data: UserInfo
  }

  type GenericResponse {
    success: Boolean!
    message: String!
  }

  input LoginInput {
    username: String!
    password: String!
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phone: String
  }

  input SendOTPInput {
    email: String!
  }

  input VerifyOTPAndResetPasswordInput {
    email: String!
    otp: String!
    newPassword: String!
  }

  # ===== CATEGORY TYPES =====
  type Category {
    _id: ID!
    name: String!
    description: String
    image: String
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  enum CategoriesOrderBy {
    ID_ASC
    ID_DESC
    NAME_ASC
    NAME_DESC
    CREATED_ASC
    CREATED_DESC
  }

  type CategoryConnection {
    nodes: [Category]
    totalCount: Int
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  input CategoryConditionInput {
    name: String
    isActive: Boolean
  }

  input CategoryInput {
    name: String!
    description: String
    image: String
    isActive: Boolean = true
  }

  # ===== BRAND TYPES =====
  type Brand {
    _id: ID!
    name: String!
    slug: String!
    description: String
    logo: String
    banner: String
    website: String
    country: String
    foundedYear: Int
    categories: [Category]
    isActive: Boolean
    isFeatured: Boolean
    seoTitle: String
    seoDescription: String
    createdAt: String
    updatedAt: String
  }

  enum BrandsOrderBy {
    ID_ASC
    ID_DESC
    NAME_ASC
    NAME_DESC
    FOUNDED_ASC
    FOUNDED_DESC
    CREATED_ASC
    CREATED_DESC
  }

  type BrandConnection {
    nodes: [Brand]
    totalCount: Int
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  input BrandConditionInput {
    name: String
    country: String
    categories: [ID]
    isActive: Boolean
    isFeatured: Boolean
  }

  input BrandInput {
    name: String!
    description: String
    logo: String
    banner: String
    website: String
    country: String
    foundedYear: Int
    categories: [ID]
    isActive: Boolean = true
    isFeatured: Boolean = false
    seoTitle: String
    seoDescription: String
  }

  # ===== PRODUCT TYPES =====
  type Product {
    _id: ID!
    name: String!
    description: String
    price: Float!
    originalPrice: Float
    sku: String!
    category: Category
    brand: Brand
    images: [String]
    stock: Int
    isActive: Boolean
    isFeatured: Boolean
    createdAt: String
    updatedAt: String
  }

  enum ProductsOrderBy {
    ID_ASC
    ID_DESC
    NAME_ASC
    NAME_DESC
    PRICE_ASC
    PRICE_DESC
    CREATED_ASC
    CREATED_DESC
  }

  type ProductConnection {
    nodes: [Product]
    totalCount: Int
    hasNextPage: Boolean
    hasPreviousPage: Boolean
  }

  input ProductConditionInput {
    name: String
    category: ID
    brand: ID
    minPrice: Float
    maxPrice: Float
    isActive: Boolean
    isFeatured: Boolean
  }

  input ProductInput {
    name: String!
    description: String
    price: Float!
    originalPrice: Float
    sku: String!
    category: ID!
    brand: ID!
    images: [String]
    stock: Int = 0
    isActive: Boolean = true
    isFeatured: Boolean = false
  }

  # ===== UPLOAD TYPES =====
  type UploadResult {
    success: Boolean!
    message: String!
    filename: String
    url: String
  }

  type ReviewUploadResult {
    success: Boolean!
    message: String!
    urls: [String!]
    filenames: [String!]
  }

  # ===== CART TYPES =====
  type CartItem {
    _id: ID!
    userId: ID!
    productId: ID!
    quantity: Int!
    unitPrice: Float!
    productName: String!
    addedAt: String!
    totalPrice: Float!
    product: Product
  }

  type CartSummary {
    items: [CartItem!]!
    totalItems: Int!
    subtotal: Float!
  }

  input CartInput {
    productId: ID!
    quantity: Int! = 1
  }

  input AddToCartInput {
    productId: ID!
    quantity: Int! = 1
  }

  input UpdateCartInput {
    productId: ID!
    quantity: Int!
  }

  # ===== ORDER TYPES =====
  type Order {
    _id: ID!
    orderNumber: String!
    userId: ID!
    user: UserInfo
    customerInfo: CustomerInfo!
    status: OrderStatus!
    paymentMethod: PaymentMethod!
    paymentStatus: PaymentStatus!
    subtotal: Float!
    totalAmount: Float!
    orderDate: String!
    confirmedAt: String
    processedAt: String
    shippedAt: String
    deliveredAt: String
    cancelledAt: String
    customerNotes: String
    adminNotes: String
    items: [OrderItem!]!
  }

  type OrderItem {
    _id: ID!
    productId: ID!
    productName: String!
    productSku: String!
    quantity: Int!
    unitPrice: Float!
    totalPrice: Float!
    productSnapshot: ProductSnapshot
    product: Product
  }

  type ProductSnapshot {
    description: String
    images: [String]
    brand: String
    category: String
  }

  type CustomerInfo {
    fullName: String!
    phone: String!
    address: String!
    city: String!
    notes: String
  }

  enum OrderStatus {
    pending
    confirmed
    processing
    shipping
    delivered
    cancelled
  }

  enum PaymentMethod {
    cod
    bank_transfer
  }

  enum PaymentStatus {
    pending
    paid
    failed
    refunded
  }

  enum OrdersOrderBy {
    DATE_ASC
    DATE_DESC
    STATUS_ASC
    STATUS_DESC
    TOTAL_ASC
    TOTAL_DESC
  }

  type OrderConnection {
    nodes: [Order!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type OrderStats {
    totalOrders: Int!
    totalRevenue: Float!
    pendingOrders: Int!
    completedOrders: Int!
    cancelledOrders: Int!
  }

  input CreateOrderInput {
    customerInfo: CustomerInfoInput!
    paymentMethod: PaymentMethod!
    customerNotes: String
  }

  input CustomerInfoInput {
    fullName: String!
    phone: String!
    address: String!
    city: String!
    notes: String
  }

  # ===== WISHLIST TYPES =====
  type ProductSnapshot {
    name: String
    price: Float
    originalPrice: Float
    images: [String]
    sku: String
    brand: String
    category: String
  }

  type WishlistItem {
    _id: ID!
    userId: ID!
    productId: ID!
    displayOrder: Int!
    addedAt: String!
    productSnapshot: ProductSnapshot
    product: Product
  }

  type WishlistConnection {
    nodes: [WishlistItem!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  input ReorderWishlistInput {
    itemId: ID!
    newOrder: Int!
  }

  # ===== REVIEW TYPES =====
  type Review {
    _id: ID!
    productId: ID!
    userId: ID!
    orderId: ID
    rating: Int!
    comment: String
    images: [String]
    createdAt: String!
    adminReply: String
    adminReplyUpdatedAt: String
    isVerified: Boolean!
    user: UserInfo
    product: Product
    order: Order
  }

  type ReviewStats {
    totalReviews: Int!
    averageRating: Float!
    ratingDistribution: RatingDistribution!
  }

  type RatingDistribution {
    one: Int!
    two: Int!
    three: Int!
    four: Int!
    five: Int!
  }

  type ReviewConnection {
    items: [Review!]!
    totalCount: Int!
  }

  type ReviewEligibility {
    canReview: Boolean!
    reason: String
  }

  input ReviewFilter {
    rating: Int
    first: Int
    offset: Int
  }

  input ReviewInput {
    productId: ID!
    rating: Int!
    comment: String
    images: [String]
  }

  # ===== CHAT TYPES =====
  type ChatMessage {
    id: ID!
    content: String!
    role: MessageRole!
    timestamp: String!
    userId: ID
  }

  type ProductSuggestion {
    product: Product!
    relevance: Float!
    reason: String!
  }

  type ChatResponse {
    message: String!
    suggestions: [ProductSuggestion!]
    analysis: QueryAnalysis
    mode: String
    addToCompare: Product
    shouldCompare: Boolean
  }

  type QueryAnalysis {
    brand: String
    maxPrice: Float
    minPrice: Float
    features: [String!]
    priceRange: String
    targetUser: String
    keywords: [String!]
    productType: String
    excludeBrands: [String!]
    intent: String
    query: String
    category: String
  }

  enum MessageRole {
    USER
    ASSISTANT
  }

  input ChatInput {
    message: String!
    userId: ID
    context: ChatContextInput
  }

  input ChatContextInput {
    viewedProducts: [ID!]
    budget: Float
    preferredBrand: String
    userProfile: String
  }

  # ===== PRODUCT COMPARISON TYPES =====
  type ProductComparison {
    products: [Product!]!
    analysis: ComparisonAnalysis!
    recommendations: [String!]!
    createdAt: String!
  }

  type ComparisonAnalysis {
    strengths: [ProductStrength!]!
    differences: [ProductDifference!]!
    similarities: [String!]!
    bestValue: String
    bestPerformance: String
    bestCamera: String
    bestBattery: String
  }

  type ProductStrength {
    productId: ID!
    productName: String!
    strengths: [String!]!
  }

  type ProductDifference {
    category: String!
    product1: ComparisonItem!
    product2: ComparisonItem!
    product3: ComparisonItem
  }

  type ComparisonItem {
    productId: ID!
    productName: String!
    value: String!
    isBest: Boolean
  }

  input CompareProductsInput {
    productIds: [ID!]!
    userPreferences: String
  }
  
  # ===== IMAGE SEARCH TYPES =====
  type ImageSearchResult {
    message: String!
    suggestions: [ProductSuggestion]
    analysis: QueryAnalysis
  }
  
  input ImageSearchInput {
    imageData: String!
    imageType: String!
  }
`;

// Image Search Resolvers
const imageSearchResolvers = {
  Mutation: {
    searchByImage: async (_, { input }, { db }) => {
      try {
        console.log('🖼️ Image Search - Processing image...');
        console.log('🖼️ Database context available:', !!db);
        console.log('🖼️ Database models:', db ? Object.keys(db) : 'No db');
        console.log('🖼️ Database structure:', db ? JSON.stringify(Object.keys(db), null, 2) : 'No db');
        
        // Extract base64 image data
        const { imageData, imageType } = input;
        
        // Analyze image with Claude AI
        const imageAnalysis = await analyzeImageWithAI(imageData, imageType);
        console.log('🖼️ Image Analysis Result:', JSON.stringify(imageAnalysis, null, 2));
        
        // AI chỉ nhận dạng, không tìm kiếm
        const detectedProduct = imageAnalysis.detectedProduct || 'sản phẩm điện tử';
        console.log('🤖 AI detected:', detectedProduct);
        
        // Tạo message để thông báo nhận dạng và tự động tìm kiếm
        const message = `Tôi nhận dạng được ${detectedProduct}. Đang tự động tìm kiếm ${detectedProduct} cho bạn...`;
        
        return {
          message: message,
          suggestions: [], // Không có suggestions, để chatbot tự tìm
          analysis: {
            intent: "search",
            query: detectedProduct,
            category: imageAnalysis.category,
            brand: imageAnalysis.brand,
            maxPrice: null,
            minPrice: null,
            features: [],
            productType: detectedProduct,
            excludeBrands: []
          }
        };
      } catch (error) {
        console.error('Image search error:', error);
        throw new Error('Có lỗi xảy ra khi phân tích ảnh');
      }
    }
  }
};

// Merge all resolvers
const resolvers = _.merge(
  {},
  helloResolvers,
  categoriesResolvers,
  productsResolvers,
  brandsResolvers,
  authenticationResolvers,
  uploadResolvers,
  cartsResolvers,
  ordersResolvers,
  reviewsResolvers,
  reviewUploadResolvers,
  chatResolvers,
  productComparisonResolvers,
  wishlistResolvers,
  imageSearchResolvers,
  googleAuthResolvers
);

console.log('🔧 Perfect resolvers merged');
console.log('📊 Query resolvers:', Object.keys(resolvers.Query || {}).length);
console.log('📊 Mutation resolvers:', Object.keys(resolvers.Mutation || {}).length);

// Create schema
export const schema = createSchema({
  typeDefs: completeTypeDefs,
  resolvers,
});

console.log('✅ PERFECT schema created successfully!');

// Final validation
const finalSchemaString = schema.toString();
console.log('🎉 GoogleAuthInput found:', finalSchemaString.includes('GoogleAuthInput'));
console.log('🎉 googleAuth mutation found:', finalSchemaString.includes('googleAuth'));
console.log('🎉 completeProfile found:', finalSchemaString.includes('completeProfile'));

export const createGraphQLSchema = () => {
  try {
    const schema = createSchema({
      typeDefs: completeTypeDefs,
      resolvers,
    });
    console.log('GraphQL schema created successfully');
    return schema;
  } catch (error) {
    console.error('Error creating GraphQL schema:', error);
    throw error;
  }
};