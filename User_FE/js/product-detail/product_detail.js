// ========== CONFIG ==========
const API_BASE_URL = 'http://localhost:3000/api';

// ========== UTILITY FUNCTIONS ==========

function setupDOMMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                console.log('🔍 DOM changed:', mutation.target.nodeName);
                
                // Kiểm tra các element quan trọng
                const importantIds = ['product-title', 'main-img', 'price-container'];
                importantIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el && !window._productElements?.[id]) {
                        console.log(`✨ Element ${id} appeared in DOM`);
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('👀 DOM MutationObserver setup');
}

// Hàm debounce để tránh gọi hàm nhiều lần
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format price - FIXED
function formatPrice(price) {
    if (!price || isNaN(price)) return '0₫';
    const numericPrice = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(numericPrice) + '₫';
}

// ========== IMAGE HANDLING ==========

// Thay đổi ảnh chính khi click thumbnail
function changeImage(src, clickedElement) {
    const mainImg = document.getElementById('main-img');
    if (!mainImg) return;
    
    mainImg.src = src;
    // Remove active class from all thumbnails
    document.querySelectorAll('.thumbnail').forEach(img => {
        img.classList.remove('active');
    });
    // Add active class to clicked thumbnail
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
}

// ========== QUANTITY HANDLING ==========

// Xử lý số lượng
function initializeQuantityControls() {
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    const quantityInput = document.getElementById('quantity');
    
    if (!minusBtn || !plusBtn || !quantityInput) return;
    
    minusBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value) || 1;
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updateActionButtons();
        }
    });
    
    plusBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value) || 1;
        const max = parseInt(quantityInput.max) || 99;
        if (currentValue < max) {
            quantityInput.value = currentValue + 1;
            updateActionButtons();
        }
    });
    
    // Validate input
    quantityInput.addEventListener('change', function() {
        let value = parseInt(this.value) || 1;
        const min = 1;
        const max = parseInt(this.max) || 99;
        
        if (value < min) {
            this.value = min;
        } else if (value > max) {
            this.value = max;
        }
        updateActionButtons();
    });
}

// Cập nhật trạng thái nút hành động
function updateActionButtons() {
    const quantityInput = document.getElementById('quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    
    if (!quantityInput || !addToCartBtn || !buyNowBtn) return;
    
    const quantity = parseInt(quantityInput.value) || 1;
    const max = parseInt(quantityInput.max) || 99;
    
    // Nếu số lượng vượt quá tồn kho
    if (quantity > max) {
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.title = 'Số lượng vượt quá tồn kho';
        buyNowBtn.title = 'Số lượng vượt quá tồn kho';
    } else {
        addToCartBtn.disabled = false;
        buyNowBtn.disabled = false;
        addToCartBtn.title = '';
        buyNowBtn.title = '';
    }
}

// ========== TAB HANDLING ==========

// Tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            openTab(tabName, this);
        });
    });
}

function openTab(tabName, clickedButton) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

// ========== CART AND CHECKOUT ==========

// Thêm vào giỏ hàng
function addToCart(productId) {
    const size = document.querySelector('input[name="size"]:checked');
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    // Kiểm tra có size options không
    const sizeSection = document.getElementById('size-section');
    const hasSizeOptions = sizeSection && sizeSection.style.display !== 'none';
    
    if (!size && hasSizeOptions) {
        showNotification('Vui lòng chọn size!', 'error');
        return;
    }
    
    if (quantity <= 0) {
        showNotification('Số lượng không hợp lệ!', 'error');
        return;
    }
    
    // Disable button temporarily to prevent multiple clicks
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.disabled = true;
    addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Đang thêm...';
    
    // Sử dụng localStorage làm fallback
    const productName = document.getElementById('product-title').textContent;
    const currentPrice = document.querySelector('.current-price');
    const price = currentPrice ? parseFloat(currentPrice.textContent.replace(/[^0-9]/g, '')) : 0;
    const imageUrl = document.getElementById('main-img').src;
    const productImage = imageUrl.includes('default-product.jpg') ? '' : imageUrl;
    
    // Thêm vào localStorage
    addToCartLocalStorage({
        id: productId,
        name: productName,
        price: price,
        image: productImage,
        quantity: quantity,
        size: size ? size.value : null
    });
    
    // Show success message
    showNotification(`Đã thêm "${productName}" vào giỏ hàng!`, 'success');
    
    // Re-enable button
    setTimeout(() => {
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = originalText;
    }, 1000);
}

// Thêm vào giỏ hàng localStorage (fallback)
function addToCartLocalStorage(product) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Tìm sản phẩm đã có chưa (cùng ID và size)
        const existingItem = cart.find(item => 
            item.id == product.id && item.size === product.size
        );
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
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
        updateCartCount();
        
    } catch (e) {
        console.log('Lỗi add to cart:', e);
        showNotification('Lỗi khi thêm vào giỏ hàng!', 'error');
    }
}

// Cập nhật số lượng giỏ hàng
function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    } catch (e) {
        console.log('Lỗi update cart count:', e);
    }
}

// Mua ngay
function buyNow(productId) {
    const size = document.querySelector('input[name="size"]:checked');
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    // Kiểm tra có size options không
    const sizeSection = document.getElementById('size-section');
    const hasSizeOptions = sizeSection && sizeSection.style.display !== 'none';
    
    if (!size && hasSizeOptions) {
        showNotification('Vui lòng chọn size!', 'error');
        return;
    }
    
    if (quantity <= 0) {
        showNotification('Số lượng không hợp lệ!', 'error');
        return;
    }
    
    // Disable button temporarily
    const buyNowBtn = document.getElementById('buy-now-btn');
    const originalText = buyNowBtn.innerHTML;
    buyNowBtn.disabled = true;
    buyNowBtn.innerHTML = 'Đang xử lý...';
    
    // Lưu vào session để checkout page có thể lấy
    const productName = document.getElementById('product-title').textContent;
    const currentPrice = document.querySelector('.current-price');
    const price = currentPrice ? parseFloat(currentPrice.textContent.replace(/[^0-9]/g, '')) : 0;
    const imageUrl = document.getElementById('main-img').src;
    
    const checkoutItem = {
        productId: productId,
        productName: productName,
        price: price,
        image: imageUrl,
        quantity: quantity,
        size: size ? size.value : null
    };
    
    localStorage.setItem('checkoutItem', JSON.stringify(checkoutItem));
    
    // Chuyển đến trang checkout
    setTimeout(() => {
        window.location.href = '../html/checkout.html';
    }, 300);
}

// ========== FAVORITES ==========

// Yêu thích
function toggleFavorite(productId, event) {
    const btn = event ? event.target.closest('.btn-favorite') : document.getElementById('favorite-btn');
    
    if (!btn) return;
    
    // Toggle visual state immediately for better UX
    const isCurrentlyFavorited = btn.classList.contains('favorited');
    if (isCurrentlyFavorited) {
        btn.classList.remove('favorited');
        btn.innerHTML = '<i class="fas fa-heart"></i> Yêu thích';
        showNotification('Đã xóa khỏi danh sách yêu thích', 'info');
    } else {
        btn.classList.add('favorited');
        btn.innerHTML = '<i class="fas fa-heart"></i> Đã yêu thích';
        showNotification('Đã thêm vào danh sách yêu thích', 'success');
    }
    
    // Lưu vào localStorage
    saveFavoriteToLocalStorage(productId, !isCurrentlyFavorited);
}

// Lưu yêu thích vào localStorage
function saveFavoriteToLocalStorage(productId, isFavorite) {
    try {
        let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        
        if (isFavorite) {
            if (!favorites.includes(productId.toString())) {
                favorites.push(productId.toString());
            }
        } else {
            favorites = favorites.filter(id => id != productId.toString());
        }
        
        localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (e) {
        console.log('Lỗi lưu favorite:', e);
    }
}

// Kiểm tra xem sản phẩm đã được yêu thích chưa
function checkFavoriteStatus(productId) {
    try {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        return favorites.includes(productId.toString());
    } catch (e) {
        return false;
    }
}

// ========== NOTIFICATIONS ==========

// Hiển thị thông báo
function showNotification(message, type = 'success') {
    try {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Tạo notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '5px',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease-out',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '300px'
        });
        
        document.body.appendChild(notification);
        
        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
    } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback: alert đơn giản
        alert(message);
    }
}

// ========== ERROR HANDLING ==========

function showErrorMessage(message) {
    const container = document.querySelector('.product-detail-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-container" style="text-align: center; padding: 60px; background: white; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
            <div style="font-size: 48px; color: #ccc; margin-bottom: 20px;">⚠️</div>
            <h2>Đã xảy ra lỗi</h2>
            <p>${message}</p>
            <button onclick="reloadPage()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer; margin: 10px;">Thử lại</button>
            <button onclick="goToHomePage()" style="padding: 12px 24px; background: #333; color: white; border: none; border-radius: 6px; cursor: pointer; margin: 10px;">Trang chủ</button>
        </div>
    `;
}

function showNotFoundMessage() {
    const container = document.querySelector('.product-detail-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="not-found-container" style="text-align: center; padding: 60px; background: white; border-radius: 12px; box-shadow: 0 5px 15px rgba(0,0,0,0.08);">
            <div style="font-size: 48px; color: #ccc; margin-bottom: 20px;">😕</div>
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <button onclick="goToHomePage()" style="padding: 12px 24px; background: #333; color: white; border: none; border-radius: 6px; cursor: pointer;">Quay về trang chủ</button>
        </div>
    `;
}

function showLoadingState() {
    const container = document.querySelector('.product-detail-container');
    if (!container) return;
    
    // Lưu nội dung gốc trước khi thay thế
    if (!window._originalContent) {
        window._originalContent = container.innerHTML;
    }
    
    container.innerHTML = `
        <div class="loading-container" style="text-align: center; padding: 60px; color: #666;">
            <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
            <p>Đang tải thông tin sản phẩm...</p>
        </div>
    `;
}

// Thêm hàm để restore content
function hideLoadingState() {
    const container = document.querySelector('.product-detail-container');
    if (!container || !window._originalContent) return;
    
    // Restore nội dung gốc
    container.innerHTML = window._originalContent;
    console.log('✅ Loading state hidden, content restored');
}

// ========== PRODUCT DATA LOADING ==========

// Lấy product ID từ URL
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    console.log('Product ID from URL:', productId);
    return productId;
}

// Load product data từ API - SIMPLIFIED VERSION
async function loadProductData() {
    const productId = getProductIdFromUrl();
    
    console.log('📦 Loading product ID:', productId);
    
    if (!productId) {
        showNotFoundMessage();
        return;
    }

    try {
        showLoadingState();
        
        console.log(`📡 Calling API: ${API_BASE_URL}/products/${productId}`);
        
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        
        console.log('📡 API Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 API Response data:', data);
        
        if (data.success && data.product) {
            console.log('✅ Product found:', data.product.ProductName);
            
            // Ẩn loading state
            setTimeout(() => {
                hideLoadingState();
                // Populate data ngay lập tức
                setTimeout(() => {
                    populateProductData(data.product);
                }, 100);
            }, 500);
            
        } else {
            console.log('❌ Product not found in response');
            hideLoadingState();
            showNotFoundMessage();
        }
        
    } catch (error) {
        console.error('❌ Error loading product:', error);
        
        // Ẩn loading
        hideLoadingState();
        showNotification('Không thể tải dữ liệu sản phẩm', 'error');
    }
}

// SIMPLE FUNCTION TO FIX IMAGE AND PRICE DISPLAY
function populateProductData(product) {
    console.log('🎯 Populating product data:', product);
    
    try {
        // 1. Update product title
        const productTitle = document.getElementById('product-title');
        if (productTitle) {
            productTitle.textContent = product.ProductName || 'Sản phẩm';
            console.log('✅ Updated product title:', product.ProductName);
        }
        
        // 2. Update breadcrumb
        const productNameSpan = document.getElementById('product-name');
        if (productNameSpan) {
            productNameSpan.textContent = product.ProductName || 'Sản phẩm';
        }
        
        // 3. Update image - SIMPLE FIX
        const mainImg = document.getElementById('main-img');
        if (mainImg) {
            let imageUrl = product.ImageURL || '';
            
            // Fix image URL
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                if (imageUrl.startsWith('image/')) {
                    imageUrl = '/' + imageUrl; // Add leading slash
                } else {
                    imageUrl = '/image/' + imageUrl; // Assume it's in image folder
                }
            }
            
            console.log('🖼️ Image URL:', imageUrl);
            mainImg.src = imageUrl;
            mainImg.alt = product.ProductName || 'Product image';
            
            // Handle image errors
            mainImg.onerror = function() {
                console.error('❌ Image failed to load, using fallback');
                this.src = '/image/clothes/1.jpg'; // Fallback image
            };
            
            mainImg.onload = function() {
                console.log('✅ Image loaded successfully');
            };
        }
        
        // 4. Update price - SIMPLE FIX
        const priceContainer = document.getElementById('price-container');
        if (priceContainer) {
            const sellingPrice = parseFloat(product.SellingPrice) || 0;
            const discount = parseFloat(product.Discount) || 0;
            
            console.log('💰 Price data:', { sellingPrice, discount });
            
            if (discount > 0) {
                const discountedPrice = Math.round(sellingPrice * (100 - discount) / 100);
                priceContainer.innerHTML = `
                    <div class="discount-price">
                        <span class="final-price">${formatPrice(discountedPrice)}</span>
                        <span class="discount-badge">-${discount}%</span>
                    </div>
                    <div class="original-price">
                        <span class="strike-price">${formatPrice(sellingPrice)}</span>
                    </div>
                `;
            } else {
                priceContainer.innerHTML = `
                    <div class="normal-price">
                        <span class="price">${formatPrice(sellingPrice)}</span>
                    </div>
                `;
            }
            console.log('✅ Updated price display');
        }
        
        // 5. Update other elements
        updateElementText('category-link', product.CategoryName);
        updateElementText('brand-link', product.BrandName);
        updateElementText('league-link', product.LeagueName);
        updateElementText('product-code', product.ProductID);
        
        // 6. Update stock status
        const stockStatus = document.getElementById('stock-status');
        if (stockStatus) {
            const stockQuantity = product.StockQuantity || 0;
            if (stockQuantity > 0) {
                stockStatus.textContent = `Còn hàng (${stockQuantity})`;
                stockStatus.className = 'stock-status in-stock';
            } else {
                stockStatus.textContent = 'Hết hàng';
                stockStatus.className = 'stock-status out-stock';
            }
        }
        
        // 7. Update description
        const description = document.getElementById('product-description');
        if (description) {
            description.textContent = product.Description || 'Không có mô tả.';
        }
        
        // 8. Update specifications
        updateElementText('spec-category', product.CategoryName);
        updateElementText('spec-brand', product.BrandName);
        updateElementText('spec-league', product.LeagueName);
        updateElementText('spec-season', product.Season || '2022');
        updateElementText('spec-player', product.PlayerName || 'Không áp dụng');
        
        console.log('🎯 Product data populated successfully!');
        
        // Setup event listeners
        setupEventListeners(product.ProductID);
        
    } catch (error) {
        console.error('❌ Error in populateProductData:', error);
        showNotification('Lỗi hiển thị sản phẩm', 'error');
    }
}

// Helper function to update element text
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element && text !== undefined && text !== null) {
        element.textContent = text;
        return true;
    }
    return false;
}

function setupEventListeners(productId) {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            addToCart(productId);
        });
    }
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            buyNow(productId);
        });
    }
    
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
            toggleFavorite(productId, e);
        });
    }
}

// ========== HELPER FUNCTIONS ==========

function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    } catch (e) {
        console.log('Lỗi update cart count:', e);
    }
}

function goToHomePage() {
    window.location.href = '/html/home.html';
}

function reloadPage() {
    window.location.reload();
}

// ========== INITIALIZATION ==========

// Khởi tạo trang - SIMPLIFIED
function initializePage() {
    console.log('🚀 Initializing product detail page...');
    
    try {
        // Kiểm tra xem các element cần thiết đã tồn tại chưa
        setTimeout(() => {
            const productTitle = document.getElementById('product-title');
            const mainImg = document.getElementById('main-img');
            const priceContainer = document.getElementById('price-container');
            
            console.log('🔍 Checking elements:', {
                productTitle: !!productTitle,
                mainImg: !!mainImg,
                priceContainer: !!priceContainer
            });
            
            // Khởi tạo các chức năng cơ bản
            updateCartCount();
            initializeQuantityControls();
            initializeTabs();
            
            // Load product data
            loadProductData();
            
        }, 100);
        
    } catch (error) {
        console.error('❌ Failed to initialize page:', error);
        
        // Thử lại sau 1 giây
        setTimeout(() => {
            console.log('🔄 Retrying initialization...');
            initializePage();
        }, 1000);
    }
}

// Bắt đầu khởi tạo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    // DOM đã sẵn sàng, chạy ngay
    initializePage();
}

// Export các hàm cần thiết ra global scope
window.changeImage = changeImage;
window.openTab = openTab;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.toggleFavorite = toggleFavorite;
window.reloadPage = reloadPage;
window.goToHomePage = goToHomePage;