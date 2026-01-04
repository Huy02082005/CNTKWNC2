// ========== CHECKOUT PAGE FUNCTIONS ==========

// Khởi tạo trang thanh toán
function initializeCheckout() {
    console.log('💳 Initializing checkout page...');
    
    // Load cart data
    loadCheckoutData();
    
    // Setup event listeners
    setupCheckoutListeners();
    
    // Initialize form validation
    initializeFormValidation();
    
    // Check if cart is empty
    checkEmptyCart();
}

// Load cart data và hiển thị
function loadCheckoutData() {
    console.log('📦 Loading checkout data...');
    
    // Lấy dữ liệu từ localStorage
    let cart = [];
    
    // Thử lấy từ direct checkout trước (mua ngay)
    const directCheckoutItem = localStorage.getItem('checkoutItem');
    if (directCheckoutItem) {
        try {
            const item = JSON.parse(directCheckoutItem);
            cart = [item];
            console.log('🛒 Using direct checkout item:', item);
        } catch (e) {
            console.error('❌ Error parsing direct checkout item:', e);
        }
    }
    
    // Nếu không có direct checkout, lấy từ giỏ hàng
    if (cart.length === 0) {
        cart = window.CartCommon ? window.CartCommon.getCart() : getCartFromStorage();
    }
    
    // Hiển thị items
    renderCheckoutItems(cart);
    
    // Tính toán tổng tiền
    calculateOrderTotals(cart);
}

// Hiển thị items trong phần order summary
function renderCheckoutItems(cart) {
    const checkoutItems = document.getElementById('checkout-items');
    if (!checkoutItems) return;
    
    console.log('🛒 Rendering checkout items:', cart); // Debug log
    
    if (cart.length === 0) {
        checkoutItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Giỏ hàng trống</p>
                <a href="/html/see_all.html" class="btn-secondary">Mua sắm ngay</a>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    cart.forEach((item, index) => {
        console.log(`📦 Item ${index}:`, item); // Debug log
        
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 1;
        const itemTotal = itemPrice * itemQuantity;
        const itemName = item.name || item.productName || 'Sản phẩm không tên';
        
        html += `
            <div class="checkout-item">
                <div class="checkout-item-image">
                    <img src="${item.image || '/image/clothes/1.jpg'}" 
                         alt="${itemName}"
                         onerror="this.src='/image/clothes/1.jpg'">
                </div>
                <div class="checkout-item-info">
                    <div class="checkout-item-title">${itemName}</div>
                    <div class="checkout-item-meta">
                        ${item.size ? `<span class="checkout-item-size">Size: ${item.size}</span>` : ''}
                    </div>
                    <div class="checkout-item-details">
                        <div class="checkout-item-price">${formatPrice(itemPrice)}</div>
                        <div class="checkout-item-quantity">× ${itemQuantity}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    checkoutItems.innerHTML = html;
    console.log('✅ Checkout items rendered');
}

// Tính toán tổng tiền
function calculateOrderTotals(cart) {
    if (cart.length === 0) {
        updateTotals(0, 0, 0, 0);
        return;
    }
    
    // Tính tổng tiền sản phẩm
    const subtotal = cart.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return total + (price * quantity);
    }, 0);
    
    // Tính phí vận chuyển (miễn phí trên 500k)
    const shipping = subtotal >= 500000 ? 0 : 30000;
    
    // Giảm giá (có thể thêm logic mã giảm giá sau)
    const discount = 0;
    
    // Tổng cộng
    const total = subtotal + shipping - discount;
    
    // Cập nhật DOM
    updateTotals(subtotal, shipping, discount, total);
    
    // Kích hoạt nút đặt hàng nếu có sản phẩm
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (placeOrderBtn) {
        placeOrderBtn.disabled = cart.length === 0;
    }
}

// Cập nhật hiển thị tổng tiền
function updateTotals(subtotal, shipping, discount, total) {
    const elements = {
        subtotal: document.getElementById('subtotal'),
        shipping: document.getElementById('shipping'),
        discount: document.getElementById('discount'),
        'grand-total': document.getElementById('grand-total')
    };
    
    if (elements.subtotal) elements.subtotal.textContent = formatPrice(subtotal);
    if (elements.shipping) elements.shipping.textContent = shipping === 0 ? 'Miễn phí' : formatPrice(shipping);
    if (elements.discount) elements.discount.textContent = `-${formatPrice(discount)}`;
    if (elements['grand-total']) elements['grand-total'].textContent = formatPrice(total);
}

// Format price
function formatPrice(price) {
    if (!price || isNaN(price)) return '0₫';
    const numericPrice = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(numericPrice) + '₫';
}

// Setup event listeners
function setupCheckoutListeners() {
    console.log('🔗 Setting up checkout listeners');
    
    // Payment method selection
    setupPaymentMethods();
    
    // Discount code
    setupDiscountCode();
    
    // Place order button
    setupPlaceOrderButton();
    
    // Form validation
    setupFormValidation();
    
    // City/District selection
    setupCityDistrict();
}

// Setup payment methods
function setupPaymentMethods() {
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const bankingInfo = document.getElementById('banking-info');
    
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.value === 'banking' && bankingInfo) {
                bankingInfo.classList.add('show');
            } else if (bankingInfo) {
                bankingInfo.classList.remove('show');
            }
        });
    });
}

// Setup discount code
function setupDiscountCode() {
    const applyBtn = document.getElementById('apply-checkout-discount');
    const discountInput = document.getElementById('checkout-discount-code');
    
    if (applyBtn && discountInput) {
        applyBtn.addEventListener('click', function() {
            const code = discountInput.value.trim();
            
            if (!code) {
                showCheckoutNotification('Vui lòng nhập mã giảm giá', 'error');
                return;
            }
            
            // Simulate discount application
            // In real app, call API to validate discount code
            const discount = 50000; // Example: 50,000đ discount
            
            showCheckoutNotification(`Đã áp dụng mã giảm giá: ${code}`, 'success');
            discountInput.value = '';
            
            // Update totals with discount
            updateDiscount(discount);
        });
    }
}

// Update discount
function updateDiscount(discount) {
    const discountElement = document.getElementById('discount');
    const grandTotalElement = document.getElementById('grand-total');
    
    if (discountElement && grandTotalElement) {
        discountElement.textContent = `-${formatPrice(discount)}`;
        
        // Recalculate grand total
        const subtotalText = document.getElementById('subtotal').textContent;
        const shippingText = document.getElementById('shipping').textContent;
        
        const subtotal = parseFloat(subtotalText.replace(/[^\d]/g, '')) || 0;
        const shipping = shippingText === 'Miễn phí' ? 0 : 
                        parseFloat(shippingText.replace(/[^\d]/g, '')) || 0;
        
        const total = subtotal + shipping - discount;
        grandTotalElement.textContent = formatPrice(total);
    }
}

// Setup place order button
function setupPlaceOrderButton() {
    const placeOrderBtn = document.getElementById('place-order-btn');
    const agreeTerms = document.getElementById('agree-terms');
    
    if (placeOrderBtn && agreeTerms) {
        // Check terms agreement
        agreeTerms.addEventListener('change', function() {
            placeOrderBtn.disabled = !this.checked;
        });
        
        // Place order
        placeOrderBtn.addEventListener('click', function() {
            if (placeOrderBtn.disabled) return;
            
            // Validate form
            if (!validateCheckoutForm()) {
                showCheckoutNotification('Vui lòng kiểm tra lại thông tin', 'error');
                return;
            }
            
            // Disable button during processing
            placeOrderBtn.disabled = true;
            placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
            
            // Simulate order processing
            setTimeout(() => {
                processOrder();
            }, 1500);
        });
    }
}

// Validate checkout form
function validateCheckoutForm() {
    const requiredFields = ['fullname', 'phone', 'email', 'address', 'city', 'district'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.style.borderColor = '#f44336';
            isValid = false;
        } else if (field) {
            field.style.borderColor = '#ddd';
        }
    });
    
    // Validate email format
    const emailField = document.getElementById('email');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            emailField.style.borderColor = '#f44336';
            isValid = false;
            showCheckoutNotification('Email không hợp lệ', 'error');
        }
    }
    
    // Validate phone number
    const phoneField = document.getElementById('phone');
    if (phoneField && phoneField.value) {
        const phoneRegex = /^[0-9]{10,11}$/;
        const phoneDigits = phoneField.value.replace(/[^\d]/g, '');
        if (!phoneRegex.test(phoneDigits)) {
            phoneField.style.borderColor = '#f44336';
            isValid = false;
            showCheckoutNotification('Số điện thoại không hợp lệ', 'error');
        }
    }
    
    return isValid;
}

// Setup form validation
function setupFormValidation() {
    const formFields = document.querySelectorAll('#shipping-form input, #shipping-form select');
    
    formFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#4CAF50';
            } else {
                this.style.borderColor = '#ddd';
            }
        });
        
        field.addEventListener('input', function() {
            this.style.borderColor = '#ddd';
        });
    });
}

// Setup city/district selection
function setupCityDistrict() {
    const citySelect = document.getElementById('city');
    const districtSelect = document.getElementById('district');
    
    if (citySelect && districtSelect) {
        const districts = {
            hanoi: ['Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa', 'Cầu Giấy', 'Thanh Xuân', 'Hoàng Mai'],
            hcm: ['Quận 1', 'Quận 3', 'Quận 5', 'Quận 10', 'Tân Bình', 'Tân Phú', 'Bình Thạnh'],
            danang: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu'],
            haiphong: ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An'],
            cantho: ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt']
        };
        
        citySelect.addEventListener('change', function() {
            const selectedCity = this.value;
            districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
            
            if (selectedCity && districts[selectedCity]) {
                districts[selectedCity].forEach(district => {
                    const option = document.createElement('option');
                    option.value = district.toLowerCase().replace(/\s+/g, '_');
                    option.textContent = district;
                    districtSelect.appendChild(option);
                });
            }
        });
    }
}

// Process order
 // Process order - SEND TO API
async function processOrder() {
    console.log('✅ Processing order...');
    
    const placeOrderBtn = document.getElementById('place-order-btn');
    if (!placeOrderBtn) {
        console.error('❌ Place order button not found');
        return;
    }
    
    // Disable button during processing
    const originalBtnText = placeOrderBtn.innerHTML;
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    
    try {
        // 1. Validate form
        if (!validateCheckoutForm()) {
            throw new Error('Vui lòng kiểm tra lại thông tin');
        }
        
        // 2. Check terms agreement
        const agreeTerms = document.getElementById('agree-terms');
        if (!agreeTerms || !agreeTerms.checked) {
            throw new Error('Vui lòng đồng ý với điều khoản và điều kiện');
        }
        
        // 3. Get cart data
        let cart = [];
        const directCheckoutItem = localStorage.getItem('checkoutItem');
        
        if (directCheckoutItem) {
            try {
                const item = JSON.parse(directCheckoutItem);
                cart = [item];
                console.log('🛒 Using direct checkout item:', item);
            } catch (e) {
                console.error('❌ Error parsing direct checkout:', e);
            }
        }
        
        if (cart.length === 0) {
            cart = window.CartCommon ? window.CartCommon.getCart() : getCartFromStorage();
        }
        
        if (cart.length === 0) {
            throw new Error('Giỏ hàng trống');
        }
        
        console.log('📦 Cart items:', cart);
        
        // 4. Prepare items for API
        const orderItems = cart.map(item => ({
            productId: item.id || item.productId,
            name: item.name || item.productName,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            sizeId: item.sizeId || null,
            size: item.size,
            image: item.image,
            discount: item.discount || 0
        }));
        
        // 5. Get form data
        const formData = {
            customer: {
                fullname: document.getElementById('fullname').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                address: document.getElementById('address').value.trim(),
                city: document.getElementById('city').value,
                district: document.getElementById('district').value,
                note: document.getElementById('note').value.trim() || ''
            },
            payment: document.querySelector('input[name="payment"]:checked')?.value || 'cod',
            items: orderItems,
            totals: {
                subtotal: parseFloat(document.getElementById('subtotal').textContent.replace(/[^\d]/g, '')) || 0,
                shipping: document.getElementById('shipping').textContent === 'Miễn phí' ? 0 : 
                         parseFloat(document.getElementById('shipping').textContent.replace(/[^\d]/g, '')) || 0,
                discount: parseFloat(document.getElementById('discount').textContent.replace(/[^\d]/g, '')) || 0,
                total: parseFloat(document.getElementById('grand-total').textContent.replace(/[^\d]/g, '')) || 0
            }
        };
        
        console.log('📤 Sending order to API:', formData);
        
        // 6. Send to API - KIỂM TRA ENDPOINT ĐÚNG
        const apiEndpoint = '/api/order/create'; // Hoặc '/order/create'
        console.log('🌐 API Endpoint:', apiEndpoint);
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📥 Response status:', response.status);
        
        const result = await response.json();
        console.log('📦 Response data:', result);
        
        if (!response.ok) {
            throw new Error(result.message || `Lỗi ${response.status}: ${response.statusText}`);
        }
        
        if (!result.success) {
            throw new Error(result.message || 'Đặt hàng thất bại');
        }
        
        console.log('✅ Order created successfully:', result);
        
        // 7. Clear cart and checkout data
        clearCartAfterOrder();
        
        // 8. Show success modal with real order ID
        showSuccessModal(result.orderId || result.data?.orderId);
        
    } catch (error) {
        console.error('❌ Order processing error:', error);
        
        // Show error notification
        showCheckoutNotification(`Lỗi: ${error.message}`, 'error');
        
        // Re-enable button
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalBtnText;
    }
}

// Helper function to clear cart after order
function clearCartAfterOrder() {
    // Clear localStorage cart
    localStorage.removeItem('cart');
    localStorage.removeItem('checkoutItem');
    localStorage.removeItem('checkoutCart');
    
    // Clear cart module if exists
    if (window.CartCommon && window.CartCommon.clearCart) {
        window.CartCommon.clearCart();
    }
    
    // Update cart count
    updateCartCount(0);
}

// Update cart count display
function updateCartCount(count) {
    const cartCountElements = [
        document.querySelector('.cart-count'),
        document.querySelector('.cart-floating-count'),
        document.getElementById('cart-floating-count')
    ];
    
    cartCountElements.forEach(element => {
        if (element) {
            element.textContent = count;
            element.style.display = count > 0 ? 'flex' : 'none';
        }
    });
}

// Save order to localStorage
function saveOrder(order) {
    try {
        // Get existing orders
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        
        // Add new order
        orders.push(order);
        
        // Save back
        localStorage.setItem('orders', JSON.stringify(orders));
        
        console.log('💾 Order saved:', order.id);
        return true;
    } catch (error) {
        console.error('❌ Error saving order:', error);
        return false;
    }
}

// Show success modal
function showSuccessModal(orderId) {
    console.log(`🎉 Order success: ${orderId}`);
    
    const modal = document.getElementById('success-modal');
    const orderIdElement = document.getElementById('order-id');
    
    if (modal && orderIdElement) {
        orderIdElement.innerHTML = `Mã đơn hàng: <strong>#${orderId}</strong>`;
        modal.classList.add('show');
        
        // Auto close after 10 seconds
        setTimeout(() => {
            modal.classList.remove('show');
            window.location.href = '/html/home.html';
        }, 10000);
    } else {
        // Nếu không có modal, hiển thị alert
        alert(`✅ Đặt hàng thành công!\nMã đơn hàng: #${orderId}\nCảm ơn bạn đã đặt hàng!`);
        window.location.href = '/html/home.html';
    }
}

// Show checkout notification
function showCheckoutNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Hiển thị alert đơn giản
    if (type === 'error') {
        alert(`❌ ${message}`);
    } else if (type === 'success') {
        alert(`✅ ${message}`);
    } else {
        alert(`ℹ️ ${message}`);
    }
    
    // Hoặc sử dụng notification element nếu có
    const notification = document.getElementById('cart-notification');
    if (notification) {
        const messageElement = document.getElementById('cart-notification-message');
        if (messageElement) {
            messageElement.textContent = message;
            
            // Update type
            const icon = notification.querySelector('.cart-notification-icon i');
            if (icon) {
                icon.className = type === 'error' ? 'fas fa-exclamation-circle' :
                               type === 'success' ? 'fas fa-check-circle' :
                               'fas fa-info-circle';
            }
            
            notification.style.borderLeftColor = type === 'error' ? '#f44336' :
                                              type === 'success' ? '#4CAF50' :
                                              '#2196F3';
            
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 5000);
        }
    }
}

// Check if cart is empty
function checkEmptyCart() {
    const cart = window.CartCommon ? window.CartCommon.getCart() : getCartFromStorage();
    const directCheckoutItem = localStorage.getItem('checkoutItem');
    
    if (cart.length === 0 && !directCheckoutItem) {
        showCheckoutNotification('Giỏ hàng trống, vui lòng thêm sản phẩm', 'error');
        setTimeout(() => {
            window.location.href = '/html/cart.html';
        }, 2000);
    }
}

// Get cart from storage (fallback)
function getCartFromStorage() {
    try {
        const cartData = localStorage.getItem('cart');
        return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
        console.error('❌ Error reading cart:', error);
        return [];
    }
}

// Initialize form validation
function initializeFormValidation() {
    console.log('📋 Initializing form validation');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeCheckout);