// =============================================================================
// CẤU HÌNH MANIFEST
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "vmt-iptv-pro",
        "name": "VMT TV Pro",
        "version": "2.0.0",
        "baseUrl": "http://tinhlagi.pro",
        "iconUrl": "https://i.imgur.com/8QzXkPq.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([{ slug: 'all', title: '🔴 Danh Sách Kênh', type: 'Grid', path: 'vmt-iptv-pro' }]);
}

// =============================================================================
// NGUỒN DỮ LIỆU
// =============================================================================
var M3U_URL = "http://tinhlagi.pro/s.m3u";

function getUrlList(slug, filtersJson) { return M3U_URL; }
function getUrlDetail(slug) { return slug; }

// =============================================================================
// PHÂN NHÓM THÔNG MINH
// =============================================================================
function getGroup(name) {
    var up = name.toUpperCase();
    if (up.includes("VTV")) return "VTV";
    if (up.includes("BONG DA") || up.includes("XOILAC") || up.includes("K+") || up.includes("THE THAO")) return "Thể Thao";
    if (up.includes("HTV")) return "HTV";
    if (up.includes("SCTV")) return "SCTV";
    return "Khác";
}

// =============================================================================
// PARSING
// =============================================================================
function parseListResponse(apiResponseJson, apiUrl) {
    var lines = apiResponseJson.split('\n');
    var items = [];
    var title = "";

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
            title = line.substring(line.lastIndexOf(',') + 1).trim();
        } else if (line.length > 5 && line.startsWith('http')) {
            var group = getGroup(title);
            items.push({
                id: line,
                title: title,
                posterUrl: "https://via.placeholder.com/200?text=" + encodeURIComponent(group),
                quality: "LIVE",
                episode_current: group
            });
        }
    }
    return JSON.stringify({ items: items });
}

// =============================================================================
// PLAYER & HEADERS (QUAN TRỌNG)
// =============================================================================
function parseMovieDetail(a, b) {
    return JSON.stringify({
        servers: [{ name: "Live Stream", episodes: [{ id: b, name: "Xem Ngay", slug: "stream" }] }]
    });
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    return JSON.stringify({
        url: apiUrl,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "http://tinhlagi.pro/" 
        }
    });
}

// Các hàm rỗng cần thiết
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
