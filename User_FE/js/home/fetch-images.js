// fetch-images.js - Sử dụng product card giống trang see_all
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 fetch-images.js đang chạy...');
    
    const API_BASE_URL = 'http://localhost:3000/api/simple';
    
    // 1. Hàm tạo HTML cho sản phẩm - ĐƯỢC ĐIỀU CHỈNH để giống product_display.js
    function createProductCardHTML(product) {
        const productId = product.ProductID || product.id;
        const productName = product.ProductName || product.name || 'Sản phẩm';
        const price = product.SellingPrice || product.price || 0;
        const discount = product.Discount || product.discount || 0;
        const imageUrl = product.ImageURL || product.image || '/image/default-product.jpg';
        const league = product.LeagueName || product.league || '';
        const stock = product.StockQuantity || product.stock || product.TotalStock || 0;
        const brand = product.BrandName || product.brand || '';
        const category = product.CategoryName || product.category || '';
        
        // Format giá tiền - giống product_display.js
        const formatPrice = (amount) => {
            return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
        };
        
        // Tính giá sau giảm
        const finalPrice = discount > 0 ? Math.round(price * (100 - discount) / 100) : price;
        
        // Tạo HTML theo cấu trúc của product_display.js
        return `
            <div class="product-card" data-product-id="${productId}">
                <div class="image-holder">
                    <img src="${imageUrl}" 
                         alt="${productName}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='/image/default-product.jpg';">
                    ${discount > 0 ? `
                        <span class="discount-badge">-${discount}%</span>
                    ` : ''}
                    ${stock <= 0 ? `
                        <span class="out-of-stock-badge">HẾT HÀNG</span>
                    ` : ''}
                </div>
                
                <div class="product-info">
                    <h3>${productName}</h3>
                </div>
                
                <div class="price-section">
                    <div class="current-price">
                        ${formatPrice(finalPrice)}
                    </div>
                    
                    ${discount > 0 ? `
                        <div class="original-price">${formatPrice(price)}</div>
                    ` : ''}
                </div>
                
                <button class="add-to-cart" 
                        data-product-id="${productId}"
                        data-product-name="${productName}"
                        data-product-price="${finalPrice}"
                        ${stock <= 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart"></i> 
                    ${stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button>
            </div>
        `;
    }
    
    // 2. Hàm render sản phẩm
    function renderFeaturedProducts(products) {
        const productGrid = document.getElementById('featured-products');
        if (!productGrid) {
            console.error('❌ Không tìm thấy #featured-products');
            return;
        }
        
        if (!products || products.length === 0) {
            productGrid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 40px;">
                    <i class="fas fa-box-open" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i>
                    <p>Chưa có sản phẩm nổi bật</p>
                </div>
            `;
            return;
        }
        
        // Clear loading spinner
        productGrid.innerHTML = '';
        
        // Render sản phẩm
        products.forEach(product => {
            const productHTML = createProductCardHTML(product);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = productHTML;
            productGrid.appendChild(tempDiv.firstElementChild);
        });
        
        console.log(`✅ Đã render ${products.length} sản phẩm`);
    }
    
    // 3. Hàm tải sản phẩm từ API
    async function loadFeaturedProducts() {
        const productGrid = document.getElementById('featured-products');
        if (!productGrid) return;
        
        // Hiển thị loading
        productGrid.innerHTML = `
            <div class="loading-products">
                <div class="spinner"></div>
                <p>Đang tải sản phẩm...</p>
            </div>
        `;
        
        try {
            console.log('📡 Đang tải sản phẩm nổi bật từ API...');
            const response = await fetchWithTimeout(`${API_BASE_URL}/products`, {
                timeout: 5000
            });
            
            console.log('📊 API Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📦 API Response data:', data);
                
                if (data.success && data.products && data.products.length > 0) {
                    console.log(`✅ Đã tải ${data.products.length} sản phẩm`);
                    renderFeaturedProducts(data.products);
                    setupCart(); // Setup cart sau khi render sản phẩm
                } else {
                    console.warn('⚠️ API trả về dữ liệu rỗng hoặc không thành công');
                    console.log('Dữ liệu từ API:', data);
                    useMockProducts();
                }
            } else {
                console.warn(`⚠️ API response không ok: ${response.status}`);
                useMockProducts();
            }
            
        } catch (error) {
            console.error('❌ Lỗi fetch API:', error);
            console.log('🔄 Chuyển sang dùng dữ liệu mẫu...');
            useMockProducts();
        }
    }
    
    // 4. Dữ liệu mẫu khi API không hoạt động
    function useMockProducts() {
        console.log('🔄 Sử dụng dữ liệu mẫu...');
        
        const mockProducts = [
            {
                ProductID: 1,
                ProductName: "Áo Arsenal Sân Nhà 2024",
                ImageURL: "/image/default-product.jpg",
                SellingPrice: 450000,
                Discount: 10,
                LeagueName: "Premier League",
                StockQuantity: 50,
                BrandName: "Adidas"
            },
            {
                ProductID: 2,
                ProductName: "Áo Barcelona Sân Khách 2024",
                ImageURL: "/image/default-product.jpg",
                SellingPrice: 500000,
                Discount: 15,
                LeagueName: "La Liga",
                StockQuantity: 30,
                BrandName: "Nike"
            },
            {
                ProductID: 3,
                ProductName: "Áo Juventus Sân Nhà 2024",
                ImageURL: "/image/default-product.jpg",
                SellingPrice: 480000,
                Discount: 0,
                LeagueName: "Serie A",
                StockQuantity: 40,
                BrandName: "Adidas"
            },
            {
                ProductID: 4,
                ProductName: "Áo Bayern Munich Sân Nhà",
                ImageURL: "/image/default-product.jpg",
                SellingPrice: 520000,
                Discount: 5,
                LeagueName: "Bundesliga",
                StockQuantity: 25,
                BrandName: "Adidas"
            },
            {
                ProductID: 5,
                ProductName: "Áo PSG Sân Nhà 2024",
                ImageURL: "/image/default-product.jpg",
                SellingPrice: 490000,
                Discount: 20,
                LeagueName: "Ligue 1",
                StockQuantity: 35,
                BrandName: "Nike"
            },
            {
                ProductID: 6,
                ProductName: "Áo ĐTQG Việt Nam",
                ImageURL: "/image/default-product.jpg",
                SellingPrice: 350000,
                Discount: 0,
                LeagueName: "ĐTQG",
                StockQuantity: 100,
                BrandName: "Grand Sport"
            },
            {
                ProductID: 7,
                ProductName: "Giày Bóng Đá Nike Mercurial",
                ImageURL: "/image/default-product.jpg",
                SellingPrice: 1200000,
                Discount: 10,
                LeagueName: "",
                StockQuantity: 20,
                BrandName: "Nike"
            },
            {
                ProductID: 8,
                ProductName: "Găng Tay Thủ Môn Adidas",
                ImageURL: "/image/default-product.jpg",
                SellingPrice: 350000,
                Discount: 5,
                LeagueName: "",
                StockQuantity: 15,
                BrandName: "Adidas"
            }
        ];
        
        renderFeaturedProducts(mockProducts);
        setupCart();
    }
    
    // 5. Setup cart functionality - Giữ nguyên
    function setupCart() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        const cartCount = document.querySelector('.cart-count');
        
        // Load current cart count
        function updateCartCount() {
            try {
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                if (cartCount) {
                    cartCount.textContent = totalItems;
                    cartCount.style.display = totalItems > 0 ? 'block' : 'none';
                }
            } catch (e) {
                console.log('Lỗi load cart count:', e);
                if (cartCount) {
                    cartCount.textContent = '0';
                    cartCount.style.display = 'none';
                }
            }
        }
        
        // Initialize cart count
        updateCartCount();
        
        // Add to cart button click
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function() {
                if (this.disabled) return;
                
                const productId = this.dataset.productId;
                const productName = this.dataset.productName;
                const productPrice = parseFloat(this.dataset.productPrice);
                
                // Get product image
                const productCard = this.closest('.product-card');
                const productImage = productCard?.querySelector('img')?.src || '/image/default-product.jpg';
                
                // Add to cart
                let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                
                const existingItem = cart.find(item => item.id === productId);
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        id: productId,
                        name: productName,
                        price: productPrice,
                        image: productImage,
                        quantity: 1
                    });
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                
                // Update UI
                updateCartCount();
                
                // Animation
                if (cartCount) {
                    cartCount.classList.add('pulse');
                    setTimeout(() => {
                        cartCount.classList.remove('pulse');
                    }, 300);
                }
                
                // Button feedback
                const originalText = this.textContent;
                this.textContent = '✓ Đã thêm';
                this.style.background = '#4CAF50';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '';
                }, 1000);
                
                // Show notification
                showNotification(`Đã thêm "${productName}" vào giỏ hàng!`);
            });
        });
    }
    
    // 6. Helper functions
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    function fetchWithTimeout(url, options = {}) {
        const timeout = options.timeout || 5000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        return fetch(url, {
            ...options,
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
    }
    
    // 7. Thêm CSS styles cho product card mới
    function addStyles() {
        if (document.getElementById('product-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'product-styles';
        style.textContent = `
            /* Product grid - Giữ nguyên */
            .product-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 25px;
                margin-top: 30px;
            }
            
            /* Product card - ĐIỀU CHỈNH để giống product_display.js */
            .product-card {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
                position: relative;
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .product-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            }
            
            /* Image holder - giống product_display.js */
            .image-holder {
                position: relative;
                height: 200px;
                overflow: hidden;
                background: #f8f9fa;
            }
            
            .image-holder img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }
            
            .product-card:hover .image-holder img {
                transform: scale(1.05);
            }
            
            /* Discount badge - giống product_display.js */
            .discount-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                background: #e74c3c;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
                z-index: 2;
            }
            
            /* Out of stock badge */
            .out-of-stock-badge {
                position: absolute;
                top: 10px;
                left: 10px;
                background: #666;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: bold;
                z-index: 2;
            }
            
            /* Product info - điều chỉnh */
            .product-info {
                padding: 15px;
                flex-grow: 1;
            }
            
            .product-info h3 {
                margin: 0 0 8px 0;
                font-size: 16px;
                font-weight: 600;
                color: #333;
                line-height: 1.4;
                height: 45px;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }
            
            /* Price section - điều chỉnh */
            .price-section {
                padding: 0 15px 10px 15px;
            }
            
            .current-price {
                color: #d32f2f;
                font-weight: bold;
                font-size: 18px;
                margin-bottom: 5px;
            }
            
            .original-price {
                text-decoration: line-through;
                color: #999;
                font-size: 14px;
            }
            
            /* Add to cart button */
            .add-to-cart {
                margin: 0 15px 15px 15px;
                padding: 12px;
                background: #1a3e72;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .add-to-cart:hover {
                background: #0D2A57;
            }
            
            .add-to-cart:disabled {
                background: #ccc;
                cursor: not-allowed;
            }
            
            .add-to-cart i {
                font-size: 14px;
            }
            
            /* Loading spinner */
            .loading-products {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #2196F3;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .product-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                
                .image-holder {
                    height: 160px;
                }
                
                .product-info h3 {
                    font-size: 14px;
                    height: 40px;
                }
                
                .current-price {
                    font-size: 16px;
                }
            }
            
            @media (max-width: 480px) {
                .product-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
            }
            
            /* Notification styles */
            .cart-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 300px;
            }
            
            .cart-notification.show {
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 8. Main function
    async function init() {        
        console.log('🚀 Khởi động fetch-images.js...');
        
        // Add styles
        addStyles();
        
        // Load featured products
        await loadFeaturedProducts();
    }
    
    // 9. Start
    init();
});