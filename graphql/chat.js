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
        
        // Get products from database based on analysis
        const products = await filterProductsFromDB(analysis.analysis, context.db);
        console.log('🔥 FRONTEND CALL - Found products count:', products.length);
        console.log('🔥 FRONTEND CALL - First 3 products:', products.slice(0, 3).map(p => ({ name: p.name, price: p.price, brand: p.brand?.name })));
        console.log('🔥 FRONTEND CALL - All product names:', products.map(p => p.name));
        
        // Generate product suggestions
        const suggestions = generateProductSuggestions(products, analysis.analysis);
        console.log('🔥 FRONTEND CALL - Suggestions count:', suggestions.length);
        
        // Create response message
        const responseMessage = generateResponseMessage(analysis.analysis, products);
        console.log('🔥 FRONTEND CALL - Response message:', responseMessage);
        
        const result = {
          message: responseMessage,
          suggestions,
          analysis: analysis.analysis
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