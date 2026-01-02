// ========== GLOBAL VARIABLES ==========
let featuredProductDisplay = null;

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page loaded - Using ProductDisplay Component');
    
    // 1. Load sản phẩm nổi bật bằng ProductDisplay component
    loadFeaturedProducts();
    
    // 2. Load đồng phục CLB và ĐTQG (giữ nguyên)
    loadClubsAndTeams();
    
    // 3. Setup event listeners
    setupEventListeners();
    
    // 4. Load cart count
    loadCartCount();
    
    // 5. Initialize scroll animations
    initScrollAnimation();
});

// ========== FEATURED PRODUCTS ==========

function loadFeaturedProducts() {
    try {
        console.log('Loading featured products with ProductDisplay...');
        
        // Mock data cho sản phẩm nổi bật
        const mockProducts = [
            {
                productID: 1,
                productName: 'Áo Manchester United 2023-2024',
                imageURL: 'https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=MU+Home',
                sellingPrice: 599000,
                discount: 15,
                stockQuantity: 25,
                brandName: 'Adidas'
            },
            {
                productID: 2,
                productName: 'Áo Real Madrid 2023-2024',
                imageURL: 'https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=RM+Home',
                sellingPrice: 649000,
                discount: 10,
                stockQuantity: 30,
                brandName: 'Adidas'
            },
            {
                productID: 3,
                productName: 'Áo Barcelona 2023-2024',
                imageURL: 'https://via.placeholder.com/300x300/45B7D1/FFFFFF?text=FCB+Home',
                sellingPrice: 629000,
                discount: 20,
                stockQuantity: 15,
                brandName: 'Nike'
            },
            {
                productID: 4,
                productName: 'Áo Liverpool 2023-2024',
                imageURL: 'https://via.placeholder.com/300x300/96CEB4/FFFFFF?text=LIV+Home',
                sellingPrice: 579000,
                discount: 0,
                stockQuantity: 40,
                brandName: 'Nike'
            },
            {
                productID: 5,
                productName: 'Áo AC Milan 2023-2024',
                imageURL: 'https://via.placeholder.com/300x300/FECA57/FFFFFF?text=MILAN+Home',
                sellingPrice: 549000,
                discount: 5,
                stockQuantity: 20,
                brandName: 'Puma'
            },
            {
                productID: 6,
                productName: 'Áo Bayern Munich 2023-2024',
                imageURL: 'https://via.placeholder.com/300x300/FF9F1A/FFFFFF?text=FCB+Home',
                sellingPrice: 599000,
                discount: 12,
                stockQuantity: 35,
                brandName: 'Adidas'
            },
            {
                productID: 7,
                productName: 'Áo PSG 2023-2024',
                imageURL: 'https://via.placeholder.com/300x300/9B59B6/FFFFFF?text=PSG+Home',
                sellingPrice: 599000,
                discount: 8,
                stockQuantity: 28,
                brandName: 'Nike'
            },
            {
                productID: 8,
                productName: 'Áo Juventus 2023-2024',
                imageURL: 'https://via.placeholder.com/300x300/34495E/FFFFFF?text=JUV+Home',
                sellingPrice: 569000,
                discount: 15,
                stockQuantity: 22,
                brandName: 'Adidas'
            }
        ];
        
        // Sử dụng ProductDisplay component
        featuredProductDisplay = new ProductDisplay({
    container: document.getElementById('featured-products'),
    products: mockProducts,
    columns: 4,
    showQuickAdd: true,
    onProductClick: function(productId) {
        console.log('🟢 CLICKED PRODUCT ID:', productId);
        console.log('🟢 Current URL pattern:', `/product/${productId}`);
        
        // Test: Alert để xem có chạy không
        alert(`Đang chuyển đến sản phẩm ${productId}`);
        
        // Chuyển hướng
        window.location.href = `/product/${productId}`;
    }
});
        
        featuredProductDisplay.render();
        
        // Ghi đè hàm quickAddToCart để sử dụng localStorage của bạn
        if (featuredProductDisplay) {
            const originalQuickAdd = featuredProductDisplay.quickAddToCart;
            featuredProductDisplay.quickAddToCart = function(productId) {
                // Lấy thông tin sản phẩm từ mock data
                const product = this.products.find(p => p.productID == productId);
                if (!product) return;
                
                // Thêm vào giỏ hàng localStorage
                addToCartLocalStorage({
                    id: productId,
                    name: product.productName,
                    price: product.discount > 0 ? 
                        product.sellingPrice - (product.sellingPrice * product.discount / 100) : 
                        product.sellingPrice,
                    image: product.imageURL,
                    quantity: 1
                });
                
                // Hiển thị thông báo
                showNotification(`Đã thêm "${product.productName}" vào giỏ hàng!`);
            };
        }
        
        console.log('Featured products loaded successfully');
        
    } catch (error) {
        console.error('Error loading featured products:', error);
        
        // Fallback hiển thị thông báo lỗi
        const container = document.getElementById('featured-products');
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                    <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    }
}

// ========== CLUBS AND TEAMS ==========

function loadClubsAndTeams() {
    // Mock data cho CLB
    const mockClubs = [
        { id: 1, name: 'Manchester United', logo: 'https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=MU' },
        { id: 2, name: 'Real Madrid', logo: 'https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=RM' },
        { id: 3, name: 'Barcelona', logo: 'https://via.placeholder.com/200x200/45B7D1/FFFFFF?text=FCB' },
        { id: 4, name: 'Liverpool', logo: 'https://via.placeholder.com/200x200/96CEB4/FFFFFF?text=LIV' },
        { id: 5, name: 'AC Milan', logo: 'https://via.placeholder.com/200x200/FECA57/FFFFFF?text=MILAN' },
        { id: 6, name: 'Bayern Munich', logo: 'https://via.placeholder.com/200x200/FF9F1A/FFFFFF?text=FCB' }
    ];
    
    // Mock data cho ĐTQG
    const mockNationalTeams = [
        { id: 1, name: 'ĐT Brazil', logo: 'https://via.placeholder.com/200x200/FFEAA7/000000?text=BRA' },
        { id: 2, name: 'ĐT Argentina', logo: 'https://via.placeholder.com/200x200/74B9FF/FFFFFF?text=ARG' },
        { id: 3, name: 'ĐT Pháp', logo: 'https://via.placeholder.com/200x200/6C5CE7/FFFFFF?text=FRA' },
        { id: 4, name: 'ĐT Đức', logo: 'https://via.placeholder.com/200x200/FF9F43/FFFFFF?text=GER' },
        { id: 5, name: 'ĐT Tây Ban Nha', logo: 'https://via.placeholder.com/200x200/A29BFE/FFFFFF?text=ESP' },
        { id: 6, name: 'ĐT Việt Nam', logo: 'https://via.placeholder.com/200x200/FF7675/FFFFFF?text=VNM' }
    ];
    
    // Hiển thị CLB
    displayTeams('clubs-grid', mockClubs);
    
    // Hiển thị ĐTQG
    displayTeams('national-grid', mockNationalTeams);
}

function displayTeams(containerId, teams) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '';
    teams.forEach(team => {
        html += `
            <div class="category-item" onclick="viewTeamProducts('${team.id}', '${team.name}')">
                <div class="category-image">
                    <img src="${team.logo}" alt="${team.name}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/200x200/CCCCCC/666666?text=LOGO'">
                </div>
                <div class="category-info">
                    <h4>${team.name}</h4>
                    <button class="btn-view-products">Xem sản phẩm</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========== CART FUNCTIONALITY ==========

function loadCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    } catch (e) {
        console.log('Lỗi load cart:', e);
    }
}

function addToCartLocalStorage(product) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Kiểm tra sản phẩm đã có chưa
        const existingItem = cart.find(item => item.id == product.id);
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: product.quantity || 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCartCount();
        
        // Hiệu ứng cart count
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.classList.add('pulse');
            setTimeout(() => {
                cartCount.classList.remove('pulse');
            }, 300);
        }
        
    } catch (e) {
        console.log('Lỗi add to cart:', e);
    }
}

// ========== CART DROPDOWN ==========

function setupCartDropdown() {
    const cartIcon = document.querySelector('.cart-icon');
    const cartDropdown = document.querySelector('.cart-dropdown');
    
    if (!cartIcon || !cartDropdown) return;
    
    cartIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = cartDropdown.style.display === 'block';
        cartDropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            loadCartDropdown();
        }
    });
    
    // Close khi click bên ngoài
    document.addEventListener('click', function(e) {
        if (!cartDropdown.contains(e.target) && !cartIcon.contains(e.target)) {
            cartDropdown.style.display = 'none';
        }
    });
}

function loadCartDropdown() {
    const cartDropdown = document.querySelector('.cart-dropdown');
    if (!cartDropdown) return;
    
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            cartDropdown.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Giỏ hàng trống</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="cart-header">
                <h4>Giỏ hàng (${cart.length})</h4>
            </div>
            <div class="cart-items">
        `;
        
        let total = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            html += `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || '/User_FE/image/default-product.jpg'}" 
                             alt="${item.name}"
                             onerror="this.src='/User_FE/image/default-product.jpg'">
                    </div>
                    <div class="cart-item-info">
                        <h5>${item.name}</h5>
                        <p>${formatPrice(item.price)}₫ × ${item.quantity}</p>
                        <button class="cart-item-remove" onclick="removeCartItem(${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Tổng tiền:</span>
                    <span class="total-price">${formatPrice(total)}₫</span>
                </div>
                <div class="cart-actions">
                    <button class="btn-clear-cart" onclick="clearCart()">Xóa giỏ hàng</button>
                    <button class="btn-checkout" onclick="goToCheckout()">Thanh toán</button>
                </div>
            </div>
        `;
        
        cartDropdown.innerHTML = html;
        
    } catch (e) {
        console.log('Lỗi load cart dropdown:', e);
        cartDropdown.innerHTML = '<div class="empty-cart">Lỗi tải giỏ hàng</div>';
    }
}

function removeCartItem(index) {
    try {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (index >= 0 && index < cart.length) {
            const removedItem = cart[index];
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            loadCartCount();
            loadCartDropdown();
            showNotification(`Đã xóa "${removedItem.name}" khỏi giỏ hàng!`);
        }
    } catch (e) {
        console.log('Lỗi remove cart item:', e);
    }
}

function clearCart() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
        localStorage.removeItem('cart');
        loadCartCount();
        loadCartDropdown();
        showNotification('Đã xóa toàn bộ giỏ hàng!');
    }
}

function goToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
        alert('Giỏ hàng trống!');
        return;
    }
    alert('Chức năng thanh toán đang được phát triển!');
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
    // 1. Dropdown menu
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            this.querySelector('.dropdown-menu').style.display = 'block';
        });
        dropdown.addEventListener('mouseleave', function() {
            this.querySelector('.dropdown-menu').style.display = 'none';
        });
    });
    
    // 2. Cart dropdown
    setupCartDropdown();
    
    // 3. View more button
    const viewMoreBtn = document.querySelector('.btn-view-more');
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', function() {
            window.location.href = '/User_FE/html/see_all.html';
        });
    }
    
    // 4. Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm.');
            this.reset();
        });
    }
}

// ========== UTILITY FUNCTIONS ==========

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}

function showNotification(message) {
    // Tạo thông báo tạm thời
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function viewTeamProducts(teamId, teamName) {
    // Chuyển đến trang xem tất cả với filter theo team
    window.location.href = `/User_FE/html/see_all.html?team=${teamId}&name=${encodeURIComponent(teamName)}`;
}

// ========== SCROLL ANIMATION ==========

function initScrollAnimation() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

// ========== GLOBAL EXPORTS ==========

window.removeCartItem = removeCartItem;
window.clearCart = clearCart;
window.goToCheckout = goToCheckout;
window.viewTeamProducts = viewTeamProducts;
window.formatPrice = formatPrice;

// ========== TOUCH AND SCROLL HANDLERS ==========

document.addEventListener('touchmove', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

window.addEventListener('scroll', function() {
    if (window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY);
    }
});

window.addEventListener('wheel', function(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
    }
}, { passive: false });