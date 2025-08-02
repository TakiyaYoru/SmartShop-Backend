// scripts/checkOrderDates.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Order } from '../data/models/index.js';

// Load environment variables
dotenv.config();

const checkOrderDates = async () => {
  try {
    console.log('🔍 Kiểm tra orderDate của các đơn hàng...');
    
    // Connect to MongoDB
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
      console.error('❌ DATABASE_URL không được cấu hình trong file .env');
      return;
    }
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Đã kết nối MongoDB');

    // Lấy tất cả orders và kiểm tra orderDate
    const orders = await Order.find({}).sort({ orderDate: -1 }).limit(20);
    
    console.log(`📊 Tìm thấy ${orders.length} đơn hàng gần nhất:`);
    console.log('='.repeat(80));
    
    orders.forEach((order, index) => {
      const orderDate = order.orderDate;
      const createdAt = order.createdAt;
      const updatedAt = order.updatedAt;
      
      console.log(`${index + 1}. Order: ${order.orderNumber}`);
      console.log(`   - orderDate: ${orderDate}`);
      console.log(`   - createdAt: ${createdAt}`);
      console.log(`   - updatedAt: ${updatedAt}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Total: ${order.totalAmount?.toLocaleString('vi-VN')} VND`);
      
      // Kiểm tra nếu orderDate bị null hoặc undefined
      if (!orderDate) {
        console.log(`   ⚠️  WARNING: orderDate is null/undefined!`);
      }
      
      // Kiểm tra nếu orderDate khác với createdAt quá nhiều
      if (orderDate && createdAt) {
        const diffHours = Math.abs(orderDate - createdAt) / (1000 * 60 * 60);
        if (diffHours > 24) {
          console.log(`   ⚠️  WARNING: orderDate differs from createdAt by ${diffHours.toFixed(1)} hours`);
        }
      }
      
      console.log('');
    });

    // Kiểm tra orders không có orderDate
    const ordersWithoutDate = await Order.find({ orderDate: { $exists: false } });
    console.log(`❌ Orders không có orderDate: ${ordersWithoutDate.length}`);
    
    if (ordersWithoutDate.length > 0) {
      console.log('Orders cần fix:');
      ordersWithoutDate.forEach(order => {
        console.log(`   - ${order.orderNumber} (${order.status})`);
      });
    }

    // Kiểm tra orders có orderDate null
    const ordersWithNullDate = await Order.find({ orderDate: null });
    console.log(`❌ Orders có orderDate null: ${ordersWithNullDate.length}`);
    
    if (ordersWithNullDate.length > 0) {
      console.log('Orders cần fix:');
      ordersWithNullDate.forEach(order => {
        console.log(`   - ${order.orderNumber} (${order.status})`);
      });
    }

    // Thống kê theo năm
    const yearStats = await Order.aggregate([
      {
        $group: {
          _id: { $year: '$orderDate' },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id': -1 }
      }
    ]);

    console.log('\n📊 Thống kê theo năm:');
    yearStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} orders, ${stat.totalRevenue?.toLocaleString('vi-VN')} VND`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra orderDate:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
  }
};

// Run the script
checkOrderDates(); 