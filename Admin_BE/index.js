const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/db');
const simpleHomeRoutes = require('./routes/simpleHomeRoutes');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// ========== CẤU HÌNH STATIC FILES CHUẨN ==========
app.use(express.static(path.join(__dirname, '../User_FE')));
app.use('/admin/html', express.static(path.join(__dirname, '../Admin_FE/html')));
app.use('/admin/css', express.static(path.join(__dirname, '../Admin_FE/css')));

// Route riêng cho các thư mục
app.use('/css', express.static(path.join(__dirname, '../User_FE/css')));
app.use('/js', express.static(path.join(__dirname, '../User_FE/js')));
app.use('/image', express.static(path.join(__dirname, '../User_FE/image')));
app.use('/html', express.static(path.join(__dirname, '../User_FE/html')));

// Middleware
app.use(express.json());
app.use(cookieParser());

// ========== ROUTES CỤ THỂ CHO CÁC FILE ==========

// Route cho product-detail.html
app.get('/product-detail.html', (req, res) => {
    console.log('📄 Serving product-detail.html');
    
    const possiblePaths = [
        path.join(__dirname, '../User_FE/html/product-detail.html'),
        path.join(__dirname, '../User_FE/product-detail.html')
    ];
    
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            console.log(`✅ Found at: ${filePath}`);
            return res.sendFile(filePath);
        }
    }
    
    console.error('❌ product-detail.html not found in any location');
    res.status(404).send('File not found');
});

// Route cho home.html
app.get('/home.html', (req, res) => {
    const filePath = path.join(__dirname, '../User_FE/html/home.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('home.html not found');
    }
});

// Route cho see_all.html
app.get('/see_all.html', (req, res) => {
    const filePath = path.join(__dirname, '../User_FE/html/see_all.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('see_all.html not found');
    }
});

// Route cho các file HTML khác
const htmlFiles = [
    'accessories.html', 'clothes.html', 'contact.html', 
    'forgotpassword.html', 'gloves.html', 'introduction.html',
    'login.html', 'shoes.html'
];

htmlFiles.forEach(filename => {
    app.get(`/${filename}`, (req, res) => {
        const filePath = path.join(__dirname, `../User_FE/html/${filename}`);
        if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
        } else {
            res.status(404).send(`${filename} not found`);
        }
    });
});

// ========== API ROUTES ==========
const customerRoutes = require('./routes/customerRoutes');
app.use('/customer', customerRoutes);
app.use('/api/customer', customerRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/order', orderRoutes);
app.use('/order', orderRoutes);

app.use('/api/simple', simpleHomeRoutes);
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/products', require('./routes/userProductRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/customer', require('./routes/authCustomerRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes')); 

// API để lấy chi tiết sản phẩm
app.get('/api/product-detail/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`📦 API: Loading product ${productId}`);
        
        if (!app.locals.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const request = app.locals.db.request();
        
        const productQuery = `
            SELECT 
                p.*, 
                c.CategoryName, 
                b.BrandName, 
                l.LeagueName
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
        
        const discountedPrice = product.Discount > 0 
            ? product.SellingPrice - (product.SellingPrice * product.Discount / 100)
            : product.SellingPrice;
        
        res.json({
            success: true,
            product: {
                ...product,
                discountedPrice: Math.round(discountedPrice)
            }
        });
        
    } catch (error) {
        console.error('Error loading product detail:', error);
        res.status(500).json({ 
            error: 'Lỗi tải sản phẩm',
            message: error.message 
        });
    }
});

// Trong index.js, sửa endpoint search:
app.get('/api/products/search', async (req, res) => {
    try {
        const searchTerm = req.query.q || '';
        console.log(`SEARCH: "${searchTerm}"`);

        if (!app.locals.db) {
            return res.status(500).json({ 
                success: false, 
                error: 'Database not connected' 
            });
        }

        if (!searchTerm || searchTerm.trim().length < 2) {
            return res.json({
                success: true,
                products: [],
                total: 0,
                message: 'Vui long nhap 2 ky tu'
            });
        }

        const request = app.locals.db.request();
        const searchParam = `%${searchTerm.trim()}%`;
        
        // Query don gian
        const query = `
            SELECT 
                p.ProductID,
                p.ProductName,
                p.SellingPrice,
                p.Discount,
                p.StockQuantity,
                p.ImageURL,
                c.CategoryName, 
                b.BrandName
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            WHERE p.Status = 'active'
            AND p.ProductName LIKE @searchParam
            ORDER BY p.CreateDate DESC
        `;

        const result = await request
            .input('searchParam', searchParam)
            .query(query);

        const products = result.recordset || [];

        // FIX IMAGE PATH: Format response with correct image paths
        const formattedProducts = products.map(product => {
            // Fix image URL
            let imageUrl = product.ImageURL || '';
            
            // Remove /html/ prefix if exists
            if (imageUrl && imageUrl.startsWith('/html/')) {
                imageUrl = imageUrl.replace('/html/', '/');
            }
            // Ensure it starts with /image/
            else if (imageUrl && !imageUrl.startsWith('/image/')) {
                // Check if it's just a filename
                if (imageUrl.includes('/')) {
                    // Has some path, use as is
                } else {
                    // Just filename, add /image/ prefix
                    imageUrl = '/image/' + imageUrl;
                }
            }
            // Default image if empty
            if (!imageUrl) {
                imageUrl = '/image/default-product.jpg';
            }
            
            return {
                id: product.ProductID,
                name: product.ProductName,
                price: product.SellingPrice,
                discount: product.Discount || 0,
                image: imageUrl, // Fixed image path
                category: product.CategoryName,
                brand: product.BrandName,
                stock: product.StockQuantity || 0
            };
        });

        console.log(`FOUND: ${formattedProducts.length} products`);

        res.json({
            success: true,
            products: formattedProducts,
            total: formattedProducts.length,
            searchTerm: searchTerm,
            message: `Tim thay ${formattedProducts.length} san pham`
        });

    } catch (error) {
        console.error('SEARCH ERROR:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed',
            message: error.message
        });
    }
});


// ========== PRODUCT DETAIL ENDPOINTS ==========

// API để lấy chi tiết sản phẩm
app.get('/api/product-detail/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`📦 API: Loading product ${productId}`);
        
        if (!app.locals.db) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const request = app.locals.db.request();
        
        const productQuery = `
            SELECT 
                p.*, 
                c.CategoryName, 
                b.BrandName, 
                l.LeagueName
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
        
        const discountedPrice = product.Discount > 0 
            ? product.SellingPrice - (product.SellingPrice * product.Discount / 100)
            : product.SellingPrice;
        
        res.json({
            success: true,
            product: {
                ...product,
                discountedPrice: Math.round(discountedPrice)
            }
        });
        
    } catch (error) {
        console.error('Error loading product detail:', error);
        res.status(500).json({ 
            error: 'Lỗi tải sản phẩm',
            message: error.message 
        });
    }
});

// API alias - ĐẶT SAU CÙNG
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
            product: product
        });
        
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ========== DATABASE INITIALIZATION ==========
async function initializeDatabase() {
    try {
        const pool = await connectDB();
        app.locals.db = pool;
        console.log('✅ Database connected successfully');
    } catch (err) {
        console.error('❌ Lỗi kết nối SQL Server:', err.message);
        app.locals.db = null;
    }
}

initializeDatabase();

// ========== DEFAULT ROUTE ==========
app.get('/', (req, res) => {
    const homePath = path.join(__dirname, '../User_FE/html/home.html');
    if (fs.existsSync(homePath)) {
        res.sendFile(homePath);
    } else {
        res.send('Welcome to Football Store');
    }
});

// ========== SEARCH ROUTES ==========
app.get('/search.html', (req, res) => {
    const filePath = path.join(__dirname, '../User_FE/html/search-results.html');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        // Fallback: tạo trang tìm kiếm đơn giản
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Tìm kiếm sản phẩm</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                    .search-box { display: flex; margin: 50px 0; }
                    input { flex: 1; padding: 12px; font-size: 16px; }
                    button { padding: 12px 24px; background: #1a3e72; color: white; border: none; cursor: pointer; }
                </style>
            </head>
            <body>
                <h1>Tìm kiếm sản phẩm</h1>
                <div class="search-box">
                    <input type="text" id="search-input" placeholder="Nhập từ khóa tìm kiếm...">
                    <button onclick="search()">Tìm kiếm</button>
                </div>
                <div id="results"></div>
                <script>
                    function search() {
                        const term = document.getElementById('search-input').value;
                        if (term.length >= 2) {
                            window.location.href = '/api/products/search?q=' + encodeURIComponent(term);
                        }
                    }
                </script>
            </body>
            </html>
        `);
    }
});

// ========== START SERVER ==========
const PORT = 3000;
app.listen(PORT, () => {
});