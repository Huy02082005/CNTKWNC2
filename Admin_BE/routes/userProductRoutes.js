const express = require('express');
const router = express.Router();
const { sql, connectDB } = require('../config/db');

// Middleware debug
router.use((req, res, next) => {
    next();
});

// GET /api/products - Lấy sản phẩm với phân trang (SỬA LẠI)
router.get('/', async (req, res) => {
    try {        
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
    
        // Query sửa - KHÔNG JOIN với ProductSize (vì không có SizeID)
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
                p.LeagueID,
                c.CategoryName,
                b.BrandName,
                l.LeagueName,
                STUFF((
                    SELECT DISTINCT ', ' + ps.SizeName
                    FROM ProductSizeMapping psm
                    INNER JOIN ProductSize ps ON psm.SizeID = ps.SizeID
                    WHERE psm.ProductID = p.ProductID
                    AND psm.IsActive = 1
                    FOR XML PATH('')
                ), 1, 2, '') AS Sizes
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            WHERE p.Status = 'active' OR p.Status IS NULL
            ORDER BY p.ProductID DESC
            OFFSET ${offset} ROWS 
            FETCH NEXT ${limit} ROWS ONLY
        `);
        
        // Format response
        const products = result.recordset.map(product => ({
            ProductID: product.ProductID,
            ProductName: product.ProductName,
            Description: product.Description,
            ImageURL: product.ImageURL,
            SellingPrice: product.SellingPrice,
            Discount: product.Discount,
            StockQuantity: product.StockQuantity,
            CategoryName: product.CategoryName,
            BrandName: product.BrandName,
            LeagueName: product.LeagueName,
            SizeName: product.Sizes || '',
            Unit: product.Unit || 'cái',
            CreateDate: product.CreateDate
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
            error: error.message,
            stack: error.stack
        });
    }
});

// GET /api/products/all
router.get('/all', async (req, res) => {
    try {
        const pool = req.app.locals.db || await connectDB();
        
        // Query sửa
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
                l.LeagueName,
                -- Lấy kích cỡ từ ProductSizeMapping
                STUFF((
                    SELECT DISTINCT ', ' + ps.SizeName
                    FROM ProductSizeMapping psm
                    INNER JOIN ProductSize ps ON psm.SizeID = ps.SizeID
                    WHERE psm.ProductID = p.ProductID
                    AND psm.IsActive = 1
                    FOR XML PATH('')
                ), 1, 2, '') AS Sizes
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            WHERE p.Status = 'active' OR p.Status IS NULL
            ORDER BY p.ProductID DESC
        `);
        
        const products = result.recordset.map(product => ({
            ProductID: product.ProductID,
            ProductName: product.ProductName,
            Description: product.Description,
            ImageURL: product.ImageURL,
            SellingPrice: product.SellingPrice,
            Discount: product.Discount,
            StockQuantity: product.StockQuantity,
            CategoryName: product.CategoryName,
            BrandName: product.BrandName,
            LeagueName: product.LeagueName,
            SizeName: product.Sizes || '',
            Unit: product.Unit || 'cái',
            CreateDate: product.CreateDate
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

router.get('/filtered', async (req, res) => {
    try {
        const { prices, categories, brands, leagues, sizes, page = 1, limit = 16 } = req.query;
               
        const pool = req.app.locals.db || await connectDB();
        
        const pageLimit = parseInt(limit) || 16;
        const pageOffset = (parseInt(page) - 1) * pageLimit;
        
        // Công thức tính giá sau discount
        const finalPriceFormula = "(p.SellingPrice * (100.0 - ISNULL(p.Discount, 0.0)) / 100.0)";
        
        let baseQuery = `
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
                STUFF(( 
                    SELECT DISTINCT ', ' + ps.SizeName
                    FROM ProductSizeMapping psm
                    INNER JOIN ProductSize ps ON psm.SizeID = ps.SizeID
                    WHERE psm.ProductID = p.ProductID
                    AND psm.IsActive = 1
                    FOR XML PATH('')
                ), 1, 2, '') AS Sizes,
                -- THÊM CỘT GIÁ SAU DISCOUNT
                ${finalPriceFormula} AS FinalPrice
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            WHERE (p.Status = 'active' OR p.Status IS NULL)
        `;
        
        const conditions = [];

        // 1. Lọc theo giá - DÙNG CÔNG THỨC TRỰC TIẾP
        if (prices) {
            const priceRanges = prices.split(',');
            const priceConditions = priceRanges.map(range => {
                if (range === "duoi500") return `${finalPriceFormula} < 500000`;
                if (range === "500-1000") return `${finalPriceFormula} BETWEEN 500000 AND 1000000`;
                if (range === "tren1000") return `${finalPriceFormula} > 1000000`;
                return "";
            }).filter(cond => cond);
            
            if (priceConditions.length) {
                conditions.push(`(${priceConditions.join(' OR ')})`);
            }
        }
        
        // 2. Lọc theo loại sản phẩm (giữ nguyên)
        // SỬA PHẦN LỌC CATEGORY (dòng 49-74):

if (categories) {
    try {
        console.log('🎯 Raw categories from frontend:', categories);
        
        // SỬA CATEGORY MAP THEO ĐÚNG DATABASE
        const categoryMap = {
            'ao-bong-da': 'Áo đấu',                 // Database: "Áo đấu"
            'giay-bong-da': 'Giày bóng đá',        // Database: "Giày bóng đá" ✓
            'phu-kien': 'Phụ kiện',                // Database: "Phụ kiện" ✓
            'ao-khoac': 'Áo khoác thể thao',       // Database: "Áo khoác thể thao"
            'gang-tay': 'Găng tay thủ môn'         // Database: "Gàng tay thủ môn"
        };
        
        const categoryList = categories.split(',')
            .map(cat => {
                const mapped = categoryMap[cat];
                if (!mapped) {
                    console.warn(`⚠️ Category "${cat}" không có trong map, giữ nguyên`);
                    return cat; // Giữ nguyên nếu không map được
                }
                console.log(`   Mapping: "${cat}" -> "${mapped}"`);
                return mapped;
            })
            .filter(cat => cat);
        
        console.log('🎯 Mapped categories:', categoryList);
        
        if (categoryList.length > 0) {
            const placeholders = categoryList.map((cat, i) => {
                // Escape single quotes
                const escaped = cat.replace(/'/g, "''");
                return `N'${escaped}'`;
            }).join(',');
            
            console.log(`🎯 SQL condition: c.CategoryName IN (${placeholders})`);
            conditions.push(`c.CategoryName IN (${placeholders})`);
        }
    } catch (e) {
        console.error('❌ Lỗi parse categories:', e);
    }
}
        
        // 3. Lọc theo thương hiệu (giữ nguyên)
        if (brands) {
            try {
                const brandMap = {
                    'nike': 'Nike',
                    'adidas': 'Adidas',
                    'puma': 'Puma',
                    'mizuno': 'Mizuno',
                    'new-balance': 'New Balance'
                };
                
                const brandList = brands.split(',')
                    .map(b => brandMap[b] || b)
                    .filter(b => b);
                
                if (brandList.length > 0) {
                    const placeholders = brandList.map((_, i) => `N'${brandList[i].replace(/'/g, "''")}'`).join(',');
                    conditions.push(`b.BrandName IN (${placeholders})`);
                }
            } catch (e) {
                console.error('Lỗi parse brands:', e);
            }
        }
        
        // 4. Lọc theo giải đấu
// SỬA LẠI TOÀN BỘ PHẦN LEAGUE FILTER:

if (leagues) { 
    try {
        console.log('⚽ League filter input:', leagues);
        
        // Chuyển đổi linh hoạt hơn
        const leagueConditions = [];
        const inputLeagues = leagues.split(',');
        
        inputLeagues.forEach(input => {
            // Map từ frontend sang pattern search
            let searchPattern = '';
            
            switch(input) {
                case 'premier-league':
                    searchPattern = 'Premier League';
                    break;
                case 'la-liga':
                    searchPattern = 'La Liga';
                    break;
                case 'serie-a':
                    searchPattern = 'Serie A';
                    break;
                case 'bundesliga':
                    searchPattern = 'Bundesliga';
                    break;
                case 'ligue-1':
                    searchPattern = 'Ligue 1';
                    break;
                case 'v-league':
                    searchPattern = 'V-League';
                    break;
                case 'doi-tuyen-quoc-gia':
                    // Xử lý riêng
                    leagueConditions.push(`(p.LeagueID IS NOT NULL AND l.Type = 'National')`);
                    console.log('   Added NATIONAL condition');
                    return; // Không thêm điều kiện thường
                default:
                    searchPattern = input;
            }
            
            if (searchPattern) {
                const escaped = searchPattern.replace(/'/g, "''");
                // Dùng LIKE với wildcard để linh hoạt
                leagueConditions.push(`(l.LeagueName LIKE N'%${escaped}%')`);
                console.log(`   Added condition for "${input}": LIKE '%${searchPattern}%'`);
            }
        });
        
        if (leagueConditions.length > 0) {
            conditions.push(`(${leagueConditions.join(' OR ')})`);
            console.log('⚽ Final league conditions:', leagueConditions);
        }
        
    } catch (e) {
        console.error('❌ Lỗi parse leagues:', e);
    }
}

        // Build final query
        let finalQuery = baseQuery;
        if (conditions.length) {
            finalQuery += ' AND ' + conditions.join(' AND ');
        }
        
        // Query đếm - CŨNG DÙNG CÔNG THỨC TRỰC TIẾP
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            WHERE (p.Status = 'active' OR p.Status IS NULL)
            ${conditions.length ? 'AND ' + conditions.join(' AND ') : ''}
        `;
        
        console.log('🔍 Count Query:', countQuery);
        
        const countResult = await pool.request().query(countQuery);
        const totalFiltered = parseInt(countResult.recordset[0]?.total || 0);
        
        // Query chính với phân trang
        let dataQuery = finalQuery;
        dataQuery += `
            ORDER BY p.ProductID DESC 
            OFFSET ${pageOffset} ROWS FETCH NEXT ${pageLimit} ROWS ONLY
        `;
        
        console.log('🔍 Data Query (rút gọn):', dataQuery.substring(0, 500) + '...');
        
        const result = await pool.request().query(dataQuery);

        const products = result.recordset.map(product => ({
            ProductID: product.ProductID,
            ProductName: product.ProductName,
            ImageURL: product.ImageURL,
            SellingPrice: product.SellingPrice,
            Discount: product.Discount,
            FinalPrice: product.FinalPrice, // Lấy từ SELECT
            StockQuantity: product.StockQuantity,
            CategoryName: product.CategoryName,
            BrandName: product.BrandName,
            LeagueName: product.LeagueName,
            SizeName: product.Sizes || ''
        }));

        const totalPages = Math.ceil(totalFiltered / pageLimit) || 1;

        console.log('✅ Filter stats:', {
            totalProducts: totalFiltered,
            currentPage: parseInt(page),
            totalPages: totalPages,
            productsThisPage: products.length,
            filters: { prices, categories, brands, leagues, sizes }
        });

        // DEBUG: Hiển thị giá của vài sản phẩm đầu tiên
        if (products.length > 0) {
            console.log('💰 Sample product prices:', products.slice(0, 3).map(p => ({
                name: p.ProductName,
                sellingPrice: p.SellingPrice,
                discount: p.Discount,
                finalPrice: p.FinalPrice,
                formula: `${p.SellingPrice} * (100 - ${p.Discount || 0}) / 100 = ${p.FinalPrice}`
            })));
        }

        const responseData = {
            success: true,
            total: totalFiltered,
            totalPages: totalPages,
            page: parseInt(page),
            limit: pageLimit,
            count: products.length,
            products: products,
            filtersApplied: {
                prices: prices || null,
                categories: categories || null,
                brands: brands || null,
                leagues: leagues || null,
                sizes: sizes || null
            }
        };
        
        res.json(responseData);
        
    } catch (error) {
        console.error('❌ [UserProducts] Filter error:', error.message);
        console.error('❌ Full error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lọc sản phẩm',
            error: error.message,
            sqlError: error.originalError?.message || 'No SQL error details'
        });
    }
});

router.get('/check-category-products/:category', async (req, res) => {
    try {
        const categoryName = req.params.category;
        const pool = req.app.locals.db || await connectDB();
        
        const result = await pool.request()
            .input('categoryName', sql.NVarChar, `%${categoryName}%`)
            .query(`
                SELECT 
                    p.ProductID,
                    p.ProductName,
                    p.Status,
                    c.CategoryName,
                    p.StockQuantity
                FROM Product p
                LEFT JOIN Category c ON p.CategoryID = c.CategoryID
                WHERE c.CategoryName LIKE @categoryName
                AND (p.Status = 'active' OR p.Status IS NULL)
                ORDER BY p.ProductID DESC
            `);
        
        res.json({
            success: true,
            category: categoryName,
            productCount: result.recordset.length,
            products: result.recordset
        });
        
    } catch (error) {
        console.error('Check category products error:', error);
        res.status(500).json({ error: error.message });
    }
});

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