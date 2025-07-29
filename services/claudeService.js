import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Claude API
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
});

// Enhanced prompt for Claude API
const createAnalysisPrompt = (message) => {
    return `Bạn là chuyên gia tư vấn điện thoại thông minh của SmartShop. Hãy phân tích YÊU CẦU của khách hàng để đưa ra gợi ý chính xác.

NGÔN NGỮ: Trả lời bằng tiếng Việt thân thiện, tự nhiên.

YÊU CẦU KHÁCH HÀNG: "${message}"

🚨 QUAN TRỌNG - PHÂN TÍCH YÝ ĐỊNH:
1. 🔄 MODE SO SÁNH: "so sánh", "compare", "đối chiếu", "chế độ so sánh" → intent: "compare_mode"
2. ➕ THÊM SẢN PHẨM: "thêm", "add", "cho vào", "đưa vào" → intent: "add_to_compare"
3. ❌ TỪ CHỐI/GHÉT: "ghét", "không thích", "tệ", "dở", "kém" → intent: "exclude"
4. ✅ MUỐN MUA: "mua", "tìm", "cần", "muốn", "gợi ý", "xem" → intent: "buy"
5. 🔍 LOẠI SẢN PHẨM: "điện thoại", "smartphone", "phone", "di động" → productType: "phone"

THƯƠNG HIỆU: Apple, Samsung, Xiaomi, OPPO, Vivo, Realme, Nokia

LƯU Ý QUAN TRỌNG VỀ THƯƠNG HIỆU:
- "Samsung", "Galaxy" → brand: "Samsung" (KHÔNG BAO GIỜ là Apple)
- "iPhone", "Apple", "MacBook", "iPad" → brand: "Apple" (KHÔNG BAO GIỜ là Samsung)
- "Xiaomi", "Redmi", "POCO" → brand: "Xiaomi"
- "OPPO", "OnePlus" → brand: "OPPO"
- "Vivo", "iQOO" → brand: "Vivo"
- "Realme" → brand: "Realme"
- "Nokia" → brand: "Nokia"

TUYỆT ĐỐI KHÔNG NHẦM LẪN: Samsung không được phân tích thành Apple!

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
    "intent": "buy/exclude/neutral/compare_mode/add_to_compare/compare_products",
    "productName": "tên_sản_phẩm_cụ_thể_nếu_có",
    "action": "search/add/compare/switch_mode"
  },
  "response": "câu_trả_lời_phù_hợp_với_ý_định",
  "suggestions": ["gợ_ý_phù_hợp"]
}

VÍ DỤ THÔNG MINH:
🔄 "Chế độ so sánh" → intent: "compare_mode", action: "switch_mode", response: "Đã chuyển sang chế độ so sánh. Bạn có thể chọn tối đa 3 sản phẩm để so sánh."

➕ "Thêm iPhone 15" → intent: "add_to_compare", productName: "iPhone 15", action: "add", response: "Đang tìm iPhone 15 để thêm vào so sánh..."

🔍 "So sánh" → intent: "compare_products", action: "compare", response: "Đang thực hiện so sánh các sản phẩm đã chọn..."

✅ "Tìm Samsung" → intent: "buy", brand: "Samsung", action: "search", response: "Đang tìm điện thoại Samsung cho bạn..."

✅ "Samsung Galaxy" → intent: "buy", brand: "Samsung", productType: "phone", action: "search", response: "Đang tìm Samsung Galaxy cho bạn..."

✅ "iPhone" → intent: "buy", brand: "Apple", productType: "phone", action: "search", response: "Đang tìm iPhone cho bạn..."

✅ "iPhone 15" → intent: "buy", brand: "Apple", productType: "phone", keywords: ["iphone", "15"], action: "search", response: "Đang tìm iPhone 15 cho bạn..."

✅ "iPhone 16 Pro" → intent: "buy", brand: "Apple", productType: "phone", keywords: ["iphone", "16", "pro"], action: "search", response: "Đang tìm iPhone 16 Pro cho bạn..."

✅ "MacBook" → intent: "buy", brand: "Apple", productType: "laptop", keywords: ["macbook"], action: "search", response: "Đang tìm MacBook cho bạn..."

LƯU Ý: Khi user tìm "iPhone 15" thì chỉ tìm iPhone 15, không tìm iPhone 16 hay MacBook!

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
            console.log('🔍 Brand type:', typeof analysis.brand);
            console.log('🔍 Brand value:', JSON.stringify(analysis.brand));
            
            const brand = await db.brands.findByName(analysis.brand);
            if (brand) {
                console.log('✅ Found brand:', brand.name, 'ID:', brand._id);
                conditions.brand = brand._id;
                
                // Additional product type filtering for Apple
                if (analysis.brand.toLowerCase() === 'apple') {
                    // If searching for iPhone, exclude MacBook and iPad
                    if (analysis.keywords && analysis.keywords.some(k => k.toLowerCase().includes('iphone'))) {
                        // Check for specific iPhone model
                        const iphoneKeywords = analysis.keywords.filter(k => 
                            k.toLowerCase().includes('iphone') || 
                            /^\d+$/.test(k) || // numbers like 15, 16
                            k.toLowerCase().includes('pro') ||
                            k.toLowerCase().includes('max') ||
                            k.toLowerCase().includes('plus')
                        );
                        
                        if (iphoneKeywords.length > 0) {
                            // Build specific iPhone search pattern
                            const searchPattern = iphoneKeywords.join('|');
                            conditions.name = { $regex: searchPattern, $options: 'i' };
                            console.log('🔍 Apple + specific iPhone model detected: Searching for', searchPattern);
                        } else {
                            conditions.name = { $regex: 'iPhone', $options: 'i' };
                            console.log('🔍 Apple + iPhone detected: Only searching for iPhone products');
                        }
                    }
                    // If searching for MacBook, exclude iPhone and iPad
                    else if (analysis.keywords && analysis.keywords.some(k => k.toLowerCase().includes('macbook'))) {
                        conditions.name = { $regex: 'MacBook', $options: 'i' };
                        console.log('🔍 Apple + MacBook detected: Only searching for MacBook products');
                    }
                    // If searching for iPad, exclude iPhone and MacBook
                    else if (analysis.keywords && analysis.keywords.some(k => k.toLowerCase().includes('ipad'))) {
                        conditions.name = { $regex: 'iPad', $options: 'i' };
                        console.log('🔍 Apple + iPad detected: Only searching for iPad products');
                    }
                }
            } else {
                console.log('❌ Brand not found:', analysis.brand);
                console.log('🔍 Available brands in DB:', await db.brands.find({}));
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
            console.log('🔍 Keywords for search:', analysis.keywords);
            
            // If we have a specific brand, prioritize brand-specific search
            if (analysis.brand) {
                const brandKeywords = {
                    'Apple': ['iphone', 'ipad', 'macbook', 'apple'],
                    'Samsung': ['samsung', 'galaxy'],
                    'Xiaomi': ['xiaomi', 'redmi', 'poco'],
                    'OPPO': ['oppo', 'oneplus'],
                    'Vivo': ['vivo', 'iqoo'],
                    'Realme': ['realme'],
                    'Nokia': ['nokia']
                };
                
                const brandKey = Object.keys(brandKeywords).find(key => 
                    key.toLowerCase() === analysis.brand.toLowerCase()
                );
                
                if (brandKey) {
                    const allowedKeywords = brandKeywords[brandKey];
                    const matchingKeywords = analysis.keywords.filter(keyword => 
                        allowedKeywords.includes(keyword.toLowerCase())
                    );
                    
                    if (matchingKeywords.length > 0) {
                        const searchTerms = matchingKeywords.join('|');
                        conditions.name = { $regex: searchTerms, $options: 'i' };
                        console.log('🔍 Added brand-specific name search for:', searchTerms);
                    }
                }
            } else {
                // Fallback to general brand keyword search
                const brandKeywords = ['iphone', 'samsung', 'xiaomi', 'oppo', 'vivo'];
                const hasBrandKeyword = analysis.keywords.some(keyword => 
                    brandKeywords.includes(keyword.toLowerCase())
                );
                
                if (hasBrandKeyword) {
                    const searchTerms = analysis.keywords
                        .filter(keyword => brandKeywords.includes(keyword.toLowerCase()))
                        .join('|');
                    
                    if (searchTerms) {
                        conditions.name = { $regex: searchTerms, $options: 'i' };
                        console.log('🔍 Added general name search for:', searchTerms);
                    }
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
                
                // Count how many keywords match
                let matchedKeywords = 0;
                let exactModelMatch = false;
                
                analysis.keywords.forEach(keyword => {
                    const lowerKeyword = keyword.toLowerCase();
                    if (productName.includes(lowerKeyword)) {
                        matchedKeywords++;
                        
                        // Check for exact model match (e.g., "15" in "iPhone 15")
                        if (/^\d+$/.test(keyword) && productName.includes(keyword)) {
                            exactModelMatch = true;
                        }
                        
                        // Higher weight for brand keywords
                        if (brandKeywords.includes(lowerKeyword)) {
                            relevance += 0.3;
                            reasons.push(`Có thương hiệu "${keyword}"`);
                        } else {
                            relevance += 0.2;
                            reasons.push(`Có từ khóa "${keyword}"`);
                        }
                    }
                });
                
                // Bonus for exact model match
                if (exactModelMatch) {
                    relevance += 0.3;
                    reasons.push('Model chính xác');
                }
                
                // Bonus for multiple keyword matches
                if (matchedKeywords >= 2) {
                    relevance += 0.2;
                    reasons.push('Nhiều từ khóa phù hợp');
                }
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

// Product comparison analysis with Claude AI
export async function analyzeProductComparison(products, userPreferences = '') {
    try {
        console.log('🤖 Analyzing product comparison with Claude');
        
        const productData = products.map(product => ({
            name: product.name,
            price: product.price,
            description: product.description || '',
            brand: product.brand?.name || '',
            rating: product.rating || 0,
            isFeatured: product.isFeatured
        }));
        
        const prompt = createComparisonPrompt(productData, userPreferences);
        
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            temperature: 0.1,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const aiResponse = response.content[0].text;
        console.log('🔍 Claude comparison response:', aiResponse);

        // Extract JSON from response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ Comparison analysis successful:', parsed);
            return parsed;
        } else {
            throw new Error('No valid JSON found in Claude response');
        }

    } catch (error) {
        console.warn('⚠️ Claude comparison analysis failed, using fallback:', error.message);
        return generateFallbackComparison(products);
    }
}

// Create comparison prompt for Claude
function createComparisonPrompt(products, userPreferences) {
    const productInfo = products.map((product, index) => `
SẢN PHẨM ${index + 1}: ${product.name}
- Thương hiệu: ${product.brand?.name || 'Không xác định'}
- Giá: ${product.price.toLocaleString('vi-VN')} VNĐ
- Mô tả: ${product.description}
- Nổi bật: ${product.isFeatured ? 'Có' : 'Không'}
`).join('\n');

    return `Bạn là chuyên gia tư vấn điện thoại thông minh. Hãy phân tích và so sánh các sản phẩm sau:

${productInfo}

${userPreferences ? `YÊU CẦU NGƯỜI DÙNG: ${userPreferences}` : ''}

PHÂN TÍCH CHI TIẾT:
1. Đọc kỹ phần mô tả của từng sản phẩm để trích xuất thông tin thực tế
2. Điểm mạnh của từng sản phẩm
3. So sánh tính năng chính (camera, pin, hiệu năng, thiết kế)
4. So sánh giá trị tiền bạc
5. Khuyến nghị phù hợp với nhu cầu

LƯU Ý: Phần mô tả là JSON object có cấu trúc như sau:
{
  "manHinh": {
    "kichThuoc": "6.36 inch",
    "congNghe": "Dynamic AMOLED 2X",
    "doPhanGiai": "1440x3088 pixel",
    "tanSoQuet": "120Hz ProMotion"
  },
  "chip": "Snapdragon 8 Gen 3",
  "ram": "12GB",
  "camera": {
    "chinh": {
      "doPhanGiai": "50MP",
      "khauDo": "f/1.8"
    }
  },
  "pin": "4000 mAh",
  "sac": "45W",
  "heDieuHanh": "Android 15"
}

Hãy trích xuất chính xác từ JSON:
- Màn hình: manHinh.kichThuoc (ví dụ: "6.36 inch")
- Pin: pin (ví dụ: "4000 mAh")
- Camera: camera.chinh.doPhanGiai (ví dụ: "50MP")
- Chip: chip (ví dụ: "Snapdragon 8 Gen 3")
- RAM: ram (ví dụ: "12GB")

FORMAT JSON:
{
  "strengths": [
    {
      "productId": "index_0",
      "productName": "tên sản phẩm",
      "strengths": ["điểm mạnh 1", "điểm mạnh 2"]
    }
  ],
  "differences": [
    {
      "category": "Camera",
      "product1": {
        "productId": "index_0",
        "productName": "tên sản phẩm",
        "value": "mô tả camera",
        "isBest": true/false
      },
      "product2": {
        "productId": "index_1", 
        "productName": "tên sản phẩm",
        "value": "mô tả camera",
        "isBest": true/false
      }
    }
  ],
  "similarities": ["tính năng chung 1", "tính năng chung 2"],
  "bestValue": "Tên sản phẩm có giá tốt nhất (ví dụ: Samsung Galaxy S25)",
  "bestPerformance": "Tên sản phẩm có hiệu năng tốt nhất (ví dụ: iPhone 16 Pro)", 
  "bestCamera": "Tên sản phẩm có camera tốt nhất (ví dụ: iPhone 16 Pro)",
  "bestBattery": "Tên sản phẩm có pin tốt nhất (ví dụ: Samsung Galaxy S25)",
  "recommendations": ["khuyến nghị 1", "khuyến nghị 2"],
  "productSpecs": {
    "index_0": {
      "screen": "Kích thước màn hình (ví dụ: 6.36 inch)",
      "battery": "Dung lượng pin (ví dụ: 4000 mAh)",
      "camera": "Độ phân giải camera chính (ví dụ: 50MP)",
      "performance": "Chip xử lý (ví dụ: Snapdragon 8 Gen 3)",
      "ram": "Dung lượng RAM (ví dụ: 12GB)"
    },
    "index_1": {
      "screen": "Kích thước màn hình",
      "battery": "Dung lượng pin", 
      "camera": "Độ phân giải camera chính",
      "performance": "Chip xử lý",
      "ram": "Dung lượng RAM"
    }
  }
}

LƯU Ý QUAN TRỌNG: 
- Tất cả text phải bằng TIẾNG VIỆT
- Không được dùng tiếng Anh trong bất kỳ field nào
- Trả về JSON hoàn toàn bằng tiếng Việt

CHỈ trả về JSON, không thêm text khác.`;
}

// Fallback comparison analysis
function generateFallbackComparison(products) {
    const strengths = products.map((product, index) => ({
        productId: `index_${index}`,
        productName: product.name,
        strengths: [
            `Thương hiệu ${product.brand?.name || 'nổi tiếng'}`,
            `Giá ${product.price < 15000000 ? 'phù hợp' : 'cao cấp'}`,
            product.isFeatured ? 'Sản phẩm nổi bật' : 'Chất lượng tốt'
        ]
    }));

    const differences = [
        {
            category: "Giá cả",
            product1: {
                productId: "index_0",
                productName: products[0].name,
                value: `${products[0].price.toLocaleString('vi-VN')} VNĐ`,
                isBest: products[0].price === Math.min(...products.map(p => p.price))
            },
            product2: {
                productId: "index_1",
                productName: products[1].name,
                value: `${products[1].price.toLocaleString('vi-VN')} VNĐ`,
                isBest: products[1].price === Math.min(...products.map(p => p.price))
            }
        }
    ];

    if (products.length === 3) {
        differences[0].product3 = {
            productId: "index_2",
            productName: products[2].name,
            value: `${products[2].price.toLocaleString('vi-VN')} VNĐ`,
            isBest: products[2].price === Math.min(...products.map(p => p.price))
        };
    }

    const similarities = [
        "Đều là điện thoại thông minh",
        "Có camera chất lượng cao",
        "Pin trâu, sạc nhanh"
    ];

    const minPriceIndex = products.findIndex(p => p.price === Math.min(...products.map(p => p.price)));

    return {
        strengths,
        differences,
        similarities,
        bestValue: products[minPriceIndex]?.name || "Không xác định",
        bestPerformance: products[0]?.name || "Không xác định",
        bestCamera: products[0]?.name || "Không xác định", 
        bestBattery: products[0]?.name || "Không xác định",
        recommendations: [
            "Nên xem xét nhu cầu sử dụng cụ thể",
            "So sánh thêm về tính năng camera và pin",
            "Kiểm tra đánh giá từ người dùng thực tế"
        ]
    };
} 