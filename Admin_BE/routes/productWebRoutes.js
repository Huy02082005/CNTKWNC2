const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Route hiển thị trang chi tiết sản phẩm
router.get('/product/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Lấy thông tin sản phẩm
        const productQuery = `
            SELECT p.*, 
                   c.CategoryName, 
                   b.BrandName, 
                   l.LeagueName,
                   l.Country,
                   ps.SizeName,
                   ps.SizeType,
                   psm.StockQuantity as SizeStock
            FROM Product p
            LEFT JOIN Category c ON p.CategoryID = c.CategoryID
            LEFT JOIN Brand b ON p.BrandID = b.BrandID
            LEFT JOIN League l ON p.LeagueID = l.LeagueID
            LEFT JOIN ProductSizeMapping psm ON p.ProductID = psm.ProductID
            LEFT JOIN ProductSize ps ON psm.SizeID = ps.SizeID
            WHERE p.ProductID = @productId AND p.Status = 'active'
        `;
        
        const product = await db.query(productQuery, { productId });
        
        if (!product || product.length === 0) {
            return res.status(404).render('404', { message: 'Sản phẩm không tồn tại' });
        }
        
        // Lấy các sizes có sẵn
        const sizesQuery = `
            SELECT ps.SizeID, ps.SizeName, ps.SizeType, psm.StockQuantity
            FROM ProductSizeMapping psm
            JOIN ProductSize ps ON psm.SizeID = ps.SizeID
            WHERE psm.ProductID = @productId AND psm.IsActive = 1 AND psm.StockQuantity > 0
            ORDER BY ps.SizeType, ps.SizeName
        `;
        
        const sizes = await db.query(sizesQuery, { productId });
        
        // Lấy sản phẩm liên quan (cùng category hoặc league)
        const relatedQuery = `
            SELECT TOP 4 p.ProductID, p.ProductName, p.ImageURL, p.SellingPrice, p.Discount
            FROM Product p
            WHERE (p.CategoryID = @categoryId OR p.LeagueID = @leagueId)
                  AND p.ProductID != @productId
                  AND p.Status = 'active'
            ORDER BY NEWID()
        `;
        
        const relatedProducts = await db.query(relatedQuery, {
            categoryId: product[0].CategoryID,
            leagueId: product[0].LeagueID,
            productId
        });
        
        // Render trang chi tiết
        res.render('product-detail', {
            title: product[0].ProductName,
            product: product[0],
            sizes,
            relatedProducts,
            discountedPrice: calculateDiscountedPrice(product[0].SellingPrice, product[0].Discount)
        });
        
    } catch (error) {
        console.error('Error loading product:', error);
        res.status(500).render('error', { message: 'Lỗi tải sản phẩm' });
    }
});

// Tính giá sau giảm
function calculateDiscountedPrice(price, discount) {
    return price - (price * (discount / 100));
}

module.exports = router;