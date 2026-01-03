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

// Cấu hình chính cho User_FE
app.use(express.static(path.join(__dirname, '../User_FE')));

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
app.use('/api/simple', simpleHomeRoutes);
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/products', require('./routes/userProductRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/customer', require('./routes/authCustomerRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));

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

// API alias
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

// ========== 404 HANDLER ==========
app.use((req, res) => {
    console.log(`❌ 404: ${req.url} not found`);
    res.status(404).send(`
        <h1>404 - File Not Found</h1>
        <p>The requested URL ${req.url} was not found on this server.</p>
        <p>Try these links:</p>
        <ul>
            <li><a href="/home.html">Home</a></li>
            <li><a href="/product-detail.html?id=1">Product Detail</a></li>
            <li><a href="/see_all.html">See All Products</a></li>
        </ul>
    `);
});

// ========== START SERVER ==========
const PORT = 3000;
app.listen(PORT, () => {
});