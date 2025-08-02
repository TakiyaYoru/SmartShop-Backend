// scripts/generateSampleOrders.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order, OrderItem, Product, User } from '../data/models/index.js';

// Load environment variables
dotenv.config();

// Sample data - Giá thực tế hơn
const sampleProducts = [
  { name: 'iPhone 15 Pro', sku: 'IP15PRO-128', price: 25000000, category: 'Điện thoại', brand: 'Apple' },
  { name: 'Samsung Galaxy S24', sku: 'SGS24-256', price: 22000000, category: 'Điện thoại', brand: 'Samsung' },
  { name: 'MacBook Air M2', sku: 'MBA-M2-256', price: 28000000, category: 'Laptop', brand: 'Apple' },
  { name: 'Dell XPS 13', sku: 'DXP13-512', price: 32000000, category: 'Laptop', brand: 'Dell' },
  { name: 'iPad Air', sku: 'IPAIR-64', price: 15000000, category: 'Máy tính bảng', brand: 'Apple' },
  { name: 'Samsung Tab S9', sku: 'STS9-128', price: 18000000, category: 'Máy tính bảng', brand: 'Samsung' },
  { name: 'AirPods Pro', sku: 'APP-2GEN', price: 6500000, category: 'Tai nghe', brand: 'Apple' },
  { name: 'Sony WH-1000XM5', sku: 'SWH-XM5', price: 8500000, category: 'Tai nghe', brand: 'Sony' },
  { name: 'Apple Watch Series 9', sku: 'AWS9-45', price: 12000000, category: 'Đồng hồ thông minh', brand: 'Apple' },
  { name: 'Samsung Galaxy Watch 6', sku: 'SGW6-44', price: 9500000, category: 'Đồng hồ thông minh', brand: 'Samsung' }
];

const sampleCustomers = [
  { fullName: 'Nguyễn Văn An', phone: '0901234567', address: '123 Đường ABC, Quận 1', city: 'TP.HCM' },
  { fullName: 'Trần Thị Bình', phone: '0901234568', address: '456 Đường XYZ, Quận 2', city: 'TP.HCM' },
  { fullName: 'Lê Văn Cường', phone: '0901234569', address: '789 Đường DEF, Quận 3', city: 'TP.HCM' },
  { fullName: 'Phạm Thị Dung', phone: '0901234570', address: '321 Đường GHI, Quận 4', city: 'TP.HCM' },
  { fullName: 'Hoàng Văn Em', phone: '0901234571', address: '654 Đường JKL, Quận 5', city: 'TP.HCM' },
  { fullName: 'Vũ Thị Phương', phone: '0901234572', address: '987 Đường MNO, Quận 6', city: 'TP.HCM' },
  { fullName: 'Đặng Văn Giang', phone: '0901234573', address: '147 Đường PQR, Quận 7', city: 'TP.HCM' },
  { fullName: 'Bùi Thị Hoa', phone: '0901234574', address: '258 Đường STU, Quận 8', city: 'TP.HCM' },
  { fullName: 'Ngô Văn Khoa', phone: '0901234575', address: '369 Đường VWX, Quận 9', city: 'TP.HCM' },
  { fullName: 'Đỗ Thị Lan', phone: '0901234576', address: '741 Đường YZ, Quận 10', city: 'TP.HCM' }
];

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
const statusWeights = [0.1, 0.2, 0.15, 0.2, 0.3, 0.05]; // 70% completed/shipping, 20% pending/confirmed, 10% cancelled

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

// Helper function to get random date within range
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const generateSampleOrders = async () => {
  try {
    console.log('🚀 Bắt đầu tạo dữ liệu mẫu cho báo cáo...');
    
    // Connect to MongoDB
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL không được cấu hình trong file .env');
      return;
    }
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Đã kết nối MongoDB');

    // Get existing products and users
    const products = await Product.find({ isActive: true }).limit(10);
    const users = await User.find({ role: 'customer' }).limit(10);

    if (products.length === 0) {
      console.log('❌ Không tìm thấy sản phẩm nào. Vui lòng tạo sản phẩm trước.');
      return;
    }

    if (users.length === 0) {
      console.log('❌ Không tìm thấy user nào. Vui lòng tạo user trước.');
      return;
    }

    console.log(`📦 Tìm thấy ${products.length} sản phẩm`);
    console.log(`👥 Tìm thấy ${users.length} users`);

    // Generate orders for last 3 months - GIẢM XUỐNG 50 ĐƠN HÀNG
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    const orders = [];
    const orderItems = [];

    console.log('📅 Tạo đơn hàng từ', startDate.toLocaleDateString('vi-VN'), 'đến', endDate.toLocaleDateString('vi-VN'));

    // GIẢM XUỐNG 50 ĐƠN HÀNG THAY VÌ 300
    for (let i = 1; i <= 50; i++) {
      const orderDate = getRandomDate(startDate, endDate);
      const status = getRandomItemWithWeight(orderStatuses, statusWeights);
      const paymentMethod = getRandomItemWithWeight(paymentMethods, paymentWeights);
      const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
      const user = users[Math.floor(Math.random() * users.length)];

      // Generate order number
      const orderNumber = `DH${orderDate.getFullYear()}${String(orderDate.getTime()).slice(-8)}${String(i).padStart(3, '0')}`;

      // GIẢM SỐ LƯỢNG SẢN PHẨM: 1-3 items per order thay vì 1-5
      const itemCount = Math.floor(Math.random() * 3) + 1;
      let subtotal = 0;
      const items = [];

      for (let j = 0; j < itemCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        // GIẢM QUANTITY: 1-2 thay vì 1-3
        const quantity = Math.floor(Math.random() * 2) + 1;
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

      // Add some variation to total amount (discounts, etc.)
      const discount = Math.random() > 0.7 ? Math.random() * 0.1 : 0; // 30% chance of 0-10% discount
      const totalAmount = subtotal * (1 - discount);

      const order = {
        orderNumber,
        userId: user._id,
        customerInfo: customer,
        status,
        paymentMethod,
        paymentStatus: status === 'delivered' ? 'paid' : (status === 'cancelled' ? 'refunded' : 'pending'),
        subtotal,
        totalAmount: Math.round(totalAmount),
        orderDate,
        customerNotes: Math.random() > 0.8 ? 'Giao hàng vào buổi chiều' : '',
        adminNotes: status === 'cancelled' ? 'Khách hàng yêu cầu hủy' : '',
        items: items // Lưu items array vào order
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

    // Insert orders
    console.log('💾 Đang lưu đơn hàng...');
    const insertedOrders = await Order.insertMany(orders);
    console.log(`✅ Đã tạo ${insertedOrders.length} đơn hàng`);

    // Generate order items
    for (let i = 0; i < insertedOrders.length; i++) {
      const order = insertedOrders[i];
      const orderData = orders[i];
      
      // orderData.items is already an array from the loop above
      for (const item of orderData.items) {
        orderItems.push({
          orderId: order._id,
          ...item
        });
      }
    }

    // Insert order items
    console.log('💾 Đang lưu chi tiết đơn hàng...');
    const insertedOrderItems = await OrderItem.insertMany(orderItems);
    console.log(`✅ Đã tạo ${insertedOrderItems.length} chi tiết đơn hàng`);

    // Calculate statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

    console.log('\n📊 Thống kê dữ liệu mẫu:');
    console.log(`💰 Tổng doanh thu: ${formatCurrency(totalRevenue)}`);
    console.log(`📦 Tổng đơn hàng: ${orders.length}`);
    console.log(`✅ Đơn đã giao: ${deliveredOrders} (${(deliveredOrders/orders.length*100).toFixed(1)}%)`);
    console.log(`❌ Đơn đã hủy: ${cancelledOrders} (${(cancelledOrders/orders.length*100).toFixed(1)}%)`);
    console.log(`📅 Thời gian: ${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`);

    console.log('\n🎉 Hoàn thành tạo dữ liệu mẫu!');
    console.log('💡 Bây giờ bạn có thể truy cập /admin/reports để xem báo cáo');

  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu mẫu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
};

// Run the script
generateSampleOrders(); 