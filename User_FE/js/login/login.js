document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:3000/api';
    const switchLinks = document.querySelectorAll('.switch-link');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginFormElement = document.getElementById('loginForm');
    const registerFormElement = document.getElementById('registerForm');
    
    // Biến để lưu trạng thái validate
    let isPhoneValid = false;
    let isPhoneUnique = false;

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

    // Hàm kiểm tra định dạng số điện thoại
    function validatePhoneNumber(phone) {
        // Kiểm tra xem có bắt đầu bằng 0 và có đúng 10 chữ số không
        const phoneRegex = /^0\d{9}$/;
        return phoneRegex.test(phone);
    }

    // Hàm kiểm tra số điện thoại đã tồn tại trong database chưa
    async function checkPhoneExists(phone) {
        try {
            const response = await fetch(`${API_BASE_URL}/customer/check-phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: phone })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            return result.exists; // Giả sử API trả về { exists: true/false }
        } catch (error) {
            console.error('Error checking phone:', error);
            return false; // Trong trường hợp lỗi, giả sử số điện thoại không tồn tại
        }
    }

    // Thêm sự kiện kiểm tra số điện thoại khi người dùng nhập
    const phoneInput = document.getElementById('register-phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', async function() {
            const phone = this.value.trim();
            const phoneErrorElement = document.getElementById('phone-error') || createPhoneErrorElement();
            
            // Reset trạng thái
            isPhoneValid = false;
            isPhoneUnique = false;
            
            if (!phone) {
                showPhoneError('Vui lòng nhập số điện thoại', phoneErrorElement);
                return;
            }
            
            // Kiểm tra định dạng
            if (!validatePhoneNumber(phone)) {
                showPhoneError('Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số', phoneErrorElement);
                return;
            }
            
            isPhoneValid = true;
            
            // Kiểm tra số điện thoại đã tồn tại chưa
            phoneErrorElement.textContent = 'Đang kiểm tra số điện thoại...';
            phoneErrorElement.className = 'error-message checking';
            
            const exists = await checkPhoneExists(phone);
            
            if (exists) {
                showPhoneError('Số điện thoại này đã được đăng ký', phoneErrorElement);
                isPhoneUnique = false;
            } else {
                showPhoneSuccess('Số điện thoại hợp lệ', phoneErrorElement);
                isPhoneUnique = true;
            }
        });
        
        // Cũng kiểm tra khi người dùng nhập liệu
        phoneInput.addEventListener('input', function() {
            const phoneErrorElement = document.getElementById('phone-error');
            if (phoneErrorElement) {
                phoneErrorElement.textContent = '';
                phoneErrorElement.className = 'error-message';
            }
            isPhoneValid = false;
            isPhoneUnique = false;
        });
    }

    // Tạo phần tử hiển thị lỗi cho số điện thoại
    function createPhoneErrorElement() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'phone-error';
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            font-size: 12px;
            margin-top: 4px;
            min-height: 18px;
        `;
        
        const phoneGroup = document.querySelector('.input-group input[type="tel"]').parentNode;
        phoneGroup.appendChild(errorDiv);
        return errorDiv;
    }

    // Hiển thị thông báo lỗi
    function showPhoneError(message, errorElement) {
        errorElement.textContent = message;
        errorElement.className = 'error-message error';
        errorElement.style.color = '#ef4444';
    }

    // Hiển thị thông báo thành công
    function showPhoneSuccess(message, errorElement) {
        errorElement.textContent = message;
        errorElement.className = 'error-message success';
        errorElement.style.color = '#10b981';
    }

    // Thêm CSS cho thông báo lỗi
    if (!document.querySelector('#phone-validation-styles')) {
        const style = document.createElement('style');
        style.id = 'phone-validation-styles';
        style.textContent = `
            .error-message {
                font-size: 12px;
                margin-top: 4px;
                min-height: 18px;
                transition: all 0.3s ease;
            }
            .error-message.error {
                color: #ef4444;
            }
            .error-message.success {
                color: #10b981;
            }
            .error-message.checking {
                color: #3b82f6;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

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
                }),
                credentials: 'include' // QUAN TRỌNG: Để nhận cookie từ server
            });

            const result = await response.json();

            // Khôi phục nút
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (result.success) {
                showMessage(result.message, 'success');
                
                // QUAN TRỌNG: Set cookie customer_data nếu server chưa set
                if (result.customer) {
                    setCustomerCookie(result.customer);
                }
                
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
                    // Redirect về trang trước đó hoặc trang chủ
                    const redirectUrl = localStorage.getItem('redirectUrl') || '/html/home.html';
                    localStorage.removeItem('redirectUrl');
                    window.location.href = redirectUrl;
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

        // Kiểm tra định dạng số điện thoại
        if (!validatePhoneNumber(phone)) {
            showMessage('Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số!', 'error');
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
            submitBtn.textContent = 'Đang kiểm tra...';
            submitBtn.disabled = true;

            // KIỂM TRA SỐ ĐIỆN THOẠI ĐÃ TỒN TẠI CHƯA
            const phoneCheckResponse = await fetch(`${API_BASE_URL}/customer/check-phone`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone: phone })
            });

            const phoneCheckResult = await phoneCheckResponse.json();

            if (phoneCheckResult.exists) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                showMessage('Số điện thoại này đã được đăng ký!', 'error');
                
                // Hiển thị lỗi bên dưới ô số điện thoại
                const phoneErrorElement = document.getElementById('phone-error') || createPhoneErrorElement();
                showPhoneError('Số điện thoại này đã được đăng ký', phoneErrorElement);
                return;
            }

            // Nếu số điện thoại hợp lệ, tiếp tục đăng ký
            submitBtn.textContent = 'Đang đăng ký...';

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
                }),
                credentials: 'include' // Để nhận cookie từ server
            });

            const result = await response.json();

            // Khôi phục nút
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (result.success) {
                showMessage(result.message, 'success');
                
                // QUAN TRỌNG: Set cookie customer_data sau khi đăng ký
                if (result.customer) {
                    setCustomerCookie(result.customer);
                }
                
                // Chuyển về form đăng nhập sau 2 giây
                setTimeout(() => {
                    registerForm.classList.remove('active');
                    loginForm.classList.add('active');
                    // Clear form
                    registerFormElement.reset();
                    // Reset trạng thái phone validation
                    const phoneErrorElement = document.getElementById('phone-error');
                    if (phoneErrorElement) {
                        phoneErrorElement.textContent = '';
                    }
                }, 2000);

            } else {
                // Kiểm tra nếu lỗi là do số điện thoại đã tồn tại
                if (result.message && (result.message.toLowerCase().includes('số điện thoại') || 
                    result.message.toLowerCase().includes('phone'))) {
                    const phoneErrorElement = document.getElementById('phone-error');
                    if (phoneErrorElement) {
                        showPhoneError('Số điện thoại này đã được đăng ký', phoneErrorElement);
                    }
                }
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

    // Hàm set cookie customer_data
    function setCustomerCookie(customerData) {
        try {
            const cookieValue = encodeURIComponent(JSON.stringify(customerData));
            // Cookie hết hạn sau 7 ngày
            const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `customer_data=${cookieValue}; expires=${expires}; path=/; SameSite=Lax`;
            console.log('✅ Cookie set thành công:', customerData);
        } catch (error) {
            console.error('❌ Lỗi khi set cookie:', error);
        }
    }

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