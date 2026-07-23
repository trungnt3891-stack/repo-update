// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "animehay",
        "name": "AnimeHay",
        "version": "1.0.5",
        "baseUrl": "https://animehay09.site", // Có thể đổi thành animehay10.site, animehay11.site... nếu bị nhà mạng chặn
        "iconUrl": "https://animehay09.site/themes/img/logo.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto" 
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: '' },
        { slug: 'anime-dang-chieu', title: 'Anime Đang Chiếu', type: 'Horizontal', path: '' },
        { slug: 'anime-hoan-thanh', title: 'Anime Trọn Bộ', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới cập nhật', slug: 'phim-moi-cap-nhat' },
        { name: 'Đang chiếu', slug: 'anime-dang-chieu' },
        { name: 'Hoàn thành', slug: 'anime-hoan-thanh' },
        { name: 'Hành Động', slug: 'the-loai/hanh-dong-2' },
        { name: 'Hài Hước', slug: 'the-loai/hai-huoc-3' },
        { name: 'Tình Cảm', slug: 'the-loai/tinh-cam-4' },
        { name: 'Viễn Tưởng', slug: 'the-loai/vien-tuong-33' },
        { name: 'Học Đường', slug: 'the-loai/hoc-duong-9' },
        { name: 'Phiêu Lưu', slug: 'the-loai/phieu-luu-28' },
        { name: 'Kinh Dị', slug: 'the-loai/kinh-di-29' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong-37' },
        { name: 'CN Animation', slug: 'the-loai/cn-animation-34' },
        { name: 'Tiên Hiệp', slug: 'the-loai/tien-hiep-35' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://animehay09.site";
    
    // Trang chủ
    if (!slug || slug === '') {
        return baseUrl + "/phim-moi-cap-nhat/trang-" + page + ".html";
    }
    
    // Xử lý slug danh mục hoặc thể loại
    if (slug.indexOf("the-loai") !== -1) {
        return baseUrl + "/" + slug + "/trang-" + page + ".html"; // VD: /the-loai/hanh-dong-2.html -> .../hanh-dong-2/trang-1.html
    }
    
    return baseUrl + "/" + slug + "/trang-" + page + ".html";
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://animehay09.site/tim-kiem/" + encodeURIComponent(keyword) + "/trang-" + page + ".html";
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return "https://animehay09.site/" + slug;
}

function getUrlCategories() { return "https://animehay09.site/"; }
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

function parseListResponse(html) {
    var movies = [];
    
    var itemRegex = /<div[^>]*class="[^"]*movie-item[^"]*"[^>]*>([\s\S]*?)<\/a>\s*<\/div>/gi;
    var match;
    
    while ((match = itemRegex.exec(html)) !== null) {
        var innerHtml = match[1];
        
        var linkMatch = innerHtml.match(/href="([^"]+)"/i);
        if (!linkMatch) continue;
        
        var fullUrl = linkMatch[1];
        var slug = fullUrl.replace(/https?:\/\/[^\/]+\//, "");
        
        var imgMatch = innerHtml.match(/<img[^>]+src="([^"]+)"/i);
        var thumb = imgMatch ? imgMatch[1] : "";
        
        var titleMatch = innerHtml.match(/<div[^>]*class="[^"]*name-movie[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "Đang cập nhật";
        
        var epMatch = innerHtml.match(/<div[^>]*class="[^"]*episode-latest[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        var episode = epMatch ? PluginUtils.cleanText(epMatch[1]) : "Full";
        
        movies.push({
            id: slug,
            title: title,
            posterUrl: thumb,
            backdropUrl: thumb,
            year: 0,
            quality: "HD",
            episode_current: episode,
            lang: "Vietsub"
        });
    }

    // Xử lý phân trang
    var totalPages = 1;
    var currentPage = 1;
    
    var currentMatch = html.match(/<li[^>]*class="[^"]*active[^"]*"[^>]*>\s*<a[^>]*>(\d+)<\/a>/i);
    if (currentMatch) currentPage = parseInt(currentMatch[1]);
    
    var pageRegex = /trang-(\d+)\.html/g;
    var pageMatch;
    while ((pageMatch = pageRegex.exec(html)) !== null) {
        var p = parseInt(pageMatch[1]);
        if (p > totalPages) totalPages = p;
    }

    return JSON.stringify({
        items: movies,
        pagination: {
            currentPage: currentPage,
            totalPages: totalPages,
            totalItems: movies.length,
            itemsPerPage: 20
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        // Lấy thông tin Metadata
        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]).replace(/ \|\| AnimeHay/g, "").replace(/Phim /g, "") : "";

        var imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = imgMatch ? imgMatch[1] : "";

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<meta name="description" content="([^"]+)"/i);
        var description = descMatch ? PluginUtils.cleanText(descMatch[1]) : "";

        // Bóc tách Danh sách Tập (Quét cả giao diện Xem Phim wp-ep lẫn giao diện aim-ep-btn)
        var episodes = [];
        var seenEps = {}; 
        
        var epRegex = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*(?:wp-ep|aim-ep-btn)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
        var epM;
        
        while ((epM = epRegex.exec(html)) !== null) {
            var epUrl = epM[1];
            var epDisplay = PluginUtils.cleanText(epM[2]);
            var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//, "");

            if (!seenEps[epSlug]) {
                episodes.push({
                    id: epSlug,
                    name: "Tập " + epDisplay,
                    slug: epSlug
                });
                seenEps[epSlug] = true;
            }
        }

        if (episodes.length > 0) {
            episodes.reverse();
        }

        var servers = [];
        if (episodes.length > 0) {
            servers.push({ name: "Server AnimeHay", episodes: episodes });
        }

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: description,
            servers: servers,
            quality: "HD",
            lang: "Vietsub",
            year: 0,
            rating: 0,
            category: "",
            status: episodes.length > 0 ? (episodes.length + " Tập") : "Đang cập nhật"
        });
    } catch (e) {
        return "null";
    }
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";

        // Trích xuất mảng biến $wp_servers được giấu trong thẻ Script
        var svMatch = html.match(/\$wp_servers\s*=\s*(\{[\s\S]*?\});/);
        if (svMatch) {
            var linkMatch = svMatch[1].match(/['"](https?:\/\/[^'"]+)['"]/);
            if (linkMatch) {
                streamUrl = linkMatch[1];
            }
        }

        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) {
                streamUrl = iframeMatch[1];
                if (streamUrl.indexOf("//") === 0) streamUrl = "https:" + streamUrl;
            }
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { "Referer": "https://animehay09.site/" },
                isEmbed: true 
            });
        }
        
        return "{}";
    } catch (e) {
        return "{}";
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
