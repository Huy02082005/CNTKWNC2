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

app.use('/product', require('./routes/productRoutes'));
app.use('/api/product', require('./routes/productRoutes'));

app.use('/api/simple', simpleHomeRoutes);
app.use('/api/images', require('./routes/imageRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/customer', require('./routes/authCustomerRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes')); 

app.post('/api/customer/reset-password', async (req, res) => {
    try {
        console.log('✅ RESET PASSWORD ENDPOINT');
        const { email, newPassword } = req.body;
        
        // Validate
        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu mới'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }
        
        if (!app.locals.db) {
            return res.status(500).json({
                success: false,
                message: 'Database không kết nối'
            });
        }
        
        // 1. Kiểm tra email tồn tại
        const checkRequest = app.locals.db.request();
        const checkResult = await checkRequest
            .input('userEmail', email)
            .query(`
                SELECT CustomerID, Password, Email 
                FROM Customer 
                WHERE Email = @userEmail AND Status = 1
            `);
        
        if (!checkResult.recordset || checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Email không tồn tại trong hệ thống'
            });
        }
        
        const customer = checkResult.recordset[0];
        
        // 2. Kiểm tra mật khẩu mới có trùng với cũ không
        if (newPassword === customer.Password) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới không được trùng với mật khẩu cũ'
            });
        }
        
        // 3. Cập nhật mật khẩu mới - SỬA: dùng LastLogin thay vì UpdateDate
        const updateRequest = app.locals.db.request();
        await updateRequest
            .input('userEmail', email)
            .input('userPassword', newPassword)
            .query(`
                UPDATE Customer 
                SET Password = @userPassword, 
                    LastLogin = GETDATE()  -- Sửa: dùng LastLogin thay vì UpdateDate
                WHERE Email = @userEmail AND Status = 1
            `);
        
        console.log(`✅ Password updated for: ${email}`);
        
        res.json({
            success: true,
            message: 'Đặt lại mật khẩu thành công!',
            customerId: customer.CustomerID,
            email: email
        });
        
    } catch (error) {
        console.error('❌ Reset password error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
});

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

app.post('/api/customer/check-phone', async (req, res) => {    
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({
                success: false,
                exists: false,
                message: 'Vui lòng cung cấp số điện thoại'
            });
        }
        
        // Kiểm tra định dạng cơ bản
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                exists: false,
                message: 'Số điện thoại không đúng định dạng'
            });
        }
        
        // Kiểm tra database connection
        if (!app.locals.db) {
            console.error('❌ Database not connected');
            return res.status(500).json({
                success: false,
                exists: false,
                message: 'Database not connected'
            });
        }
        
        try {
            const request = app.locals.db.request();
            // CHỈ DÙNG CỘT Phone
            const query = `
                SELECT COUNT(*) as count 
                FROM Customer 
                WHERE Phone = @phone AND Status = 1
            `;
            
            const result = await request
                .input('phone', phone)
                .query(query);
            
            const exists = result.recordset[0]?.count > 0;
      
            res.json({
                success: true,
                exists: exists,
                message: exists ? 'Số điện thoại đã được đăng ký' : 'Số điện thoại hợp lệ'
            });
            
        } catch (dbError) {
            console.error('❌ Database error:', dbError.message);
            
            // Thử query khác nếu cần
            try {
                const testRequest = app.locals.db.request();
                // Kiểm tra trực tiếp với phone cụ thể
                const testResult = await testRequest.query(`SELECT * FROM Customer WHERE Phone = '${phone}'`);
                
                const exists = testResult.recordset.length > 0;
                res.json({
                    success: true,
                    exists: exists,
                    message: exists ? 'Số điện thoại đã được đăng ký' : 'Số điện thoại hợp lệ'
                });
                
            } catch (testError) {
                console.error('❌ Test query also failed:', testError.message);
                res.status(500).json({
                    success: false,
                    exists: false,
                    message: 'Database error: ' + testError.message
                });
            }
        }
        
    } catch (error) {
        console.error('❌ General error in check-phone:', error.message);
        res.status(500).json({
            success: false,
            exists: false,
            message: 'Có lỗi xảy ra: ' + error.message
        });
    } finally {
        console.log('📱 === END check-phone API ===');
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

// ========== ENDPOINT HỦY ĐƠN HÀNG ==========
app.put('/api/order/:orderId/cancel', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log(`🔄 Cancelling order ${orderId}`);
        
        if (!app.locals.db) {
            return res.status(500).json({
                success: false,
                message: 'Database không kết nối'
            });
        }
        
        // 1. Kiểm tra đơn hàng có tồn tại không
        const checkRequest = app.locals.db.request();
        const checkResult = await checkRequest
            .input('orderId', orderId)
            .query(`
                SELECT OrderID, CustomerID, Status 
                FROM [Order] 
                WHERE OrderID = @orderId
            `);
        
        if (!checkResult.recordset || checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại'
            });
        }
        
        const order = checkResult.recordset[0];
        
        // 2. Kiểm tra trạng thái đơn hàng (chỉ hủy được khi pending)
        if (order.Status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Không thể hủy đơn hàng ở trạng thái "${order.Status}". Chỉ có thể hủy khi đơn hàng đang "Chờ xác nhận"`
            });
        }
        
        // 3. Cập nhật trạng thái đơn hàng thành cancelled
        const updateRequest = app.locals.db.request();
        await updateRequest
            .input('orderId', orderId)
            .query(`
                UPDATE [Order] 
                SET Status = 'cancelled'
                WHERE OrderID = @orderId
            `);
        
        // 4. Cập nhật lại số lượng tồn kho (restore stock)
        try {
            const restoreStockRequest = app.locals.db.request();
            await restoreStockRequest
                .input('orderId', orderId)
                .query(`
                    UPDATE p
                    SET p.StockQuantity = p.StockQuantity + oi.Quantity
                    FROM Product p
                    INNER JOIN OrderItem oi ON p.ProductID = oi.ProductID
                    WHERE oi.OrderID = @orderId
                `);
            console.log(`✅ Restored stock for order ${orderId}`);
        } catch (stockError) {
            console.log(`⚠️ Could not restore stock: ${stockError.message}`);
            // Vẫn tiếp tục vì việc hủy đơn hàng là chính
        }
        
        console.log(`✅ Order ${orderId} cancelled successfully`);
        
        res.json({
            success: true,
            message: 'Đã hủy đơn hàng thành công',
            orderId: orderId,
            newStatus: 'cancelled'
        });
        
    } catch (error) {
        console.error('❌ Error cancelling order:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
});

app.get('/api/order/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log(`📦 API: Loading order detail ${orderId}`);
        
        if (!app.locals.db) {
            return res.status(500).json({
                success: false,
                message: 'Database không kết nối'
            });
        }
        
        const request = app.locals.db.request();
        
        // Lấy thông tin đơn hàng
        const orderQuery = `
            SELECT 
                o.*,
                c.FullName,
                c.Email,
                c.Phone,
                c.Address
            FROM [Order] o
            LEFT JOIN Customer c ON o.CustomerID = c.CustomerID
            WHERE o.OrderID = @orderId
        `;
        
        const orderResult = await request
            .input('orderId', orderId)
            .query(orderQuery);
        
        if (!orderResult.recordset || orderResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Đơn hàng không tồn tại'
            });
        }
        
        const order = orderResult.recordset[0];
        
        // Lấy danh sách sản phẩm trong đơn hàng
        try {
            const itemsRequest = app.locals.db.request();
            const itemsResult = await itemsRequest
                .input('orderId', orderId)
                .query(`
                    SELECT 
                        oi.*,
                        p.ProductName,
                        p.ImageURL,
                        b.BrandName,
                        l.LeagueName
                    FROM OrderItem oi
                    LEFT JOIN Product p ON oi.ProductID = p.ProductID
                    LEFT JOIN Brand b ON p.BrandID = b.BrandID
                    LEFT JOIN League l ON p.LeagueID = l.LeagueID
                    WHERE oi.OrderID = @orderId
                `);
            
            order.Items = itemsResult.recordset || [];
        } catch (itemsError) {
            console.log('⚠️ Could not load order items:', itemsError.message);
            order.Items = [];
        }
        
        res.json({
            success: true,
            order: order
        });
        
    } catch (error) {
        console.error('❌ Error loading order detail:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
});

// ========== PRODUCTS LIST ENDPOINT ==========
app.get('/api/products', async (req, res) => {
    try {
        console.log('📦 API /api/products called with query:', req.query);
        
        if (!app.locals.db) {
            console.error('❌ Database not connected');
            return res.status(500).json({ 
                success: false, 
                error: 'Database not connected' 
            });
        }

        // Lấy query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 16;
        const offset = (page - 1) * limit;

        console.log(`📊 Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

        const request = app.locals.db.request();
        
        // Query cơ bản để lấy sản phẩm - SỬA LẠI THEO CẤU TRÚC BẢNG
        const productsQuery = `
            SELECT 
                p.ProductID as id,
                p.ProductName as name,
                p.SellingPrice as price,
                p.ImportPrice as importPrice,  -- Thay OriginalPrice bằng ImportPrice
                p.Discount as discount,
                p.StockQuantity as stock,
                p.ImageURL as image,
                c.CategoryName as category,
                b.BrandName as brand,
                l.LeagueName as league,
                p.Status as status,
                p.CreateDate as createdAt,
                p.Season as season,
                p.PlayerName as playerName,
                p.Description as description
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            WHERE p.Status = 'active'
            ORDER BY p.ProductID DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        // Query đếm tổng số sản phẩm
        const countQuery = `
            SELECT COUNT(*) as total
            FROM Product p
            WHERE p.Status = 'active'
        `;

        // Thực thi query
        console.log('📡 Executing products query...');
        const productsResult = await request
            .input('offset', offset)
            .input('limit', limit)
            .query(productsQuery);

        console.log('📡 Executing count query...');
        const countResult = await request.query(countQuery);

        const products = productsResult.recordset || [];
        const total = countResult.recordset[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        console.log(`✅ Found ${products.length} products, total: ${total}, pages: ${totalPages}`);

        // Format image URLs
        const formattedProducts = products.map(product => {
            let imageUrl = product.image || '';
            
            // Fix image path
            if (imageUrl && imageUrl.startsWith('/html/')) {
                imageUrl = imageUrl.replace('/html/', '/');
            } else if (imageUrl && !imageUrl.startsWith('/image/') && !imageUrl.startsWith('http')) {
                // If it's just a filename, add /image/ prefix
                if (!imageUrl.includes('/')) {
                    imageUrl = '/image/' + imageUrl;
                }
            }
            
            // Default image if empty
            if (!imageUrl) {
                imageUrl = '/image/default-product.jpg';
            }

            // Calculate discounted price
            const discountedPrice = product.discount > 0 
                ? Math.round(product.price - (product.price * product.discount / 100))
                : product.price;

            // Tính original price (nếu có discount thì original price = selling price)
            const originalPrice = product.discount > 0 ? product.price : null;

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: originalPrice, // Sửa thành null hoặc = price nếu có discount
                importPrice: product.importPrice || 0, // Thêm importPrice
                discount: product.discount || 0,
                discountedPrice: discountedPrice,
                stock: product.stock || 0,
                image: imageUrl,
                category: product.category || 'Uncategorized',
                brand: product.brand || 'Unknown',
                league: product.league || '',
                status: product.status || 'active',
                season: product.season || '',
                playerName: product.playerName || '',
                description: product.description || '',
                createdAt: product.createdAt
            };
        });

        res.json({
            success: true,
            products: formattedProducts,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            message: `Đã tải ${formattedProducts.length} sản phẩm`
        });

    } catch (error) {
        console.error('❌ Error in /api/products:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi tải danh sách sản phẩm',
            message: error.message,
            details: error.stack
        });
    }
});

// ========== PRODUCTS FILTER ENDPOINT ==========
app.get('/api/products/filtered', async (req, res) => {
    try {
        console.log('🔍 API /api/products/filtered called with query:', req.query);
        
        if (!app.locals.db) {
            console.error('❌ Database not connected');
            return res.status(500).json({ 
                success: false, 
                error: 'Database not connected' 
            });
        }

        // Lấy query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 16;
        const offset = (page - 1) * limit;

        const prices = req.query.prices ? req.query.prices.split(',') : [];
        const categories = req.query.categories ? req.query.categories.split(',') : [];
        const brands = req.query.brands ? req.query.brands.split(',') : [];
        const leagues = req.query.leagues ? req.query.leagues.split(',') : [];

        console.log('🔍 Raw Filters:', { prices, categories, brands, leagues });

        const request = app.locals.db.request();
        
        // Xây dựng query động
        let whereConditions = ["p.Status = 'active'"];

        // 1. Xử lý PRICE filter
        if (prices.length > 0) {
    const priceConditions = [];
    
    prices.forEach(priceRange => {
        console.log(`Processing price range: ${priceRange}`);
        
        // Xử lý theo ĐÚNG 3 khoảng giá từ HTML
        if (priceRange === 'duoi500' || priceRange === 'duoi-500k') {
            priceConditions.push('p.SellingPrice < 500000');
        }
        else if (priceRange === '500-1000' || priceRange === '500k-1m') {
            priceConditions.push('p.SellingPrice >= 500000 AND p.SellingPrice <= 1000000');
        }
        else if (priceRange === 'tren1000' || priceRange === 'over-1m') {
            priceConditions.push('p.SellingPrice > 1000000');
        }
    });
    
    if (priceConditions.length > 0) {
        whereConditions.push(`(${priceConditions.join(' OR ')})`);
    }
}

        // 2. Xử lý CATEGORY filter
        if (categories.length > 0) {
            const mappedCategories = categories.map(cat => {
                switch(cat) {
                    case 'ao-bong-da': return 'Áo bóng đá';
                    case 'giay-bong-da': return 'Giày bóng đá';
                    case 'phu-kien': return 'Phụ kiện';
                    case 'ao-khoac': return 'Áo khoác';
                    case 'gang-tay': return 'Găng tay';
                    default: return cat;
                }
            });
            
            const categoryPlaceholders = mappedCategories.map((_, idx) => `@category${idx}`).join(',');
            whereConditions.push(`c.CategoryName IN (${categoryPlaceholders})`);
            mappedCategories.forEach((cat, idx) => {
                request.input(`category${idx}`, cat);
            });
        }

        // 3. Xử lý BRAND filter
        if (brands.length > 0) {
            const mappedBrands = brands.map(brand => {
                switch(brand) {
                    case 'nike': return 'Nike';
                    case 'adidas': return 'Adidas';
                    case 'puma': return 'Puma';
                    case 'mizuno': return 'Mizuno';
                    case 'new-balance': return 'New Balance';
                    default: return brand;
                }
            });
            
            const brandPlaceholders = mappedBrands.map((_, idx) => `@brand${idx}`).join(',');
            whereConditions.push(`b.BrandName IN (${brandPlaceholders})`);
            mappedBrands.forEach((brand, idx) => {
                request.input(`brand${idx}`, brand);
            });
        }

        // 4. Xử lý LEAGUE filter - FIX QUAN TRỌNG
        if (leagues.length > 0) {
            const leagueNames = [];   // Cho các league thông thường
            const leagueTypes = [];   // Cho đội tuyển quốc gia
            
            // Phân loại league
            leagues.forEach(league => {
                switch(league) {
                    case 'premier-league': 
                        leagueNames.push('Premier League'); 
                        break;
                    case 'la-liga': 
                        leagueNames.push('La Liga'); 
                        break;
                    case 'serie-a': 
                        leagueNames.push('Serie A'); 
                        break;
                    case 'bundesliga': 
                        leagueNames.push('Bundesliga'); 
                        break;
                    case 'ligue-1': 
                        leagueNames.push('Ligue 1'); 
                        break;
                    case 'v-league': 
                        leagueNames.push('V-League'); 
                        break;
                    case 'doi-tuyen-quoc-gia': 
                        leagueTypes.push('NATIONAL');  // Type = 'NATIONAL'
                        break;
                }
            });
            
            const leagueConditions = [];
            
            // Điều kiện cho LeagueName (giải đấu thông thường)
            if (leagueNames.length > 0) {
                const namePlaceholders = leagueNames.map((_, idx) => `@leagueName${idx}`).join(',');
                leagueConditions.push(`l.LeagueName IN (${namePlaceholders})`);
                leagueNames.forEach((name, idx) => {
                    request.input(`leagueName${idx}`, name);
                });
            }
            
            // Điều kiện cho Type (đội tuyển quốc gia)
            if (leagueTypes.length > 0) {
                const typePlaceholders = leagueTypes.map((_, idx) => `@leagueType${idx}`).join(',');
                leagueConditions.push(`l.Type IN (${typePlaceholders})`);
                leagueTypes.forEach((type, idx) => {
                    request.input(`leagueType${idx}`, type);
                });
            }
            
            if (leagueConditions.length > 0) {
                whereConditions.push(`(${leagueConditions.join(' OR ')})`);
            }
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : 'WHERE p.Status = \'active\'';

        console.log('🔍 Final SQL Where clause:', whereClause);

        // Query sản phẩm
        const productsQuery = `
            SELECT 
                p.ProductID as id,
                p.ProductName as name,
                p.SellingPrice as price,
                p.ImportPrice as importPrice,
                p.Discount as discount,
                p.StockQuantity as stock,
                p.ImageURL as image,
                c.CategoryName as category,
                b.BrandName as brand,
                l.LeagueName as league,
                l.Type as leagueType,
                p.Status as status,
                p.CreateDate as createdAt
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            ${whereClause}
            ORDER BY p.CreateDate DESC
            OFFSET @offset ROWS
            FETCH NEXT @limit ROWS ONLY
        `;

        // Query đếm
        const countQuery = `
            SELECT COUNT(*) as total
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            ${whereClause}
        `;

        // Thêm các tham số pagination
        request.input('offset', offset);
        request.input('limit', limit);

        console.log('📡 Executing products query with filters...');
        const productsResult = await request.query(productsQuery);
        
        // Tạo request mới cho count query
        const countRequest = app.locals.db.request();
        
        // Add lại các tham số filter cho count query
        if (categories.length > 0) {
            const mappedCategories = categories.map(cat => {
                switch(cat) {
                    case 'ao-bong-da': return 'Áo bóng đá';
                    case 'giay-bong-da': return 'Giày bóng đá';
                    case 'phu-kien': return 'Phụ kiện';
                    case 'ao-khoac': return 'Áo khoác';
                    case 'gang-tay': return 'Găng tay';
                    default: return cat;
                }
            });
            mappedCategories.forEach((cat, idx) => {
                countRequest.input(`category${idx}`, cat);
            });
        }
        
        if (brands.length > 0) {
            const mappedBrands = brands.map(brand => {
                switch(brand) {
                    case 'nike': return 'Nike';
                    case 'adidas': return 'Adidas';
                    case 'puma': return 'Puma';
                    case 'mizuno': return 'Mizuno';
                    case 'new-balance': return 'New Balance';
                    default: return brand;
                }
            });
            mappedBrands.forEach((brand, idx) => {
                countRequest.input(`brand${idx}`, brand);
            });
        }
        
        if (leagues.length > 0) {
            const leagueNames = [];
            const leagueTypes = [];
            
            leagues.forEach(league => {
                switch(league) {
                    case 'premier-league': leagueNames.push('Premier League'); break;
                    case 'la-liga': leagueNames.push('La Liga'); break;
                    case 'serie-a': leagueNames.push('Serie A'); break;
                    case 'bundesliga': leagueNames.push('Bundesliga'); break;
                    case 'ligue-1': leagueNames.push('Ligue 1'); break;
                    case 'v-league': leagueNames.push('V-League'); break;
                    case 'doi-tuyen-quoc-gia': leagueTypes.push('NATIONAL'); break;
                }
            });
            
            if (leagueNames.length > 0) {
                leagueNames.forEach((name, idx) => {
                    countRequest.input(`leagueName${idx}`, name);
                });
            }
            
            if (leagueTypes.length > 0) {
                leagueTypes.forEach((type, idx) => {
                    countRequest.input(`leagueType${idx}`, type);
                });
            }
        }
        
        countRequest.input('offset', offset);
        countRequest.input('limit', limit);

        const countResult = await countRequest.query(countQuery);

        const products = productsResult.recordset || [];
        const total = countResult.recordset[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);

        console.log(`✅ Filtered ${products.length} products, total: ${total}, pages: ${totalPages}`);

        // Format products
        const formattedProducts = products.map(product => {
            let imageUrl = product.image || '';
            
            // Fix image path
            if (imageUrl && imageUrl.startsWith('/html/')) {
                imageUrl = imageUrl.replace('/html/', '/');
            } else if (imageUrl && !imageUrl.startsWith('/image/') && !imageUrl.startsWith('http')) {
                if (!imageUrl.includes('/')) {
                    imageUrl = '/image/' + imageUrl;
                }
            }
            
            if (!imageUrl) {
                imageUrl = '/image/default-product.jpg';
            }

            // Calculate discounted price
            const discountedPrice = product.discount > 0 
                ? Math.round(product.price - (product.price * product.discount / 100))
                : product.price;

            // Tính original price
            const originalPrice = product.discount > 0 ? product.price : null;

            // Xác định loại league để hiển thị
            let displayLeague = product.league;
            if (product.leagueType === 'NATIONAL') {
                displayLeague = 'Đội tuyển quốc gia';
            }

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: originalPrice,
                importPrice: product.importPrice || 0,
                discount: product.discount || 0,
                discountedPrice: discountedPrice,
                stock: product.stock || 0,
                image: imageUrl,
                category: product.category || 'Uncategorized',
                brand: product.brand || 'Unknown',
                league: displayLeague,
                leagueType: product.leagueType,
                status: product.status || 'active',
                createdAt: product.createdAt
            };
        });

        res.json({
            success: true,
            products: formattedProducts,
            total: total,
            totalPages: totalPages,
            currentPage: page,
            filtersApplied: {
                prices: prices,
                categories: categories,
                brands: brands,
                leagues: leagues
            },
            message: `Đã tìm thấy ${formattedProducts.length} sản phẩm`
        });

    } catch (error) {
        console.error('❌ ERROR DETAILS in /api/products/filtered:');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({ 
            success: false, 
            error: 'Lỗi lọc sản phẩm',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

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