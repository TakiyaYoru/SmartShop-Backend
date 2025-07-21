// test-google-auth.js - Test Google Auth functionality

import dotenv from 'dotenv';
import { verifyGoogleToken, generateUsernameFromEmail, formatVietnamPhone } from './services/googleAuthService.js';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Google Auth Backend Components...\n');

async function testGoogleAuthService() {
  console.log('=== Testing Google Auth Service ===');
  
  // Test 1: Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  
  // Test 2: Username generation
  console.log('\n📧 Testing Username Generation:');
  const testEmails = [
    'user@gmail.com',
    'test.user@example.com',
    'admin@smartshop.com'
  ];
  
  testEmails.forEach(email => {
    const username = generateUsernameFromEmail(email);
    console.log(`   ${email} → ${username}`);
  });
  
  // Test 3: Phone formatting
  console.log('\n📱 Testing Vietnam Phone Formatting:');
  const testPhones = [
    '0987654321',
    '84987654321',
    '+84987654321',
    '987654321'
  ];
  
  testPhones.forEach(phone => {
    const formatted = formatVietnamPhone(phone);
    console.log(`   ${phone} → ${formatted}`);
  });
  
  // Test 4: Google Token Verification (mock test)
  console.log('\n🔐 Testing Google Token Verification:');
  try {
    // This will fail with invalid token, but we test the function exists
    await verifyGoogleToken('invalid_token');
  } catch (error) {
    if (error.message === 'Invalid Google token') {
      console.log('   ✅ Google token verification function works (expected failure with invalid token)');
    } else {
      console.log('   ❌ Unexpected error:', error.message);
    }
  }
  
  console.log('\n=== Google Auth Service Test Complete ===\n');
}

async function testDatabaseConnection() {
  console.log('=== Testing Database Connection ===');
  
  try {
    // Import database
    const { initDatabase } = await import('./data/init.js');
    const { db } = await import('./config.js');
    
    // Initialize database
    await initDatabase();
    
    console.log('✅ Database connection successful');
    console.log('📊 Available collections:', Object.keys(db));
    
    // Test user operations
    if (db.users) {
      console.log('✅ User collection available');
      
      // Check if we can query users (will be empty, that's fine)
      const userCount = await db.users.count ? await db.users.count() : 0;
      console.log(`📈 Current user count: ${userCount}`);
    } else {
      console.log('❌ User collection missing');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
  
  console.log('\n=== Database Test Complete ===\n');
}

async function testGraphQLSchema() {
  console.log('=== Testing GraphQL Schema ===');
  
  try {
    // Import schema
    const { schema } = await import('./graphql/schema.js');
    
    console.log('✅ GraphQL schema imported successfully');
    
    // Check if Google Auth types are included
    const schemaString = schema.toString();
    
    if (schemaString.includes('GoogleAuthInput')) {
      console.log('✅ GoogleAuthInput type found in schema');
    } else {
      console.log('❌ GoogleAuthInput type missing from schema');
    }
    
    if (schemaString.includes('googleAuth')) {
      console.log('✅ googleAuth mutation found in schema');
    } else {
      console.log('❌ googleAuth mutation missing from schema');
    }
    
    if (schemaString.includes('completeProfile')) {
      console.log('✅ completeProfile mutation found in schema');
    } else {
      console.log('❌ completeProfile mutation missing from schema');
    }
    
  } catch (error) {
    console.error('❌ GraphQL schema test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
  
  console.log('\n=== GraphQL Schema Test Complete ===\n');
}

async function runAllTests() {
  try {
    await testGoogleAuthService();
    await testDatabaseConnection();
    await testGraphQLSchema();
    
    console.log('🎉 All tests completed!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start backend: npm run dev');
    console.log('   2. Test GraphQL playground at http://localhost:4000');
    console.log('   3. Test Google Auth mutations in GraphQL playground');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();