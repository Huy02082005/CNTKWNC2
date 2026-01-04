// ========== CONFIG ==========
const API_BASE_URL = 'http://localhost:3000/api';

// ========== UTILITY FUNCTIONS ==========

function setupDOMMutationObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                console.log('🔍 DOM changed:', mutation.target.nodeName);
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('👀 DOM MutationObserver setup');
}

// Format price
function formatPrice(price) {
    if (!price || isNaN(price)) return '0₫';
    const numericPrice = parseFloat(price);
    return new Intl.NumberFormat('vi-VN').format(numericPrice) + '₫';
}

// ========== SIZE HANDLING - NEW ==========

// Hiển thị options size cho sản phẩm
// ========== SIZE HANDLING ==========

function initializeSizeOptions(product) {
    console.log('👕 DEBUG initializeSizeOptions called with product:', {
        id: product.ProductID,
        name: product.ProductName,
        categoryId: product.CategoryID,
        categoryName: product.CategoryName,
        stock: product.StockQuantity
    });
    
    const sizeSection = document.getElementById('size-section');
    const sizeOptionsContainer = document.getElementById('size-options');
    
    console.log('👕 DEBUG Elements found:', {
        sizeSection: !!sizeSection,
        sizeOptionsContainer: !!sizeOptionsContainer,
        sizeSectionDisplay: sizeSection ? sizeSection.style.display : 'not found'
    });
    
    if (!sizeSection || !sizeOptionsContainer) {
        console.error('❌ Size section elements not found');
        return;
    }
    
    // Kiểm tra nếu sản phẩm có size (quần áo, giày, áo khoác, găng tay)
    const hasSize = product.CategoryID === 1 || product.CategoryID === 2 || product.CategoryID === 4 || product.CategoryID === 5;
    
    console.log('👕 DEBUG Size check:', {
        categoryId: product.CategoryID,
        hasSize: hasSize,
        displayShouldBe: hasSize ? 'block' : 'none'
    });
    
    if (!hasSize) {
        console.log('📦 Product does not require size selection, hiding section');
        sizeSection.style.display = 'none';
        return;
    }
    
    // HIỂN THỊ SECTION CHỌN SIZE BẰNG MỌI GIÁ
    sizeSection.style.display = 'block';
    sizeSection.style.backgroundColor = '#fff3e0'; // Màu vàng để dễ nhận biết
    sizeSection.style.border = '2px solid #ff9800';
    sizeSection.style.padding = '20px';
    
    console.log('✅ Size section should be visible now');
    
    // Tạo options size mặc định theo category
    const defaultSizes = getDefaultSizesByCategory(product.CategoryID);
    
    console.log('👕 DEBUG Default sizes for category', product.CategoryID, ':', defaultSizes);
    
    // Xóa loading message
    sizeOptionsContainer.innerHTML = '';
    
    // Kiểm tra nếu có size nào còn hàng không
    const hasAvailableSizes = defaultSizes.some(size => size.stock > 0);
    
    if (!hasAvailableSizes) {
        sizeOptionsContainer.innerHTML = `
            <div class="no-sizes">
                <i class="fas fa-times-circle"></i>
                <span>Tất cả size đều hết hàng</span>
            </div>
        `;
        console.log('⚠️ All sizes out of stock');
        return;
    }
    
    // Tạo radio buttons cho từng size
    defaultSizes.forEach((size, index) => {
        const sizeOption = document.createElement('div');
        sizeOption.className = 'size-option';
        
        const inputId = `size-${size.value}`;
        const isInStock = size.stock > 0;
        
        if (!isInStock) {
            sizeOption.classList.add('disabled');
        }
        
        sizeOption.innerHTML = `
            <input type="radio" id="${inputId}" name="size" value="${size.value}" 
                   ${!isInStock ? 'disabled' : ''} ${index === 0 && isInStock ? 'checked' : ''}>
            <label for="${inputId}">
                ${size.label}
                ${size.stock > 0 ? `<span class="size-stock">Còn ${size.stock} sp</span>` : ''}
            </label>
            ${!isInStock ? '<span class="size-out">Hết</span>' : ''}
        `;
        
        sizeOptionsContainer.appendChild(sizeOption);
    });
    
    console.log(`✅ Created ${defaultSizes.length} size options`);
    
    // Thêm event listener cho các radio buttons
    document.querySelectorAll('input[name="size"]').forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('✅ Size selected:', this.value);
            updateSelectedSizeDisplay(this.value);
            updateActionButtons();
        });
    });
    
    // Tự động chọn size đầu tiên còn hàng
    const firstAvailableSize = defaultSizes.find(size => size.stock > 0);
    if (firstAvailableSize) {
        const firstRadio = document.getElementById(`size-${firstAvailableSize.value}`);
        if (firstRadio) {
            firstRadio.checked = true;
            updateSelectedSizeDisplay(firstAvailableSize.value);
            console.log('✅ Auto-selected first available size:', firstAvailableSize.value);
        }
    }
    
    // Cập nhật nút hành động ngay lập tức
    setTimeout(() => {
        updateActionButtons();
    }, 100);
}

// Cập nhật hiển thị size đã chọn
function updateSelectedSizeDisplay(selectedSize) {
    const sizeSelectedDiv = document.getElementById('size-selected');
    const selectedSizeText = document.getElementById('selected-size-text');
    const sizeWarningDiv = document.getElementById('size-warning');
    
    if (sizeSelectedDiv && selectedSizeText) {
        selectedSizeText.textContent = selectedSize;
        sizeSelectedDiv.classList.add('show');
        
        // Ẩn cảnh báo nếu có
        if (sizeWarningDiv) {
            sizeWarningDiv.classList.remove('show');
        }
    }
}

// Lấy danh sách size mặc định theo category - ĐÃ SỬA
function getDefaultSizesByCategory(categoryId) {
    // Áo đấu (CategoryID = 1)
    if (categoryId === 1) {
        return [
            { value: 'S', label: 'S', stock: 10 },
            { value: 'M', label: 'M', stock: 15 },
            { value: 'L', label: 'L', stock: 8 },
            { value: 'XL', label: 'XL', stock: 5 },
            { value: 'XXL', label: 'XXL', stock: 3 }
        ];
    }
    
    // Giày (CategoryID = 2)
    if (categoryId === 2) {
        return [
            { value: '39', label: '39', stock: 10 },
            { value: '40', label: '40', stock: 12 },
            { value: '41', label: '41', stock: 15 },
            { value: '42', label: '42', stock: 10 },
            { value: '43', label: '43', stock: 8 },
            { value: '44', label: '44', stock: 5 }
        ];
    }
    
    // Áo khoác (CategoryID = 4)
    if (categoryId === 4) {
        return [
            { value: 'S', label: 'S', stock: 8 },
            { value: 'M', label: 'M', stock: 12 },
            { value: 'L', label: 'L', stock: 10 },
            { value: 'XL', label: 'XL', stock: 6 }
        ];
    }
    
    // Găng tay thủ môn (CategoryID = 5)
    if (categoryId === 5) {
        return [
            { value: '8', label: 'Size 8', stock: 10 },
            { value: '9', label: 'Size 9', stock: 8 },
            { value: '10', label: 'Size 10', stock: 6 }
        ];
    }
    
    // Mặc định (phụ kiện không có size)
    return [
        { value: 'ONE_SIZE', label: 'One Size', stock: 10 }
    ];
}

// Kiểm tra xem có cần chọn size không
function requiresSizeSelection() {
    const sizeSection = document.getElementById('size-section');
    return sizeSection && sizeSection.style.display !== 'none';
}

// Lấy size đã chọn
function getSelectedSize() {
    const selectedRadio = document.querySelector('input[name="size"]:checked');
    return selectedRadio ? selectedRadio.value : null;
}

// Kiểm tra size hợp lệ - ĐÃ SỬA
function validateSizeSelection() {
    const sizeSection = document.getElementById('size-section');
    
    // Nếu không có section size hoặc đang ẩn, không cần validate
    if (!sizeSection || sizeSection.style.display === 'none') {
        return { 
            isValid: true, 
            message: '', 
            selectedSize: null 
        };
    }
    
    // Lấy size đã chọn
    const selectedRadio = document.querySelector('input[name="size"]:checked');
    
    // Nếu chưa chọn size
    if (!selectedRadio) {
        return { 
            isValid: false, 
            message: 'Vui lòng chọn size!', 
            selectedSize: null 
        };
    }
    
    // Kiểm tra size có bị disabled không (hết hàng)
    if (selectedRadio.disabled) {
        return { 
            isValid: false, 
            message: 'Size này đã hết hàng!', 
            selectedSize: selectedRadio.value 
        };
    }
    
    // Size hợp lệ
    return { 
        isValid: true, 
        message: '', 
        selectedSize: selectedRadio.value 
    };
}


// Cập nhật trạng thái nút hành động - ĐÃ SỬA
function updateActionButtons() {
    const quantityInput = document.getElementById('quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    const sizeWarningDiv = document.getElementById('size-warning');
    const sizeWarningText = document.getElementById('size-warning-text');
    
    if (!quantityInput || !addToCartBtn || !buyNowBtn || !minusBtn || !plusBtn) return;
    
    const quantity = parseInt(quantityInput.value) || 1;
    const max = parseInt(quantityInput.max) || 99;
    const min = 1;
    
    // Update minus/plus buttons
    minusBtn.disabled = quantity <= min;
    plusBtn.disabled = quantity >= max;
    
    // Kiểm tra size selection
    const sizeValidation = validateSizeSelection();
    
    // Hiển thị warning nếu có lỗi
    if (sizeWarningDiv && sizeWarningText) {
        if (!sizeValidation.isValid) {
            sizeWarningText.textContent = sizeValidation.message;
            sizeWarningDiv.classList.add('show');
        } else {
            sizeWarningDiv.classList.remove('show');
        }
    }
    
    // Nếu cần chọn size mà chưa chọn hoặc chọn size hết hàng
    if (!sizeValidation.isValid) {
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.title = sizeValidation.message;
        buyNowBtn.title = sizeValidation.message;
        return;
    }
    
    // Kiểm tra số lượng
    if (quantity > max) {
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.title = 'Số lượng vượt quá tồn kho';
        buyNowBtn.title = 'Số lượng vượt quá tồn kho';
    } else if (quantity < min) {
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.title = 'Số lượng tối thiểu là 1';
        buyNowBtn.title = 'Số lượng tối thiểu là 1';
    } else {
        addToCartBtn.disabled = false;
        buyNowBtn.disabled = false;
        addToCartBtn.title = '';
        buyNowBtn.title = '';
    }
}

function updateSizeWarning(message) {
    const sizeWarningDiv = document.getElementById('size-warning');
    const sizeWarningText = document.getElementById('size-warning-text');
    
    if (sizeWarningDiv && sizeWarningText) {
        if (message) {
            sizeWarningText.textContent = message;
            sizeWarningDiv.classList.add('show');
        } else {
            sizeWarningDiv.classList.remove('show');
        }
    }
}

// ========== IMAGE HANDLING ==========

function changeImage(src, clickedElement) {
    const mainImg = document.getElementById('main-img');
    if (!mainImg) return;
    
    mainImg.src = src;
    document.querySelectorAll('.thumbnail').forEach(img => {
        img.classList.remove('active');
    });
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
}

// ========== QUANTITY HANDLING ==========

function initializeQuantityControls() {
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    const quantityInput = document.getElementById('quantity');
    
    if (!minusBtn || !plusBtn || !quantityInput) return;
    
    // Minus button
    minusBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value) || 1;
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updateActionButtons();
        }
    });
    
    // Plus button
    plusBtn.addEventListener('click', function() {
        let currentValue = parseInt(quantityInput.value) || 1;
        const max = parseInt(quantityInput.max) || 99;
        if (currentValue < max) {
            quantityInput.value = currentValue + 1;
            updateActionButtons();
        }
    });
    
    // Input change
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

// Cập nhật trạng thái nút hành động - ĐÃ SỬA
function updateActionButtons() {
    const quantityInput = document.getElementById('quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const minusBtn = document.querySelector('.qty-btn.minus');
    const plusBtn = document.querySelector('.qty-btn.plus');
    
    if (!quantityInput || !addToCartBtn || !buyNowBtn) return;
    
    const quantity = parseInt(quantityInput.value) || 1;
    const max = parseInt(quantityInput.max) || 99;
    const min = 1;
    
    // Update minus/plus buttons
    if (minusBtn) minusBtn.disabled = quantity <= min;
    if (plusBtn) plusBtn.disabled = quantity >= max;
    
    // Kiểm tra size selection
    const sizeValidation = validateSizeSelection();
    
    // Hiển thị/ẩn cảnh báo size
    updateSizeWarning(sizeValidation.isValid ? '' : sizeValidation.message);
    
    // Nếu cần chọn size mà chưa chọn hoặc chọn size hết hàng
    if (!sizeValidation.isValid) {
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.title = sizeValidation.message;
        buyNowBtn.title = sizeValidation.message;
        return;
    }
    
    // Kiểm tra số lượng
    if (quantity > max) {
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.title = 'Số lượng vượt quá tồn kho';
        buyNowBtn.title = 'Số lượng vượt quá tồn kho';
    } else if (quantity < min) {
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.title = 'Số lượng tối thiểu là 1';
        buyNowBtn.title = 'Số lượng tối thiểu là 1';
    } else {
        addToCartBtn.disabled = false;
        buyNowBtn.disabled = false;
        addToCartBtn.title = '';
        buyNowBtn.title = '';
    }
}

// ========== TAB HANDLING ==========

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
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

// ========== CART AND CHECKOUT ==========

// Thêm vào giỏ hàng
function addToCart(productId) {
    console.log('🛒 addToCart called with productId:', productId);
    
    // Kiểm tra size
    const sizeValidation = validateSizeSelection();
    if (!sizeValidation.isValid) {
        showNotification(sizeValidation.message, 'error');
        console.log('❌ Size validation failed:', sizeValidation.message);
        return;
    }
    
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    console.log('📦 Quantity:', quantity);
    
    if (quantity <= 0) {
        showNotification('Số lượng không hợp lệ!', 'error');
        return;
    }
    
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const originalText = addToCartBtn ? addToCartBtn.innerHTML : '';
    
    if (addToCartBtn) {
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang thêm...';
    }
    
    try {
        const productName = document.getElementById('product-title') ? 
                           document.getElementById('product-title').textContent : 'Sản phẩm';
        const currentPrice = document.querySelector('.current-price, .final-price, .price');
        const price = currentPrice ? 
                     parseFloat(currentPrice.textContent.replace(/[^0-9]/g, '')) : 0;
        const imageUrl = document.getElementById('main-img') ? 
                        document.getElementById('main-img').src : '';
        
        console.log('📊 Product info:', { productName, price, imageUrl });
        
        addToCartLocalStorage({
            id: productId,
            name: productName,
            price: price,
            image: imageUrl,
            quantity: quantity,
            size: sizeValidation.selectedSize
        });
        
        showNotification(`Đã thêm "${productName}"${sizeValidation.selectedSize ? ` (Size: ${sizeValidation.selectedSize})` : ''} vào giỏ hàng!`, 'success');
        
    } catch (error) {
        console.error('❌ Error adding to cart:', error);
        showNotification('Lỗi khi thêm vào giỏ hàng!', 'error');
    } finally {
        // Restore button state
        setTimeout(() => {
            if (addToCartBtn) {
                addToCartBtn.disabled = false;
                addToCartBtn.innerHTML = originalText;
            }
        }, 1000);
    }
}

// Mua ngay
function buyNow(productId) {
    console.log('⚡ buyNow called with productId:', productId);
    
    // Kiểm tra size
    const sizeValidation = validateSizeSelection();
    if (!sizeValidation.isValid) {
        showNotification(sizeValidation.message, 'error');
        console.log('❌ Size validation failed:', sizeValidation.message);
        return;
    }
    
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    console.log('📦 Quantity for buy now:', quantity);
    
    if (quantity <= 0) {
        showNotification('Số lượng không hợp lệ!', 'error');
        return;
    }
    
    const buyNowBtn = document.getElementById('buy-now-btn');
    const originalText = buyNowBtn ? buyNowBtn.innerHTML : '';
    
    if (buyNowBtn) {
        buyNowBtn.disabled = true;
        buyNowBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    }
    
    try {
        const productName = document.getElementById('product-title') ? 
                           document.getElementById('product-title').textContent : 'Sản phẩm';
        const currentPrice = document.querySelector('.current-price, .final-price, .price');
        const price = currentPrice ? 
                     parseFloat(currentPrice.textContent.replace(/[^0-9]/g, '')) : 0;
        const imageUrl = document.getElementById('main-img') ? 
                        document.getElementById('main-img').src : '';
        
        const checkoutItem = {
            productId: productId,
            productName: productName,
            price: price,
            image: imageUrl,
            quantity: quantity,
            size: sizeValidation.selectedSize,
            timestamp: new Date().getTime()
        };
        
        console.log('💳 Checkout item:', checkoutItem);
        
        localStorage.setItem('checkoutItem', JSON.stringify(checkoutItem));
        localStorage.setItem('directCheckout', 'true'); // Đánh dấu là mua ngay
        
        showNotification(`Chuẩn bị thanh toán "${productName}"`, 'success');
        
        // Chuyển đến trang checkout
        setTimeout(() => {
            window.location.href = '/html/checkout.html';
        }, 500);
        
    } catch (error) {
        console.error('❌ Error in buy now:', error);
        showNotification('Lỗi khi xử lý đơn hàng!', 'error');
        
        // Restore button state on error
        if (buyNowBtn) {
            buyNowBtn.disabled = false;
            buyNowBtn.innerHTML = originalText;
        }
    }
}

function addToCartLocalStorage(product) {
    if (window.CartCommon && window.CartCommon.addToCart) {
        // Sử dụng cart common
        window.CartCommon.addToCart(product);
    } else {
        // Fallback
        try {
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            
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
            
            // Cập nhật UI trên tất cả các trang
            if (window.CartCommon && window.CartCommon.updateCartUI) {
                window.CartCommon.updateCartUI();
            } else {
                updateCartCount();
            }
            
        } catch (e) {
            console.log('❌ Lỗi add to cart:', e);
            showNotification('Lỗi khi thêm vào giỏ hàng!', 'error');
        }
    }
}

function updateCartCount() {
    if (window.CartCommon && window.CartCommon.updateCartCount) {
        window.CartCommon.updateCartCount();
    } else {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = totalItems;
                cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
            }
        } catch (e) {
            console.log('❌ Lỗi update cart count:', e);
        }
    }
}

// ========== NOTIFICATIONS ==========
function showNotification(message, type = 'success') {
    try {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
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

function hideLoadingState() {
    const container = document.querySelector('.product-detail-container');
    if (!container || !window._originalContent) return;
    
    container.innerHTML = window._originalContent;
    console.log('✅ Loading state hidden, content restored');
}

// ========== PRODUCT DATA LOADING ==========
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    console.log('Product ID from URL:', productId);
    return productId;
}

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
            
            setTimeout(() => {
                hideLoadingState();
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
        hideLoadingState();
        showNotification('Không thể tải dữ liệu sản phẩm', 'error');
    }
}

function populateProductData(product) {
    console.log('🎯 Populating product data:', product);
    
    try {
        // 1. Update product title
        const productTitle = document.getElementById('product-title');
        if (productTitle) {
            productTitle.textContent = product.ProductName || 'Sản phẩm';
        }
        
        // 2. Update breadcrumb
        const productNameSpan = document.getElementById('product-name');
        if (productNameSpan) {
            productNameSpan.textContent = product.ProductName || 'Sản phẩm';
        }
        
        // 3. Update image
        const mainImg = document.getElementById('main-img');
        if (mainImg) {
            let imageUrl = product.ImageURL || '';
            
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                if (imageUrl.startsWith('image/')) {
                    imageUrl = '/' + imageUrl;
                } else {
                    imageUrl = '/image/' + imageUrl;
                }
            }
            
            mainImg.src = imageUrl;
            mainImg.alt = product.ProductName || 'Product image';
            
            mainImg.onerror = function() {
                console.error('❌ Image failed to load, using fallback');
                this.src = '/image/clothes/1.jpg';
            };
        }
        
        // 4. Update price
        const priceContainer = document.getElementById('price-container');
        if (priceContainer) {
            const sellingPrice = parseFloat(product.SellingPrice) || 0;
            const discount = parseFloat(product.Discount) || 0;
            
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
        
        // 7. Update description - SỬA: Hiển thị description thực tế từ API
        const description = document.getElementById('product-description');
        if (description) {
            // Sử dụng description từ API hoặc mô tả mặc định
            const productDescription = product.Description || 
                `${product.ProductName} - Sản phẩm chính hãng ${product.BrandName || ''}, chất lượng cao, phù hợp cho ${getSuitableForText(product.CategoryID)}.`;
            description.textContent = productDescription;
            
            // Tạo đặc điểm nổi bật
            createProductFeatures(product);
            
            // Cập nhật các điểm nổi bật dựa trên category
            const featuresList = description.parentElement.querySelector('ul');
            if (featuresList) {
                featuresList.innerHTML = getProductFeaturesByCategory(product.CategoryID, product);
            }
        }
        
        // 8. Update specifications
        updateElementText('spec-category', product.CategoryName);
        updateElementText('spec-brand', product.BrandName);
        updateElementText('spec-league', product.LeagueName);
        updateElementText('spec-season', product.Season || '2022');
        updateElementText('spec-player', product.PlayerName || 'Không áp dụng');
        
        // 9. Initialize size options
        console.log('👕 DEBUG - Before initializeSizeOptions:', {
            productId: product.ProductID,
            categoryId: product.CategoryID,
            categoryName: product.CategoryName,
            requiresSize: product.CategoryID === 1 || product.CategoryID === 2 || product.CategoryID === 4 || product.CategoryID === 5
        });
        
        initializeSizeOptions(product);
        
        console.log('👕 DEBUG - After initializeSizeOptions');
        
        console.log('🔄 Loading related products for category:', product.CategoryID);
        
        setTimeout(() => {
            console.log('🔄 Setting up event listeners...');
            setupEventListeners(product.ProductID);
        }, 100);

        setTimeout(() => {
            loadRelatedProducts(product.CategoryID, product.ProductID);
        }, 500);

    // Initialize quantity controls after data is loaded
        setTimeout(() => {
            initializeQuantityControls();
            updateActionButtons();
        }, 100);
        
    } catch (error) {
        console.error('❌ Error in populateProductData:', error);
        showNotification('Lỗi hiển thị sản phẩm', 'error');
    }
}

async function loadRelatedProducts(categoryId, currentProductId) {
    console.log('🔄 Loading related products for category:', categoryId, 'excluding:', currentProductId);
    
    const relatedSection = document.getElementById('related-section');
    const relatedProductsContainer = document.getElementById('related-products');
    
    if (!relatedSection || !relatedProductsContainer) {
        console.log('❌ Related products section not found');
        return;
    }
    
    // Show loading state
    relatedProductsContainer.innerHTML = `
        <div class="related-products-loading">
            <div class="spinner"></div>
            <p>Đang tải sản phẩm liên quan...</p>
        </div>
    `;
    
    try {
        console.log(`📡 Calling API for ALL products to filter by category`);
        
        // Gọi API lấy TẤT CẢ sản phẩm
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 All products API response:', data);
        
        let products = [];
        
        if (data.success && data.products && Array.isArray(data.products)) {
            // Filter theo category ID và loại bỏ sản phẩm hiện tại
            products = data.products.filter(product => {
                // Kiểm tra category ID và không phải sản phẩm hiện tại
                return product.CategoryID == categoryId && product.ProductID != currentProductId;
            });
            
            console.log(`✅ Found ${products.length} products with category ${categoryId}`);
            
            // Lấy ngẫu nhiên 5 sản phẩm (hoặc tất cả nếu ít hơn 5)
            if (products.length > 5) {
                // Trộn mảng và lấy 5 sản phẩm đầu
                products = shuffleArray(products).slice(0, 5);
            }
            
            console.log(`✅ Selected ${products.length} related products to display`);
        } else {
            console.log('❌ No valid products data from API');
        }
        
        if (products.length === 0) {
            console.log('📭 No related products found from API');
            showNoRelatedProducts();
            return;
        }
        
        // Hiển thị sản phẩm liên quan
        renderRelatedProducts(products);
        
    } catch (error) {
        console.error('❌ Error loading related products:', error);
        
        // Thử lại với retry logic
        try {
            console.log('🔄 Retrying to load related products...');
            await retryLoadRelatedProducts(categoryId, currentProductId, 3);
        } catch (retryError) {
            console.error('❌ All retries failed:', retryError);
            showNoRelatedProducts();
        }
    }
}


// Fallback related products data
function getFallbackRelatedProducts(categoryId, currentProductId) {
    console.log('🔄 Using fallback related products for category:', categoryId);
    
    // Mở rộng fallback data cho từng category
    const fallbackProducts = {
        1: [ // Áo đấu - thêm nhiều sản phẩm hơn
            {
                ProductID: 101,
                ProductName: 'Áo đấu Manchester United 2023/24',
                BrandName: 'Nike',
                SellingPrice: 850000,
                Discount: 10,
                StockQuantity: 15,
                ImageURL: '/image/clothes/1.jpg',
                CategoryID: 1
            },
            {
                ProductID: 102,
                ProductName: 'Áo đấu Liverpool 2023/24',
                BrandName: 'Nike',
                SellingPrice: 820000,
                Discount: 5,
                StockQuantity: 12,
                ImageURL: '/image/clothes/2.jpg',
                CategoryID: 1
            },
            {
                ProductID: 103,
                ProductName: 'Áo đấu Barcelona 2023/24',
                BrandName: 'Nike',
                SellingPrice: 880000,
                Discount: 15,
                StockQuantity: 8,
                ImageURL: '/image/clothes/3.jpg',
                CategoryID: 1
            },
            {
                ProductID: 104,
                ProductName: 'Áo đấu Real Madrid 2023/24',
                BrandName: 'Adidas',
                SellingPrice: 900000,
                Discount: 0,
                StockQuantity: 20,
                ImageURL: '/image/clothes/4.jpg',
                CategoryID: 1
            },
            {
                ProductID: 105,
                ProductName: 'Áo đấu PSG 2023/24',
                BrandName: 'Nike',
                SellingPrice: 870000,
                Discount: 8,
                StockQuantity: 10,
                ImageURL: '/image/clothes/5.jpg',
                CategoryID: 1
            }
        ],
        2: [ // Giày
            {
                ProductID: 201,
                ProductName: 'Giày đá bóng Adidas Predator',
                BrandName: 'Adidas',
                SellingPrice: 1200000,
                Discount: 20,
                StockQuantity: 10,
                ImageURL: '/image/shoes/1.jpg',
                CategoryID: 2
            },
            {
                ProductID: 202,
                ProductName: 'Giày đá bóng Nike Mercurial',
                BrandName: 'Nike',
                SellingPrice: 1150000,
                Discount: 15,
                StockQuantity: 7,
                ImageURL: '/image/shoes/2.jpg',
                CategoryID: 2
            },
            {
                ProductID: 203,
                ProductName: 'Giày đá bóng Puma Future',
                BrandName: 'Puma',
                SellingPrice: 1100000,
                Discount: 10,
                StockQuantity: 12,
                ImageURL: '/image/shoes/3.jpg',
                CategoryID: 2
            },
            {
                ProductID: 204,
                ProductName: 'Giày đá bóng Adidas Copa',
                BrandName: 'Adidas',
                SellingPrice: 950000,
                Discount: 5,
                StockQuantity: 15,
                ImageURL: '/image/shoes/4.jpg',
                CategoryID: 2
            }
        ],
        3: [ // Phụ kiện
            {
                ProductID: 301,
                ProductName: 'Bóng đá Euro 2024 chính thức',
                BrandName: 'Adidas',
                SellingPrice: 800000,
                Discount: 0,
                StockQuantity: 25,
                ImageURL: '/image/accessories/1.jpg',
                CategoryID: 3
            },
            {
                ProductID: 302,
                ProductName: 'Bóng đá World Cup 2022',
                BrandName: 'Nike',
                SellingPrice: 750000,
                Discount: 10,
                StockQuantity: 18,
                ImageURL: '/image/accessories/2.jpg',
                CategoryID: 3
            },
            {
                ProductID: 303,
                ProductName: 'Tất bóng đá cao cổ',
                BrandName: 'Nike',
                SellingPrice: 150000,
                Discount: 0,
                StockQuantity: 50,
                ImageURL: '/image/accessories/3.jpg',
                CategoryID: 3
            },
            {
                ProductID: 304,
                ProductName: 'Bao tay đá bóng',
                BrandName: 'Adidas',
                SellingPrice: 120000,
                Discount: 5,
                StockQuantity: 30,
                ImageURL: '/image/accessories/4.jpg',
                CategoryID: 3
            }
        ],
        4: [ // Áo khoác
            {
                ProductID: 401,
                ProductName: 'Áo khoác Manchester United',
                BrandName: 'Nike',
                SellingPrice: 950000,
                Discount: 5,
                StockQuantity: 9,
                ImageURL: '/image/jackets/1.jpg',
                CategoryID: 4
            },
            {
                ProductID: 402,
                ProductName: 'Áo khoác Chelsea',
                BrandName: 'Nike',
                SellingPrice: 920000,
                Discount: 10,
                StockQuantity: 7,
                ImageURL: '/image/jackets/2.jpg',
                CategoryID: 4
            },
            {
                ProductID: 403,
                ProductName: 'Áo khoác Barcelona',
                BrandName: 'Nike',
                SellingPrice: 980000,
                Discount: 8,
                StockQuantity: 5,
                ImageURL: '/image/jackets/3.jpg',
                CategoryID: 4
            }
        ],
        5: [ // Găng tay
            {
                ProductID: 501,
                ProductName: 'Găng tay thủ môn Adidas',
                BrandName: 'Adidas',
                SellingPrice: 650000,
                Discount: 0,
                StockQuantity: 14,
                ImageURL: '/image/gloves/1.jpg',
                CategoryID: 5
            },
            {
                ProductID: 502,
                ProductName: 'Găng tay thủ môn Nike',
                BrandName: 'Nike',
                SellingPrice: 700000,
                Discount: 15,
                StockQuantity: 8,
                ImageURL: '/image/gloves/2.jpg',
                CategoryID: 5
            },
            {
                ProductID: 503,
                ProductName: 'Găng tay thủ môn Puma',
                BrandName: 'Puma',
                SellingPrice: 600000,
                Discount: 10,
                StockQuantity: 12,
                ImageURL: '/image/gloves/3.jpg',
                CategoryID: 5
            }
        ]
    };
    
    // Lấy sản phẩm cùng category, loại bỏ sản phẩm hiện tại
    const categoryProducts = fallbackProducts[categoryId] || [];
    return categoryProducts
        .filter(product => product.ProductID != currentProductId)
        .slice(0, 5); // Luôn lấy tối đa 5 sản phẩm
}

async function loadRelatedProductsWithRetry(categoryId, currentProductId, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await loadRelatedProducts(categoryId, currentProductId);
            break; // Thành công thì break
        } catch (error) {
            console.log(`🔄 Retry ${i + 1}/${retries} for related products`);
            if (i === retries - 1) {
                // Lần retry cuối cùng thất bại, dùng fallback
                console.log('📦 Using fallback related products after all retries failed');
                const fallbackProducts = getFallbackRelatedProducts(categoryId, currentProductId);
                if (fallbackProducts.length > 0) {
                    renderRelatedProducts(fallbackProducts);
                } else {
                    showNoRelatedProducts();
                }
            }
            // Đợi 1 giây trước khi retry
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function loadAllProductsAndFilter(categoryId, currentProductId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.products) {
            // Filter sản phẩm cùng category và loại bỏ sản phẩm hiện tại
            const relatedProducts = data.products.filter(product => 
                product.CategoryID == categoryId && 
                product.ProductID != currentProductId
            ).slice(0, 5);
            
            return relatedProducts;
        }
        
        return [];
    } catch (error) {
        console.error('Error loading all products:', error);
        return [];
    }
}

function renderRelatedProducts(products) {
    const relatedProductsContainer = document.getElementById('related-products');
    
    if (!relatedProductsContainer) return;
    
    if (products.length === 0) {
        showNoRelatedProducts();
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        const discount = product.Discount || 0;
        const sellingPrice = parseFloat(product.SellingPrice) || 0;
        const finalPrice = discount > 0 ? 
            Math.round(sellingPrice * (100 - discount) / 100) : sellingPrice;
        
        // Xử lý URL ảnh
        let imageUrl = product.ImageURL || '';
        if (imageUrl) {
            // Đảm bảo URL đúng định dạng
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                imageUrl = '/image/' + imageUrl;
            }
        } else {
            // Default image based on category
            const defaultImages = {
                1: '/image/clothes/1.jpg',
                2: '/image/shoes/1.jpg',
                3: '/image/accessories/1.jpg',
                4: '/image/jackets/1.jpg',
                5: '/image/gloves/1.jpg'
            };
            imageUrl = defaultImages[product.CategoryID] || '/image/clothes/1.jpg';
        }
        
        // Kiểm tra stock
        const stockQuantity = product.StockQuantity || 0;
        const stockStatus = stockQuantity > 0 ? 'in-stock' : 'out-stock';
        const stockText = stockQuantity > 0 ? `Còn ${stockQuantity} sp` : 'Hết hàng';
        
        html += `
            <div class="related-product-card" data-product-id="${product.ProductID}">
                <a href="/html/product-detail.html?id=${product.ProductID}">
                    <div class="related-product-image">
                        <img src="${imageUrl}" alt="${product.ProductName}" 
                             onerror="handleImageError(this, ${product.CategoryID})">
                        ${discount > 0 ? `
                            <div class="related-product-discount">-${discount}%</div>
                        ` : ''}
                    </div>
                    
                    <div class="related-product-info">
                        <h3 class="related-product-title">${product.ProductName || 'Sản phẩm'}</h3>
                        
                        ${product.BrandName ? `
                            <div class="related-product-brand">
                                <i class="fas fa-tag"></i>
                                ${product.BrandName}
                            </div>
                        ` : ''}
                        
                        <div class="related-product-price">
                            <span class="related-product-current-price">${formatPrice(finalPrice)}</span>
                            ${discount > 0 ? `
                                <span class="related-product-original-price">${formatPrice(sellingPrice)}</span>
                            ` : ''}
                        </div>
                        
                        <div class="related-product-stock ${stockStatus}">
                            ${stockText}
                        </div>
                    </div>
                </a>
            </div>
        `;
    });
    
    relatedProductsContainer.innerHTML = html;
    
    console.log(`✅ Rendered ${products.length} related products`);
}

function showNoRelatedProducts() {
    const relatedProductsContainer = document.getElementById('related-products');
    
    if (!relatedProductsContainer) return;
    
    relatedProductsContainer.innerHTML = `
        <div class="no-related-products">
            <i class="fas fa-search"></i>
            <p>Không có sản phẩm liên quan</p>
        </div>
    `;
}

// ========== PRODUCT FEATURES ==========

// Tạo danh sách đặc điểm nổi bật
function createProductFeatures(product) {
    console.log('✨ Creating product features for:', product.ProductName);
    
    const featuresList = document.getElementById('product-features');
    if (!featuresList) return;
    
    let features = [];
    
    // Thêm description chính
    if (product.Description && product.Description.trim() !== '') {
        features.push({
            text: product.Description,
            type: 'description'
        });
    }
    
    // Thêm các đặc điểm theo category
    switch (product.CategoryID) {
        case 1: // Áo đấu
            features = features.concat([
                { text: 'Chất liệu: Vải polyester cao cấp, thoáng khí, co giãn 4 chiều', type: 'material' },
                { text: 'Công nghệ in: Nhiệt chống phai, không bong tróc khi giặt', type: 'design' },
                { text: 'Form áo: Thiết kế ôm vừa vặn, thoải mái vận động', type: 'quality' },
                { text: 'Phù hợp: Đá bóng, tập luyện, cổ vũ, cosplay', type: 'suitable' }
            ]);
            break;
            
        case 2: // Giày
            features = features.concat([
                { text: 'Chất liệu: Da tổng hợp cao cấp, nhẹ và bền', type: 'material' },
                { text: 'Đế giày: Cao su non chống trượt, bám sân tốt', type: 'design' },
                { text: 'Đệm lót: Công nghệ đệm khí, êm ái khi di chuyển', type: 'quality' },
                { text: 'Phù hợp: Sân cỏ tự nhiên, sân nhân tạo, sân futsal', type: 'suitable' }
            ]);
            break;
            
        case 3: // Phụ kiện
            features = features.concat([
                { text: 'Chất liệu: Cao su/PU cao cấp, độ bền cao', type: 'material' },
                { text: 'Thiết kế: Theo tiêu chuẩn FIFA, chính hãng', type: 'design' },
                { text: 'Độ nảy: Tối ưu, dễ kiểm soát', type: 'quality' },
                { text: 'Chống thấm: Dễ vệ sinh, sử dụng lâu dài', type: 'suitable' }
            ]);
            break;
            
        case 4: // Áo khoác
            features = features.concat([
                { text: 'Chất liệu: Vải dù chống thấm, giữ ấm tốt', type: 'material' },
                { text: 'Thiết kế: Form rộng, thoải mái, nhiều túi tiện dụng', type: 'design' },
                { text: 'Chi tiết: Logo thêu, dây rút điều chỉnh', type: 'quality' },
                { text: 'Phù hợp: Mặc ngoài, đi học, đi chơi, thể thao', type: 'suitable' }
            ]);
            break;
            
        case 5: // Găng tay thủ môn
            features = features.concat([
                { text: 'Chất liệu: Latex cao cấp, độ bám tốt', type: 'material' },
                { text: 'Thiết kế: Ngón tay cong tự nhiên, ôm khít bàn tay', type: 'design' },
                { text: 'Bảo vệ: Đệm xốp chống chấn thương', type: 'quality' },
                { text: 'Phù hợp: Thủ môn chuyên nghiệp và nghiệp dư', type: 'suitable' }
            ]);
            break;
    }
    
    // Thêm thông tin đặc biệt
    if (product.PlayerName && product.PlayerName !== 'Không áp dụng') {
        features.push({
            text: `Cầu thủ: ${product.PlayerName}`,
            type: 'player'
        });
    }
    
    if (product.Season) {
        features.push({
            text: `Mùa giải: ${product.Season}`,
            type: 'season'
        });
    }
    
    if (product.BrandName) {
        features.push({
            text: `Thương hiệu: ${product.BrandName}`,
            type: 'brand'
        });
    }
    
    // Tạo HTML cho features
    let featuresHTML = '';
    
    features.forEach((feature, index) => {
        if (index < 6) { // Chỉ hiển thị tối đa 6 features
            featuresHTML += `
                <li class="${feature.type}">
                    <span>${feature.text}</span>
                </li>
            `;
        }
    });
    
    featuresList.innerHTML = featuresHTML;
    
    console.log(`✅ Created ${features.length} product features`);
}

// Helper function để tạo features list theo category
function getProductFeaturesByCategory(categoryId, product) {
    const baseFeatures = [
        'Chất liệu cao cấp, bền đẹp',
        'Thiết kế chính hãng, đúng form',
        'Phù hợp cho nhiều hoạt động'
    ];
    
    if (categoryId === 1) { // Áo đấu
        return [
            'Chất liệu: Vải polyester cao cấp, thoáng khí',
            'In logo và họa tiết bằng công nghệ nhiệt chống phai',
            'Form áo chuẩn, thoải mái khi vận động',
            product.PlayerName ? `Cầu thủ: ${product.PlayerName}` : 'Áo đội tuyển/CLB chính thức',
            `Mùa giải: ${product.Season || 'Mới nhất'}`
        ];
    }
    
    if (categoryId === 2) { // Giày
        return [
            'Chất liệu: Da tổng hợp cao cấp',
            'Đế giày chống trượt, bám sân tốt',
            'Đệm êm ái, hỗ trợ chân tối ưu',
            'Thiết kế nhẹ, linh hoạt khi di chuyển',
            'Phù hợp cho sân cỏ tự nhiên và nhân tạo'
        ];
    }
    
    if (categoryId === 3) { // Phụ kiện
        return [
            'Chất liệu: Cao su/PU cao cấp',
            'Thiết kế theo tiêu chuẩn FIFA',
            'Độ nảy tốt, dễ kiểm soát',
            'Chống thấm nước, dễ vệ sinh',
            product.Season ? `Phiên bản: ${product.Season}` : 'Phiên bản chính thức'
        ];
    }
    
    return baseFeatures;
}

function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element && text !== undefined && text !== null) {
        element.textContent = text;
        return true;
    }
    return false;
}

function setupEventListeners(productId) {
    console.log('🔗 Setting up event listeners for product:', productId);
    
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    
    // Debug: Log các nút
    console.log('🔍 Buttons found:', {
        addToCartBtn: !!addToCartBtn,
        buyNowBtn: !!buyNowBtn,
        favoriteBtn: !!favoriteBtn
    });
    
    if (addToCartBtn) {
        console.log('🎯 Add to cart button found, adding click listener');
        addToCartBtn.replaceWith(addToCartBtn.cloneNode(true));
        const newAddToCartBtn = document.getElementById('add-to-cart-btn');
        
        newAddToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🛒 Add to cart clicked for product:', productId);
            addToCart(productId);
        });
        
        // Thêm tooltip
        newAddToCartBtn.title = 'Thêm sản phẩm vào giỏ hàng';
    } else {
        console.error('❌ Add to cart button NOT FOUND!');
    }
    
    if (buyNowBtn) {
        console.log('🎯 Buy now button found, adding click listener');
        buyNowBtn.replaceWith(buyNowBtn.cloneNode(true));
        const newBuyNowBtn = document.getElementById('buy-now-btn');
        
        newBuyNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('⚡ Buy now clicked for product:', productId);
            buyNow(productId);
        });
        
        // Thêm tooltip
        newBuyNowBtn.title = 'Mua sản phẩm ngay lập tức';
    } else {
        console.error('❌ Buy now button NOT FOUND!');
    }
    
    // Thêm event listener cho các radio button size
    document.addEventListener('change', function(e) {
        if (e.target.name === 'size') {
            console.log('📏 Size changed to:', e.target.value);
            updateSelectedSizeDisplay(e.target.value);
            updateActionButtons();
        }
    });
    
    // Thêm event listener cho quantity input
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', updateActionButtons);
        quantityInput.addEventListener('change', updateActionButtons);
    }
    
    console.log('✅ Event listeners setup complete');
}

// ========== MINI CART FUNCTIONS ==========

// Khởi tạo giỏ hàng floating
function initializeFloatingCart() {
    const cartBtn = document.getElementById('cart-floating-btn');
    const closeCartBtn = document.getElementById('close-mini-cart');
    const miniCartPopup = document.getElementById('mini-cart-popup');
    const notificationClose = document.getElementById('cart-notification-close');
    
    if (cartBtn) {
        cartBtn.addEventListener('click', toggleMiniCart);
    }
    
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeMiniCart);
    }
    
    // Close cart khi click ra ngoài
    document.addEventListener('click', (e) => {
        const miniCart = document.getElementById('mini-cart-popup');
        const cartBtn = document.getElementById('cart-floating-btn');
        
        if (miniCart && miniCart.classList.contains('show') && 
            !miniCart.contains(e.target) && 
            !cartBtn.contains(e.target)) {
            closeMiniCart();
        }
    });
    
    if (notificationClose) {
        notificationClose.addEventListener('click', closeNotification);
    }
    
    // Update cart count on load
    updateFloatingCartCount();
    updateMiniCart();
}

// Mở/đóng mini cart
function toggleMiniCart() {
    const miniCart = document.getElementById('mini-cart-popup');
    const backdrop = document.createElement('div');
    backdrop.className = 'mini-cart-backdrop';
    backdrop.id = 'mini-cart-backdrop';
    
    if (miniCart.classList.contains('show')) {
        closeMiniCart();
    } else {
        miniCart.classList.add('show');
        document.body.appendChild(backdrop);
        backdrop.classList.add('show');
        backdrop.addEventListener('click', closeMiniCart);
        updateMiniCart();
    }
}

function closeMiniCart() {
    const miniCart = document.getElementById('mini-cart-popup');
    const backdrop = document.getElementById('mini-cart-backdrop');
    
    if (miniCart) {
        miniCart.classList.remove('show');
    }
    
    if (backdrop) {
        backdrop.classList.remove('show');
        setTimeout(() => backdrop.remove(), 300);
    }
}

// Update floating cart count
function updateFloatingCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const cartCount = document.getElementById('cart-floating-count');
        const cartBtn = document.getElementById('cart-floating-btn');
        
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        
        // Animation khi có thêm sản phẩm
        if (cartBtn && totalItems > 0) {
            cartBtn.classList.add('has-items');
        }
        
        return totalItems;
    } catch (e) {
        console.log('❌ Lỗi update cart count:', e);
        return 0;
    }
}

// Update mini cart content
function updateMiniCart() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartItemsContainer = document.getElementById('mini-cart-items');
        const cartTotalElement = document.getElementById('mini-cart-total');
        
        if (!cartItemsContainer) return;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="mini-cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Giỏ hàng trống</p>
                </div>
            `;
            
            if (cartTotalElement) {
                cartTotalElement.textContent = '0₫';
            }
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
                             alt="${item.name || 'Sản phẩm'}"
                             onerror="this.src='/image/clothes/1.jpg'">
                    </div>
                    <div class="mini-cart-item-info">
                        <div class="mini-cart-item-title">${item.name || 'Sản phẩm'}</div>
                        ${item.size ? `<div class="mini-cart-item-size">Size: ${item.size}</div>` : ''}
                        <div class="mini-cart-item-details">
                            <div class="mini-cart-item-price">${formatPrice(itemTotal)}</div>
                            <div class="mini-cart-item-quantity">
                                <button class="mini-cart-item-qty-btn minus" onclick="updateCartItemQuantity(${index}, -1)">-</button>
                                <span class="mini-cart-item-qty">${item.quantity || 1}</span>
                                <button class="mini-cart-item-qty-btn plus" onclick="updateCartItemQuantity(${index}, 1)">+</button>
                            </div>
                        </div>
                    </div>
                    <button class="mini-cart-item-remove" onclick="removeCartItem(${index})" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
        
        cartItemsContainer.innerHTML = html;
        
        if (cartTotalElement) {
            cartTotalElement.textContent = formatPrice(totalAmount);
        }
        
    } catch (e) {
        console.log('❌ Lỗi update mini cart:', e);
    }
}

// Update cart item quantity
function updateCartItemQuantity(index, change) {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart[index]) {
            cart[index].quantity = (cart[index].quantity || 1) + change;
            
            // Xóa nếu quantity <= 0
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
                showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            updateFloatingCartCount();
            updateMiniCart();
            
            // Show notification chỉ khi tăng số lượng
            if (change > 0) {
                showMiniCartNotification('Đã cập nhật số lượng sản phẩm');
            }
        }
    } catch (e) {
        console.log('❌ Lỗi update cart item:', e);
    }
}

// Remove cart item
function removeCartItem(index) {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart[index]) {
            const productName = cart[index].name || 'Sản phẩm';
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            
            updateFloatingCartCount();
            updateMiniCart();
            
            showNotification(`Đã xóa "${productName}" khỏi giỏ hàng`, 'info');
        }
    } catch (e) {
        console.log('❌ Lỗi remove cart item:', e);
    }
}

// Show mini cart notification
function showMiniCartNotification(message) {
    const notification = document.getElementById('cart-notification');
    const messageElement = document.getElementById('cart-notification-message');
    
    if (notification && messageElement) {
        messageElement.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Close notification
function closeNotification() {
    const notification = document.getElementById('cart-notification');
    if (notification) {
        notification.classList.remove('show');
    }
}

// Update addToCartLocalStorage để trigger notification
function addToCartLocalStorage(product) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        const existingItem = cart.find(item => 
            item.id == product.id && item.size === product.size
        );
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
            showMiniCartNotification(`Đã cập nhật số lượng "${product.name}" trong giỏ hàng`);
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
            showMiniCartNotification(`Đã thêm "${product.name}" vào giỏ hàng`);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateFloatingCartCount();
        updateMiniCart();
        
        // Auto show mini cart khi thêm sản phẩm
        setTimeout(() => {
            const miniCart = document.getElementById('mini-cart-popup');
            if (!miniCart.classList.contains('show')) {
                toggleMiniCart();
            }
        }, 500);
        
    } catch (e) {
        console.log('❌ Lỗi add to cart:', e);
        showNotification('Lỗi khi thêm vào giỏ hàng!', 'error');
    }
}
// ========== HELPER FUNCTIONS ==========

function goToHomePage() {
    window.location.href = '/html/home.html';
}

function reloadPage() {
    window.location.reload();
}

// ========== INITIALIZATION ==========
function initializePage() {
    console.log('🚀 Initializing product detail page...');
    
    try {
        // Load product data
        loadProductData();
        
        // Initialize cart count
        initializeFloatingCart();
        updateFloatingCartCount();
        updateMiniCart();
        
        // Initialize tabs
        initializeTabs();
        
        // Log để debug
        console.log('🔍 Checking related products section:', {
            section: document.getElementById('related-section'),
            container: document.getElementById('related-products')
        });
        
    } catch (error) {
        console.error('❌ Failed to initialize page:', error);
    }
}

// Bắt đầu khởi tạo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
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