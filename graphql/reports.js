// File: server/graphql/reports.js - NEW REPORTS FEATURE
import mongoose from 'mongoose';

export const typeDef = `
  type MonthlyReport {
    month: String!
    year: Int!
    revenue: Float!
    orderCount: Int!
    productCount: Int!
  }

  type SalesReport {
    productId: ID!
    productName: String!
    productSku: String!
    category: String!
    brand: String!
    quantitySold: Int!
    revenue: Float!
    revenuePercentage: Float!
  }

  type ReportStats {
    totalRevenue: Float!
    totalOrders: Int!
    totalProducts: Int!
    averageOrderValue: Float!
  }

  type SalesReportConnection {
    nodes: [SalesReport!]!
    totalCount: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  input DateRangeInput {
    fromDate: String!
    toDate: String!
  }

  type ProductOrder {
    orderNumber: String!
    orderDate: String!
    status: String!
    customerInfo: CustomerInfo!
    quantity: Int!
    unitPrice: Float!
    totalPrice: Float!
  }

  type CustomerInfo {
    fullName: String!
    phone: String!
  }

  extend type Query {
    # Monthly Overview Report
    getMonthlyReport(year: Int!): [MonthlyReport!]!
    
    # Detailed Sales Report
    getSalesReport(
      dateRange: DateRangeInput!
      first: Int
      offset: Int
      search: String
    ): SalesReportConnection!
    
    # Report Statistics
    getReportStats(dateRange: DateRangeInput!): ReportStats!
    
    # Product Orders Detail
    getProductOrders(productId: ID!, dateRange: DateRangeInput!): [ProductOrder!]!
  }
`;

export const resolvers = {
  Query: {
    getMonthlyReport: async (parent, args, context) => {
      try {
        console.log('🔍 getMonthlyReport - year:', args.year);
        
        const year = args.year;
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        
        // MongoDB Aggregation Pipeline for monthly data
        const monthlyData = await context.db.orders.aggregate([
          {
            $match: {
              orderDate: { $gte: startDate, $lte: endDate },
              status: { $in: ['delivered', 'shipping', 'pending', 'confirmed', 'processing'] } // Count all active orders
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$orderDate' },
                month: { $month: '$orderDate' }
              },
              revenue: { $sum: '$totalAmount' },
              orderCount: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.month': 1 }
          }
        ]);

        // Get product count per month
        const productData = await context.db.orderItems.aggregate([
          {
            $lookup: {
              from: 'orders',
              localField: 'orderId',
              foreignField: '_id',
              as: 'order'
            }
          },
          {
            $unwind: '$order'
          },
          {
            $match: {
              'order.orderDate': { $gte: startDate, $lte: endDate },
              'order.status': { $in: ['delivered', 'shipping', 'pending', 'confirmed', 'processing'] }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$order.orderDate' },
                month: { $month: '$order.orderDate' }
              },
              productCount: { $sum: '$quantity' }
            }
          }
        ]);

        // Combine data and fill missing months
        const result = [];
        const monthNames = [
          'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
          'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
        ];

        for (let month = 1; month <= 12; month++) {
          const monthData = monthlyData.find(d => d._id.month === month);
          const monthProductData = productData.find(d => d._id.month === month);
          
          result.push({
            month: monthNames[month - 1],
            year: year,
            revenue: monthData?.revenue || 0,
            orderCount: monthData?.orderCount || 0,
            productCount: monthProductData?.productCount || 0
          });
        }

        console.log(`📊 Monthly report generated for ${year}: ${result.length} months`);
        return result;
      } catch (error) {
        console.error('❌ Error in getMonthlyReport:', error);
        throw new Error(`Failed to generate monthly report: ${error.message}`);
      }
    },

    getSalesReport: async (parent, args, context) => {
      try {
        console.log('🔍 getSalesReport - args:', args);
        
        const { dateRange, first = 10, offset = 0, search } = args;
        const fromDate = new Date(dateRange.fromDate);
        const toDate = new Date(dateRange.toDate);
        
        // Build match conditions
        const matchConditions = {
          'order.orderDate': { $gte: fromDate, $lte: toDate },
          'order.status': { $in: ['delivered', 'shipping', 'pending', 'confirmed', 'processing'] }
        };

        if (search && search.trim()) {
          matchConditions.$or = [
            { productName: { $regex: search.trim(), $options: 'i' } },
            { productSku: { $regex: search.trim(), $options: 'i' } }
          ];
        }

        // Get total revenue for percentage calculation
        const totalRevenueResult = await context.db.orders.aggregate([
          {
            $match: {
              orderDate: { $gte: fromDate, $lte: toDate },
              status: { $in: ['delivered', 'shipping'] }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' }
            }
          }
        ]);

        const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

        // Get sales data with real product information
        const salesData = await context.db.orderItems.aggregate([
          {
            $lookup: {
              from: 'orders',
              localField: 'orderId',
              foreignField: '_id',
              as: 'order'
            }
          },
          {
            $unwind: '$order'
          },
          {
            $lookup: {
              from: 'products',
              localField: 'productId',
              foreignField: '_id',
              as: 'product'
            }
          },
          {
            $unwind: {
              path: '$product',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: matchConditions
          },
          {
            $match: {
              productId: { $ne: null, $exists: true }
            }
          },
          {
            $group: {
              _id: '$productId',
              productName: { $first: '$product.name' },
              productSku: { $first: '$product.sku' },
              category: { $first: '$product.category.name' },
              brand: { $first: '$product.brand.name' },
              quantitySold: { $sum: '$quantity' },
              revenue: { $sum: '$totalPrice' }
            }
          },
          {
            $addFields: {
              revenuePercentage: {
                $cond: {
                  if: { $eq: [totalRevenue, 0] },
                  then: 0,
                  else: { $multiply: [{ $divide: ['$revenue', totalRevenue] }, 100] }
                }
              }
            }
          },
          {
            $sort: { revenue: -1 }
          },
          {
            $skip: offset
          },
          {
            $limit: first
          }
        ]);

        // Get total count for pagination
        const totalCountResult = await context.db.orderItems.aggregate([
          {
            $lookup: {
              from: 'orders',
              localField: 'orderId',
              foreignField: '_id',
              as: 'order'
            }
          },
          {
            $unwind: '$order'
          },
          {
            $match: matchConditions
          },
          {
            $match: {
              productId: { $ne: null, $exists: true }
            }
          },
          {
            $group: {
              _id: '$productId'
            }
          },
          {
            $count: 'total'
          }
        ]);

        const totalCount = totalCountResult[0]?.total || 0;
        const hasNextPage = offset + first < totalCount;
        const hasPreviousPage = offset > 0;

        // Filter out any results with null _id and transform _id to productId
        const filteredSalesData = salesData
          .filter(item => item._id != null)
          .map(item => ({
            productId: item._id.toString(),
            productName: item.productName || 'Unknown Product',
            productSku: item.productSku || 'N/A',
            category: item.category || 'Unknown',
            brand: item.brand || 'Unknown',
            quantitySold: item.quantitySold || 0,
            revenue: item.revenue || 0,
            revenuePercentage: item.revenuePercentage || 0
          }));
        
        console.log(`📊 Sales report generated: ${filteredSalesData.length} products, total: ${totalCount}`);
        
        return {
          nodes: filteredSalesData,
          totalCount,
          hasNextPage,
          hasPreviousPage
        };
      } catch (error) {
        console.error('❌ Error in getSalesReport:', error);
        throw new Error(`Failed to generate sales report: ${error.message}`);
      }
    },

    getReportStats: async (parent, args, context) => {
      try {
        console.log('🔍 getReportStats - args:', args);
        
        const { dateRange } = args;
        const fromDate = new Date(dateRange.fromDate);
        const toDate = new Date(dateRange.toDate);

        const stats = await context.db.orders.aggregate([
          {
            $match: {
              orderDate: { $gte: fromDate, $lte: toDate },
              status: { $in: ['delivered', 'shipping', 'pending', 'confirmed', 'processing'] }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              totalOrders: { $sum: 1 }
            }
          }
        ]);

        const productStats = await context.db.orderItems.aggregate([
          {
            $lookup: {
              from: 'orders',
              localField: 'orderId',
              foreignField: '_id',
              as: 'order'
            }
          },
          {
            $unwind: '$order'
          },
          {
            $match: {
              'order.orderDate': { $gte: fromDate, $lte: toDate },
              'order.status': { $in: ['delivered', 'shipping', 'pending', 'confirmed', 'processing'] }
            }
          },
          {
            $group: {
              _id: null,
              totalProducts: { $sum: '$quantity' }
            }
          }
        ]);

        const result = stats[0] || { totalRevenue: 0, totalOrders: 0 };
        const productResult = productStats[0] || { totalProducts: 0 };

        const averageOrderValue = result.totalOrders > 0 
          ? result.totalRevenue / result.totalOrders 
          : 0;

        console.log(`📊 Report stats generated: Revenue: ${result.totalRevenue}, Orders: ${result.totalOrders}`);

        return {
          totalRevenue: result.totalRevenue,
          totalOrders: result.totalOrders,
          totalProducts: productResult.totalProducts,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100
        };
      } catch (error) {
        console.error('❌ Error in getReportStats:', error);
        throw new Error(`Failed to generate report stats: ${error.message}`);
      }
    },

    getProductOrders: async (parent, args, context) => {
      try {
        console.log('🔍 getProductOrders - args:', args);
        
        const { productId, dateRange } = args;
        const fromDate = new Date(dateRange.fromDate);
        const toDate = new Date(dateRange.toDate);

        const orders = await context.db.orderItems.aggregate([
          {
            $match: {
              productId: new mongoose.Types.ObjectId(productId)
            }
          },
          {
            $lookup: {
              from: 'orders',
              localField: 'orderId',
              foreignField: '_id',
              as: 'order'
            }
          },
          {
            $unwind: '$order'
          },
          {
            $match: {
              'order.orderDate': { $gte: fromDate, $lte: toDate },
              'order.status': { $in: ['delivered', 'shipping', 'pending', 'confirmed', 'processing'] }
            }
          },
          {
            $project: {
              orderNumber: '$order.orderNumber',
              orderDate: { $dateToString: { format: '%Y-%m-%d', date: '$order.orderDate' } },
              status: '$order.status',
              customerInfo: {
                fullName: '$order.customerInfo.fullName',
                phone: '$order.customerInfo.phone'
              },
              quantity: '$quantity',
              unitPrice: '$unitPrice',
              totalPrice: '$totalPrice'
            }
          },
          {
            $sort: { orderDate: -1 }
          }
        ]);

        console.log(`📊 Product orders found: ${orders.length} orders for product ${productId}`);
        return orders;
      } catch (error) {
        console.error('❌ Error in getProductOrders:', error);
        throw new Error(`Failed to get product orders: ${error.message}`);
      }
    }
  }
}; 