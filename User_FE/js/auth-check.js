
console.log('🔐 Auth Check loaded');

// Hàm kiểm tra đăng nhập bằng cookie
function isLoggedIn() {
    try {
        const cookies = document.cookie.split('; ');
        for (const cookie of cookies) {
            if (cookie.startsWith('customer_data=')) {
                const cookieValue = cookie.split('=')[1];
                const customerData = JSON.parse(decodeURIComponent(cookieValue));
                
                // Kiểm tra dữ liệu hợp lệ
                if (customerData && customerData.id && customerData.name) {
                    console.log('✅ User is logged in:', customerData.name);
                    return true;
                }
            }
        }
        console.log('❌ User is NOT logged in');
        return false;
    } catch (error) {
        console.error('Error checking login:', error);
        return false;
    }
}

// Hàm chuyển hướng về login
function redirectToLogin() {
    // Lưu URL hiện tại để quay lại sau khi login
    const currentUrl = window.location.href;
    localStorage.setItem('redirectUrl', currentUrl);
    
    console.log('🔄 Redirecting to login page');
    window.location.href = '/html/login.html';
}

// Hàm bảo vệ trang
function protectPage() {
    const currentPage = window.location.pathname;
    
    // Danh sách các trang cần đăng nhập
    const protectedPages = [
        '/html/profile.html',
        '/html/cart.html',
        '/html/checkout.html',
        '/html/orders.html',
        '/html/wishlist.html'
    ];
    
    // Kiểm tra nếu trang hiện tại cần bảo vệ
    for (const page of protectedPages) {
        if (currentPage.includes(page)) {
            if (!isLoggedIn()) {
                console.log(`⛔ Page ${currentPage} is protected. Redirecting...`);
                alert('⚠️ Bạn cần đăng nhập để truy cập trang này!');
                redirectToLogin();
                return false;
            }
            break;
        }
    }
    return true;
}

// Hàm bảo vệ các sự kiện click
function protectProductClicks() {
    console.log('🛡️ Setting up click protection...');
    
    document.addEventListener('click', function(e) {
        // 1. Bảo vệ nút thêm vào giỏ hàng
        const addToCartBtn = e.target.closest('.add-to-cart, .btn-add-to-cart, [onclick*="addToCart"]');
        if (addToCartBtn && !isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            console.log('⛔ Add to cart blocked - not logged in');
            alert('⚠️ Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng!');
            redirectToLogin();
            return false;
        }
        
        // 2. Bảo vệ click vào sản phẩm (xem chi tiết)
        const productCard = e.target.closest('.product-card, .product-item, [data-product-id]');
        const isProductLink = e.target.closest('a[href*="product-detail.html"], a[href*="product.html"]');
        
        if ((productCard || isProductLink) && !isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            console.log('⛔ Product detail view blocked - not logged in');
            alert('⚠️ Bạn cần đăng nhập để xem chi tiết sản phẩm!');
            redirectToLogin();
            return false;
        }
        
        // 3. Bảo vệ các link cần đăng nhập
        const protectedLink = e.target.closest('[data-require-auth], .require-auth');
        if (protectedLink && protectedLink.tagName === 'A' && !isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            const action = protectedLink.dataset.requireAuth || 'truy cập trang này';
            alert(`⚠️ Bạn cần đăng nhập để ${action}!`);
            redirectToLogin();
            return false;
        }
    }, true); // Sử dụng capture phase để chặn sớm
}

// Hàm kiểm tra đăng nhập trước khi thực hiện action
function requireAuth(action = 'thực hiện chức năng này') {
    if (!isLoggedIn()) {
        alert(`⚠️ Bạn cần đăng nhập để ${action}!`);
        redirectToLogin();
        return false;
    }
    return true;
}

// Khởi tạo hệ thống auth
function initAuth() {
    console.log('🔐 Initializing auth system...');
    
    // 1. Bảo vệ trang hiện tại
    protectPage();
    
    // 2. Bảo vệ các sự kiện click
    protectProductClicks();
    
    console.log('✅ Auth system ready. Logged in:', isLoggedIn());
}

// Chạy khi DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    setTimeout(initAuth, 100);
}

// Export cho sử dụng global
window.authCheck = {
    isLoggedIn,
    requireAuth,
    redirectToLogin
};

// Helper function cho onclick trong HTML
window.requireAuth = requireAuth;
window.authGuard = requireAuth;