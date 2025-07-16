// Test script for chat functionality
import { analyzeUserQuery, filterProductsFromDB, generateProductSuggestions, generateResponseMessage } from './services/claudeService.js';
import { initDatabase } from './data/init.js';
import { db } from './config.js';

async function testChatFunctionality() {
  console.log('🧪 Testing Chat Functionality...\n');
  
  try {
    // Initialize database
    await initDatabase();
    console.log('✅ Database initialized');
    
    // Test 1: Analyze user query
    console.log('\n📝 Test 1: Analyzing user query');
    const testQuery = "iPhone dưới 20 triệu";
    const analysis = await analyzeUserQuery(testQuery);
    console.log('Analysis result:', JSON.stringify(analysis, null, 2));
    
    // Test 2: Filter products from database
    console.log('\n🔍 Test 2: Filtering products from database');
    const products = await filterProductsFromDB(analysis.analysis, db);
    console.log(`Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log('Sample product:', {
        name: products[0].name,
        price: products[0].price,
        brand: products[0].brand?.name
      });
    }
    
    // Test 3: Generate product suggestions
    console.log('\n🎯 Test 3: Generating product suggestions');
    const suggestions = generateProductSuggestions(products, analysis.analysis);
    console.log(`Generated ${suggestions.length} suggestions`);
    
    if (suggestions.length > 0) {
      console.log('Sample suggestion:', {
        product: suggestions[0].product.name,
        relevance: suggestions[0].relevance,
        reason: suggestions[0].reason
      });
    }
    
    // Test 4: Generate response message
    console.log('\n💬 Test 4: Generating response message');
    const response = generateResponseMessage(analysis.analysis, products);
    console.log('Response:', response);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test
testChatFunctionality(); 