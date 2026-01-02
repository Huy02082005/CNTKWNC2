document.addEventListener('DOMContentLoaded', function() {
    const steps = ['step-email', 'step-otp', 'step-reset', 'step-success'];
    let currentStep = 0;
    let timerInterval;
    let timeLeft = 60;

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
        input.addEventListener('input', function() {
            if (this.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

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
        
        timerInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = ` (${timeLeft}s)`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.opacity = '1';
                timerElement.textContent = '';
            }
        }, 1000);
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
        } else if (strength <= 2) {
            strengthBar.classList.add('strength-weak');
        } else if (strength === 3) {
            strengthBar.classList.add('strength-medium');
        } else {
            strengthBar.classList.add('strength-strong');
        }
    });

    // Kiểm tra mật khẩu khớp
    document.getElementById('confirm-password').addEventListener('input', function() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = this.value;
        const matchMessage = document.getElementById('password-match');
        
        if (confirmPassword && newPassword === confirmPassword) {
            matchMessage.style.display = 'block';
        } else {
            matchMessage.style.display = 'none';
        }
    });

    // Xử lý form email
    document.getElementById('emailForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        
        if (!email) {
            alert('Vui lòng nhập email!');
            return;
        }
        
        // Giả lập gửi OTP
        startTimer();
        showStep(1);
    });

    // Xử lý form OTP
    document.getElementById('otpForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Kiểm tra OTP đã nhập đủ chưa
        let otpComplete = true;
        let otpValue = '';
        
        otpInputs.forEach(input => {
            if (!input.value) {
                otpComplete = false;
            }
            otpValue += input.value;
        });
        
        if (!otpComplete) {
            alert('Vui lòng nhập đầy đủ mã OTP!');
            return;
        }
        
        // Giả lập xác nhận OTP thành công
        // Trong thực tế, bạn sẽ gửi OTP đến server để xác thực
        showStep(2);
    });

    // Xử lý form reset password
    document.getElementById('resetForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!newPassword || !confirmPassword) {
            alert('Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự!');
            return;
        }
        
        // Giả lập đặt lại mật khẩu thành công
        // Trong thực tế, bạn sẽ gửi mật khẩu mới đến server
        showStep(3);
    });

    // Gửi lại OTP
    document.getElementById('resend-otp').addEventListener('click', function(e) {
        e.preventDefault();
        timeLeft = 60;
        startTimer();
        alert('Mã OTP mới đã được gửi đến email của bạn!');
    });

    // Nút quay lại
    document.querySelectorAll('.back-step').forEach(button => {
        button.addEventListener('click', function() {
            const targetStep = this.getAttribute('data-step');
            showStep(steps.indexOf(`step-${targetStep}`));
        });
    });
});