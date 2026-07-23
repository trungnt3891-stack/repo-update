// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.0.0",
        "baseUrl": "https://tinhlagi.pro",
        "iconUrl": "https://tinhlagi.pro/favicon.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", // Bắt buộc dùng MOVIE để kích hoạt Video Player
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'tivi', title: 'Tất Cả Kênh Tivi', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất cả kênh', slug: 'tivi' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    // Web load toàn bộ kênh trên trang /tivi/
    return "https://tinhlagi.pro/tivi/";
}

function getUrlSearch(keyword, filtersJson) {
    return "https://tinhlagi.pro/tivi/?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return "https://tinhlagi.pro/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS (BÓC TÁCH DỮ LIỆU)
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

function parseListResponse(html) {
    try {
        var channels = [];
        var seen = {};
        
        // Cắt HTML bằng thẻ <a> để lấy tất cả các link trên trang
        var parts = html.split('<a ');
        
        for (var i = 1; i < parts.length; i++) {
            var p = parts[i];
            
            // Lọc ra các link thuộc khu vực tivi
            var hrefM = p.match(/href=["']([^"']*(?:\/tivi\/|\?url=)[^"']*)["']/i);
            var imgM = p.match(/<img[^>]+src=["']([^"']+)["']/i) || p.match(/data-src=["']([^"']+)["']/i);

            if (hrefM && imgM) {
                var url = hrefM[1];
                var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                
                // Trích xuất Tên Kênh
                var rawText = p.substring(p.indexOf('>'), p.indexOf('</a>') !== -1 ? p.indexOf('</a>') : p.length);
                var title = PluginUtils.cleanText(rawText);

                if (!title || title.length < 2) {
                    var titleAttr = p.match(/title=["']([^"']+)["']/i) || imgM[0].match(/alt=["']([^"']+)["']/i);
                    title = titleAttr ? PluginUtils.cleanText(titleAttr[1]) : "Kênh TV";
                }

                // Chống trùng lặp kênh
                if (!seen[slug]) {
                    channels.push({
                        id: slug,
                        title: title,
                        posterUrl: imgM[1],
                        backdropUrl: imgM[1],
                        quality: "HD",
                        episode_current: "Live", // Đánh dấu trực tiếp
                        lang: "Viet",
                        year: 0
                    });
                    seen[slug] = true;
                }
            }
        }

        return JSON.stringify({
            items: channels,
            pagination: {
                currentPage: 1,
                totalPages: 1, // Kênh tivi thường load hết trên 1 trang
                totalItems: channels.length,
                itemsPerPage: 500
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleM = html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "Xem Tivi";
        title = title.split('|')[0].trim(); // Xóa đuôi " | Tinhlagi"

        // Khai báo 1 tập phim duy nhất để app tạo nút Xem
        var episodes = [{
            id: "live",
            name: "Xem Trực Tiếp",
            slug: "live"
        }];

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: "",
            backdropUrl: "",
            description: "Luồng phát sóng trực tiếp. Bấm 'Xem Trực Tiếp' để bắt đầu.",
            servers: [{ name: "Máy chủ Tivi", episodes: episodes }],
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

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var headers = {
            "Referer": "https://tinhlagi.pro/",
            "Origin": "https://tinhlagi.pro"
        };

        // Bóc tách luồng PlayUrl giấu trong script theo chuẩn của Tinhlagi
        var urlMatch = html.match(/tiviPlayUrl\s*=\s*['"]([^'"]+)['"]/i);
        if (urlMatch) {
            streamUrl = urlMatch[1];
        }

        // Bóc tách Header chống chặn (User Agent) nếu web có khai báo
        var uaMatch = html.match(/tiviUA\s*=\s*['"]([^'"]+)['"]/i);
        if (uaMatch) {
            headers["User-Agent"] = uaMatch[1];
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: headers,
                isEmbed: false // VAX sẽ đẩy thẳng m3u8/ts vào ExoPlayer
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

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ"
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
