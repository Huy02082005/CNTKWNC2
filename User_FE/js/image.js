// ========== CONFIG ==========
(function() {
    'use strict';
    
    // Detect environment
    const IS_LIVE_SERVER = window.location.port === '5500' || 
                          window.location.hostname === '127.0.0.1:5500' ||
                          window.location.hostname.includes('5500');
    
    const IS_EXPRESS = window.location.port === '3000' || 
                       window.location.hostname.includes('localhost:3000');
    
    const BASE_URL = IS_LIVE_SERVER ? 'http://localhost:3000' : '';
    
    console.log(`🖼️ Image Utils v1.0 | Mode: ${IS_LIVE_SERVER ? 'Live Server' : IS_EXPRESS ? 'Express' : 'Unknown'}`);
    
    // ========== CONSTANTS ==========
    
    // Category ID to default image mapping
    const CATEGORY_DEFAULT_IMAGES = {
        1: 'clothes/1.jpg',       // Áo đấu
        2: 'shoes/81.jpg',        // Giày
        3: 'accessories/101.jpg', // Phụ kiện
        4: 'clothes/121.jpg',     // Áo khoác
        5: 'gloves/111.jpg'       // Găng tay thủ môn
    };
    
    // Category names (for display)
    const CATEGORY_NAMES = {
        1: 'Quần áo',
        2: 'Giày',
        3: 'Phụ kiện', 
        4: 'Áo khoác',
        5: 'Găng tay'
    };
    
    // League logos
    const LEAGUE_LOGOS = {
        1: 'image/league/EnglishPremierLeague.jpg',
        2: 'image/league/Laliga.jpg', 
        3: 'image/league/SeriaA.jpg',
        4: 'image/league/bundesliga.jpg',
        5: 'image/league/Ligue1.jpg',
        6: 'image/league/vleague.jpg',
        'default': 'image/default-image.jpg'
    };
    
    // League names
    const LEAGUE_NAMES = {
        1: 'Premier League',
        2: 'La Liga',
        3: 'Serie A',
        4: 'Bundesliga',
        5: 'Ligue 1',
        6: 'V-League'
    };
    
    // ========== CORE FUNCTIONS ==========
    
    /**
     * Get complete image URL from database path
     * @param {string} imagePath - Path from database (e.g., "image/clothes/1.jpg")
     * @param {number} categoryId - Category ID for fallback
     * @returns {string} Complete image URL
     */
    function getProductImageUrl(imagePath, categoryId = 1) {
        // 1. Handle null/undefined/empty
        if (!imagePath || imagePath === 'NULL' || imagePath === 'null') {
            return getDefaultProductImage(categoryId);
        }
        
        // 2. Already a full URL
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // 3. Database format: "image/clothes/1.jpg"
        if (imagePath.startsWith('image/')) {
            return `${BASE_URL}/${imagePath}`;
        }
        
        // 4. If starts with / (absolute path)
        if (imagePath.startsWith('/')) {
            return `${BASE_URL}${imagePath}`;
        }
        
        // 5. Unknown format, use default
        console.warn(`⚠️ Unknown image path format: "${imagePath}", using default`);
        return getDefaultProductImage(categoryId);
    }
    
    /**
     * Get default image for a category
     * @param {number} categoryId - Category ID
     * @returns {string} Default image URL
     */
    function getDefaultProductImage(categoryId = 1) {
        const cat = Number(categoryId) || 1;
        const filename = CATEGORY_DEFAULT_IMAGES[cat] || CATEGORY_DEFAULT_IMAGES[1];
        return `${BASE_URL}/image/${filename}`;
    }
    
    /**
     * Get category name by ID
     * @param {number} categoryId 
     * @returns {string} Category name
     */
    function getCategoryName(categoryId) {
        return CATEGORY_NAMES[categoryId] || 'Sản phẩm';
    }
    
    /**
     * Get league logo URL
     * @param {number} leagueId - League ID
     * @returns {string} Logo URL
     */
    function getLeagueLogoUrl(leagueId) {
        const logo = LEAGUE_LOGOS[leagueId] || LEAGUE_LOGOS['default'];
        return `${BASE_URL}/${logo}`;
    }
    
    /**
     * Get league name by ID
     * @param {number} leagueId 
     * @returns {string} League name
     */
    function getLeagueName(leagueId) {
        return LEAGUE_NAMES[leagueId] || 'Giải đấu';
    }
    
    /**
     * Format price to VND format
     * @param {number} price - Price in VND
     * @returns {string} Formatted price (e.g., "850.000₫")
     */
    function formatPrice(price) {
        const numericPrice = Number(price) || 0;
        if (numericPrice <= 0) return 'Liên hệ';
        
        return new Intl.NumberFormat('vi-VN').format(numericPrice) + '₫';
    }
    
    /**
     * Calculate final price after discount
     * @param {number} price - Original price
     * @param {number} discount - Discount percentage (0-100)
     * @returns {number} Final price
     */
    function calculateDiscountedPrice(price, discount) {
        const numericPrice = Number(price) || 0;
        const numericDiscount = Number(discount) || 0;
        
        if (numericDiscount > 0 && numericDiscount <= 100) {
            return Math.round(numericPrice * (100 - numericDiscount) / 100);
        }
        
        return numericPrice;
    }
    
    /**
     * Create image element with error handling
     * @param {string} url - Image URL
     * @param {string} alt - Alt text
     * @param {object} options - {width, height, className, style, onError}
     * @returns {HTMLImageElement} Image element
     */
    function createImageElement(url, alt = '', options = {}) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = alt || 'Hình ảnh sản phẩm';
        img.loading = 'lazy';
        
        // Apply options
        if (options.width) img.width = options.width;
        if (options.height) img.height = options.height;
        if (options.className) img.className = options.className;
        if (options.style) Object.assign(img.style, options.style);
        
        // Error handling
        img.onerror = function() {
            console.warn(`❌ Image failed: ${url}`);
            
            // Custom error handler
            if (typeof options.onError === 'function') {
                options.onError(this, url);
            } else {
                // Default: replace with category default
                const fallbackUrl = getDefaultProductImage(1);
                if (this.src !== fallbackUrl) {
                    this.src = fallbackUrl;
                }
            }
        };
        
        // Success
        img.onload = function() {
            if (typeof options.onLoad === 'function') {
                options.onLoad(this, url);
            }
        };
        
        return img;
    }
    
    /**
     * Test if image URL is accessible
     * @param {string} url - Image URL to test
     * @returns {Promise<boolean>} True if image loads successfully
     */
    function testImageUrl(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }
    
    /**
     * Batch test multiple images
     * @param {string[]} urls - Array of image URLs
     * @returns {Promise<object>} {success: [], failed: []}
     */
    async function testMultipleImages(urls) {
        const results = { success: [], failed: [] };
        
        const tests = urls.map(async (url) => {
            const isValid = await testImageUrl(url);
            if (isValid) {
                results.success.push(url);
            } else {
                results.failed.push(url);
            }
        });
        
        await Promise.all(tests);
        return results;
    }
    
    /**
     * Get product card HTML template
     * @param {object} product - Product data
     * @param {object} options - {showDiscount, showStock, clickable}
     * @returns {string} HTML string
     */
    function getProductCardHTML(product, options = {}) {
        const defaults = {
            showDiscount: true,
            showStock: true,
            clickable: true,
            className: 'product-card'
        };
        
        const opts = { ...defaults, ...options };
        
        const productId = product.ProductID || product.id || 0;
        const productName = product.ProductName || product.name || 'Sản phẩm';
        const categoryId = product.CategoryID || product.categoryId || 1;
        const price = product.SellingPrice || product.price || 0;
        const discount = product.Discount || product.discount || 0;
        const stock = product.StockQuantity || product.stock || 0;
        const brand = product.BrandName || product.brand || '';
        const league = product.LeagueName || product.league || '';
        
        // Calculate values
        const imageUrl = getProductImageUrl(product.ImageURL || product.image, categoryId);
        const finalPrice = calculateDiscountedPrice(price, discount);
        const formattedPrice = formatPrice(finalPrice);
        const formattedOriginal = discount > 0 ? formatPrice(price) : '';
        
        // Detail URL
        const detailUrl = `${BASE_URL}/product-detail.html?id=${productId}`;
        
        // Build HTML
        let html = `
            <div class="${opts.className}" 
                 data-product-id="${productId}"
                 data-category-id="${categoryId}"
                 ${opts.clickable ? `onclick="window.location.href='${detailUrl}'" style="cursor:pointer;"` : ''}>
                
                <!-- Image -->
                <div class="product-image">
                    <img src="${imageUrl}" 
                         alt="${productName}"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${getDefaultProductImage(categoryId)}'">
                    
                    ${opts.showDiscount && discount > 0 ? `
                        <div class="discount-badge">-${discount}%</div>
                    ` : ''}
                    
                    ${opts.showStock && stock <= 0 ? `
                        <div class="stock-badge">Hết hàng</div>
                    ` : ''}
                </div>
                
                <!-- Info -->
                <div class="product-info">
                    <h3 class="product-title">${productName}</h3>
                    
                    ${brand ? `<div class="product-brand">${brand}</div>` : ''}
                    ${league ? `<div class="product-league">${league}</div>` : ''}
                    
                    <div class="product-price">
                        <span class="current-price">${formattedPrice}</span>
                        ${discount > 0 ? `
                            <span class="original-price">${formattedOriginal}</span>
                        ` : ''}
                    </div>
                    
                    ${opts.showStock ? `
                        <div class="product-stock">
                            ${stock > 0 ? `Còn ${stock} sản phẩm` : 'Hết hàng'}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        return html;
    }
    
    // ========== EXPORT ==========
    
    // Create global object
    window.ImageUtils = {
        // Config
        IS_LIVE_SERVER,
        IS_EXPRESS,
        BASE_URL,
        
        // Constants
        CATEGORY_DEFAULT_IMAGES,
        CATEGORY_NAMES,
        LEAGUE_LOGOS,
        LEAGUE_NAMES,
        
        // Core functions
        getProductImageUrl,
        getDefaultProductImage,
        getCategoryName,
        getLeagueLogoUrl,
        getLeagueName,
        formatPrice,
        calculateDiscountedPrice,
        createImageElement,
        testImageUrl,
        testMultipleImages,
        getProductCardHTML,
        
        // Short aliases
        getImage: getProductImageUrl,
        getPrice: formatPrice,
        getDiscountPrice: calculateDiscountedPrice
    };
    
    console.log('✅ Image Utils ready to use');
    
})();