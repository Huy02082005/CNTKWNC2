// ========== PAGINATION UTILITIES ==========

// Biến global cho phân trang
let currentPage = 1;
const productsPerPage = 16;
let totalProducts = 0;
let totalPages = 1;

// Callback function - sẽ được set từ bên ngoài
let paginationCallback = null;

// ========== TẠO PAGINATION CONTROLS ==========
function createPaginationControls() {
    console.log('📄 Creating pagination controls...');
    
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
        const productGrid = document.querySelector('.product-grid');
        if (productGrid && productGrid.parentElement) {
            contentArea = document.createElement('div');
            contentArea.className = 'content-area';

            productGrid.parentElement.insertBefore(contentArea, productGrid);
            contentArea.appendChild(productGrid);
        }
    }
    
    // Chèn phân trang vào CUỐI content-area
    if (contentArea) {
        contentArea.appendChild(container);
    } else {
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
                
                <div class="page-numbers">
                    ${generatePageNumbers()}
                </div>

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
    console.log('✅ Pagination controls created');
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
    console.log('🔗 Attaching pagination events...');
    
    // Sử dụng event delegation
    document.addEventListener('click', function(e) {
        // Nút Đầu trang
        if (e.target.closest('.first-page') && !e.target.closest('.first-page')?.disabled) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔗 First page clicked');
            goToPage(1);
        }

        // Nút Cuối trang
        if (e.target.closest('.last-page') && !e.target.closest('.last-page')?.disabled) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔗 Last page clicked');
            goToPage(totalPages);
        }
        
        // Các số trang
        if (e.target.closest('.page-num')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target.closest('.page-num');
            const page = parseInt(btn.dataset.page);
            console.log(`🔗 Page ${page} clicked`);
            if (page !== currentPage) {
                goToPage(page);
            }
        }
        
        // Nút Nhảy trang
        if (e.target.closest('#jump-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const pageInput = document.getElementById('page-jump');
            const page = parseInt(pageInput.value);
            console.log(`🔗 Jump to page ${page} clicked`);
            
            if (page >= 1 && page <= totalPages && page !== currentPage) {
                goToPage(page);
            }
        }
    });
    
    // Sự kiện Enter trên input nhảy trang
    document.addEventListener('keyup', function(e) {
        if (e.target.id === 'page-jump' && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const page = parseInt(e.target.value);
            console.log(`🔗 Enter jump to page ${page}`);
            
            if (page >= 1 && page <= totalPages && page !== currentPage) {
                goToPage(page);
            }
        }
    });
    
    // Validate input nhảy trang
    document.addEventListener('change', function(e) {
        if (e.target.id === 'page-jump') {
            let page = parseInt(e.target.value);
            if (page < 1) page = 1;
            if (page > totalPages) page = totalPages;
            e.target.value = page;
        }
    });
    
    console.log('✅ Pagination events attached');
}

// ========== ĐIỀU HƯỚNG ĐẾN TRANG ==========
async function goToPage(page) {
    console.log(`📄 goToPage called: page=${page}, currentPage=${currentPage}, totalPages=${totalPages}`);
    
    if (page < 1 || page > totalPages || page === currentPage) {
        console.log(`⚠️ Cannot navigate: invalid page or same page`);
        return;
    }
    
    console.log(`📄 Navigating from page ${currentPage} to page ${page}`);
    currentPage = page;
    
    // Gọi callback nếu có
    if (typeof paginationCallback === 'function') {
        console.log(`📄 Executing pagination callback`);
        try {
            await paginationCallback(page);
            
            // Scroll lên đầu trang
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            console.log(`✅ Successfully navigated to page ${page}`);
        } catch (error) {
            console.error(`❌ Error in pagination callback:`, error);
        }
    } else {
        console.warn(`⚠️ No pagination callback set. Please call Pagination.setCallback() first.`);
        
        // Dispatch event để các component khác có thể lắng nghe
        const event = new CustomEvent('pagination:pageChange', {
            detail: { 
                page: page,
                currentPage: currentPage,
                totalPages: totalPages
            }
        });
        window.dispatchEvent(event);
    }
}

// ========== UPDATE PAGINATION INFO ==========
function updatePaginationInfo(total, pageCount) {
    totalProducts = total || 0;
    totalPages = pageCount || Math.ceil(totalProducts / productsPerPage) || 1;
    
    console.log('📊 Pagination updated:', {
        total: totalProducts,
        totalPages: totalPages,
        currentPage: currentPage,
        productsPerPage: productsPerPage
    });
}

// ========== RESET PAGINATION ==========
function resetPagination() {
    currentPage = 1;
    totalProducts = 0;
    totalPages = 1;
    paginationCallback = null;
    
    const oldContainer = document.querySelector('.pagination-container');
    if (oldContainer) {
        oldContainer.remove();
    }
    
    console.log('🔄 Pagination reset');
}

// ========== THIẾT LẬP CALLBACK ==========
function setCallback(callback) {
    if (typeof callback === 'function') {
        paginationCallback = callback;
        console.log('✅ Pagination callback set');
    } else {
        console.error('❌ Invalid callback. Must be a function.');
    }
}

// ========== THÊM CSS ==========
function addPaginationStyles() {
    if (document.getElementById('pagination-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'pagination-styles';
    style.textContent = `
        /* CSS cho phân trang */
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

// ========== INIT PAGINATION ==========
function initPagination() {
    addPaginationStyles();
    console.log('✅ Pagination Utilities ready');
}

// ========== EXPORT GLOBAL ==========
window.Pagination = {
    // Core functions
    initPagination,
    createPaginationControls,
    updatePaginationInfo,
    resetPagination,
    goToPage,
    setCallback,
    
    // Getters
    getCurrentPage: () => currentPage,
    getTotalPages: () => totalPages,
    getTotalProducts: () => totalProducts,
    getProductsPerPage: () => productsPerPage,
    
    // For debugging
    _debug: () => ({
        currentPage,
        totalProducts,
        totalPages,
        productsPerPage,
        hasCallback: typeof paginationCallback === 'function'
    })
};

// Auto-init
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo CSS
    addPaginationStyles();
    
    // Lắng nghe sự kiện page change nếu không có callback
    window.addEventListener('pagination:pageChange', function(e) {
        console.log('📄 Pagination page change event:', e.detail);
    });
    
    console.log('✅ Pagination module loaded');
});