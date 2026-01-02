const sql = require("mssql");
const config = require("../config/db");

const customerController = {
  getAllCustomers: async (req, res) => {
    try {     
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT 
          CustomerID,
          FullName,
          Email, 
          Phone,
          Address,
          RegisterDate,
          Status as AccountStatus
        FROM Customer
        ORDER BY RegisterDate DESC
      `);

      res.json(result.recordset);
      
    } catch (err) {
      console.error("💥 Error in getAllCustomers:", err);
      res.status(500).json({ message: "Lỗi server: " + err.message });
    }
  },

  getCustomerStats: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT 
          COUNT(*) as TotalCustomers,
          COUNT(CASE WHEN Status = 0 THEN 1 END) as InactiveAccounts,
          FORMAT(MAX(RegisterDate), 'dd/MM/yyyy') as LatestRegistration
        FROM Customer
      `);
      res.json(result.recordset[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  createCustomer: async (req, res) => {
    try {
      const { FullName, Email, Phone, Address } = req.body;

      const pool = await sql.connect(config);

      const checkEmail = await pool.request()
        .input('Email', sql.NVarChar, Email)
        .query('SELECT CustomerID FROM Customer WHERE Email = @Email');
      
      if (checkEmail.recordset.length > 0) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }

      // SỬA: Thêm Password cho Customer
      const customerResult = await pool.request()
        .input('FullName', sql.NVarChar, FullName)
        .input('Email', sql.NVarChar, Email)
        .input('Phone', sql.NVarChar, Phone)
        .input('Address', sql.NVarChar, Address)
        .input('Password', sql.NVarChar, '123456')
        .query(`
          INSERT INTO Customer (FullName, Email, Phone, Address, Password, RegisterDate)
          OUTPUT INSERTED.*
          VALUES (@FullName, @Email, @Phone, @Address, @Password, GETDATE())
        `);

      const newCustomer = customerResult.recordset[0];

      res.status(201).json({
        message: "Thêm khách hàng thành công",
        customer: newCustomer
      });

    } catch (err) {
      console.error("💥 Lỗi trong createCustomer:", err);
      res.status(500).json({ 
        message: "Lỗi server: " + err.message 
      });
    }
  },

  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const { FullName, Email, Phone, Address } = req.body;

      const pool = await sql.connect(config);
      
      // SỬA: Chỉ cập nhật thông tin cơ bản
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('FullName', sql.NVarChar, FullName)
        .input('Email', sql.NVarChar, Email)
        .input('Phone', sql.NVarChar, Phone)
        .input('Address', sql.NVarChar, Address)
        .query(`
          UPDATE Customer 
          SET FullName = @FullName, 
              Email = @Email, 
              Phone = @Phone, 
              Address = @Address
          WHERE CustomerID = @id
        `);

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Không tìm thấy khách hàng" });
      }

      res.json({ message: "Cập nhật khách hàng thành công" });

    } catch (err) {
      console.error("💥 Lỗi trong updateCustomer:", err);
      res.status(500).json({ message: "Lỗi server: " + err.message });
    }
  },

  deleteCustomer: async (req, res) => {
    try {
      const { id } = req.params;

      const pool = await sql.connect(config);

      const userCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT CustomerID FROM Customer WHERE CustomerID = @id');
      
      if (userCheck.recordset.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy khách hàng" });
      }

      // Xóa dữ liệu liên quan
      const deleteOrderDetail = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          DELETE od 
          FROM OrderDetail od
          INNER JOIN [Order] o ON od.OrderID = o.OrderID
          WHERE o.CustomerID = @id
        `);

      const deleteOrder = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM [Order] WHERE CustomerID = @id');

      const deleteCart = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Cart WHERE CustomerID = @id');

      const deleteCustomer = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Customer WHERE CustomerID = @id');

      res.json({ 
        message: "Xóa khách hàng thành công",
        deleted: true 
      });

    } catch (err) {
      console.error("💥 DELETE CUSTOMER ERROR:", err);
    
      if (err.message.includes('REFERENCE constraint')) {
        return res.status(500).json({ 
          message: "Không thể xóa khách hàng vì còn dữ liệu liên quan trong hệ thống." 
        });
      }
      
      res.status(500).json({ 
        message: "Lỗi server: " + err.message 
      });
    }
  }
};

module.exports = customerController;