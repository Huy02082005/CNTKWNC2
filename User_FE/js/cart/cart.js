// ========== CART PAGE FUNCTIONS ==========

// Khởi tạo trang giỏ hàng
function initializeCartPage() {
    console.log('🛒 Initializing cart page...');
    
    // Load cart data
    loadCartData();
    
    // Setup event listeners chỉ 1 lần
    setupCartPageListeners();
    
    // Load related products
    loadCartRelatedProducts();
    
    console.log('✅ Cart page initialized');
}

// Load cart data và render
function loadCartData() {
    try {
        const cart = window.CartCommon ? window.CartCommon.getCart() : getCartFromStorage();
        renderCartItems(cart);
        updateOrderSummary(cart);
    } catch (error) {
        console.error('❌ Error loading cart data:', error);
        showCartError();
    }
}

// Lấy giỏ hàng từ localStorage (fallback)
function getCartFromStorage() {
    try {
        const cartData = localStorage.getItem('cart');
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        console.error('❌ Error reading cart from storage:', error);
        return [];
    }
}

// Render cart items
function renderCartItems(cart) {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartItemsCount = document.getElementById('cart-items-count');
    
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <div class="empty-cart-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <h3>Giỏ hàng của bạn đang trống</h3>
                <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
                <a href="/html/see_all.html" class="btn btn-primary">
                    <i class="fas fa-shopping-bag"></i> Tiếp tục mua sắm
                </a>
            </div>
        `;
        
        if (cartItemsCount) {
            cartItemsCount.textContent = '0 sản phẩm';
        }
        
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
        }
        
        return;
    }
    
    if (cartItemsCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartItemsCount.textContent = `${totalItems} sản phẩm`;
    }
    
    let html = '';
    
    cart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        
        html += `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-image">
                    <img src="${item.image || '/image/clothes/1.jpg'}" 
                         alt="${item.name}"
                         onerror="this.src='/image/clothes/1.jpg'">
                </div>
                
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-meta">
                        ${item.size ? `<span class="cart-item-size">Size: ${item.size}</span>` : ''}
                        ${item.brand ? `<span class="cart-item-brand">${item.brand}</span>` : ''}
                    </div>
                    <div class="cart-item-price">${formatPrice(item.price || 0)}</div>
                </div>
                
                <div class="cart-item-actions">
                    <div class="cart-item-total">${formatPrice(itemTotal)}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn minus">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" class="quantity-input" 
                               value="${item.quantity || 1}" min="1" max="99">
                        <button class="quantity-btn plus">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="remove-item-btn" onclick="removeItem(${index})">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = html;
    
    // Setup quantity buttons SAU KHI render
    setTimeout(() => {
        setupQuantityButtons();
    }, 100);
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
    }
}

// Update order summary
function updateOrderSummary(cart) {
    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return total + (price * quantity);
    }, 0);
    
    // Calculate shipping (free if subtotal >= 500000)
    const shipping = subtotal >= 500000 ? 0 : 30000;
    
    // Calculate discount (if any)
    const discount = 0; // Can be extended with discount codes
    
    // Calculate total
    const total = subtotal + shipping - discount;
    
    // Update DOM
    updateElementText('cart-subtotal', formatPrice(subtotal));
    updateElementText('shipping-fee', shipping === 0 ? 'Miễn phí' : formatPrice(shipping));
    updateElementText('cart-discount', formatPrice(discount));
    updateElementText('cart-total', formatPrice(total));
}

// Update quantity with +/- buttons
function updateQuantity(index, change) {
    console.log(`📝 updateQuantity called: index=${index}, change=${change}`);
    
    try {
        const cart = window.CartCommon ? window.CartCommon.getCart() : getCartFromStorage();
        
        if (!cart[index]) {
            console.error('❌ Item not found at index:', index);
            return;
        }
        
        const currentQuantity = parseInt(cart[index].quantity) || 1;
        const newQuantity = currentQuantity + change;
        
        console.log(`📦 Quantity change: ${currentQuantity} → ${newQuantity}`);
        
        if (newQuantity <= 0) {
            // Remove item
            if (confirm('Xóa sản phẩm này?')) {
                removeItem(index);
            }
            return;
        }
        
        if (newQuantity > 99) {
            showCartNotification('Số lượng tối đa là 99', 'error');
            return;
        }
        
        // Cập nhật TRỰC TIẾP trong giỏ hàng
        cart[index].quantity = newQuantity;
        saveCartToStorage(cart);
        
        // Cập nhật UI ngay lập tức
        updateCartUI();
        
        // Update DOM input value
        const input = document.querySelector(`.cart-item[data-index="${index}"] .quantity-input`);
        if (input) {
            input.value = newQuantity;
        }
        
        // Update tổng tiền
        const itemTotal = (cart[index].price || 0) * newQuantity;
        const totalElement = document.querySelector(`.cart-item[data-index="${index}"] .cart-item-total`);
        if (totalElement) {
            totalElement.textContent = formatPrice(itemTotal);
        }
        
        // Update order summary
        updateOrderSummary(cart);
        
        showCartNotification(`Đã cập nhật số lượng: ${newQuantity}`, 'success');
        
    } catch (error) {
        console.error('❌ Error updating quantity:', error);
        showCartNotification('Lỗi cập nhật số lượng', 'error');
    }
}

// Thêm function updateQuantityInput để xử lý input thay đổi
function updateQuantityInput(index, value) {
    console.log(`⌨️ updateQuantityInput: index=${index}, value=${value}`);
    
    const quantity = parseInt(value);
    
    if (isNaN(quantity) || quantity < 1) {
        // Reset về giá trị cũ
        const cart = window.CartCommon ? window.CartCommon.getCart() : getCartFromStorage();
        if (cart[index]) {
            document.querySelector(`.cart-item[data-index="${index}"] .quantity-input`).value = cart[index].quantity || 1;
        }
        return;
    }
    
    if (quantity > 99) {
        showCartNotification('Số lượng tối đa là 99', 'error');
        document.querySelector(`.cart-item[data-index="${index}"] .quantity-input`).value = 99;
        updateQuantity(index, 99 - (cart[index]?.quantity || 1));
        return;
    }
    
    const cart = window.CartCommon ? window.CartCommon.getCart() : getCartFromStorage();
    const currentQuantity = cart[index]?.quantity || 1;
    updateQuantity(index, quantity - currentQuantity);
}

// Remove item from cart
function removeItem(index) {
    console.log(`🗑️ removeItem called for index: ${index}`);
    
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
        return;
    }
    
    try {
        if (window.CartCommon && window.CartCommon.removeCartItem) {
            window.CartCommon.removeCartItem(index);
        } else {
            const cart = getCartFromStorage();
            if (cart[index]) {
                cart.splice(index, 1);
                saveCartToStorage(cart);
                updateCartUI();
            }
        }
        
        // Re-render cart page
        loadCartData();
        
    } catch (error) {
        console.error('❌ Error removing item:', error);
        showCartNotification('Lỗi xóa sản phẩm', 'error');
    }
}

// Save cart to storage (fallback)
function saveCartToStorage(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
        return true;
    } catch (error) {
        console.error('❌ Error saving cart:', error);
        return false;
    }
}

// Update cart UI (fallback)
function updateCartUI() {
    // Update cart count in header
    const cart = getCartFromStorage();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    document.querySelectorAll('.cart-count').forEach(element => {
        element.textContent = totalItems;
        element.style.display = totalItems > 0 ? 'flex' : 'none';
    });
    
    // Update floating cart
    const floatingCount = document.getElementById('cart-floating-count');
    if (floatingCount) {
        floatingCount.textContent = totalItems;
        floatingCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Format price
function formatPrice(price) {
    if (!price || isNaN(price)) return '0₫';
    const numericPrice = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(numericPrice) + '₫';
}

// Update element text
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// Show cart notification
function showCartNotification(message, type = 'info') {
    const notification = document.getElementById('cart-notification');
    const messageElement = document.getElementById('cart-notification-message');
    
    if (notification && messageElement) {
        // Update notification type
        notification.style.borderLeftColor = type === 'error' ? '#f44336' : 
                                           type === 'success' ? '#4CAF50' : '#2196F3';
        
        // Update icon
        const icon = notification.querySelector('.cart-notification-icon i');
        if (icon) {
            icon.className = type === 'error' ? 'fas fa-exclamation-circle' :
                            type === 'success' ? 'fas fa-check-circle' :
                            'fas fa-info-circle';
        }
        
        // Update title
        const title = notification.querySelector('.cart-notification-title');
        if (title) {
            title.textContent = type === 'error' ? 'Có lỗi xảy ra' :
                              type === 'success' ? 'Thành công' : 'Thông báo';
        }
        
        messageElement.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Show cart error
function showCartError() {
    const cartItemsContainer = document.getElementById('cart-items');
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = `
            <div class="cart-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Không thể tải giỏ hàng</h3>
                <p>Đã xảy ra lỗi khi tải giỏ hàng. Vui lòng thử lại sau.</p>
                <button onclick="loadCartData()" class="btn btn-secondary">
                    <i class="fas fa-redo"></i> Thử lại
                </button>
            </div>
        `;
    }
}

// Setup event listeners
function setupCartPageListeners() {
    console.log('🔗 Setting up cart page listeners');
    
    // Apply discount code - chỉ gắn 1 lần
    const applyDiscountBtn = document.getElementById('apply-discount');
    const discountInput = document.getElementById('discount-code');
    
    if (applyDiscountBtn && !applyDiscountBtn.dataset.listenerAttached) {
        applyDiscountBtn.dataset.listenerAttached = 'true';
        applyDiscountBtn.addEventListener('click', function() {
            const code = discountInput.value.trim();
            if (!code) {
                showCartNotification('Vui lòng nhập mã giảm giá', 'error');
                return;
            }
            showCartNotification(`Đã áp dụng mã: ${code}`, 'success');
            discountInput.value = '';
        });
        
        discountInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') applyDiscountBtn.click();
        });
    }
    
    // Checkout button - chỉ gắn 1 lần
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn && !checkoutBtn.dataset.listenerAttached) {
        checkoutBtn.dataset.listenerAttached = 'true';
        checkoutBtn.addEventListener('click', function() {
            const cart = window.CartCommon ? window.CartCommon.getCart() : getCartFromStorage();
            if (cart.length === 0) {
                showCartNotification('Giỏ hàng trống', 'error');
                return;
            }
            localStorage.setItem('checkoutCart', JSON.stringify(cart));
            window.location.href = '/html/checkout.html';
        });
    }
    
    // Cart icon - chỉ gắn 1 lần
    const headerCartIcon = document.getElementById('header-cart-icon');
    if (headerCartIcon && !headerCartIcon.dataset.listenerAttached) {
        headerCartIcon.dataset.listenerAttached = 'true';
        headerCartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/html/cart.html';
        });
    }
    
    // Setup quantity buttons sau khi render cart items
    setupQuantityButtons();
}

function setupQuantityButtons() {
    console.log('🔗 Setting up quantity buttons');
    
    // Remove existing listeners bằng cách thay thế elements
    document.querySelectorAll('.cart-item').forEach(item => {
        const minusBtn = item.querySelector('.quantity-btn.minus');
        const plusBtn = item.querySelector('.quantity-btn.plus');
        const input = item.querySelector('.quantity-input');
        
        if (minusBtn && !minusBtn.dataset.listenerAttached) {
            const index = parseInt(item.dataset.index);
            
            // Clone và replace để remove old listeners
            const newMinusBtn = minusBtn.cloneNode(true);
            const newPlusBtn = plusBtn.cloneNode(true);
            const newInput = input.cloneNode(true);
            
            minusBtn.parentNode.replaceChild(newMinusBtn, minusBtn);
            plusBtn.parentNode.replaceChild(newPlusBtn, plusBtn);
            input.parentNode.replaceChild(newInput, input);
            
            // Add new listeners
            newMinusBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log(`➖ Minus clicked for index ${index}`);
                updateQuantity(index, -1);
            });
            
            newPlusBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log(`➕ Plus clicked for index ${index}`);
                updateQuantity(index, 1);
            });
            
            newInput.addEventListener('change', function(e) {
                e.stopPropagation();
                e.preventDefault();
                updateQuantityInput(index, this.value);
            });
            
            // Mark as attached
            newMinusBtn.dataset.listenerAttached = 'true';
            newPlusBtn.dataset.listenerAttached = 'true';
            newInput.dataset.listenerAttached = 'true';
        }
    });
}

// Load related products for cart page
function loadCartRelatedProducts() {
    const relatedContainer = document.getElementById('related-products');
    if (!relatedContainer) return;
    
    // Show loading
    relatedContainer.innerHTML = `
        <div class="cart-loading">
            <div class="spinner"></div>
            <p>Đang tải sản phẩm...</p>
        </div>
    `;
    
    // Simulate API call (replace with actual API)
    setTimeout(() => {
        // Example related products
        const relatedProducts = [
            {
                id: 101,
                name: 'Áo đấu Manchester United 2023/24',
                price: 850000,
                discount: 10,
                image: '/image/clothes/1.jpg',
                stock: 15
            },
            {
                id: 102,
                name: 'Giày đá bóng Adidas Predator',
                price: 1200000,
                discount: 20,
                image: '/image/shoes/1.jpg',
                stock: 10
            },
            {
                id: 103,
                name: 'Bóng đá Euro 2024 chính thức',
                price: 800000,
                discount: 0,
                image: '/image/accessories/1.jpg',
                stock: 25
            },
            {
                id: 104,
                name: 'Găng tay thủ môn Adidas',
                price: 650000,
                discount: 15,
                image: '/image/gloves/1.jpg',
                stock: 14
            }
        ];
        
        renderRelatedProducts(relatedProducts);
    }, 1000);
}

// Render related products
function renderRelatedProducts(products) {
    const relatedContainer = document.getElementById('related-products');
    if (!relatedContainer) return;
    
    if (products.length === 0) {
        relatedContainer.innerHTML = `
            <div class="cart-empty">
                <p>Không có sản phẩm liên quan</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        const finalPrice = product.discount > 0 ? 
            Math.round(product.price * (100 - product.discount) / 100) : product.price;
        
        html += `
            <div class="related-product-card">
                <a href="/html/product-detail.html?id=${product.id}">
                    <div class="related-product-image">
                        <img src="${product.image || '/image/clothes/1.jpg'}" 
                             alt="${product.name}"
                             onerror="this.src='/image/clothes/1.jpg'">
                        ${product.discount > 0 ? `
                            <div class="related-product-discount">-${product.discount}%</div>
                        ` : ''}
                    </div>
                    <div class="related-product-info">
                        <h3 class="related-product-title">${product.name}</h3>
                        <div class="related-product-price">
                            <span class="related-product-current-price">${formatPrice(finalPrice)}</span>
                            ${product.discount > 0 ? `
                                <span class="related-product-original-price">${formatPrice(product.price)}</span>
                            ` : ''}
                        </div>
                        <div class="related-product-stock ${product.stock > 0 ? 'in-stock' : 'out-stock'}">
                            ${product.stock > 0 ? `Còn ${product.stock} sp` : 'Hết hàng'}
                        </div>
                    </div>
                </a>
            </div>
        `;
    });
    
    relatedContainer.innerHTML = html;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeCartPage);

// Export functions
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;

// Initialize
document.addEventListener('DOMContentLoaded', initializeCartPage);