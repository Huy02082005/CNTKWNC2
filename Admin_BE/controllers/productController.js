const sql = require("mssql");
const config = require("../config/db");

const productController = {
  getAllProducts: async (req, res) => {
    try {
      let pool = req.app.locals.db;
      
      if (!pool || !pool.connected) {
        pool = await sql.connect(config);
        req.app.locals.db = pool;
      }

      // ĐẢM BẢO LẤY ImageURL
      const result = await pool.request().query(`
        SELECT 
          p.ProductID,
          p.ProductName,
          p.Description,
          p.CategoryID,
          p.BrandID,
          p.ImageURL, -- QUAN TRỌNG
          p.ImportPrice,
          p.SellingPrice,
          p.Discount,
          p.StockQuantity,
          p.Unit,
          p.LeagueID,
          p.Season,
          p.PlayerName,
          p.Status,
          p.CreateDate,
          p.UpdateDate,
          c.CategoryName, 
          b.BrandName, 
          l.LeagueName
        FROM Product p
        LEFT JOIN Category c ON p.CategoryID = c.CategoryID
        LEFT JOIN Brand b ON p.BrandID = b.BrandID
        LEFT JOIN League l ON p.LeagueID = l.LeagueID
        ORDER BY p.ProductID DESC
      `);
      
      console.log(`✅ Lấy được ${result.recordset.length} sản phẩm`);
      
      // Log vài sản phẩm để kiểm tra ảnh
      if (result.recordset.length > 0) {
        console.log('📸 Sample products with images:', 
          result.recordset.slice(0, 3).map(p => ({
            id: p.ProductID,
            name: p.ProductName,
            image: p.ImageURL
          }))
        );
      }
      
      res.json(result.recordset);
      
    } catch (err) {
      console.error('❌ LỖI trong getAllProducts:', err.message);
      res.status(500).json({ 
        success: false,
        message: "Lỗi server khi lấy sản phẩm",
        error: err.message
      });
    }
  },

  getProductById: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            p.*, 
            c.CategoryName, 
            b.BrandName, 
            l.LeagueName,
            -- Thay thế bằng cách lấy size từ ProductSizeMapping
            STUFF((
              SELECT DISTINCT ', ' + ps.SizeName
              FROM ProductSizeMapping psm
              INNER JOIN ProductSize ps ON psm.SizeID = ps.SizeID
              WHERE psm.ProductID = p.ProductID
              AND psm.IsActive = 1
              FOR XML PATH('')
            ), 1, 2, '') AS SizeName
          FROM Product p
          LEFT JOIN Category c ON p.CategoryID = c.CategoryID
          LEFT JOIN Brand b ON p.BrandID = b.BrandID
          LEFT JOIN League l ON p.LeagueID = l.LeagueID
          WHERE p.ProductID = @id
        `);
      
      if (result.recordset.length === 0) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }
      
      res.json(result.recordset[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

checkDuplicateProductName: async (req, res) => {
    try {
        const { productName, excludeId } = req.body;
        
        console.log('🔍 API checkDuplicateProductName called with:', { productName, excludeId });
        
        if (!productName || productName.trim() === '') {
            return res.json({ 
                success: false, 
                isDuplicate: false,
                message: "Tên sản phẩm không hợp lệ" 
            });
        }
        
        const pool = req.app.locals.db;
        
        if (!pool) {
            console.error('❌ Database pool not found');
            return res.status(500).json({ 
                success: false,
                isDuplicate: false,
                message: "Database connection error" 
            });
        }
        
        let query;
        let request = pool.request();
        
        // Chuẩn hóa tên sản phẩm (loại bỏ khoảng trắng thừa và chuyển về chữ thường)
        const normalizedProductName = productName.trim().toLowerCase();
        
        if (excludeId) {
            // Kiểm tra khi chỉnh sửa (loại trừ sản phẩm hiện tại)
            query = `
                SELECT COUNT(*) as count 
                FROM Product 
                WHERE LOWER(RTRIM(LTRIM(ProductName))) = @productName
                AND ProductID != @excludeId
            `;
            
            request.input('productName', sql.NVarChar, normalizedProductName);
            request.input('excludeId', sql.Int, parseInt(excludeId));
        } else {
            // Kiểm tra khi thêm mới
            query = `
                SELECT COUNT(*) as count 
                FROM Product 
                WHERE LOWER(RTRIM(LTRIM(ProductName))) = @productName
            `;
            
            request.input('productName', sql.NVarChar, normalizedProductName);
        }
        
        console.log('🔍 SQL Query:', query);
        
        const result = await request.query(query);
        const count = result.recordset[0]?.count || 0;
        const isDuplicate = count > 0;
        
        console.log(`🔍 Kiểm tra trùng tên: "${normalizedProductName}" - Kết quả: ${isDuplicate ? 'TRÙNG' : 'KHÔNG TRÙNG'} (count: ${count})`);
        
        res.json({
            success: true,
            isDuplicate: isDuplicate,
            count: count,
            message: isDuplicate ? 'Tên sản phẩm đã tồn tại' : 'Tên sản phẩm hợp lệ'
        });
        
    } catch (err) {
        console.error('❌ LỖI trong checkDuplicateProductName:', err.message);
        console.error('Stack trace:', err.stack);
        
        res.status(500).json({ 
            success: false,
            isDuplicate: false,
            message: "Lỗi server khi kiểm tra tên sản phẩm",
            error: err.message
        });
    }
},

  createProduct: async (req, res) => {
    try {
        const {
            ProductName, Description, CategoryID, BrandID, ImageURL,
            ImportPrice, SellingPrice, Discount, StockQuantity, Unit,
            LeagueID, Season, PlayerName, Status = 'active'
        } = req.body;

        // Kiểm tra trùng tên trước khi thêm mới
        const pool = await sql.connect(config);
        
        // Kiểm tra trùng tên
        const checkDuplicate = await pool.request()
            .input('ProductName', sql.NVarChar, ProductName.trim())
            .query(`
                SELECT COUNT(*) as count 
                FROM Product 
                WHERE LOWER(TRIM(ProductName)) = LOWER(TRIM(@ProductName))
            `);
        
        if (checkDuplicate.recordset[0]?.count > 0) {
            return res.status(400).json({ 
                message: "Tên sản phẩm đã tồn tại. Vui lòng chọn tên khác." 
            });
        }

        // Xử lý BrandID và LeagueID có thể null
        const result = await pool.request()
            .input('ProductName', sql.NVarChar, ProductName)
            .input('Description', sql.NVarChar, Description)
            .input('CategoryID', sql.Int, CategoryID)
            .input('BrandID', BrandID ? sql.Int : sql.NVarChar, BrandID || null)
            .input('ImageURL', sql.NVarChar, ImageURL)
            .input('ImportPrice', sql.Decimal(12,2), ImportPrice)
            .input('SellingPrice', sql.Decimal(12,2), SellingPrice)
            .input('Discount', sql.Decimal(5,2), Discount || 0)
            .input('StockQuantity', sql.Int, StockQuantity || 0)
            .input('Unit', sql.NVarChar, Unit || 'Cái')
            .input('LeagueID', LeagueID ? sql.Int : sql.NVarChar, LeagueID || null)
            .input('Season', sql.NVarChar, Season)
            .input('PlayerName', sql.NVarChar, PlayerName)
            .input('Status', sql.NVarChar, Status)
            .query(`
                INSERT INTO Product (
                    ProductName, Description, CategoryID, BrandID, ImageURL, 
                    ImportPrice, SellingPrice, Discount, StockQuantity, Unit, 
                    LeagueID, Season, PlayerName, Status, CreateDate, UpdateDate
                )
                OUTPUT INSERTED.*
                VALUES (
                    @ProductName, @Description, @CategoryID, @BrandID, @ImageURL,
                    @ImportPrice, @SellingPrice, @Discount, @StockQuantity, @Unit, 
                    @LeagueID, @Season, @PlayerName, @Status, GETDATE(), GETDATE()
                )
            `);

        res.status(201).json({
            message: "Thêm sản phẩm thành công",
            product: result.recordset[0]
        });
    } catch (err) {
        console.error('❌ Lỗi trong createProduct:', err);
        res.status(500).json({ 
            message: "Lỗi server khi thêm sản phẩm",
            error: err.message
        });
    }
},

 updateProduct: async (req, res) => {
    try {
        const { id } = req.params;
        const {
            ProductName, Description, CategoryID, BrandID, ImageURL,
            ImportPrice, SellingPrice, Discount, StockQuantity, Unit,
            LeagueID, Season, PlayerName, Status
        } = req.body;
        
        console.log('🔄 Update product ID:', id);
        console.log('📦 Data received:', {
            ProductName, ImageURL, CategoryID, BrandID, LeagueID
        });

        const pool = await sql.connect(config);
        
        // Kiểm tra trùng tên (loại trừ sản phẩm hiện tại)
        const checkDuplicate = await pool.request()
            .input('ProductName', sql.NVarChar, ProductName.trim())
            .input('ProductID', sql.Int, id)
            .query(`
                SELECT COUNT(*) as count 
                FROM Product 
                WHERE LOWER(TRIM(ProductName)) = LOWER(TRIM(@ProductName))
                AND ProductID != @ProductID
            `);
        
        if (checkDuplicate.recordset[0]?.count > 0) {
            return res.status(400).json({ 
                message: "Tên sản phẩm đã tồn tại. Vui lòng chọn tên khác." 
            });
        }
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('ProductName', sql.NVarChar, ProductName)
            .input('Description', sql.NVarChar, Description || '')
            .input('CategoryID', sql.Int, CategoryID)
            .input('BrandID', BrandID ? sql.Int : sql.NVarChar, BrandID || null)
            .input('ImageURL', sql.NVarChar, ImageURL || '')
            .input('ImportPrice', sql.Decimal(12,2), ImportPrice)
            .input('SellingPrice', sql.Decimal(12,2), SellingPrice)
            .input('Discount', sql.Decimal(5,2), Discount || 0)
            .input('StockQuantity', sql.Int, StockQuantity || 0)
            .input('Unit', sql.NVarChar, Unit || 'Cái')
            .input('LeagueID', LeagueID ? sql.Int : sql.NVarChar, LeagueID || null)
            .input('Season', sql.NVarChar, Season || '')
            .input('PlayerName', sql.NVarChar, PlayerName || '')
            .input('Status', sql.NVarChar, Status || 'active')
            .query(`
                UPDATE Product SET
                    ProductName = @ProductName,
                    Description = @Description,
                    CategoryID = @CategoryID,
                    BrandID = @BrandID,
                    ImageURL = @ImageURL,
                    ImportPrice = @ImportPrice,
                    SellingPrice = @SellingPrice,
                    Discount = @Discount,
                    StockQuantity = @StockQuantity,
                    Unit = @Unit,
                    LeagueID = @LeagueID,
                    Season = @Season,
                    PlayerName = @PlayerName,
                    Status = @Status,
                    UpdateDate = GETDATE()
                WHERE ProductID = @id
                
                SELECT * FROM Product WHERE ProductID = @id
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }

        const updatedProduct = result.recordset[0];
        console.log('✅ Product updated:', updatedProduct);

        res.json({ 
            message: "Cập nhật sản phẩm thành công",
            product: updatedProduct 
        });
    } catch (err) {
        console.error('❌ Lỗi trong updateProduct:', err);
        res.status(500).json({ 
            message: "Lỗi server", 
            error: err.message,
            details: err.stack 
        });
    }
},

  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const pool = await sql.connect(config);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM Product WHERE ProductID = @id');

      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      res.json({ message: "Xóa sản phẩm thành công" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Lỗi server" });
    }
  },

  getAllCategories: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM Category ORDER BY CategoryName');
      res.json(result.recordset);
    } catch (err) {
      console.error('❌ Lỗi khi tải danh mục:', err);
      res.json([
        { CategoryID: 1, CategoryName: "Áo đấu" },
        { CategoryID: 2, CategoryName: "Giày bóng đá" },
        { CategoryID: 3, CategoryName: "Phụ kiện" },
        { CategoryID: 4, CategoryName: "Áo khoác thể thao" },
        { CategoryID: 5, CategoryName: "Găng tay thủ môn" }
      ]);
    }
  },

  getAllBrands: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM Brand ORDER BY BrandName');
      res.json(result.recordset);
    } catch (err) {
      console.error('❌ Lỗi khi tải thương hiệu:', err);
      res.json([
        { BrandID: 1, BrandName: "Adidas" },
        { BrandID: 2, BrandName: "Nike" },
        { BrandID: 3, BrandName: "Puma" },
        { BrandID: 4, BrandName: "Mizuno" },
        { BrandID: 5, BrandName: "New Balance" }
      ]);
    }
  },

  getAllLeagues: async (req, res) => {
    try {
      const pool = await sql.connect(config);
      const result = await pool.request().query('SELECT * FROM League ORDER BY LeagueName');
      res.json(result.recordset);
    } catch (err) {
      console.error('❌ Lỗi khi tải giải đấu:', err);
      res.json([
        { LeagueID: 1, LeagueName: "Premier League" },
        { LeagueID: 2, LeagueName: "FA Cup" },
        { LeagueID: 3, LeagueName: "EFL Cup" },
        { LeagueID: 4, LeagueName: "Community Shield" },
        { LeagueID: 5, LeagueName: "Championship" },
        { LeagueID: 6, LeagueName: "La Liga" },
        { LeagueID: 7, LeagueName: "Copa del Rey" },
        { LeagueID: 8, LeagueName: "Supercopa de España" },
        { LeagueID: 9, LeagueName: "Serie A" },
        { LeagueID: 10, LeagueName: "Coppa Italia" }
      ]);
    }
  },
};

module.exports = productController;