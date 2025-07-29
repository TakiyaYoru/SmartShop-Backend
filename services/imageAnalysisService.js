import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Analyze image with Claude AI
export async function analyzeImageWithAI(imageData, imageType) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🤖 Claude AI - Analyzing image (attempt ${attempt}/${maxRetries})...`);
      
      const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Bạn là chuyên gia nhận dạng cơ bản sản phẩm điện tử. Hãy phân tích ảnh này và trả về JSON với format đơn giản:

{
  "detectedProduct": "Tên sản phẩm cơ bản (iPhone, Samsung Galaxy, iPad, MacBook, etc.)",
  "brand": "Thương hiệu (Apple, Samsung, etc.)",
  "category": "Loại sản phẩm (phone, tablet, laptop, etc.)",
  "confidence": "Mức độ tin cậy (high, medium, low)"
}

LƯU Ý QUAN TRỌNG:
- Chỉ nhận dạng cơ bản, không cần chi tiết
- Nếu thấy iPhone bất kỳ → detectedProduct: "iPhone", brand: "Apple"
- Nếu thấy Samsung bất kỳ → detectedProduct: "Samsung Galaxy", brand: "Samsung"
- Nếu thấy iPad → detectedProduct: "iPad", brand: "Apple"
- Nếu thấy laptop Apple → detectedProduct: "MacBook", brand: "Apple"
- Nếu thấy laptop Samsung → detectedProduct: "Samsung Laptop", brand: "Samsung"
- Nếu không chắc chắn → confidence: "low"
- TUYỆT ĐỐI KHÔNG nhận dạng nhầm: Samsung không được nhận dạng thành iPhone/MacBook
- Chỉ trả về JSON, không thêm text khác`
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageType,
                data: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
              }
            }
          ]
        }
      ]
    });

      const responseText = message.content[0].text;
      console.log('🤖 Claude AI Response:', responseText);
      
      // Parse JSON response
      const analysis = JSON.parse(responseText);
      
      return {
        detectedProduct: analysis.detectedProduct || 'Sản phẩm điện tử',
        brand: analysis.brand || null,
        category: analysis.category || 'electronics',
        confidence: analysis.confidence || 'low'
      };
      
    } catch (error) {
      console.error(`❌ Claude AI Image Analysis Error (attempt ${attempt}):`, error);
      lastError = error;
      
      // If it's an overloaded error, wait before retry
      if (error.status === 529 && attempt < maxRetries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        console.log(`⏳ Claude API overloaded, waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not a retryable error or max retries reached, break
      if (attempt === maxRetries || error.status !== 529) {
        break;
      }
    }
  }
  
  // All attempts failed, return fallback
  console.log('❌ All Claude AI attempts failed, using fallback analysis');
  return {
    detectedProduct: 'Sản phẩm điện tử',
    brand: null,
    category: 'electronics',
    confidence: 'low'
  };
}

// Search products based on basic image detection
export async function searchProductsByImageAnalysis(imageAnalysis, db) {
  try {
    console.log('🔍 Basic image detection result:', imageAnalysis);
    console.log('🔍 Database context:', db ? 'Available' : 'Missing');
    
    if (!db || !db.Product) {
      console.error('❌ Database or Product model not available');
      return [];
    }
    
    const { Product } = db;
    let query = {};
    
    // Simple search based on detected product
    console.log('🔍 Building simple search query for:', imageAnalysis.detectedProduct);
    
    if (imageAnalysis.detectedProduct) {
      // Smart search based on detected product and brand
      if (imageAnalysis.detectedProduct.toLowerCase().includes('iphone') || 
          (imageAnalysis.brand && imageAnalysis.brand.toLowerCase() === 'apple')) {
        // For iPhone/Apple, search for Apple products only
        query.$and = [
          { 'brand.name': { $regex: 'Apple', $options: 'i' } },
          { name: { $regex: 'iPhone', $options: 'i' } }
        ];
      } else if (imageAnalysis.detectedProduct.toLowerCase().includes('samsung') || 
                 imageAnalysis.detectedProduct.toLowerCase().includes('galaxy') ||
                 (imageAnalysis.brand && imageAnalysis.brand.toLowerCase() === 'samsung')) {
        // For Samsung Galaxy, search for Samsung products only
        query.$and = [
          { 'brand.name': { $regex: 'Samsung', $options: 'i' } },
          { $or: [
            { name: { $regex: 'Samsung', $options: 'i' } },
            { name: { $regex: 'Galaxy', $options: 'i' } }
          ]}
        ];
      } else if (imageAnalysis.detectedProduct.toLowerCase().includes('ipad')) {
        // For iPad, search for Apple iPad products only
        query.$and = [
          { 'brand.name': { $regex: 'Apple', $options: 'i' } },
          { name: { $regex: 'iPad', $options: 'i' } }
        ];
      } else if (imageAnalysis.detectedProduct.toLowerCase().includes('macbook')) {
        // For MacBook, search for Apple MacBook products only
        query.$and = [
          { 'brand.name': { $regex: 'Apple', $options: 'i' } },
          { name: { $regex: 'MacBook', $options: 'i' } }
        ];
      } else {
        // For other products, search by detected product name
        query.name = { $regex: imageAnalysis.detectedProduct, $options: 'i' };
      }
    } else if (imageAnalysis.brand) {
      // Fallback to brand search only
      query['brand.name'] = { $regex: imageAnalysis.brand, $options: 'i' };
    } else {
      // Final fallback to category
      query['category.name'] = { $regex: imageAnalysis.category || 'phone', $options: 'i' };
    }
    
    console.log('🔍 Final query:', JSON.stringify(query, null, 2));
    console.log('🔍 Detected product:', imageAnalysis.detectedProduct);
    console.log('🔍 Brand:', imageAnalysis.brand);
    
    // Execute search
    const products = await Product.find(query)
      .populate('brand')
      .populate('category')
      .limit(8)
      .sort({ isFeatured: -1, createdAt: -1 });
    
    console.log(`🔍 Found ${products.length} products`);
    
    return products;
    
  } catch (error) {
    console.error('❌ Product search error:', error);
    return [];
  }
} 