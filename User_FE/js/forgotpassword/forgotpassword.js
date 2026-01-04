document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost:3000/api';
    const steps = ['step-email', 'step-otp', 'step-reset', 'step-success'];
    let currentStep = 0;
    let timerInterval;
    let timeLeft = 300; // 5 phút
    let currentEmail = '';
    let currentOTP = '';

    // Chuyển đổi giữa các bước
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            const stepElement = document.getElementById(step);
            if (index === stepIndex) {
                stepElement.classList.add('active');
            } else {
                stepElement.classList.remove('active');
            }
        });
        currentStep = stepIndex;
    }

    // Xử lý OTP input
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
        // Chỉ cho phép số
        input.addEventListener('input', function(e) {
            const value = e.target.value;
            if (!/^\d*$/.test(value)) {
                e.target.value = value.replace(/\D/g, '');
                return;
            }

            if (this.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        // Xử lý paste
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').trim();
            if (/^\d{6}$/.test(pasteData)) {
                pasteData.split('').forEach((char, i) => {
                    if (otpInputs[i]) {
                        otpInputs[i].value = char;
                    }
                });
                otpInputs[5].focus();
            }
        });

        // Xử lý backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // Timer cho gửi lại OTP
    function startTimer() {
        const timerElement = document.getElementById('timer');
        const resendLink = document.getElementById('resend-otp');
        
        resendLink.style.pointerEvents = 'none';
        resendLink.style.opacity = '0.5';
        
        clearInterval(timerInterval);
        timeLeft = 300;
        updateTimerDisplay();
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.opacity = '1';
                timerElement.textContent = '';
            }
        }, 1000);
    }

    function updateTimerDisplay() {
        const timerElement = document.getElementById('timer');
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = ` (${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')})`;
    }

    // Kiểm tra độ mạnh mật khẩu
    document.getElementById('new-password').addEventListener('input', function() {
        const password = this.value;
        const strengthBar = document.getElementById('strength-bar');
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        strengthBar.className = 'strength-bar';
        if (strength === 0) {
            strengthBar.style.width = '0%';
            strengthBar.textContent = '';
        } else {
            strengthBar.style.width = `${strength * 25}%`;
            if (strength <= 2) {
                strengthBar.classList.add('strength-weak');
                strengthBar.textContent = 'Yếu';
            } else if (strength === 3) {
                strengthBar.classList.add('strength-medium');
                strengthBar.textContent = 'Khá';
            } else {
                strengthBar.classList.add('strength-strong');
                strengthBar.textContent = 'Mạnh';
            }
        }
    });

    // Kiểm tra mật khẩu khớp
    document.getElementById('confirm-password').addEventListener('input', function() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = this.value;
        const matchMessage = document.getElementById('password-match');
        
        if (confirmPassword) {
            if (newPassword === confirmPassword) {
                matchMessage.textContent = '✓ Mật khẩu khớp';
                matchMessage.style.color = '#10b981';
                matchMessage.style.display = 'block';
            } else {
                matchMessage.textContent = '✗ Mật khẩu không khớp';
                matchMessage.style.color = '#ef4444';
                matchMessage.style.display = 'block';
            }
        } else {
            matchMessage.style.display = 'none';
        }
    });

    // Hiển thị thông báo
    function showMessage(message, type = 'info') {
        // Xóa thông báo cũ
        const oldMessage = document.querySelector('.message-alert');
        if (oldMessage) oldMessage.remove();

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

    // Xử lý form email
    document.getElementById('emailForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            showMessage('Vui lòng nhập email!', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Email không hợp lệ!', 'error');
            return;
        }

        try {
            // Hiển thị loading
            const submitBtn = this.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang kiểm tra...';
            submitBtn.disabled = true;

            // Kiểm tra email có tồn tại trong database không
            const checkResponse = await fetch(`${API_BASE_URL}/customer/check-email-exists`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });

            const checkResult = await checkResponse.json();

            if (!checkResult.exists) {
                showMessage('Email không tồn tại trong hệ thống!', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }

            // Gửi OTP
            const otpResponse = await fetch(`${API_BASE_URL}/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    purpose: 'forgot_password'
                })
            });

            const otpResult = await otpResponse.json();

            // Khôi phục nút
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (otpResult.success) {
                currentEmail = email;
                currentOTP = otpResult.otpCode || '';
                
                // Hiển thị email đã che (kiểm tra element tồn tại)
                const displayEmail = email.replace(/(\w{3})[\w.-]+@(\w+)/, '$1***@$2');
                const emailDisplayElement = document.getElementById('email-display');
                if (emailDisplayElement) {
                    emailDisplayElement.textContent = displayEmail;
                } else {
                    console.log('⚠️ Element #email-display not found in HTML');
                    // Có thể hiển thị trong subtitle hoặc tạo element mới
                    const subtitle = document.querySelector('#step-otp .subtitle');
                    if (subtitle) {
                        subtitle.textContent = `Nhập mã xác nhận đã gửi đến ${displayEmail}`;
                    }
                }
                
                // Clear OTP inputs
                otpInputs.forEach(input => input.value = '');
                
                showMessage('Đã gửi mã OTP đến email của bạn!', 'success');
                startTimer();
                showStep(1);
                
                // Trong development, log OTP ra console
                if (currentOTP) {
                    console.log(`🔑 OTP cho ${email}: ${currentOTP}`);
                }
            } else {
                showMessage(otpResult.message || 'Gửi OTP thất bại!', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            const submitBtn = this.querySelector('.btn-primary');
            submitBtn.textContent = 'Gửi mã xác nhận';
            submitBtn.disabled = false;
            showMessage('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        }
    });

    // Xử lý form OTP
    document.getElementById('otpForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Lấy mã OTP từ input
        let otpValue = '';
        otpInputs.forEach(input => {
            otpValue += input.value;
        });
        
        if (otpValue.length !== 6) {
            showMessage('Vui lòng nhập đầy đủ 6 số OTP!', 'error');
            return;
        }

        try {
            // Hiển thị loading
            const submitBtn = this.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang xác thực...';
            submitBtn.disabled = true;

            // Xác thực OTP với server - ĐÂY LÀ PHẦN QUAN TRỌNG!
            const response = await fetch('http://localhost:3000/api/otp/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentEmail,
                    otpCode: otpValue
                })
            });

            const result = await response.json();

            console.log('📊 OTP verify result:', result);

            // Khôi phục nút
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (result.success && result.isValid) {
                showMessage('Xác thực thành công!', 'success');
                showStep(2);
                // Clear password fields
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                document.getElementById('strength-bar').style.width = '0%';
                document.getElementById('password-match').style.display = 'none';
            } else {
                // Nếu OTP sai, clear inputs và focus lại
                otpInputs.forEach(input => input.value = '');
                otpInputs[0].focus();
                showMessage(result.message || 'Mã OTP không đúng!', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            const submitBtn = this.querySelector('.btn-primary');
            submitBtn.textContent = 'Xác nhận';
            submitBtn.disabled = false;
            showMessage('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        }
    });

    // Xử lý form reset password
    document.getElementById('resetForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate
        if (!newPassword || !confirmPassword) {
            showMessage('Vui lòng nhập đầy đủ thông tin!', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            showMessage('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }

        try {
            // Hiển thị loading
            const submitBtn = this.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Đang đặt lại...';
            submitBtn.disabled = true;

            // Gọi API reset password
            const response = await fetch(`${API_BASE_URL}/customer/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentEmail,
                    newPassword: newPassword
                })
            });

            const result = await response.json();

            // Khôi phục nút
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            if (result.success) {
                showMessage('Đặt lại mật khẩu thành công!', 'success');
                
                // Hiển thị email trong bước thành công
                document.getElementById('success-email').textContent = currentEmail;
                
                showStep(3);
                
                // Tự động chuyển về login sau 3 giây
                setTimeout(() => {
                    window.location.href = '/User_FE/html/login.html';
                }, 3000);
            } else {
                showMessage(result.message || 'Đặt lại mật khẩu thất bại!', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            const submitBtn = this.querySelector('.btn-primary');
            submitBtn.textContent = 'Đặt lại mật khẩu';
            submitBtn.disabled = false;
            showMessage('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        }
    });

    // Gửi lại OTP
    document.getElementById('resend-otp').addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!currentEmail) return;

        try {
            // Hiển thị loading
            this.textContent = 'Đang gửi lại...';
            this.disabled = true;

            // Gửi lại OTP
            const response = await fetch(`${API_BASE_URL}/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: currentEmail,
                    purpose: 'forgot_password'
                })
            });

            const result = await response.json();

            // Khôi phục nút
            this.textContent = 'Gửi lại mã';
            this.disabled = false;

            if (result.success) {
                showMessage('Đã gửi lại mã OTP!', 'success');
                startTimer();
                
                // Clear OTP inputs
                otpInputs.forEach(input => input.value = '');
                otpInputs[0].focus();
                
                // Trong development, log OTP
                if (result.otpCode) {
                    console.log(`🔑 OTP mới cho ${currentEmail}: ${result.otpCode}`);
                }
            } else {
                showMessage(result.message || 'Gửi lại OTP thất bại!', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            this.textContent = 'Gửi lại mã';
            this.disabled = false;
            showMessage('Có lỗi xảy ra, vui lòng thử lại!', 'error');
        }
    });

    // Nút quay lại
    document.querySelectorAll('.back-step').forEach(button => {
        button.addEventListener('click', function() {
            const targetStep = this.getAttribute('data-step');
            showStep(steps.indexOf(`step-${targetStep}`));
        });
    });

    // Thêm CSS cho message nếu chưa có
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