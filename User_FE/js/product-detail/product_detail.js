// ========== UTILITY FUNCTIONS ==========

// Hàm debounce để tránh gọi hàm nhiều lần
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price);
}

// ========== IMAGE HANDLING ==========

// Thay đổi ảnh chính khi click thumbnail
function changeImage(src, clickedElement) {
    document.getElementById('main-img').src = src;
    // Remove active class from all thumbnails
    document.querySelectorAll('.thumbnail').forEach(img => {
        img.classList.remove('active');
    });
    // Add active class to clicked thumbnail
    clickedElement.classList.add('active');
}

// ========== QUANTITY HANDLING ==========

// Xử lý số lượng
function initializeQuantityControls() {
    const minusBtn = document.querySelector('.minus');
    const plusBtn = document.querySelector('.plus');
    const quantityInput = document.getElementById('quantity');
    
    if (minusBtn) {
        minusBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            if (currentValue > parseInt(quantityInput.min || 1)) {
                quantityInput.value = currentValue - 1;
            }
        });
    }
    
    if (plusBtn) {
        plusBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantityInput.value);
            const max = parseInt(quantityInput.max) || 999;
            if (currentValue < max) {
                quantityInput.value = currentValue + 1;
            }
        });
    }
    
    // Validate input
    if (quantityInput) {
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            const min = parseInt(this.min) || 1;
            const max = parseInt(this.max) || 999;
            
            if (isNaN(value) || value < min) {
                this.value = min;
            } else if (value > max) {
                this.value = max;
            }
        });
    }
}

// ========== TAB HANDLING ==========

// Tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const tabName = this.getAttribute('data-tab');
            openTab(tabName, e);
        });
    });
}

function openTab(tabName, event) {
    // Prevent default if it's a click event
    if (event) {
        event.preventDefault();
    }
    
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// ========== CART AND CHECKOUT ==========

// Thêm vào giỏ hàng (cần kiểm tra login)
function addToCart(productId) {
    const size = document.querySelector('input[name="size"]:checked');
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    // Kiểm tra có size options không
    const sizeSection = document.querySelector('.size-selection');
    const hasSizeOptions = sizeSection && sizeSection.style.display !== 'none';
    
    if (!size && hasSizeOptions) {
        alert('Vui lòng chọn size!');
        return;
    }
    
    if (quantity <= 0) {
        alert('Số lượng không hợp lệ!');
        return;
    }
    
    // Disable button temporarily to prevent multiple clicks
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.disabled = true;
    addToCartBtn.innerHTML = '<i class="cart-icon">🛒</i> Đang thêm...';
    
    fetch('/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            sizeId: size ? size.value : null,
            quantity: quantity
        }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.requireLogin) {
            // Hiển thị modal đăng nhập
            showLoginModal();
        } else if (data.success) {
            showSuccessMessage('Đã thêm vào giỏ hàng!');
            updateCartCount(data.cartCount);
        } else {
            alert('Lỗi: ' + (data.message || 'Không thể thêm vào giỏ hàng'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại!');
    })
    .finally(() => {
        // Re-enable button
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = originalText;
    });
}

// Mua ngay
function buyNow(productId) {
    const size = document.querySelector('input[name="size"]:checked');
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
    
    // Kiểm tra có size options không
    const sizeSection = document.querySelector('.size-selection');
    const hasSizeOptions = sizeSection && sizeSection.style.display !== 'none';
    
    if (!size && hasSizeOptions) {
        alert('Vui lòng chọn size!');
        return;
    }
    
    if (quantity <= 0) {
        alert('Số lượng không hợp lệ!');
        return;
    }
    
    // Disable button temporarily
    const buyNowBtn = document.getElementById('buy-now-btn');
    const originalText = buyNowBtn.innerHTML;
    buyNowBtn.disabled = true;
    buyNowBtn.innerHTML = 'Đang xử lý...';
    
    // Build checkout URL
    const params = new URLSearchParams();
    params.append('product', productId);
    params.append('qty', quantity);
    if (size) params.append('size', size.value);
    
    // Use setTimeout to prevent navigation flooding
    setTimeout(() => {
        window.location.href = `/checkout?${params.toString()}`;
    }, 100);
}

// Cập nhật số lượng giỏ hàng
function updateCartCount(count) {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'block' : 'none';
    }
}

// ========== FAVORITES ==========

// Yêu thích
function toggleFavorite(productId, event) {
    const btn = event ? event.target.closest('.btn-favorite') : document.getElementById('favorite-btn');
    
    if (!btn) return;
    
    // Toggle visual state immediately for better UX
    const isCurrentlyFavorited = btn.classList.contains('favorited');
    if (isCurrentlyFavorited) {
        btn.classList.remove('favorited');
        btn.innerHTML = '<i class="heart-icon">🤍</i> Yêu thích';
    } else {
        btn.classList.add('favorited');
        btn.innerHTML = '<i class="heart-icon">❤️</i> Đã yêu thích';
    }
    
    // Send request
    fetch('/favorites/toggle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: productId }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            // Revert visual state if request failed
            if (data.isFavorite) {
                btn.classList.add('favorited');
                btn.innerHTML = '<i class="heart-icon">❤️</i> Đã yêu thích';
            } else {
                btn.classList.remove('favorited');
                btn.innerHTML = '<i class="heart-icon">🤍</i> Yêu thích';
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        // Revert visual state
        if (isCurrentlyFavorited) {
            btn.classList.add('favorited');
            btn.innerHTML = '<i class="heart-icon">❤️</i> Đã yêu thích';
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '<i class="heart-icon">🤍</i> Yêu thích';
        }
    });
}

// ========== MODAL HANDLING ==========

// Modal đăng nhập
function showLoginModal() {
    // Tạo modal nếu chưa có
    let modal = document.getElementById('loginModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Đăng nhập để tiếp tục</h2>
                <p>Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.</p>
                <div class="login-options">
                    <button id="modal-login-btn" class="btn-login">Đăng nhập ngay</button>
                    <button id="modal-continue-btn" class="btn-continue">Tiếp tục mua sắm</button>
                </div>
                <div class="register-link">
                    Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Thêm sự kiện đóng modal
        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
        
        // Add event listeners to modal buttons
        document.getElementById('modal-login-btn').addEventListener('click', redirectToLogin);
        document.getElementById('modal-continue-btn').addEventListener('click', closeModal);
    }
    
    // Hiển thị modal
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function redirectToLogin() {
    // Lưu trang hiện tại để quay lại sau khi đăng nhập
    const currentUrl = window.location.href;
    localStorage.setItem('redirectAfterLogin', currentUrl);
    
    // Chuyển đến trang đăng nhập
    window.location.href = '/login';
}

// ========== NOTIFICATIONS ==========

// Hiển thị thông báo thành công
function showSuccessMessage(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.success-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Tạo toast notification
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function showErrorMessage(message) {
    const container = document.querySelector('.product-detail-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-container">
            <div style="font-size: 48px; color: #ccc; margin-bottom: 20px;">⚠️</div>
            <h2>Đã xảy ra lỗi</h2>
            <p>${message}</p>
            <button onclick="reloadPage()" class="error-btn retry">Thử lại</button>
            <button onclick="goToHomePage()" class="error-btn home">Trang chủ</button>
        </div>
    `;
}

function showNotFoundMessage() {
    const container = document.querySelector('.product-detail-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="not-found-container">
            <div style="font-size: 48px; color: #ccc; margin-bottom: 20px;">😕</div>
            <h2>Không tìm thấy sản phẩm</h2>
            <p>Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <button onclick="goToHomePage()" class="not-found-btn">Quay về trang chủ</button>
        </div>
    `;
}

// ========== QUICK ADD TO CART (for related products) ==========

// Thêm nhanh vào giỏ hàng (cho trang danh sách)
function quickAddToCart(productId) {
    fetch('/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            productId: productId,
            quantity: 1
        }),
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.requireLogin) {
            showLoginModal();
        } else if (data.success) {
            showSuccessMessage('Đã thêm vào giỏ hàng!');
            updateCartCount(data.cartCount);
        } else {
            alert('Lỗi: ' + (data.message || 'Không thể thêm vào giỏ hàng'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại!');
    });
}

// ========== PRODUCT DATA LOADING ==========

// Lấy product ID từ URL
function getProductIdFromUrl() {
    // Lấy pathname từ URL
    const path = window.location.pathname;
    
    console.log('Current path:', path); // Debug log
    
    // Kiểm tra nhiều pattern URL khác nhau:
    
    // Pattern 1: /product/{id}
    let matches = path.match(/\/product\/(\d+)/);
    if (matches) {
        console.log('Found product ID (pattern 1):', matches[1]); // Debug
        return matches[1];
    }
    
    // Pattern 2: /product-detail.html?id={id} (query string)
    if (path.includes('product-detail.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        console.log('Found product ID (pattern 2):', id); // Debug
        return id;
    }
    
    // Pattern 3: /product/{id}.html
    matches = path.match(/\/product\/(\d+)\.html/);
    if (matches) {
        console.log('Found product ID (pattern 3):', matches[1]); // Debug
        return matches[1];
    }
    
    // Pattern 4: Lấy từ hash fragment
    const hash = window.location.hash;
    if (hash) {
        matches = hash.match(/product\/(\d+)/);
        if (matches) {
            console.log('Found product ID (pattern 4):', matches[1]); // Debug
            return matches[1];
        }
    }
    
    console.log('No product ID found in URL'); // Debug
    return null;
}

// Hàm debounce cho related products
let relatedProductsTimeout;
function debounceLoadRelatedProducts(productId, categoryId, leagueId) {
    clearTimeout(relatedProductsTimeout);
    relatedProductsTimeout = setTimeout(() => {
        loadRelatedProducts(productId, categoryId, leagueId);
    }, 500);
}

// Load product data
async function loadProductData() {
    const productId = getProductIdFromUrl();
    
    console.log('Product ID from URL:', productId); // Debug
    
    if (!productId || isNaN(productId)) {
        showErrorMessage('Không tìm thấy mã sản phẩm trong URL');
        return;
    }

    try {
        // Show loading state
        showLoadingState();
        
        // Thử nhiều endpoint API khác nhau
        let apiEndpoints = [
            `/api/products/${productId}`,
            `/api/product-detail/${productId}`,
            `/api/product/${productId}`,
            `/product/api/${productId}`
        ];
        
        let response = null;
        let data = null;
        
        // Thử từng endpoint cho đến khi thành công
        for (let endpoint of apiEndpoints) {
            try {
                console.log('Trying API endpoint:', endpoint); // Debug
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                response = await fetch(endpoint, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    data = await response.json();
                    console.log('API response:', data); // Debug
                    
                    // Kiểm tra cấu trúc response
                    if (data.product || data.success) {
                        break; // Thành công, thoát khỏi vòng lặp
                    }
                }
            } catch (error) {
                console.log(`Endpoint ${endpoint} failed:`, error.message); // Debug
                continue; // Thử endpoint tiếp theo
            }
        }
        
        if (!response || !response.ok) {
            throw new Error('Không thể kết nối đến server');
        }
        
        if (!data) {
            throw new Error('Dữ liệu sản phẩm trống');
        }
        
        // Xử lý các cấu trúc response khác nhau
        let productData = null;
        
        if (data.product) {
            // Cấu trúc: { product: {...}, sizes: [...], relatedProducts: [...] }
            productData = data.product;
            productData.sizes = data.sizes || [];
            productData.relatedProducts = data.relatedProducts || [];
        } else if (data.success && data.product) {
            // Cấu trúc: { success: true, product: {...} }
            productData = data.product;
        } else if (Array.isArray(data) && data.length > 0) {
            // Cấu trúc: [{...}] (array trực tiếp)
            productData = data[0];
        } else {
            // Cấu trúc trực tiếp
            productData = data;
        }
        
        // Đảm bảo có các trường cần thiết
        if (!productData.productID && productData.id) {
            productData.productID = productData.id;
        }
        if (!productData.productName && productData.name) {
            productData.productName = productData.name;
        }
        if (!productData.imageURL && productData.image) {
            productData.imageURL = productData.image;
        }
        if (!productData.sellingPrice && productData.price) {
            productData.sellingPrice = productData.price;
        }
        
        // Kiểm tra dữ liệu tối thiểu
        if (!productData.productID || !productData.productName) {
            throw new Error('Dữ liệu sản phẩm không đầy đủ');
        }
        
        populateProductData(productData);
        
        // Load related products nếu có
        if (productData.categoryID && productData.leagueID) {
            debounceLoadRelatedProducts(productData.productID, productData.categoryID, productData.leagueID);
        }
        
    } catch (error) {
        console.error('Error loading product:', error);
        
        if (error.name === 'AbortError') {
            showErrorMessage('Tải sản phẩm quá lâu, vui lòng thử lại');
        } else if (error.message.includes('404') || error.message.includes('not found')) {
            showNotFoundMessage();
        } else {
            showErrorMessage(`Không thể tải thông tin sản phẩm: ${error.message}`);
        }
    }
}

function showLoadingState() {
    const container = document.querySelector('.product-detail-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Đang tải sản phẩm...</p>
        </div>
    `;
}

// Điền dữ liệu sản phẩm vào HTML
function populateProductData(product) {
    // Cập nhật tiêu đề
    document.title = `${product.productName} - Football Store`;
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = `${product.productName} - Football Store`;
    
    document.getElementById('product-title').textContent = product.productName;
    document.getElementById('product-name').textContent = product.productName;
    
    // Cập nhật hình ảnh
    const mainImg = document.getElementById('main-img');
    const detailImg = document.getElementById('detail-img');
    
    if (mainImg) {
        mainImg.src = product.imageURL;
        mainImg.alt = product.productName;
    }
    
    if (detailImg) {
        detailImg.src = product.imageURL;
        detailImg.alt = product.productName;
    }
    
    // Cập nhật giá
    const priceContainer = document.getElementById('price-container');
    if (priceContainer) {
        if (product.discount > 0) {
            const discountedPrice = product.sellingPrice - (product.sellingPrice * product.discount / 100);
            priceContainer.innerHTML = `
                <span class="current-price">${formatPrice(discountedPrice)}₫</span>
                <span class="original-price">${formatPrice(product.sellingPrice)}₫</span>
                <span class="discount-badge">-${product.discount}%</span>
            `;
        } else {
            priceContainer.innerHTML = `
                <span class="current-price">${formatPrice(product.sellingPrice)}₫</span>
            `;
        }
    }
    
    // Cập nhật meta
    const categoryLink = document.getElementById('category-link');
    const brandLink = document.getElementById('brand-link');
    const leagueLink = document.getElementById('league-link');
    
    if (categoryLink) {
        categoryLink.href = `/category/${product.categoryID}`;
        categoryLink.textContent = product.categoryName || 'Danh mục';
    }
    
    if (brandLink) {
        brandLink.href = `/brand/${product.brandID}`;
        brandLink.textContent = product.brandName || 'Thương hiệu';
    }
    
    if (leagueLink) {
        leagueLink.href = `/league/${product.leagueID}`;
        leagueLink.textContent = product.leagueName || 'Giải đấu';
    }
    
    // Tình trạng kho
    const stockStatus = document.getElementById('stock-status');
    if (stockStatus) {
        if (product.stockQuantity > 0) {
            stockStatus.textContent = `Còn hàng (${product.stockQuantity})`;
            stockStatus.className = 'stock-status in-stock';
        } else {
            stockStatus.textContent = 'Hết hàng';
            stockStatus.className = 'stock-status out-stock';
        }
    }
    
    // Mã sản phẩm
    const productCode = document.getElementById('product-code');
    if (productCode) {
        productCode.textContent = `SP${product.productID.toString().padStart(6, '0')}`;
    }
    
    // Mô tả
    const description = document.getElementById('product-description');
    if (description) {
        description.textContent = product.description || '';
    }
    
    // Thông số kỹ thuật
    const specCategory = document.getElementById('spec-category');
    const specBrand = document.getElementById('spec-brand');
    const specLeague = document.getElementById('spec-league');
    const specSeason = document.getElementById('spec-season');
    const specPlayer = document.getElementById('spec-player');
    
    if (specCategory) specCategory.textContent = product.categoryName || '';
    if (specBrand) specBrand.textContent = product.brandName || '';
    if (specLeague) specLeague.textContent = product.leagueName || '';
    if (specSeason) specSeason.textContent = product.season || '';
    if (specPlayer) specPlayer.textContent = product.playerName || 'Không áp dụng';
    
    // Cập nhật số lượng tối đa
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        quantityInput.max = product.stockQuantity;
        quantityInput.value = Math.min(parseInt(quantityInput.value) || 1, product.stockQuantity);
    }
    
    // Disable nút nếu hết hàng
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    
    if (product.stockQuantity <= 0) {
        if (addToCartBtn) addToCartBtn.disabled = true;
        if (buyNowBtn) buyNowBtn.disabled = true;
    } else {
        if (addToCartBtn) addToCartBtn.disabled = false;
        if (buyNowBtn) buyNowBtn.disabled = false;
    }
    
    // Thêm thumbnail
    const thumbnailContainer = document.querySelector('.thumbnail-images');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        
        // Create thumbnail for main image
        const thumbnail = document.createElement('img');
        thumbnail.src = product.imageURL;
        thumbnail.className = 'thumbnail active';
        thumbnail.alt = product.productName;
        thumbnail.addEventListener('click', function() {
            changeImage(this.src, this);
        });
        thumbnailContainer.appendChild(thumbnail);
        
        // Add additional thumbnails if available
        if (product.additionalImages && product.additionalImages.length > 0) {
            product.additionalImages.forEach(imgUrl => {
                const thumb = document.createElement('img');
                thumb.src = imgUrl;
                thumb.className = 'thumbnail';
                thumb.alt = product.productName;
                thumb.addEventListener('click', function() {
                    changeImage(this.src, this);
                });
                thumbnailContainer.appendChild(thumb);
            });
        }
    }
    
    // Setup event listeners
    setupEventListeners(product.productID);
    
    // Load sizes nếu có
    if (product.sizes && product.sizes.length > 0) {
        loadSizes(product.productID, product.sizes);
    }
}

function setupEventListeners(productId) {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', debounce(() => {
            addToCart(productId);
        }, 300));
    }
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', debounce(() => {
            buyNow(productId);
        }, 300));
    }
    
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function(e) {
            toggleFavorite(productId, e);
        });
    }
}

// Load sizes
async function loadSizes(productId, sizes) {
    const sizeSection = document.getElementById('size-section');
    const sizeOptions = document.getElementById('size-options');
    
    if (!sizeSection || !sizeOptions) return;
    
    if (sizes.length > 0) {
        sizeSection.style.display = 'block';
        sizeOptions.innerHTML = '';
        
        sizes.forEach(size => {
            const sizeLabel = document.createElement('label');
            sizeLabel.className = 'size-option';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'size';
            input.value = size.sizeID;
            if (size.stockQuantity <= 0) input.disabled = true;
            
            const span = document.createElement('span');
            span.className = `size-label ${size.stockQuantity <= 0 ? 'disabled' : ''}`;
            span.textContent = size.sizeName;
            
            if (size.stockQuantity <= 0) {
                const outSpan = document.createElement('span');
                outSpan.className = 'size-out';
                outSpan.textContent = 'Hết';
                span.appendChild(outSpan);
            }
            
            sizeLabel.appendChild(input);
            sizeLabel.appendChild(span);
            sizeOptions.appendChild(sizeLabel);
            
            // Add click event to label
            if (size.stockQuantity > 0) {
                span.addEventListener('click', function() {
                    input.checked = true;
                    // Trigger change event
                    input.dispatchEvent(new Event('change'));
                });
            }
        });
        
        // Select first available size by default
        const firstAvailable = sizeOptions.querySelector('input:not(:disabled)');
        if (firstAvailable) {
            firstAvailable.checked = true;
        }
    }
}

// Load related products
async function loadRelatedProducts(productId, categoryId, leagueId) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`/api/products/related/${productId}?category=${categoryId}&league=${leagueId}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const relatedProducts = await response.json();
            if (relatedProducts.length > 0) {
                displayRelatedProducts(relatedProducts);
            }
        }
    } catch (error) {
        console.error('Error loading related products:', error);
        // Silently fail for related products
    }
}

// Hiển thị sản phẩm liên quan
function displayRelatedProducts(products) {
    const relatedSection = document.getElementById('related-section');
    const relatedContainer = document.getElementById('related-products');
    
    if (!relatedSection || !relatedContainer) return;
    
    relatedSection.style.display = 'block';
    relatedContainer.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Calculate discounted price
        const currentPrice = product.discount > 0 
            ? product.sellingPrice - (product.sellingPrice * product.discount / 100)
            : product.sellingPrice;
        
        productCard.innerHTML = `
            <a href="/product/${product.productID}">
                <img src="${product.imageURL || '/images/default-product.jpg'}" alt="${product.productName}" loading="lazy">
                <h3>${product.productName}</h3>
                <div class="price">
                    <span class="current">${formatPrice(currentPrice)}₫</span>
                    ${product.discount > 0 ? `<span class="discount">-${product.discount}%</span>` : ''}
                </div>
            </a>
            <button class="quick-add" onclick="quickAddToCart('${product.productID}')">
                + Thêm nhanh
            </button>
        `;
        
        relatedContainer.appendChild(productCard);
    });
}

// ========== HELPER FUNCTIONS ==========

function goToHomePage() {
    window.location.href = '/';
}

function reloadPage() {
    window.location.reload();
}

// ========== INITIALIZATION ==========

// Khởi tạo khi trang load xong
document.addEventListener('DOMContentLoaded', function() {
    console.log('Product detail page loaded');
    
    // Kiểm tra nếu có debug mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
        debugProductPage();
    }
    
    // Initialize quantity controls
    initializeQuantityControls();
    
    // Initialize tabs
    initializeTabs();
    
    // Load product data
    loadProductData();
});

// Export các hàm cần thiết ra global scope
window.changeImage = changeImage;
window.openTab = openTab;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.toggleFavorite = toggleFavorite;
window.quickAddToCart = quickAddToCart;
window.redirectToLogin = redirectToLogin;
window.closeModal = closeModal;
window.reloadPage = reloadPage;
window.goToHomePage = goToHomePage;