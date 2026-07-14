// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi-iptv",
        "name": "VMT TV - Live",
        "version": "1.0.3",
        "baseUrl": "https://tinhlagi.pro",
        "iconUrl": "https://i.imgur.com/8QzXkPq.png", 
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'all', title: '🔴 Xem Tất Cả Kênh', type: 'Grid', path: 'tinhlagi-iptv' }
    ]);
}

// =============================================================================
// URL GENERATION
// =============================================================================

var M3U_URL = "https://tinhlagi.pro/s.m3u";

function getUrlList(slug, filtersJson) {
    return M3U_URL;
}

function getUrlDetail(slug) {
    return slug; // Link trực tiếp
}

// =============================================================================
// M3U PARSER NÂNG CAO
// =============================================================================

function parseM3U(text) {
    var lines = text.split('\n');
    var channels = [];
    var currentInfo = null;
    var channelIndex = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf('#EXTINF:') === 0) {
            var name = line.substring(line.lastIndexOf(',') + 1).trim();
            
            // Logic phân loại nhóm tự động
            var group = "Khác";
            var upName = name.toUpperCase();
            if (upName.indexOf("VTV") !== -1) group = "VTV";
            else if (upName.indexOf("K+") !== -1 || upName.indexOf("BONG DA") !== -1 || upName.indexOf("THE THAO") !== -1 || upName.indexOf("XOILAC") !== -1) group = "Thể Thao";
            
            currentInfo = {
                group: group,
                name: name,
                index: channelIndex++
            };
        } else if (line.length > 0 && (line.indexOf('http') === 0 || line.indexOf('//') === 0)) {
            if (currentInfo) {
                currentInfo.url = line;
                channels.push(currentInfo);
                currentInfo = null;
            }
        }
    }
    return channels;
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var channels = parseM3U(apiResponseJson);
        var allItems = channels.map(function(ch) {
            return {
                id: ch.url, // Dùng URL làm ID để mở trực tiếp
                title: ch.name,
                posterUrl: "https://via.placeholder.com/200x200?text=" + ch.group.substring(0,2),
                quality: "LIVE",
                episode_current: ch.group
            };
        });

        return JSON.stringify({
            items: allItems,
            pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length }
        });
    } catch (e) { return JSON.stringify({ items: [] }); }
}

function parseMovieDetail(apiResponseJson, apiUrl) {
    // apiUrl ở đây chính là link stream đã truyền qua từ id
    return JSON.stringify({
        id: apiUrl,
        title: "Xem Trực Tiếp",
        servers: [{
            name: "Luồng Xôi Lạc",
            episodes: [{ id: apiUrl, name: "Phát Trực Tiếp", slug: "stream" }]
        }]
    });
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    return JSON.stringify({
        url: apiUrl,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "http://tinhlagi.pro/" 
        },
        subtitles: []
    });
}

// Giữ lại các hàm trống để tránh crash
function getUrlSearch() { return ""; }
function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }
function parseSearchResponse() { return "[]"; }
function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
