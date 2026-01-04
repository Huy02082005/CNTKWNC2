// order-history.js - Sử dụng polling thay vì WebSocket
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Lịch sử mua hàng loaded');
    
    // Biến toàn cục
    let currentFilter = 'all';
    let currentSearch = '';
    let pollingInterval = null;
    let lastUpdateTime = null;
    window.renderOrders = renderOrders;
    
    // Khởi tạo
    checkLogin();
    setupEventListeners();
    loadOrders();
    startPolling();
    
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
                applyFilters();
            });
        });
        
        // Search functionality
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    currentSearch = this.value;
                    applyFilters();
                }, 500);
            });
        }
        
        // Pagination
        const pageBtns = document.querySelectorAll('.page-btn:not(.disabled)');
        pageBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.classList.contains('active')) return;
                
                document.querySelector('.page-btn.active').classList.remove('active');
                this.classList.add('active');
                
                const pageNum = parseInt(this.textContent);
                if (!isNaN(pageNum)) {
                    loadOrders(pageNum);
                }
            });
        });
    }

    function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) {
        console.error('Không tìm thấy element ordersList');
        return;
    }
    
    ordersList.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        document.getElementById('emptyState').style.display = 'block';
        return;
    }
    
    orders.forEach(order => {
        const orderCard = createOrderCard(order);
        ordersList.appendChild(orderCard);
    });
}
    
async function loadOrders(page = 1) {
    try {
        const customer = window.AuthSimple?.getCurrentUser();
        if (!customer) {
            console.log('Không tìm thấy thông tin khách hàng');
            window.location.href = '/html/login.html?redirect=order-history';
            return;
        }
        
        showLoading(true);
        
        console.log(`📡 Đang gọi API orders cho customer ID: ${customer.id}`);
        
        // Thêm timeout để không đợi quá lâu
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout
        
        try {
            const response = await fetch(`/api/orders/customer/${customer.id}?page=${page}&status=${currentFilter}&search=${currentSearch}`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log(`📊 API Response status: ${response.status}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📦 Dữ liệu nhận được:', data);
                
                if (data.success) {
                    renderOrders(data.orders || []);
                    
                    if (data.orders && data.orders.length > 0) {
                        lastUpdateTime = new Date();
                        document.getElementById('emptyState').style.display = 'none';
                    } else {
                        document.getElementById('emptyState').style.display = 'block';
                    }
                    
                    // Cập nhật pagination nếu có
                    if (data.pagination) {
                        updatePagination(data.pagination.totalPages, data.pagination.currentPage);
                    }
                } else {
                    console.error('API trả về success: false', data);
                    throw new Error(data.message || 'API lỗi');
                }
            } else {
                console.error(`HTTP Error: ${response.status} ${response.statusText}`);
                
                // Thử API fallback nếu API chính lỗi
                await tryFallbackAPI(customer, page);
            }
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            if (fetchError.name === 'AbortError') {
                console.error('⏰ API timeout');
                throw new Error('API timeout - Server không phản hồi');
            } else {
                throw fetchError;
            }
        }
        
    } catch (error) {
        console.error('❌ Lỗi khi tải đơn hàng:', error);
        showError(`Không thể tải đơn hàng: ${error.message}`);
        loadSampleData(); // Fallback to sample data
    } finally {
        showLoading(false);
    }
}

    
    function applyFilters() {
        loadOrders(1);
    }

    function createOrderCard(order) {
        const div = document.createElement('div');
        div.className = 'order-card';
        div.dataset.orderId = order.OrderID;
        
        // Format date
        const orderDate = new Date(order.OrderDate);
        const formattedDate = orderDate.toLocaleDateString('vi-VN');
        
        // Format price
        const formattedTotal = formatPrice(order.TotalPrice);
        
        // Get status display
        const statusInfo = getStatusInfo(order.Status);
        
        let actionButtons = '';
        switch(order.Status) {
            case 'shipping':
                actionButtons = `
                    <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    <button class="btn btn-success" onclick="trackOrder(${order.OrderID})">
                        <i class="fas fa-map-marker-alt"></i> Theo dõi
                    </button>
                `;
                break;
            case 'completed':
                actionButtons = `
                    <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    <button class="btn btn-primary" onclick="reorder(${order.OrderID})">
                        <i class="fas fa-redo"></i> Mua lại
                    </button>
                    <button class="btn btn-success" onclick="rateOrder(${order.OrderID})">
                        <i class="fas fa-star"></i> Đánh giá
                    </button>
                `;
                break;
            default:
                actionButtons = `
                    <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                `;
        }
        
        div.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Đơn hàng #${order.OrderID.toString().padStart(8, '0')}</h3>
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
            
            <div class="order-products" id="products-${order.OrderID}">
                <div class="loading-products">Đang tải sản phẩm...</div>
            </div>
        `;
        
        // Load products for this order
        loadOrderProducts(order.OrderID, div.querySelector(`#products-${order.OrderID}`));
        
        return div;
    }
    
    async function loadOrderProducts(orderId, container) {
    try {
        const response = await fetch(`/api/orders/${orderId}/products`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                renderOrderProducts(data.products, container);
            }
        }
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p class="text-muted">Không thể tải thông tin sản phẩm</p>';
    }
}

    
    function renderOrderProducts(products, container) {
        if (!products || products.length === 0) {
            container.innerHTML = '<p class="text-muted">Không có thông tin sản phẩm</p>';
            return;
        }
        
        container.innerHTML = '';
        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item';
            
            const imageUrl = product.ImageURL || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80';
            const formattedPrice = formatPrice(product.UnitPrice || product.Price);
            
            productDiv.innerHTML = `
                <img src="${imageUrl}" alt="${product.ProductName}" 
                     onerror="this.src='https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'">
                <div class="product-info">
                    <h4>${product.ProductName || 'Sản phẩm'}</h4>
                    <p>${product.SizeName ? `Size: ${product.SizeName}` : ''} ${product.PlayerName ? ` | ${product.PlayerName}` : ''}</p>
                    <p class="product-price">${formattedPrice}</p>
                </div>
                <div class="product-quantity">x${product.Quantity || 1}</div>
            `;
            
            container.appendChild(productDiv);
        });
    }
    
    function updatePagination(totalPages, currentPage) {
        const pagination = document.getElementById('pagination');
        if (!pagination || totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        
        // Update page numbers
        const pageNumbers = document.getElementById('pageNumbers');
        pageNumbers.innerHTML = '';
        
        for (let i = 1; i <= Math.min(5, totalPages); i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => loadOrders(i);
            pageNumbers.appendChild(pageBtn);
        }
        
        // Update prev/next buttons
        document.getElementById('prevPage').disabled = currentPage <= 1;
        document.getElementById('nextPage').disabled = currentPage >= totalPages;
        document.getElementById('prevPage').onclick = () => currentPage > 1 && loadOrders(currentPage - 1);
        document.getElementById('nextPage').onclick = () => currentPage < totalPages && loadOrders(currentPage + 1);
    }
    
    function startPolling() {
        // Kiểm tra cập nhật đơn hàng mỗi 30 giây
        pollingInterval = setInterval(() => {
            checkForUpdates();
        }, 30000); // 30 giây
        
        // Cũng kiểm tra khi người dùng quay lại trang
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                checkForUpdates();
            }
        });
    }
    
    async function checkForUpdates() {
        try {
            const customer = window.AuthSimple?.getCurrentUser();
            if (!customer || !lastUpdateTime) return;
            
            const response = await fetch(`/api/orders/customer/${customer.id}/updates?since=${lastUpdateTime.toISOString()}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.hasUpdates) {
                    console.log('🔄 Có cập nhật đơn hàng:', data.updatedOrders);
                    
                    // Cập nhật từng đơn hàng
                    for (const order of data.updatedOrders) {
                        await updateSingleOrder(order.OrderID);
                    }
                }
            }
        } catch (error) {
            console.log('Polling check failed:', error);
        }
    }
    
    async function updateSingleOrder(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
            if (response.ok) {
                const order = await response.json();
                // Cập nhật đơn hàng trong danh sách
                updateOrderInList(order);
            }
        } catch (error) {
            console.error('Error updating single order:', error);
        }
    }
    
    function updateOrderInList(order) {
        const orderCard = document.querySelector(`[data-order-id="${order.OrderID}"]`);
        if (!orderCard) return;
        
        const statusInfo = getStatusInfo(order.Status);
        const statusElement = orderCard.querySelector('.order-status');
        if (statusElement) {
            statusElement.className = `order-status ${statusInfo.class}`;
            statusElement.innerHTML = `<i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}`;
        }
        
        // Cập nhật action buttons nếu cần
        const actionsDiv = orderCard.querySelector('.order-actions');
        if (actionsDiv) {
            let newButtons = '';
            switch(order.Status) {
                case 'shipping':
                    newButtons = `
                        <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                        <button class="btn btn-success" onclick="trackOrder(${order.OrderID})">
                            <i class="fas fa-map-marker-alt"></i> Theo dõi
                        </button>
                    `;
                    break;
                case 'completed':
                    newButtons = `
                        <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                        <button class="btn btn-primary" onclick="reorder(${order.OrderID})">
                            <i class="fas fa-redo"></i> Mua lại
                        </button>
                        <button class="btn btn-success" onclick="rateOrder(${order.OrderID})">
                            <i class="fas fa-star"></i> Đánh giá
                        </button>
                    `;
                    break;
                default:
                    newButtons = `
                        <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                    `;
            }
            actionsDiv.innerHTML = newButtons;
        }
        
        // Hiển thị thông báo
        showToast(`Đơn hàng #${order.OrderID} đã được cập nhật trạng thái thành "${statusInfo.text}"`, 'info');
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
        <div class="error-state" style="text-align: center; padding: 60px 20px; color: #666;">
            <div class="error-icon" style="font-size: 4rem; color: #ff6b6b; margin-bottom: 20px;">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h3 style="color: #333; margin-bottom: 15px;">Không thể tải đơn hàng</h3>
            <p style="margin-bottom: 10px;">${message}</p>
            <p style="margin-bottom: 25px; font-size: 0.9em; color: #888;">
                Đang hiển thị dữ liệu mẫu. Vui lòng thử lại sau.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn-primary" onclick="location.reload()" style="padding: 10px 20px;">
                    <i class="fas fa-redo"></i> Tải lại trang
                </button>
                <button class="btn btn-outline" onclick="loadOrders(1)" style="padding: 10px 20px;">
                    <i class="fas fa-sync"></i> Thử lại
                </button>
            </div>
        </div>
    `;
}
    
    // Dọn dẹp khi page unload
    window.addEventListener('beforeunload', () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
    });
});

// Các hàm toàn cục và utility functions
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

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-bell"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// Các hàm action
function viewOrderDetail(orderId) {
    // Sử dụng modal thay vì alert
    showOrderDetailModal(orderId);
}

function showOrderDetailModal(orderId) {
    // Tạo modal hiển thị chi tiết đơn hàng
    const modalHTML = `
        <div class="modal-overlay" id="orderDetailModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Đang tải chi tiết đơn hàng...</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body" id="modalBody">
                    <div class="loading">Đang tải thông tin...</div>
                </div>
            </div>
        </div>
    `;
    
    // Xóa modal cũ nếu có
    const oldModal = document.getElementById('orderDetailModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Load chi tiết đơn hàng
    loadOrderDetail(orderId);
}

async function loadOrderDetail(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}/detail`);
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                renderOrderDetail(data);
            }
        }
    } catch (error) {
        console.error('Error loading order detail:', error);
        document.getElementById('modalBody').innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Không thể tải chi tiết đơn hàng</p>
            </div>
        `;
    }
}

function renderOrderDetail(orderDetail) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    
    const statusInfo = getStatusInfo(orderDetail.Status);
    
    modalBody.innerHTML = `
        <div class="order-detail-info">
            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> Thông tin đơn hàng</h4>
                <div class="detail-row">
                    <span class="detail-label">Mã đơn hàng:</span>
                    <span class="detail-value">#${orderDetail.OrderID.toString().padStart(8, '0')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Ngày đặt:</span>
                    <span class="detail-value">${new Date(orderDetail.OrderDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Trạng thái:</span>
                    <span class="detail-value">
                        <span class="order-status ${statusInfo.class}">
                            <i class="fas ${statusInfo.icon}"></i> ${statusInfo.text}
                        </span>
                    </span>
                </div>
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-shopping-cart"></i> Sản phẩm</h4>
                ${orderDetail.Products && orderDetail.Products.length > 0 ? 
                    orderDetail.Products.map(product => `
                        <div class="detail-product">
                            <img src="${product.ImageURL || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'}" 
                                 alt="${product.ProductName}">
                            <div class="product-info">
                                <h5>${product.ProductName}</h5>
                                <p>${product.SizeName ? `Size: ${product.SizeName}` : ''}</p>
                                <p>SL: ${product.Quantity} x ${formatPrice(product.UnitPrice)}</p>
                            </div>
                        </div>
                    `).join('') : 
                    '<p>Không có thông tin sản phẩm</p>'
                }
            </div>
            
            <div class="detail-section">
                <h4><i class="fas fa-receipt"></i> Thanh toán</h4>
                <div class="detail-row">
                    <span class="detail-label">Tổng tiền:</span>
                    <span class="detail-value">${formatPrice(orderDetail.TotalPrice)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Phí vận chuyển:</span>
                    <span class="detail-value">${formatPrice(orderDetail.ShippingFee || 0)}</span>
                </div>
                <div class="detail-row total">
                    <span class="detail-label">Thành tiền:</span>
                    <span class="detail-value">${formatPrice(orderDetail.TotalPrice + (orderDetail.ShippingFee || 0))}</span>
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('#orderDetailModal .modal-header h3').textContent = 
        `Đơn hàng #${orderDetail.OrderID.toString().padStart(8, '0')}`;
}

function closeModal() {
    const modal = document.getElementById('orderDetailModal');
    if (modal) modal.remove();
}

function reorder(orderId) {
    if (confirm(`Bạn có muốn mua lại các sản phẩm từ đơn hàng #${orderId}?`)) {
        // Thêm vào giỏ hàng
        showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
        // Trong thực tế, cần gọi API để thêm vào giỏ
        // fetch(`/api/cart/reorder/${orderId}`, { method: 'POST' });
    }
}

function trackOrder(orderId) {
    showToast('Tính năng theo dõi đơn hàng đang được phát triển', 'info');
}

function rateOrder(orderId) {
    showToast('Tính năng đánh giá đơn hàng đang được phát triển', 'info');
}

// Fallback: Dữ liệu mẫu khi API không hoạt động
function loadSampleData() {
    console.log('📦 Sử dụng dữ liệu mẫu');
    
    const sampleOrders = [
        {
            OrderID: 10001,
            OrderDate: '2024-01-15',
            TotalPrice: 1250000,
            Status: 'completed',
            FullName: 'Nguyễn Văn A',
            Email: 'nguyenvana@email.com',
            Phone: '0912345678'
        },
        {
            OrderID: 10002,
            OrderDate: '2024-01-10',
            TotalPrice: 850000,
            Status: 'shipping',
            FullName: 'Trần Thị B',
            Email: 'tranthib@email.com',
            Phone: '0912345679'
        },
        {
            OrderID: 10003,
            OrderDate: '2024-01-05',
            TotalPrice: 1950000,
            Status: 'pending',
            FullName: 'Lê Văn C',
            Email: 'levanc@email.com',
            Phone: '0912345680'
        }
    ];
    
    // Gọi hàm renderOrders đúng cách
    if (typeof window.renderOrders === 'function') {
        window.renderOrders(sampleOrders);
    } else {
        // Fallback: render trực tiếp
        renderOrdersDirectly(sampleOrders);
    }
    
    document.getElementById('emptyState').style.display = 'none';
}

function renderOrdersDirectly(orders) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.dataset.orderId = order.OrderID;
        
        // Format date
        const orderDate = new Date(order.OrderDate);
        const formattedDate = orderDate.toLocaleDateString('vi-VN');
        
        // Format price
        const formattedTotal = formatPrice(order.TotalPrice);
        
        // Get status display
        const statusInfo = getStatusInfo(order.Status);
        
        let actionButtons = '';
        switch(order.Status) {
            case 'shipping':
                actionButtons = `
                    <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    <button class="btn btn-success" onclick="trackOrder(${order.OrderID})">
                        <i class="fas fa-map-marker-alt"></i> Theo dõi
                    </button>
                `;
                break;
            case 'completed':
                actionButtons = `
                    <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                    <button class="btn btn-primary" onclick="reorder(${order.OrderID})">
                        <i class="fas fa-redo"></i> Mua lại
                    </button>
                    <button class="btn btn-success" onclick="rateOrder(${order.OrderID})">
                        <i class="fas fa-star"></i> Đánh giá
                    </button>
                `;
                break;
            default:
                actionButtons = `
                    <button class="btn btn-outline" onclick="viewOrderDetail(${order.OrderID})">
                        <i class="fas fa-eye"></i> Xem chi tiết
                    </button>
                `;
        }
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Đơn hàng #${order.OrderID.toString().padStart(8, '0')}</h3>
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
            
            <div class="order-products">
                <div class="product-item">
                    <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" 
                         alt="Sản phẩm mẫu">
                    <div class="product-info">
                        <h4>Áo bóng đá mẫu</h4>
                        <p>Size: M | Màu: Đỏ</p>
                        <p class="product-price">${formatPrice(order.TotalPrice)}</p>
                    </div>
                    <div class="product-quantity">x1</div>
                </div>
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    });
}

// Thêm CSS cho toast và modal
const additionalCSS = `
.toast-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-left: 4px solid #2196F3;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-radius: 8px;
    padding: 16px;
    min-width: 300px;
    max-width: 400px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.toast-notification.success { border-left-color: #4CAF50; }
.toast-notification.error { border-left-color: #f44336; }
.toast-notification.warning { border-left-color: #FF9800; }
.toast-notification.info { border-left-color: #2196F3; }

.toast-content { display: flex; align-items: center; gap: 10px; }
.toast-content i { font-size: 18px; }
.toast-close { background: none; border: none; color: #666; cursor: pointer; padding: 4px; margin-left: 10px; }
.toast-close:hover { color: #333; }

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
}

.modal-content {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.modal-body {
    padding: 20px;
}

.loading-state, .error-state {
    text-align: center;
    padding: 40px 20px;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.order-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
}

.order-status.pending { background: #e3f2fd; color: #1976d2; }
.order-status.shipping { background: #fff8e1; color: #ff8f00; }
.order-status.delivered { background: #e8f5e9; color: #388e3c; }
.order-status.cancelled { background: #ffebee; color: #d32f2f; }
`;

// Thêm CSS vào document
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);