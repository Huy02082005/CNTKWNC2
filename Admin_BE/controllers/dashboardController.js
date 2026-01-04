const sql = require("mssql");
const config = require("../config/db");

const dashboardController = {
  getDashboardStats: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const statsResult = await pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM Product WHERE Status = 'active') as TotalProducts,
          (SELECT COUNT(*) FROM [Order]) as TotalOrders,
          (SELECT COUNT(*) FROM Customer WHERE Status = 1) as TotalCustomers,
          (SELECT ISNULL(SUM(TotalPrice), 0) FROM [Order] WHERE Status = 'completed') as TotalRevenue,
          (SELECT COUNT(*) FROM [Order] WHERE Status = 'pending') as PendingOrders,
          (SELECT COUNT(*) FROM Product WHERE StockQuantity = 0 AND Status = 'active') as OutOfStockProducts
      `);

      res.json({
        success: true,
        data: {
          totalProducts: statsResult.recordset[0].TotalProducts,
          totalOrders: statsResult.recordset[0].TotalOrders,
          totalCustomers: statsResult.recordset[0].TotalCustomers,
          totalRevenue: statsResult.recordset[0].TotalRevenue,
          pendingOrders: statsResult.recordset[0].PendingOrders,
          outOfStockProducts: statsResult.recordset[0].OutOfStockProducts
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi server khi lấy thống kê dashboard" 
      });
    }
  },

  // THÊM METHOD NÀY - Lấy đơn hàng gần đây
  getRecentOrders: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const pool = await sql.connect(config);
      
      const result = await pool.request().query(`
        SELECT TOP (${limit})
          o.OrderID,
          o.OrderDate,
          o.TotalPrice,
          o.Status,
          c.FullName,
          c.Email,
          c.Phone,
          c.CustomerID
        FROM [Order] o
        LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
        WHERE c.Status = 1
        ORDER BY o.OrderDate DESC
      `);

      res.json({
        success: true,
        data: result.recordset,
        total: result.recordset.length
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi server khi lấy đơn hàng gần đây" 
      });
    }
  },

  // THÊM METHOD NÀY - Lấy khách hàng mới
  getRecentCustomers: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 3;
      const pool = await sql.connect(config);
      
      const result = await pool.request().query(`
        SELECT TOP (${limit})
          CustomerID,
          FullName,
          Email,
          Phone,
          RegisterDate,
          Status
        FROM Customer
        WHERE Status = 1
        ORDER BY RegisterDate DESC
      `);

      res.json({
        success: true,
        data: result.recordset,
        total: result.recordset.length
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi server khi lấy khách hàng mới" 
      });
    }
  }
};

module.exports = dashboardController;