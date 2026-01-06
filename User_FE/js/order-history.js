// order-history.js - Sửa lỗi khởi tạo biến
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Lịch sử mua hàng loaded');
    
    // Biến toàn cục - DI CHUYỂN KHAI BÁO LÊN ĐẦU
    let currentFilter = 'all';
    let currentSearch = '';
    let productDetailModal = null; // DI CHUYỂN LÊN ĐÂY
    
    // Khởi tạo
    checkLogin();
    setupEventListeners();
    loadOrders();
    
    function checkLogin() {
        const customer = window.AuthSimple?.getCurrentUser();
        if (!customer) {
            window.location.href = '/html/login.html?redirect=order-history';
            return;
        }
    }
    
    function setupEventListeners() {
        // Filter functionality
        const filterBtns = document.querySelectorAll('.filter-btn');
        const searchInput = document.getElementById('searchOrder');
        
        // Filter by status
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                currentFilter = this.getAttribute('data-status') || 'all';
                loadOrders();
            });
        });
        
        // Search functionality
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentSearch = this.value;
                    loadOrders();
                }, 500);
            });
        }
        
        // Setup modal đóng mở
        setupModalListeners();
    }
    
    function setupModalListeners() {
        // Modal chi tiết sản phẩm - SỬA LẠI CÁCH KIỂM TRA
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            productDetailModal = modal; // GÁN GIÁ TRỊ
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
            
            // Đóng khi click ra ngoài modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }
    
    async function loadOrders() {
        try {
            const customer = window.AuthSimple?.getCurrentUser();
            if (!customer) return;
            
            showLoading(true);
            
            const endpoint1 = `/api/order/customer/${customer.id}?status=${currentFilter}&search=${currentSearch}`;
            console.log('🔍 Thử endpoint:', endpoint1);
            
            let response = await fetch(endpoint1);
            
            if (!response.ok) {
                const endpoint2 = `/api/order/email/${encodeURIComponent(customer.email)}?status=${currentFilter}`;
                console.log('🔍 Thử endpoint 2:', endpoint2);
                response = await fetch(endpoint2);
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log('📦 API Response:', data);
                
                if (data.success) {
                    const orders = data.orders || data;
                    if (Array.isArray(orders) && orders.length > 0) {
                        renderOrders(orders);
                        document.getElementById('emptyState').style.display = 'none';
                    } else {
                        showNoOrders();
                    }
                } else {
                    showError(data.message || 'API trả về lỗi');
                }
            } else {
                showError(`Lỗi server: ${response.status} - ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ Lỗi khi tải đơn hàng:', error);
            showError('Không thể kết nối đến server: ' + error.message);
        } finally {
            showLoading(false);
        }
    }
    
    function renderOrders(orders) {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        
        ordersList.innerHTML = '';
        
        if (!Array.isArray(orders)) {
            console.error('Orders không phải array:', orders);
            showError('Dữ liệu không đúng định dạng');
            return;
        }
        
        orders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersList.appendChild(orderCard);
        });
    }
    
    function createOrderCard(order) {
        const div = document.createElement('div');
        div.className = 'order-card';
        div.dataset.orderId = order.OrderID;
        
        // Format date
        const orderDate = order.OrderDate ? new Date(order.OrderDate) : new Date();
        const formattedDate = orderDate.toLocaleDateString('vi-VN');
        
        // Format price
        const formattedTotal = formatPrice(order.TotalPrice || 0);
        
        // Get status display
        const statusInfo = getStatusInfo(order.Status);
        
        // Xác định xem có được hủy đơn không
        const canCancel = order.Status === 'pending';
        
        // Action buttons - THÊM NÚT HỦY ĐƠN KHI Ở TRẠNG THÁI PENDING
        let actionButtons = `
            <button class="btn btn-outline view-order-detail-btn" onclick="viewOrderDetail(${order.OrderID})">
                <i class="fas fa-eye"></i> Xem chi tiết
            </button>
        `;
        
        if (canCancel) {
            actionButtons += `
                <button class="btn btn-danger cancel-order-btn" onclick="cancelOrder(${order.OrderID})">
                    <i class="fas fa-times"></i> Hủy đơn
                </button>
            `;
        }
        
        // Hiển thị sản phẩm đầu tiên trong đơn hàng (nếu có)
        const firstProduct = order.Items && order.Items.length > 0 ? order.Items[0] : null;
        let productPreview = '';
        
        if (firstProduct) {
            productPreview = `
                <div class="order-products-preview">
                    <div class="preview-product" onclick="showProductDetail(${firstProduct.ProductID})">
                        <img src="${firstProduct.ImageURL || '/images/default-product.jpg'}" 
                             alt="${firstProduct.ProductName}" class="product-thumb">
                        <div class="preview-product-info">
                            <h4>${firstProduct.ProductName}</h4>
                            <p>${firstProduct.Quantity} × ${formatPrice(firstProduct.Price)}</p>
                            <button class="btn-view-product">
                                <i class="fas fa-external-link-alt"></i> Xem sản phẩm
                            </button>
                        </div>
                    </div>
                    ${order.Items.length > 1 ? 
                        `<div class="more-products">+${order.Items.length - 1} sản phẩm khác</div>` : ''}
                </div>
            `;
        }
        
        div.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Đơn hàng #${String(order.OrderID || '0000').padStart(8, '0')}</h3>
                    <div class="order-meta">
                        <span class="order-date">
                            <i class="far fa-calendar"></i> ${formattedDate}
                        </span>
                        <span class="order-status ${statusInfo.class}">
                            <i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}
                        </span>
                        <span class="order-total">
                            <i class="fas fa-wallet"></i> ${formattedTotal}
                        </span>
                    </div>
                </div>
                <div class="order-actions">
                    ${actionButtons}
                </div>
            </div>
            ${productPreview}
        `;
        
        return div;
    }
    
    function showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const ordersList = document.getElementById('ordersList');
        
        if (show) {
            loadingState.style.display = 'block';
            ordersList.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
            ordersList.style.display = 'block';
        }
    }
    
    function showError(message) {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        
        ordersList.innerHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Không thể tải đơn hàng</h3>
                <p>${message}</p>
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Tải lại trang
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('emptyState').style.display = 'none';
    }
    
    function showNoOrders() {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;
        
        ordersList.innerHTML = '';
        document.getElementById('emptyState').style.display = 'block';
    }
});

// ========== CÁC HÀM TOÀN CỤC ==========

function formatPrice(price) {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
}

function getStatusInfo(status) {
    const statusMap = {
        'pending': { text: 'Chờ xác nhận', class: 'pending', icon: 'fa-clock' },
        'shipping': { text: 'Đang giao hàng', class: 'shipping', icon: 'fa-truck' },
        'completed': { text: 'Đã giao hàng', class: 'delivered', icon: 'fa-check-circle' },
        'cancelled': { text: 'Đã hủy', class: 'cancelled', icon: 'fa-times-circle' }
    };
    
    return statusMap[status] || { text: status, class: 'pending', icon: 'fa-question-circle' };
}

// ========== HÀM HỦY ĐƠN HÀNG ==========
async function cancelOrder(orderId) {
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${String(orderId).padStart(8, '0')}?\n\nLưu ý: Bạn chỉ có thể hủy đơn hàng khi đang ở trạng thái "Chờ xác nhận".`)) {
        return;
    }
    
    try {
        console.log(`🔄 Đang hủy đơn hàng ${orderId}...`);
        
        // Thử endpoint hủy đơn hàng
        const response = await fetch(`/api/order/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        const result = await response.json();
        console.log('📦 API Response:', result);
        
        if (response.ok && result.success) {
            // Hiển thị thông báo thành công
            showCancelSuccess(orderId);
            
            // Cập nhật giao diện ngay lập tức
            updateOrderStatusUI(orderId, 'cancelled');
            
        } else {
            // Xử lý lỗi từ server
            handleCancelError(orderId, result.message || `Lỗi server: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
        showContactSupportModal(orderId);
    }
}

// ========== HÀM CẬP NHẬT UI KHI HỦY THÀNH CÔNG ==========
function updateOrderStatusUI(orderId, newStatus) {
    const orderCard = document.querySelector(`.order-card[data-order-id="${orderId}"]`);
    if (!orderCard) return;
    
    // Cập nhật trạng thái hiển thị
    const statusElement = orderCard.querySelector('.order-status');
    const statusInfo = getStatusInfo(newStatus);
    
    if (statusElement) {
        statusElement.className = `order-status ${statusInfo.class}`;
        statusElement.innerHTML = `<i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}`;
    }
    
    // Ẩn nút hủy đơn
    const cancelBtn = orderCard.querySelector('.cancel-order-btn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
    
    // Thêm thông báo đã hủy
    const existingMessage = orderCard.querySelector('.cancelled-message');
    if (!existingMessage) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'cancelled-message';
        messageDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Đơn hàng đã được hủy thành công
        `;
        messageDiv.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 10px 15px;
            border-radius: 4px;
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        `;
        
        // Thêm vào sau phần header
        const orderHeader = orderCard.querySelector('.order-header');
        if (orderHeader) {
            orderHeader.parentNode.insertBefore(messageDiv, orderHeader.nextSibling);
        }
    }
}

function showCancelSuccess(orderId) {
    // Tạo thông báo toast
    const toast = document.createElement('div');
    toast.id = 'cancel-success-toast';
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-check-circle" style="color: #28a745; font-size: 20px;"></i>
            <div>
                <div style="font-weight: bold;">Đã hủy đơn hàng thành công!</div>
                <div style="font-size: 12px; opacity: 0.8;">Đơn hàng #${String(orderId).padStart(8, '0')} đã được hủy</div>
            </div>
        </div>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: 18px;
            padding: 0 5px;
        ">&times;</button>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
        border-left: 4px solid #28a745;
    `;
    
    document.body.appendChild(toast);
    
    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// ========== HÀM XỬ LÝ LỖI KHI HỦY ==========
function handleCancelError(orderId, errorMessage) {
    console.log(`❌ Lỗi khi hủy đơn ${orderId}:`, errorMessage);
    
    // Kiểm tra loại lỗi
    if (errorMessage.includes('trạng thái') || errorMessage.includes('status')) {
        // Lỗi do trạng thái không phù hợp
        alert(`❌ ${errorMessage}\n\nĐơn hàng này không thể hủy vì đã chuyển sang trạng thái khác.`);
    } else {
        // Lỗi khác, hiển thị thông tin liên hệ
        showContactSupportModal(orderId, errorMessage);
    }
}

// ========== MODAL HỖ TRỢ LIÊN HỆ ==========
function showContactSupportModal(orderId, errorMessage = '') {
    const modalHTML = `
        <div class="contact-modal-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: 20px;
        ">
            <div class="contact-modal" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-headset" style="font-size: 48px; color: #ff9800;"></i>
                    <h3 style="margin: 10px 0 5px 0; color: #333;">Cần hỗ trợ hủy đơn hàng</h3>
                    <p style="color: #666; margin-bottom: 10px;">Đơn hàng #${String(orderId).padStart(8, '0')}</p>
                    
                    ${errorMessage ? `
                        <div style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 14px;">
                            <i class="fas fa-exclamation-triangle"></i> 
                            ${errorMessage}
                        </div>
                    ` : ''}
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin-bottom: 15px; font-weight: bold; color: #333;">Vui lòng liên hệ bộ phận chăm sóc khách hàng:</p>
                    
                    <div style="margin: 15px 0;">
                        <!-- Hotline -->
                        <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                            <i class="fas fa-phone" style="color: #4CAF50; width: 30px; margin-top: 3px;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333;">Hotline</div>
                                <a href="tel:19001234" style="
                                    color: #1a3e72;
                                    text-decoration: none;
                                    font-weight: bold;
                                    font-size: 18px;
                                    display: block;
                                    margin: 5px 0;
                                ">1900 1234</a>
                                <div style="font-size: 13px; color: #666;">(Miễn phí cuộc gọi)</div>
                            </div>
                        </div>
                        
                        <!-- Email -->
                        <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                            <i class="fas fa-envelope" style="color: #4CAF50; width: 30px; margin-top: 3px;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333;">Email</div>
                                <a href="mailto:support@footballstore.com?subject=Hỗ trợ hủy đơn hàng #${orderId}" 
                                   style="
                                    color: #1a3e72;
                                    text-decoration: none;
                                    display: block;
                                    margin: 5px 0;
                                    word-break: break-all;
                                ">
                                    support@footballstore.com
                                </a>
                            </div>
                        </div>
                        
                        <!-- Thời gian làm việc -->
                        <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                            <i class="fas fa-clock" style="color: #4CAF50; width: 30px; margin-top: 3px;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333;">Thời gian làm việc</div>
                                <div style="margin: 5px 0; color: #333;">8:00 - 22:00 hàng ngày</div>
                                <div style="font-size: 13px; color: #666;">(Kể cả thứ 7, Chủ nhật)</div>
                            </div>
                        </div>
                        
                        <!-- Zalo -->
                        <div style="display: flex; align-items: flex-start; margin: 12px 0;">
                            <i class="fas fa-comments" style="color: #4CAF50; width: 30px; margin-top: 3px;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333;">Zalo</div>
                                <div style="margin: 5px 0; color: #333;">0909 123 456</div>
                                <div style="font-size: 13px; color: #666;">(Hỗ trợ nhanh qua Zalo)</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="closeContactModal()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 40px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: bold;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
                        <i class="fas fa-check"></i> Đã hiểu
                    </button>
                    
                    <div style="margin-top: 15px;">
                        <button onclick="location.reload()" style="
                            background: none;
                            border: 1px solid #ddd;
                            color: #666;
                            padding: 8px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                            margin-left: 10px;
                        ">
                            <i class="fas fa-redo"></i> Tải lại trang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Tạo và thêm modal vào body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Thêm hàm đóng modal toàn cục
    window.closeContactModal = function() {
        if (modalContainer.parentNode) {
            document.body.removeChild(modalContainer);
        }
    };
    
    // Đóng modal khi click ra ngoài
    modalContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('contact-modal-overlay')) {
            window.closeContactModal();
        }
    });
    
    // Thêm CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// ========== HÀM XEM CHI TIẾT SẢN PHẨM (MODAL) ==========
async function showProductDetail(productId) {
    try {
        // Hiển thị loading trong modal
        const modal = document.getElementById('productDetailModal');
        const modalBody = document.getElementById('productDetailModalBody');
        
        if (!modal || !modalBody) {
            // Nếu không có modal, chuyển đến trang chi tiết sản phẩm
            window.location.href = `/html/product-detail.html?id=${productId}`;
            return;
        }
        
        modalBody.innerHTML = `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p>Đang tải thông tin sản phẩm...</p>
            </div>
        `;
        modal.style.display = 'block';
        
        // Lấy thông tin sản phẩm từ API
        const response = await fetch(`/api/product/${productId}`);
        if (!response.ok) {
            throw new Error('Không thể tải thông tin sản phẩm');
        }
        
        const product = await response.json();
        
        // Hiển thị thông tin sản phẩm trong modal
        modalBody.innerHTML = `
            <div class="product-modal-content">
                <div class="product-modal-images">
                    <img src="${product.ImageURL || '/images/default-product.jpg'}" 
                         alt="${product.ProductName}" class="product-modal-main-img">
                </div>
                <div class="product-modal-info">
                    <h3>${product.ProductName}</h3>
                    <div class="product-modal-price">
                        <span class="current-price">${formatPrice(product.Price)}</span>
                        ${product.OriginalPrice ? 
                            `<span class="original-price">${formatPrice(product.OriginalPrice)}</span>` : ''}
                    </div>
                    <div class="product-modal-meta">
                        <p><strong>Thương hiệu:</strong> ${product.Brand || 'N/A'}</p>
                        <p><strong>Danh mục:</strong> ${product.Category || 'N/A'}</p>
                        <p><strong>Tình trạng:</strong> 
                            <span class="${product.StockQuantity > 0 ? 'in-stock' : 'out-of-stock'}">
                                ${product.StockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                        </p>
                    </div>
                    <div class="product-modal-description">
                        <h4>Mô tả:</h4>
                        <p>${product.Description || 'Không có mô tả.'}</p>
                    </div>
                    <div class="product-modal-actions">
                        <button class="btn btn-outline" onclick="window.location.href='/html/product-detail.html?id=${productId}'">
                            <i class="fas fa-external-link-alt"></i> Xem chi tiết đầy đủ
                        </button>
                        <button class="btn btn-primary" onclick="addToCartFromModal(${productId}, '${product.ProductName}', ${product.Price})">
                            <i class="fas fa-shopping-cart"></i> Thêm vào giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Lỗi khi tải thông tin sản phẩm:', error);
        const modalBody = document.getElementById('productDetailModalBody');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="modal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Không thể tải thông tin sản phẩm</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="window.location.href='/html/product-detail.html?id=${productId}'">
                        Đến trang sản phẩm
                    </button>
                </div>
            `;
        }
    }
}

// ========== HÀM THÊM VÀO GIỎ HÀNG TỪ MODAL ==========
function addToCartFromModal(productId, productName, price) {
    // Giả sử bạn có hàm addToCart đã được định nghĩa
    if (typeof window.addToCart === 'function') {
        window.addToCart(productId, 1, productName, price);
        
        // Hiển thị thông báo
        alert(`Đã thêm "${productName}" vào giỏ hàng!`);
        
        // Đóng modal sau khi thêm
        const modal = document.getElementById('productDetailModal');
        if (modal) {
            modal.style.display = 'none';
        }
    } else {
        alert('Vui lòng thêm sản phẩm từ trang chi tiết sản phẩm');
    }
}

// ========== HÀM XEM CHI TIẾT ĐƠN HÀNG ==========
function viewOrderDetail(orderId) {
    window.location.href = `/html/order-detail.html?id=${orderId}`;
}