// ========== PRODUCT DISPLAY COMPONENT ==========

class ProductDisplay {
    constructor(options = {}) {
        this.container = options.container;
        this.products = options.products || [];
        this.onProductClick = options.onProductClick || this.defaultProductClick;
        this.columns = options.columns || 4;
        this.showQuickAdd = options.showQuickAdd !== false;
    }
    
    // Render sản phẩm
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        this.products.forEach(product => {
            const productElement = this.createProductElement(product);
            this.container.appendChild(productElement);
        });
    }
    
    // Tạo HTML cho 1 sản phẩm
    createProductElement(product) {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.productId = product.productID;
        
        // Tính giá sau giảm
        const currentPrice = product.discount > 0 
            ? product.sellingPrice - (product.sellingPrice * product.discount / 100)
            : product.sellingPrice;
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.imageURL || '/images/default-product.jpg'}" 
                     alt="${product.productName}" 
                     loading="lazy">
                ${product.discount > 0 ? `<span class="product-badge">-${product.discount}%</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.productName}</h3>
                <div class="product-price">
                    <span class="current-price">${this.formatPrice(currentPrice)}₫</span>
                    ${product.discount > 0 ? 
                        `<span class="original-price">${this.formatPrice(product.sellingPrice)}₫</span>` : 
                        ''}
                </div>
                <div class="product-stock">
                    ${product.stockQuantity > 0 ? 
                        `<span class="in-stock">Còn hàng</span>` : 
                        `<span class="out-stock">Hết hàng</span>`}
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-view-detail" data-product-id="${product.productID}">
                    Xem chi tiết
                </button>
                ${this.showQuickAdd && product.stockQuantity > 0 ? 
                    `<button class="btn-quick-add" data-product-id="${product.productID}">
                        Thêm vào giỏ
                    </button>` : 
                    ''}
            </div>
        `;
        
        // Thêm event listeners
        this.addEventListeners(productCard, product);
        
        return productCard;
    }
    
    // Thêm event listeners
addEventListeners(productCard, product) {
    console.log(`🔵 Setting up event listeners for product ${product.productID}`);
    
    // Click vào ảnh/title để xem chi tiết
    const image = productCard.querySelector('.product-image');
    const title = productCard.querySelector('.product-title');
    const viewBtn = productCard.querySelector('.btn-view-detail');
    
    console.log(`🔵 Found elements:`, { image: !!image, title: !!title, viewBtn: !!viewBtn });
    
    const clickHandler = () => {
        console.log(`🟡 Product ${product.productID} clicked`);
        console.log(`🟡 onProductClick function:`, typeof this.onProductClick);
        
        if (typeof this.onProductClick === 'function') {
            this.onProductClick(product.productID);
        } else {
            console.error('❌ onProductClick is not a function');
            // Fallback
            window.location.href = `/product/${product.productID}`;
        }
    };
    
    if (image) {
        image.addEventListener('click', clickHandler);
        console.log(`✅ Added click listener to image for product ${product.productID}`);
    }
    
    if (title) {
        title.addEventListener('click', clickHandler);
        console.log(`✅ Added click listener to title for product ${product.productID}`);
    }
    
    if (viewBtn) {
        viewBtn.addEventListener('click', clickHandler);
        console.log(`✅ Added click listener to button for product ${product.productID}`);
    }
    
    // Nút thêm nhanh vào giỏ
    const quickAddBtn = productCard.querySelector('.btn-quick-add');
    if (quickAddBtn) {
        quickAddBtn.addEventListener('click', (e) => {
            console.log(`🟡 Quick add clicked for product ${product.productID}`);
            e.stopPropagation(); // Ngăn bubble lên parent
            this.quickAddToCart(product.productID);
        });
    }
}
    
    // Mặc định khi click sản phẩm
    defaultProductClick(productId) {
        window.location.href = `/product/${productId}`;
    }
    
    // Thêm nhanh vào giỏ hàng
    quickAddToCart(productId) {
        fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: productId,
                quantity: 1
            }),
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.requireLogin) {
                // Hiển thị modal đăng nhập
                if (typeof showLoginModal === 'function') {
                    showLoginModal();
                }
            } else if (data.success) {
                // Hiển thị thông báo
                if (typeof showSuccessMessage === 'function') {
                    showSuccessMessage('Đã thêm vào giỏ hàng!');
                }
                // Cập nhật số lượng giỏ hàng
                if (typeof updateCartCount === 'function') {
                    updateCartCount(data.cartCount);
                }
            }
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
        });
    }
    
    // Format giá
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }
    
    // Cập nhật sản phẩm
    updateProducts(products) {
        this.products = products;
        this.render();
    }
    
    // Thêm sản phẩm mới
    addProduct(product) {
        this.products.push(product);
        this.render();
    }
    
    // Lọc sản phẩm
    filterProducts(filterFn) {
        const filtered = this.products.filter(filterFn);
        this.updateProducts(filtered);
    }
    
    // Sắp xếp sản phẩm
    sortProducts(sortFn) {
        const sorted = [...this.products].sort(sortFn);
        this.updateProducts(sorted);
    }
}

// ========== PRODUCT GRID COMPONENT ==========

class ProductGrid {
    constructor(options = {}) {
        this.containerId = options.containerId;
        this.apiUrl = options.apiUrl;
        this.params = options.params || {};
        this.columns = options.columns || 4;
        this.productsPerPage = options.productsPerPage || 12;
        this.currentPage = 1;
        this.totalProducts = 0;
        this.isLoading = false;
        
        this.productDisplay = null;
        this.init();
    }
    
    async init() {
        await this.loadProducts();
        this.setupPagination();
    }
    
    async loadProducts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            // Build URL với params
            const url = new URL(this.apiUrl, window.location.origin);
            Object.keys(this.params).forEach(key => {
                url.searchParams.append(key, this.params[key]);
            });
            url.searchParams.append('page', this.currentPage);
            url.searchParams.append('limit', this.productsPerPage);
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                this.totalProducts = data.total || data.products.length;
                
                if (!this.productDisplay) {
                    // Khởi tạo ProductDisplay
                    const container = document.getElementById(this.containerId);
                    if (!container) return;
                    
                    this.productDisplay = new ProductDisplay({
                        container: container,
                        products: data.products,
                        columns: this.columns,
                        onProductClick: (productId) => {
                            window.location.href = `/product/${productId}`;
                        }
                    });
                } else {
                    // Cập nhật sản phẩm
                    this.productDisplay.updateProducts(data.products);
                }
                
                this.render();
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError();
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    showLoading() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Đang tải sản phẩm...</p>
            </div>
        `;
    }
    
    hideLoading() {
        // Xóa loading nếu có
    }
    
    showError() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-container">
                <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
                <button onclick="window.location.reload()">Thử lại</button>
            </div>
        `;
    }
    
    setupPagination() {
        const paginationContainer = document.getElementById(`${this.containerId}-pagination`);
        if (!paginationContainer || this.totalProducts <= this.productsPerPage) return;
        
        const totalPages = Math.ceil(this.totalProducts / this.productsPerPage);
        
        let paginationHTML = '';
        
        // Nút Previous
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="page-btn" data-page="${this.currentPage - 1}">
                    ← Trước
                </button>
            `;
        }
        
        // Các trang
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                paginationHTML += `
                    <button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                            data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (Math.abs(i - this.currentPage) === 3) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
        }
        
        // Nút Next
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="page-btn" data-page="${this.currentPage + 1}">
                    Sau →
                </button>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
        
        // Thêm event listeners
        paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            });
        });
    }
    
    goToPage(page) {
        if (page === this.currentPage) return;
        
        this.currentPage = page;
        this.loadProducts();
        
        // Scroll lên đầu
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    render() {
        // Render chính được xử lý bởi ProductDisplay
        this.setupPagination();
    }
    
    updateParams(newParams) {
        this.params = { ...this.params, ...newParams };
        this.currentPage = 1;
        this.loadProducts();
    }
}

// ========== GLOBAL FUNCTIONS ==========

// Hàm tiện ích để chuyển đến trang chi tiết
function navigateToProduct(productId) {
    window.location.href = `/product/${productId}`;
}

// Hàm hiển thị sản phẩm nhanh
function renderProducts(containerId, products, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const productDisplay = new ProductDisplay({
        container: container,
        products: products,
        columns: options.columns || 4,
        showQuickAdd: options.showQuickAdd !== false,
        onProductClick: options.onProductClick || navigateToProduct
    });
    
    productDisplay.render();
}

// Export để sử dụng
window.ProductDisplay = ProductDisplay;
window.ProductGrid = ProductGrid;
window.renderProducts = renderProducts;
window.navigateToProduct = navigateToProduct;