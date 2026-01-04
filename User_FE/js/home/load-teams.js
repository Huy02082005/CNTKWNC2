document.addEventListener('DOMContentLoaded', function() {
    console.log('🏟️ load-teams.js đang chạy...');
    
    const API_BASE_URL = 'http://localhost:3000/api/simple';
    const IMAGE_BASE_PATH = '/image';
    
    // 1. Hàm kiểm tra API
    async function checkAPIHealth() {
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/test`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                timeout: 3000
            });
            
            return response.ok;
        } catch (error) {
            console.warn('⚠️ API không khả dụng:', error.message);
            return false;
        }
    }
    
    // 2. Hàm load ảnh giải đấu từ database
    async function loadLeagueImages() {    
        const clubSection = document.querySelector('#clubs .category-grid');
        if (!clubSection) {
            console.error('❌ Không tìm thấy phần giải đấu');
            return;
        }
        
        // Hiển thị loading
        showLoading(clubSection, 'clubs');
        
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/products/leagues`, {
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.products && data.products.length > 0) {
                    displayLeagueImagesFromDB(data.products, clubSection);
                    return;
                }
            }
        } catch (error) {
            console.warn('⚠️ Không thể lấy giải đấu từ API:', error.message);
        }
        
        // Fallback: Dùng ảnh mẫu từ thư mục User_FE/image
        useLeagueMockData(clubSection);
    }
    
    // 3. Hàm hiển thị ảnh giải đấu từ database
    function displayLeagueImagesFromDB(products, container) {
        container.innerHTML = '';
        
        // Nhóm sản phẩm theo league
        const leagueMap = new Map();
        
        products.forEach(product => {
            const leagueId = product.LeagueID;
            if (leagueId && !leagueMap.has(leagueId)) {
                leagueMap.set(leagueId, {
                    id: leagueId,
                    name: product.LeagueName || 'Giải đấu',
                    // Sửa đường dẫn ảnh
                    image: getLeagueImagePath(leagueId, product.LeagueName),
                    country: product.Country || '',
                    type: 'league'
                });
            }
        });
        
        // Lấy 6 giải đấu đầu tiên
        const leagues = Array.from(leagueMap.values()).slice(0, 6);
        
        if (leagues.length === 0) {
            useLeagueMockData(container);
            return;
        }
        
        leagues.forEach(league => {
            const card = createLeagueCard(league);
            container.appendChild(card);
        });
        
        addLeagueClickEvents();
    }
    
    // Hàm lấy đường dẫn ảnh giải đấu
    function getLeagueImagePath(leagueId, leagueName) {
        // Map leagueId và leagueName sang tên file
        const leagueImageMap = {
            1: 'EnglishPremierLeague.jpg',
            2: 'Laliga.jpg',
            3: 'SeriaA.jpg',
            4: 'bundesliga.jpg',
            5: 'Ligue1.jpg',
            6: 'vleague.jpg'
        };
        
        const fileName = leagueImageMap[leagueId] || 'default-league.jpg';
        return `${IMAGE_BASE_PATH}/league/${fileName}`;
    }

    // 6. Dữ liệu mẫu cho giải đấu - SỬA ĐƯỜNG DẪN
    function useLeagueMockData(container) {
        container.innerHTML = '';
        
        const mockLeagues = [
            { 
                id: 1, 
                name: 'Premier League', 
                image: `${IMAGE_BASE_PATH}/league/EnglishPremierLeague.jpg`
            },
            { 
                id: 2, 
                name: 'La Liga', 
                image: `${IMAGE_BASE_PATH}/league/Laliga.jpg`
            },
            { 
                id: 3, 
                name: 'Serie A', 
                image: `${IMAGE_BASE_PATH}/league/SeriaA.jpg`
            },
            { 
                id: 4, 
                name: 'Bundesliga', 
                image: `${IMAGE_BASE_PATH}/league/bundesliga.jpg`
            },
            { 
                id: 5, 
                name: 'Ligue 1', 
                image: `${IMAGE_BASE_PATH}/league/Ligue1.jpg`
            },
            { 
                id: 6, 
                name: 'V-League', 
                image: `${IMAGE_BASE_PATH}/league/vleague.jpg`
            }
        ];
        
        mockLeagues.forEach(league => {
            const card = createLeagueCard({
                ...league,
                type: 'league',
                country: ''
            });
            container.appendChild(card);
        });
        
        addLeagueClickEvents();
    }
    
    // 8. Tạo card giải đấu
function createLeagueCard(league) {
    const card = document.createElement('div');
    card.className = 'league-card category-card';
    card.dataset.leagueId = league.id;
    
    card.innerHTML = `
        <div class="league-image-container">
            <img src="${league.image}" 
                 alt="${league.name}" 
                 class="league-logo"
                 onerror="this.onerror=null; this.src='${getDefaultImage()}'">
            <div class="league-overlay">
                <h3>${league.name}</h3>
                ${league.country ? `<p class="league-country">${league.country}</p>` : ''}
                <button class="btn-view-league" data-league-id="${league.id}">
                    Xem sản phẩm
                </button>
            </div>
        </div>
    `;
    
    return card;
}
    
    // 10. Thêm sự kiện click cho giải đấu
    function addLeagueClickEvents() {
        const leagueCards = document.querySelectorAll('.league-card');
        leagueCards.forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn-view-league')) {
                    const leagueId = this.dataset.leagueId;
                    navigateToLeaguePage(leagueId);
                }
            });
        });
        
        const leagueButtons = document.querySelectorAll('.btn-view-league');
        leagueButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const leagueId = this.dataset.leagueId;
                navigateToLeaguePage(leagueId);
            });
        });
    }

    // 12. Điều hướng trang
    function navigateToLeaguePage(leagueId) {
        console.log(`👉 Đến trang giải đấu: ${leagueId}`);
        window.location.href = `/html/see_all.html?type=league&id=${leagueId}`;
    }
        
    // 13. Hiển thị loading
    function showLoading(container, type) {
        container.innerHTML = `
            <div class="loading-grid">
                ${Array(6).fill(0).map((_, i) => `
                    <div class="loading-card ${type}-loading">
                        <div class="loading-image"></div>
                        <div class="loading-text"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 14. Lấy ảnh mặc định - SỬA ĐƯỜNG DẪN
    function getDefaultImage() {
        return `${IMAGE_BASE_PATH}/default-image.jpg`;
    }
    
    // 15. Fetch với timeout
    function fetchWithTimeout(resource, options = {}) {
        const { timeout = 5000 } = options;
        
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        return fetch(resource, {
            ...options,
            signal: controller.signal
        }).then(response => {
            clearTimeout(id);
            return response;
        }).catch(error => {
            clearTimeout(id);
            throw error;
        });
    }
    
    // 16. Thêm styles
function addStyles() {
    if (document.getElementById('teams-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'teams-styles';
    style.textContent = `
        /* Grid layout */
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        /* Card styles - NO FLEX, FIXED HEIGHT */
        .category-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            height: 220px; /* Chiều cao cố định, nhỏ hơn */
        }
        
        .category-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        
        /* Image container - CHIẾM TOÀN BỘ CARD */
        .league-image-container {
            width: 100%;
            height: 100%; /* Chiếm toàn bộ card */
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
        }
        
        /* Logo styles - TỐI ƯU CHO ẢNH LOGO */
        .league-logo {
            max-width: 85%;
            max-height: 85%;
            width: auto;
            height: auto;
            object-fit: contain;
            transition: transform 0.5s ease;
            position: relative;
            z-index: 2;
        }
        
        /* Overlay styles - HIỂN THỊ THÔNG TIN LUÔN */
        .league-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
            color: white;
            padding: 15px 10px 10px 10px;
            text-align: center;
            z-index: 3;
        }
        
        /* Tiêu đề trong overlay */
        .league-overlay h3 {
            margin: 0 0 5px 0;
            font-size: 1.1em;
            font-weight: 600;
            color: white;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .league-country {
            margin: 0 0 8px 0;
            font-size: 0.85em;
            opacity: 0.9;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Button styles */
        .btn-view-league {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            cursor: pointer;
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateY(10px);
        }
        
        .category-card:hover .btn-view-league {
            opacity: 1;
            transform: translateY(0);
        }
        
        .btn-view-league:hover {
            background: #45a049;
            transform: scale(1.05) translateY(0);
        }

        
        /* Loading styles */
        .loading-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 20px;
        }
        
        .loading-card {
            background: #f5f5f5;
            border-radius: 12px;
            height: 220px;
            overflow: hidden;
            animation: pulse 1.5s infinite;
        }
        
        .loading-image {
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .category-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .category-card {
                height: 190px;
            }
        }
        
        @media (max-width: 480px) {
            .category-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .category-card {
                height: 170px;
            }
            
            .league-overlay h3,
            .team-overlay h3 {
                font-size: 1em;
            }
            
            .league-country,
            .tournament-country {
                font-size: 0.8em;
            }
        }
    `;
    document.head.appendChild(style);
}
    
    // 17. Hàm chính
    async function init() {
        console.log('🏁 Khởi động load leagues & teams...');
        
        addStyles();
        
        // Kiểm tra API
        const apiHealthy = await checkAPIHealth();
        
        if (apiHealthy) {
            console.log('✅ API hoạt động, tải từ database');
            await Promise.all([
                loadLeagueImages()
            ]);
        } else {
            console.warn('⚠️ API không hoạt động, dùng dữ liệu mẫu');
            
            // Load đồng thời cả hai
            const leagueSection = document.querySelector('#clubs .category-grid');
            
            if (leagueSection) useLeagueMockData(leagueSection);
        }
        
        console.log('✅ Load leagues hoàn tất');
    }
    
    // 18. Khởi chạy
    init();
});