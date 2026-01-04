const nodemailer = require('nodemailer');

// Mailtrap.io config
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "2b71035a636c28", // Thay bằng user của bạn
        pass: "8e65dc9f632178"  // Thay bằng pass của bạn
    }
});

// Hoặc dùng Gmail
const gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gmptuilwzrhhsvecpk@nespj.com',
        pass: '111111' // Dùng App Password, không dùng mật khẩu chính
    }
});

module.exports = {
    transporter,
    gmailTransporter,
    
    // Template email OTP
    getOtpEmailTemplate: (otpCode, purpose = 'xác thực') => {
        const purposes = {
            'register': 'đăng ký tài khoản',
            'reset': 'đặt lại mật khẩu',
            'login': 'đăng nhập'
        };
        
        const purposeText = purposes[purpose] || purpose;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); 
                 color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-code { 
            background: #fff; 
            border: 2px dashed #1e3c72;
            padding: 20px; 
            text-align: center; 
            font-size: 32px; 
            font-weight: bold; 
            color: #1e3c72;
            letter-spacing: 5px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #666; 
            font-size: 12px; 
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .purpose { color: #1e3c72; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⚽ FootballStore</div>
            <div>Mã OTP ${purposeText}</div>
        </div>
        
        <div class="content">
            <p>Xin chào,</p>
            <p>Bạn đang thực hiện thao tác <span class="purpose">${purposeText}</span> trên FootballStore.</p>
            
            <p>Mã OTP của bạn là:</p>
            
            <div class="otp-code">
                ${otpCode}
            </div>
            
            <p><strong>Mã có hiệu lực trong 5 phút.</strong></p>
            
            <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            
            <p>Trân trọng,<br>
            <strong>Đội ngũ FootballStore</strong></p>
        </div>
        
        <div class="footer">
            <p>Đây là email tự động, vui lòng không trả lời.</p>
            <p>© 2024 FootballStore. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;
    }
};