// ========== SHOES PAGE DATA HANDLER ==========
// File: /User_FE/js/shoes.js
// CHỈ xử lý dữ liệu - LUÔN lấy category 2

document.addEventListener('DOMContentLoaded', function() {
    console.log('👟 Shoes page loaded - Using see_all filter system');
    
    // Khởi tạo Pagination
    if (window.Pagination) {
        Pagination.initPagination();
        Pagination.setCallback(loadPage);
        console.log('✅ Pagination initialized');
    }
    
    // BÊ NGUYÊN: Khởi tạo bộ lọc (sẽ sửa cho shoes)
    initShoesFilters();
    
    // Tải sản phẩm đầu tiên với filter mặc định
    applyShoesDefaultFilter();
});

// ========== GLOBAL DATA ==========
let currentFilters = null;

// ========== BÊ NGUYÊN FILTER SYSTEM FROM see_all.js ==========
// Map giá trị checkbox sang giá trị trong database
const CATEGORY_MAP = {
    'ao-bong-da': 'Áo đấu',
    'giay-bong-da': 'Giày bóng đá',  // Category 2
    'phu-kien': 'Phụ kiện',
    'ao-khoac': 'Áo khoác thể thao',
    'gang-tay': 'Găng tay thủ môn'
};

const BRAND_MAP = {
    'nike': 'Nike',
    'adidas': 'Adidas',
    'puma': 'Puma',
    'mizuno': 'Mizuno',
    'newbalance': 'New Balance'
};

// ========== MODIFY: SHOES-SPECIFIC FILTER INIT ==========
function initShoesFilters() {    
    console.log('🔧 Initializing SHOES filters...');
    
    // 1. Đảm bảo checkbox "Còn hàng" được chọn mặc định (BÊ NGUYÊN)
    const activeCheckbox = document.querySelector('input[name="status"][value="active"]');
    if (activeCheckbox && !activeCheckbox.checked) {
        activeCheckbox.checked = true;
    }
    
    // 2. Gắn sự kiện cho tất cả checkbox (BÊ NGUYÊN)
    document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyFilters(); // Gọi hàm gốc
        });
    });
    
    console.log('✅ Shoes filters initialized');
}

// ========== BÊ NGUYÊN: COLLECT FILTERS ==========
function collectFilters() {
    const filters = {
        prices: [],
        categories: [],
        brands: [],
        leagues: [],
        status: []
    };
    
    document.querySelectorAll('input[name="price"]:checked').forEach(cb => {
        filters.prices.push(cb.value);
    });
    
    // FORCE: LUÔN có category shoes
    filters.categories = ['Giày bóng đá'];
    
    document.querySelectorAll('input[name="brand"]:checked').forEach(cb => {
        filters.brands.push(BRAND_MAP[cb.value] || cb.value);
    });
    
    document.querySelectorAll('input[name="status"]:checked').forEach(cb => {
        filters.status.push(cb.value);
    });
    
    console.log('📋 Collected filters:', filters);
    return filters;
}

// ========== MODIFY: SHOES DEFAULT FILTER ==========
function applyShoesDefaultFilter() {
    console.log('🔘 Applying default SHOES filter...');
    
    // Force category cho shoes page
    const filters = collectFilters();
    
    // Đảm bảo luôn có category shoes
    filters.categories = ['Giày bóng đá'];
    
    // Gọi hàm gốc
    applyFiltersWithData(filters);
}

// ========== BÊ NGUYÊN: APPLY FILTERS ==========
function applyFilters() {
    console.log('🔘 Áp dụng bộ lọc...');
    
    // Thu thập filter
    const filters = collectFilters();
    
    // Kiểm tra có filter nào không
    const hasAnyFilter = filters.prices.length > 0 || filters.brands.length > 0 || filters.status.length > 0;
    
    if (hasAnyFilter) {
        console.log('✅ Có filter, gọi API filter...');
        currentFilters = filters;
        loadProductsWithFilters(filters, 1);
    } else {
        console.log('✅ Không có filter, tải tất cả sản phẩm giày');
        currentFilters = filters; // Vẫn giữ category shoes
        loadProductsWithFilters(filters, 1);
    }
}

// ========== MODIFY: APPLY FILTERS WITH DATA ==========
function applyFiltersWithData(filters) {
    console.log('🔘 Applying filters with data...', filters);
    
    // Luôn gọi API filter cho shoes
    currentFilters = filters;
    loadProductsWithFilters(filters, 1);
}

// ========== BÊ NGUYÊN: LOAD PRODUCTS WITH FILTERS ==========
async function loadProductsWithFilters(filters, page = 1) {
    try {
        // Tạo query string
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', window.Pagination?.getProductsPerPage() || 16);
        
        // LUÔN thêm category shoes
        queryParams.append('categories', 'Giày bóng đá');
        
        // Thêm filters
        if (filters.prices && filters.prices.length > 0) 
            queryParams.append('prices', filters.prices.join(','));
        
        if (filters.brands && filters.brands.length > 0) 
            queryParams.append('brands', filters.brands.join(','));
        
        if (filters.status && filters.status.length > 0) 
            queryParams.append('status', filters.status.join(','));
        
        // Shoes không có league filter, nhưng để nguyên
        if (filters.leagues && filters.leagues.length > 0) 
            queryParams.append('leagues', filters.leagues.join(','));
        
        const url = `/api/products/filtered?${queryParams.toString()}`;
        console.log('🌐 Gọi API filter:', url);
        
        // Hiển thị loading
        showLoading(true);
        
        // Gọi API
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Filter API trả về lỗi ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Filter không thành công');
        }
        
        // Cập nhật phân trang
        if (window.Pagination) {
            window.Pagination.updatePaginationInfo(
                data.total || 0,
                data.totalPages || 1
            );
            
            // Tạo phân trang controls
            window.Pagination.createPaginationControls();
        }
        
        // Hiển thị sản phẩm
        displayProducts(data.products || []);
        
        // Nếu không có sản phẩm, hiển thị thông báo
        if (!data.products || data.products.length === 0) {
            const productGrid = document.querySelector('.product-grid');
            if (productGrid) {
                productGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                        <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 40px; max-width: 500px; margin: 0 auto;">
                            <div style="font-size: 48px; margin-bottom: 20px;">😕</div>
                            <h3 style="color: #666; margin-bottom: 15px;">Không tìm thấy sản phẩm</h3>
                            <p style="color: #888; margin-bottom: 20px;">Không có sản phẩm nào phù hợp với bộ lọc hiện tại.</p>
                            <button onclick="applyShoesDefaultFilter()" style="padding: 10px 25px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 500;">
                                🔄 Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error('❌ Filter error:', error);
        showError(error);
    }
}

// ========== BÊ NGUYÊN: LOAD PRODUCTS ==========
async function loadProducts(page = 1) {
    try {
        console.log(`📡 Loading page ${page}...`);
        
        // Hiển thị loading
        showLoading();
        
        // Gọi API với category shoes mặc định
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', window.Pagination?.getProductsPerPage() || 16);
        queryParams.append('categories', 'Giày bóng đá');
        
        const url = `/api/products/filtered?${queryParams.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API error ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'API failed');
        }
        
        if (!data.products || !Array.isArray(data.products)) {
            throw new Error('No products');
        }
        
        // Cập nhật phân trang
        if (window.Pagination) {
            window.Pagination.updatePaginationInfo(
                data.total || 0,
                data.totalPages || 1
            );
            
            // Tạo phân trang controls
            window.Pagination.createPaginationControls();
        }
        
        // Hiển thị sản phẩm
        displayProducts(data.products);
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showError(error);
    }
}

// ========== BÊ NGUYÊN: DISPLAY FUNCTIONS ==========
function showLoading(isFiltering = false) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <div style="display: inline-block; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                <p style="margin-bottom: 10px; color: #666;">
                    ${isFiltering ? '🔄 Đang lọc' : '🔄 Đang tải'} sản phẩm...
                </p>
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1a3e72; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
        </div>
    `;
}

function displayProducts(products) {
    if (window.ProductDisplay && typeof window.ProductDisplay === 'function') {
        const productGrid = document.querySelector('.product-grid');
        if (productGrid) {
            const display = new window.ProductDisplay({
                container: productGrid,
                products: products,
                columns: 4,
                showQuickAdd: true,
                showDiscount: true,
                showStock: true,
                clickable: true
            });
            display.render();
        }
    } else {
        console.error('❌ ProductDisplay not available');
    }
}

function showError(error) {
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 10px; padding: 30px; max-width: 500px; margin: 0 auto;">
                    <h3 style="color: #e53e3e; margin-bottom: 15px;">⚠️ Lỗi hệ thống</h3>
                    <p style="color: #666; margin-bottom: 10px;">${error.message || 'Lỗi không xác định'}</p>
                    <div style="margin-top: 20px;">
                        <button onclick="applyShoesDefaultFilter()" style="padding: 10px 20px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🔄 Thử lại
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// ========== PAGINATION HANDLER ==========
async function loadPage(page) {
    console.log('📄 Loading page:', page);
    
    if (currentFilters) {
        await loadProductsWithFilters(currentFilters, page);
    } else {
        await loadProducts(page);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== DATA EXPORTS ==========
window.ShoesData = {
    applyFilters: applyShoesDefaultFilter,
    getCurrentFilters: () => currentFilters
};