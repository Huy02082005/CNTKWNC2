// Utility functions for customer authentication
const CustomerAuth = {
    // Kiểm tra khách hàng đã đăng nhập chưa
    isLoggedIn() {
        const customerCookie = this.getCustomerData();
        return !!customerCookie;
    },

    // Lấy dữ liệu khách hàng từ cookie
    getCustomerData() {
        try {
            const cookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('customer_data='));
            
            if (cookie) {
                const cookieValue = cookie.split('=')[1];
                return JSON.parse(decodeURIComponent(cookieValue));
            }
            return null;
        } catch (error) {
            console.error('Error parsing customer cookie:', error);
            return null;
        }
    },

    // Lấy thông tin khách hàng
    getCustomer() {
        return this.getCustomerData();
    },

    // Kiểm tra đăng nhập và chuyển hướng nếu chưa đăng nhập
    requireLogin(redirectTo = '/html/login.html') {
        if (!this.isLoggedIn()) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    },

    // Đăng xuất
    logout() {
        document.cookie = 'customer_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('customer_email');
        localStorage.removeItem('remember_me');
        window.location.href = '/html/home.html';
    },

    // Cập nhật thông tin khách hàng trong các trang
    updateUI() {
        const customer = this.getCustomer();
        
        // Cập nhật tên khách hàng ở header (nếu có)
        const customerNameElements = document.querySelectorAll('.customer-name, .user-name');
        if (customer && customerNameElements.length > 0) {
            customerNameElements.forEach(el => {
                el.textContent = customer.name;
            });
        }

        // Hiển thị/ẩn nút đăng nhập/đăng xuất
        const loginButtons = document.querySelectorAll('.login-btn, .logout-btn');
        if (loginButtons.length > 0) {
            if (this.isLoggedIn()) {
                loginButtons.forEach(btn => {
                    if (btn.classList.contains('login-btn')) {
                        btn.style.display = 'none';
                    } else if (btn.classList.contains('logout-btn')) {
                        btn.style.display = 'block';
                    }
                });
            } else {
                loginButtons.forEach(btn => {
                    if (btn.classList.contains('login-btn')) {
                        btn.style.display = 'block';
                    } else if (btn.classList.contains('logout-btn')) {
                        btn.style.display = 'none';
                    }
                });
            }
        }
    },

    // Kiểm tra trạng thái đăng nhập với server
    async checkLoginStatus() {
        try {
            const response = await fetch('http://localhost:3000/api/customer/check');
            const result = await response.json();
            return result.authenticated;
        } catch (error) {
            console.error('Error checking login status:', error);
            return false;
        }
    }
};

// Tự động cập nhật UI khi trang tải
document.addEventListener('DOMContentLoaded', function() {
    CustomerAuth.updateUI();
});

// Lắng nghe sự kiện click đăng xuất
document.addEventListener('click', function(e) {
    if (e.target.matches('.logout-btn') || e.target.closest('.logout-btn')) {
        e.preventDefault();
        CustomerAuth.logout();
    }
});

// Export cho sử dụng trong các file khác
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerAuth;
}