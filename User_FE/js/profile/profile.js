// profile.js - Version với debug tốt hơn
document.addEventListener('DOMContentLoaded', function() {
    // Biến lưu thông tin gốc
    let originalData = {};
    let hasChanges = false;
    let currentCustomerId = null;
    
    // Khởi tạo
    initProfile();
    
    async function initProfile() {
        console.log('🔍 Initializing profile page...');
        
        // Kiểm tra đăng nhập
        const userInfo = getCustomerInfo();
        console.log('User info from cookie:', userInfo);
        
        if (!userInfo || !userInfo.id) {
            alert('Vui lòng đăng nhập để xem hồ sơ');
            window.location.href = '/html/login.html';
            return;
        }
        
        currentCustomerId = userInfo.id;
        console.log('Customer ID:', currentCustomerId);
        
        await loadUserData();
        setupFormListeners();
        setupModalEvents();
    }
    
    // Lấy thông tin user từ cookie
    function getCustomerInfo() {
        try {
            const cookie = document.cookie
                .split('; ')
                .find(row => row.startsWith('customer_data='));
            
            if (cookie) {
                const cookieValue = cookie.split('=')[1];
                return JSON.parse(decodeURIComponent(cookieValue));
            }
        } catch (error) {
            console.error('Error reading cookie:', error);
        }
        return null;
    }
    
    // Tải thông tin user từ DB - Version đơn giản hơn
    async function loadUserData() {
        try {
            console.log(`📡 Loading user data for ID: ${currentCustomerId}`);
            
            const response = await fetch(`/api/customer/profile/${currentCustomerId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success && data.customer) {
                console.log('✅ User data loaded successfully');
                populateForm(data.customer);
                originalData = { ...data.customer };
            } else {
                console.log('❌ API returned error:', data.message);
                // Fallback: sử dụng cookie data
                fallbackToCookieData();
            }
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
            // Fallback: sử dụng cookie data
            fallbackToCookieData();
        }
    }
    
    // Fallback: sử dụng dữ liệu từ cookie
    function fallbackToCookieData() {
        console.log('🔄 Falling back to cookie data');
        const userInfo = getCustomerInfo();
        
        if (userInfo) {
            const fallbackData = {
                FullName: userInfo.name || '',
                Email: userInfo.email || '',
                Phone: userInfo.phone || '',
                Address: userInfo.address || '',
                CustomerID: userInfo.id || '-',
                Status: 1
            };
            
            populateForm(fallbackData);
            originalData = { ...fallbackData };
            
            // Hiển thị cảnh báo
            document.getElementById('customerId').innerHTML = 
                userInfo.id + ' <span style="color: orange; font-size: 12px;">(từ cookie)</span>';
            
            showWarning('Không thể kết nối server. Đang sử dụng thông tin từ cookie.');
        } else {
            showError('Không thể tải thông tin người dùng');
        }
    }
    
    // Điền dữ liệu vào form
    function populateForm(customer) {
        console.log('📝 Populating form with data:', customer);
        
        // Điền thông tin cơ bản
        document.getElementById('fullName').value = customer.FullName || '';
        document.getElementById('email').value = customer.Email || '';
        document.getElementById('phone').value = customer.Phone || '';
        document.getElementById('address').value = customer.Address || '';
        
        // Hiển thị thông tin khác
        document.getElementById('customerId').textContent = customer.CustomerID || '-';
        document.getElementById('registerDate').textContent = customer.RegisterDate ? 
            formatDate(customer.RegisterDate) : 'Chưa có';
        document.getElementById('lastLogin').textContent = customer.LastLogin ? 
            formatDate(customer.LastLogin) : 'Chưa có';
        document.getElementById('status').textContent = customer.Status === 1 ? 
            '<span style="color: green;">● Hoạt động</span>' : 
            '<span style="color: red;">● Bị khóa</span>';
    }
    
    // Format ngày tháng
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }
    
    // Setup listeners cho form
    function setupFormListeners() {
        const form = document.getElementById('profileForm');
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('input', checkForChanges);
        });
        
        // Nút lưu
        document.getElementById('saveBtn').addEventListener('click', showConfirmation);
        
        // Nút hủy
        document.getElementById('cancelBtn').addEventListener('click', resetForm);
        
        // Kiểm tra trước khi rời trang
        window.addEventListener('beforeunload', (e) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi?';
            }
        });
    }
    
    // Kiểm tra thay đổi
    function checkForChanges() {
        const currentData = getFormData();
        hasChanges = !isEqual(originalData, currentData);
        
        // Đổi trạng thái nút lưu
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.disabled = !hasChanges;
        saveBtn.style.opacity = hasChanges ? '1' : '0.7';
        
        console.log('Changes detected:', hasChanges);
    }
    
    // Lấy dữ liệu từ form
    function getFormData() {
        return {
            FullName: document.getElementById('fullName').value.trim(),
            Email: document.getElementById('email').value.trim(),
            Phone: document.getElementById('phone').value.trim(),
            Address: document.getElementById('address').value.trim()
        };
    }
    
    // So sánh 2 object
    function isEqual(obj1, obj2) {
        const keys = ['FullName', 'Email', 'Phone', 'Address'];
        
        for (let key of keys) {
            const val1 = obj1[key] || '';
            const val2 = obj2[key] || '';
            
            if (val1 !== val2) {
                return false;
            }
        }
        
        return true;
    }
    
    // Hiển thị modal xác nhận
    function showConfirmation() {
        if (!hasChanges) return;
        
        const currentData = getFormData();
        const changes = getChangesList(currentData);
        
        if (changes.length === 0) return;
        
        // Hiển thị thay đổi
        const changesList = document.getElementById('changesList');
        changesList.innerHTML = changes.map(change => `
            <div class="change-item">
                <span class="change-label">${change.label}:</span>
                <span class="change-old">${change.oldValue || '(trống)'}</span>
                <span class="change-arrow">→</span>
                <span class="change-new">${change.newValue || '(trống)'}</span>
            </div>
        `).join('');
        
        // Hiển thị modal
        const modal = document.getElementById('confirmModal');
        modal.style.display = 'flex';
        
        // Lưu currentData để dùng khi confirm
        modal.dataset.currentData = JSON.stringify(currentData);
    }
    
    // Lấy danh sách thay đổi
    function getChangesList(currentData) {
        const changes = [];
        const fieldLabels = {
            FullName: 'Họ và tên',
            Email: 'Email',
            Phone: 'Số điện thoại',
            Address: 'Địa chỉ'
        };
        
        for (let key in fieldLabels) {
            const oldValue = originalData[key] || '';
            const newValue = currentData[key] || '';
            
            if (oldValue !== newValue) {
                changes.push({
                    field: key,
                    label: fieldLabels[key],
                    oldValue: oldValue,
                    newValue: newValue
                });
            }
        }
        
        return changes;
    }
    
    // Setup events cho modal
    function setupModalEvents() {
        const modal = document.getElementById('confirmModal');
        const closeBtn = document.querySelector('.modal-close');
        
        // Đóng modal
        function closeModal() {
            modal.style.display = 'none';
        }
        
        // Có - Lưu thay đổi
        document.getElementById('confirmYes').addEventListener('click', async () => {
            const currentData = JSON.parse(modal.dataset.currentData || '{}');
            await saveChanges(currentData);
            closeModal();
        });
        
        // Không - Đóng modal
        document.getElementById('confirmNo').addEventListener('click', closeModal);
        
        // Đóng modal khi click X
        closeBtn.addEventListener('click', closeModal);
        
        // Đóng modal khi click ra ngoài
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Lưu thay đổi lên server - Version đơn giản
    async function saveChanges(currentData) {
        try {
            console.log('💾 Saving changes:', currentData);
            
            const response = await fetch(`/api/customer/update/${currentCustomerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(currentData),
                credentials: 'include'
            });
            
            console.log('Save response status:', response.status);
            
            const result = await response.json();
            console.log('Save response data:', result);
            
            if (result.success) {
                // Cập nhật thành công
                originalData = { ...originalData, ...currentData };
                hasChanges = false;
                
                // Cập nhật cookie
                updateCookie(currentData);
                
                // Cập nhật UI trên header
                if (window.AuthSimple && window.AuthSimple.updateUserUI) {
                    window.AuthSimple.updateUserUI();
                }
                
                // Vô hiệu hóa nút lưu
                document.getElementById('saveBtn').disabled = true;
                document.getElementById('saveBtn').style.opacity = '0.7';
                
                // Hiển thị thông báo
                showSuccess('Cập nhật thông tin thành công!');
                
            } else {
                throw new Error(result.message || 'Lỗi khi cập nhật');
            }
            
        } catch (error) {
            console.error('❌ Save error:', error);
            showError('Lỗi khi lưu thay đổi: ' + error.message);
        }
    }
    
    // Cập nhật cookie với thông tin mới
    function updateCookie(newData) {
        const userInfo = getCustomerInfo();
        const updatedInfo = {
            ...userInfo,
            name: newData.FullName,
            email: newData.Email,
            phone: newData.Phone,
            address: newData.Address
        };
        
        // Cập nhật cookie
        const cookieValue = encodeURIComponent(JSON.stringify(updatedInfo));
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `customer_data=${cookieValue}; expires=${expires}; path=/`;
    }
    
    // Reset form về trạng thái ban đầu
    function resetForm() {
        if (!hasChanges) return;
        
        if (confirm('Bạn có chắc muốn hủy các thay đổi?')) {
            populateForm(originalData);
            hasChanges = false;
            const saveBtn = document.getElementById('saveBtn');
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.7';
        }
    }
    
    // Hiển thị thông báo
    function showMessage(type, message) {
        // Tạo thông báo tạm thời
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        
        alertDiv.innerHTML = `
            ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌'} ${message}
        `;
        
        document.body.appendChild(alertDiv);
        
        // Tự động xóa sau 5 giây
        setTimeout(() => {
            alertDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 300);
        }, 5000);
        
        // Thêm animation CSS nếu chưa có
        if (!document.querySelector('#alert-animations')) {
            const style = document.createElement('style');
            style.id = 'alert-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    function showSuccess(message) {
        showMessage('success', message);
    }
    
    function showWarning(message) {
        showMessage('warning', message);
    }
    
    function showError(message) {
        showMessage('error', message);
    }
});