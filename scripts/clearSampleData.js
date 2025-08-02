// scripts/clearSampleData.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order, OrderItem } from '../data/models/index.js';

// Load environment variables
dotenv.config();

const clearSampleData = async () => {
  try {
    console.log('🧹 Bắt đầu xóa dữ liệu mẫu cũ...');
    
    // Connect to MongoDB
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL không được cấu hình trong file .env');
      return;
    }
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Đã kết nối MongoDB');

    // Xóa tất cả đơn hàng mẫu (có orderNumber bắt đầu bằng DH2025)
    const deleteOrdersResult = await Order.deleteMany({
      orderNumber: { $regex: /^DH2025/ }
    });
    console.log(`🗑️ Đã xóa ${deleteOrdersResult.deletedCount} đơn hàng mẫu`);

    // Xóa tất cả order items liên quan
    const deleteOrderItemsResult = await OrderItem.deleteMany({
      productName: { 
        $in: [
          'iPhone 15 Pro',
          'Samsung Galaxy S24', 
          'MacBook Air M2',
          'Dell XPS 13',
          'iPad Air',
          'Samsung Tab S9',
          'AirPods Pro',
          'Sony WH-1000XM5',
          'Apple Watch Series 9',
          'Samsung Galaxy Watch 6'
        ]
      }
    });
    console.log(`🗑️ Đã xóa ${deleteOrderItemsResult.deletedCount} chi tiết đơn hàng mẫu`);

    console.log('✅ Hoàn thành xóa dữ liệu mẫu!');
    console.log('💡 Bây giờ bạn có thể tạo dữ liệu mẫu mới hoặc test với đơn hàng thật');

  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu mẫu:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
};

// Run the script
clearSampleData(); 