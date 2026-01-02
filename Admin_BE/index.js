const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { connectDB } = require('./config/db');
const simpleHomeRoutes = require('./routes/simpleHomeRoutes');

const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use('/api/products', require('./routes/userProductRoutes'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../Admin_FE')));
app.use('/api/simple', simpleHomeRoutes);
app.use('/user', express.static(path.join(__dirname, '../User_FE')));
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/user/js', express.static(path.join(__dirname, '../User_FE')));
app.use('/api/products', require('./routes/userProductRoutes'));

// Route để xem tất cả routes đã đăng ký
app.get('/api/routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach(middleware => {
        if (middleware.route) { // routes registered directly on the app
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') { // router middleware
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods),
                        router: true
                    });
                }
            });
        }
    });
    
    res.json({
        success: true,
        totalRoutes: routes.length,
        routes: routes
    });
});

app.get('/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/home.html'));
});

app.get('/home.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/home.css'));
});

app.get('/home.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/home.js'));
});

app.get('/fetch-images.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/fetch-images.js'));
});

// Thêm route cho see_all.html
app.get('/see_all.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/see_all.html'));
});

// Route cho các file CSS/JS liên quan
app.get('/see_all.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/see_all.css'));
});

app.get('/see_all.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/see_all.js'));
});

// Thêm route cho product_display.js
app.get('/product_display.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/product_display.js'));
});

app.use('/image', express.static(path.join(__dirname, '../User_FE/image')));

app.get('/', (req, res) => {
    if (req.cookies.authToken) {
        res.redirect('/admin.html');
    } else {
        res.redirect('/home.html');
    }
});

async function initializeDatabase() {
    try {
        const pool = await connectDB();
        app.locals.db = pool;
    } catch (err) {
        console.error('❌ Lỗi kết nối SQL Server:', err.message);
        app.locals.db = null;
    }
}

initializeDatabase();

app.use((req, res, next) => {
  if ((req.path.startsWith('/auth') || req.path.startsWith('/account')) && !req.app.locals.db) {
    initializeDatabase().then(() => {
      next();
    }).catch(err => {
      console.error('❌ Failed to reconnect database');
      res.status(503).json({ 
        error: 'Database đang kết nối, vui lòng thử lại sau',
        retry: true
      });
    });
  } else {
    next();
  }
});

app.get('/product-detail.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/html/product-detail.html'));
});

// Route cho CSS của product detail
app.get('/product-detail.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/css/product_detail.css'));
});

// Route cho JavaScript của product detail
app.get('/product-detail.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../User_FE/js/product-detail/product_detail.js'));
});

// Route API để lấy chi tiết sản phẩm
app.get('/api/product-detail/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        if (!app.locals.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const request = app.locals.db.request();
        
        // Lấy thông tin sản phẩm chính
        const productQuery = `
            SELECT 
                p.*, 
                c.CategoryName, 
                b.BrandName, 
                l.LeagueName,
                l.Country
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            WHERE p.ProductID = @productId AND p.Status = 'active'
        `;
        
        const productResult = await request
            .input('productId', productId)
            .query(productQuery);
        
        if (!productResult.recordset || productResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
        }
        
        const product = productResult.recordset[0];
        
        // Lấy sizes có sẵn
        const sizesQuery = `
            SELECT 
                ps.SizeID, 
                ps.SizeName, 
                ps.SizeType, 
                ISNULL(psm.StockQuantity, 0) as StockQuantity
            FROM ProductSizeMapping psm
            JOIN ProductSize ps ON psm.SizeID = ps.SizeID
            WHERE psm.ProductID = @productId 
                AND psm.IsActive = 1 
                AND psm.StockQuantity > 0
            ORDER BY ps.SizeType, ps.SizeName
        `;
        
        const sizesResult = await request
            .input('productId', productId)
            .query(sizesQuery);
        
        // Lấy sản phẩm liên quan
        const relatedQuery = `
            SELECT TOP 4 
                p.ProductID, 
                p.ProductName, 
                p.ImageURL, 
                p.SellingPrice, 
                p.Discount,
                p.StockQuantity
            FROM Product p
            WHERE (p.CategoryID = @categoryId OR p.LeagueID = @leagueId)
                AND p.ProductID != @productId
                AND p.Status = 'active'
            ORDER BY NEWID()
        `;
        
        const relatedResult = await request
            .input('categoryId', product.CategoryID)
            .input('leagueId', product.LeagueID)
            .input('productId', productId)
            .query(relatedQuery);
        
        // Tính giá sau giảm
        const discountedPrice = product.Discount > 0 
            ? product.SellingPrice - (product.SellingPrice * product.Discount / 100)
            : product.SellingPrice;
        
        res.json({
            success: true,
            product: {
                ...product,
                discountedPrice: discountedPrice
            },
            sizes: sizesResult.recordset,
            relatedProducts: relatedResult.recordset,
            hasSizes: sizesResult.recordset.length > 0
        });
        
    } catch (error) {
        console.error('Error loading product detail:', error);
        res.status(500).json({ 
            error: 'Lỗi tải sản phẩm',
            message: error.message 
        });
    }
});

// Route cho sản phẩm liên quan
app.get('/api/related-products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        if (!app.locals.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const request = app.locals.db.request();
        
        // Lấy category và league của sản phẩm hiện tại
        const infoQuery = `
            SELECT CategoryID, LeagueID 
            FROM Product 
            WHERE ProductID = @productId
        `;
        
        const infoResult = await request
            .input('productId', productId)
            .query(infoQuery);
        
        if (!infoResult.recordset || infoResult.recordset.length === 0) {
            return res.json({ success: true, products: [] });
        }
        
        const { CategoryID, LeagueID } = infoResult.recordset[0];
        
        // Lấy sản phẩm liên quan
        const relatedQuery = `
            SELECT TOP 8 
                ProductID, 
                ProductName, 
                ImageURL, 
                SellingPrice, 
                Discount,
                StockQuantity
            FROM Product
            WHERE (CategoryID = @categoryId OR LeagueID = @leagueId)
                AND ProductID != @productId
                AND Status = 'active'
            ORDER BY NEWID()
        `;
        
        const relatedResult = await request
            .input('categoryId', CategoryID)
            .input('leagueId', LeagueID)
            .input('productId', productId)
            .query(relatedQuery);
        
        res.json({
            success: true,
            products: relatedResult.recordset
        });
        
    } catch (error) {
        console.error('Error loading related products:', error);
        res.status(500).json({ error: 'Lỗi tải sản phẩm liên quan' });
    }
});

app.get('/product/:id', (req, res) => {
    console.log(`📦 Product detail request: ${req.params.id}`);
    
    // Gửi file HTML product-detail.html
    res.sendFile(path.join(__dirname, '../User_FE/html/product-detail.html'));
});

// API để lấy thông tin sản phẩm
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`📦 API Request for product ID: ${productId}`);
        
        if (!app.locals.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const request = app.locals.db.request();
        const query = `
            SELECT p.*, c.CategoryName, b.BrandName, l.LeagueName
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            WHERE p.ProductID = @productId
        `;
        
        const result = await request
            .input('productId', productId)
            .query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const product = result.recordset[0];
        
        res.json({
            success: true,
            product: mockProduct,
            sizes: mockProduct.sizes,
            relatedProducts: []
        });
        
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/debug/product-detail', (req, res) => {
    const filePath = path.join(__dirname, '../User_FE/html/product-detail.html');
    res.sendFile(filePath);
});

app.get('/debug/product-detail-content', (req, res) => {
    const filePath = path.join(__dirname, '../User_FE/html/product-detail.html');
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Kiểm tra có meta CSP không
    const hasMetaCSP = content.includes('Content-Security-Policy');
    const hasDefaultSrcNone = content.includes("default-src 'none'");
    
    res.json({
        file: 'product-detail.html',
        hasMetaCSP: hasMetaCSP,
        hasDefaultSrcNone: hasDefaultSrcNone,
        metaTags: extractMetaTags(content),
        fileSize: content.length
    });
});

function extractMetaTags(html) {
    const metaRegex = /<meta[^>]+>/g;
    const matches = html.match(metaRegex) || [];
    return matches.filter(meta => 
        meta.includes('http-equiv') || 
        meta.includes('Content-Security-Policy')
    );
}

async function checkAndReconnectDB() {
  try {
    if (!app.locals.db || !app.locals.db.connected) {
      const pool = await connectDB();
      app.locals.db = pool;
    }
  } catch (error) {
    console.error('❌ Failed to reconnect database:', error.message);
  }
}

app.use(async (req, res, next) => {
  if (req.path.startsWith('/product') || 
      req.path.startsWith('/order') || 
      req.path.startsWith('/api/')) {
    await checkAndReconnectDB();
  }
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/product', require('./routes/productRoutes'));
app.use('/order', require('./routes/orderRoutes'));
app.use('/customer', require('./routes/customerRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/stats', require('./routes/statisticsRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));

app.use(express.static(`${__dirname}/User_FE/image`));

app.get('/user.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/user.html'));
});

app.get('/orders.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/orders.html'));
});

app.get('/products.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/products.html'));
});

app.get('/settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/settings.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/admin.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/login.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/dashboard.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Admin_FE/html/login.html'));
});

app.listen(3000, () => console.log('🚀 Server running on port 3000'));