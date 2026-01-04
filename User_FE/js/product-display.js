// ========== PRODUCT DISPLAY COMPONENT ==========
// File: /User_FE/js/product-display.js
// Pure UI Component - Tái sử dụng trên toàn website

class ProductDisplay {
    constructor(options = {}) {
        // Config từ ImageUtils
        this.IS_LIVE_SERVER = window.ImageUtils ? window.ImageUtils.IS_LIVE_SERVER : false;
        this.BASE_URL = window.ImageUtils ? window.ImageUtils.BASE_URL : '';
        
        // Required options
        this.container = options.container;
        this.products = options.products || [];
        
        // Display options
        this.columns = options.columns || 4;
        this.showQuickAdd = options.showQuickAdd !== false;
        this.showDiscount = options.showDiscount !== false;
        this.showStock = options.showStock !== false;
        this.clickable = options.clickable !== false;
        
        // Callbacks
        this.onProductClick = options.onProductClick || null;
        this.onAddToCart = options.onAddToCart || null;
        
        // Default image paths
        this.defaultImages = {
            1: 'image/clothes/1.jpg',
            2: 'image/shoes/81.jpg',
            3: 'image/accessories/101.jpg',
            4: 'image/clothes/121.jpg',
            5: 'image/gloves/111.jpg'
        };
        
        console.log(`🛒 ProductDisplay ready with ${this.products.length} products`);
    }
    
    // ========== PUBLIC API ==========
    
    // Render tất cả sản phẩm
    render() {
        if (!this.validate()) return false;
        
        console.log(`🛒 Rendering ${this.products.length} products`);
        
        // Clear container
        this.container.innerHTML = '';
        
        // Add CSS grid if not already
        this.setupContainerStyle();
        
        // Render each product
        this.products.forEach(product => {
            const productElement = this.createProductElement(product);
            this.container.appendChild(productElement);
        });
        
        // Setup event listeners
        this.setupEventListeners();
        
        return true;
    }
    
    // Cập nhật sản phẩm mới
    updateProducts(newProducts) {
        this.products = newProducts || [];
        this.render();
    }
    
    // Thêm sản phẩm mới
    addProduct(product) {
        this.products.push(product);
        this.render();
    }
    
    // Xóa tất cả sản phẩm
    clear() {
        this.products = [];
        this.container.innerHTML = '';
    }
    
    // ========== PRIVATE METHODS ==========
    
    validate() {
        if (!this.container) {
            console.error('❌ ProductDisplay: No container element');
            return false;
        }
        
        if (!Array.isArray(this.products)) {
            console.error('❌ ProductDisplay: Products must be an array');
            return false;
        }
        
        return true;
    }
    
    setupContainerStyle() {
        // Setup grid layout
        this.container.style.display = 'grid';
        this.container.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
        this.container.style.gap = '20px';
        this.container.style.padding = '20px 0';
    }
    
    createProductElement(product) {
        // Extract product data
        const data = this.extractProductData(product);
        
        // Create card element
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = data.id;
        
        if (this.clickable) {
            card.style.cursor = 'pointer';
        }
        
        // Build HTML using the specified template
        card.innerHTML = this.buildProductHTML(data);
        
        return card;
    }
    
    extractProductData(product) {
        const id = product.ProductID || product.id || 0;
        const name = product.ProductName || product.name || 'Sản phẩm';
        const sellingPrice = Number(product.SellingPrice || product.price || 0);
        const discount = Number(product.Discount || product.discount || 0);
        const stockQuantity = Number(product.StockQuantity || product.stock || 0);
        const categoryId = Number(product.CategoryID || product.categoryId || 1);
        const imagePath = product.ImageURL || product.image || '';
        
        // Calculate current price (after discount)
        const currentPrice = discount > 0 ? 
            Math.round(sellingPrice * (100 - discount) / 100) : sellingPrice;
        
        // Get image URL
        const imageUrl = this.getImageUrl(imagePath, categoryId);
        
        return {
            id,
            name,
            sellingPrice,
            discount,
            currentPrice,
            stockQuantity,
            categoryId,
            imageUrl
        };
    }
    
    getImageUrl(imagePath, categoryId) {
        // Use ImageUtils if available
        if (window.ImageUtils && window.ImageUtils.getImage) {
            return window.ImageUtils.getImage(imagePath, categoryId);
        }
        
        // Fallback logic
        if (!imagePath || imagePath === 'NULL') {
            const defaultFile = this.defaultImages[categoryId] || this.defaultImages[1];
            return `${this.BASE_URL}/${defaultFile}`;
        }
        
        // Already full URL
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // Database path
        return `${this.BASE_URL}/${imagePath}`;
    }
    
    buildProductHTML(data) {
        const { id, name, imageUrl, sellingPrice, discount, currentPrice, stockQuantity } = data;
        
        return `
            <div class="product-image">
                <img src="${imageUrl}" 
                     alt="${name}" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='${this.BASE_URL}/image/default-product.jpg'">
                ${discount > 0 ? `<span class="product-badge">-${discount}%</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${name}</h3>
                <div class="product-price">
                    <span class="current-price">${this.formatPrice(currentPrice)}₫</span>
                    ${discount > 0 ? 
                        `<span class="original-price">${this.formatPrice(sellingPrice)}₫</span>` : 
                        ''}
                </div>
            </div>
            <div class="product-actions">
                ${this.showQuickAdd && stockQuantity > 0 ? 
                    `<button class="btn-quick-add" data-product-id="${id}">
                        <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
                    </button>` : 
                    ''}
            </div>
        `;
    }
    
    setupEventListeners() {
        // Add to cart button - DÙNG self ĐỂ TRÁNH LỖI CONTEXT
        const self = this;
        
        this.container.querySelectorAll('.btn-quick-add').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                
                const productId = this.dataset.productId;
                console.log(`🛒 [ProductDisplay] Add to cart clicked: ${productId}`);
                
                // Gọi callback nếu có
                if (typeof self.onAddToCart === 'function') {
                    self.onAddToCart(productId, e);
                } else {
                    // Mặc định: thêm vào giỏ và chuyển đến trang chi tiết
                    self.handleAddToCartDefault(productId, e);
                }
            });
        });
        
        // Product card click
        if (this.clickable) {
            this.container.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', function(e) {
                    // KHÔNG xử lý nếu click vào nút thêm vào giỏ
                    if (e.target.closest('.btn-quick-add')) {
                        return;
                    }
                    
                    // KHÔNG xử lý nếu click vào badge, giá cũ
                    if (e.target.closest('.product-badge') || e.target.closest('.original-price')) {
                        return;
                    }
                    
                    const productId = this.dataset.productId;
                    console.log(`👉 [ProductDisplay] Product card clicked: ${productId}`);
                    
                    // Gọi callback nếu có
                    if (typeof self.onProductClick === 'function') {
                        self.onProductClick(productId, e);
                    } else {
                        // Mặc định: chuyển đến trang chi tiết
                        self.navigateToProductDetail(productId);
                    }
                });
            });
        }
    }
    
    // ========== DEFAULT HANDLERS ==========
    
    handleAddToCartDefault(productId, event) {
        console.log(`🛒 [Default] Adding product ${productId} to cart and redirecting to detail`);
        
        // 1. Lấy thông tin sản phẩm
        const productElement = event.target.closest('.product-card');
        const productData = this.getProductDataFromElement(productElement, productId);
        
        // 3. Hiển thị thông báo
        this.showAddToCartNotification(productData.name);
        
        // 4. Chuyển đến trang chi tiết sản phẩm
        setTimeout(() => {
            this.navigateToProductDetail(productId);
        }, 800);
    }
    
    getProductDataFromElement(element, productId) {
        if (!element) {
            return {
                id: productId,
                name: 'Sản phẩm',
                price: 0,
                image: `${this.BASE_URL}/image/default-product.jpg`,
                quantity: 1,
                size: null
            };
        }
        
        const name = element.querySelector('.product-title')?.textContent || 'Sản phẩm';
        const priceText = element.querySelector('.current-price')?.textContent || '0';
        const price = parseFloat(priceText.replace(/[^0-9]/g, '')) || 0;
        const imageUrl = element.querySelector('img')?.src || `${this.BASE_URL}/image/default-product.jpg`;
        
        return {
            id: productId,
            name: name,
            price: price,
            image: imageUrl,
            quantity: 1,
            size: null
        };
    }
    
    addToCartLocalStorage(product) {
        try {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            
            // Tìm sản phẩm cùng ID và size
            const existingItemIndex = cart.findIndex(item => 
                item.id == product.id && item.size === product.size
            );
            
            if (existingItemIndex !== -1) {
                // Cập nhật số lượng nếu đã tồn tại
                cart[existingItemIndex].quantity += product.quantity || 1;
            } else {
                // Thêm mới
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: product.quantity || 1,
                    size: product.size,
                    timestamp: new Date().getTime()
                });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            console.log(`✅ Added product ${product.id} to cart`);
            
            // Cập nhật UI giỏ hàng
            this.updateCartUI();
            
        } catch (error) {
            console.error('❌ Error adding to cart:', error);
        }
    }
    
    updateCartUI() {
        // Cập nhật số lượng giỏ hàng trên toàn site
        if (window.CartCommon && window.CartCommon.updateCartCount) {
            window.CartCommon.updateCartCount();
        } else {
            // Fallback: tự tính toán
            this.updateCartCountFallback();
        }
    }
    
    updateCartCountFallback() {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            
            // Tìm và cập nhật tất cả các phần tử hiển thị số lượng giỏ hàng
            const cartCountElements = document.querySelectorAll('.cart-count, .cart-floating-count');
            cartCountElements.forEach(el => {
                el.textContent = totalItems;
                el.style.display = totalItems > 0 ? 'flex' : 'none';
            });
            
        } catch (error) {
            console.error('❌ Error updating cart count:', error);
        }
    }
    
    showAddToCartNotification(productName) {
        try {
            // Xóa thông báo cũ nếu có
            const existingNotification = document.querySelector('.add-to-cart-notification');
            if (existingNotification) {
                existingNotification.remove();
            }
            
            // Tạo thông báo mới
            const notification = document.createElement('div');
            notification.className = 'add-to-cart-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <strong>Đang chuyển đến trang chi tiết của "${productName}"</strong>
                    </div>
                </div>
            `;
            
            // Thêm style
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 9999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideInRight 0.3s ease-out;
                max-width: 300px;
            `;
            
            // Thêm CSS animation nếu chưa có
            if (!document.querySelector('#add-to-cart-notification-style')) {
                const style = document.createElement('style');
                style.id = 'add-to-cart-notification-style';
                style.textContent = `
                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    
                    .add-to-cart-notification {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    
                    .notification-content {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                    }
                    
                    .notification-content i {
                        font-size: 24px;
                        color: #C8E6C9;
                        margin-top: 2px;
                    }
                    
                    .notification-content strong {
                        display: block;
                        font-size: 16px;
                        margin-bottom: 4px;
                    }
                    
                    .notification-content p {
                        margin: 0 0 6px 0;
                        font-size: 14px;
                    }
                    
                    .notification-content small {
                        font-size: 12px;
                        color: #E8F5E9;
                        opacity: 0.9;
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(notification);
            
            // Tự động ẩn sau 3 giây
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error showing notification:', error);
        }
    }
    
    navigateToProductDetail(productId) {
        console.log(`🔗 Navigating to product detail: ${productId}`);
        window.location.href = `${this.BASE_URL}/html/product-detail.html?id=${productId}`;
    }
    
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }
}

// ========== GLOBAL SETUP ==========

// Make available globally
window.ProductDisplay = ProductDisplay;

// Auto-initialize if container exists with data attributes
document.addEventListener('DOMContentLoaded', function() {
    // Find all containers with data-product-display
    const containers = document.querySelectorAll('[data-product-display]');
    
    containers.forEach(container => {
        const productsData = container.dataset.products;
        if (productsData) {
            try {
                const products = JSON.parse(productsData);
                const display = new ProductDisplay({
                    container: container,
                    products: products
                });
                display.render();
            } catch (e) {
                console.error('Error parsing product data:', e);
            }
        }
    });
});

console.log('✅ ProductDisplay Component loaded');