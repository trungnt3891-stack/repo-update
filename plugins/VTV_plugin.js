// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "full_iptv_bundle",
        "name": "Full IPTV Bundle (TV365 + VMT + VietNga)",
        "version": "5.0.0",
        "baseUrl": "https://raw.githubusercontent.com/TV365-VN/TV365-DATA/main/error.m3u",
        "iconUrl": "https://raw.githubusercontent.com/hieu-TQS/LOGO-IPTV/main/1.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

// ... [Giữ nguyên getHomeSections và getPrimaryCategories như trước] ...

// =============================================================================
// URL GENERATION & MULTI-SOURCE ROUTING (CẬP NHẬT)
// =============================================================================

var SOURCE_TV365 = "https://raw.githubusercontent.com/TV365-VN/TV365-DATA/main/error.m3u";
var SOURCE_VMT = "https://1.org.vn/vmttv";
var SOURCE_VIETNGA = "http://vietngatv.short.gy/vietngatv"; // Nguồn mới

function getUrlList(slug, filtersJson) {
    // Nhận diện nguồn dựa trên slug
    var vmtSlugs = ['su-kien', 'bong-da-quoc-te', 'the-thao-quoc-te', 'tvb', 'rap-phim', 'live-events'];
    var vietNgaSlugs = ['kenh-viet-nga', 'nha-dai-nga', 'vtv-vn']; // Bạn có thể tùy chỉnh slug này
    
    if (vmtSlugs.indexOf(slug) >= 0) {
        return SOURCE_VMT + (slug !== 'all' ? "?cat=" + encodeURIComponent(slug) : "");
    }
    if (vietNgaSlugs.indexOf(slug) >= 0) {
        return SOURCE_VIETNGA + (slug !== 'all' ? "?cat=" + encodeURIComponent(slug) : "");
    }
    
    return SOURCE_TV365 + (slug && slug !== 'all' ? "?cat=" + encodeURIComponent(slug) : "");
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    
    var decoded = decodeURIComponent(slug);
    // Phân loại chi tiết theo nguồn
    if (decoded.indexOf('VMT||') === 0) return SOURCE_VMT + "?id=" + encodeURIComponent(slug);
    if (decoded.indexOf('VIETNGA||') === 0) return SOURCE_VIETNGA + "?id=" + encodeURIComponent(slug);
    
    return SOURCE_TV365 + "?id=" + encodeURIComponent(slug);
}

// =============================================================================
// PARSERS (CẬP NHẬT FLAG)
// =============================================================================

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var channels = parseM3U(apiResponseJson);
        // Xác định nguồn để gắn cờ ID
        var sourceFlag = "TV365";
        if (apiUrl.indexOf("1.org.vn/vmttv") >= 0) sourceFlag = "VMT";
        else if (apiUrl.indexOf("vietngatv") >= 0) sourceFlag = "VIETNGA";

        // ... [Giữ nguyên logic filter và map như cũ] ...
        
        var allItems = channels.map(function (channel) {
            return {
                id: makeChannelId(channel, sourceFlag),
                title: channel.name,
                posterUrl: channel.logo || "https://raw.githubusercontent.com/hieu-TQS/LOGO-IPTV/main/1.png",
                quality: channel.licenseType ? "VIP" : "LIVE",
                episode_current: channel.group || "Live",
                lang: "Việt/Nga"
            };
        });
        return JSON.stringify({ items: allItems, pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length, itemsPerPage: 5000 }});
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

// =============================================================================
// HELPERS (LƯU Ý THAY ĐỔI NHỎ)
// =============================================================================

function makeChannelId(channel, sourceFlag) {
    var base = channel.tvgId ? channel.tvgId : (channel.group + '::' + channel.name + '::' + channel.index);
    return encodeURIComponent(sourceFlag + '||' + base);
}

// ... [Giữ nguyên các hàm parse còn lại: parseMovieDetail, parseDetailResponse, ...] ...
