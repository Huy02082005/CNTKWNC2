document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:3000/api';
    const switchLinks = document.querySelectorAll('.switch-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginFormElement = document.getElementById('loginForm');
    const registerFormElement = document.getElementById('registerForm');

    // Chuyển đổi giữa form đăng nhập và đăng ký
    switchLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            
            if (target === 'register') {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            } else {
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
            }
        });
    });

    // Xử lý đăng nhập khách hàng
    loginFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        // Validate cơ bản
        if (!email || !password) {
            showMessage('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        try {
            // Hiển thị loading
            const submitBtn = loginFormElement.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang đăng nhập...';
            submitBtn.disabled = true;

            // Gọi API đăng nhập khách hàng
            const response = await fetch(`${API_BASE_URL}/customer/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            // Khôi phục nút
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (result.success) {
                showMessage(result.message, 'success');
                
                // Lưu thông tin vào localStorage nếu chọn "Ghi nhớ"
                if (rememberMe) {
                    localStorage.setItem('customer_email', email);
                    localStorage.setItem('remember_me', 'true');
                } else {
                    localStorage.removeItem('customer_email');
                    localStorage.removeItem('remember_me');
                }

                // Chuyển hướng sau 1 giây
                setTimeout(() => {
                    window.location.href = '/html/home.html';
                }, 1000);

            } else {
                showMessage(result.message, 'error');
            }

        } catch (error) {
            console.error('Login error:', error);
            const submitBtn = loginFormElement.querySelector('.btn-primary');
            submitBtn.textContent = 'Đăng nhập';
            submitBtn.disabled = false;
            showMessage('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        }
    });

    // Xử lý đăng ký khách hàng
    registerFormElement.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Validate cơ bản
        if (!name || !email || !phone || !password || !confirmPassword) {
            showMessage('Vui lòng điền đầy đủ thông tin!', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
            return;
        }

        try {
            // Hiển thị loading
            const submitBtn = registerFormElement.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang đăng ký...';
            submitBtn.disabled = true;

            // Gọi API đăng ký khách hàng
            const response = await fetch(`${API_BASE_URL}/customer/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fullName: name,
                    email: email,
                    phone: phone,
                    password: password
                })
            });

            const result = await response.json();

            // Khôi phục nút
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (result.success) {
                showMessage(result.message, 'success');
                
                // Chuyển về form đăng nhập sau 2 giây
                setTimeout(() => {
                    registerForm.classList.remove('active');
                    loginForm.classList.add('active');
                    // Clear form
                    registerFormElement.reset();
                }, 2000);

            } else {
                showMessage(result.message, 'error');
            }

        } catch (error) {
            console.error('Register error:', error);
            const submitBtn = registerFormElement.querySelector('.btn-primary');
            submitBtn.textContent = 'Đăng ký';
            submitBtn.disabled = false;
            showMessage('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        }
    });

    // Kiểm tra nếu có lưu email từ trước
    function checkRememberedLogin() {
        const rememberedEmail = localStorage.getItem('customer_email');
        const rememberMe = localStorage.getItem('remember_me');
        
        if (rememberMe === 'true' && rememberedEmail) {
            document.getElementById('login-email').value = rememberedEmail;
            document.getElementById('remember-me').checked = true;
        }
    }

    // Hiển thị thông báo
    function showMessage(message, type = 'info') {
        // Xóa thông báo cũ nếu có
        const oldMessage = document.querySelector('.message-alert');
        if (oldMessage) {
            oldMessage.remove();
        }

        // Tạo thông báo mới
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-alert ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
            font-size: 14px;
            font-weight: 500;
        `;

        document.body.appendChild(messageDiv);

        // Tự động xóa sau 5 giây
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 5000);
    }

    // Kiểm tra đăng nhập khi tải trang
    checkRememberedLogin();

    // Thêm CSS animation nếu chưa có
    if (!document.querySelector('#message-styles')) {
        const style = document.createElement('style');
        style.id = 'message-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
});