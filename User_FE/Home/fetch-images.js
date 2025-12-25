// fetch-images.js - ĐÃ SỬA LỖI
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 fetch-images.js đang chạy...');
    
    const API_BASE_URL = 'http://localhost:3000/api/simple';
    let useMockDataFlag = false; // Đổi tên biến
    
    // 1. Hàm kiểm tra API
    async function checkAPIHealth() {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/test`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                return true;
            }
            return false;
        } catch (error) {
            console.warn('⚠️ API không khả dụng:', error.message);
            return false;
        }
    }
    
    // 2. Hàm tải sản phẩm với fallback
    async function loadProductsWithFallback() {
        const productGrid = document.querySelector('.product-grid');
        if (!productGrid) return;
        
        try {
            // Thử fetch từ API
            const response = await fetchWithTimeout(`${API_BASE_URL}/products`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.products && data.products.length > 0) {
                updateProducts(data.products);
            } else {
                console.warn('⚠️ API trả về dữ liệu rỗng');
                useMockDataFunction();
            }
            
        } catch (error) {
            console.error('❌ Lỗi fetch API:', error);
            console.log('🔄 Chuyển sang dùng dữ liệu mẫu...');
            useMockDataFunction();
        }
    }
    
    // 3. Hàm cập nhật sản phẩm từ database
    function updateProducts(products) {
        const productCards = document.querySelectorAll('.product-card');
             
        productCards.forEach((card, index) => {
            if (products[index]) {
                const product = products[index];
                
                // Cập nhật ảnh
                const img = card.querySelector('img');
                if (img && product.ImageURL) {
                    img.src = product.ImageURL;
                    img.alt = product.ProductName;
                    
                    // Xử lý lỗi ảnh
                    img.onerror = function() {
                        console.warn(`⚠️ Ảnh không tải được: ${product.ImageURL}`);
                        this.src = getDefaultImage();
                    };
                }
                
                // Cập nhật tên
                const title = card.querySelector('h3');
                if (title) {
                    title.textContent = product.ProductName;
                }
                
                // Cập nhật giá
                const price = card.querySelector('.price');
                if (price) {
                    price.textContent = formatPrice(product.SellingPrice);
                    
                    // Thêm discount nếu có
                    if (product.Discount && product.Discount > 0) {
                        const discountedPrice = product.SellingPrice * (1 - product.Discount/100);
                        price.innerHTML = `
                            <span style="text-decoration: line-through; color: #999; margin-right: 10px;">
                                ${formatPrice(product.SellingPrice)}
                            </span>
                            ${formatPrice(discountedPrice)}
                            <span style="background: #d32f2f; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-left: 5px;">
                                -${product.Discount}%
                            </span>
                        `;
                    }
                }
                
                // Thêm data attribute cho button
                const button = card.querySelector('.add-to-cart');
                if (button) {
                    button.dataset.productId = product.ProductID;
                    button.dataset.productName = product.ProductName;
                    button.dataset.productPrice = product.SellingPrice;
                }
            }
        });
        
        // Ẩn thông báo lỗi nếu có
        hideErrorMessage();
    }
    
    // 4. Hàm dùng dữ liệu mẫu (khi API fail) - ĐỔI TÊN
    function useMockDataFunction() {
        useMockDataFlag = true;
        // Chỉ cần setup cart events
        setupCart();
        
        // Ẩn thông báo lỗi
        hideErrorMessage();
    }
    
    // 5. Hàm ẩn thông báo lỗi
    function hideErrorMessage() {
        const errorDiv = document.querySelector('.product-grid > div[style*="color: #d32f2f"]');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }
    
    // 6. Hàm định dạng giá
    function formatPrice(price) {
        if (!price) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
    
    // 7. Ảnh mặc định
    function getDefaultImage() {
        return './image/default-product.jpg';
    }
    
    // 8. Setup cart (giữ nguyên từ home.js)
    function setupCart() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart');
        const cartCount = document.querySelector('.cart-count');
        let count = parseInt(localStorage.getItem('cartCount') || '0');
        
        if (cartCount) {
            cartCount.textContent = count;
        }
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const productId = this.dataset.productId;
                
                if (productId) {
                    // Nếu có productId từ database
                    try {
                        await fetchWithTimeout(`${API_BASE_URL}/cart/add`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                productId: productId,
                                quantity: 1
                            })
                        });
                    } catch (error) {
                        console.log('⚠️ Không thể thêm vào database cart, chỉ dùng localStorage');
                    }
                }
                
                // Tăng count
                count++;
                
                if (cartCount) {
                    cartCount.textContent = count;
                    cartCount.classList.add('pulse');
                    
                    setTimeout(() => {
                        cartCount.classList.remove('pulse');
                    }, 300);
                }
                
                // Lưu vào localStorage
                localStorage.setItem('cartCount', count);
                
                // Hiệu ứng button
                const originalText = this.textContent;
                this.textContent = '✓ Đã thêm';
                this.style.background = '#4CAF50';
                
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '';
                }, 1000);
                
                // Hiển thị thông báo
                showNotification('Đã thêm vào giỏ hàng!');
            });
        });
    }
    
    // 9. Hàm thông báo
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    // 10. Hàm fetch với timeout
    function fetchWithTimeout(url, options = {}) {
        const timeout = options.timeout || 5000; // 5 giây
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        return fetch(url, {
            ...options,
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
    }
    
    // 11. Thêm CSS animation
    function addStyles() {
        // Kiểm tra nếu chưa có style
        if (document.getElementById('fetch-images-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'fetch-images-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            /* Style cho discount */
            .product-card .price .discount-badge {
                background: #d32f2f;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.8em;
                margin-left: 5px;
                display: inline-block;
            }
            
            .product-card .price .original-price {
                text-decoration: line-through;
                color: #999;
                font-size: 0.9em;
                margin-right: 8px;
            }
            
            .product-card .price .current-price {
                color: #d32f2f;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 12. Hàm chính
    async function init() {
        addStyles();
        
        // Kiểm tra API
        const apiHealthy = await checkAPIHealth();
        
        if (apiHealthy) {
            await loadProductsWithFallback();
        } else {
            console.warn('⚠️ API không hoạt động, dùng dữ liệu mẫu');
            useMockDataFunction(); // Gọi hàm đã đổi tên
        }
        
        // Luôn setup cart
        setupCart();

    }
    
    // 13. Khởi chạy
    init();
});