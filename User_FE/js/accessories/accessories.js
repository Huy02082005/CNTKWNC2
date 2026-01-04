// ========== ACCESSORIES PAGE DATA HANDLER ==========
// File: /User_FE/js/accessories.js
// CHỈ xử lý dữ liệu - LUÔN lấy category 3 (Phụ kiện)

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎒 Accessories page loaded - Using see_all filter system');
    
    // Khởi tạo Pagination
    if (window.Pagination) {
        Pagination.initPagination();
        Pagination.setCallback(loadPage);
        console.log('✅ Pagination initialized');
    }
    
    // Khởi tạo bộ lọc
    initAccessoriesFilters();
    
    // Tải sản phẩm đầu tiên với filter mặc định
    applyAccessoriesDefaultFilter();
});

// ========== GLOBAL DATA ==========
let currentFilters = null;

// ========== MAP FILTER VALUES ==========
const CATEGORY_MAP = {
    'phu-kien': 'Phụ kiện'  // Category 3
};

const BRAND_MAP = {
    'nike': 'Nike',
    'adidas': 'Adidas',
    'puma': 'Puma',
    'mizuno': 'Mizuno',
    'newbalance': 'New Balance'
};

const TYPE_MAP = {
    'bao-cao-chu': 'Bọc ống quyển',
    'gang-tay-tap': 'Găng tay tập',
    'vo-giay': 'Vớ bóng đá',
    'phu-kien-khac': 'Phụ kiện khác'
};

// ========== ACCESSORIES FILTER INIT ==========
function initAccessoriesFilters() {    
    console.log('🔧 Initializing ACCESSORIES filters...');
    
    // 1. Đảm bảo checkbox "Còn hàng" được chọn mặc định
    const activeCheckbox = document.querySelector('input[name="status"][value="active"]');
    if (activeCheckbox && !activeCheckbox.checked) {
        activeCheckbox.checked = true;
    }
    
    // 2. Gắn sự kiện cho tất cả checkbox
    document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyFilters();
        });
    });
    
    console.log('✅ Accessories filters initialized');
}

// ========== COLLECT FILTERS ==========
function collectFilters() {
    const filters = {
        prices: [],
        categories: ['Phụ kiện'], // LUÔN có category phụ kiện
        brands: [],
        types: [],
        status: ['active'] // Mặc định chỉ lấy sản phẩm còn hàng
    };
    
    // 1. Lấy giá
    document.querySelectorAll('input[name="price"]:checked').forEach(cb => {
        filters.prices.push(cb.value);
    });
    
    // 2. Lấy loại phụ kiện
    document.querySelectorAll('input[name="type"]:checked').forEach(cb => {
        filters.types.push(TYPE_MAP[cb.value] || cb.value);
    });
    
    // 3. Lấy thương hiệu
    document.querySelectorAll('input[name="brand"]:checked').forEach(cb => {
        filters.brands.push(BRAND_MAP[cb.value] || cb.value);
    });
    
    // 4. Lấy trạng thái
    document.querySelectorAll('input[name="status"]:checked').forEach(cb => {
        if (cb.value === 'active') {
            filters.status = ['active'];
        }
    });
    
    console.log('📋 Collected filters:', filters);
    return filters;
}

// ========== ACCESSORIES DEFAULT FILTER ==========
function applyAccessoriesDefaultFilter() {
    console.log('🔘 Applying default ACCESSORIES filter...');
    
    // Luôn có category phụ kiện và status active
    const defaultFilters = {
        categories: ['Phụ kiện'],
        status: ['active'],
        prices: [],
        types: [],
        brands: []
    };
    
    currentFilters = defaultFilters;
    loadProductsWithFilters(defaultFilters, 1);
}

// ========== APPLY FILTERS ==========
function applyFilters() {
    console.log('🔘 Áp dụng bộ lọc...');
    
    // Thu thập filter
    const filters = collectFilters();
    
    // Kiểm tra xem có filter nào đang được chọn không
    const hasPriceFilter = filters.prices.length > 0;
    const hasTypeFilter = filters.types.length > 0;
    const hasBrandFilter = filters.brands.length > 0;
    
    // Nếu không có filter nào được chọn, vẫn tải sản phẩm với category phụ kiện
    if (!hasPriceFilter && !hasTypeFilter && !hasBrandFilter) {
        console.log('✅ Không có filter, tải tất cả sản phẩm phụ kiện');
        currentFilters = filters;
        loadProductsWithFilters(filters, 1);
    } else {
        console.log('✅ Có filter, gọi API filter...');
        currentFilters = filters;
        loadProductsWithFilters(filters, 1);
    }
}

// ========== APPLY FILTERS WITH DATA ==========
function applyFiltersWithData(filters) {
    console.log('🔘 Applying filters with data...', filters);
    currentFilters = filters;
    loadProductsWithFilters(filters, 1);
}

// ========== LOAD PRODUCTS WITH FILTERS ==========
async function loadProductsWithFilters(filters, page = 1) {
    try {
        // Tạo query string
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', window.Pagination?.getProductsPerPage() || 12);
        
        // LUÔN thêm category phụ kiện
        queryParams.append('categories', 'Phụ kiện');
        
        // LUÔN thêm status active (còn hàng)
        queryParams.append('status', 'active');
        
        // Thêm các filters khác nếu có
        if (filters.prices && filters.prices.length > 0) 
            queryParams.append('prices', filters.prices.join(','));
        
        if (filters.types && filters.types.length > 0) 
            queryParams.append('types', filters.types.join(','));
        
        if (filters.brands && filters.brands.length > 0) 
            queryParams.append('brands', filters.brands.join(','));
        
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
        
        // Hiển thị thông báo nếu không có sản phẩm
        if (!data.products || data.products.length === 0) {
            showNoProductsMessage(filters);
        }
        
    } catch (error) {
        console.error('❌ Filter error:', error);
        showError(error);
    }
}

// ========== SHOW NO PRODUCTS MESSAGE ==========
function showNoProductsMessage(filters) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    let message = 'Không tìm thấy sản phẩm nào phù hợp với bộ lọc.';
    
    productGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 40px; max-width: 500px; margin: 0 auto;">
                <div style="font-size: 48px; margin-bottom: 20px;">😕</div>
                <h3 style="color: #666; margin-bottom: 15px;">Không tìm thấy sản phẩm</h3>
                <p style="color: #888; margin-bottom: 20px;">${message}</p>
                <div style="margin-top: 20px;">
                    <button onclick="resetFilters()" style="padding: 10px 25px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 500;">
                        🔄 Xóa bộ lọc
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========== RESET FILTERS FUNCTION ==========
function resetFilters() {
    console.log('🔄 Resetting filters...');
    
    // Bỏ chọn tất cả checkbox
    document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.name === 'status' && checkbox.value === 'active') {
            checkbox.checked = true; // Giữ trạng thái active
        } else {
            checkbox.checked = false;
        }
    });
    
    // Áp dụng filter mặc định
    applyAccessoriesDefaultFilter();
}

// ========== LOAD PRODUCTS ==========
async function loadProducts(page = 1) {
    try {
        console.log(`📡 Loading page ${page}...`);
        
        // Hiển thị loading
        showLoading();
        
        // Gọi API với filter mặc định (chỉ phụ kiện, còn hàng)
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', window.Pagination?.getProductsPerPage() || 12);
        queryParams.append('categories', 'Phụ kiện');
        queryParams.append('status', 'active');
        
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

// ========== DISPLAY FUNCTIONS ==========
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
        // Fallback display
        const productGrid = document.querySelector('.product-grid');
        if (productGrid && products.length > 0) {
            productGrid.innerHTML = products.map(product => `
                <div class="product-card">
                    <div class="image-holder">
                        <img src="${product.image || ''}" alt="${product.name}">
                    </div>
                    <h3>${product.name}</h3>
                    <p class="price">${product.price.toLocaleString()}₫</p>
                    <button class="add-to-cart">Thêm vào giỏ</button>
                </div>
            `).join('');
        }
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
                        <button onclick="applyAccessoriesDefaultFilter()" style="padding: 10px 20px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer;">
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
window.AccessoriesData = {
    applyFilters: applyAccessoriesDefaultFilter,
    getCurrentFilters: () => currentFilters,
    resetFilters: resetFilters
};