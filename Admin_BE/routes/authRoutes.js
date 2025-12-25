const express = require('express');
const sql = require('mssql');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {    
    const { username, password } = req.body;

    const pool = req.app.locals.db;
    
    if (!pool) {
      return res.status(500).json({ message: "Database chưa kết nối" });
    }

    const result = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT AccountID, Username, Password, IsSuperAdmin, Status FROM Account WHERE Username = @username');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }

    const user = result.recordset[0];
    
    if (password !== user.Password) {
      return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
    }
    
    if (!user.Status) {
      return res.status(403).json({ message: "Tài khoản đã bị khóa" });
    }

    res.cookie('user_data', JSON.stringify({
      id: user.AccountID,
      username: user.Username,
      isSuperAdmin: Boolean(user.IsSuperAdmin)
    }), {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'lax'
    });
    
    res.json({ 
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.AccountID,
        username: user.Username,
        isSuperAdmin: Boolean(user.IsSuperAdmin)
      }
    });

  } catch (error) {
    console.error('❌ Lỗi đăng nhập:', error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server: " + error.message 
    });
  }
});

router.get('/check', (req, res) => {
  try {
    const userDataCookie = req.cookies.user_data;
    
    if (!userDataCookie) {
      return res.json({ 
        authenticated: false 
      });
    }
    
    const user = JSON.parse(userDataCookie);
    
    res.json({
      authenticated: true,
      user: user
    });
    
  } catch (error) {
    console.error('Check auth error:', error);
    res.json({ 
      authenticated: false 
    });
  }
});

router.post('/logout', (req, res) => {
  // Xóa cookies
  res.clearCookie('user_data');
  res.json({ 
    success: true, 
    message: "Đã đăng xuất" 
  });
});

router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📧 Check email:", email);

    const pool = req.app.locals.db;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database chưa kết nối' });
    }
    
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT Username, IsSuperAdmin FROM Account WHERE Email = @email');

    console.log("📊 Email check result:", result.recordset);

    const exists = result.recordset.length > 0;
    
    res.json({ 
      exists: exists,
      message: exists ? 'Email tồn tại' : 'Email không tồn tại'
    });

  } catch (error) {
    console.error('❌ Lỗi check email:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
 
    const pool = req.app.locals.db;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database chưa kết nối' });
    }

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('newPassword', sql.VarChar, newPassword)
      .query('UPDATE Account SET Password = @newPassword WHERE Email = @email');
    
    if (result.rowsAffected[0] > 0) {
      res.json({ 
        success: true, 
        message: 'Đặt lại mật khẩu thành công' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy tài khoản' 
      });
    }
  } catch (error) {
    console.error('❌ Lỗi reset password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
});

module.exports = router;