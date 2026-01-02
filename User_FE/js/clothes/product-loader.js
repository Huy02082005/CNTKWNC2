document.addEventListener('DOMContentLoaded', function() {
    function loadProducts() {
        const products = [
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
                onsale: false
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
                onsale: true
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
                onsale: false
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
                onsale: true
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
                onsale: false
            },
        ];

        displayProducts(products);

        window.allProducts = products;
    }

    // Hàm hiển thị sản phẩm
    function displayProducts(products) {
        const productGrid = document.getElementById('product-grid');
        productGrid.innerHTML = '';

        if (products.length === 0) {
            productGrid.innerHTML = '<div class="no-products-message">Không tìm thấy sản phẩm phù hợp</div>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.setAttribute('data-price', product.price);
            productCard.setAttribute('data-category', product.category);
            productCard.setAttribute('data-brand', product.brand);
            productCard.setAttribute('data-club', product.club);
            productCard.setAttribute('data-league', product.league);
            productCard.setAttribute('data-size', product.size);
            productCard.setAttribute('data-status', product.status);
            productCard.setAttribute('data-onsale', product.onsale);

            productCard.innerHTML = `
                <div class="image-holder">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <h3>${product.name}</h3>
                <p class="price">${product.price.toLocaleString('vi-VN')}₫</p>
                <button class="add-to-cart">Thêm vào giỏ</button>
            `;

            productGrid.appendChild(productCard);
        });

        // Thêm sự kiện cho nút thêm vào giỏ hàng
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
    }

    // Gọi hàm tải sản phẩm khi trang được tải
    loadProducts();
});