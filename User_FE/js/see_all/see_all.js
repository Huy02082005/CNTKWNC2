document.addEventListener('DOMContentLoaded', function() {
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

    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const cartCount = document.querySelector('.cart-count');
    let count = 0;
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            count++;
            cartCount.textContent = count;
            cartCount.classList.add('pulse');
            setTimeout(() => {
                cartCount.classList.remove('pulse');
            }, 300);
        });
    });

    // QUAN TRỌNG: Khởi tạo bộ lọc
    console.log('🚀 Khởi động hệ thống lọc...');
    initFilters();
    
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
});

// Hàm lọc
let activeFilters = {
    prices: [],
    categories: [],
    brands: [],
    leagues: [],
    status: [],
    sizes: []
};

// Hàm chuẩn hóa chuỗi để so sánh
function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase()
        .replace(/á|à|ả|ã|ạ|â|ấ|ầ|ẩ|ẫ|ậ|ă|ắ|ằ|ẳ|ẵ|ặ/g, "a")
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, "e")
        .replace(/í|ì|ỉ|ĩ|ị/g, "i")
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, "o")
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, "u")
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, "y")
        .replace(/đ/g, "d")
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .trim();
}

// Map giá trị checkbox sang giá trị trong database
const CATEGORY_MAP = {
    'ao-bong-da': 'ao-bong-da',
    'giay-bong-da': 'giay-bong-da',
    'phu-kien': 'phu-kien',
    'ao-khoac': 'ao-khoac',
    'gang-tay': 'gang-tay'
};

const BRAND_MAP = {
    'nike': 'nike',
    'adidas': 'adidas',
    'puma': 'puma',
    'mizuno': 'mizuno',
    'new-balance': 'new-balance'
};

const LEAGUE_MAP = {
    'premier-league': 'premier-league',
    'la-liga': 'la-liga',
    'serie-a': 'serie-a', 
    'bundesliga': 'bundesliga',
    'ligue-1': 'ligue-1',
    'v-league': 'v-league',
    'doi-tuyen-quoc-gia': 'doi-tuyen-quoc-gia'
}

// Cập nhật active filters
function updateActiveFilters() {
    activeFilters = {
        prices: Array.from(document.querySelectorAll('input[name="price"]:checked')).map(cb => cb.value),
        categories: Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => CATEGORY_MAP[cb.value] || cb.value),
        brands: Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => BRAND_MAP[cb.value] || cb.value),
        leagues: Array.from(document.querySelectorAll('input[name="league"]:checked')).map(cb => LEAGUE_MAP[cb.value] || cb.value),
        status: Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value)
    };
}

// Kiểm tra xem có filter nào đang active không
function hasActiveFilters() {
    return activeFilters.prices.length > 0 ||
           activeFilters.categories.length > 0 ||
           activeFilters.brands.length > 0 ||
           activeFilters.leagues.length > 0 ||
           activeFilters.status.length > 0 ||
           activeFilters.sizes.length > 0;
}

// Áp dụng bộ lọc
function applyFilters() {
    updateActiveFilters();
    const products = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    // Nếu không có filter nào, hiển thị tất cả
    if (!hasActiveFilters()) {
        products.forEach(product => {
            product.style.display = "flex";
            product.classList.remove('filtered-out');
        });
        updateProductStats(products.length);
        return;
    }
    
    products.forEach(product => {
        let show = true;
        
        // Lấy data attributes
        const price = parseFloat(product.dataset.price) || 0;
        const category = product.dataset.category || '';
        const brand = product.dataset.brand || '';
        const league = product.dataset.league || '';
        const status = product.dataset.status || 'active';
        const size = product.dataset.size || '';

        // 1. Lọc theo GIÁ
        if (activeFilters.prices.length > 0 && show) {
            const priceMatch = activeFilters.prices.some(priceRange => {
                switch(priceRange) {
                    case 'duoi500': return price < 500000;
                    case '500-1000': return price >= 500000 && price <= 1000000;
                    case 'tren1000': return price > 1000000;
                    default: return true;
                }
            });
            show = priceMatch;
            if (!priceMatch) console.log(`   ❌ Lọc giá: ${price} không thuộc ${activeFilters.prices}`);
        }
        
        // 2. Lọc theo LOẠI SẢN PHẨM
        if (activeFilters.categories.length > 0 && show) {
            const categoryMatch = activeFilters.categories.includes(category);
            show = categoryMatch;
            if (!categoryMatch) console.log(`   ❌ Lọc loại: ${category} không khớp ${activeFilters.categories}`);
        }
        
        // 3. Lọc theo THƯƠNG HIỆU
        if (activeFilters.brands.length > 0 && show) {
            const brandMatch = activeFilters.brands.includes(brand);
            show = brandMatch;
            if (!brandMatch) console.log(`   ❌ Lọc thương hiệu: ${brand} không khớp ${activeFilters.brands}`);
        }
        
        // 4. Lọc theo GIẢI ĐẤU (đặc biệt xử lý)
        if (activeFilters.leagues.length > 0 && show) {
            let leagueMatch = false;
            
            if (league) {
                // So sánh trực tiếp hoặc qua map
                leagueMatch = activeFilters.leagues.some(filterLeague => {
                    return normalizeString(league).includes(normalizeString(filterLeague)) ||
                           normalizeString(filterLeague).includes(normalizeString(league));
                });
            } else {
                leagueMatch = true;
            }
            
            show = leagueMatch;
            if (!leagueMatch) console.log(`   ❌ Lọc giải đấu: "${league}" không khớp ${activeFilters.leagues}`);
        }
        
        // 5. Lọc theo TRẠNG THÁI
        if (activeFilters.status.length > 0 && show) {
            let statusMatch = false;
            
            // Kiểm tra "Còn hàng"
            if (activeFilters.status.includes('active')) {
                statusMatch = status === 'active' || status === '';
            }
            
            // Kiểm tra "Đang giảm giá"
            if (activeFilters.status.includes('onsale') && !statusMatch) {
                const discountEl = product.querySelector('.discount-badge');
                statusMatch = discountEl !== null;
            }
            
            show = statusMatch;
            if (!statusMatch) console.log(`   ❌ Lọc trạng thái: ${status} không khớp ${activeFilters.status}`);
        }
        
        // Áp dụng hiển thị
        product.style.display = show ? "flex" : "none";
        product.classList.toggle('filtered-out', !show);
        
        if (show) {
            visibleCount++;
        }
    });
    updateProductStats(visibleCount);
}

// Cập nhật thống kê
function updateProductStats(count) {   
    // Gắn sự kiện xóa bộ lọc
    document.getElementById('clear-all-filters')?.addEventListener('click', clearAllFilters);
}

// Xóa tất cả bộ lọc
function clearAllFilters() {
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Chọn lại "Còn hàng" mặc định
    const activeCheckbox = document.querySelector('input[name="status"][value="active"]');
    if (activeCheckbox) {
        activeCheckbox.checked = true;
    }
    
    // Áp dụng lại
    applyFilters();
}

// Khởi tạo
function initFilters() {    
    // Đảm bảo checkbox "Còn hàng" được chọn mặc định
    const activeCheckbox = document.querySelector('input[name="status"][value="active"]');
    if (activeCheckbox && !activeCheckbox.checked) {
        activeCheckbox.checked = true;
    }
    
    // Gắn sự kiện cho tất cả checkbox
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            applyFilters();
        });
    });
    
    // Áp dụng bộ lọc ban đầu
    setTimeout(() => {
        applyFilters();
    }, 1000);
}