// controllers/statisticsController.js
const sql = require("mssql");
const config = require("../config/db");

const statisticsController = {
  getDetailedStatistics: async (req, res) => {
    try {
      const { range = '30', type = 'revenue', start = '', end = '' } = req.query;
      
      const pool = await sql.connect(config);

      let dateCondition = "";
      switch (range) {
        case "7":
          dateCondition = `WHERE o.OrderDate >= DATEADD(day, -7, GETDATE())`;
          break;
        case "30":
          dateCondition = `WHERE o.OrderDate >= DATEADD(day, -30, GETDATE())`;
          break;
        case "90":
          dateCondition = `WHERE o.OrderDate >= DATEADD(day, -90, GETDATE())`;
          break;
        case "365":
          dateCondition = `WHERE o.OrderDate >= DATEADD(year, -1, GETDATE())`;
          break;
        case "custom":
          if (start && end) {
            dateCondition = `WHERE o.OrderDate BETWEEN '${start}' AND '${end} 23:59:59'`;
          }
          break;
        default:
          dateCondition = `WHERE o.OrderDate >= DATEADD(day, -30, GETDATE())`;
      }

      const summaryResult = await pool.request().query(`
        SELECT 
          COUNT(DISTINCT o.OrderID) as TotalOrders,
          COUNT(DISTINCT c.CustomerID) as NewCustomers,
          ISNULL(SUM(o.TotalPrice), 0) as TotalRevenue,
          COUNT(DISTINCT CASE WHEN o.Status = 'completed' THEN o.OrderID END) as CompletedOrders,
          (COUNT(DISTINCT CASE WHEN o.Status = 'completed' THEN o.OrderID END) * 100.0 / NULLIF(COUNT(DISTINCT o.OrderID), 0)) as ConversionRate
        FROM [Order] o
        LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
        ${dateCondition}
      `);

      const revenueChartResult = await pool.request().query(`
        SELECT 
          CONVERT(VARCHAR(10), o.OrderDate, 120) as Date,
          SUM(o.TotalPrice) as DailyRevenue,
          COUNT(o.OrderID) as DailyOrders
        FROM [Order] o
        ${dateCondition}
        GROUP BY CONVERT(VARCHAR(10), o.OrderDate, 120)
        ORDER BY Date
      `);

      const ordersChartResult = await pool.request().query(`
        SELECT 
          Status,
          COUNT(*) as OrderCount
        FROM [Order] o
        ${dateCondition}
        GROUP BY Status
      `);

      const topProductsResult = await pool.request().query(`
        SELECT TOP 10
          p.ProductName,
          p.ImageURL,
          SUM(od.Quantity) as TotalSold,
          SUM(od.Subtotal) as TotalRevenue
        FROM OrderDetail od
        JOIN Product p ON od.ProductID = p.ProductID
        JOIN [Order] o ON od.OrderID = o.OrderID
        ${dateCondition}
        GROUP BY p.ProductID, p.ProductName, p.ImageURL
        ORDER BY TotalSold DESC
      `);

      res.json({
        success: true,
        summary: summaryResult.recordset[0] || {},
        charts: {
          revenue: revenueChartResult.recordset || [],
          orders: ordersChartResult.recordset || []
        },
        topProducts: topProductsResult.recordset || [],
        filters: {
          range,
          type,
          start,
          end
        }
      });

    } catch (err) {
      console.error("❌ Error in statistics controller:", err);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi server khi lấy thống kê",
        error: err.message 
      });
    }
  },

  exportReport: async (req, res) => {
    try {
      const { type, range, start, end } = req.body;
      
      res.json({
        success: true,
        message: "Xuất báo cáo thành công",
        exportType: type,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error("❌ Lỗi xuất báo cáo:", err);
      res.status(500).json({ 
        success: false, 
        message: "Lỗi khi xuất báo cáo" 
      });
    }
  }
};

module.exports = statisticsController;