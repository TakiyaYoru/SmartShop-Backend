export const typeDef = `
  extend type Mutation {
    compareProducts(input: CompareProductsInput!): ProductComparison!
  }
`;

export const resolvers = {
  Mutation: {
    compareProducts: async (parent, args, context, info) => {
      try {
        const { productIds, userPreferences } = args.input;
        
        console.log('🔍 Comparing products:', productIds);
        
        // Validate input
        if (!productIds || productIds.length < 2 || productIds.length > 3) {
          throw new Error('Phải chọn từ 2-3 sản phẩm để so sánh');
        }
        
        // Get products from database
        const products = [];
        for (const productId of productIds) {
          const product = await context.db.products.findById(productId);
          if (!product) {
            throw new Error(`Sản phẩm với ID ${productId} không tồn tại`);
          }
          products.push(product);
        }
        
        console.log('✅ Found products:', products.map(p => p.name));
        
        // Analyze products with Claude AI
        const analysis = await analyzeProductComparison(products, userPreferences);
        
        const result = {
          products,
          analysis,
          recommendations: analysis.recommendations || [],
          createdAt: new Date().toISOString()
        };
        
        console.log('✅ Comparison analysis completed');
        return result;
        
      } catch (error) {
        console.error('❌ Error in compareProducts:', error);
        throw new Error(`Lỗi khi so sánh sản phẩm: ${error.message}`);
      }
    }
  }
};

// Import Claude service for comparison analysis
import { analyzeProductComparison } from '../services/claudeService.js'; 