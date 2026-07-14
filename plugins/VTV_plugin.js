// =============================================================================
// PLUGIN CONFIGURATION - TRUYỀN HÌNH VIỆT NAM
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "iptv_vn_full",
        "name": "Truyền Hình VN Full",
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
        { slug: 'vtv', title: '📺 Đài Truyền Hình Việt Nam (VTV)', type: 'Horizontal', path: 'iptv_vn_full' },
        { slug: 'htv', title: '🎬 Đài Truyền Hình TP.HCM (HTV)', type: 'Horizontal', path: 'iptv_vn_full' },
        { slug: 'dia-phuong', title: '📍 Kênh Địa Phương', type: 'Grid', path: 'iptv_vn_full' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '📺 VTV', slug: 'vtv' },
        { name: '🎬 HTV', slug: 'htv' },
        { name: '📍 Địa Phương', slug: 'dia-phuong' },
        { name: '🌐 Tất cả', slug: 'all' }
    ]);
}

// =============================================================================
// URL & ROUTING
// =============================================================================

// Thay link Raw vào đây
var M3U_URL = "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/new.m3u";

function getUrlList(slug, filtersJson) { return M3U_URL; }
function getUrlDetail(slug) { return M3U_URL + "?id=" + encodeURIComponent(slug); }

// =============================================================================
// M3U PARSING ENGINE
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
                group: groupMatch ? groupMatch[1] : 'Truyền Hình',
                logo: logoMatch ? logoMatch[1] : 'https://i.imgur.com/nfkmvAY.png',
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
        var catSlug = extractParamFromUrl(apiUrl, 'cat');

        // Logic phân loại nhóm kênh thông minh
        if (catSlug === 'vtv') channels = channels.filter(function(ch) { return ch.name.indexOf('VTV') >= 0; });
        else if (catSlug === 'htv') channels = channels.filter(function(ch) { return ch.name.indexOf('HTV') >= 0 || ch.name.indexOf('Vĩnh Long') >= 0; });
        else if (catSlug === 'dia-phuong') channels = channels.filter(function(ch) { return ch.name.indexOf('VTV') === -1 && ch.name.indexOf('HTV') === -1 && ch.name.indexOf('Vĩnh Long') === -1; });

        var items = channels.map(function(ch) {
            return {
                id: encodeURIComponent(ch.name + '::' + ch.url),
                title: ch.name,
                posterUrl: ch.logo,
                quality: "LIVE",
                episode_current: ch.group
            };
        });
        return JSON.stringify({ items: items, pagination: { totalPages: 1 } });
    } catch (e) { return JSON.stringify({ items: [] }); }
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    return JSON.stringify({
        url: apiUrl,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Referer": "https://www.fptplay.vn/"
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
