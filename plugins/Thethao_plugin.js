function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi-final",
        "name": "VMT TV - IPTV",
        "version": "1.0.5",
        "baseUrl": "http://tinhlagi.pro",
        "isEnabled": true,
        "type": "VIDEO"
    });
}

function getHomeSections() {
    return JSON.stringify([{ slug: 'all', title: '🔴 Kênh Trực Tuyến', type: 'Grid', path: 'tinhlagi-final' }]);
}

function getUrlList(slug, filtersJson) {
    // Gọi qua proxy để vượt rào CORS và bảo mật HTTP
    return "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent("http://tinhlagi.pro/s.m3u");
}

function parseListResponse(apiResponseJson) {
    var lines = apiResponseJson.split('\n');
    var items = [];
    var title = "";
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
            title = line.substring(line.lastIndexOf(',') + 1).trim();
        } else if (line.startsWith('http')) {
            items.push({
                id: line, // ID là link luồng
                title: title,
                posterUrl: "https://via.placeholder.com/150?text=TV",
                quality: "LIVE",
                episode_current: "Live"
            });
        }
    }
    return JSON.stringify({ items: items });
}

// Hàm này giúp app phát video mà không bị chặn User-Agent
function parseDetailResponse(apiResponseJson, apiUrl) {
    return JSON.stringify({
        url: apiUrl,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "http://tinhlagi.pro/"
        }
    });
}

// Bắt buộc giữ lại các hàm này để plugin không bị crash
function getUrlDetail(slug) { return slug; }
function parseMovieDetail(a, b) { return JSON.stringify({ servers: [{ name: "Live", episodes: [{ id: b, name: "Xem Ngay", slug: "stream" }] }] }); }
function getUrlSearch() { return ""; }
function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }
function parseSearchResponse() { return "[]"; }
function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
function getFilterConfig() { return "{}"; }
function getPrimaryCategories() { return "[]"; }
