// File: server/graphql/orders.js - FIXED SYNTAX VERSION

import mongoose from "mongoose";

export const typeDef = `
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

  input OrderConditionInput {
    status: OrderStatus
    paymentStatus: PaymentStatus
    paymentMethod: PaymentMethod
    userId: ID
    dateFrom: String
    dateTo: String
  }

  type OrderStats {
    totalOrders: Int!
    pendingOrders: Int!
    confirmedOrders: Int!
    shippingOrders: Int!
    deliveredOrders: Int!
    cancelledOrders: Int!
    totalRevenue: Float!
    todayOrders: Int!
  }

  extend type Query {
    # Customer queries
    getMyOrders(first: Int, offset: Int, orderBy: OrdersOrderBy): OrderConnection!
    getMyOrder(orderNumber: String!): Order
    
    # Admin queries  
    getAllOrders(first: Int, offset: Int, orderBy: OrdersOrderBy, condition: OrderConditionInput, search: String): OrderConnection!
    getOrder(orderNumber: String!): Order
    getOrderStats: OrderStats!
  }

  extend type Mutation {
    # Customer mutations
    createOrderFromCart(input: CreateOrderInput!): Order!
    
    # Admin mutations
    updateOrderStatus(orderNumber: String!, status: OrderStatus!, adminNotes: String): Order!
    updatePaymentStatus(orderNumber: String!, paymentStatus: PaymentStatus!): Order!
    cancelOrder(orderNumber: String!, reason: String): Order!
  }
`;

export const resolvers = {
  Order: {
    user: async (parent, args, context) => {
      try {
        console.log('🔍 Order.user resolver - parent.userId:', parent.userId);
        if (parent.userId) {
          const user = await context.db.users.findById(parent.userId);
          console.log('👤 Order.user resolved:', user ? 'Found' : 'Not found');
          return user;
        }
        return null;
      } catch (error) {
        console.error('❌ Error resolving Order.user:', error);
        return null;
      }
    },
    
    items: async (parent, args, context) => {
      try {
        console.log('🔍 Order.items resolver - parent._id:', parent._id);
        
        if (!parent._id) {
          console.log('❌ Order _id is missing');
          return [];
        }
        
        // Check if orderItems method exists
        if (!context.db.orderItems) {
          console.error('❌ context.db.orderItems is undefined');
          console.log('🔍 Available db methods:', Object.keys(context.db));
          return [];
        }
        
        if (!context.db.orderItems.getByOrderId) {
          console.error('❌ context.db.orderItems.getByOrderId is undefined');
          console.log('🔍 Available orderItems methods:', Object.keys(context.db.orderItems));
          return [];
        }
        
        console.log('🔍 Calling context.db.orderItems.getByOrderId with:', parent._id);
        const items = await context.db.orderItems.getByOrderId(parent._id);
        console.log(`📦 Order items resolved: ${items?.length || 0} items`);
        
        return items || [];
      } catch (error) {
        console.error('❌ Error resolving order items:', error);
        console.error('❌ Full error stack:', error.stack);
        return [];
      }
    }
  },

  OrderItem: {
    product: async (parent, args, context) => {
      try {
        console.log('🔍 OrderItem.product resolver - productId:', parent.productId);
        
        if (!parent.productId) {
          console.log('❌ OrderItem productId is null/undefined');
          return null;
        }
        
        if (!mongoose.Types.ObjectId.isValid(parent.productId)) {
          console.log('❌ Invalid productId format:', parent.productId);
          return null;
        }
        
        const product = await context.db.products.findById(parent.productId);
        console.log('📦 OrderItem.product resolved:', product ? 'Found' : 'Not found');
        
        return product;
      } catch (error) {
        console.error('❌ Error resolving OrderItem product:', error);
        return null;
      }
    }
  },

  Query: {
    getMyOrders: async (parent, args, context, info) => {
      try {
        if (!context.user) {
          throw new Error("Authentication required");
        }

        console.log('🔍 getMyOrders - userId:', context.user.id);
        
        const result = await context.db.orders.getByUserId(context.user.id, args);
        
        const { first = 10, offset = 0 } = args;
        const hasNextPage = offset + first < result.totalCount;
        const hasPreviousPage = offset > 0;
        
        return {
          nodes: result.items || [],
          totalCount: result.totalCount || 0,
          hasNextPage,
          hasPreviousPage
        };
      } catch (error) {
        console.error('❌ Error in getMyOrders:', error);
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }
    },

    getMyOrder: async (parent, args, context, info) => {
      try {
        if (!context.user) {
          throw new Error("Authentication required");
        }

        console.log('🔍 getMyOrder - orderNumber:', args.orderNumber);
        console.log('🔍 getMyOrder - userId:', context.user.id);

        const order = await context.db.orders.getByOrderNumber(args.orderNumber);
        
        if (!order) {
          console.log('❌ Order not found:', args.orderNumber);
          throw new Error("Order not found");
        }

        console.log('📦 Order found:', order.orderNumber);
        console.log('🔍 Order userId:', order.userId);
        console.log('🔍 Current user:', context.user.id);

        // Convert ObjectId to string for comparison
        let orderUserId;
        if (typeof order.userId === 'object' && order.userId._id) {
          // If userId is populated user object
          orderUserId = order.userId._id.toString();
        } else {
          // If userId is ObjectId
          orderUserId = order.userId.toString();
        }

        if (orderUserId !== context.user.id) {
          console.log('❌ Access denied - order belongs to:', orderUserId, 'user is:', context.user.id);
          throw new Error("Access denied");
        }

        console.log('✅ Order access granted, returning order');
        return order;
      } catch (error) {
        console.error('❌ Error in getMyOrder:', error);
        console.error('❌ Full error stack:', error.stack);
        throw error;
      }
    },

    getAllOrders: async (parent, args, context, info) => {
      try {
        console.log('🔍 getAllOrders - args:', args);
        
        const result = await context.db.orders.getAll({
          first: args.first,
          offset: args.offset,
          orderBy: args.orderBy,
          condition: args.condition,
          search: args.search
        });
        
        const { first = 10, offset = 0 } = args;
        const hasNextPage = offset + first < result.totalCount;
        const hasPreviousPage = offset > 0;
        
        return {
          nodes: result.items || [],
          totalCount: result.totalCount || 0,
          hasNextPage,
          hasPreviousPage
        };
      } catch (error) {
        console.error('❌ Error in getAllOrders:', error);
        throw new Error(`Failed to fetch orders: ${error.message}`);
      }
    },

    getOrder: async (parent, args, context, info) => {
      try {
        console.log('🔍 getOrder - orderNumber:', args.orderNumber);
        return await context.db.orders.getByOrderNumber(args.orderNumber);
      } catch (error) {
        console.error('❌ Error in getOrder:', error);
        throw new Error(`Failed to fetch order: ${error.message}`);
      }
    },

    getOrderStats: async (parent, args, context, info) => {
      try {
        console.log('🔍 getOrderStats called');
        return await context.db.orders.getStats();
      } catch (error) {
        console.error('❌ Error in getOrderStats:', error);
        throw new Error(`Failed to fetch order stats: ${error.message}`);
      }
    }
  },

  Mutation: {
    createOrderFromCart: async (parent, args, context, info) => {
      try {
        if (!context.user) {
          throw new Error("Authentication required");
        }

        console.log('🔍 createOrderFromCart - userId:', context.user.id);
        console.log('🔍 createOrderFromCart - input:', JSON.stringify(args.input, null, 2));

        // Validate cart
        const cartValidation = await context.db.carts.validateCart(context.user.id);
        
        if (!cartValidation.isValid) {
          throw new Error(`Cart validation failed: ${cartValidation.errors.join(', ')}`);
        }

        if (cartValidation.validItems.length === 0) {
          throw new Error('Cart is empty');
        }

        // Create order
        const order = await context.db.orders.createFromCart(context.user.id, args.input);
        
        console.log('✅ Order created successfully:', order.orderNumber);
        
        return order;
      } catch (error) {
        console.error('❌ Error creating order:', error);
        throw error;
      }
    },

    updateOrderStatus: async (parent, args, context, info) => {
      try {
        console.log('🔍 updateOrderStatus:', args);
        
        const order = await context.db.orders.updateStatus(
          args.orderNumber, 
          args.status, 
          args.adminNotes
        );
        
        if (!order) {
          throw new Error('Order not found');
        }
        
        return order;
      } catch (error) {
        console.error('❌ Error updating order status:', error);
        throw error;
      }
    },

    updatePaymentStatus: async (parent, args, context, info) => {
      try {
        console.log('🔍 updatePaymentStatus:', args);
        
        const order = await context.db.orders.updatePaymentStatus(
          args.orderNumber, 
          args.paymentStatus
        );
        
        if (!order) {
          throw new Error('Order not found');
        }
        
        return order;
      } catch (error) {
        console.error('❌ Error updating payment status:', error);
        throw error;
      }
    },

    // ✅ FIXED: Properly formatted cancelOrder resolver
    cancelOrder: async (parent, args, context, info) => {
      try {
        if (!context.user) {
          throw new Error("Authentication required");
        }

        console.log('🔍 cancelOrder - orderNumber:', args.orderNumber);
        console.log('🔍 cancelOrder - user:', context.user.username, '- role:', context.user.role);

        // Get the order first to check ownership and status
        const order = await context.db.orders.getByOrderNumber(args.orderNumber);
        
        if (!order) {
          throw new Error('Order not found');
        }

        // Check ownership for customers
        if (context.user.role === 'customer') {
          // Convert ObjectId to string for comparison
          let orderUserId;
          if (typeof order.userId === 'object' && order.userId._id) {
            orderUserId = order.userId._id.toString();
          } else {
            orderUserId = order.userId.toString();
          }

          if (orderUserId !== context.user.id) {
            throw new Error('You can only cancel your own orders');
          }

          // Check if order can be cancelled (only pending or confirmed)
          if (!['pending', 'confirmed'].includes(order.status)) {
            throw new Error('This order cannot be cancelled anymore');
          }
        }

        // Admin and Manager can cancel any order
        console.log('✅ Order cancellation authorized');
        
        // Cancel the order
        const cancelledOrder = await context.db.orders.cancel(
          args.orderNumber, 
          args.reason || (context.user.role === 'customer' ? 'Khách hàng yêu cầu hủy đơn' : args.reason)
        );
        
        if (!cancelledOrder) {
          throw new Error('Failed to cancel order');
        }
        
        console.log('✅ Order cancelled successfully:', args.orderNumber);
        return cancelledOrder;
      } catch (error) {
        console.error('❌ Error cancelling order:', error);
        throw error;
      }
    }
  }
};