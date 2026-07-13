// =============================================================================
// PLUGIN CONFIGURATION - STANDARDIZED IPTV
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "iptv_standard_v2",
        "name": "Truyền Hình Chuẩn",
        "version": "8.0.0",
        "baseUrl": "https://raw.githubusercontent.com/hieu-TQS/YOUR_REPO/main/data.m3u", // Thay link Raw của bạn vào đây
        "iconUrl": "https://i.imgur.com/nfkmvAY.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'vtv', title: '📺 Truyền Hình VTV', type: 'Horizontal', path: 'iptv_standard_v2' },
        { slug: 'htv', title: '🎬 Kênh HTV & THVL', type: 'Horizontal', path: 'iptv_standard_v2' },
        { slug: 'dia-phuong', title: '📍 Kênh Địa Phương', type: 'Grid', path: 'iptv_standard_v2' }
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

function getUrlList(slug, filtersJson) {
    // Thay link Raw của file .m3u bạn đã tải lên GitHub vào đây
    return "https://raw.githubusercontent.com/hieu-TQS/YOUR_REPO/main/data.m3u"; 
}

// =============================================================================
// PARSING LOGIC (Tối ưu cho danh sách của bạn)
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
                group: groupMatch ? groupMatch[1].replace('Truyền Hình', 'Kênh khác').trim() : 'Kênh khác',
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
        
        // Lọc thông minh theo nhóm
        if (catSlug === 'vtv') channels = channels.filter(function(ch) { return ch.name.indexOf('VTV') >= 0; });
        else if (catSlug === 'htv') channels = channels.filter(function(ch) { return ch.name.indexOf('HTV') >= 0 || ch.name.indexOf('Vĩnh Long') >= 0; });
        else if (catSlug === 'dia-phuong') channels = channels.filter(function(ch) { return ch.name.indexOf('VTV') === -1 && ch.name.indexOf('HTV') === -1 && ch.name.indexOf('Vĩnh Long') === -1; });

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
    } catch (e) { return JSON.stringify({ items: [] }); }
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
