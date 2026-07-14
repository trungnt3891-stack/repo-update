// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tv365-vietng",
        "name": "TV365 & VietNG",
        "version": "1.0.1",
        "baseUrl": "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main",
        "iconUrl": "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/Logo.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'truyen-hinh', title: '📺 Truyền Hình', type: 'Grid', path: 'tv365-vietng' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Truyền Hình', slug: 'truyen-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

var M3U_URL = "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/new.m3u";
// Link dự phòng nếu cần: "https://raw.githubusercontent.com/TV365-VN/TV365-DATA/refs/heads/main/error.m3u"

function getUrlList(slug, filtersJson) {
    return M3U_URL; // Luôn trả về 1 list duy nhất không cần query category
}

function getUrlSearch(keyword, filtersJson) {
    return M3U_URL + "?search=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) {
        return slug;
    }
    return M3U_URL + "?id=" + encodeURIComponent(slug);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// M3U PARSER
// =============================================================================

function parseM3U(text) {
    var lines = text.split('\n');
    var channels = [];
    var currentInfo = null;
    var currentUserAgent = '';
    var channelIndex = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line.indexOf('#EXTINF:') === 0) {
            var groupMatch = line.match(/group-title="([^"]*)"/);
            var logoMatch = line.match(/tvg-logo="([^"]*)"/);
            var tvgIdMatch = line.match(/tvg-id="([^"]*)"/);

            var commaIdx = line.lastIndexOf(',');
            var name = commaIdx >= 0 ? line.substring(commaIdx + 1).trim() : '';

            currentInfo = {
                group: groupMatch ? groupMatch[1] : 'Truyền Hình', // Lấy group gốc để làm mô tả, nếu không có thì mặc định
                logo: logoMatch ? logoMatch[1] : '',
                tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
                name: name,
                index: channelIndex++
            };
            currentUserAgent = '';
        } else if (line.indexOf('#EXTVLCOPT:http-user-agent=') === 0) {
            currentUserAgent = line.substring('#EXTVLCOPT:http-user-agent='.length).trim();
        } else if (line.indexOf('#EXTVLCOPT:') === 0 || line.indexOf('#KODIPROP:') === 0) {
            // Bỏ qua các cấu hình khác của VLC/Kodi
        } else if (line.indexOf('#') === 0) {
            // Bỏ qua comments
        } else if (line.length > 0 && (line.indexOf('http') === 0 || line.indexOf('//') === 0)) {
            if (currentInfo) {
                currentInfo.url = line;
                currentInfo.userAgent = currentUserAgent;
                channels.push(currentInfo);
                currentInfo = null;
                currentUserAgent = '';
            } else {
                currentUserAgent = '';
            }
        }
    }
    return channels;
}

// =============================================================================
// HELPERS
// =============================================================================

function extractParamFromUrl(url, param) {
    if (!url) return "";
    var match = url.match(new RegExp('[?&]' + param + '=([^&]+)'));
    return match ? decodeURIComponent(match[1]) : "";
}

function makeChannelId(channel) {
    if (channel.tvgId) {
        return channel.tvgId;
    }
    return (channel.group || 'unknown') + '::' + (channel.name || '') + '::' + channel.index;
}

function findChannelByIdInList(channels, channelId) {
    for (var i = 0; i < channels.length; i++) {
        if (makeChannelId(channels[i]) === channelId) {
            return channels[i];
        }
    }
    return null;
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var channels = parseM3U(apiResponseJson);

        // Lọc theo từ khóa tìm kiếm (nếu có)
        var searchKeyword = extractParamFromUrl(apiUrl, 'search');
        if (searchKeyword) {
            var keyword = searchKeyword.toLowerCase();
            channels = channels
