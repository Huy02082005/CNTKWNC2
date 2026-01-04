// ========== CONFIGURATION ==========
const API_BASE_URL = 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api/products`;
let currentFilters = null;
let productDisplay = null;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Khởi động hệ thống xem tất cả sản phẩm...');
    
    // 1. Khởi tạo Pagination
    if (window.Pagination) {
        window.Pagination.initPagination();
        
        // Thiết lập callback cho pagination
        window.Pagination.setCallback(async function(page) {
            console.log(`📄 Pagination callback for page ${page}, filters:`, currentFilters);
            
            if (currentFilters) {
                await loadProductsWithFilters(currentFilters, page);
            } else {
                await loadProducts(page);
            }
        });
    }
    
    // 2. Khởi tạo ProductDisplay component
    await initProductDisplay();
    
    // 3. Khởi tạo bộ lọc
    initFilters();
    
    // 4. Tải sản phẩm đầu tiên
    await loadProducts(1);
    
    // 5. Khởi tạo UI
    initUI();
});


// ========== PRODUCT DISPLAY INIT ==========
async function initProductDisplay() {
    const productGrid = document.querySelector('.product-grid');
    
    if (!productGrid) {
        console.error('❌ Không tìm thấy .product-grid');
        return;
    }
    
    // Kiểm tra ProductDisplay class có tồn tại không
    if (typeof window.ProductDisplay === 'function') {
        productDisplay = new window.ProductDisplay({
            container: productGrid,
            products: [],
            columns: 4,
            showQuickAdd: true,
            showDiscount: true,
            showStock: true,
            clickable: true,
        });
        
        console.log('✅ ProductDisplay initialized');
    } else {
        console.error('❌ ProductDisplay component not found!');
        // Fallback: tạo container cơ bản
        productGrid.style.display = 'grid';
        productGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        productGrid.style.gap = '20px';
        productGrid.style.padding = '20px 0';
    }
}

// ========== PRODUCT LOADING LOGIC ==========

// Tải sản phẩm theo trang
async function loadProducts(page = 1) {
    try {
        console.log(`📡 Loading page ${page}...`);
        
        // Hiển thị loading
        showLoading();
        
        // Gọi API
        const response = await fetch(
            `${API_URL}?page=${page}&limit=${window.Pagination?.getProductsPerPage() || 16}`
        );
        
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
                data.pagination?.total || 0,
                data.pagination?.totalPages || 1
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

// Tải sản phẩm với filter
async function loadProductsWithFilters(filters, page = 1) {
    try {
        // Tạo query string
        const queryParams = new URLSearchParams();
        queryParams.append('page', page);
        queryParams.append('limit', window.Pagination?.getProductsPerPage() || 16);
        
        // Thêm filters
        if (filters.prices && filters.prices.length > 0) 
            queryParams.append('prices', filters.prices.join(','));
        if (filters.categories && filters.categories.length > 0) 
            queryParams.append('categories', filters.categories.join(','));
        if (filters.brands && filters.brands.length > 0) 
            queryParams.append('brands', filters.brands.join(','));
        if (filters.leagues && filters.leagues.length > 0) 
            queryParams.append('leagues', filters.leagues.join(','));
        
        const url = `${API_URL}/filtered?${queryParams.toString()}`;
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
        
    } catch (error) {
        console.error('❌ Filter error:', error);
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
    if (productDisplay && typeof productDisplay.updateProducts === 'function') {
        // Dùng ProductDisplay component để render
        productDisplay.updateProducts(products);
    } else {
        // Fallback: render cơ bản
        renderProductsFallback(products);
    }
}

function renderProductsFallback(products) {
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;
    
    productGrid.innerHTML = '';
    
    if (products.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <div style="background: #fffaf0; border: 1px solid #feebc8; border-radius: 10px; padding: 30px; max-width: 400px; margin: 0 auto;">
                    <h3 style="color: #dd6b20; margin-bottom: 15px;">🔍 Không tìm thấy sản phẩm</h3>
                    <p style="color: #666;">Không có sản phẩm nào phù hợp</p>
                </div>
            </div>
        `;
        return;
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
                        <button onclick="location.reload()" style="padding: 10px 20px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                            🔄 Tải lại trang
                        </button>
                        <button onclick="loadProducts(1)" style="padding: 10px 20px; background: #38a169; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            📦 Thử lại
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// ========== PAGINATION CALLBACK ==========
function setupPaginationCallback(page, filters = null) {
    if (window.Pagination) {
        // Setup callback cho pagination
        const originalGoToPage = window.Pagination.goToPage;
        
        window.Pagination.goToPage = async function(newPage) {
            if (newPage < 1 || newPage > window.Pagination.getTotalPages()) return;
            
            if (filters) {
                await loadProductsWithFilters(filters, newPage);
            } else {
                await loadProducts(newPage);
            }
            
            // Restore original function
            window.Pagination.goToPage = originalGoToPage;
        };
    }
}

// ========== FILTER LOGIC ==========

// Map giá trị checkbox sang giá trị trong database
const CATEGORY_MAP = {
    'ao-bong-da': 'Áo đấu',
    'giay-bong-da': 'Giày bóng đá',
    'phu-kien': 'Phụ kiện',
    'ao-khoac': 'Áo khoác thể thao',
    'gang-tay': 'Găng tay thủ môn'
};

const BRAND_MAP = {
    'nike': 'Nike',
    'adidas': 'Adidas',
    'puma': 'Puma',
    'mizuno': 'Mizuno',
    'new-balance': 'New Balance'
};

const LEAGUE_MAP = {
    'premier-league': 'Premier League',
    'la-liga': 'La Liga',
    'serie-a': 'Serie A',
    'bundesliga': 'Bundesliga',
    'ligue-1': 'Ligue 1',
    'v-league': 'V-League',
    'doi-tuyen-quoc-gia': 'NATIONAL'
};

function initFilters() {    
    // Đảm bảo checkbox "Còn hàng" được chọn mặc định
    const activeCheckbox = document.querySelector('input[name="status"][value="active"]');
    if (activeCheckbox && !activeCheckbox.checked) {
        activeCheckbox.checked = true;
    }
    
    // Gắn sự kiện cho tất cả checkbox
    document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyFilters();
        });
    });
}

function applyFilters() {
    console.log('🔘 Áp dụng bộ lọc...');
    
    // Thu thập filter
    const filters = collectFilters();
    
    // Kiểm tra có filter nào không
    const hasAnyFilter = Object.values(filters).some(arr => arr.length > 0);
    
    if (hasAnyFilter) {
        console.log('✅ Có filter, gọi API filter...');
        currentFilters = filters;
        loadProductsWithFilters(filters, 1);
    } else {
        console.log('✅ Không có filter, tải tất cả sản phẩm');
        currentFilters = null;
        loadProducts(1);
    }
}

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
    
    document.querySelectorAll('input[name="category"]:checked').forEach(cb => {
        filters.categories.push(CATEGORY_MAP[cb.value] || cb.value);
    });
    
    document.querySelectorAll('input[name="brand"]:checked').forEach(cb => {
        filters.brands.push(BRAND_MAP[cb.value] || cb.value);
    });
    
    document.querySelectorAll('input[name="league"]:checked').forEach(cb => {
        filters.leagues.push(LEAGUE_MAP[cb.value] || cb.value);
    });
    
    document.querySelectorAll('input[name="status"]:checked').forEach(cb => {
        filters.status.push(cb.value);
    });
    
    return filters;
}

// ========== UI INITIALIZATION ==========

function initUI() {
    // Dropdown menu functionality
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            this.querySelector('.dropdown-menu').style.display = 'block';
        });
        dropdown.addEventListener('mouseleave', function() {
            this.querySelector('.dropdown-menu').style.display = 'none';
        });
    });

    // Các event listeners ngăn scroll ngang
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });

    window.addEventListener('scroll', function() {
        if (window.scrollX !== 0) {
            window.scrollTo(0, window.scrollY);
        }
    });

    window.addEventListener('wheel', function(e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
        }
    }, { passive: false });
}

// ========== CLEAR FILTERS ==========

function clearAllFilters() {
    document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Chọn lại "Còn hàng" mặc định
    const activeCheckbox = document.querySelector('input[name="status"][value="active"]');
    if (activeCheckbox) {
        activeCheckbox.checked = true;
    }
    
    currentFilters = null;
    loadProducts(1);
}

// ========== UTILITY FUNCTIONS ==========

function formatPrice(price) {
    const numericPrice = Number(price) || 0;
    if (numericPrice <= 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN').format(numericPrice) + '₫';
}

// ========== EXPORT GLOBAL FUNCTIONS ==========

window.ProductManager = {
    loadProducts,
    loadProductsWithFilters,
    applyFilters,
    clearAllFilters,
    getCurrentFilters: () => currentFilters
};