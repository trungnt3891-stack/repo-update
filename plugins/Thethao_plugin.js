function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi-iptv",
        "name": "Bóng Đá TV",
        "version": "1.0.0",
        "baseUrl": "http://tinhlagi.pro",
        "isEnabled": true,
        "type": "VIDEO"
    });
}

function getHomeSections() {
    return JSON.stringify([{ slug: 'live', title: '🔴 Trực Tiếp', type: 'Grid', path: 'danh-sach' }]);
}

function getPrimaryCategories() {
    return JSON.stringify([{ name: 'Trực Tiếp', slug: 'live' }]);
}

function getUrlList(slug, filtersJson) {
    return "http://tinhlagi.pro/s.m3u";
}

function parseListResponse(apiResponseJson, apiUrl) {
    var lines = apiResponseJson.split('\n');
    var items = [];
    var currentName = "Kênh Bóng Đá";

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf('#EXTINF:') === 0) {
            currentName = line.substring(line.lastIndexOf(',') + 1);
        } else if (line.length > 5 && line.indexOf('#') !== 0) {
            items.push({
                id: line, // Link luồng
                title: currentName,
                posterUrl: "https://i.imgur.com/8QzXkPq.png", // Icon bóng đá
                quality: "LIVE"
            });
        }
    }
    return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    // Ép header để server nghĩ đây là trình duyệt đang gọi
    return JSON.stringify({
        url: apiUrl,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "http://tinhlagi.pro/"
        },
        subtitles: []
    });
}

// Các hàm phụ trợ
function getUrlDetail(slug) { return slug; }
function parseMovieDetail(a, b) { return JSON.stringify({ servers: [{ episodes: [{ id: b, name: "Phát", slug: "stream" }] }] }); }
function getFilterConfig() { return "{}"; }
function getUrlSearch(k) { return ""; }
function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }
function parseSearchResponse() { return "[]"; }
function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
