// auth-simple.js - Clean version without inline CSS
console.log('🔐 auth-simple.js loaded');

function getCustomerInfo() {
    try {
        const cookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('customer_data='));
        
        if (cookie) {
            const cookieValue = cookie.split('=')[1];
            const data = JSON.parse(decodeURIComponent(cookieValue));
            if (data && data.id && data.name) {
                return data;
            }
        }
    } catch (error) {
        console.log('Error reading cookie:', error);
    }
    return null;
}

function createHoverDropdown() {
    const userActions = document.querySelector('.user-actions');
    if (!userActions) {
        console.error('❌ Không tìm thấy .user-actions');
        return;
    }
    
    const customer = getCustomerInfo();
    
    // Thêm vào phần HTML trong hàm createHoverDropdown()
    if (customer) {
        userActions.innerHTML = `
            <div class="auth-hover-container">
                <div class="auth-trigger" id="authTrigger">
                    <span>Hi, ${customer.name}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                
                <div class="auth-dropdown" id="authDropdown">
                    <a href="/html/profile.html" class="auth-dropdown-item">
                        <i class="fas fa-user-circle"></i>
                        <span>Hồ sơ cá nhân</span>
                    </a>
                    
                    <a href="/html/cart.html" class="auth-dropdown-item">
                        <i class="fas fa-shopping-bag"></i>
                        <span>Giỏ hàng của tôi</span>
                    </a>
                    
                    <a href="/html/order-history.html" class="auth-dropdown-item">
                        <i class="fas fa-history"></i>
                        <span>Lịch sử mua hàng</span>
                    </a>
                    
                    <div class="auth-dropdown-divider"></div>
                    
                    <a href="#" class="auth-dropdown-item auth-logout-btn" id="authLogout">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Đăng xuất</span>
                    </a>
                </div>
            </div>
        `;
    
    setupHoverEvents();
        
    } else {
        // Chưa đăng nhập
        userActions.innerHTML = `
            <a href="/html/login.html" class="auth-login-link">
                <i class="fas fa-user"></i>
            </a>
        `;
    }
}

function setupHoverEvents() {
    const trigger = document.getElementById('authTrigger');
    const dropdown = document.getElementById('authDropdown');
    const logoutBtn = document.getElementById('authLogout');
    
    if (!trigger || !dropdown) return;
    
    let hideTimeout;
    let showTimeout;
    let isDropdownHovered = false;
    let isTriggerHovered = false;
    
    // Hiển thị dropdown khi hover
    trigger.addEventListener('mouseenter', () => {
        isTriggerHovered = true;
        clearTimeout(hideTimeout);
        
        showTimeout = setTimeout(() => {
            if (isTriggerHovered) {
                dropdown.classList.add('show');
            }
        }, 100);
    });
    
    dropdown.addEventListener('mouseenter', () => {
        isDropdownHovered = true;
        clearTimeout(hideTimeout);
    });
    
    dropdown.addEventListener('mouseleave', () => {
        isDropdownHovered = false;
        startHideTimeout();
    });
    
    trigger.addEventListener('mouseleave', () => {
        isTriggerHovered = false;
        if (!isDropdownHovered) {
            startHideTimeout();
        }
    });
    
    function startHideTimeout() {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            if (!isTriggerHovered && !isDropdownHovered) {
                dropdown.classList.remove('show');
            }
        }, 150);
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

function logout() {
    console.log('🚪 Đăng xuất...');
    
    // Xóa cookie
    document.cookie = "customer_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Gọi API logout
    fetch('/api/customer/logout', { 
        method: 'POST',
        credentials: 'include'
    }).catch(() => console.log('No logout API'));
    
    // Reload trang
    setTimeout(() => window.location.reload(), 300);
}

// Chạy khi trang tải
document.addEventListener('DOMContentLoaded', createHoverDropdown);

// Export
window.AuthSimple = {
    logout,
    isLoggedIn: () => !!getCustomerInfo(),
    getCurrentUser: getCustomerInfo
};