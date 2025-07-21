// graphql/googleAuth.js

import jwt from 'jsonwebtoken';
import { verifyGoogleToken, generateUsernameFromEmail } from '../services/googleAuthService.js';
import { User } from '../data/models/user.js'; // ← FIX THIS LINE

export const typeDef = `
  # Input for Google authentication
  input GoogleAuthInput {
    token: String!
  }

  # Response for Google authentication
  type GoogleAuthResponse {
    success: Boolean!
    message: String!
    token: String
    user: UserInfo
    requiresProfileCompletion: Boolean!
  }

  # Input for profile completion after Google auth
  input CompleteProfileInput {
    phone: String!
    address: String!
    firstName: String
    lastName: String
  }

  # Response for profile completion
  type CompleteProfileResponse {
    success: Boolean!
    message: String!
    user: UserInfo
  }

  extend type Mutation {
    # Authenticate with Google
    googleAuth(input: GoogleAuthInput!): GoogleAuthResponse!
    
    # Complete profile after Google authentication
    completeProfile(input: CompleteProfileInput!): CompleteProfileResponse!
  }
`;

export const resolvers = {
  Mutation: {
    googleAuth: async (parent, args, context, info) => {
      try {
        const { token } = args.input;
        console.log('🔥 Google Auth mutation called');

        // Verify Google token
        const googleUserInfo = await verifyGoogleToken(token);
        console.log('📧 Google user email:', googleUserInfo.email);

        // Check if user already exists by email
        let existingUser = await User.findOne({ email: googleUserInfo.email });

        if (existingUser) {
          console.log('👤 Existing user found, linking Google account...');
          
          // Link Google account to existing user
          existingUser.googleId = googleUserInfo.googleId;
          existingUser.isGoogleUser = true;
          existingUser.avatar = googleUserInfo.avatar;
          existingUser.isEmailVerified = true;
          
          // Update name if not set or if Google provides better info
          if (!existingUser.firstName && googleUserInfo.firstName) {
            existingUser.firstName = googleUserInfo.firstName;
          }
          if (!existingUser.lastName && googleUserInfo.lastName) {
            existingUser.lastName = googleUserInfo.lastName;
          }
          
          await existingUser.save();
          console.log('✅ Google account linked to existing user');
          
        } else {
          console.log('🆕 Creating new user from Google account...');
          
          // Create new user from Google info
          const username = generateUsernameFromEmail(googleUserInfo.email);
          
          existingUser = new User({
            username,
            email: googleUserInfo.email,
            firstName: googleUserInfo.firstName,
            lastName: googleUserInfo.lastName,
            googleId: googleUserInfo.googleId,
            avatar: googleUserInfo.avatar,
            isGoogleUser: true,
            isEmailVerified: true,
            profileCompleted: false // Will be false until phone/address added
          });
          
          await existingUser.save();
          console.log('✅ New Google user created');
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
          { 
            id: existingUser._id, 
            email: existingUser.email,
            isAdmin: existingUser.isAdmin 
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Check if profile completion is required
        const requiresProfileCompletion = !existingUser.isProfileComplete();
        
        console.log('🎯 Profile completion required:', requiresProfileCompletion);

        return {
          success: true,
          message: requiresProfileCompletion 
            ? 'Đăng nhập thành công! Vui lòng hoàn thiện thông tin cá nhân.'
            : 'Đăng nhập Google thành công!',
          token: jwtToken,
          user: {
            _id: existingUser._id,
            username: existingUser.username,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            role: existingUser.role || 'customer'
          },
          requiresProfileCompletion
        };

      } catch (error) {
        console.error('❌ Google Auth error:', error);
        return {
          success: false,
          message: error.message || 'Đăng nhập Google thất bại',
          token: null,
          user: null,
          requiresProfileCompletion: false
        };
      }
    },

    completeProfile: async (parent, args, context, info) => {
      try {
        console.log('🔥 Complete Profile mutation called');
        
        // Check authentication
        if (!context.user) {
          throw new Error('Bạn cần đăng nhập để hoàn thiện thông tin');
        }

        const { phone, address, firstName, lastName } = args.input;
        const userId = context.user.id;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
          throw new Error('Không tìm thấy user');
        }

        // Validate Vietnam phone number
        const phoneRegex = /^(\+84|84|0)[0-9]{8,9}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          throw new Error('Số điện thoại không hợp lệ (định dạng VN)');
        }

        // Update user information
        user.phone = phone.trim();
        user.address = address.trim();
        
        if (firstName && firstName.trim()) {
          user.firstName = firstName.trim();
        }
        if (lastName && lastName.trim()) {
          user.lastName = lastName.trim();
        }

        // Save user (profileCompleted will be auto-updated via pre-save hook)
        await user.save();
        
        console.log('✅ Profile completed successfully');
        console.log('📱 Phone:', user.phone);
        console.log('🏠 Address:', user.address);
        console.log('✔️ Profile completed:', user.profileCompleted);

        return {
          success: true,
          message: 'Hoàn thiện thông tin cá nhân thành công!',
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role || 'customer'
          }
        };

      } catch (error) {
        console.error('❌ Complete Profile error:', error);
        return {
          success: false,
          message: error.message || 'Lỗi khi hoàn thiện thông tin',
          user: null
        };
      }
    }
  }
};