const sql = require("mssql");
const config = require("../config/db");

const dashboardController = {
  getDashboardStats: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const statsResult = await pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM Product) as TotalProducts,
          (SELECT COUNT(*) FROM [Order]) as TotalOrders,
          (SELECT COUNT(*) FROM Customer) as TotalCustomers,
          (SELECT ISNULL(SUM(TotalPrice), 0) FROM [Order] WHERE Status = 'completed') as TotalRevenue,
          (SELECT COUNT(*) FROM [Order] WHERE Status = 'pending') as PendingOrders,
          (SELECT COUNT(*) FROM Product WHERE StockQuantity = 0) as OutOfStockProducts
      `);

      // Doanh thu theo tháng
      const revenueResult = await pool.request().query(`
        SELECT 
          FORMAT(OrderDate, 'yyyy-MM') as Month,
          SUM(TotalPrice) as Revenue
        FROM [Order] 
        WHERE Status = 'completed'
        GROUP BY FORMAT(OrderDate, 'yyyy-MM')
        ORDER BY Month DESC
      `);

      // Sản phẩm bán chạy
      const topProductsResult = await pool.request().query(`
        SELECT TOP 5
          p.ProductName,
          SUM(od.Quantity) as TotalSold,
          SUM(od.Subtotal) as TotalRevenue
        FROM OrderDetail od
        JOIN Product p ON od.ProductID = p.ProductID
        JOIN [Order] o ON od.OrderID = o.OrderID
        WHERE o.Status = 'completed'
        GROUP BY p.ProductID, p.ProductName
        ORDER BY TotalSold DESC
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
        },
        monthlyRevenue: revenueResult.recordset,
        topProducts: topProductsResult.recordset
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi server khi lấy thống kê dashboard" 
      });
    }
  }
};

module.exports = dashboardController;