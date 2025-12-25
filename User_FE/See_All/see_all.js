
    // Dropdown menu functionality
    document.addEventListener('DOMContentLoaded', function() {
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
    });

        // QUAN TRỌNG: Ngăn chặn sự kiện touch ngang
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Ngăn chặn zoom bằng pinch
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });

    // QUAN TRỌNG: Ngăn chặn scroll ngang bằng JavaScript
    window.addEventListener('scroll', function() {
        if (window.scrollX !== 0) {
            window.scrollTo(0, window.scrollY);
        }
    });

    // Ngăn chặn sự kiện wheel ngang
    window.addEventListener('wheel', function(e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
        }
    }, { passive: false });

function applyFilters() {
    const products = document.querySelectorAll('.product-card');
    let hasVisibleProducts = false;
    const selectedPrices = Array.from(document.querySelectorAll('input[name="price"]:checked')).map(cb => cb.value);
    const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
    const selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value);
    const selectedClubs = Array.from(document.querySelectorAll('input[name="club"]:checked')).map(cb => cb.value);
    const selectedStatus = Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value);
    const selectedSizes = Array.from(document.querySelectorAll('input[name="size"]:checked')).map(cb => cb.value);
    
    console.log('🔍 Đang lọc với:', {
        prices: selectedPrices,
        categories: selectedCategories,
        brands: selectedBrands,
        clubs: selectedClubs,
        status: selectedStatus,
        sizes: selectedSizes
    });
    
    products.forEach(product => {
        let show = true;
        
        // Lấy data từ product card
        const price = parseFloat(product.dataset.price) || 0;
        const category = product.dataset.category || '';
        const brand = product.dataset.brand || '';
        const club = product.dataset.club || '';
        const status = product.dataset.status || 'active';
        const size = product.dataset.size || '';
        
        // Lọc theo giá
        if (selectedPrices.length > 0 && show) {
            show = selectedPrices.some(priceRange => {
                switch(priceRange) {
                    case 'duoi500': return price < 500000;
                    case '500-1000': return price >= 500000 && price <= 1000000;
                    case 'tren1000': return price > 1000000;
                    default: return true;
                }
            });
        }
        
        // Lọc theo loại sản phẩm
        if (selectedCategories.length > 0 && show) {
            show = selectedCategories.includes(category);
        }
        
        // Lọc theo thương hiệu
        if (selectedBrands.length > 0 && show) {
            show = selectedBrands.includes(brand);
        }
        
        // Lọc theo câu lạc bộ
        if (selectedClubs.length > 0 && show) {
            show = selectedClubs.includes(club);
        }
        
        // Lọc theo trạng thái
        if (selectedStatus.length > 0 && show) {
            if (selectedStatus.includes('active')) {
                show = status === 'active';
            }
            if (selectedStatus.includes('outofstock')) {
                show = status === 'outofstock';
            }
            if (selectedStatus.includes('onsale')) {
                // Kiểm tra sản phẩm có giảm giá không
                const discountEl = product.querySelector('.discount-badge');
                show = discountEl !== null;
            }
        }
        
        // Lọc theo kích cỡ
        if (selectedSizes.length > 0 && show) {
            show = selectedSizes.includes(size.toLowerCase());
        }
        
        // Ẩn/hiện sản phẩm
        product.style.display = show ? "flex" : "none";
        if (show) hasVisibleProducts = true;
    });
    
    // Hiển thị thông báo nếu không có sản phẩm
    const productGrid = document.querySelector('.product-grid');
    let noProductsMsg = productGrid.querySelector('.no-products-message');
    
    if (!hasVisibleProducts) {
        if (!noProductsMsg) {
            noProductsMsg = document.createElement('div');
            noProductsMsg.className = 'no-products-message';
            noProductsMsg.textContent = 'Không tìm thấy sản phẩm phù hợp';
            productGrid.appendChild(noProductsMsg);
        }
        noProductsMsg.style.display = 'block';
    } else if (noProductsMsg) {
        noProductsMsg.style.display = 'none';
    }
}

// Gắn sự kiện tự động lọc cho tất cả checkbox
document.addEventListener('DOMContentLoaded', function() {
    // Gắn sự kiện change cho tất cả checkbox
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            console.log('🔍 Checkbox thay đổi:', this.name, this.value, this.checked);
            applyFilters(); // Tự động lọc ngay
        });
    });
    
    // Áp dụng bộ lọc ban đầu
    setTimeout(applyFilters, 500);
});