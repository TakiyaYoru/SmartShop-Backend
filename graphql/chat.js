export const typeDef = `
  type ChatMessage {
    id: ID!
    content: String!
    role: MessageRole!
    timestamp: String!
    userId: ID
  }

  type ProductSuggestion {
    product: Product!
    relevance: Float!
    reason: String!
  }

  type ChatResponse {
    message: String!
    suggestions: [ProductSuggestion!]
    analysis: QueryAnalysis
    mode: String
    addToCompare: Product
    shouldCompare: Boolean
  }

  type QueryAnalysis {
    brand: String
    maxPrice: Float
    minPrice: Float
    features: [String!]
    priceRange: String
    targetUser: String
    keywords: [String!]
  }

  enum MessageRole {
    USER
    ASSISTANT
  }

  input ChatInput {
    message: String!
    userId: ID
    context: ChatContextInput
  }

  input ChatContextInput {
    viewedProducts: [ID!]
    budget: Float
    preferredBrand: String
    userProfile: String
  }

  extend type Query {
    chatHistory(userId: ID!): [ChatMessage!]
  }

  extend type Mutation {
    sendMessage(input: ChatInput!): ChatResponse!
    searchProductsByVoice(audioUrl: String!): ChatResponse!
  }
`;

export const resolvers = {
  Query: {
    chatHistory: async (parent, args, context, info) => {
      // TODO: Implement chat history from database
      return [];
    }
  },

  Mutation: {
    sendMessage: async (parent, args, context, info) => {
      try {
        const { message, userId, context: chatContext } = args.input;
        
        console.log('🔥 FRONTEND CALL - Processing chat message:', message);
        console.log('🔥 FRONTEND CALL - Full args:', JSON.stringify(args, null, 2));
        
        // Analyze user query with Claude AI
        const analysis = await analyzeUserQuery(message);
        console.log('🔥 FRONTEND CALL - Analysis result:', JSON.stringify(analysis, null, 2));
        
        const intent = analysis.analysis?.intent;
        const action = analysis.analysis?.action;
        
        // Handle different intents
        if (intent === 'compare_mode') {
          return {
            message: analysis.response || "Đã chuyển sang chế độ so sánh. Bạn có thể chọn tối đa 3 sản phẩm để so sánh.",
            suggestions: [],
            analysis: analysis.analysis,
            mode: 'compare'
          };
        }
        
        if (intent === 'add_to_compare') {
          const productName = analysis.analysis?.productName;
          if (productName) {
            // Search for the specific product
            const searchAnalysis = {
              ...analysis.analysis,
              intent: 'buy',
              keywords: [productName]
            };
            const products = await filterProductsFromDB(searchAnalysis, context.db);
            
            if (products.length > 0) {
              const product = products[0]; // Get the first match
              return {
                message: `✅ Đã thêm "${product.name}" vào danh sách so sánh. Bạn có thể thêm thêm sản phẩm hoặc gõ "So sánh" để xem kết quả.`,
                suggestions: [],
                analysis: analysis.analysis,
                mode: 'compare',
                addToCompare: product
              };
            } else {
              return {
                message: `❌ Không tìm thấy sản phẩm "${productName}". Vui lòng thử tìm kiếm với tên khác.`,
                suggestions: [],
                analysis: analysis.analysis,
                mode: 'compare'
              };
            }
          }
        }
        
        if (intent === 'compare_products') {
          // This will be handled by frontend with stored products
          return {
            message: "Đang thực hiện so sánh các sản phẩm đã chọn...",
            suggestions: [],
            analysis: analysis.analysis,
            mode: 'compare',
            shouldCompare: true
          };
        }
        
        // Default search behavior
        const products = await filterProductsFromDB(analysis.analysis, context.db);
        console.log('🔥 FRONTEND CALL - Found products count:', products.length);
        
        // Generate product suggestions
        const suggestions = generateProductSuggestions(products, analysis.analysis);
        console.log('🔥 FRONTEND CALL - Suggestions count:', suggestions.length);
        
        // Create response message
        const responseMessage = generateResponseMessage(analysis.analysis, products);
        console.log('🔥 FRONTEND CALL - Response message:', responseMessage);
        
        const result = {
          message: responseMessage,
          suggestions,
          analysis: analysis.analysis,
          mode: intent === 'compare_mode' ? 'compare' : 'search'
        };
        
        console.log('🔥 FRONTEND CALL - Final result suggestions count:', result.suggestions.length);
        return result;
        
      } catch (error) {
        console.error('❌ Error in sendMessage:', error);
        throw new Error('Lỗi khi xử lý tin nhắn chat');
      }
    },

    searchProductsByVoice: async (parent, args, context, info) => {
      try {
        const { audioUrl } = args;
        
        // TODO: Implement speech-to-text conversion
        // For now, return a placeholder response
        return {
          message: "Tính năng tìm kiếm bằng giọng nói sẽ được triển khai sớm!",
          suggestions: [],
          analysis: null
        };
        
      } catch (error) {
        console.error('❌ Error in searchProductsByVoice:', error);
        throw new Error('Lỗi khi xử lý tìm kiếm bằng giọng nói');
      }
    }
  }
};

// Import Claude service
import { 
  analyzeUserQuery, 
  filterProductsFromDB, 
  generateProductSuggestions, 
  generateResponseMessage 
} from '../services/claudeService.js'; 