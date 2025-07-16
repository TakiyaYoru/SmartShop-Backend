import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Import models
import { Review } from '../data/models/review.js';
import { Product, User } from '../data/models/index.js';

const addTestReviews = async () => {
  try {
    // Get first product
    const product = await Product.findOne();
    if (!product) {
      console.log('No products found');
      return;
    }

    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found');
      return;
    }

    // Create test reviews
    const testReviews = [
      {
        productId: product._id,
        userId: user._id,
        orderId: new mongoose.Types.ObjectId(), // Mock order ID
        rating: 5,
        comment: 'Sản phẩm rất tốt, chất lượng cao!',
        images: [],
        isVerified: true,
        createdAt: new Date()
      },
      {
        productId: product._id,
        userId: user._id,
        orderId: new mongoose.Types.ObjectId(),
        rating: 4,
        comment: 'Sản phẩm tốt, giao hàng nhanh',
        images: [],
        isVerified: true,
        createdAt: new Date()
      },
      {
        productId: product._id,
        userId: user._id,
        orderId: new mongoose.Types.ObjectId(),
        rating: 3,
        comment: 'Sản phẩm tạm được',
        images: [],
        isVerified: true,
        createdAt: new Date()
      }
    ];

    // Clear existing reviews for this product
    await Review.deleteMany({ productId: product._id });

    // Add new test reviews
    for (const reviewData of testReviews) {
      const review = new Review(reviewData);
      await review.save();
      console.log(`Added review with rating ${reviewData.rating}`);
    }

    console.log('Test reviews added successfully!');
    console.log(`Product: ${product.name}`);
    console.log(`User: ${user.username}`);

  } catch (error) {
    console.error('Error adding test reviews:', error);
  } finally {
    mongoose.connection.close();
  }
};

addTestReviews(); 