// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "animehay",
        "name": "AnimeHay",
        "version": "2.0.0",
        "baseUrl": "https://animehay09.site",
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
        { slug: 'phim-moi-cap-nhat', title: 'Mới Cập Nhật', type: 'Grid', path: '' },
        { slug: 'anime-dang-chieu', title: 'Đang Chiếu', type: 'Horizontal', path: '' },
        { slug: 'anime-hoan-thanh', title: 'Trọn Bộ', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới cập nhật', slug: 'phim-moi-cap-nhat' },
        { name: 'Anime', slug: 'the-loai/anime-1' },
        { name: 'Hành Động', slug: 'the-loai/hanh-dong-2' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong-37' },
        { name: 'Harem', slug: 'the-loai/harem-5' },
        { name: 'Hài Hước', slug: 'the-loai/hai-huoc-3' },
        { name: 'Tình Cảm', slug: 'the-loai/tinh-cam-4' },
        { name: 'Viễn Tưởng', slug: 'the-loai/vien-tuong-33' },
        { name: 'Học Đường', slug: 'the-loai/hoc-duong-9' },
        { name: 'Kinh Dị', slug: 'the-loai/kinh-di-29' },
        { name: 'Tiên Hiệp', slug: 'the-loai/tien-hiep-35' },
        { name: 'CN Animation', slug: 'the-loai/cn-animation-34' }
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
    
    if (!slug || slug === '') {
        slug = "phim-moi-cap-nhat";
    }
    
    // Đề phòng slug dính đuôi .html, ta xóa nó đi trước khi ghép trang
    slug = slug.replace(".html", "");
    
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

function parseListResponse(html) {
    var movies = [];
    
    // Cập nhật Regex theo cấu trúc mới: <a class="mc__link" ...
    var itemRegex = /<a[^>]+class="[^"]*mc__link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    var match;
    
    while ((match = itemRegex.exec(html)) !== null) {
        var fullUrl = match[1];
        var innerHtml = match[2];
        
        var slug = fullUrl.replace(/https?:\/\/[^\/]+\//, ""); 
        
        var imgMatch = innerHtml.match(/<img[^>]+src="([^"]+)"/i) || innerHtml.match(/<img[^>]+data-src="([^"]+)"/i);
        var thumb = imgMatch ? imgMatch[1] : "";
        
        var titleMatch = innerHtml.match(/class="[^"]*mc__name[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "";
        
        var epMatch = innerHtml.match(/class="[^"]*mc__ep-badge[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
        var episode = epMatch ? PluginUtils.cleanText(epMatch[1]) : "Full";
        
        var scoreMatch = innerHtml.match(/class="[^"]*mc__score[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        var score = scoreMatch ? PluginUtils.cleanText(scoreMatch[1]) : "HD";
        
        if (title && slug) {
            movies.push({
                id: slug,
                title: title,
                posterUrl: thumb,
                backdropUrl: thumb,
                year: 0,
                quality: score, // Dùng field quality để hiển thị điểm số (⭐ 8.9) lên góc ảnh
                episode_current: episode,
                lang: "Vietsub"
            });
        }
    }

    // Xử lý đếm số trang
    var totalPages = 1;
    var currentPage = 1;
    
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
            totalPages: totalPages > 0 ? totalPages : 1,
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
        var titleMatch = html.match(/<h1[^>]*class="[^"]*aim-hero__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]).replace(/ \|\| AnimeHay/g, "").replace(/Phim /g, "") : "";

        var imgMatch = html.match(/<img[^>]+id="aim-poster-img"[^>]+src="([^"]+)"/i) || html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = imgMatch ? imgMatch[1] : "";

        var descMatch = html.match(/<div[^>]*class="[^"]*aim-desc__content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || html.match(/<meta property="og:description" content="([^"]+)"/i);
        var description = descMatch ? PluginUtils.cleanText(descMatch[1]) : "";

        var episodes = [];
        var seenEps = {};
        
        // Quét các nút tập phim (aim-ep-btn ở trang thông tin HOẶC wp-ep ở trang xem)
        var epRegex = /<a[^>]+href="([^"]+)"[^>]*class="[^"]*(?:wp-ep|aim-ep-btn)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
        var epM;
        
        while ((epM = epRegex.exec(html)) !== null) {
            var epUrl = epM[1];
            var rawInner = epM[2];
            
            // Ưu tiên lấy chữ trong thẻ title="Tập 357", nếu không có thì lấy số bên trong HTML
            var epTitleMatch = epM[0].match(/title="([^"]+)"/i);
            var epDisplay = epTitleMatch ? PluginUtils.cleanText(epTitleMatch[1]) : PluginUtils.cleanText(rawInner);
            
            if (epDisplay.indexOf("Tập") === -1) {
                epDisplay = "Tập " + epDisplay;
            }

            var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//, "");

            if (!seenEps[epSlug]) {
                episodes.push({
                    id: epSlug,
                    name: epDisplay,
                    slug: epSlug
                });
                seenEps[epSlug] = true;
            }
        }

        if (episodes.length > 0) {
            // Kiểm tra thông minh: Nếu web xếp Tập mới nhất (số to) lên trên cùng, ta đảo ngược nó lại cho đúng chuẩn
            var firstEpName = episodes[0].name.replace(/\D/g,'');
            var lastEpName = episodes[episodes.length - 1].name.replace(/\D/g,'');
            if (firstEpName && lastEpName && parseInt(firstEpName) > parseInt(lastEpName)) {
                episodes.reverse();
            }
            
            var servers = [];
            servers.push({ name: "Server AnimeHay", episodes: episodes });
        }

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: description,
            servers: servers || [],
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

        // Trích xuất mảng biến $wp_servers được giấu trong thẻ Script (chứa link m3u8 / iframe vip)
        var svMatch = html.match(/\$wp_servers\s*=\s*(\{[\s\S]*?\});/);
        if (svMatch) {
            var linkRegex = /['"](https?:\/\/[^'"]+)['"]/g;
            var lMatch;
            var links = [];
            while ((lMatch = linkRegex.exec(svMatch[1])) !== null) {
                links.push(lMatch[1]);
            }
            // Lấy link máy chủ đầu tiên
            if (links.length > 0) {
                streamUrl = links[0];
            }
        }

        // Nếu kịch bản trên thất bại, lấy iframe lộ thiên trên web
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
                isEmbed: true  // Cho App biết đây là link iframe để App gọi WebView xử lý
            });
        }
        
        return "{}";
    } catch (e) {
        return "{}";
    }
}
