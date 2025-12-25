const express = require('express');
const router = express.Router();
const { sql, connectDB } = require('../config/db');

// Middleware debug
router.use((req, res, next) => {
    console.log(`📡 [UserProducts] ${req.method} ${req.originalUrl}`);
    console.log('📋 Query params:', req.query);
    next();
});

// GET /api/products - Lấy sản phẩm với phân trang
// GET /api/products - Sửa đơn giản nhất: BỎ ClubTeam
router.get('/', async (req, res) => {
    try {
        console.log('📦 [UserProducts] GET / called');
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 16;
        const offset = (page - 1) * limit;
                
        let pool = req.app.locals.db;
        if (!pool) {
            try {
                pool = await connectDB();
                req.app.locals.db = pool;
            } catch (dbError) {
                return res.status(503).json({
                    success: false,
                    message: 'Không thể kết nối database',
                    error: dbError.message
                });
            }
        }
        
        // Query đếm tổng
        const countResult = await pool.request().query(`
            SELECT COUNT(*) as total 
            FROM Product p
            WHERE p.Status = 'active' OR p.Status IS NULL
        `);
        
        const totalProducts = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalProducts / limit);
        
        console.log(`📊 Total products: ${totalProducts}, Total pages: ${totalPages}`);
        
        // Query đơn giản - CHỈ LẤY NHỮNG CỘT CÓ TRONG DATABASE
        const result = await pool.request().query(`
            SELECT 
                p.ProductID,
                p.ProductName,
                p.Description,
                p.ImageURL,
                p.SellingPrice,
                p.Discount,
                p.StockQuantity,
                p.CreateDate,
                p.LeagueID,  -- Thêm LeagueID nếu cần
                c.CategoryName,
                b.BrandName,
                ps.SizeName
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN ProductSize ps ON p.SizeID = ps.SizeID
            WHERE p.Status = 'active' OR p.Status IS NULL
            ORDER BY p.ProductID DESC
            OFFSET ${offset} ROWS 
            FETCH NEXT ${limit} ROWS ONLY
        `);
        
        console.log(`✅ Retrieved ${result.recordset.length} products for page ${page}`);
        
        // Format response - BỎ club/league nếu chưa cần
        const products = result.recordset.map(product => ({
            id: product.ProductID,
            name: product.ProductName,
            description: product.Description,
            image: product.ImageURL,
            price: product.SellingPrice,
            discount: product.Discount,
            stock: product.StockQuantity,
            category: product.CategoryName,
            brand: product.BrandName,
            size: product.SizeName,
            leagueId: product.LeagueID,  // Chỉ lấy ID, không join
            created: product.CreateDate
        }));
        
        res.json({
            success: true,
            pagination: {
                total: totalProducts,
                count: products.length,
                perPage: limit,
                currentPage: page,
                totalPages: totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            products: products,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ [UserProducts] Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy sản phẩm',
            error: error.message
        });
    }
});

// GET /api/products/all - Lấy TẤT CẢ không phân trang
router.get('/all', async (req, res) => {
    try {
        console.log('📦 [UserProducts] GET /all called');
        
        const pool = req.app.locals.db || await connectDB();
        
        // Query - Sửa: thay ClubTeam bằng League
        const result = await pool.request().query(`
            SELECT 
                p.ProductID,
                p.ProductName,
                p.Description,
                p.ImageURL,
                p.SellingPrice,
                p.Discount,
                p.StockQuantity,
                p.CreateDate,
                c.CategoryName,
                b.BrandName,
                l.LeagueName,  -- Sửa thành LeagueName
                ps.SizeName
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID  -- Sửa: JOIN với League
            LEFT JOIN ProductSize ps ON p.SizeID = ps.SizeID
            WHERE p.Status = 'active' OR p.Status IS NULL
            ORDER BY p.ProductID DESC
        `);
        
        const products = result.recordset.map(product => ({
            id: product.ProductID,
            name: product.ProductName,
            description: product.Description,
            image: product.ImageURL,
            price: product.SellingPrice,
            discount: product.Discount,
            stock: product.StockQuantity,
            category: product.CategoryName,
            brand: product.BrandName,
            league: product.LeagueName,  // Sửa thành league
            size: product.SizeName,
            created: product.CreateDate
        }));
        
        res.json({
            success: true,
            total: products.length,
            products: products
        });
        
    } catch (error) {
        console.error('❌ [UserProducts] Error in /all:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải tất cả sản phẩm',
            error: error.message
        });
    }
});

// Lấy sản phẩm đã lọc - CẦN SỬA filter clubs
router.get('/filtered', async (req, res) => {
    try {
        const { prices, categories, brands, leagues, sizes, page = 1, limit = 100 } = req.query;  // Đổi clubs thành leagues
        
        const pool = req.app.locals.db || await connectDB();
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT 
                p.ProductID,
                p.ProductName,
                p.ImageURL,
                p.SellingPrice,
                p.Discount,
                p.StockQuantity,
                c.CategoryName,
                b.BrandName,
                l.LeagueName,
                ps.SizeName
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            LEFT JOIN ProductSize ps ON p.SizeID = ps.SizeID
            WHERE (p.Status = 'active' OR p.Status IS NULL)
        `;
        
        const conditions = [];
        
        // Lọc theo giá (giữ nguyên)
        if (prices) {
            const priceRanges = prices.split(',');
            const priceConditions = priceRanges.map(range => {
                if (range === "duoi500") return "p.SellingPrice < 500000";
                if (range === "500-1000") return "p.SellingPrice BETWEEN 500000 AND 1000000";
                if (range === "tren1000") return "p.SellingPrice > 1000000";
                return "";
            }).filter(cond => cond);
            
            if (priceConditions.length) {
                conditions.push(`(${priceConditions.join(' OR ')})`);
            }
        }
        
        // Lọc theo loại sản phẩm (giữ nguyên)
        if (categories) {
            const categoryList = categories.split(',').map(cat => `'${cat.replace('ao-bong-da', 'Áo bóng đá').replace('giay-bong-da', 'Giày bóng đá').replace('phu-kien', 'Phụ kiện').replace('ao-khoac', 'Áo khoác').replace('quan', 'Quần')}'`);
            conditions.push(`c.CategoryName IN (${categoryList.join(",")})`);
        }
        
        // Lọc theo thương hiệu (giữ nguyên)
        if (brands) {
            const brandList = brands.split(',').map(b => `'${b.replace('nike', 'Nike').replace('adidas', 'Adidas').replace('puma', 'Puma').replace('mizuno', 'Mizuno').replace('new-balance', 'New Balance')}'`);
            conditions.push(`b.BrandName IN (${brandList.join(",")})`);
        }
        
        // Lọc theo giải đấu
        if (leagues) { 
            const leagueList = leagues.split(',').map(league => {
                const leagueMap = {
                    'premier-league': 'Premier League',
                    'la-liga': 'La Liga',
                    'serie-a': 'Serie A',
                    'bundesliga': 'Bundesliga',
                    'ligue-1': 'Ligue 1',
                    'world-cup': 'World Cup',
                    'euro': 'Euro'
                };
                return `'${leagueMap[league] || league}'`;
            });
            conditions.push(`l.LeagueName IN (${leagueList.join(",")})`);
        }
        
        // Lọc theo kích cỡ
        if (sizes) {
            const sizeList = sizes.split(',').map(s => `'${s.toUpperCase()}'`);
            conditions.push(`ps.SizeName IN (${sizeList.join(",")})`);
        }

        if (conditions.length) {
            query += ' AND ' + conditions.join(' AND ');
        }
        
        // Query đếm tổng
        const countQuery = query.replace('SELECT p.ProductID, p.ProductName, p.ImageURL, p.SellingPrice, p.Discount, p.StockQuantity, c.CategoryName, b.BrandName, l.LeagueName, ps.SizeName', 'SELECT COUNT(*) as total');
        const countResult = await pool.request().query(countQuery);
        const totalFiltered = countResult.recordset[0].total;
        
        // Thêm phân trang
        query += ` ORDER BY p.ProductID DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

        const result = await pool.request().query(query);
        
        const products = result.recordset.map(product => ({
            id: product.ProductID,
            name: product.ProductName,
            image: product.ImageURL,
            price: product.SellingPrice,
            discount: product.Discount,
            stock: product.StockQuantity,
            category: product.CategoryName,
            brand: product.BrandName,
            league: product.LeagueName,
            size: product.SizeName
        }));
        
        res.json({
            success: true,
            total: totalFiltered,
            count: products.length,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalFiltered / limit),
            products: products,
            filters: { prices, categories, brands, leagues, sizes },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ [UserProducts] Filter error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lọc sản phẩm',
            error: error.message
        });
    }
});

// Các endpoint khác giữ nguyên...
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'User Products API is working',
        endpoint: '/api/products',
        timestamp: new Date().toISOString()
    });
});

router.get('/health', async (req, res) => {
    try {
        const pool = req.app.locals.db;
        
        if (!pool) {
            return res.json({
                success: false,
                status: 'unhealthy',
                database: 'disconnected',
                message: 'Database not connected'
            });
        }
        
        const result = await pool.request().query('SELECT COUNT(*) as total FROM Product');
        const totalProducts = result.recordset[0].total;
        
        res.json({
            success: true,
            status: 'healthy',
            database: 'connected',
            totalProducts: totalProducts,
            timestamp: new Date().toISOString(),
            memory: process.memoryUsage()
        });
        
    } catch (error) {
        res.json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

module.exports = router;