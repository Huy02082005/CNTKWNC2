// ========== SEARCH WITH PRODUCT DISPLAY ==========

document.addEventListener('DOMContentLoaded', function() {
    initSearch();
});

function initSearch() {
    const searchInput = document.querySelector('.search-box input[type="text"]');
    const searchButton = document.querySelector('.search-box button');
    
    if (!searchInput || !searchButton) {
        console.log('Search elements not found');
        return;
    }
    
    console.log('Initializing search...');
    
    // Search on button click
    searchButton.addEventListener('click', function() {
        console.log('Search button clicked');
        performSearch();
    });
    
    // Search on Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            console.log('Enter pressed');
            performSearch();
        }
    });
}

async function performSearch() {
    const searchInput = document.querySelector('.search-box input[type="text"]');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        alert('Vui lòng nhập từ khóa tìm kiếm');
        return;
    }
    
    if (searchTerm.length < 2) {
        alert('Vui lòng nhập ít nhất 2 ký tự');
        return;
    }
    
    console.log(`Searching for: "${searchTerm}"`);
    
    try {
        // Show loading
        showSearchLoading();
        
        // Call search API
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
            throw new Error(`Lỗi server: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Tìm kiếm không thành công');
        }
        
        // Format products for ProductDisplay
        const formattedProducts = formatProductsForDisplay(data.products);
        
        // Display using ProductDisplay
        displaySearchResults(formattedProducts, searchTerm);
        
    } catch (error) {
        console.error('Search error:', error);
        
        // Show error
        const container = document.querySelector('.product-grid') || document.querySelector('.content-area');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                    <div style="background: #fff5f5; border: 1px solid #fed7d7; border-radius: 10px; padding: 40px;">
                        <h3 style="color: #e53e3e;">Lỗi tìm kiếm</h3>
                        <p>${error.message}</p>
                        <button onclick="clearSearch()" style="padding: 10px 20px; background: #1a3e72; color: white; border: none; border-radius: 5px; margin-top: 10px;">
                            Xóa tìm kiếm
                        </button>
                    </div>
                </div>
            `;
        }
    }
}

// Format products for ProductDisplay component
// Trong file search.js, sửa function formatProductsForDisplay:
function formatProductsForDisplay(products) {
    if (!products || !Array.isArray(products)) return [];
    
    return products.map(product => {
        // Fix image path in multiple ways
        let imagePath = product.image || '';
        
        // Case 1: Has /html/image/ - remove /html/
        if (imagePath.includes('/html/image/')) {
            imagePath = imagePath.replace('/html/image/', '/image/');
        }
        // Case 2: Has /html/ but not /html/image/
        else if (imagePath.includes('/html/')) {
            imagePath = imagePath.replace('/html/', '/');
        }
        // Case 3: Starts with image/ (no leading slash)
        else if (imagePath.startsWith('image/')) {
            imagePath = '/' + imagePath;
        }
        // Case 4: Just a filename with extension
        else if (imagePath && !imagePath.startsWith('/') && 
                 (imagePath.includes('.jpg') || imagePath.includes('.png') || imagePath.includes('.jpeg'))) {
            // Try to determine category from product
            const category = product.category || '';
            let folder = 'products';
            
            if (category.toLowerCase().includes('ao') || category.toLowerCase().includes('quan')) {
                folder = 'clothes';
            } else if (category.toLowerCase().includes('giay')) {
                folder = 'shoes';
            } else if (category.toLowerCase().includes('gang tay')) {
                folder = 'gloves';
            } else if (category.toLowerCase().includes('phu kien')) {
                folder = 'accessories';
            }
            
            imagePath = `/image/${folder}/${imagePath}`;
        }
        // Case 5: Empty or invalid
        else if (!imagePath || imagePath.trim() === '') {
            imagePath = '/image/default-product.jpg';
        }
        
        return {
            id: product.id,
            name: product.name,
            price: product.price,
            discountedPrice: product.discountedPrice || product.price,
            discount: product.discount || 0,
            image: imagePath,
            category: product.category || '',
            brand: product.brand || '',
            league: product.league || '',
            stock: product.stock || 0,
            description: product.description || '',
            status: product.status || 'active'
        };
    });
}

function showSearchLoading() {
    const container = document.querySelector('.product-grid') || document.querySelector('.content-area');
    if (!container) return;
    
    container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
            <div style="display: inline-block; padding: 20px; background: #f5f5f5; border-radius: 10px;">
                <p>Đang tìm kiếm...</p>
                <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1a3e72; border-radius: 50%; animation: spin 1s linear infinite; margin: 10px auto;"></div>
            </div>
        </div>
    `;
}

function displaySearchResults(products, searchTerm) {
    const container = document.querySelector('.product-grid') || document.querySelector('.content-area');
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px;">
                <div style="background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 40px;">
                    <h3>Không tìm thấy sản phẩm</h3>
                    <p>Không có kết quả cho: <strong>${searchTerm}</strong></p>
                    <p style="color: #666; font-size: 14px;">Thử với từ khóa khác</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Clear container first
    container.innerHTML = '';
    
    // Add search results header
    const header = document.createElement('div');
    header.style.cssText = 'grid-column: 1 / -1; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;';
    header.innerHTML = `
        <h3>Tìm thấy ${products.length} sản phẩm cho: <span style="color: #1a3e72;">${searchTerm}</span></h3>
    `;
    container.appendChild(header);
    
    // Use ProductDisplay if available
    if (window.ProductDisplay && typeof window.ProductDisplay === 'function') {
        const display = new window.ProductDisplay({
            container: container,
            products: products,
            columns: 4,
            showQuickAdd: true,
            showDiscount: true,
            showStock: true,
            clickable: true
        });
        display.render();
    } else {
        // Fallback display
        console.warn('ProductDisplay not available, using fallback');
        products.forEach(product => {
            const productCard = createProductCard(product);
            container.appendChild(productCard);
        });
    }
    
    // Add clear search button
    const clearBtn = document.createElement('div');
    clearBtn.style.cssText = 'grid-column: 1 / -1; text-align: center; margin-top: 20px;';
    clearBtn.innerHTML = `
        <button onclick="clearSearch()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px;">
            Xóa tìm kiếm
        </button>
    `;
    container.appendChild(clearBtn);
}

// Fallback product card creation
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cssText = 'background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; text-align: center;';
    
    // Fix image path
    let imagePath = product.image;
    if (imagePath && imagePath.includes('/html/image/')) {
        imagePath = imagePath.replace('/html/image/', '/image/');
    } else if (imagePath && !imagePath.startsWith('/')) {
        imagePath = '/image/' + imagePath;
    } else if (!imagePath) {
        imagePath = '/image/default-product.jpg';
    }
    
    // Calculate discounted price
    const discountedPrice = product.discountedPrice || product.price;
    const hasDiscount = product.discount > 0;
    
    card.innerHTML = `
        <div class="image-holder" style="height: 200px; overflow: hidden; margin-bottom: 10px;">
            <img src="${imagePath}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <h3 style="margin: 10px 0; font-size: 16px; height: 40px; overflow: hidden;">${product.name}</h3>
        ${hasDiscount ? `
            <div style="margin: 10px 0;">
                <span style="text-decoration: line-through; color: #999; font-size: 14px;">
                    ${product.price.toLocaleString()}₫
                </span>
                <span style="background: #e53e3e; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; margin-left: 5px;">
                    -${product.discount}%
                </span>
            </div>
            <p class="price" style="color: #e53e3e; font-size: 18px; font-weight: bold; margin: 10px 0;">
                ${discountedPrice.toLocaleString()}₫
            </p>
        ` : `
            <p class="price" style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                ${product.price.toLocaleString()}₫
            </p>
        `}
        ${product.category ? `<p style="color: #666; font-size: 14px; margin: 5px 0;">${product.category}</p>` : ''}
        ${product.brand ? `<p style="color: #888; font-size: 12px; margin: 5px 0;">${product.brand}</p>` : ''}
        <button class="add-to-cart" style="padding: 10px 15px; background: #1a3e72; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
            Thêm vào giỏ
        </button>
    `;
    
    // Add click event to view product detail
    card.addEventListener('click', function(e) {
        if (!e.target.classList.contains('add-to-cart')) {
            window.location.href = `/product-detail.html?id=${product.id}`;
        }
    });
    
    return card;
}

function clearSearch() {
    const searchInput = document.querySelector('.search-box input[type="text"]');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reload page or reset to default view
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage.includes('.html')) {
        // If on specific product page, call default filter
        if (window.ShoesData && window.ShoesData.applyFilters) {
            window.ShoesData.applyFilters();
        } else if (window.GlovesData && window.GlovesData.applyFilters) {
            window.GlovesData.applyFilters();
        } else if (window.AccessoriesData && window.AccessoriesData.applyFilters) {
            window.AccessoriesData.applyFilters();
        } else if (window.ClothesData && window.ClothesData.applyFilters) {
            window.ClothesData.applyFilters();
        } else {
            location.reload();
        }
    }
}

// Global exports
window.SearchHandler = {
    performSearch: performSearch,
    clearSearch: clearSearch
};

// Add CSS for loading animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);