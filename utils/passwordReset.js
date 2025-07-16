import crypto from 'crypto';

export const passwordResetUtils = {
  // Tạo token ngẫu nhiên an toàn
  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  },

  // Tạo thời gian hết hạn (1 giờ từ bây giờ)
  generateTokenExpiry() {
    return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  },

  // Kiểm tra token đã hết hạn chưa
  isTokenExpired(expiryDate) {
    return new Date() > expiryDate;
  }
};