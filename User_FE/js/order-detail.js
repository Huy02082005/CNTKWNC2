// order-detail.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Chi tiết đơn hàng loaded');
    
    // Lấy orderId từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (!orderId) {
        showError('Không tìm thấy mã đơn hàng');
        return;
    }
    
    // Kiểm tra đăng nhập
    checkLogin();
    
    // Load chi tiết đơn hàng
    loadOrderDetail();
    
    // Setup event listeners
    setupEventListeners();
    
    function checkLogin() {
        const customer = window.AuthSimple?.getCurrentUser();
        if (!customer) {
            window.location.href = `/html/login.html?redirect=order-detail&id=${orderId}`;
            return;
        }
    }
    
    function setupEventListeners() {
        // Nút in đơn hàng
        const printBtn = document.getElementById('printOrderBtn');
        if (printBtn) {
            printBtn.addEventListener('click', function() {
                window.print();
            });
        }
        
        // Nút hủy đơn hàng
        const cancelBtn = document.getElementById('cancelOrderBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                cancelOrder(orderId);
            });
        }
    }
    
    async function loadOrderDetail() {
        try {
            showLoading(true);
            
            // Lấy thông tin đơn hàng từ API
            const response = await fetch(`/api/order/${orderId}`);
            
            if (!response.ok) {
                throw new Error(`Lỗi server: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.order) {
                renderOrderDetail(data.order);
            } else {
                throw new Error(data.message || 'Không thể tải thông tin đơn hàng');
            }
            
        } catch (error) {
            console.error('❌ Lỗi khi tải chi tiết đơn hàng:', error);
            showError(error.message || 'Không thể kết nối đến server');
        } finally {
            showLoading(false);
        }
    }
    
    function renderOrderDetail(order) {
        // Hiển thị container
        document.getElementById('orderDetailContainer').style.display = 'block';
        
        // Cập nhật thông tin cơ bản
        document.getElementById('orderNumber').textContent = `Đơn hàng #${String(order.OrderID).padStart(8, '0')}`;
        document.getElementById('orderIdDisplay').textContent = `#${String(order.OrderID).padStart(8, '0')}`;
        
        // Định dạng ngày tháng
        const orderDate = order.OrderDate ? new Date(order.OrderDate) : new Date();
        const formattedDate = orderDate.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('orderDate').textContent = formattedDate;
        document.getElementById('orderDateTimeline').textContent = formattedDate;
        
        // Trạng thái đơn hàng
        const statusInfo = getStatusInfo(order.Status);
        document.getElementById('orderStatusText').textContent = `Trạng thái: ${statusInfo.text}`;
        document.getElementById('orderStatusBadge').textContent = statusInfo.text;
        document.getElementById('orderStatusBadge').className = `order-status-badge ${statusInfo.class}`;
        
        // Thông tin thanh toán và giao hàng
        document.getElementById('paymentMethod').textContent = order.PaymentMethod || 'Thanh toán khi nhận hàng (COD)';
        document.getElementById('shippingFee').textContent = formatPrice(order.ShippingFee || 0);
        document.getElementById('discountAmount').textContent = formatPrice(order.DiscountAmount || 0);
        document.getElementById('totalPrice').textContent = formatPrice(order.TotalPrice || 0);
        
        // Thông tin giao hàng
        if (order.ShippingAddress) {
            document.getElementById('shippingAddress').textContent = order.ShippingAddress;
        }
        
        // Thông tin khách hàng
        const customerInfo = [];
        if (order.FullName) customerInfo.push(order.FullName);
        if (order.Email) customerInfo.push(order.Email);
        if (order.Phone) customerInfo.push(order.Phone);
        
        document.getElementById('customerInfo').textContent = customerInfo.join(' | ');
        
        // Hiển thị danh sách sản phẩm
        renderOrderItems(order.Items || []);
        
        // Tính toán tổng tiền
        calculateOrderSummary(order);
        
        // Hiển thị/ẩn các nút hành động dựa trên trạng thái
        setupActionButtons(order.Status, orderId);
        
        // Hiển thị timeline
        renderOrderTimeline(order);
    }
    
    function renderOrderItems(items) {
        const itemsList = document.getElementById('orderItemsList');
        
        if (!items || items.length === 0) {
            itemsList.innerHTML = `
                <div class="empty-items">
                    <i class="fas fa-box-open"></i>
                    <p>Không có sản phẩm nào trong đơn hàng</p>
                </div>
            `;
            return;
        }
        
        itemsList.innerHTML = '';
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';
            
            const itemPrice = item.Price || 0;
            const itemTotal = itemPrice * (item.Quantity || 1);
            
            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${item.ImageURL || '/images/default-product.jpg'}" 
                         alt="${item.ProductName}" 
                         onclick="viewProductDetail(${item.ProductID})"
                         style="cursor: pointer;">
                </div>
                <div class="item-info">
                    <h4 class="item-name" onclick="viewProductDetail(${item.ProductID})" style="cursor: pointer;">
                        ${item.ProductName || 'Sản phẩm không tên'}
                    </h4>
                    <div class="item-meta">
                        ${item.BrandName ? `<span class="item-brand">${item.BrandName}</span>` : ''}
                        ${item.LeagueName ? `<span class="item-league">${item.LeagueName}</span>` : ''}
                    </div>
                    <div class="item-price-info">
                        <span class="item-price">${formatPrice(itemPrice)}</span>
                        <span class="item-quantity">× ${item.Quantity || 1}</span>
                        <span class="item-total">${formatPrice(itemTotal)}</span>
                    </div>
                </div>
            `;
            
            itemsList.appendChild(itemElement);
        });
    }
    
    function calculateOrderSummary(order) {
        // Tính tổng tiền sản phẩm
        let subtotal = 0;
        if (order.Items && order.Items.length > 0) {
            subtotal = order.Items.reduce((sum, item) => {
                const itemPrice = item.Price || 0;
                const itemQuantity = item.Quantity || 1;
                return sum + (itemPrice * itemQuantity);
            }, 0);
        }
        
        const shippingFee = order.ShippingFee || 0;
        const discount = order.DiscountAmount || 0;
        const grandTotal = subtotal + shippingFee - discount;
        
        // Cập nhật UI
        document.getElementById('subtotal').textContent = formatPrice(subtotal);
        document.getElementById('shippingFeeDisplay').textContent = formatPrice(shippingFee);
        document.getElementById('discountDisplay').textContent = formatPrice(discount);
        document.getElementById('grandTotal').textContent = formatPrice(grandTotal);
    }
    
    function setupActionButtons(status, orderId) {
        const cancelBtn = document.getElementById('cancelOrderBtn');
        
        // Hiển thị nút hủy đơn chỉ khi ở trạng thái pending
        if (cancelBtn) {
            if (status === 'pending') {
                cancelBtn.style.display = 'inline-block';
                cancelBtn.onclick = function() {
                    cancelOrder(orderId);
                };
            } else {
                cancelBtn.style.display = 'none';
            }
        }
    }
    
    function renderOrderTimeline(order) {
        const timeline = document.getElementById('orderTimeline');
        
        // Tạo các mốc thời gian dựa trên trạng thái
        const timelineSteps = [
            { status: 'pending', text: 'Đơn hàng đã đặt', icon: 'fa-shopping-cart' },
            { status: 'paid', text: 'Đã thanh toán', icon: 'fa-credit-card' },
            { status: 'shipping', text: 'Đang giao hàng', icon: 'fa-truck' },
            { status: 'completed', text: 'Đã giao hàng', icon: 'fa-check-circle' },
            { status: 'cancelled', text: 'Đã hủy', icon: 'fa-times-circle' }
        ];
        
        // Tìm chỉ số của trạng thái hiện tại
        const currentStatusIndex = timelineSteps.findIndex(step => step.status === order.Status);
        
        // Xóa các mốc cũ (giữ lại mốc đầu tiên)
        while (timeline.children.length > 1) {
            timeline.removeChild(timeline.lastChild);
        }
        
        // Thêm các mốc thời gian
        for (let i = 1; i < timelineSteps.length; i++) {
            const step = timelineSteps[i];
            const isActive = i <= currentStatusIndex;
            const isCurrent = i === currentStatusIndex;
            
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            
            if (isCurrent) {
                timelineItem.classList.add('current');
            }
            
            timelineItem.innerHTML = `
                <div class="timeline-dot ${isActive ? 'active' : ''}">
                    <i class="fas ${step.icon}"></i>
                </div>
                <div class="timeline-content">
                    <h4>${step.text}</h4>
                    ${isActive ? `<p>${getTimelineDate(order, step.status)}</p>` : ''}
                </div>
            `;
            
            timeline.appendChild(timelineItem);
        }
    }
    
    function getTimelineDate(order, status) {
        // Trả về ngày tháng tương ứng với trạng thái
        // Đây chỉ là ví dụ, bạn cần lấy từ database
        const now = new Date();
        return now.toLocaleDateString('vi-VN');
    }
    
    function showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const detailContainer = document.getElementById('orderDetailContainer');
        const errorState = document.getElementById('errorState');
        
        if (show) {
            loadingState.style.display = 'block';
            detailContainer.style.display = 'none';
            errorState.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
        }
    }
    
    function showError(message) {
        const loadingState = document.getElementById('loadingState');
        const detailContainer = document.getElementById('orderDetailContainer');
        const errorState = document.getElementById('errorState');
        
        loadingState.style.display = 'none';
        detailContainer.style.display = 'none';
        errorState.style.display = 'block';
        
        document.getElementById('errorMessage').textContent = message;
    }
    
    // Định nghĩa các hàm toàn cục cần thiết
    window.loadOrderDetail = loadOrderDetail;
});

// ========== CÁC HÀM TOÀN CỤC ==========

function formatPrice(price) {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
}

function getStatusInfo(status) {
    const statusMap = {
        'pending': { text: 'Chờ xác nhận', class: 'pending', icon: 'fa-clock' },
        'paid': { text: 'Đã thanh toán', class: 'paid', icon: 'fa-credit-card' },
        'shipping': { text: 'Đang giao hàng', class: 'shipping', icon: 'fa-truck' },
        'completed': { text: 'Đã giao hàng', class: 'delivered', icon: 'fa-check-circle' },
        'cancelled': { text: 'Đã hủy', class: 'cancelled', icon: 'fa-times-circle' }
    };
    
    return statusMap[status] || { text: status, class: 'pending', icon: 'fa-question-circle' };
}

// ========== HÀM XEM CHI TIẾT SẢN PHẨM ==========
function viewProductDetail(productId) {
    window.location.href = `/html/product-detail.html?id=${productId}`;
}

// ========== HÀM HỦY ĐƠN HÀNG ==========
async function cancelOrder(orderId) {
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${String(orderId).padStart(8, '0')}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/order/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert('✅ Đã hủy đơn hàng thành công!');
            // Tải lại trang để cập nhật trạng thái
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            alert('❌ Không thể hủy đơn hàng: ' + (result.message || 'Lỗi không xác định'));
        }
        
    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
        alert('❌ Không thể kết nối đến server');
    }
}