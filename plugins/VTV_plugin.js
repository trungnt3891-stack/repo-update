// =============================================================================
// PLUGIN: VIETNG228 IPTV
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vietng228_iptv",
        "name": "VietNg228 IPTV",
        "version": "1.0.0",
        "baseUrl": "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/new.m3u",
        "iconUrl": "https://i.imgur.com/nfkmvAY.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'all', title: 'Danh sách kênh', type: 'Grid', path: 'vietng228_iptv' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất cả kênh', slug: 'all' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL & PARSING
// =============================================================================

var M3U_URL = "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/new.m3u";

function getUrlList(slug, filtersJson) { return M3U_URL; }
function getUrlSearch(keyword, filtersJson) { return M3U_URL; }
function getUrlDetail(slug) { return M3U_URL; }

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
            
            // Lấy ID ẩn nếu có để tránh trùng lặp
            var idMatch = line.match(/tvg-id="([^"]*)"/);

            currentInfo = {
                group: groupMatch ? groupMatch[1] : 'Truyền Hình',
                logo: logoMatch ? logoMatch[1] : '',
                id: idMatch ? idMatch[1] : name,
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
    try {
        var channels = parseM3U(apiResponseJson);
        var items = channels.map(function(ch) {
            return {
                id: encodeURIComponent(ch.id),
                title: ch.name,
                posterUrl: ch.logo || "https://i.imgur.com/nfkmvAY.png",
                quality: "LIVE",
                episode_current: ch.group,
                lang: "Việt"
            };
        });
        return JSON.stringify({ items: items, pagination: { totalPages: 1 } });
    } catch (e) { return JSON.stringify({ items: [] }); }
}

function parseMovieDetail(apiResponseJson, apiUrl) {
    var channels = parseM3U(apiResponseJson);
    var id = decodeURIComponent(extractParamFromUrl(apiUrl, 'id'));
    var channel = channels.filter(function(ch) { return ch.id === id; })[0];
    
    if (!channel) return "null";
    
    return JSON.stringify({
        id: id,
        title: channel.name,
        posterUrl: channel.logo || "https://i.imgur.com/nfkmvAY.png",
        servers: [{ name: "Trực tiếp", episodes: [{ id: channel.url, name: channel.name, slug: "stream" }] }]
    });
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    // Luôn gửi kèm User-Agent để tránh bị FPT Play và các nguồn chặn
    return JSON.stringify({
        url: apiUrl,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
        }
    });
}

function extractParamFromUrl(url, param) {
    var match = url.match(new RegExp('[?&]' + param + '=([^&]+)'));
    return match ? decodeURIComponent(match[1]) : "";
}

function parseCategoriesResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
