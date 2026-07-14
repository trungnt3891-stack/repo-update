function getManifest() {
    return JSON.stringify({
        "id": "test-vsmov",
        "name": "TEST LỖI APP",
        "version": "9.9.9",
        "baseUrl": "https://google.com",
        "iconUrl": "",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'test', title: 'KIỂM TRA LỖI', type: 'Grid', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() { return JSON.stringify([{ name: 'Test', slug: 'test' }]); }
function getFilterConfig() { return "{}"; }

// Gọi thẳng tới Google để chắc chắn mạng không bị treo
function getUrlList(slug, filtersJson) {
    return "https://www.google.com";
}

// Trả về dữ liệu ảo, mặc kệ Google trả về gì
function parseListResponse(apiResponseJson) {
    return JSON.stringify({
        items: [{
            id: "fake-1", 
            title: "✅ APP VÀ JS HOẠT ĐỘNG BÌNH THƯỜNG", 
            posterUrl: "https://via.placeholder.com/300x450?text=OK", 
            backdropUrl: "https://via.placeholder.com/300x450?text=OK", 
            year: 2026, quality: "FHD", episode_current: "Test", lang: "Việt"
        }],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 1 }
    });
}

function getUrlSearch(keyword, filtersJson) { return "https://www.google.com"; }
function parseSearchResponse(apiResponseJson) { return parseListResponse(apiResponseJson); }
function getUrlDetail(slug) { return "https://www.google.com"; }
function parseMovieDetail(apiResponseJson) { return "null"; }
function parseDetailResponse(apiResponseJson) { return "{}"; }
function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }
