// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "2.0.0",
        "baseUrl": "https://tinhlagi.pro/tivi",
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'danh-sach', title: 'Tất Cả Kênh Tivi', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Kênh Truyền Hình', slug: 'danh-sach' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    // Tải toàn bộ danh sách kênh từ trang Tivi
    return "https://tinhlagi.pro/tivi";
}

function getUrlSearch(keyword, filtersJson) {
    return "https://tinhlagi.pro/tivi";
}

function getUrlDetail(slug) {
    if (!slug) return "";
    
    // Nếu là luồng bắt link trực tiếp để lấy Headers
    if (slug.indexOf("direct|") === 0) {
        var streamUrl = slug.split("direct|")[1];
        // Tạo URL ảo để server Tinhlagi nhét streamUrl vào biến window.tiviPlayUrl
        return "https://tinhlagi.pro/tivi?url=" + encodeURIComponent(streamUrl) + "&name=Live";
    }
    
    // Nếu là click từ danh sách kênh ngoài trang chủ
    if (slug.indexOf("?url=") === 0) {
        return "https://tinhlagi.pro/tivi" + slug;
    }
    
    if (slug.indexOf("http") === 0) return slug;
    return "https://tinhlagi.pro/" + slug.replace(/^\//, "");
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
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\s+/g, " ")
            .trim();
    }
};

// Hàm này sẽ San Phẳng mọi thứ: Lấy trực tiếp Logo và Tên kênh in ra danh sách
function parseListResponse(html) {
    try {
        var movies = [];
        // Chỉ lấy các nhóm kênh bạn đã chỉ định
        var requiredGroups = ["VTVcab", "VTV", "SCTV", "HTVC", "HTV", "Địa phương", "Thiết yếu"];
        
        var groupBlocks = html.split(/<h2[^>]*class=["'][^"']*group-title[^"']*["'][^>]*>/i);
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            var titleEnd = block.indexOf('</h2>');
            if (titleEnd === -1) continue;
            
            var groupName = PluginUtils.cleanText(block.substring(0, titleEnd)).split('(')[0].trim();
            
            var isRequired = false;
            for (var j = 0; j < requiredGroups.length; j++) {
                if (groupName.indexOf(requiredGroups[j]) !== -1) {
                    isRequired = true;
                    groupName = requiredGroups[j];
                    break;
                }
            }
            if (!isRequired) continue;

            // Bóc tách từng kênh trong nhóm hợp lệ
            var channelParts = block.split(/<a /i);
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["'](\?url=[^"']+)["']/i);
                var imgM = cp.match(/<img[^>]+src=["']([^"']+)["']/i);
                
                if (urlM && imgM) {
                    var rawSlug = urlM[1];
                    var cleanSlug = rawSlug.split('#')[0]; // Dọn dẹp thẻ mỏ neo rác
                    
                    var nameM = cleanSlug.match(/&name=([^&]+)/i);
                    var channelName = nameM ? decodeURIComponent(nameM[1]).replace(/\+/g, " ") : "Kênh Tivi";
                    
                    movies.push({
                        id: cleanSlug,
                        title: "[" + groupName + "] " + channelName,
                        posterUrl: imgM[1],
                        backdropUrl: imgM[1],
                        quality: "LIVE",
                        episode_current: "Trực Tiếp",
                        lang: "Viet",
                        year: 0
                    });
                }
            }
        }
        
        return JSON.stringify({
            items: movies,
            pagination: { currentPage: 1, totalPages: 1, totalItems: movies.length, itemsPerPage: 500 }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// Hàm này thiết kế giao diện bên trong của 1 kênh (Chỉ có tên kênh và 1 nút Bấm Để Xem)
function parseMovieDetail(html) {
    try {
        var titleMatch = html.match(/<h2[^>]*class=["']now-playing["'][^>]*>📺\s*([^<]+)<\/h2>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "Kênh Tivi";

        var streamUrl = "";
        var urlMatch = html.match(/tiviPlayUrl\s*=\s*['"]([^'"]+)['"]/i);
        if (urlMatch) {
            streamUrl = urlMatch[1].replace(/\\/g, "");
        }

        var episodes = [];
        if (streamUrl) {
            episodes.push({
                id: "direct|" + streamUrl, // Dấu hiệu để App chuyển sang getUrlDetail và lấy Header
                name: "Xem Trực Tiếp",
                slug: "live"
            });
        }

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: "https://tinhlagi.pro/tinhlagi.ico",
            backdropUrl: "https://tinhlagi.pro/tinhlagi.ico",
            description: "Đang phát sóng trực tiếp kênh " + title + " trên máy chủ tốc độ cao.",
            servers: episodes.length > 0 ? [{ name: "Máy chủ Tivi", episodes: episodes }] : [],
            quality: "LIVE",
            lang: "Viet",
            year: 0,
            rating: 0,
            category: "Truyền Hình",
            status: "Đang phát sóng"
        });
    } catch (e) {
        return "null";
    }
}

// Bóc tách URL luồng phát và Header chống chặn FPTPlay/VieON
function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var headers = {
            "Referer": "https://tinhlagi.pro/",
            "Origin": "https://tinhlagi.pro",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        };

        var urlMatch = html.match(/tiviPlayUrl\s*=\s*['"]([^'"]+)['"]/i);
        if (urlMatch) {
            streamUrl = urlMatch[1].replace(/\\/g, "");
        }

        var uaMatch = html.match(/tiviUA\s*=\s*['"]([^'"]+)['"]/i);
        if (uaMatch) {
            headers["User-Agent"] = uaMatch[1];
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: headers,
                isEmbed: false // Phóng thẳng m3u8 vào Trình Phát Video
            });
        }
        return JSON.stringify({});
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// =============================================================================
// CÁC HÀM BẮT BUỘC KHÁC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ" TRÊN TIVI
// =============================================================================
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
