// ========== CONFIGURATION ==========
const API_BASE_URL = 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api/products`;

// Biến global cho phân trang
let currentPage = 1;
const productsPerPage = 16;
let totalProducts = 0;
let totalPages = 1;

// ========== TẠO PAGINATION CONTROLS ==========
function createPaginationControls() {
    const oldContainer = document.querySelector('.pagination-container');
    if (oldContainer) {
        oldContainer.remove();
    }
    
    // Tạo container mới
    const container = document.createElement('div');
    container.className = 'pagination-container';
    
    // Tìm content-area hoặc tạo mới
    let contentArea = document.querySelector('.content-area');
    
    if (!contentArea) {
        // Nếu không có content-area, tạo mới
        const productGrid = document.querySelector('.product-grid');
        if (productGrid && productGrid.parentElement) {
            contentArea = document.createElement('div');
            contentArea.className = 'content-area';
            
            // Wrap product-grid trong content-area
            productGrid.parentElement.insertBefore(contentArea, productGrid);
            contentArea.appendChild(productGrid);
        }
    }
    
    // Chèn phân trang vào CUỐI content-area
    if (contentArea) {
        contentArea.appendChild(container);
    } else {
        // Fallback
        const main = document.querySelector('main.container');
        if (main) {
            main.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
    }
    
    // Tạo HTML cho phân trang
    container.innerHTML = `
        <div class="pagination-header">
            <div class="pagination-stats">
                <span class="page-info">Trang ${currentPage} / ${totalPages}</span>
                <span class="product-count">- ${totalProducts} sản phẩm</span>
            </div>
        </div>
        
        <div class="pagination-navigation">
            <div class="nav-buttons">
                <button class="nav-btn first-page" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-angle-double-left"></i> Đầu
                </button>
                <button class="nav-btn prev-page" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Trước
                </button>
                
                <div class="page-numbers">
                    ${generatePageNumbers()}
                </div>
                
                <button class="nav-btn next-page" ${currentPage === totalPages ? 'disabled' : ''}>
                    Sau <i class="fas fa-chevron-right"></i>
                </button>
                <button class="nav-btn last-page" ${currentPage === totalPages ? 'disabled' : ''}>
                    Cuối <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
        </div>
        
        <div class="page-jump-section">
            <span class="jump-label">Đến trang:</span>
            <div class="jump-controls">
                <input type="number" id="page-jump" 
                       min="1" 
                       max="${totalPages}" 
                       value="${currentPage}"
                       class="jump-input">
                <button id="jump-btn" class="jump-btn">Đi</button>
            </div>
        </div>
    `;
    
    // Gắn sự kiện
    attachPaginationEvents();
}

// ========== TẠO SỐ TRANG HIỂN THỊ ==========
function generatePageNumbers() {
    let pagesHTML = '';
    
    // Nếu tổng số trang ít hơn hoặc bằng 7, hiển thị tất cả
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
            pagesHTML += `
                <button class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        return pagesHTML;
    }
    
    // Hiển thị trang đầu
    pagesHTML += `
        <button class="page-num ${1 === currentPage ? 'active' : ''}" data-page="1">1</button>
    `;
    
    // Dấu ... nếu trang hiện tại > 4
    if (currentPage > 4) {
        pagesHTML += `<span class="page-dots">...</span>`;
    }
    
    // Các trang ở giữa
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
            pagesHTML += `
                <button class="page-num ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
    }
    
    // Dấu ... nếu trang hiện tại < totalPages - 3
    if (currentPage < totalPages - 3) {
        pagesHTML += `<span class="page-dots">...</span>`;
    }
    
    // Hiển thị trang cuối
    pagesHTML += `
        <button class="page-num ${totalPages === currentPage ? 'active' : ''}" data-page="${totalPages}">
            ${totalPages}
        </button>
    `;
    
    return pagesHTML;
}

// ========== GẮN SỰ KIỆN PHÂN TRANG ==========
function attachPaginationEvents() {
    // Nút điều hướng
    document.querySelector('.first-page')?.addEventListener('click', () => goToPage(1));
    document.querySelector('.prev-page')?.addEventListener('click', () => goToPage(currentPage - 1));
    document.querySelector('.next-page')?.addEventListener('click', () => goToPage(currentPage + 1));
    document.querySelector('.last-page')?.addEventListener('click', () => goToPage(totalPages));
    
    // Các số trang
    document.querySelectorAll('.page-num').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page !== currentPage) {
                goToPage(page);
            }
        });
    });
    
    // Nhảy đến trang
    document.getElementById('jump-btn')?.addEventListener('click', () => {
        const pageInput = document.getElementById('page-jump');
        const page = parseInt(pageInput.value);
        
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            goToPage(page);
        } else if (page < 1) {
            pageInput.value = 1;
        } else if (page > totalPages) {
            pageInput.value = totalPages;
        }
    });
    
    document.getElementById('page-jump')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= totalPages && page !== currentPage) {
                goToPage(page);
            }
        }
    });
    
    document.getElementById('page-jump')?.addEventListener('change', (e) => {
        let page = parseInt(e.target.value);
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        e.target.value = page;
    });
}

// ========== ĐIỀU HƯỚNG ĐẾN TRANG ==========
async function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    await loadProducts(page);
    
    // Scroll lên đầu trang
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ========== TẢI SẢN PHẨM THEO TRANG ==========
async function loadProducts(page = 1) {
    try {
        const productGrid = document.querySelector('.product-grid');
        
        if (!productGrid) {
            console.error('❌ Không tìm thấy .product-grid');
            return;
        }
        
        console.log(`📡 Đang tải trang ${page} từ: ${API_URL}?page=${page}&limit=${productsPerPage}`);
        
        // Hiển thị loading
        productGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <div style="display: inline-block; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                    <p style="margin-bottom: 10px; color: #666;">🔄 Đang tải sản phẩm trang ${page}...</p>
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1a3e72; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
        `;
        
        let response;
        try {
            // Thêm timeout ngắn hơn để test
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây
            
            response = await fetch(`${API_URL}?page=${page}&limit=${productsPerPage}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`📡 API Response: ${response.status} ${response.statusText}`);
            
        } catch (fetchError) {
            console.error('❌ Lỗi khi gọi API:', fetchError);
            
            // Hiển thị lỗi mạng
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 10px; padding: 30px; max-width: 500px; margin: 0 auto;">
                        <h3 style="color: #e53e3e; margin-bottom: 15px;">⚠️ Lỗi kết nối</h3>
                        <p style="color: #666; margin-bottom: 20px;">Không thể kết nối đến máy chủ:</p>
                        <p style="font-family: monospace; background: #f7fafc; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                            ${fetchError.message || 'Không xác định'}
                        </p>
                        <div style="margin-top: 20px;">
                            <button onclick="loadProducts(${currentPage})" style="padding: 10px 20px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                                🔄 Thử lại
                            </button>
                            <button onclick="testAPI()" style="padding: 10px 20px; background: #38a169; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                🧪 Test API
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return;
        }
        
        if (!response.ok) {
            console.error('❌ API trả về lỗi:', response.status);
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 10px; padding: 30px; max-width: 500px; margin: 0 auto;">
                        <h3 style="color: #e53e3e; margin-bottom: 15px;">⚠️ Lỗi máy chủ</h3>
                        <p style="color: #666; margin-bottom: 20px;">Máy chủ trả về lỗi ${response.status}:</p>
                        <p style="font-family: monospace; background: #f7fafc; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
                            ${response.statusText}
                        </p>
                        <button onclick="loadProducts(${currentPage})" style="padding: 10px 20px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            🔄 Thử lại
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('❌ Lỗi parse JSON:', jsonError);
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <p style="color: #e53e3e; font-size: 18px;">Lỗi dữ liệu từ máy chủ</p>
                    <p style="color: #666; margin-top: 10px;">${jsonError.message}</p>
                </div>
            `;
            return;
        }
        
        // Kiểm tra cấu trúc dữ liệu
        if (!data.success) {
            console.error('❌ API không thành công:', data);
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <p style="color: #e53e3e; font-size: 18px;">API trả về không thành công</p>
                    <p style="color: #666; margin-top: 10px;">${data.message || 'Không có thông báo lỗi'}</p>
                </div>
            `;
            return;
        }
        
        if (!data.products || !Array.isArray(data.products)) {
            console.error('❌ Không có sản phẩm:', data);
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <p style="color: #666; font-size: 18px;">Không có sản phẩm nào</p>
                    <p style="color: #999; margin-top: 10px;">Danh sách sản phẩm trống</p>
                </div>
            `;
            return;
        }
        
        // Cập nhật thông tin phân trang
        totalProducts = data.pagination?.total || 0;
        totalPages = data.pagination?.totalPages || 1;
        
        console.log(`✅ Đã tải ${data.products.length} sản phẩm, tổng: ${totalProducts} sản phẩm`);
        
        // Xóa loading và hiển thị sản phẩm
        productGrid.innerHTML = '';
        
        if (data.products.length === 0) {
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <p style="font-size: 18px; color: #666;">Không có sản phẩm nào trong trang này</p>
                    <button onclick="goToPage(1)" style="margin-top: 10px; padding: 10px 20px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Về trang đầu
                    </button>
                </div>
            `;
        } else {
            // Hiển thị sản phẩm
            data.products.forEach((product, index) => {
                const productCard = createProductCard(product, index);
                productGrid.appendChild(productCard);
            });
            
            console.log(`🎉 Đã hiển thị ${data.products.length} sản phẩm`);
        }
        
        // Tạo phân trang
        createPaginationControls();
        
        // Gắn sự kiện giỏ hàng
        attachCartEvents();
        
    } catch (error) {
        console.error('❌ Lỗi không xác định:', error);
        const productGrid = document.querySelector('.product-grid');
        if (productGrid) {
            productGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 10px; padding: 30px;">
                        <h3 style="color: #e53e3e; margin-bottom: 15px;">❌ Lỗi hệ thống</h3>
                        <p style="color: #666; margin-bottom: 15px;">Có lỗi xảy ra khi tải sản phẩm:</p>
                        <pre style="background: #f7fafc; padding: 15px; border-radius: 5px; text-align: left; font-size: 12px; max-height: 200px; overflow: auto;">
${error.stack || error.message}
                        </pre>
                        <div style="margin-top: 20px;">
                            <button onclick="loadProducts(${currentPage})" style="padding: 10px 20px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                                Thử lại
                            </button>
                            <button onclick="location.reload()" style="padding: 10px 20px; background: #4a5568; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                Tải lại trang
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// ========== TẠO PRODUCT CARD ==========
function createProductCard(product, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const productId = product.ProductID || product.id || index;
    const productName = product.ProductName || product.name || `Sản phẩm ${index + 1}`;
    const price = product.SellingPrice || product.price || 0;
    const discount = product.Discount || product.discount || 0;
    const stock = product.StockQuantity || product.stock || 0;
    const imageUrl = product.ImageURL || product.image || './image/default-product.jpg';
    const category = product.CategoryName || product.category || '';
    const brand = product.BrandName || product.brand || '';
    const club = product.ClubName || product.club || '';
    const size = product.SizeName || product.size || '';
    const unit = product.Unit || 'cái';
    
    // Set data attributes cho bộ lọc
    card.dataset.productId = productId;
    card.dataset.price = price;
    card.dataset.category = category.toLowerCase().replace(/\s+/g, '-');
    card.dataset.brand = brand.toLowerCase().replace(/\s+/g, '-');
    card.dataset.club = club ? club.toLowerCase().replace(/\s+/g, '-') : '';
    card.dataset.size = size ? size.toLowerCase() : '';
    
    // Format giá tiền
    const formatPrice = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
    };
    
    // Tính giá sau giảm
    const finalPrice = discount > 0 ? price * (100 - discount) / 100 : price;
    
    // Tạo HTML
    card.innerHTML = `
        <div class="image-holder">
            <img src="${imageUrl}" 
                 alt="${productName}" 
                 loading="lazy"
                 onerror="this.onerror=null; this.src='./image/default-product.jpg';">
            ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
        </div>
        
        <div class="product-info">
            <h3>${productName}</h3>
            
            ${stock <= 10 && stock > 0 ? 
                `<span class="stock-warning">Chỉ còn ${stock} ${unit}</span>` : ''}
        </div>
        
        <div class="price-section">
            <div class="current-price">
                ${formatPrice(finalPrice)}
            </div>
            
            ${discount > 0 ? 
                `<div class="original-price">${formatPrice(price)}</div>` : ''}
        </div>
        
        <button class="add-to-cart" data-product-id="${productId}">
            <i class="fas fa-shopping-cart"></i> Thêm vào giỏ
        </button>
    `;
    
    return card;
}

// ========== GẮN SỰ KIỆN GIỎ HÀNG ==========
function attachCartEvents() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const cartCount = document.querySelector('.cart-count');
    let count = parseInt(cartCount?.textContent) || 0;
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            count++;
            if (cartCount) {
                cartCount.textContent = count;
                cartCount.classList.add('pulse');
                
                setTimeout(() => {
                    cartCount.classList.remove('pulse');
                }, 300);
            }
            
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            
            // Hiển thị thông báo
            showNotification(`Đã thêm "${productName}" vào giỏ hàng`);
        });
    });
}

// ========== HIỂN THỊ THÔNG BÁO ==========
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== THÊM CSS ==========
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* CSS cơ bản */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .discount-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #e74c3c;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .stock-warning {
            display: block;
            color: #e67e22;
            font-size: 12px;
            margin: 5px 10px;
            font-weight: bold;
        }
        
        .club-badge {
            display: inline-block;
            background: #3498db;
            color: white;
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 3px;
            margin-top: 5px;
            max-width: fit-content;
        }
        
        /* CSS cho phân trang mới */
        .pagination-container {
            grid-column: 1 / -1;
            background: white;
            border-radius: 12px;
            padding: 25px 30px;
            margin-top: 40px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border: 1px solid #eaeaea;
        }
        
        .pagination-header {
            display: flex;
            justify-content: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .pagination-stats {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            color: #333;
        }
        
        .page-info {
            font-weight: 600;
            color: #1a3e72;
            background: #f0f7ff;
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid #d1e3ff;
        }
        
        .product-count {
            color: #666;
            font-weight: 500;
        }
        
        .pagination-navigation {
            margin-bottom: 25px;
        }
        
        .nav-buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .nav-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 12px 20px;
            background: white;
            color: #1a3e72;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            font-size: 14px;
            min-width: 100px;
        }
        
        .nav-btn:hover:not(:disabled) {
            background: #1a3e72;
            color: white;
            border-color: #1a3e72;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(26, 62, 114, 0.2);
        }
        
        .nav-btn:disabled {
            background: #f5f5f5;
            color: #aaa;
            border-color: #eee;
            cursor: not-allowed;
            opacity: 0.6;
        }
        
        .nav-btn i {
            font-size: 14px;
        }
        
        .page-numbers {
            display: flex;
            gap: 8px;
            align-items: center;
            margin: 0 15px;
        }
        
        .page-num {
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            color: #4a5568;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            font-size: 15px;
        }
        
        .page-num:hover {
            background: #edf2f7;
            border-color: #cbd5e0;
            color: #2d3748;
        }
        
        .page-num.active {
            background: #1a3e72;
            color: white;
            border-color: #1a3e72;
            box-shadow: 0 4px 8px rgba(26, 62, 114, 0.3);
        }
        
        .page-dots {
            color: #a0aec0;
            font-weight: bold;
            font-size: 18px;
            padding: 0 5px;
        }
        
        .page-jump-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            padding-top: 20px;
            border-top: 1px solid #f0f0f0;
        }
        
        .jump-label {
            color: #4a5568;
            font-size: 15px;
            font-weight: 600;
        }
        
        .jump-controls {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .jump-input {
            width: 80px;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            text-align: center;
            font-size: 15px;
            font-weight: 600;
            color: #2d3748;
            transition: all 0.3s ease;
        }
        
        .jump-input:focus {
            outline: none;
            border-color: #1a3e72;
            box-shadow: 0 0 0 3px rgba(26, 62, 114, 0.1);
        }
        
        .jump-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #1a3e72, #2c5282);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
            font-size: 15px;
        }
        
        .jump-btn:hover {
            background: linear-gradient(135deg, #153060, #1a3e72);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(26, 62, 114, 0.3);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .pagination-container {
                padding: 20px;
                margin: 30px 15px;
            }
            
            .nav-buttons {
                gap: 8px;
            }
            
            .nav-btn {
                min-width: 80px;
                padding: 10px 15px;
                font-size: 13px;
            }
            
            .page-num {
                width: 40px;
                height: 40px;
                font-size: 14px;
            }
            
            .page-jump-section {
                flex-direction: column;
                gap: 12px;
            }
        }
    `;
    document.head.appendChild(style);
}

function debugProductDisplay() {
    console.log('=== DEBUG PRODUCT DISPLAY ===');
    console.log('1. API_URL:', API_URL);
    console.log('2. Current page:', currentPage);
    console.log('3. Products per page:', productsPerPage);
    console.log('4. Product grid exists:', !!document.querySelector('.product-grid'));
    
    // Kiểm tra container
    const container = document.querySelector('main.container');
    console.log('5. Main container:', container);
    
    // Kiểm tra CSS
    console.log('6. CSS Grid support:', 'grid' in document.documentElement.style);
    
    // Test tạo một sản phẩm demo
    const testProduct = {
        id: 999,
        name: 'TEST Sản phẩm demo',
        price: 500000,
        discount: 10,
        stock: 5,
        image: './image/default-product.jpg',
        category: 'Áo bóng đá',
        brand: 'Nike',
        club: 'Manchester United',
        size: 'M'
    };
    
    const testCard = createProductCard(testProduct, 0);
    console.log('7. Test card created:', testCard);
    
    // Hiển thị test card
    const productGrid = document.querySelector('.product-grid');
    if (productGrid) {
        productGrid.innerHTML = '';
        productGrid.appendChild(testCard);
        console.log('8. Test card appended to grid');
    }
}
// ========== KHỞI TẠO ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Khởi động product display với phân trang...');
    
    // Thêm CSS
    addStyles();
    
    // DEBUG: Kiểm tra hiển thị
    debugProductDisplay();
    
    // Load trang đầu tiên
    await loadProducts(1);
    
    // Setup filter events
    const filterCheckboxes = document.querySelectorAll('.filter-sidebar input[type="checkbox"]');
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            console.log('🔍 Filter changed, resetting to page 1...');
            currentPage = 1;
            loadProducts(1);
        });
    });
});

// Export để debug
window.ProductDisplay = {
    goToPage,
    loadProducts,
    getCurrentPage: () => currentPage,
    getTotalPages: () => totalPages
};