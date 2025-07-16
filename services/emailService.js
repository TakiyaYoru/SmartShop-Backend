// File: server/services/emailService.js (BEAUTIFUL EMAIL TEMPLATE)

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  const useRealEmail = process.env.USE_REAL_EMAIL === 'true';
  
  if (!useRealEmail) {
    return {
      sendMail: async (mailOptions) => {
        console.log('=== 📧 MOCK EMAIL SENT ===');
        console.log('📧 To:', mailOptions.to);
        console.log('🔢 OTP:', mailOptions.html.match(/\d{6}/)?.[0] || 'Not found');
        console.log('=========================');
        return { messageId: 'mock-' + Date.now() };
      }
    };
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

export const emailService = {
  async sendPasswordResetOTP(email, otp, userName) {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SmartShop Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 SmartShop - Mã xác thực đặt lại mật khẩu',
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SmartShop OTP Verification</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
              min-height: 100vh;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 24px;
              overflow: hidden;
              box-shadow: 0 32px 64px rgba(0, 0, 0, 0.15);
              position: relative;
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 200%;
              height: 200%;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.2"/><circle cx="90" cy="40" r="0.8" fill="white" opacity="0.15"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
              animation: float 20s ease-in-out infinite;
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
            .logo-container {
              position: relative;
              z-index: 2;
              margin-bottom: 20px;
            }
            .logo {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 80px;
              height: 80px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 20px;
              backdrop-filter: blur(10px);
              border: 2px solid rgba(255, 255, 255, 0.3);
              font-size: 32px;
              margin-bottom: 15px;
            }
            .header h1 {
              color: white;
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 8px;
              position: relative;
              z-index: 2;
            }
            .header p {
              color: rgba(255, 255, 255, 0.9);
              font-size: 16px;
              position: relative;
              z-index: 2;
            }
            .content {
              padding: 50px 40px;
            }
            .greeting {
              font-size: 24px;
              color: #1f2937;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .message {
              font-size: 16px;
              color: #6b7280;
              line-height: 1.6;
              margin-bottom: 35px;
            }
            .otp-section {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 2px dashed #e2e8f0;
              border-radius: 20px;
              padding: 35px;
              text-align: center;
              margin: 35px 0;
              position: relative;
            }
            .otp-section::before {
              content: '🔐';
              position: absolute;
              top: -15px;
              left: 30px;
              background: white;
              padding: 5px 10px;
              border-radius: 50px;
              font-size: 20px;
            }
            .otp-label {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 600;
            }
            .otp-code {
              font-size: 48px;
              font-weight: 900;
              color: #4f46e5;
              letter-spacing: 12px;
              margin: 15px 0;
              text-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
              font-family: 'Courier New', monospace;
            }
            .otp-timer {
              font-size: 14px;
              color: #f59e0b;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
            .security-tips {
              background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
              border-left: 4px solid #f59e0b;
              border-radius: 12px;
              padding: 25px;
              margin: 30px 0;
            }
            .security-tips h3 {
              color: #92400e;
              font-size: 16px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .security-tips ul {
              list-style: none;
              padding: 0;
            }
            .security-tips li {
              color: #78350f;
              font-size: 14px;
              margin-bottom: 8px;
              padding-left: 20px;
              position: relative;
            }
            .security-tips li::before {
              content: '⚡';
              position: absolute;
              left: 0;
              top: 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              margin: 25px 0;
              transition: all 0.3s ease;
              box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 35px rgba(79, 70, 229, 0.4);
            }
            .footer {
              background: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-note {
              color: #64748b;
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: 15px;
            }
            .footer-brand {
              color: #1f2937;
              font-weight: 600;
              font-size: 16px;
            }
            .footer-links {
              margin-top: 15px;
            }
            .footer-links a {
              color: #4f46e5;
              text-decoration: none;
              font-size: 13px;
              margin: 0 10px;
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
              margin: 30px 0;
            }
            @media (max-width: 600px) {
              .content { padding: 30px 25px; }
              .otp-code { font-size: 36px; letter-spacing: 8px; }
              .header { padding: 30px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <div class="logo-container">
                <div class="logo">🛒</div>
              </div>
              <h1>SmartShop</h1>
              <p>Hệ thống bảo mật thông minh</p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="greeting">Xin chào ${userName}! 👋</div>
              
              <div class="message">
                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản SmartShop của bạn. 
                Để đảm bảo bảo mật, vui lòng sử dụng mã xác thực bên dưới.
              </div>

              <!-- OTP Section -->
              <div class="otp-section">
                <div class="otp-label">Mã xác thực của bạn</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-timer">
                  ⏰ Có hiệu lực trong <strong>10 phút</strong>
                </div>
              </div>

              <!-- Security Tips -->
              <div class="security-tips">
                <h3>⚡ Lưu ý bảo mật quan trọng</h3>
                <ul>
                  <li>Mã này chỉ sử dụng được <strong>một lần duy nhất</strong></li>
                  <li>Không chia sẻ mã với bất kỳ ai, kể cả nhân viên SmartShop</li>
                  <li>Nếu không phải bạn yêu cầu, hãy bỏ qua email này</li>
                  <li>Đăng xuất khỏi tất cả thiết bị sau khi đổi mật khẩu</li>
                </ul>
              </div>

              <div class="divider"></div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/forgot-password" class="cta-button">
                  🚀 Đặt lại mật khẩu ngay
                </a>
              </div>

              <div class="divider"></div>

              <div style="text-align: center; color: #6b7280; font-size: 14px;">
                <strong>Cần hỗ trợ?</strong><br>
                Liên hệ đội ngũ hỗ trợ SmartShop 24/7<br>
                📧 support@smartshop.com | 📞 1900.xxxx
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="footer-note">
                Email này được gửi tự động từ hệ thống bảo mật SmartShop.<br>
                Vui lòng không trả lời trực tiếp email này.
              </div>
              <div class="footer-brand">© 2025 SmartShop - Điện tử thông minh</div>
              <div class="footer-links">
                <a href="#">Chính sách bảo mật</a> •
                <a href="#">Điều khoản sử dụng</a> •
                <a href="#">Trung tâm hỗ trợ</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
🛒 SmartShop - Mã xác thực đặt lại mật khẩu

Xin chào ${userName}!

Mã OTP của bạn: ${otp}

Mã này có hiệu lực trong 10 phút và chỉ sử dụng được một lần.

Truy cập: ${process.env.FRONTEND_URL}/forgot-password

Lưu ý bảo mật:
- Không chia sẻ mã này với bất kỳ ai
- SmartShop không bao giờ hỏi mã OTP qua điện thoại

Trân trọng,
Đội ngũ SmartShop Security
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Beautiful email sent successfully!');
      console.log('📧 To:', email);
      console.log('🔢 OTP:', otp);
      
      return { 
        success: true, 
        messageId: info.messageId 
      };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }
};