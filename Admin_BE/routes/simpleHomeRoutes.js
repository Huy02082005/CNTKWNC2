// routes/simpleHomeRoutes.js - Với debug chi tiết
const express = require('express');
const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API đang hoạt động',
        timestamp: new Date().toISOString()
    });
});

// Get featured products - SỬA LẠI ĐỂ HIỂN THỊ SẢN PHẨM NỔI BẬT
router.get('/products', async (req, res) => {
    try {
        if (!req.app.locals.db) {
            console.error('❌ Database connection: NULL');
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                code: 'DB_NOT_CONNECTED'
            });
        }

        // Query để lấy sản phẩm nổi bật (có discount hoặc mới nhất)
        const query = `
            SELECT TOP 8 
                p.ProductID,
                p.ProductName,
                p.ImageURL,
                p.SellingPrice,
                p.Discount,
                p.StockQuantity,
                p.CreateDate,
                p.Status,
                l.LeagueName,
                l.Country,
                l.Type,
                b.BrandName,
                c.CategoryName,
                -- Tính tổng stock từ ProductSizeMapping
                (SELECT ISNULL(SUM(psm.StockQuantity), 0) 
                 FROM ProductSizeMapping psm 
                 WHERE psm.ProductID = p.ProductID) as SizeStockTotal
            FROM Product p
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            WHERE p.Status = 'active'
            ORDER BY 
                p.Discount DESC,  -- Ưu tiên sản phẩm giảm giá
                p.CreateDate DESC, -- Sau đó sản phẩm mới
                CASE WHEN p.Discount > 0 THEN 0 ELSE 1 END
        `;

        const result = await req.app.locals.db.request().query(query);
        
        console.log(`✅ Đã lấy ${result.recordset.length} sản phẩm nổi bật`);
        
        // Format dữ liệu trả về
        const products = result.recordset.map(product => ({
            ProductID: product.ProductID,
            ProductName: product.ProductName,
            ImageURL: product.ImageURL || '/image/default-product.jpg',
            SellingPrice: product.SellingPrice || 0,
            Discount: product.Discount || 0,
            StockQuantity: product.StockQuantity || 0,
            LeagueName: product.LeagueName || '',
            BrandName: product.BrandName || '',
            CategoryName: product.CategoryName || '',
            TotalStock: product.SizeStockTotal || product.StockQuantity || 0,
            CreateDate: product.CreateDate
        }));
        
        res.json({
            success: true,
            count: products.length,
            products: products,
            debug: {
                queryTime: new Date().toISOString(),
                rowCount: products.length
            }
        });
        
    } catch (err) {
        console.error('💥 Lỗi trong /products:', err);
        res.status(500).json({
            success: false,
            error: 'Database error',
            message: err.message,
            code: 'SQL_ERROR'
        });
    }
});

// Get all products for "see all" page
router.get('/products/all', async (req, res) => {
    try {
        if (!req.app.locals.db) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        // Query để lấy tất cả sản phẩm
        const query = `
            SELECT 
                p.ProductID,
                p.ProductName,
                p.ImageURL,
                p.SellingPrice,
                p.Discount,
                p.StockQuantity,
                p.CreateDate,
                p.Status,
                l.LeagueName,
                l.Country,
                l.Type,
                b.BrandName,
                c.CategoryName,
                (SELECT ISNULL(SUM(psm.StockQuantity), 0) 
                 FROM ProductSizeMapping psm 
                 WHERE psm.ProductID = p.ProductID) as SizeStockTotal
            FROM Product p
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            WHERE p.Status = 'active'
            ORDER BY p.CreateDate DESC
        `;

        const result = await req.app.locals.db.request().query(query);
        
        const products = result.recordset.map(product => ({
            ProductID: product.ProductID,
            ProductName: product.ProductName,
            ImageURL: product.ImageURL || '/image/default-product.jpg',
            SellingPrice: product.SellingPrice || 0,
            Discount: product.Discount || 0,
            StockQuantity: product.StockQuantity || 0,
            LeagueName: product.LeagueName || '',
            BrandName: product.BrandName || '',
            CategoryName: product.CategoryName || '',
            TotalStock: product.SizeStockTotal || product.StockQuantity || 0
        }));
        
        res.json({
            success: true,
            count: products.length,
            products: products
        });
        
    } catch (err) {
        console.error('💥 Lỗi trong /products/all:', err);
        res.status(500).json({
            success: false,
            error: 'Database error',
            message: err.message
        });
    }
});

// Get leagues (thay cho clubs)
router.get('/products/leagues', async (req, res) => {
    try {
        if (!req.app.locals.db) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const query = `
            SELECT DISTINCT
                l.LeagueID,
                l.LeagueName,
                l.LogoURL as ImageURL,
                l.Country,
                l.Type
            FROM Product p
            JOIN League l ON p.LeagueID = l.LeagueID
            WHERE l.Type = 'club'
            ORDER BY l.LeagueName
        `;

        const result = await req.app.locals.db.request().query(query);
        
        res.json({
            success: true,
            count: result.recordset.length,
            products: result.recordset
        });
        
    } catch (err) {
        console.error('💥 Lỗi trong /products/leagues:', err);
        res.status(500).json({
            success: false,
            error: 'Database error',
            message: err.message
        });
    }
});

// Get national teams
router.get('/products/national', async (req, res) => {
    try {
        if (!req.app.locals.db) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const query = `
            SELECT DISTINCT
                l.LeagueID,
                l.LeagueName,
                l.LogoURL as ImageURL,
                l.Country,
                l.Type
            FROM Product p
            JOIN League l ON p.LeagueID = l.LeagueID
            WHERE l.Type = 'national'
            ORDER BY l.LeagueName
        `;

        const result = await req.app.locals.db.request().query(query);
        
        res.json({
            success: true,
            count: result.recordset.length,
            products: result.recordset
        });
        
    } catch (err) {
        console.error('💥 Lỗi trong /products/national:', err);
        res.status(500).json({
            success: false,
            error: 'Database error',
            message: err.message
        });
    }
});

module.exports = router;