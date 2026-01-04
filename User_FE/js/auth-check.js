// /js/auth-check.js

/**
 * Kiểm tra đăng nhập đơn giản
 */

// Kiểm tra xem user đã đăng nhập chưa
function isLoggedIn() {
    const user = localStorage.getItem('user');
    return user !== null && user !== 'undefined' && user !== '';
}

// Chuyển hướng đến trang login
function redirectToLogin() {
    // Lưu URL hiện tại để quay lại sau khi đăng nhập
    const currentUrl = window.location.pathname + window.location.search;
    localStorage.setItem('redirectAfterLogin', currentUrl);
    
    // Chuyển hướng đến trang đăng nhập
    window.location.href = '/html/login.html';
    return false; // Ngăn chặn hành động tiếp theo
}

// Hiển thị thông báo yêu cầu đăng nhập
function showLoginRequiredAlert(action = 'thực hiện chức năng này') {
    const confirmed = confirm(`Bạn cần đăng nhập để ${action}.\n\nBấm OK để chuyển đến trang đăng nhập.`);
    if (confirmed) {
        return redirectToLogin();
    }
    return false;
}

// Kiểm tra trước khi thêm vào giỏ hàng
function checkAuthBeforeAddToCart(event, productId, productName) {
    if (!isLoggedIn()) {
        event.preventDefault();
        event.stopPropagation();
        return showLoginRequiredAlert('thêm sản phẩm vào giỏ hàng');
    }
    
    // Nếu đã đăng nhập, cho phép thêm vào giỏ hàng
    // Hàm addToCart sẽ được gọi tiếp từ sự kiện
    return true;
}

// Kiểm tra trước khi xem chi tiết sản phẩm
function checkAuthBeforeViewDetail(event, productUrl) {
    if (!isLoggedIn()) {
        event.preventDefault();
        event.stopPropagation();
        return showLoginRequiredAlert('xem chi tiết sản phẩm');
    }
    
    // Nếu đã đăng nhập, cho phép chuyển hướng
    window.location.href = productUrl;
    return true;
}

// Cập nhật giao diện header
function updateLoginStatusUI() {
    const userActions = document.querySelector('.user-actions');
    if (!userActions) return;
    
    if (isLoggedIn()) {
        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const username = userData?.username || userData?.email || 'Tài khoản';
            
            userActions.innerHTML = `
                <div class="user-dropdown">
                    <a href="#" class="user-link">
                        <i class="fas fa-user"></i> ${username}
                        <i class="fas fa-chevron-down"></i>
                    </a>
                    <div class="user-dropdown-menu">
                        <a href="/html/profile.html"><i class="fas fa-user-circle"></i> Hồ sơ</a>
                        <a href="/html/orders.html"><i class="fas fa-shopping-bag"></i> Đơn hàng</a>
                        <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
                    </div>
                </div>
            `;
            
            // Thêm sự kiện cho nút đăng xuất
            document.getElementById('logout-btn')?.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
            
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    } else {
        // Nếu chưa đăng nhập, hiển thị icon user bình thường
        userActions.innerHTML = `
            <a href="/html/login.html"><i class="fas fa-user"></i></a>
        `;
    }
}

// Đăng xuất
function logout() {
    // Xóa thông tin user khỏi localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Nếu có token
    localStorage.removeItem('cart'); // Xóa giỏ hàng nếu cần
    
    // Hiển thị thông báo
    alert('Đã đăng xuất thành công!');
    
    // Reload trang để cập nhật giao diện
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// Hàm để gọi từ onclick trong HTML
function requireAuth(event, callback) {
    if (!isLoggedIn()) {
        event.preventDefault();
        event.stopPropagation();
        return showLoginRequiredAlert();
    }
    
    if (typeof callback === 'function') {
        return callback();
    }
    return true;
}

// Hàm bọc sự kiện đơn giản
function authGuard(event) {
    if (!isLoggedIn()) {
        event.preventDefault();
        event.stopPropagation();
        return showLoginRequiredAlert();
    }
    return true;
}

// Tự động gắn sự kiện cho các phần tử có class
function bindAuthEvents() {
    // Gắn sự kiện cho các nút thêm vào giỏ hàng
    document.addEventListener('click', function(e) {
        const addToCartBtn = e.target.closest('.btn-add-to-cart, .add-to-cart-btn, [data-action="add-to-cart"]');
        
        if (addToCartBtn && !isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            showLoginRequiredAlert('thêm sản phẩm vào giỏ hàng');
            return false;
        }
    });
    
    // Gắn sự kiện cho các link xem chi tiết sản phẩm (nếu có class product-link)
    document.addEventListener('click', function(e) {
        const productLink = e.target.closest('.product-link, .view-details, [data-product-detail]');
        
        if (productLink && productLink.tagName === 'A' && !isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            showLoginRequiredAlert('xem chi tiết sản phẩm');
            return false;
        }
    });
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth Check initialized');
    
    // Cập nhật giao diện đăng nhập
    updateLoginStatusUI();
    
    // Gắn sự kiện kiểm tra auth
    bindAuthEvents();
    
    // Log để debug
    console.log('User logged in:', isLoggedIn());
    if (isLoggedIn()) {
        console.log('User data:', JSON.parse(localStorage.getItem('user')));
    }
});

// Export để sử dụng trong console hoặc module khác
window.authCheck = {
    isLoggedIn,
    redirectToLogin,
    checkAuthBeforeAddToCart,
    checkAuthBeforeViewDetail,
    requireAuth,
    authGuard,
    logout,
    updateLoginStatusUI
};

// Tự động cập nhật UI khi storage thay đổi (nếu user đăng nhập ở tab khác)
window.addEventListener('storage', function(e) {
    if (e.key === 'user') {
        updateLoginStatusUI();
    }
});