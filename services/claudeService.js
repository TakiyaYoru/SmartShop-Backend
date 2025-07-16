import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Claude API
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
});

// Enhanced prompt for Claude API
const createAnalysisPrompt = (message) => {
    return `Bạn là chuyên gia tư vấn điện thoại thông minh của SmartShop. Hãy phân tích YÝ ĐỊNH và NGỮ CẢNH của khách hàng để đưa ra gợi ý chính xác.

NGÔN NGỮ: Trả lời bằng tiếng Việt thân thiện, tự nhiên.

YÊU CẦU KHÁCH HÀNG: "${message}"

🚨 QUAN TRỌNG - PHÂN TÍCH YÝ ĐỊNH:
1. ❌ TỪ CHỐI/GHÉT: "ghét", "không thích", "tệ", "dở", "kém" → KHÔNG TÌM thương hiệu đó
2. ❌ LOẠI TRỪ: "không muốn", "trừ ra", "ngoại trừ", "không phải" → LOẠI TRỪ
3. ✅ MUỐN MUA: "mua", "tìm", "cần", "muốn", "gợi ý", "xem" → TÌM sản phẩm
4. 🔍 LOẠI SẢN PHẨM: "điện thoại", "smartphone", "phone", "di động" → CHỈ TÌM ĐIỆN THOẠI

THƯƠNG HIỆU: Apple, Samsung, Xiaomi, OPPO, Vivo, Realme, Nokia

FORMAT JSON:
{
  "analysis": {
    "brand": "tên_thương_hiệu_nếu_MUỐN_MUA_hoặc_null",
    "maxPrice": số_tiền_tối_đa_VND_hoặc_null,
    "minPrice": số_tiền_tối_thiểu_VND_hoặc_null,
    "features": ["danh_sách_tính_năng"],
    "priceRange": "budget/mid-range/flagship/null",
    "targetUser": "học sinh sinh viên/người lớn tuổi/chuyên nghiệp/null",
    "keywords": ["từ_khóa_tìm_kiếm"],
    "productType": "phone/null",
    "excludeBrands": ["thương_hiệu_bị_loại_trừ"],
    "intent": "buy/exclude/neutral"
  },
  "response": "câu_trả_lời_phù_hợp_với_ý_định",
  "suggestions": ["gợ_ý_phù_hợp"]
}

VÍ DỤ THÔNG MINH:
❌ "Tôi ghét iPhone" → intent: "exclude", excludeBrands: ["Apple"], brand: null, response: "Tôi hiểu bạn không thích iPhone. Tôi có thể gợi ý điện thoại Samsung, Xiaomi hay thương hiệu khác?"

✅ "Mua điện thoại Samsung" → intent: "buy", brand: "Samsung", productType: "phone", excludeBrands: []

❌ "Laptop gaming" → intent: "neutral", productType: null, response: "Xin lỗi, chúng tôi chỉ chuyên điện thoại. Bạn có muốn xem điện thoại gaming không?"

✅ "Điện thoại không phải iPhone" → intent: "buy", excludeBrands: ["Apple"], productType: "phone"

✅ "iPhone 15 dưới 25 triệu" → intent: "buy", brand: "Apple", maxPrice: 25000000, keywords: ["iPhone"]

CHỈ trả về JSON, không thêm text khác.`;
};

// Enhanced query analysis with Claude
export async function analyzeUserQuery(message) {
    try {
        console.log('🤖 Analyzing query with Claude:', message);
        
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1500,
            temperature: 0.1,
            messages: [{
                role: 'user',
                content: createAnalysisPrompt(message)
            }]
        });

        const aiResponse = response.content[0].text;
        console.log('🔍 Claude raw response:', aiResponse);

        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ Analysis successful:', parsed);
            return parsed;
        } else {
            throw new Error('No valid JSON found in Claude response');
        }

    } catch (error) {
        console.warn('⚠️ Claude analysis failed, using fallback:', error.message);
        return {
            analysis: fallbackParseQuery(message),
            response: `Tôi đã phân tích yêu cầu "${message}" của bạn. Đây là những sản phẩm phù hợp:`,
            suggestions: []
        };
    }
}

// Enhanced fallback parsing with better Vietnamese processing
function fallbackParseQuery(query) {
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    console.log('🔄 Using enhanced fallback for:', query);
    
    // Brand detection - improved
    let brand = null;
    if (q.includes('iphone') || q.includes('apple')) {
        brand = 'Apple';
    } else if (q.includes('samsung') || q.includes('sam sung')) {
        brand = 'Samsung';
    } else if (q.includes('xiaomi') || q.includes('redmi') || q.includes('mi')) {
        brand = 'Xiaomi';
    } else if (q.includes('oppo')) {
        brand = 'OPPO';
    } else if (q.includes('vivo')) {
        brand = 'Vivo';
    }
    
    console.log('🔍 Fallback brand detection:', brand);
    
    // Enhanced price extraction
    let maxPrice = null, minPrice = null, priceRange = null;
    
    // Extract numbers with "triệu", "tr", "k"
    const priceMatches = q.match(/(\d+(?:[.,]\d+)?)\s*(?:triệu|tr|k)/gi);
    if (priceMatches) {
        const prices = priceMatches.map(match => {
            const num = parseFloat(match.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (match.toLowerCase().includes('k')) return num * 1000;
            return num * 1000000;
        });
        
        if (q.includes('duoi') || q.includes('dưới') || q.includes('tối đa') || q.includes('có')) {
            maxPrice = Math.max(...prices);
        } else if (q.includes('trên') || q.includes('từ') || q.includes('tối thiểu')) {
            minPrice = Math.min(...prices);
        } else if (q.includes('tầm') || q.includes('khoảng') || q.includes('từ') && q.includes('đến')) {
            if (prices.length >= 2) {
                minPrice = Math.min(...prices);
                maxPrice = Math.max(...prices);
            } else {
                const basePrice = prices[0];
                minPrice = basePrice * 0.8;
                maxPrice = basePrice * 1.2;
            }
        } else if (prices.length === 1) {
            maxPrice = prices[0] * 1.1; // 10% buffer
            minPrice = prices[0] * 0.9;
        }
        
        // Determine price range
        const avgPrice = maxPrice || minPrice || (prices.length > 0 ? prices[0] : 0);
        if (avgPrice < 8000000) priceRange = 'budget';
        else if (avgPrice <= 20000000) priceRange = 'mid-range';  
        else priceRange = 'flagship';
    }
    
    // Price range keywords
    if (q.includes('giá rẻ') || q.includes('rẻ') || q.includes('sinh viên') || q.includes('học sinh')) {
        priceRange = 'budget';
        if (!maxPrice) maxPrice = 8000000;
    }
    if (q.includes('tầm trung') || q.includes('trung cấp')) {
        priceRange = 'mid-range';
        if (!minPrice) minPrice = 8000000;
        if (!maxPrice) maxPrice = 20000000;
    }
    if (q.includes('cao cấp') || q.includes('premium') || q.includes('flagship')) {
        priceRange = 'flagship';
        if (!minPrice) minPrice = 20000000;
    }
    
    // Feature extraction
    const features = [];
    const keywords = [];
    
    if (q.includes('chụp ảnh') || q.includes('camera')) {
        features.push('chụp ảnh đẹp');
        keywords.push('camera');
    }
    if (q.includes('selfie') || q.includes('tự sướng')) {
        features.push('selfie đẹp');
        keywords.push('selfie');
    }
    if (q.includes('pin') && (q.includes('trâu') || q.includes('lâu') || q.includes('khỏe'))) {
        features.push('pin trâu');
        keywords.push('pin');
    }
    if (q.includes('sạc nhanh') || q.includes('fast charge')) {
        features.push('sạc nhanh');
        keywords.push('sạc nhanh');
    }
    if (q.includes('gaming') || q.includes('chơi game') || q.includes('game')) {
        features.push('gaming');
        keywords.push('gaming');
    }
    if (q.includes('zoom') || q.includes('tele')) {
        features.push('zoom xa');
        keywords.push('zoom');
    }
    
    // Target user detection
    let targetUser = null;
    if (q.includes('học sinh') || q.includes('sinh viên') || q.includes('hs') || q.includes('sv')) {
        targetUser = 'học sinh sinh viên';
    }
    if (q.includes('người già') || q.includes('bố mẹ') || q.includes('ông bà')) {
        targetUser = 'người lớn tuổi';
    }
    if (q.includes('doanh nhân') || q.includes('công việc') || q.includes('văn phòng')) {
        targetUser = 'chuyên nghiệp';
    }
    
    return {
        brand, maxPrice, minPrice, features, priceRange, targetUser, keywords
    };
}

// Advanced product filtering from database
export async function filterProductsFromDB(analysis, db) {
    try {
        console.log('🔍 Filtering products from database with analysis:', analysis);
        console.log('🔍 analysis.intent:', analysis.intent);
        console.log('🔍 analysis.productType:', analysis.productType);
        console.log('🔍 analysis.excludeBrands:', analysis.excludeBrands);
        
        // Handle special intents
        if (analysis.intent === 'exclude') {
            console.log('🚫 User wants to exclude something, returning empty results');
            return [];
        }
        
        if (analysis.productType === null || (analysis.productType && analysis.productType !== 'phone')) {
            console.log('🚫 User is not looking for phones, returning empty results');
            return [];
        }
        
        // Build query conditions
        const conditions = {};
        
        // Brand filter - use exact ObjectId match
        if (analysis.brand) {
            console.log('🔍 Looking for brand:', analysis.brand);
            const brand = await db.brands.findByName(analysis.brand);
            if (brand) {
                console.log('✅ Found brand:', brand.name, 'ID:', brand._id);
                conditions.brand = brand._id;
            } else {
                console.log('❌ Brand not found:', analysis.brand);
            }
        }
        
        // Exclude brands filter
        if (analysis.excludeBrands && analysis.excludeBrands.length > 0) {
            console.log('🚫 Excluding brands:', analysis.excludeBrands);
            
            const excludeBrandIds = [];
            for (const brandName of analysis.excludeBrands) {
                const brand = await db.brands.findByName(brandName);
                if (brand) {
                    excludeBrandIds.push(brand._id);
                    console.log('🚫 Found brand to exclude:', brandName, 'ID:', brand._id);
                }
            }
            
            if (excludeBrandIds.length > 0) {
                if (conditions.brand) {
                    // If there's already a brand filter, we need to be careful
                    console.log('⚠️ Both include and exclude brand filters - this may result in no products');
                } else {
                    conditions.brand = { $nin: excludeBrandIds };
                    console.log('🚫 Added brand exclusion filter:', excludeBrandIds);
                }
            }
        }
        
        // Price filters
        if (analysis.maxPrice || analysis.minPrice) {
            conditions.price = {};
            if (analysis.maxPrice) conditions.price.max = analysis.maxPrice;
            if (analysis.minPrice) conditions.price.min = analysis.minPrice;
        }
        
        // Active products only
        conditions.isActive = true;
        
        // Add text search for product name if keywords contain brand names
        if (analysis.keywords && analysis.keywords.length > 0) {
            const brandKeywords = ['iphone', 'samsung', 'xiaomi', 'oppo', 'vivo'];
            const hasBrandKeyword = analysis.keywords.some(keyword => 
                brandKeywords.includes(keyword.toLowerCase())
            );
            
            if (hasBrandKeyword) {
                // Search in product name for brand keywords
                const searchTerms = analysis.keywords
                    .filter(keyword => brandKeywords.includes(keyword.toLowerCase()))
                    .join('|');
                
                if (searchTerms) {
                    conditions.name = { $regex: searchTerms, $options: 'i' };
                    console.log('🔍 Added name search for:', searchTerms);
                }
            }
        }
        
        console.log('🔍 Database query conditions:', conditions);
        
        // Get products from database
        const result = await db.products.getAll({ 
          first: 20, 
          condition: conditions 
        });
        
        console.log(`✅ Found ${result.items.length} products matching criteria`);
        return result.items;
        
    } catch (error) {
        console.error('❌ Error filtering products from DB:', error);
        return [];
    }
}

// Generate product suggestions with relevance scores
export function generateProductSuggestions(products, analysis) {
    try {
        console.log('🎯 Generating product suggestions for', products.length, 'products');
        
        const suggestions = products.map(product => {
            let relevance = 0.5; // Base relevance
            let reasons = [];
            
            // Brand relevance - improved
            if (analysis.brand && product.brand?.name === analysis.brand) {
                relevance += 0.4; // Higher weight for brand match
                reasons.push('Thương hiệu phù hợp');
            }
            
            // Keyword matching in product name - improved
            if (analysis.keywords && analysis.keywords.length > 0) {
                const productName = product.name.toLowerCase();
                const brandKeywords = ['iphone', 'samsung', 'xiaomi', 'oppo', 'vivo'];
                
                analysis.keywords.forEach(keyword => {
                    const lowerKeyword = keyword.toLowerCase();
                    if (productName.includes(lowerKeyword)) {
                        // Higher weight for brand keywords
                        if (brandKeywords.includes(lowerKeyword)) {
                            relevance += 0.4;
                            reasons.push(`Có thương hiệu "${keyword}"`);
                        } else {
                            relevance += 0.2;
                            reasons.push(`Có từ khóa "${keyword}"`);
                        }
                    }
                });
            }
            
            // Price relevance
            if (analysis.maxPrice && product.price <= analysis.maxPrice) {
                relevance += 0.2;
                reasons.push('Giá phù hợp');
            }
            
            // Feature relevance (check product description and tags)
            if (analysis.features && analysis.features.length > 0) {
                const productText = `${product.name} ${product.description || ''}`.toLowerCase();
                analysis.features.forEach(feature => {
                    if (productText.includes(feature.toLowerCase())) {
                        relevance += 0.1;
                        reasons.push(`Có tính năng ${feature}`);
                    }
                });
            }
            
            // Featured product relevance
            if (product.isFeatured) {
                relevance += 0.1;
                reasons.push('Sản phẩm nổi bật');
            }
            
            return {
                product,
                relevance: Math.min(relevance, 1.0),
                reason: reasons.join(', ')
            };
        });
        
        // Sort by relevance and limit to top 5
        suggestions.sort((a, b) => b.relevance - a.relevance);
        return suggestions.slice(0, 5);
        
    } catch (error) {
        console.error('❌ Error generating suggestions:', error);
        return [];
    }
}

// Generate response message
export function generateResponseMessage(analysis, products) {
    try {
        if (products.length === 0) {
            return "Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp với yêu cầu của bạn. Bạn có thể thử tìm kiếm với tiêu chí khác không?";
        }
        
        const count = products.length;
        const priceRange = analysis.priceRange;
        const brand = analysis.brand;
        
        let response = `Tôi đã tìm thấy ${count} sản phẩm phù hợp với yêu cầu của bạn`;
        
        if (brand) {
            response += ` trong thương hiệu ${brand}`;
        }
        
        if (priceRange) {
            const rangeText = {
                'budget': 'phân khúc giá rẻ',
                'mid-range': 'phân khúc tầm trung',
                'flagship': 'phân khúc cao cấp'
            }[priceRange] || '';
            
            if (rangeText) {
                response += ` thuộc ${rangeText}`;
            }
        }
        
        response += ". Dưới đây là những gợi ý tốt nhất:";
        
        return response;
        
    } catch (error) {
        console.error('❌ Error generating response message:', error);
        return "Đây là những sản phẩm phù hợp với yêu cầu của bạn:";
    }
} 