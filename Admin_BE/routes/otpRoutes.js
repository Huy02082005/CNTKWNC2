const express = require('express');
const sql = require('mssql');
const router = express.Router();
const { transporter, getOtpEmailTemplate } = require('../config/emailConfig');

// 1. Gửi OTP qua email (dùng mailtrap)
router.post('/send', async (req, res) => {
    try {
        const { email, purpose = 'register' } = req.body;

        if (!email) {
            return res.json({
                success: false,
                message: 'Vui lòng nhập email'
            });
        }

        const pool = req.app.locals.db;
        
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi kết nối database'
            });
        }

        console.log(`📧 Gửi OTP đến: ${email}, mục đích: ${purpose}`);

        // Gọi stored procedure tạo OTP
        const otpResult = await pool.request()
            .input('email', sql.NVarChar(255), email)
            .execute('CreateSimpleOTP');

        const otpCode = otpResult.recordset[0]?.OTP;
        
        if (!otpCode) {
            throw new Error('Không thể tạo OTP');
        }

        console.log(`✅ Đã tạo OTP: ${otpCode}`);

        // Gửi email qua Mailtrap
        try {
            const mailOptions = {
                from: '"FootballStore" <no-reply@footballstore.com>',
                to: email,
                subject: `Mã OTP ${purpose} - FootballStore`,
                html: getOtpEmailTemplate(otpCode, purpose)
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`📧 Email đã gửi: ${info.messageId}`);
            console.log(`📧 Preview URL: https://mailtrap.io/inboxes/your_inbox_id/messages/${info.messageId}`);

        } catch (emailError) {
            console.error('❌ Lỗi gửi email:', emailError);
            // Vẫn tiếp tục cho đồ án, có thể log OTP ra console
        }

        // Trả về kết quả (trong môi trường dev có thể trả về OTP)
        const response = {
            success: true,
            message: 'Đã gửi mã OTP qua email',
            expiresIn: 300 // 5 phút
        };

        // Trong development, trả về OTP để test
        if (process.env.NODE_ENV !== 'production') {
            response.otpCode = otpCode;
            response.testInfo = 'Kiểm tra email trên mailtrap.io';
        }

        res.json(response);

    } catch (error) {
        console.error('❌ Lỗi gửi OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi: ' + error.message
        });
    }
});

// 2. Xác thực OTP
router.post('/verify', async (req, res) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode) {
            return res.json({
                success: false,
                message: 'Vui lòng nhập email và mã OTP',
                isValid: false
            });
        }

        console.log(`🔐 Xác thực OTP: ${email} - ${otpCode}`);

        const pool = req.app.locals.db;
        
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi kết nối database',
                isValid: false
            });
        }

        // Gọi stored procedure
        const result = await pool.request()
            .input('email', sql.NVarChar(255), email)
            .input('otpCode', sql.NVarChar(10), otpCode)
            .execute('VerifySimpleOTP');

        // FIX QUAN TRỌNG: SQL bit có thể là 0/1 hoặc true/false
        const sqlIsValid = result.recordset[0]?.IsValid;
        const message = result.recordset[0]?.Message;

        console.log(`📊 SQL trả về: IsValid = ${sqlIsValid}, type = ${typeof sqlIsValid}`);

        // Chuyển đổi đúng cách
        let isValidBool;
        
        if (typeof sqlIsValid === 'boolean') {
            isValidBool = sqlIsValid;  // true/false
        } else if (typeof sqlIsValid === 'number') {
            isValidBool = sqlIsValid === 1;  // 0/1
        } else if (sqlIsValid === 'true' || sqlIsValid === '1') {
            isValidBool = true;
        } else if (sqlIsValid === 'false' || sqlIsValid === '0') {
            isValidBool = false;
        } else {
            // Mặc định
            isValidBool = Boolean(sqlIsValid);
        }

        console.log(`✅ Chuyển thành: ${isValidBool}`);

        res.json({
            success: isValidBool,  // success phải bằng isValid
            message: message,
            isValid: isValidBool
        });

    } catch (error) {
        console.error('❌ Lỗi xác thực OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message,
            isValid: false
        });
    }
});

// 3. Kiểm tra OTP hiện tại (cho dev)
router.post('/check', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({
                success: false,
                message: 'Vui lòng nhập email'
            });
        }

        const pool = req.app.locals.db;
        
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi kết nối database'
            });
        }

        const result = await pool.request()
            .input('email', sql.NVarChar(255), email)
            .execute('GetCurrentOTP');

        if (result.recordset.length > 0) {
            const otpInfo = result.recordset[0];
            res.json({
                success: true,
                otpCode: otpInfo.OTPCode,
                expiresAt: otpInfo.ExpiryTime,
                isUsed: otpInfo.IsUsed === 1,
                isValid: otpInfo.IsValid === 1,
                expiresIn: Math.max(0, Math.floor((new Date(otpInfo.ExpiryTime) - new Date()) / 1000))
            });
        } else {
            res.json({
                success: true,
                message: 'Không có OTP nào cho email này'
            });
        }

    } catch (error) {
        console.error('❌ Lỗi kiểm tra OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
});

// 4. Test email (cho buổi bảo vệ)
router.post('/test-email', async (req, res) => {
    try {
        const { email = 'test@example.com' } = req.body;
        
        const testOTP = '123456';
        
        const mailOptions = {
            from: '"FootballStore" <no-reply@footballstore.com>',
            to: email,
            subject: '📧 Test Email OTP - FootballStore',
            html: getOtpEmailTemplate(testOTP, 'test')
        };

        const info = await transporter.sendMail(mailOptions);
        
        res.json({
            success: true,
            message: 'Đã gửi test email',
            messageId: info.messageId,
            previewUrl: `https://mailtrap.io/inboxes/your_inbox_id/messages/${info.messageId}`,
            note: 'Kiểm tra inbox trên mailtrap.io'
        });

    } catch (error) {
        console.error('❌ Lỗi test email:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi: ' + error.message
        });
    }
});

module.exports = router;