// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vietxiaomi_iptv",
        "name": "VietXiaomi IPTV",
        "version": "6.0.0",
        "baseUrl": "http://tinyurl.com/vietxiaomi",
        "iconUrl": "https://raw.githubusercontent.com/hieu-TQS/LOGO-IPTV/main/1.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'all', title: 'Tất cả kênh', type: 'Grid', path: 'vietxiaomi_iptv' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất cả', slug: 'all' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

var SINGLE_SOURCE = "http://tinyurl.com/vietxiaomi";

function getUrlList(slug, filtersJson) {
    return SINGLE_SOURCE;
}

function getUrlSearch(keyword, filtersJson) {
    return SINGLE_SOURCE + "?search=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return SINGLE_SOURCE + "?id=" + encodeURIComponent(slug);
}

// =============================================================================
// PARSERS (Sử dụng trực tiếp nguồn VietXiaomi)
// =============================================================================

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var channels = parseM3U(apiResponseJson);
        var allItems = channels.map(function (channel) {
            return {
                id: encodeURIComponent(channel.name + '::' + channel.url),
                title: channel.name,
                posterUrl: channel.logo || "https://raw.githubusercontent.com/hieu-TQS/LOGO-IPTV/main/1.png",
                quality: "LIVE",
                episode_current: channel.group || "Live",
                lang: "Việt"
            };
        });
        return JSON.stringify({
            items: allItems,
            pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length, itemsPerPage: 5000 }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseMovieDetail(apiResponseJson, apiUrl) {
    try {
        var channels = parseM3U(apiResponseJson);
        var id = decodeURIComponent(extractParamFromUrl(apiUrl, 'id'));
        var channel = channels.filter(function(ch) { return (ch.name + '::' + ch.url) === id; })[0];
        
        if (!channel) return "null";

        return JSON.stringify({
            id: id,
            title: channel.name,
            posterUrl: channel.logo || "",
            servers: [{
                name: "Main Server",
                episodes: [{ id: channel.url, name: channel.name, slug: "stream" }]
            }]
        });
    } catch (error) { return "null"; }
}

// ... [Giữ nguyên các hàm parseM3U, parseDetailResponse, và helpers cũ] ...
