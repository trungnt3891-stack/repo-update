// =============================================================================
// PLUGIN CONFIGURATION (Nguồn chuẩn v2)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "iptv_standard_vn",
        "name": "IPTV VN Standard",
        "version": "7.0.0",
        "iconUrl": "https://i.imgur.com/nfkmvAY.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'vtv', title: '📺 Kênh VTV', type: 'Horizontal', path: 'iptv_standard_vn' },
        { slug: 'htv', title: '🎬 Kênh HTV & THVL', type: 'Horizontal', path: 'iptv_standard_vn' },
        { slug: 'dia-phuong', title: '📍 Kênh Địa Phương', type: 'Grid', path: 'iptv_standard_vn' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '📺 VTV', slug: 'vtv' },
        { name: '🎬 HTV & THVL', slug: 'htv' },
        { name: '📍 Địa Phương', slug: 'dia-phuong' },
        { name: '🌐 Tất cả', slug: 'all' }
    ]);
}

// =============================================================================
// URL GENERATION & ROUTING
// =============================================================================

// BẠN DÁN LINK GITHUB/PASTEBIN CỦA FILE M3U CHỨA NỘI DUNG TRÊN VÀO ĐÂY:
var M3U_URL = "https://raw.githubusercontent.com/username/repo/main/file_cua_ban.m3u";

function getUrlList(slug, filtersJson) {
    return M3U_URL; // Nguồn duy nhất
}

function getUrlDetail(slug) {
    return M3U_URL; 
}

// =============================================================================
// PARSING LOGIC (Tối ưu cho list M3U của bạn)
// =============================================================================

function parseM3U(text) {
    var lines = text.split('\n');
    var channels = [];
    var currentInfo = null;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf('#EXTINF:') === 0) {
            var groupMatch = line.match(/group-title="([^"]*)"/);
            var logoMatch = line.match(/tvg-logo="([^"]*)"/);
            var name = line.substring(line.lastIndexOf(',') + 1).trim();

            currentInfo = {
                group: groupMatch ? groupMatch[1] : 'Khác',
                logo: logoMatch ? logoMatch[1] : '',
                name: name
            };
        } else if (line.length > 0 && line.indexOf('http') === 0) {
            if (currentInfo) {
                currentInfo.url = line;
                channels.push(currentInfo);
                currentInfo = null;
            }
        }
    }
    return channels;
}

function parseListResponse(apiResponseJson, apiUrl) {
    var channels = parseM3U(apiResponseJson);
    var items = channels.map(function(ch) {
        return {
            id: encodeURIComponent(ch.name),
            title: ch.name,
            posterUrl: ch.logo,
            quality: "LIVE",
            episode_current: ch.group
        };
    });
    return JSON.stringify({ items: items, pagination: { totalPages: 1 } });
}

function parseMovieDetail(apiResponseJson, apiUrl) {
    var channels = parseM3U(apiResponseJson);
    var id = decodeURIComponent(extractParamFromUrl(apiUrl, 'id'));
    var channel = channels.filter(function(ch) { return ch.name === id; })[0];
    
    if (!channel) return "null";
    return JSON.stringify({
        id: id,
        title: channel.name,
        posterUrl: channel.logo,
        servers: [{ name: "Live", episodes: [{ id: channel.url, name: channel.name, slug: "stream" }] }]
    });
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    return JSON.stringify({
        url: apiUrl,
        headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36" }
    });
}

function extractParamFromUrl(url, param) {
    var match = url.match(new RegExp('[?&]' + param + '=([^&]+)'));
    return match ? decodeURIComponent(match[1]) : "";
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
