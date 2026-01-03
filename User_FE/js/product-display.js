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
            1: 'image/clothes/1.jpg',      // Quần áo
            2: 'image/shoes/81.jpg',       // Giày
            3: 'image/accessories/101.jpg', // Phụ kiện
            4: 'image/clothes/121.jpg',    // Áo khoác
            5: 'image/gloves/111.jpg'      // Găng tay
        };
        
        console.log(`🛒 ProductDisplay ready`);
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
                     onerror="this.onerror=null; this.src='/User_FE/image/default-product.jpg'">
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
        // Product card click
        if (this.clickable) {
            this.container.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-quick-add')) return;
                    const productId = card.dataset.productId;
                    this.handleProductClick(productId, e);
                });
            });
        }
        
        // Add to cart button
        this.container.querySelectorAll('.btn-quick-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                this.handleAddToCart(productId, e);
            });
        });
    }
    
    handleProductClick(productId, event) {
        if (typeof this.onProductClick === 'function') {
            this.onProductClick(productId, event);
        } else {
            window.location.href = `${this.BASE_URL}/product-detail.html?id=${productId}`;
        }
    }
    
    handleAddToCart(productId, event) {
        if (typeof this.onAddToCart === 'function') {
            this.onAddToCart(productId, event);
        } else {
            console.log(`🛒 Default add to cart: ${productId}`);
            // Trigger global event
            const cartEvent = new CustomEvent('product:add-to-cart', {
                detail: { productId },
                bubbles: true
            });
            event.target.dispatchEvent(cartEvent);
        }
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