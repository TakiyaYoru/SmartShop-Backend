// services/googleAuthService.js - FIXED để accept access token

import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google token (ID token hoặc access token) and extract user information
 * @param {string} token - Google token from frontend
 * @returns {Object} - Verified user information
 */
export async function verifyGoogleToken(token) {
  try {
    console.log('🔍 Verifying Google token...');
    console.log('🔍 Token type check:', token.includes('.') ? 'JWT (ID token)' : 'Access token');
    
    // Check if token is JWT format (ID token) or access token
    if (token.includes('.') && token.split('.').length === 3) {
      // This is likely an ID token (JWT format)
      return await verifyIDToken(token);
    } else {
      // This is likely an access token
      return await verifyAccessToken(token);
    }
    
  } catch (error) {
    console.error('❌ Google token verification failed:', error.message);
    throw new Error('Invalid Google token');
  }
}

/**
 * Verify Google ID Token (JWT)
 */
async function verifyIDToken(idToken) {
  try {
    console.log('🔍 Verifying ID token with Google Auth Library...');
    
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    console.log('✅ ID token verified successfully');
    
    return extractUserInfoFromPayload(payload);
  } catch (error) {
    console.error('❌ ID token verification failed:', error.message);
    throw error;
  }
}

/**
 * Verify Google Access Token
 */
async function verifyAccessToken(accessToken) {
  try {
    console.log('🔍 Verifying access token by calling Google API...');
    
    // Get user info using access token
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
    
    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }
    
    const userInfo = await response.json();
    console.log('✅ Access token verified successfully');
    console.log('📧 Email:', userInfo.email);
    console.log('👤 Name:', userInfo.name);
    
    // Convert Google API response to our expected format
    return {
      googleId: userInfo.id,
      email: userInfo.email,
      firstName: userInfo.given_name || '',
      lastName: userInfo.family_name || '',
      fullName: userInfo.name,
      avatar: userInfo.picture,
      isEmailVerified: userInfo.verified_email || false
    };
    
  } catch (error) {
    console.error('❌ Access token verification failed:', error.message);
    throw error;
  }
}

/**
 * Extract user info from ID token payload
 */
function extractUserInfoFromPayload(payload) {
  return {
    googleId: payload.sub,
    email: payload.email,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    fullName: payload.name,
    avatar: payload.picture,
    isEmailVerified: payload.email_verified || false
  };
}

/**
 * Generate username from email (unique fallback)
 * @param {string} email 
 * @returns {string} - Generated username
 */
export function generateUsernameFromEmail(email) {
  const baseName = email.split('@')[0];
  const timestamp = Date.now().toString().slice(-4);
  return `${baseName}_${timestamp}`;
}

/**
 * Format Vietnamese phone number
 * @param {string} phone 
 * @returns {string} - Formatted phone number
 */
export function formatVietnamPhone(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Convert to +84 format
  if (digits.startsWith('0')) {
    return `+84${digits.slice(1)}`;
  } else if (digits.startsWith('84')) {
    return `+${digits}`;
  } else if (digits.startsWith('+84')) {
    return digits;
  }
  
  return `+84${digits}`;
}