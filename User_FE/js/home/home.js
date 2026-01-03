// ========== HOME PAGE LOGIC ==========
// File: /User_FE/js/home.js
// Chỉ xử lý logic, không render HTML

const { IS_LIVE_SERVER, BASE_URL } = window.ImageUtils;
const API_BASE_URL = `${BASE_URL}/api/simple`;

console.log('🏠 Home page logic loaded');

// ========== PRODUCT LOADING ==========

async function loadHomeProducts() {
    try {
        console.log('🔄 Loading home products...');
        
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.products && data.products.length > 0) {
                console.log(`✅ Loaded ${data.products.length} products`);
                initHomeProductDisplay(data.products);
                return;
            }
        }
        
        // Fallback to mock data
        useMockProducts();
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        useMockProducts();
    }
}

function initHomeProductDisplay(products) {
    const container = document.getElementById('featured-products');
    if (!container) {
        console.error('❌ #featured-products not found');
        return;
    }
    
    // Initialize ProductDisplay component
    const productDisplay = new ProductDisplay({
        container: container,
        products: products,
        columns: 4,
        showQuickAdd: true,
        showDiscount: true,
        showStock: true,
        clickable: true,
        
        // Custom event handlers
        onProductClick: (productId) => {
            console.log(`👉 Product clicked: ${productId}`);
            navigateToProductDetail(productId);
        },
        
        onAddToCart: (productId) => {
            console.log(`🛒 Add to cart clicked: ${productId}`);
            addProductToCart(productId);
        }
    });
    
    productDisplay.render();
}

function useMockProducts() {
    console.log('🔄 Using mock products');
    
    const mockProducts = [
        {
            ProductID: 1,
            ProductName: "Áo Manchester United 2024/25",
            ImageURL: "image/clothes/1.jpg",
            SellingPrice: 850000,
            Discount: 15,
            StockQuantity: 55,
            CategoryID: 1,
            BrandName: "Adidas"
        },
        {
            ProductID: 2,
            ProductName: "Áo Manchester City 2024/25",
            ImageURL: "image/clothes/2.jpg",
            SellingPrice: 820000,
            Discount: 10,
            StockQuantity: 49,
            CategoryID: 1,
            BrandName: "Puma"
        }
    ];
    
    initHomeProductDisplay(mockProducts);
}

// ========== CART LOGIC ==========

function addProductToCart(productId) {
    console.log(`🛒 Adding product ${productId} to cart`);
    // Your cart logic here
}

function loadCartCount() {
    // Your cart count logic
}

// ========== NAVIGATION ==========

function navigateToProductDetail(productId) {
    window.location.href = `${BASE_URL}/product-detail.html?id=${productId}`;
}

// ========== EVENT HANDLERS ==========

function setupHomeEventListeners() {
    // View more button
    const viewMoreBtn = document.querySelector('.btn-view-more');
    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', () => {
            window.location.href = '/User_FE/html/see_all.html';
        });
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Cảm ơn bạn đã liên hệ!');
            contactForm.reset();
        });
    }
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 Home page initialized');
    
    // Load products
    loadHomeProducts();
    
    // Setup event listeners
    setupHomeEventListeners();
    
    // Load cart
    loadCartCount();
});