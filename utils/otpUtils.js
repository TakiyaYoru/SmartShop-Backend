// File: server/utils/otpUtils.js (TẠO FILE MỚI)

import crypto from 'crypto';

export const otpUtils = {
  // Tạo OTP 6 số ngẫu nhiên
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Tạo thời gian hết hạn OTP (10 phút từ bây giờ)
  generateOTPExpiry() {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  },

  // Kiểm tra OTP đã hết hạn chưa
  isOTPExpired(expiryDate) {
    return new Date() > expiryDate;
  },

  // Validate OTP format (6 số)
  isValidOTPFormat(otp) {
    return /^[0-9]{6}$/.test(otp);
  },

  // So sánh OTP (có thể thêm hash sau này nếu cần)
  compareOTP(inputOTP, storedOTP) {
    return inputOTP === storedOTP;
  }
};