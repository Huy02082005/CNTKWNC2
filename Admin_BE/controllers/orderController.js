const sql = require("mssql");
const config = require("../config/db");

const orderController = {
  getAllOrders: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query(`
        SELECT o.*, c.FullName, c.Email, c.Phone
        FROM [Order] o
        LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
        ORDER BY o.OrderDate DESC
      `);
      res.json(result.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

getOrderDetail: async (req, res) => {
  try {
    console.log("=== GET ORDER DETAIL ===");
    console.log("Order ID:", req.params.id);
    
    const { id } = req.params;
    if (!id || isNaN(id)) {
      console.log("❌ Invalid order ID");
      return res.status(400).json({ 
        success: false,
        message: "ID đơn hàng không hợp lệ" 
      });
    }

    const pool = await sql.connect(config);
    console.log("✅ Database connected");

    // Get order info - ĐƠN GIẢN HÓA QUERY TRƯỚC
    console.log("📦 Querying order info...");
    const orderResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT TOP 1 
          o.OrderID,
          o.CustomerID,
          o.TotalPrice,
          o.Status,
          o.OrderDate,
          o.ShippingAddress,
          o.PaymentMethod,
          o.Note,
          o.ShippingFee,
          o.DiscountAmount,
          c.FullName,
          c.Email,
          c.Phone,
          c.Address as CustomerAddress
        FROM [Order] o
        LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
        WHERE o.OrderID = @id
      `);

    console.log("📊 Order result rows:", orderResult.recordset.length);

    if (orderResult.recordset.length === 0) {
      console.log("❌ Order not found");
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy đơn hàng" 
      });
    }

    // Get order details - ĐƠN GIẢN HÓA
    console.log("📋 Querying order details...");
    const detailResult = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT 
          od.OrderDetailID,
          od.ProductID,
          od.Quantity,
          od.UnitPrice,
          od.Discount,
          od.SizeID,
          p.ProductName,
          p.ImageURL
        FROM OrderDetail od
        LEFT JOIN Product p ON od.ProductID = p.ProductID
        WHERE od.OrderID = @id
      `);

    console.log("📊 Detail result rows:", detailResult.recordset.length);

    // Fix image URLs - ĐƠN GIẢN
    const fixedDetails = detailResult.recordset.map((item, index) => {
      console.log(`🖼️ Item ${index} ImageURL:`, item.ImageURL);
      
      let imageUrl = item.ImageURL || '';
      
      if (imageUrl && imageUrl.startsWith('image/')) {
        imageUrl = '/' + imageUrl;
      } else if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
        imageUrl = '/image/' + imageUrl;
      } else if (!imageUrl) {
        imageUrl = '/image/default-product.jpg';
      }
      
      return {
        OrderID: id,
        ProductID: item.ProductID,
        ProductName: item.ProductName || 'Sản phẩm',
        Quantity: item.Quantity || 1,
        UnitPrice: item.UnitPrice || 0,
        Price: item.UnitPrice || 0, // Alias
        Discount: item.Discount || 0,
        SizeID: item.SizeID,
        ImageURL: imageUrl
      };
    });

    console.log("✅ Successfully processed order details");

    res.json({
      success: true,
      order: orderResult.recordset[0],
      orderDetails: fixedDetails
    });

  } catch (err) {
    console.error("❌❌❌ ERROR in getOrderDetail:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error code:", err.code);
    console.error("Error number:", err.number);
    console.error("Error stack:", err.stack);
    
    // Log thêm thông tin SQL nếu có
    if (err.originalError) {
      console.error("Original error:", err.originalError);
    }
    
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn hàng",
      error: err.message
    });
  }
},

  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { Status } = req.body;

      const validStatuses = ['pending', 'paid', 'shipping', 'completed', 'cancelled'];
      
      if (!Status) {
        return res.status(400).json({ message: "Thiếu trường Status" });
      }

      if (!validStatuses.includes(Status)) {
        return res.status(400).json({ 
          message: "Trạng thái không hợp lệ",
          validStatuses: validStatuses,
          receivedStatus: Status
        });
      }

      const pool = await sql.connect(config);

      const checkResult = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query('SELECT OrderID, Status FROM [Order] WHERE OrderID = @id');

      if (checkResult.recordset.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
      }

      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .input('Status', sql.NVarChar(50), Status)
        .query(`
          UPDATE [Order] 
          SET Status = @Status
          WHERE OrderID = @id
        `);

      res.json({ 
        message: "Cập nhật trạng thái thành công",
        orderId: id,
        newStatus: Status 
      });

    } catch (err) {
      console.error("❌ SERVER ERROR in updateOrderStatus:");
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      
      res.status(500).json({ 
        message: "Lỗi server khi cập nhật trạng thái",
        error: err.message
      });
    }
  },

  getOrderStats: async (req, res) => {
    try {
      const pool = await sql.connect(config);

      const totalResult = await pool.request().query(`
        SELECT COUNT(*) as TotalOrders FROM [Order]
      `);

      const statusResult = await pool.request().query(`
        SELECT 
          COUNT(CASE WHEN Status IN ('pending', 'processing') THEN 1 END) as PendingOrders,
          COUNT(CASE WHEN Status = 'shipping' THEN 1 END) as ShippingOrders,
          COUNT(CASE WHEN Status IN ('completed', 'delivered') THEN 1 END) as CompletedOrders
        FROM [Order]
      `);

      const revenueResult = await pool.request().query(`
        SELECT ISNULL(SUM(TotalPrice), 0) as TotalRevenue 
        FROM [Order] 
        WHERE Status IN ('completed', 'delivered')
      `);

      res.json({
        totalOrders: totalResult.recordset[0].TotalOrders,
        pendingOrders: statusResult.recordset[0].PendingOrders,
        shippingOrders: statusResult.recordset[0].ShippingOrders,
        completedOrders: statusResult.recordset[0].CompletedOrders,
        totalRevenue: revenueResult.recordset[0].TotalRevenue
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server khi lấy thống kê" });
    }
  },

  // Thêm function tạo đơn hàng mới
  createOrder: async (req, res) => {
    try {
      const {
        customer,
        items,
        payment,
        totals
      } = req.body;

      console.log("🛒 Creating new order:", { customer, items, totals });

      // Validate required data
      if (!customer || !items || !totals) {
        return res.status(400).json({ 
          message: "Thiếu thông tin đơn hàng" 
        });
      }

      const pool = await sql.connect(config);

      // Start transaction
      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        // 1. Check if customer exists or create new customer
        let customerId;
        
        // Try to find existing customer by email
        const customerCheck = await transaction.request()
          .input('email', sql.NVarChar(255), customer.email)
          .query('SELECT CustomerID FROM Customer WHERE Email = @email');
        
        if (customerCheck.recordset.length > 0) {
          customerId = customerCheck.recordset[0].CustomerID;
        } else {
          // Create new customer (không cần password cho guest checkout)
          const newCustomer = await transaction.request()
            .input('FullName', sql.NVarChar(255), customer.fullname)
            .input('Email', sql.NVarChar(255), customer.email)
            .input('Phone', sql.NVarChar(50), customer.phone)
            .input('Address', sql.NVarChar(500), 
              `${customer.address}, ${customer.district}, ${customer.city}`)
            .query(`
              INSERT INTO Customer (FullName, Email, Phone, Address, RegisterDate, Status)
              OUTPUT INSERTED.CustomerID
              VALUES (@FullName, @Email, @Phone, @Address, GETDATE(), 1)
            `);
          
          customerId = newCustomer.recordset[0].CustomerID;
        }

        // 2. Create order - CHÚ Ý: bảng là [Order] (có dấu [])
        const orderResult = await transaction.request()
          .input('CustomerID', sql.Int, customerId)
          .input('TotalPrice', sql.Decimal(12, 2), totals.total)
          .input('PaymentMethod', sql.NVarChar(50), payment || 'cod')
          .input('Status', sql.NVarChar(20), 'pending')
          .input('ShippingAddress', sql.NVarChar(500), 
            `${customer.address}, ${customer.district}, ${customer.city}`)
          .input('Note', sql.NVarChar(500), customer.note || '')
          .input('ShippingFee', sql.Decimal(12, 2), totals.shipping || 0)
          .input('DiscountAmount', sql.Decimal(12, 2), totals.discount || 0)
          .query(`
            INSERT INTO [Order] 
              (CustomerID, TotalPrice, PaymentMethod, Status, 
               ShippingAddress, Note, OrderDate, ShippingFee, DiscountAmount)
            OUTPUT INSERTED.OrderID
            VALUES (@CustomerID, @TotalPrice, @PaymentMethod, @Status, 
                    @ShippingAddress, @Note, GETDATE(), @ShippingFee, @DiscountAmount)
          `);

        const orderId = orderResult.recordset[0].OrderID;

        // 3. Insert order details
        for (const item of items) {
          // Validate item
          if (!item.productId && !item.id) {
            throw new Error(`Missing product ID for item: ${JSON.stringify(item)}`);
          }

          const productId = item.productId || item.id;
          const price = parseFloat(item.price) || 0;
          const quantity = parseInt(item.quantity) || 1;
          const sizeId = item.sizeId || null; // SizeID từ client
          const discount = parseFloat(item.discount) || 0;

          await transaction.request()
            .input('OrderID', sql.Int, orderId)
            .input('ProductID', sql.Int, productId)
            .input('SizeID', sql.Int, sizeId)
            .input('Quantity', sql.Int, quantity)
            .input('UnitPrice', sql.Decimal(12, 2), price)
            .input('Discount', sql.Decimal(5, 2), discount)
            .query(`
              INSERT INTO OrderDetail 
                (OrderID, ProductID, SizeID, Quantity, UnitPrice, Discount, CreatedDate)
              VALUES (@OrderID, @ProductID, @SizeID, @Quantity, @UnitPrice, @Discount, GETDATE())
            `);

          // 4. Optional: Update product stock if needed
          // Đây có thể thêm logic giảm stock sau
        }

        // Commit transaction
        await transaction.commit();

        console.log(`✅ Order created: #${orderId}`);

        res.status(201).json({
          success: true,
          message: "Đặt hàng thành công",
          orderId: orderId,
          data: {
            orderId: orderId,
            customerId: customerId,
            total: totals.total,
            status: 'pending'
          }
        });

      } catch (err) {
        // Rollback transaction on error
        await transaction.rollback();
        throw err;
      }

    } catch (err) {
      console.error("❌ Error creating order:", err);
      
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo đơn hàng",
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  },

  getCustomerOrders: async (req, res) => {
    try {
      const { customerId } = req.params;
      const { page = 1, status, search } = req.query;
      const pageSize = 10;
      const offset = (page - 1) * pageSize;

      const pool = await sql.connect(config);

      // Build query với filter
      let baseQuery = `
        FROM [Order] o
        LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
        WHERE o.CustomerID = @customerId
      `;

      let whereClauses = [];
      const params = [
        { name: 'customerId', type: sql.Int, value: parseInt(customerId) }
      ];

      // Filter by status
      if (status && status !== 'all') {
        whereClauses.push('o.Status = @status');
        params.push({ name: 'status', type: sql.NVarChar(20), value: status });
      }

      // Filter by search term
      if (search && search.trim() !== '') {
        whereClauses.push('(o.OrderID LIKE @search OR o.ShippingAddress LIKE @search)');
        params.push({ name: 'search', type: sql.NVarChar(255), value: `%${search}%` });
      }

      // Add where clauses to base query
      if (whereClauses.length > 0) {
        baseQuery += ' AND ' + whereClauses.join(' AND ');
      }

      // Get total count
      const countResult = await pool.request()
        .input('customerId', sql.Int, parseInt(customerId))
        .query(`
          SELECT COUNT(*) as totalCount 
          ${baseQuery}
        `);

      const totalCount = countResult.recordset[0].totalCount;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Get paginated orders
      const request = pool.request();
      params.forEach(param => {
        request.input(param.name, param.type, param.value);
      });

      const result = await request.query(`
        SELECT 
          o.*, 
          c.FullName, 
          c.Email, 
          c.Phone,
          (
            SELECT COUNT(*) 
            FROM OrderDetail od 
            WHERE od.OrderID = o.OrderID
          ) as ItemCount
        ${baseQuery}
        ORDER BY o.OrderDate DESC
        OFFSET @offset ROWS 
        FETCH NEXT @pageSize ROWS ONLY
      `);

      // Calculate pagination info
      const orders = result.recordset.map(order => ({
        ...order,
        StatusText: getStatusText(order.Status)
      }));

      res.json({
        success: true,
        orders: orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalOrders: totalCount,
          pageSize: pageSize
        }
      });

    } catch (err) {
      console.error('Error getting customer orders:', err);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách đơn hàng"
      });
    }
  },

  // 2. Lấy danh sách sản phẩm trong đơn hàng
  getOrderProducts: async (req, res) => {
    try {
      const { orderId } = req.params;

      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT 
            od.OrderDetailID,
            od.ProductID,
            od.Quantity,
            od.UnitPrice,
            od.Discount,
            p.ProductName,
            p.ImageURL,
            ps.SizeName,
            p.PlayerName,
            b.BrandName,
            cat.CategoryName
          FROM OrderDetail od
          LEFT JOIN Product p ON od.ProductID = p.ProductID
          LEFT JOIN ProductSize ps ON od.SizeID = ps.SizeID
          LEFT JOIN Brand b ON p.BrandID = b.BrandID
          LEFT JOIN Category cat ON p.CategoryID = cat.CategoryID
          WHERE od.OrderID = @orderId
          ORDER BY od.OrderDetailID
        `);

      // Fix image URLs
      const products = result.recordset.map(product => ({
        ...product,
        ImageURL: fixImageUrl(product.ImageURL)
      }));

      res.json({
        success: true,
        products: products
      });

    } catch (err) {
      console.error('Error getting order products:', err);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy sản phẩm đơn hàng"
      });
    }
  },

  // 3. Lấy chi tiết đầy đủ của đơn hàng
  getOrderFullDetail: async (req, res) => {
    try {
      const { orderId } = req.params;

      const pool = await sql.connect(config);

      // Lấy thông tin đơn hàng
      const orderResult = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT 
            o.*, 
            c.FullName, 
            c.Email, 
            c.Phone,
            c.Address
          FROM [Order] o
          LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
          WHERE o.OrderID = @orderId
        `);

      if (orderResult.recordset.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đơn hàng"
        });
      }

      const order = orderResult.recordset[0];

      // Lấy sản phẩm trong đơn hàng
      const productsResult = await pool.request()
        .input('orderId', sql.Int, orderId)
        .query(`
          SELECT 
            od.*,
            p.ProductName,
            p.ImageURL,
            ps.SizeName,
            p.PlayerName
          FROM OrderDetail od
          LEFT JOIN Product p ON od.ProductID = p.ProductID
          LEFT JOIN ProductSize ps ON od.SizeID = ps.SizeID
          WHERE od.OrderID = @orderId
        `);

      // Fix image URLs
      const products = productsResult.recordset.map(product => ({
        ...product,
        ImageURL: fixImageUrl(product.ImageURL)
      }));

      // Tính tổng các loại
      const orderTotal = parseFloat(order.TotalPrice) || 0;
      const shippingFee = parseFloat(order.ShippingFee) || 0;
      const discountAmount = parseFloat(order.DiscountAmount) || 0;
      const finalTotal = orderTotal + shippingFee - discountAmount;

      res.json({
        success: true,
        order: {
          ...order,
          StatusText: getStatusText(order.Status),
          FinalTotal: finalTotal
        },
        products: products,
        summary: {
          orderTotal: orderTotal,
          shippingFee: shippingFee,
          discountAmount: discountAmount,
          finalTotal: finalTotal
        }
      });

    } catch (err) {
      console.error('Error getting order full detail:', err);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy chi tiết đơn hàng"
      });
    }
  },

  // 4. Kiểm tra cập nhật đơn hàng từ thời điểm nhất định
  checkOrderUpdates: async (req, res) => {
    try {
      const { customerId } = req.params;
      const { since } = req.query;

      if (!since) {
        return res.status(400).json({
          success: false,
          message: "Thiếu tham số 'since'"
        });
      }

      const pool = await sql.connect(config);

      // Convert since to Date object
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Định dạng thời gian không hợp lệ"
        });
      }

      // Tìm các đơn hàng đã được cập nhật sau thời điểm 'since'
      const result = await pool.request()
        .input('customerId', sql.Int, customerId)
        .input('since', sql.DateTime, sinceDate)
        .query(`
          SELECT 
            OrderID,
            Status,
            OrderDate,
            UpdateDate
          FROM [Order]
          WHERE CustomerID = @customerId 
            AND (
              OrderDate > @since 
              OR (UpdateDate IS NOT NULL AND UpdateDate > @since)
            )
          ORDER BY OrderDate DESC
        `);

      res.json({
        success: true,
        hasUpdates: result.recordset.length > 0,
        updatedOrders: result.recordset,
        count: result.recordset.length
      });

    } catch (err) {
      console.error('Error checking order updates:', err);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra cập nhật đơn hàng"
      });
    }
  },

  // 5. Lấy đơn hàng theo email khách hàng
  getOrdersByEmail: async (req, res) => {
    try {
      const { email } = req.params;
      const { status } = req.query;

      const pool = await sql.connect(config);

      let query = `
        SELECT 
          o.*,
          c.FullName,
          c.Phone,
          c.Address,
          (
            SELECT STRING_AGG(p.ProductName, ', ') 
            FROM OrderDetail od
            LEFT JOIN Product p ON od.ProductID = p.ProductID
            WHERE od.OrderID = o.OrderID
          ) as ProductNames
        FROM [Order] o
        LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
        WHERE c.Email = @email
      `;

      const params = [{ name: 'email', type: sql.NVarChar(255), value: email }];

      if (status && status !== 'all') {
        query += ' AND o.Status = @status';
        params.push({ name: 'status', type: sql.NVarChar(20), value: status });
      }

      query += ' ORDER BY o.OrderDate DESC';

      const request = pool.request();
      params.forEach(param => {
        request.input(param.name, param.type, param.value);
      });

      const result = await request.query(query);

      // Format orders
      const orders = result.recordset.map(order => ({
        ...order,
        StatusText: getStatusText(order.Status),
        OrderDateFormatted: new Date(order.OrderDate).toLocaleDateString('vi-VN'),
        TotalPriceFormatted: new Intl.NumberFormat('vi-VN').format(order.TotalPrice) + ' ₫'
      }));

      res.json({
        success: true,
        orders: orders
      });

    } catch (err) {
      console.error('Error getting orders by email:', err);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy đơn hàng theo email"
      });
    }
  },

  // 6. Lấy thống kê đơn hàng của khách hàng
  getCustomerOrderStats: async (req, res) => {
    try {
      const { customerId } = req.params;

      const pool = await sql.connect(config);

      const result = await pool.request()
        .input('customerId', sql.Int, customerId)
        .query(`
          SELECT 
            COUNT(*) as TotalOrders,
            COUNT(CASE WHEN Status = 'pending' THEN 1 END) as PendingOrders,
            COUNT(CASE WHEN Status = 'shipping' THEN 1 END) as ShippingOrders,
            COUNT(CASE WHEN Status = 'completed' THEN 1 END) as CompletedOrders,
            COUNT(CASE WHEN Status = 'cancelled' THEN 1 END) as CancelledOrders,
            ISNULL(SUM(TotalPrice), 0) as TotalSpent,
            MAX(OrderDate) as LastOrderDate
          FROM [Order]
          WHERE CustomerID = @customerId
        `);

      const stats = result.recordset[0];

      res.json({
        success: true,
        stats: {
          totalOrders: stats.TotalOrders,
          pendingOrders: stats.PendingOrders,
          shippingOrders: stats.ShippingOrders,
          completedOrders: stats.CompletedOrders,
          cancelledOrders: stats.CancelledOrders,
          totalSpent: stats.TotalSpent,
          lastOrderDate: stats.LastOrderDate
        }
      });

    } catch (err) {
      console.error('Error getting customer order stats:', err);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê đơn hàng"
      });
    }
  }
};

// Helper functions
function fixImageUrl(imageUrl) {
  if (!imageUrl) return '/image/default-product.jpg';
  
  // Remove /html/ prefix if exists
  if (imageUrl.startsWith('/html/')) {
    imageUrl = imageUrl.replace('/html/', '/');
  }
  
  // Ensure it starts with /image/ if it's a local path
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/image/')) {
    // Check if it's just a filename
    if (!imageUrl.includes('/')) {
      imageUrl = '/image/' + imageUrl;
    }
  }
  
  return imageUrl;
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'Chờ xác nhận',
    'shipping': 'Đang giao hàng',
    'completed': 'Đã giao hàng',
    'cancelled': 'Đã hủy'
  };
  
  return statusMap[status] || status;
}

module.exports = orderController;