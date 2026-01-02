    // Dropdown menu functionality
    document.addEventListener('DOMContentLoaded', function() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('mouseenter', function() {
                this.querySelector('.dropdown-menu').style.display = 'block';
            });
            
            dropdown.addEventListener('mouseleave', function() {
                this.querySelector('.dropdown-menu').style.display = 'none';
            });
        });

        // Add to cart functionality
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
    });

        // QUAN TRỌNG: Ngăn chặn sự kiện touch ngang
        document.addEventListener('touchmove', function(e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        // Ngăn chặn zoom bằng pinch
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        });
    ;

    // QUAN TRỌNG: Ngăn chặn scroll ngang bằng JavaScript
    window.addEventListener('scroll', function() {
        if (window.scrollX !== 0) {
            window.scrollTo(0, window.scrollY);
        }
    });

    // Ngăn chặn sự kiện wheel ngang
    window.addEventListener('wheel', function(e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
        }
    }, { passive: false });
