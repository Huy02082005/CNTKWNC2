    document.addEventListener('DOMContentLoaded', function() {
        const switchLinks = document.querySelectorAll('.switch-link');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

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

        // Xử lý form đăng nhập
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Đăng nhập thành công!');
        });

        // Xử lý form đăng ký
        document.getElementById('registerForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (password !== confirmPassword) {
                alert('Mật khẩu xác nhận không khớp!');
                return;
            }

            alert('Đăng ký thành công!');
        });
    });
