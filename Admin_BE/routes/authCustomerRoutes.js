const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Đăng nhập khách hàng
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    console.log('🔐 Đăng nhập khách hàng:', { email });

    const pool = req.app.locals.db;
    
    if (!pool) {
      console.error('❌ Database not connected');
      return res.status(500).json({
        success: false,
        message: 'Lỗi kết nối cơ sở dữ liệu'
      });
    }

    // Tìm khách hàng theo email
    const result = await pool.request()
      .input('email', sql.NVarChar(100), email)
      .query(`
        SELECT CustomerID, FullName, Email, Phone, Password, Status
        FROM Customer 
        WHERE Email = @email
      `);

    console.log('📊 Kết quả truy vấn:', result.recordset.length, 'kết quả');

    if (result.recordset.length === 0) {
      return res.json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const customer = result.recordset[0];

    // Check mật khẩu (plain text so sánh trực tiếp)
    if (password !== customer.Password) {
      return res.json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check trạng thái tài khoản
    if (customer.Status !== true && customer.Status !== 1) {
      return res.json({
        success: false,
        message: 'Tài khoản đã bị khóa'
      });
    }

    // Cập nhật last login
    await pool.request()
      .input('customerID', sql.Int, customer.CustomerID)
      .query('UPDATE Customer SET LastLogin = GETDATE() WHERE CustomerID = @customerID');

    // Tạo session/cookie
    res.cookie('customer_data', JSON.stringify({
      id: customer.CustomerID,
      name: customer.FullName,
      email: customer.Email,
      phone: customer.Phone
    }), {
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      httpOnly: false,
      sameSite: 'lax'
    });

    console.log('✅ Đăng nhập thành công cho:', customer.Email);

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      customer: {
        id: customer.CustomerID,
        name: customer.FullName,
        email: customer.Email,
        phone: customer.Phone
      }
    });

  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// Đăng ký khách hàng
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Validate input đơn giản
    if (!fullName || !email || !phone || !password) {
      return res.json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    console.log('📝 Đăng ký khách hàng:', { email, phone });

    const pool = req.app.locals.db;
    
    if (!pool) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi kết nối cơ sở dữ liệu'
      });
    }

    // Check if email already exists
    const emailCheck = await pool.request()
      .input('email', sql.NVarChar(100), email)
      .query('SELECT CustomerID FROM Customer WHERE Email = @email');

    if (emailCheck.recordset.length > 0) {
      return res.json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Insert new customer (không hash password cho đơn giản)
    const result = await pool.request()
      .input('fullName', sql.NVarChar(100), fullName)
      .input('email', sql.NVarChar(100), email)
      .input('phone', sql.NVarChar(20), phone)
      .input('password', sql.NVarChar(255), password)
      .query(`
        INSERT INTO Customer (FullName, Email, Phone, Password, Status, RegisterDate)
        OUTPUT INSERTED.CustomerID, INSERTED.FullName, INSERTED.Email, INSERTED.Phone
        VALUES (@fullName, @email, @phone, @password, 1, GETDATE())
      `);

    // Tạo giỏ hàng cho khách hàng
    await pool.request()
      .input('customerID', sql.Int, result.recordset[0].CustomerID)
      .query('INSERT INTO Cart (CustomerID, CreateDate) VALUES (@customerID, GETDATE())');

    // Tạo session/cookie cho customer
    res.cookie('customer_data', JSON.stringify({
      id: result.recordset[0].CustomerID,
      name: result.recordset[0].FullName,
      email: result.recordset[0].Email,
      phone: result.recordset[0].Phone
    }), {
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      httpOnly: false,
      sameSite: 'lax'
    });

    console.log('✅ Đăng ký thành công cho:', email);

    res.json({
      success: true,
      message: 'Đăng ký thành công!',
      customer: result.recordset[0]
    });

  } catch (error) {
    console.error('❌ Lỗi đăng ký:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
});

// Kiểm tra khách hàng đã đăng nhập chưa
router.get('/check', (req, res) => {
  try {
    const customerCookie = req.cookies.customer_data;
    
    if (!customerCookie) {
      return res.json({
        authenticated: false
      });
    }
    
    const customer = JSON.parse(customerCookie);
    
    res.json({
      authenticated: true,
      customer: customer
    });
    
  } catch (error) {
    console.error('❌ Lỗi check auth:', error);
    res.json({
      authenticated: false
    });
  }
});

// Đăng xuất khách hàng
router.post('/logout', (req, res) => {
  res.clearCookie('customer_data');
  res.json({
    success: true,
    message: 'Đã đăng xuất'
  });
});

module.exports = router;