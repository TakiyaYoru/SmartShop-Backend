import { GraphQLError } from "graphql";

export const typeDef = `
  type UserInfo {
    _id: ID!
    username: String!
    firstName: String
    lastName: String
  }

  type ReviewStats {
    totalReviews: Int!
    averageRating: Float!
    ratingDistribution: RatingDistribution!
  }

  type RatingDistribution {
    one: Int
    two: Int
    three: Int
    four: Int
    five: Int
  }

  type ReviewConnection {
    items: [Review!]!
    totalCount: Int!
  }

  type Review {
    _id: ID!
    productId: ID!
    userId: ID!
    orderId: ID
    rating: Int!
    comment: String
    images: [String]
    createdAt: String
    adminReply: String
    adminReplyUpdatedAt: String
    isVerified: Boolean!
    user: UserInfo
    product: ProductInfo
    order: OrderInfo
  }

  type ProductInfo {
    _id: ID!
    name: String
  }

  type OrderInfo {
    _id: ID!
    orderNumber: String
  }

  input ReviewInput {
    productId: ID!
    orderId: ID
    rating: Int!
    comment: String
    images: [String]
  }

  input ReviewFilter {
    rating: Int
    first: Int
    offset: Int
  }

  extend type Query {
    getProductReviews(productId: ID!, filter: ReviewFilter): ReviewConnection!
    getProductAverageRating(productId: ID!): Float!
    getProductReviewStats(productId: ID!): ReviewStats!
    canUserReviewProduct(productId: ID!): ReviewEligibility!
    getAllReviewsForAdmin(filter: ReviewFilter): ReviewConnection!
    getPendingAdminReviews(filter: ReviewFilter): ReviewConnection!
  }

  type ReviewEligibility {
    canReview: Boolean!
    reason: String
  }

  extend type Mutation {
    createReview(input: ReviewInput!): Review!
    adminReplyToReview(reviewId: ID!, reply: String!): Review!
    deleteAdminReply(reviewId: ID!): Review!
  }
`;

export const resolvers = {
  Review: {
    user: async (parent, args, context) => {
      if (parent.user) return parent.user;
      return await context.db.users.findById(parent.userId);
    },
    product: async (parent, args, context) => {
      // Handle both populated and unpopulated productId
      if (parent.productId && typeof parent.productId === 'object') {
        return parent.productId;
      }
      if (!parent.productId) return null;
      const product = await context.db.products.findById(parent.productId);
      return product;
    },
    order: async (parent, args, context) => {
      // Handle both populated and unpopulated orderId
      if (parent.orderId && typeof parent.orderId === 'object') {
        return parent.orderId;
      }
      if (!parent.orderId) return null;
      const order = await context.db.orders.findById(parent.orderId);
      return order;
    },
  },

  Query: {
    getProductReviews: async (_, { productId, filter = {} }, context) => {
      const { rating, first = 10, offset = 0 } = filter;
      return await context.db.reviews.getByProduct(productId, rating, { first, offset });
    },

    getProductAverageRating: async (_, { productId }, context) => {
      return await context.db.reviews.getAverageRating(productId);
    },

    getProductReviewStats: async (_, { productId }, context) => {
      return await context.db.reviews.getReviewStats(productId);
    },

    canUserReviewProduct: async (_, { productId }, context) => {
      if (!context.user) {
        return { canReview: false, reason: 'Authentication required' };
      }
      return await context.db.reviews.canUserReviewProduct(context.user.id, productId);
    },

    getAllReviewsForAdmin: async (_, { filter = {} }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new GraphQLError("Admin access required");
      }
      const { first = 20, offset = 0 } = filter;
      return await context.db.reviews.getAll({ first, offset });
    },

    getPendingAdminReviews: async (_, { filter = {} }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new GraphQLError("Admin access required");
      }
      const { first = 10, offset = 0 } = filter;
      return await context.db.reviews.getPendingAdminReviews({ first, offset });
    },
  },

  Mutation: {
    createReview: async (_, { input }, context) => {
      if (!context.user) throw new GraphQLError("Authentication required");

      const { productId, orderId } = input;
      const userId = context.user.id;

      // Check if user can review this product
      const eligibility = await context.db.reviews.canUserReviewProduct(userId, productId);
      if (!eligibility.canReview) {
        throw new GraphQLError(eligibility.reason);
      }

      // If orderId is provided, verify the order belongs to the user and contains the product
      if (orderId) {
        const order = await context.db.orders.findById(orderId);
        if (!order) {
          throw new GraphQLError("Order not found");
        }
        
        // Check if order belongs to user (handle both populated and unpopulated userId)
        const orderUserId = order.userId._id ? order.userId._id.toString() : order.userId.toString();
        if (orderUserId !== userId) {
          throw new GraphQLError("Invalid order");
        }

        const orderItems = await context.db.orderItems.getByOrderId(orderId);
        const hasProduct = orderItems.some(item => item.productId.toString() === productId);
        if (!hasProduct) {
          throw new GraphQLError("Product not found in this order");
        }
      }

      // Create the review
      const review = await context.db.reviews.create({
        ...input,
        userId,
        createdAt: new Date(),
        adminReply: null,
        adminReplyUpdatedAt: null,
        isVerified: true
      });

      return review;
    },

    adminReplyToReview: async (_, { reviewId, reply }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new GraphQLError("Admin access required");
      }

      if (!reply || reply.trim() === '') {
        throw new GraphQLError("Reply cannot be empty");
      }

      return await context.db.reviews.addAdminReply(reviewId, reply.trim());
    },

    deleteAdminReply: async (_, { reviewId }, context) => {
      if (!context.user || context.user.role !== 'admin') {
        throw new GraphQLError("Admin access required");
      }

      return await context.db.reviews.addAdminReply(reviewId, null);
    },
  }
};