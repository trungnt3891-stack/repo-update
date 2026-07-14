// =============================================================================
// METADATA
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi-full",
        "name": "VMT TV (Full Auto)",
        "version": "1.0.3",
        "baseUrl": "https://tinhlagi.pro",
        "iconUrl": "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/Logo.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'all', title: '🔴 Tổng Hợp Kênh', type: 'Grid', path: 'tinhlagi-full' }
    ]);
}

// =============================================================================
// URL CẤU HÌNH
// =============================================================================
var M3U_URL = "https://tinhlagi.pro/s.m3u";

function getUrlList(slug, filtersJson) { return M3U_URL; }
function getUrlDetail(slug) { return slug; }

// =============================================================================
// LOGIC PHÂN NHÓM TỰ ĐỘNG (Phù hợp cấu trúc trang của bạn)
// =============================================================================
function getGroupByName(name) {
    var up = name.toUpperCase();
    if (up.indexOf("VTV") !== -1) return "VTV";
    if (up.indexOf("HTV") !== -1 && up.indexOf("HTVC") === -1) return "HTV";
    if (up.indexOf("HTVC") !== -1) return "HTVC";
    if (up.indexOf("SCTV") !== -1) return "SCTV";
    if (up.indexOf("BOX") !== -1 || up.indexOf("MUSIC") !== -1) return "📦| In The Box";
    if (up.indexOf("BONG DA") !== -1 || up.indexOf("XOILAC") !== -1 || up.indexOf("K+") !== -1 || up.indexOf("THE THAO") !== -1) return "Thể Thao";
    return "Quốc Tế";
}

// =============================================================================
// PARSER M3U
// =============================================================================
function parseListResponse(apiResponseJson, apiUrl) {
    var lines = apiResponseJson.split('\n');
    var items = [];
    var currentTitle = "";

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf('#EXTINF:') === 0) {
            currentTitle = line.substring(line.lastIndexOf(',') + 1).trim();
        } else if (line.indexOf('http') === 0) {
            var group = getGroupByName(currentTitle);
            items.push({
                id: line,
                title: currentTitle,
                posterUrl: "https://via.placeholder.com/200?text=" + group,
                quality: "LIVE",
                episode_current: group // Ứng dụng sẽ nhóm theo giá trị này
            });
        }
    }
    return JSON.stringify({ items: items });
}

// =============================================================================
// PLAYER SETUP
// =============================================================================
function parseDetailResponse(apiResponseJson, apiUrl) {
    return JSON.stringify({
        url: apiUrl,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "http://tinhlagi.pro/" 
        }
    });
}

function parseMovieDetail(a, b) { 
    return JSON.stringify({ servers: [{ name: "Live", episodes: [{ id: b, name: "Xem Ngay", slug: "stream" }] }] }); 
}

// ... Các hàm rỗng getUrlSearch, getUrlCategories... giữ nguyên như bản cũ ...
