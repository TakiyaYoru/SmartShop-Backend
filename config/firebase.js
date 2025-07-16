// server/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBm04DLTk2oxgyqyR5tJrBorLN6EFPeNiE",
  authDomain: "smartshop-65b1d.firebaseapp.com",
  projectId: "smartshop-65b1d",
  storageBucket: "smartshop-65b1d.firebasestorage.app",
  messagingSenderId: "838352067836",
  appId: "1:838352067836:web:05befe861e6c10b4a48b79"
  // Không cần measurementId cho backend
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Storage configuration
export const STORAGE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  productImagesPath: 'products/images/', // Thư mục lưu ảnh sản phẩm
  reviewImagesPath: 'reviews/images/', // Thư mục lưu ảnh review
  generalUploadsPath: 'uploads/' // Thư mục lưu file upload chung
};

console.log('🔥 Firebase Storage initialized successfully');