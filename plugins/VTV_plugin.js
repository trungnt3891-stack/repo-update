// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "TinhLàGì TV",
        "version": "1.0.0",
        "baseUrl": "https://tinhlagi.pro",
        "iconUrl": "https://tinhlagi.pro/favicon.ico", // Thay bằng icon thực tế của web
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", // Vẫn dùng MOVIE để App nhận diện Video Player
        "layoutType": "VERTICAL",
        "playerType": "auto" 
    });
}

function getHomeSections() {
    // Phân loại các mục Tivi trên trang chủ
    return JSON.stringify([
        { slug: 'vtv', title: 'Kênh VTV', type: 'Grid', path: '' },
        { slug: 'htv', title: 'Kênh HTV', type: 'Grid', path: '' },
        { slug: 'quoc-te', title: 'Quốc Tế', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'VTV', slug: 'vtv' },
        { name: 'HTV', slug: 'htv' },
        { name: 'Quốc Tế', slug: 'quoc-te' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    // Tùy thuộc vào việc web load kênh theo URL nào. 
    // Giả sử họ gom chung trên 1 trang:
    return "https://tinhlagi.pro/tivi/"; 
}

function getUrlSearch(keyword, filtersJson) {
    return "https://tinhlagi.pro/tivi/?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    // Slug ở đây chính là link xem kênh tivi
    return "https://tinhlagi.pro/tivi/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "").trim();
    }
};

function parseListResponse(html) {
    var channels = [];
    
    // ĐOẠN NÀY CẦN MÃ HTML THỰC TẾ CỦA WEB ĐỂ VIẾT REGEX HOẶC SPLIT
    // Dưới đây là logic giả lập dựa trên giao diện bạn chụp:
    
    /*
    var parts = html.split('class="channel-item"'); // Class giả định
    for (var i = 1; i < parts.length; i++) {
        // Trích xuất Link, Logo, Tên Kênh...
        channels.push({
            id: slugKenh,
            title: tenKenh, // VD: "HBO"
            posterUrl: logoKenh,
            backdropUrl: logoKenh,
            quality: "HD",
            episode_current: "Trực Tiếp",
            lang: "Thuyết Minh",
            year: 0
        });
    }
    */

    return JSON.stringify({
        items: channels,
        pagination: { currentPage: 1, totalPages: 1, totalItems: channels.length, itemsPerPage: 100 }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    // Khai báo kênh Tivi như 1 bộ phim có 1 tập duy nhất
    try {
        var episodes = [];
        
        // Truyền thẳng Slug của kênh làm ID tập phim
        episodes.push({
            id: "ID_LUONG_PHAT", // ID này sẽ được truyền vào hàm parseDetailResponse
            name: "Xem Trực Tiếp",
            slug: "xem-truc-tiep"
        });

        return JSON.stringify({
            id: "",
            title: "Tên Kênh Tivi", 
            posterUrl: "",
            backdropUrl: "",
            description: "Đang phát sóng trực tiếp",
            servers: [{ name: "Máy chủ TinhLagì", episodes: episodes }],
            quality: "HD",
            lang: "",
            year: 0,
            rating: 0,
            category: "Live TV",
            status: "Trực Tiếp"
        });
    } catch (e) {
        return "null";
    }
}

function parseDetailResponse(html) {
    // Tách link m3u8 từ trang xem của kênh đó
    try {
        var streamUrl = "";
        
        // CHỖ NÀY CẦN HTML ĐỂ BÓC LINK M3U8
        // var m3u8Match = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
        
        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { 
                    "Referer": "https://tinhlagi.pro/",
                    "Origin": "https://tinhlagi.pro",
                    "User-Agent": "Mozilla/5.0"
                },
                isEmbed: false 
            });
        }
        return JSON.stringify({});
    } catch (e) {
        return JSON.stringify({});
    }
}

// Các hàm bắt buộc (Tránh lỗi File không hợp lệ)
function parseEmbedResponse(html, sourceUrl) { return JSON.stringify({ url: "", isEmbed: false }); }
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
