document.addEventListener('DOMContentLoaded', function() {
    // ===== KHỞI TẠO BIẾN =====
    const tabButtons = document.querySelectorAll('.tab-btn');
    const filterCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const resetFilterBtn = document.getElementById('reset-filter');
    const applyFilterBtn = document.getElementById('apply-filter');
    const cartCount = document.querySelector('.cart-count');
    const searchBox = document.querySelector('.search-box input');
    const searchBtn = document.querySelector('.search-box button');
    const dropdowns = document.querySelectorAll('.dropdown');
    
    let cartItemCount = 0;
    let currentProducts = [];

    // ===== KHỞI TẠO DỮ LIỆU =====
    // Tải sản phẩm từ database (giả lập)
    function loadProducts() {
        // Dữ liệu giả lập từ database - chỉ CategoryID 1 và 4
        currentProducts = [
            {
                id: 1,
                name: "Áo Manchester United 2023-24",
                price: 499000,
                image: "./image/áo/aomu.jpg",
                category: "ao-bong-da",
                brand: "adidas",
                club: "premier-league",
                league: "epl",
                size: "S",
                status: "active",
                onsale: false,
                stock: 10
            },
            {
                id: 2,
                name: "Áo Real Madrid 2023-24",
                price: 499000,
                image: "./image/áo/real.jpg",
                category: "ao-bong-da",
                brand: "adidas",
                club: "laliga",
                league: "laliga",
                size: "M",
                status: "active",
                onsale: true,
                stock: 5
            },
            {
                id: 3,
                name: "Áo Barcelona 2023-24",
                price: 499000,
                image: "./image/áo/aobarca.jpg",
                category: "ao-bong-da",
                brand: "adidas",
                club: "laliga",
                league: "laliga",
                size: "S,M,L,XL",
                status: "active",
                onsale: false,
                stock: 8
            },
            {
                id: 4,
                name: "Áo ĐTQG Argentina 2023",
                price: 499000,
                image: "./image/áo/argen.webp",
                category: "ao-bong-da",
                brand: "puma",
                club: "doi-tuyen-quoc-gia",
                league: "đtqg",
                size: "S,XL",
                status: "active",
                onsale: true,
                stock: 3
            },
            {
                id: 5,
                name: "Áo ĐTQG Brazil 2023",
                price: 799000,
                image: "./image/áo/brazil.jpg",
                category: "ao-bong-da",
                brand: "puma",
                club: "doi-tuyen-quoc-gia",
                league: "đtqg",
                size: "XL",
                status: "active",
                onsale: false,
                stock: 7
            },
            {
                id: 6,
                name: "Áo Arsenal 2023-24",
                price: 550000,
                image: "./image/áo/arsenal.jpg",
                category: "ao-bong-da",
                brand: "adidas",
                club: "premier-league",
                league: "epl",
                size: "M,L",
                status: "active",
                onsale: true,
                stock: 12
            },
            {
                id: 7,
                name: "Áo Bayern Munich 2023-24",
                price: 650000,
                image: "./image/áo/bayern.jpg",
                category: "ao-bong-da",
                brand: "adidas",
                club: "bundesliga",
                league: "bundesliga",
                size: "L,XL",
                status: "active",
                onsale: false,
                stock: 4
            },
            {
                id: 8,
                name: "Quần thể thao Nike",
                price: 350000,
                image: "./image/quần/quannike.jpg",
                category: "quan-bong-da",
                brand: "nike",
                club: "",
                league: "all",
                size: "M,L,XL",
                status: "active",
                onsale: true,
                stock: 15
            }
        ];

        displayProducts(currentProducts);
    }

    // ===== HIỂN THỊ SẢN PHẨM =====
    function displayProducts(products) {
        const productGrid = document.getElementById('product-grid');
        productGrid.innerHTML = '';

        if (products.length === 0) {
            const noProductMsg = document.createElement('div');
            noProductMsg.className = 'no-products-message';
            noProductMsg.textContent = 'Không tìm thấy sản phẩm phù hợp';
            productGrid.appendChild(noProductMsg);
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product.id;
            productCard.dataset.price = product.price;
            productCard.dataset.category = product.category;
            productCard.dataset.brand = product.brand;
            productCard.dataset.club = product.club;
            productCard.dataset.league = product.league;
            productCard.dataset.size = product.size;
            productCard.dataset.status = product.status;
            productCard.dataset.onsale = product.onsale;
            productCard.dataset.stock = product.stock;

            const onsaleBadge = product.onsale ? '<span class="onsale-badge">SALE</span>' : '';
            const stockStatus = product.stock > 0 ? 
                `<span class="stock-in">Còn ${product.stock} sản phẩm</span>` : 
                '<span class="stock-out">Hết hàng</span>';

            productCard.innerHTML = `
                <div class="image-holder">
                    ${onsaleBadge}
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='./image/default-product.jpg'">
                </div>
                <h3>${product.name}</h3>
                <p class="price">
                    ${product.price.toLocaleString('vi-VN')}₫
                    ${product.onsale ? '<span class="original-price">650.000₫</span>' : ''}
                </p>
                <div class="product-info">
                    <span class="size-info">Size: ${product.size}</span>
                    ${stockStatus}
                </div>
                <button class="add-to-cart" ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                </button>
            `;

            productGrid.appendChild(productCard);
        });

        // Thêm sự kiện cho nút thêm vào giỏ hàng
        addCartEventListeners();
    }

    // ===== HÀM LỌC CHÍNH =====
    function filterProducts() {
        if (!currentProducts.length) return;

        // Lấy tất cả tiêu chí lọc
        const checkedPrices = getCheckedValues('price');
        const checkedCategories = getCheckedValues('category');
        const checkedBrands = getCheckedValues('brand');
        const checkedClubs = getCheckedValues('club');
        const checkedSizes = getCheckedValues('size');
        const checkedStatus = getCheckedValues('status');
        
        // Lấy league đang active
        const activeTab = document.querySelector('.tab-btn.active');
        const selectedLeague = activeTab ? activeTab.dataset.league : 'all';

        // Lọc sản phẩm
        const filteredProducts = currentProducts.filter(product => {
            let match = true;

            // Lọc theo giải đấu (tab)
            if (selectedLeague !== 'all') {
                match = product.league === selectedLeague;
            }

            // Lọc theo giá
            if (match && checkedPrices.length > 0) {
                match = checkedPrices.some(range => {
                    if (range === "duoi500") return product.price < 500000;
                    if (range === "500-1000") return product.price >= 500000 && product.price <= 1000000;
                    if (range === "tren1000") return product.price > 1000000;
                    return false;
                });
            }

            // Lọc theo loại sản phẩm
            if (match && checkedCategories.length > 0) {
                match = checkedCategories.includes(product.category);
            }

            // Lọc theo thương hiệu
            if (match && checkedBrands.length > 0) {
                match = checkedBrands.includes(product.brand);
            }

            // Lọc theo CLB/Giải đấu
            if (match && checkedClubs.length > 0) {
                match = checkedClubs.includes(product.club);
            }

            // Lọc theo kích cỡ
            if (match && checkedSizes.length > 0) {
                const productSizes = product.size.split(',').map(s => s.trim());
                match = checkedSizes.some(size => productSizes.includes(size.toUpperCase()));
            }

            // Lọc theo trạng thái
            if (match && checkedStatus.length > 0) {
                match = checkedStatus.some(status => {
                    if (status === 'active') return product.status === 'active';
                    if (status === 'onsale') return product.onsale === true;
                    return false;
                });
            }

            return match;
        });

        // Hiển thị sản phẩm đã lọc
        displayProducts(filteredProducts);
    }

    // ===== HÀM HỖ TRỢ =====
    function getCheckedValues(name) {
        return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
    }

    function addCartEventListeners() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart:not(:disabled)');
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productCard = this.closest('.product-card');
                const productId = productCard.dataset.id;
                const productName = productCard.querySelector('h3').textContent;
                const productPrice = productCard.dataset.price;
                
                // Thêm vào giỏ hàng
                addToCart(productId, productName, productPrice);
                
                // Hiệu ứng thêm vào giỏ
                this.textContent = 'Đã thêm ✓';
                this.style.backgroundColor = '#28a745';
                
                setTimeout(() => {
                    this.textContent = 'Thêm vào giỏ';
                    this.style.backgroundColor = '';
                }, 1500);
            });
        });
    }

    function addToCart(productId, productName, productPrice) {
        cartItemCount++;
        cartCount.textContent = cartItemCount;
        cartCount.classList.add('pulse');
        
        // Lưu vào localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: parseInt(productPrice),
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        setTimeout(() => {
            cartCount.classList.remove('pulse');
        }, 300);
        
        // Hiển thị thông báo
        showNotification(`Đã thêm "${productName}" vào giỏ hàng`);
    }

    function showNotification(message) {
        // Xóa thông báo cũ nếu có
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) oldNotification.remove();
        
        // Tạo thông báo mới
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Style cho thông báo
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Tự động ẩn sau 3 giây
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function resetFilters() {
        // Reset tab về "Tất cả"
        tabButtons.forEach(btn => btn.classList.remove('active'));
        const allTab = document.querySelector('.tab-btn[data-league="all"]');
        if (allTab) allTab.classList.add('active');
        
        // Reset tất cả checkbox
        filterCheckboxes.forEach(cb => cb.checked = false);
        
        // Check lại mặc định
        const activeStatus = document.querySelector('input[name="status"][value="active"]');
        if (activeStatus) activeStatus.checked = true;
        
        // Lọc lại
        filterProducts();
        
        showNotification('Đã xóa tất cả bộ lọc');
    }

    // ===== SỰ KIỆN =====
    // Sự kiện cho tab
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Cập nhật URL với league mới
            const league = this.dataset.league;
            const url = new URL(window.location);
            url.searchParams.set('league', league);
            window.history.pushState({}, '', url);
            
            filterProducts();
        });
    });

    // Sự kiện cho checkbox
    filterCheckboxes.forEach(cb => {
        cb.addEventListener("change", filterProducts);
    });

    // Sự kiện cho nút reset
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }

    // Sự kiện cho nút apply (không cần thiết vì đã tự động lọc)
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            filterProducts();
            showNotification('Đã áp dụng bộ lọc');
        });
    }

    // Sự kiện tìm kiếm
    if (searchBox && searchBtn) {
        function performSearch() {
            const searchTerm = searchBox.value.toLowerCase().trim();
            
            if (searchTerm === '') {
                filterProducts();
                return;
            }
            
            const filteredProducts = currentProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.brand.toLowerCase().includes(searchTerm) ||
                product.club.toLowerCase().includes(searchTerm)
            );
            
            displayProducts(filteredProducts);
            
            if (filteredProducts.length === 0) {
                showNotification(`Không tìm thấy sản phẩm cho từ khóa "${searchTerm}"`);
            }
        }
        
        searchBtn.addEventListener('click', performSearch);
        searchBox.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // Dropdown menu
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            this.querySelector('.dropdown-menu').style.display = 'flex';
        });
        
        dropdown.addEventListener('mouseleave', function() {
            this.querySelector('.dropdown-menu').style.display = 'none';
        });
    });

    // Ngăn chặn scroll ngang
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

    // Kiểm tra league từ URL khi load trang
    function checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const leagueFromURL = urlParams.get('league');
        
        if (leagueFromURL) {
            const targetTab = document.querySelector(`.tab-btn[data-league="${leagueFromURL}"]`);
            if (targetTab && !targetTab.classList.contains('active')) {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                targetTab.classList.add('active');
            }
        }
    }

    // ===== KHỞI CHẠY =====
    function init() {
        checkURLParams();
        loadProducts();
        
        // Khôi phục giỏ hàng từ localStorage
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        cartItemCount = savedCart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = cartItemCount;
        
        // Thêm CSS animation cho notification
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .onsale-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #dc3545;
                    color: white;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .stock-in {
                    color: #28a745;
                    font-size: 12px;
                }
                .stock-out {
                    color: #dc3545;
                    font-size: 12px;
                }
                .product-info {
                    padding: 0 10px;
                    margin-bottom: 10px;
                    font-size: 12px;
                    display: flex;
                    justify-content: space-between;
                }
                .original-price {
                    text-decoration: line-through;
                    color: #999;
                    font-size: 14px;
                    margin-left: 8px;
                }
                .size-info {
                    color: #666;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Khởi chạy ứng dụng
    init();
});