// file: load-clubs-teams.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏟️ load-clubs-teams.js đang chạy...');
    
    const API_BASE_URL = 'http://localhost:3000/api/simple';
    
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
    
    // 2. Hàm load ảnh CLB từ database
    async function loadClubImages() {    
        const clubSection = document.querySelector('#clubs .category-grid');
        if (!clubSection) {
            console.error('❌ Không tìm thấy phần CLB');
            return;
        }
        
        // Hiển thị loading
        showLoading(clubSection, 'clubs');
        
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/products/clubs`, {
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.products && data.products.length > 0) {
                    displayClubImagesFromDB(data.products, clubSection);
                    return;
                }
            }
        } catch (error) {
            console.warn('⚠️ Không thể lấy CLB từ API:', error.message);
        }
        
        // Fallback: Dùng ảnh mẫu từ thư mục
        useClubMockData(clubSection);
    }
    
    // 3. Hàm hiển thị ảnh CLB từ database
    function displayClubImagesFromDB(products, container) {
        container.innerHTML = '';
        
        // Nhóm sản phẩm theo club
        const clubMap = new Map();
        
        products.forEach(product => {
            const clubId = product.ClubID;
            if (clubId && !clubMap.has(clubId)) {
                clubMap.set(clubId, {
                    id: clubId,
                    name: product.ClubName || 'Câu lạc bộ',
                    image: product.ImageURL || getDefaultImage(),
                    country: product.Country || '',
                    type: 'club'
                });
            }
        });
        
        // Lấy 6 CLB đầu tiên
        const clubs = Array.from(clubMap.values()).slice(0, 6);
        
        if (clubs.length === 0) {
            useClubMockData(container);
            return;
        }
        
        clubs.forEach(club => {
            const card = createClubCard(club);
            container.appendChild(card);
        });
        
        addClubClickEvents();
    }
    
    // 4. Hàm load ảnh đội tuyển từ database
    async function loadNationalTeamImages() {      
        const nationalSection = document.querySelector('#national .category-grid');
        if (!nationalSection) {
            console.error('❌ Không tìm thấy phần đội tuyển');
            return;
        }
        
        showLoading(nationalSection, 'national');
        
        try {
            const response = await fetchWithTimeout(`${API_BASE_URL}/products/national`, {
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.products && data.products.length > 0) {
                    displayNationalImagesFromDB(data.products, nationalSection);
                    return;
                }
            }
        } catch (error) {
            console.warn('⚠️ Không thể lấy đội tuyển từ API:', error.message);
        }
        
        // Fallback: Dùng ảnh mẫu
        useNationalMockData(nationalSection);
    }
    
    // 5. Hàm hiển thị ảnh đội tuyển từ database
    function displayNationalImagesFromDB(products, container) {
        container.innerHTML = '';
        
        // Nhóm theo quốc gia
        const countryMap = new Map();
        
        products.forEach(product => {
            const country = product.Country;
            if (country && !countryMap.has(country)) {
                countryMap.set(country, {
                    id: product.ClubID,
                    name: product.ClubName || country,
                    image: product.ImageURL || getDefaultImage(),
                    country: country,
                    type: 'national'
                });
            }
        });
        
        // Lấy 6 đội tuyển đầu tiên
        const teams = Array.from(countryMap.values()).slice(0, 6);
        
        if (teams.length === 0) {
            useNationalMockData(container);
            return;
        }
        
        teams.forEach(team => {
            const card = createNationalCard(team);
            container.appendChild(card);
        });
        
        addNationalClickEvents();
    }

function useClubMockData(container) {
    container.innerHTML = '';
    
    const mockClubs = [
        { 
            id: 'premier-league', 
            name: 'Premier League', 
            image: 'http://localhost:3000/image/EnglishPremierLeague.webp'
        },
        { 
            id: 'la-liga', 
            name: 'La Liga', 
            image: 'http://localhost:3000/image/Laliga.webp'
        },
        { 
            id: 'serie-a', 
            name: 'Serie A', 
            image: 'http://localhost:3000/image/SeriaA.jpg'
        },
        { 
            id: 'bundesliga', 
            name: 'Bundesliga', 
            image: 'http://localhost:3000/image/bundesliga.png'
        },
        { 
            id: 'ligue-1', 
            name: 'Ligue 1', 
            image: 'http://localhost:3000/image/ligue1.svg'
        },
        { 
            id: 'v-league', 
            name: 'V-League', 
            image: 'http://localhost:3000/image/vleague.png'
        }
    ];
    
    mockClubs.forEach(club => {
        const card = createClubCard({
            ...club,
            type: 'club',
            country: ''
        });
        container.appendChild(card);
    });
    
    addClubClickEvents();
}
    

    // 7. Dữ liệu mẫu cho đội tuyển
    function useNationalMockData(container) {
    container.innerHTML = '';
    
    const mockTeams = [
        { 
            id: 'vietnam', 
            name: 'Việt Nam', 
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Flag_of_Vietnam.svg/300px-Flag_of_Vietnam.svg.png',
            country: 'Việt Nam'
        },
        { 
            id: 'brazil', 
            name: 'Brazil', 
            image: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Flag_of_Brazil.svg/300px-Flag_of_Brazil.svg.png',
            country: 'Brazil'
        },
        { 
            id: 'argentina', 
            name: 'Argentina', 
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Argentina.svg/300px-Flag_of_Argentina.svg.png',
            country: 'Argentina'
        },
        { 
            id: 'france', 
            name: 'Pháp', 
            image: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Flag_of_France.svg/300px-Flag_of_France.svg.png',
            country: 'Pháp'
        },
        { 
            id: 'spain', 
            name: 'Tây Ban Nha', 
            image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Flag_of_Spain.svg/300px-Flag_of_Spain.svg.png',
            country: 'Tây Ban Nha'
        },
        { 
            id: 'germany', 
            name: 'Đức', 
            image: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/ba/Flag_of_Germany.svg/300px-Flag_of_Germany.svg.png',
            country: 'Đức'
        }
    ];
    
    mockTeams.forEach(team => {
        const card = createNationalCard({
            ...team,
            type: 'national'
        });
        container.appendChild(card);
    });
    
    addNationalClickEvents();
}
    
    // 8. Tạo card CLB
    function createClubCard(club) {
        const card = document.createElement('div');
        card.className = 'club-card category-card';
        card.dataset.clubId = club.id;
        
        card.innerHTML = `
            <div class="club-image-container">
                <img src="${club.image}" 
                     alt="${club.name}" 
                     class="club-logo"
                     onerror="this.onerror=null; this.src='${getDefaultImage()}'">
                <div class="club-overlay">
                    <h3>${club.name}</h3>
                    ${club.country ? `<p class="club-country">${club.country}</p>` : ''}
                    <button class="btn-view-club" data-club-id="${club.id}">
                        Xem sản phẩm
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // 9. Tạo card đội tuyển
    function createNationalCard(team) {
        const card = document.createElement('div');
        card.className = 'national-card category-card';
        card.dataset.teamId = team.id;
        
        card.innerHTML = `
            <div class="team-image-container">
                <img src="${team.image}" 
                     alt="${team.name}" 
                     class="team-logo"
                     onerror="this.onerror=null; this.src='${getDefaultImage()}'">
                <div class="team-overlay">
                    <h3>${team.name}</h3>
                    <button class="btn-view-team" data-team-id="${team.id}">
                        Xem áo đấu
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    // 10. Thêm sự kiện click cho CLB
    function addClubClickEvents() {
        const clubCards = document.querySelectorAll('.club-card');
        clubCards.forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn-view-club')) {
                    const clubId = this.dataset.clubId;
                    navigateToClubPage(clubId);
                }
            });
        });
        
        const clubButtons = document.querySelectorAll('.btn-view-club');
        clubButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const clubId = this.dataset.clubId;
                navigateToClubPage(clubId);
            });
        });
    }
    
    // 11. Thêm sự kiện click cho đội tuyển
    function addNationalClickEvents() {
        const teamCards = document.querySelectorAll('.national-card');
        teamCards.forEach(card => {
            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('btn-view-team')) {
                    const teamId = this.dataset.teamId;
                    navigateToTeamPage(teamId);
                }
            });
        });
        
        const teamButtons = document.querySelectorAll('.btn-view-team');
        teamButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const teamId = this.dataset.teamId;
                navigateToTeamPage(teamId);
            });
        });
    }
    
    // 12. Điều hướng trang
    function navigateToClubPage(clubId) {
        console.log(`👉 Đến trang CLB: ${clubId}`);
        window.location.href = `../XEM_TAT_CA/xemtatca.html?type=club&id=${clubId}`;
    }
    
    function navigateToTeamPage(teamId) {
        console.log(`👉 Đến trang đội tuyển: ${teamId}`);
        window.location.href = `../XEM_TAT_CA/xemtatca.html?type=national&id=${teamId}`;
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
    
    // 14. Lấy ảnh mặc định
    function getDefaultImage() {
        return './image/default-product.jpg';
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
        if (document.getElementById('clubs-teams-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'clubs-teams-styles';
        style.textContent = `
            /* Grid layout */
            .category-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            
            /* Card styles */
            .category-card {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .category-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            }
            
            /* Image container */
            .club-image-container,
            .team-image-container {
                width: 100%;
                height: 100%;
                position: relative;
                overflow: hidden;
            }
            
            .club-logo,
            .team-logo {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s ease;
            }
            
            /* Overlay styles */
            .club-overlay,
            .team-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0,0,0,0.8));
                color: white;
                padding: 20px;
                text-align: center;
                opacity: 0;
                transform: translateY(100%);
                transition: all 0.3s ease;
            }
            
            .category-card:hover .club-overlay,
            .category-card:hover .team-overlay {
                opacity: 1;
                transform: translateY(0);
            }
            
            .club-overlay h3,
            .team-overlay h3 {
                margin: 0 0 5px 0;
                font-size: 1.1em;
                font-weight: 600;
                color: white;
            }
            
            .club-country {
                margin: 0 0 10px 0;
                font-size: 0.9em;
                opacity: 0.8;
            }
            
            /* Button styles */
            .btn-view-club,
            .btn-view-team {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.9em;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .btn-view-club:hover,
            .btn-view-team:hover {
                background: #45a049;
                transform: scale(1.05);
            }
            
            /* Loading styles */
            .loading-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 20px;
            }
            
            .loading-card {
                background: #f5f5f5;
                border-radius: 12px;
                height: 200px;
                overflow: hidden;
                animation: pulse 1.5s infinite;
            }
            
            .loading-image {
                width: 100%;
                height: 140px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }
            
            .loading-text {
                height: 20px;
                width: 80%;
                margin: 20px auto;
                background: #e0e0e0;
                border-radius: 4px;
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
                    height: 180px;
                }
            }
            
            @media (max-width: 480px) {
                .category-grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 17. Hàm chính
    async function init() {
        console.log('🏁 Khởi động load clubs & teams...');
        
        addStyles();
        
        // Kiểm tra API
        const apiHealthy = await checkAPIHealth();
        
        if (apiHealthy) {
            console.log('✅ API hoạt động, tải từ database');
            await Promise.all([
                loadClubImages(),
                loadNationalTeamImages()
            ]);
        } else {
            console.warn('⚠️ API không hoạt động, dùng dữ liệu mẫu');
            
            // Load đồng thời cả hai
            const clubSection = document.querySelector('#clubs .category-grid');
            const nationalSection = document.querySelector('#national .category-grid');
            
            if (clubSection) useClubMockData(clubSection);
            if (nationalSection) useNationalMockData(nationalSection);
        }
        
        console.log('✅ Load clubs & teams hoàn tất');
    }
    
    // 18. Khởi chạy
    init();
});