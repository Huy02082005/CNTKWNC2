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

   // JS lọc sản phẩm
    document.addEventListener('DOMContentLoaded', function() {
        // Khai báo biến
        const tabButtons = document.querySelectorAll('.tab-btn');
        const sizeButtons = document.querySelectorAll('.size-btn');
        const priceRange = document.getElementById('price-range');
        const currentPrice = document.getElementById('current-price');
        const resetFilter = document.getElementById('reset-filter'); // Cần thêm ID này trong HTML
        const applyFilter = document.getElementById('apply-filter'); // Cần thêm ID này trong HTML

        // ===== HÀM LỌC CHÍNH =====
        function filterProducts() {
        
        // THÊM DÒNG NÀY để lấy league từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const leagueFromURL = urlParams.get('league');
        
        // Nếu có league từ URL, active tab tương ứng
        if (leagueFromURL) {
            const targetTab = document.querySelector(`.tab-btn[data-league="${leagueFromURL}"]`);
            if (targetTab && !targetTab.classList.contains('active')) {
                // Xóa active từ tất cả các tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                // Thêm active cho tab từ URL
                targetTab.classList.add('active');
            }
        }
            // Lấy tất cả tiêu chí lọc
            const checkedPrices = [...document.querySelectorAll('input[name="price"]:checked')].map(el => el.value);
            const checkedCategories = [...document.querySelectorAll('input[name="category"]:checked')].map(el => el.value);
            const checkedBrands = [...document.querySelectorAll('input[name="brand"]:checked')].map(el => el.value);
            const checkedSizes = [...document.querySelectorAll('.size-btn.active')].map(el => el.textContent.trim());
            
            // Lấy league đang active
            const activeTab = document.querySelector('.tab-btn.active');
            const selectedLeague = activeTab ? activeTab.getAttribute('data-league') : 'all';

            const products = document.querySelectorAll('.product-card');

            let hasVisibleProduct = false;

            products.forEach(product => {
                const price = parseInt(product.dataset.price) || 0;
                const category = product.dataset.category || '';
                const brand = product.dataset.brand || '';
                const league = product.dataset.league || '';
                const sizes = product.dataset.size ? product.dataset.size.split(',').map(s => s.trim()) : [];

                let visible = true;

                // ===== LỌC THEO GIẢI ĐẤU (TAB) =====
                if (selectedLeague !== 'all') {
                    visible = league === selectedLeague;
                }

                // ===== LỌC THEO GIÁ =====
                if (visible && checkedPrices.length > 0) {
                    visible = checkedPrices.some(range => {
                        if (range === "duoi500") return price < 500000;
                        if (range === "500-600") return price >= 500000 && price <= 600000;
                        if (range === "tren600") return price > 600000;
                        return false;
                    });
                }

                // ===== LỌC THEO LOẠI =====
                if (visible && checkedCategories.length > 0) {
                    visible = checkedCategories.includes(category);
                }

                // ===== LỌC THEO THƯƠNG HIỆU =====
                if (visible && checkedBrands.length > 0) {
                    visible = checkedBrands.includes(brand);
                }
                
                // ===== LỌC THEO SIZE =====
                if (visible && checkedSizes.length > 0) {
                    visible = checkedSizes.some(selectedSize => 
                        sizes.includes(selectedSize)
                    );
                }

                // ẨN / HIỆN SẢN PHẨM
                product.style.display = visible ? "flex" : "none";
                
                if (visible) hasVisibleProduct = true;
            });

            // ===== HIỂN THỊ THÔNG BÁO KHÔNG CÓ SẢN PHẨM =====
            const productGrid = document.querySelector('.product-grid');
            let noProductMessage = document.querySelector('.no-products-message');
            
            if (!hasVisibleProduct) {
                if (!noProductMessage) {
                    noProductMessage = document.createElement('div');
                    noProductMessage.className = 'no-products-message';
                    noProductMessage.textContent = 'Không tìm thấy sản phẩm phù hợp';
                    productGrid.appendChild(noProductMessage);
                }
                noProductMessage.style.display = 'block';
            } else if (noProductMessage) {
                noProductMessage.style.display = 'none';
            }
        }

        // ===== SỰ KIỆN CHO TAB =====
        tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Xóa lớp active từ tất cả các tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Thêm lớp active cho tab được click
            this.classList.add('active');
            
            // Cập nhật URL với league mới
            const league = this.getAttribute('data-league');
            const url = new URL(window.location);
            url.searchParams.set('league', league);
            window.history.pushState({}, '', url);
            
            // GỌI HÀM LỌC (quan trọng)
            filterProducts();
        });
    });

        // ===== SỰ KIỆN CHO SIZE BUTTONS =====
        sizeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Toggle class active
                this.classList.toggle('active');
                // Gọi hàm lọc
                filterProducts();
            });
        });

        // ===== SỰ KIỆN CHO CHECKBOX =====
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener("change", filterProducts);
        });

        // ===== XỬ LÝ THANH TRƯỢT GIÁ =====
        if (priceRange && currentPrice) {
            priceRange.addEventListener('input', function() {
                const price = parseInt(this.value).toLocaleString('vi-VN');
                currentPrice.textContent = `${price}đ`;
                filterProducts(); // Tự động lọc khi kéo thanh trượt
            });
        }

        // ===== NÚT RESET FILTER =====
        if (resetFilter) {
            resetFilter.addEventListener('click', function() {
                // Reset thanh trượt giá
                if (priceRange && currentPrice) {
                    priceRange.value = 500000;
                    currentPrice.textContent = '500.000đ';
                }
                
                // Reset checkbox
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = false;
                });
                
                // Reset nút kích cỡ
                sizeButtons.forEach(btn => btn.classList.remove('active'));
                
                // Reset tab về "Tất cả"
                tabButtons.forEach(btn => btn.classList.remove('active'));
                const allTab = document.querySelector('.tab-btn[data-league="all"]');
                if (allTab) allTab.classList.add('active');
                
                // Gọi hàm lọc
                filterProducts();
            });
        }

        // ===== NÚT APPLY FILTER =====
        if (applyFilter) {
            applyFilter.addEventListener('click', function() {
                filterProducts();
                alert('Đã áp dụng bộ lọc!');
            });
        }

        // ===== KHỞI ĐỘNG LẦN ĐẦU =====
        filterProducts();
    });