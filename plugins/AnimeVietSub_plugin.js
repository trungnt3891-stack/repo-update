// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "animehay",
        "name": "AnimeHay",
        "version": "3.0.0", // Nâng version lên để App xóa cache cũ
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
    
    if (!slug) slug = "phim-moi-cap-nhat";
    slug = slug.replace(/\.html$/i, ""); // Xóa đuôi .html nếu lỡ dính
    
    // Nếu là trang chủ
    if (slug === "phim-moi-cap-nhat" || slug === "anime-dang-chieu" || slug === "anime-hoan-thanh") {
        return baseUrl + "/" + slug + "/trang-" + page + ".html";
    }
    
    // Thể loại (cần tải trang 1 bằng link gốc)
    if (page === 1) {
        return baseUrl + "/" + slug + ".html";
    } else {
        return baseUrl + "/" + slug + "/trang-" + page + ".html";
    }
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
    
    // Sử dụng split để băm nhỏ HTML, tránh 100% lỗi regex lồng tag
    var blocks = html.split('class="mc"');
    
    for (var i = 1; i < blocks.length; i++) {
        var block = blocks[i];
        
        // Quét cục bộ trong từng block
        var urlMatch = block.match(/href=["']([^"']+)["']/i);
        var titleMatch = block.match(/class=["']mc__name["'][^>]*>([^<]+)</i);
        var imgMatch = block.match(/<img[^>]+src=["']([^"']+)["']/i) || block.match(/data-src=["']([^"']+)["']/i);
        var epMatch = block.match(/class=["']mc__ep-badge["'][^>]*>([^<]+)</i);
        var scoreMatch = block.match(/class=["']mc__score["'][^>]*>([^<]+)</i);
        
        if (urlMatch && titleMatch) {
            var url = urlMatch[1];
            var slug = url.replace(/https?:\/\/[^\/]+\//i, ""); // Lấy đuôi làm id
            
            movies.push({
                id: slug,
                title: PluginUtils.cleanText(titleMatch[1]),
                posterUrl: imgMatch ? imgMatch[1] : "",
                backdropUrl: imgMatch ? imgMatch[1] : "",
                quality: scoreMatch ? PluginUtils.cleanText(scoreMatch[1]) : "HD",
                episode_current: epMatch ? PluginUtils.cleanText(epMatch[1]) : "Đang cập nhật",
                lang: "Vietsub",
                year: 0
            });
        }
    }

    // Tự động fake page để cuộn vô hạn cho mượt
    var totalPages = 100; 
    var currentMatch = html.match(/class="[^"]*active[^"]*"[^>]*>\s*<a[^>]*>(\d+)/i);
    var currentPage = currentMatch ? parseInt(currentMatch[1]) : 1;

    return JSON.stringify({
        items: movies,
        pagination: {
            currentPage: currentPage,
            totalPages: totalPages,
            totalItems: 2000,
            itemsPerPage: 20
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        // Thông tin Metadata
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i);

        var title = titleM ? PluginUtils.cleanText(titleM[1]).replace(/ \|\| AnimeHay/g, "").replace(/Phim /gi, "") : "";
        var poster = posterM ? posterM[1] : "";
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        var episodes = [];
        var seenEps = {};
        
        // Quét siêu chính xác: chặt HTML theo từ khóa href= để gom MỌI link
        var parts = html.split(/href=["']/i);
        for(var i = 1; i < parts.length; i++) {
            var p = parts[i];
            var endQuote = p.indexOf('"');
            if (endQuote === -1) endQuote = p.indexOf("'");
            if (endQuote === -1) continue;
            
            var url = p.substring(0, endQuote);
            
            // Chỉ lấy các link chứa cấu trúc /xem-phim/ 
            if (url.indexOf('/xem-phim/') !== -1 && url.indexOf('.html') !== -1) {
                var epSlug = url.replace(/https?:\/\/[^\/]+\//i, "");
                
                if (seenEps[epSlug]) continue;
                seenEps[epSlug] = true;

                // Tìm text Tên Tập (Ưu tiên thuộc tính title="Tập X")
                var epDisplay = "";
                var titleAttr = p.match(/^[^>]*title=["']([^"']+)["']/i);
                
                if (titleAttr) {
                    epDisplay = titleAttr[1];
                } else {
                    // Fallback móc số tập từ chuỗi span
                    var spanM = p.match(/^[^>]*>[\s\S]*?<span>([^<]+)<\/span>/i);
                    if (spanM) epDisplay = "Tập " + spanM[1];
                    else {
                        var numMatch = epSlug.match(/-tap-(\d+)/i);
                        epDisplay = numMatch ? "Tập " + numMatch[1] : "Tập 1";
                    }
                }
                
                epDisplay = PluginUtils.cleanText(epDisplay);
                if (epDisplay.indexOf("Tập") === -1 && epDisplay.indexOf("Tap") === -1) {
                    epDisplay = "Tập " + epDisplay;
                }
                
                episodes.push({ 
                    id: epSlug, 
                    name: epDisplay, 
                    slug: epSlug 
                });
            }
        }
        
        // Tự động sắp xếp xuôi từ Tập 1 (Nếu animehay vứt tập 358 lên đầu)
        if (episodes.length > 1) {
            var firstM = episodes[0].name.match(/\d+/);
            var lastM = episodes[episodes.length-1].name.match(/\d+/);
            if (firstM && lastM && parseInt(firstM[0]) > parseInt(lastM[0])) {
                episodes.reverse();
            }
        }

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: episodes.length > 0 ? [{ name: "Server AnimeHay", episodes: episodes }] : [],
            quality: "HD",
            lang: "Vietsub",
            year: 0,
            rating: 0,
            category: "",
            status: episodes.length > 0 ? episodes.length + " Tập" : "Đang cập nhật"
        });
    } catch (e) {
        return "null";
    }
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";

        // Trích xuất biến $wp_servers giấu trong <script>
        var svMatch = html.match(/\$wp_servers\s*=\s*(\{[\s\S]*?\});/);
        if (svMatch) {
            var linkRegex = /['"](https?:\/\/[^'"]+)['"]/g;
            var lMatch;
            var links = [];
            while ((lMatch = linkRegex.exec(svMatch[1])) !== null) {
                links.push(lMatch[1]);
            }
            if (links.length > 0) streamUrl = links[0]; // Cầm link mượt nhất
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
                isEmbed: true  // Nhờ App VAX bung Iframe lấy HLS m3u8
            });
        }
        return "{}";
    } catch (e) {
        return "{}";
    }
}
