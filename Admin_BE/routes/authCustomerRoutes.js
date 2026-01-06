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

router.post('/check-email-exists', async (req, res) => {
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

        // Kiểm tra trong Customer table
        const result = await pool.request()
            .input('email', sql.NVarChar(100), email)
            .query(`
                SELECT 
                    CustomerID,
                    FullName,
                    Email,
                    Phone,
                    Status,
                    RegisterDate
                FROM Customer 
                WHERE Email = @email
            `);

        const exists = result.recordset.length > 0;
        
        res.json({
            success: true,
            exists: exists,
            message: exists ? 'Email tồn tại trong hệ thống' : 'Email không tồn tại',
            customer: exists ? result.recordset[0] : null
        });

    } catch (error) {
        console.error('❌ Lỗi kiểm tra email:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
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

// Lấy thông tin profile khách hàng
router.get('/profile/:id', async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        
        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({
                success: false,
                message: 'ID khách hàng không hợp lệ'
            });
        }

        console.log('📋 Fetching profile for customer ID:', customerId);

        const pool = req.app.locals.db;
        
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi kết nối cơ sở dữ liệu'
            });
        }

        // Truy vấn thông tin khách hàng
        const result = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query(`
                SELECT 
                    CustomerID,
                    FullName,
                    Email,
                    Phone,
                    Address,
                    CONVERT(varchar, RegisterDate, 120) as RegisterDate,
                    CONVERT(varchar, LastLogin, 120) as LastLogin,
                    Status
                FROM Customer 
                WHERE CustomerID = @customerId
            `);

        console.log('📊 Profile query result:', result.recordset.length, 'records');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin khách hàng'
            });
        }

        const customer = result.recordset[0];
        
        res.json({
            success: true,
            message: 'Lấy thông tin thành công',
            customer: {
                CustomerID: customer.CustomerID,
                FullName: customer.FullName,
                Email: customer.Email,
                Phone: customer.Phone,
                Address: customer.Address,
                RegisterDate: customer.RegisterDate,
                LastLogin: customer.LastLogin,
                Status: customer.Status
            }
        });

    } catch (error) {
        console.error('❌ Lỗi lấy thông tin profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
});

// Cập nhật thông tin profile
router.put('/update/:id', async (req, res) => {
    try {
        const customerId = parseInt(req.params.id);
        const { FullName, Email, Phone, Address } = req.body;

        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({
                success: false,
                message: 'ID khách hàng không hợp lệ'
            });
        }

        console.log('📝 Updating profile for customer ID:', customerId);
        console.log('Update data:', { FullName, Email, Phone, Address });

        const pool = req.app.locals.db;
        
        if (!pool) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi kết nối cơ sở dữ liệu'
            });
        }

        // Kiểm tra email có trùng không (nếu thay đổi email)
        if (Email && Email !== req.body.originalEmail) {
            const emailCheck = await pool.request()
                .input('email', sql.NVarChar(100), Email)
                .input('customerId', sql.Int, customerId)
                .query(`
                    SELECT CustomerID FROM Customer 
                    WHERE Email = @email AND CustomerID != @customerId
                `);
            
            if (emailCheck.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng bởi tài khoản khác'
                });
            }
        }

        // Cập nhật thông tin - CHỈ các trường cơ bản
        const updateQuery = `
            UPDATE Customer 
            SET 
                FullName = @fullName,
                Email = @email,
                Phone = @phone,
                Address = @address
            WHERE CustomerID = @customerId
        `;
        
        await pool.request()
            .input('fullName', sql.NVarChar(100), FullName)
            .input('email', sql.NVarChar(100), Email)
            .input('phone', sql.NVarChar(20), Phone)
            .input('address', sql.NVarChar(255), Address)
            .input('customerId', sql.Int, customerId)
            .query(updateQuery);

        console.log('✅ Profile updated successfully');

        // Lấy thông tin mới để trả về
        const getQuery = `
            SELECT 
                CustomerID,
                FullName,
                Email,
                Phone,
                Address,
                CONVERT(varchar, RegisterDate, 120) as RegisterDate,
                CONVERT(varchar, LastLogin, 120) as LastLogin,
                Status
            FROM Customer 
            WHERE CustomerID = @customerId
        `;
        
        const result = await pool.request()
            .input('customerId', sql.Int, customerId)
            .query(getQuery);

        const updatedCustomer = result.recordset[0];
        
        // Cập nhật LastLogin cho lần update này (tùy chọn)
        await pool.request()
            .input('customerId', sql.Int, customerId)
            .query('UPDATE Customer SET LastLogin = GETDATE() WHERE CustomerID = @customerId');

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            customer: updatedCustomer
        });

    } catch (error) {
        console.error('❌ Lỗi cập nhật profile:', error);
        
        // Kiểm tra lỗi cụ thể
        let errorMessage = 'Lỗi server';
        
        if (error.message.includes('Invalid column name')) {
            errorMessage = 'Lỗi database: Cột không tồn tại trong bảng';
        } else if (error.message.includes('Cannot insert duplicate key')) {
            errorMessage = 'Email đã được sử dụng';
        } else if (error.message.includes('String or binary data would be truncated')) {
            errorMessage = 'Dữ liệu quá dài cho một trong các trường';
        } else {
            errorMessage = error.message;
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});
module.exports = router;