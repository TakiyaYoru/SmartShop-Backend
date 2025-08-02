// scripts/generateFullYearOrders.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order, OrderItem, Product, User } from '../data/models/index.js';

// Load environment variables
dotenv.config();

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const statusWeights = [0.05, 0.1, 0.1, 0.15, 0.55, 0.05]; // 70% completed/shipping, 20% pending/confirmed, 10% cancelled

const paymentMethods = ['cod', 'bank_transfer'];
const paymentWeights = [0.6, 0.4]; // 60% COD, 40% bank transfer

// Helper function to get random item with weights
const getRandomItemWithWeight = (items, weights) => {
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < items.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return items[i];
    }
  }
  return items[items.length - 1];
};

// Helper function to get random date within a specific month
const getRandomDateInMonth = (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const generateFullYearOrders = async () => {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu doanh thu cho cả năm 2025...');
    
    // Connect to MongoDB
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL không được cấu hình trong file .env');
      return;
    }
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Đã kết nối MongoDB');

    // Get existing products and users
    const products = await Product.find({ isActive: true });
    const users = await User.find({ role: 'customer' });

    if (products.length === 0) {
      console.log('❌ Không tìm thấy sản phẩm nào. Vui lòng tạo sản phẩm trước.');
      return;
    }

    if (users.length === 0) {
      console.log('❌ Không tìm thấy user nào. Vui lòng tạo user trước.');
      return;
    }

    console.log(`📦 Tìm thấy ${products.length} sản phẩm thật`);
    console.log(`👥 Tìm thấy ${users.length} users`);

    // Tạo dữ liệu cho tất cả 12 tháng
    const year = 2025;
    let totalOrders = 0;
    let totalRevenue = 0;

    for (let month = 1; month <= 12; month++) {
      console.log(`\n📅 Tạo dữ liệu cho tháng ${month}/${year}...`);
      
      // Số đơn hàng thực tế cho mỗi tháng (tăng dần theo tháng, giảm vào tháng 12)
      let ordersPerMonth;
      if (month <= 3) {
        ordersPerMonth = 5 + month * 2; // Tháng 1-3: 7, 9, 11 đơn
      } else if (month <= 8) {
        ordersPerMonth = 10 + (month - 3) * 3; // Tháng 4-8: 13, 16, 19, 22, 25 đơn
      } else {
        ordersPerMonth = 25 - (month - 8) * 2; // Tháng 9-12: 23, 21, 19, 17 đơn
      }
      
      const orders = [];
      const orderItems = [];

      for (let i = 1; i <= ordersPerMonth; i++) {
        const orderDate = getRandomDateInMonth(year, month);
        const status = getRandomItemWithWeight(orderStatuses, statusWeights);
        const paymentMethod = getRandomItemWithWeight(paymentMethods, paymentWeights);
        const user = users[Math.floor(Math.random() * users.length)];

        // Generate order number
        const orderNumber = `DH${year}${String(month).padStart(2, '0')}${String(i).padStart(3, '0')}`;

        // 1-3 sản phẩm mỗi đơn hàng
        const itemCount = Math.floor(Math.random() * 3) + 1;
        let subtotal = 0;
        const items = [];

        for (let j = 0; j < itemCount; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
          const unitPrice = product.price;
          const totalPrice = unitPrice * quantity;
          subtotal += totalPrice;

          items.push({
            productId: product._id,
            productName: product.name,
            productSku: product.sku,
            quantity,
            unitPrice,
            totalPrice,
            productSnapshot: {
              description: product.description || '',
              images: product.images || [],
              brand: product.brand?.name || 'Unknown',
              category: product.category?.name || 'Unknown'
            }
          });
        }

        // Giảm giá ngẫu nhiên (10% chance)
        const discount = Math.random() > 0.9 ? Math.random() * 0.05 : 0; // 10% chance of 0-5% discount
        const totalAmount = subtotal * (1 - discount);

        const order = {
          orderNumber,
          userId: user._id,
          customerInfo: {
            fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
            phone: user.phone || '0900000000',
            address: '123 Đường ABC, TP.HCM',
            city: 'TP.HCM',
            notes: ''
          },
          status,
          paymentMethod,
          paymentStatus: status === 'delivered' ? 'paid' : (status === 'cancelled' ? 'refunded' : 'pending'),
          subtotal,
          totalAmount: Math.round(totalAmount),
          orderDate,
          customerNotes: Math.random() > 0.8 ? 'Giao hàng vào buổi chiều' : '',
          adminNotes: status === 'cancelled' ? 'Khách hàng yêu cầu hủy' : '',
          items: items
        };

        orders.push(order);

        // Add status timestamps
        if (status === 'confirmed') {
          order.confirmedAt = new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        } else if (status === 'processing') {
          order.confirmedAt = new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          order.processedAt = new Date(order.confirmedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        } else if (status === 'shipping') {
          order.confirmedAt = new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          order.processedAt = new Date(order.confirmedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          order.shippedAt = new Date(order.processedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        } else if (status === 'delivered') {
          order.confirmedAt = new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          order.processedAt = new Date(order.confirmedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          order.shippedAt = new Date(order.processedAt.getTime() + Math.random() * 24 * 60 * 60 * 1000);
          order.deliveredAt = new Date(order.shippedAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
        } else if (status === 'cancelled') {
          order.cancelledAt = new Date(orderDate.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        }
      }

      // Insert orders for this month
      console.log(`💾 Đang lưu ${orders.length} đơn hàng cho tháng ${month}...`);
      const insertedOrders = await Order.insertMany(orders);
      console.log(`✅ Đã tạo ${insertedOrders.length} đơn hàng cho tháng ${month}`);

      // Generate order items for this month
      for (let i = 0; i < insertedOrders.length; i++) {
        const order = insertedOrders[i];
        const orderData = orders[i];
        
        for (const item of orderData.items) {
          orderItems.push({
            orderId: order._id,
            ...item
          });
        }
      }

      // Insert order items for this month
      console.log(`💾 Đang lưu ${orderItems.length} chi tiết đơn hàng cho tháng ${month}...`);
      const insertedOrderItems = await OrderItem.insertMany(orderItems);
      console.log(`✅ Đã tạo ${insertedOrderItems.length} chi tiết đơn hàng cho tháng ${month}`);

      // Calculate statistics for this month
      const monthRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
      
      console.log(`📊 Tháng ${month}: ${orders.length} đơn hàng, ${formatCurrency(monthRevenue)} doanh thu, ${deliveredOrders} đơn đã giao`);

      totalOrders += orders.length;
      totalRevenue += monthRevenue;
    }

    console.log('\n🎉 Hoàn thành tạo dữ liệu doanh thu cho cả năm!');
    console.log(`📊 Tổng kết: ${totalOrders} đơn hàng, ${formatCurrency(totalRevenue)} doanh thu`);
    console.log('💡 Bây giờ bạn có thể truy cập /admin/reports để xem báo cáo tổng quan 12 tháng');

  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu doanh thu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
};

// Run the script
generateFullYearOrders(); 