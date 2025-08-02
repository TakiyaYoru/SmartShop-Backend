import { GraphQLError } from "graphql";

export const typeDef = `
  type WishlistItem {
    _id: ID!
    userId: ID!
    productId: ID!
    displayOrder: Int!
    addedAt: String!
    productSnapshot: ProductSnapshot
    product: Product
  }

  type ProductSnapshot {
    name: String
    price: Float
    originalPrice: Float
    images: [String]
    sku: String
    brand: String
    category: String
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

  extend type Query {
    # Kiểm tra sản phẩm có trong wishlist không
    isProductInWishlist(productId: ID!): Boolean!
    
    # Lấy danh sách wishlist của user
    getMyWishlist(first: Int = 20, offset: Int = 0): WishlistConnection!
    
    # Lấy số lượng items trong wishlist
    getWishlistItemCount: Int!
  }

  extend type Mutation {
    # Thêm sản phẩm vào wishlist
    addToWishlist(productId: ID!): WishlistItem
    
    # Xóa sản phẩm khỏi wishlist
    removeFromWishlist(productId: ID!): Boolean!
    
    # Thay đổi thứ tự hiển thị
    reorderWishlist(input: ReorderWishlistInput!): WishlistItem!
    
    # Di chuyển item lên
    moveWishlistItemUp(itemId: ID!): WishlistItem!
    
    # Di chuyển item xuống
    moveWishlistItemDown(itemId: ID!): WishlistItem!
    
    # Xóa nhiều sản phẩm khỏi wishlist
    removeMultipleFromWishlist(productIds: [ID!]!): Boolean!
  }
`;

export const resolvers = {
  WishlistItem: {
    product: async (parent, args, context) => {
      try {
        if (parent.productId) {
          return await context.db.products.findById(parent.productId);
        }
        return null;
      } catch (error) {
        console.error('Error resolving WishlistItem.product:', error);
        return null;
      }
    },
  },

  Query: {
    isProductInWishlist: async (_, { productId }, context) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required");
      }

      try {
        const wishlistItem = await context.db.wishlists.findByUserAndProduct(
          context.user.id,
          productId
        );
        
        return !!wishlistItem;
      } catch (error) {
        console.error('Error checking wishlist status:', error);
        return false;
      }
    },

    getMyWishlist: async (_, { first = 20, offset = 0 }, context) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required");
      }

      try {
        return await context.db.wishlists.getByUser(context.user.id, { first, offset });
      } catch (error) {
        console.error('Error getting wishlist:', error);
        throw new GraphQLError("Failed to get wishlist");
      }
    },

    getWishlistItemCount: async (_, args, context) => {
      if (!context.user) {
        return 0;
      }

      try {
        return await context.db.wishlists.getItemCount(context.user.id);
      } catch (error) {
        console.error('Error getting wishlist count:', error);
        return 0;
      }
    },
  },

  Mutation: {
    addToWishlist: async (_, { productId }, context) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required");
      }

      try {
        // Kiểm tra sản phẩm có tồn tại không
        const product = await context.db.products.findById(productId);
        if (!product) {
          throw new GraphQLError("Product not found");
        }

        // Tạo snapshot thông tin sản phẩm
        const productSnapshot = {
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          sku: product.sku,
          brand: product.brand?.name || '',
          category: product.category?.name || ''
        };

        // Thêm vào wishlist
        return await context.db.wishlists.addToWishlist(
          context.user.id,
          productId,
          productSnapshot
        );
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError("Failed to add to wishlist");
      }
    },

    removeFromWishlist: async (_, { productId }, context) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required");
      }

      try {
        return await context.db.wishlists.removeFromWishlist(
          context.user.id,
          productId
        );
      } catch (error) {
        console.error('Error removing from wishlist:', error);
        throw new GraphQLError("Failed to remove from wishlist");
      }
    },

    reorderWishlist: async (_, { input }, context) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required");
      }

      try {
        const { itemId, newOrder } = input;

        return await context.db.wishlists.updateDisplayOrder(
          itemId,
          context.user.id,
          newOrder
        );
      } catch (error) {
        console.error('Error reordering wishlist:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError("Failed to reorder wishlist");
      }
    },

    moveWishlistItemUp: async (_, { itemId }, context) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required");
      }

      try {
        return await context.db.wishlists.moveItemUp(
          itemId,
          context.user.id
        );
      } catch (error) {
        console.error('Error moving wishlist item up:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError("Failed to move item up");
      }
    },

    moveWishlistItemDown: async (_, { itemId }, context) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required");
      }

      try {
        return await context.db.wishlists.moveItemDown(
          itemId,
          context.user.id
        );
      } catch (error) {
        console.error('Error moving wishlist item down:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        throw new GraphQLError("Failed to move item down");
      }
    },

    removeMultipleFromWishlist: async (_, { productIds }, context) => {
      if (!context.user) {
        throw new GraphQLError("Authentication required");
      }

      try {
        return await context.db.wishlists.removeMultiple(
          context.user.id,
          productIds
        );
      } catch (error) {
        console.error('Error removing multiple from wishlist:', error);
        throw new GraphQLError("Failed to remove items from wishlist");
      }
    },
  },
}; 