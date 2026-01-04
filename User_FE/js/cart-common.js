// ========== CART COMMON JS ==========
// File quản lý giỏ hàng cho toàn bộ website

// ========== CONFIGURATION ==========
const CART_STORAGE_KEY = 'cart';
const CART_NOTIFICATION_DURATION = 3000;

// ========== CORE CART FUNCTIONS ==========
function getCart() {
    try {
        const cartData = localStorage.getItem(CART_STORAGE_KEY);
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        console.error('❌ Lỗi đọc giỏ hàng:', error);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        return true;
    } catch (error) {
        console.error('❌ Lỗi lưu giỏ hàng:', error);
        return false;
    }
}

function getTotalCartItems() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return total + (price * quantity);
    }, 0);
}

function formatPrice(price) {
    if (!price || isNaN(price)) return '0₫';
    return new Intl.NumberFormat('vi-VN').format(parseFloat(price)) + '₫';
}

// ========== CART OPERATIONS ==========
function addToCart(product) {
    try {
        const cart = getCart();
        const existingIndex = cart.findIndex(item => 
            item.id == product.id && item.size === (product.size || null)
        );

        if (existingIndex !== -1) {
            cart[existingIndex].quantity += product.quantity || 1;
            showCartNotification('Đã cập nhật giỏ hàng', product.name, product.size, 'info');
        } else {
            cart.push({
                ...product,
                quantity: product.quantity || 1,
                addedAt: new Date().toISOString()
            });
            showCartNotification('Đã thêm vào giỏ hàng', product.name, product.size, 'success');
        }

        saveCart(cart);
        updateCartUI();
        return true;
    } catch (error) {
        console.error('❌ Lỗi thêm vào giỏ:', error);
        showCartNotification('Lỗi thêm vào giỏ hàng', '', '', 'error');
        return false;
    }
}

function updateCartItem(index, change) {
    console.log(`🔄 updateCartItem: index=${index}, change=${change}`);
    
    try {
        const cart = getCart();
        
        if (index >= 0 && index < cart.length) {
            const currentQuantity = parseInt(cart[index].quantity) || 1;
            const newQuantity = currentQuantity + change;
            
            console.log(`📦 Cart update: ${currentQuantity} → ${newQuantity} (change: ${change})`);
            
            if (newQuantity <= 0) {
                // Xóa sản phẩm
                cart.splice(index, 1);
                console.log(`🗑️ Removed item at index ${index}`);
            } else {
                // Cập nhật số lượng
                cart[index].quantity = newQuantity;
                console.log(`📦 Updated item ${index} quantity to ${newQuantity}`);
            }
            
            saveCart(cart);
            updateCartUI();
            return true;
        }
        
        console.error(`❌ Invalid index: ${index}`);
        return false;
    } catch (error) {
        console.error('❌ Error updating cart item:', error);
        return false;
    }
}

function removeCartItem(index) {
    if (!confirm('Xóa sản phẩm khỏi giỏ hàng?')) return false;
    
    try {
        const cart = getCart();
        if (!cart[index]) return false;

        const productName = cart[index].name || 'Sản phẩm';
        cart.splice(index, 1);
        saveCart(cart);
        
        updateCartUI();
        showCartNotification(`Đã xóa "${productName}"`, '', '', 'info');
        return true;
    } catch (error) {
        console.error('❌ Lỗi xóa:', error);
        return false;
    }
}

function clearCart() {
    try {
        localStorage.removeItem(CART_STORAGE_KEY);
        updateCartUI();
        showCartNotification('Đã xóa giỏ hàng', '', '', 'info');
        return true;
    } catch (error) {
        console.error('❌ Error clearing cart:', error);
        return false;
    }
}

// ========== UI UPDATES ==========
function updateCartUI() {
    updateCartCount();
    updateFloatingCart();
    updateMiniCart();
}

function updateCartCount() {
    const totalItems = getTotalCartItems();
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

function updateFloatingCart() {
    const floatingCount = document.getElementById('cart-floating-count');
    if (floatingCount) {
        const totalItems = getTotalCartItems();
        floatingCount.textContent = totalItems;
        floatingCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// ========== MINI CART ==========
function updateMiniCart() {
    const miniCartItems = document.getElementById('mini-cart-items');
    const miniCartTotal = document.getElementById('mini-cart-total');
    if (!miniCartItems) return;

    const cart = getCart();
    
    if (cart.length === 0) {
        miniCartItems.innerHTML = `
            <div class="mini-cart-empty">
                <i class="fas fa-shopping-cart"></i>
                <p>Giỏ hàng trống</p>
                <small>Thêm sản phẩm để bắt đầu mua sắm</small>
            </div>
        `;
        if (miniCartTotal) miniCartTotal.textContent = '0₫';
        return;
    }

    let html = '';
    let totalAmount = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        totalAmount += itemTotal;
        
        html += `
            <div class="mini-cart-item" data-index="${index}">
                <div class="mini-cart-item-image">
                    <img src="${item.image || '/image/clothes/1.jpg'}" 
                         alt="${item.name}"
                         onerror="this.src='/image/clothes/1.jpg'">
                </div>
                <div class="mini-cart-item-info">
                    <div class="mini-cart-item-title">${item.name}</div>
                    ${item.size ? `<div class="mini-cart-item-size">Size: ${item.size}</div>` : ''}
                    <div class="mini-cart-item-details">
                        <div class="mini-cart-item-price">${formatPrice(item.price || 0)}</div>
                        <div class="mini-cart-item-quantity">
                            <button class="mini-cart-item-qty-btn minus" onclick="updateCartItem(${index}, -1)">-</button>
                            <span class="mini-cart-item-qty">${item.quantity || 1}</span>
                            <button class="mini-cart-item-qty-btn plus" onclick="updateCartItem(${index}, 1)">+</button>
                        </div>
                    </div>
                </div>
                <button class="mini-cart-item-remove" onclick="removeCartItem(${index})" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    miniCartItems.innerHTML = html;
    if (miniCartTotal) miniCartTotal.textContent = formatPrice(totalAmount);
}

function toggleMiniCart() {
    const miniCart = document.getElementById('mini-cart-popup');
    const floatingCartBtn = document.getElementById('cart-floating-btn');
    if (!miniCart) return;

    const backdrop = document.getElementById('mini-cart-backdrop') || 
                     document.createElement('div');
    backdrop.id = 'mini-cart-backdrop';
    backdrop.className = 'mini-cart-backdrop';

    if (miniCart.classList.contains('show')) {
        closeMiniCart();
    } else {
        // ẨN floating cart button
        if (floatingCartBtn) {
            floatingCartBtn.style.display = 'none';
        }
        
        updateMiniCart();
        miniCart.classList.add('show');
        document.body.appendChild(backdrop);
        backdrop.classList.add('show');
        backdrop.addEventListener('click', closeMiniCart);
        document.body.style.overflow = 'hidden';
    }
}

function closeMiniCart() {
    const miniCart = document.getElementById('mini-cart-popup');
    const backdrop = document.getElementById('mini-cart-backdrop');
    const floatingCartBtn = document.getElementById('cart-floating-btn');
    
    if (miniCart) miniCart.classList.remove('show');
    if (backdrop) {
        backdrop.classList.remove('show');
        setTimeout(() => backdrop.remove(), 300);
    }
    
    // HIỆN LẠI floating cart button sau khi đóng
    if (floatingCartBtn) {
        floatingCartBtn.style.display = 'flex';
    }
    
    document.body.style.overflow = '';
}

// ========== NOTIFICATION ==========
function showCartNotification(title, productName, size = null, type = 'success') {
    const notification = document.getElementById('cart-notification');
    const messageElement = document.getElementById('cart-notification-message');
    if (!notification || !messageElement) return;

    let message = productName;
    if (size) message += ` (Size: ${size})`;
    
    messageElement.textContent = message;
    
    // Update icon và màu
    const icon = notification.querySelector('.cart-notification-icon i');
    if (icon) {
        icon.className = type === 'error' ? 'fas fa-exclamation-circle' :
                        type === 'info' ? 'fas fa-info-circle' :
                        'fas fa-check-circle';
    }
    
    notification.style.borderLeftColor = type === 'error' ? '#f44336' :
                                       type === 'info' ? '#2196F3' : '#4CAF50';
    
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), CART_NOTIFICATION_DURATION);
}

// ========== EVENT LISTENERS SETUP ==========
function setupHeaderCart() {
    const headerCartIcon = document.getElementById('header-cart-icon');
    if (headerCartIcon) {
        headerCartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/html/cart.html';
        });
    }
}

function setupFloatingCart() {
    const floatingBtn = document.getElementById('cart-floating-btn');
    if (floatingBtn) {
        floatingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMiniCart(); // Mở popup thay vì redirect
        });
    }
}

function setupMiniCartEvents() {
    const closeBtn = document.getElementById('close-mini-cart');
    if (closeBtn) closeBtn.addEventListener('click', closeMiniCart);

    // Click ra ngoài để đóng
    document.addEventListener('click', (e) => {
        const miniCart = document.getElementById('mini-cart-popup');
        const floatingBtn = document.getElementById('cart-floating-btn');
        if (miniCart && miniCart.classList.contains('show') && 
            !miniCart.contains(e.target) && 
            !floatingBtn.contains(e.target)) {
            closeMiniCart();
        }
    });
}

function setupCartNotification() {
    const closeBtn = document.getElementById('cart-notification-close');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        document.getElementById('cart-notification').classList.remove('show');
    });
}

// ========== INITIALIZATION ==========
function initializeCart() {
    console.log('🛒 Khởi tạo giỏ hàng...');
    
    setupHeaderCart();
    setupFloatingCart();
    setupMiniCartEvents();
    setupCartNotification();
    updateCartUI();
    
    // Theo dõi thay đổi từ tab khác
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) updateCartUI();
    });
}

// ========== GLOBAL EXPORTS ==========
window.CartCommon = {
    getCart,
    saveCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    getTotalCartItems,
    getCartTotal,
    updateCartUI,
    toggleMiniCart,
    closeMiniCart,
    formatPrice,
    showCartNotification
};

// Shortcuts global
window.addToCart = addToCart;
window.CartCommon.updateCartItem = updateCartItem;
window.CartCommon.clearCart = clearCart;
window.removeCartItem = removeCartItem;
window.toggleMiniCart = toggleMiniCart;
window.closeMiniCart = closeMiniCart;

// Khởi chạy
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
} else {
    initializeCart();
}