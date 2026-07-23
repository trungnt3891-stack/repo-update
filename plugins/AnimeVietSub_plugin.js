// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "animehay",
        "name": "AnimeHay",
        "version": "5.0.0", // Nâng version để App xóa cache bản cũ
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
        { slug: 'phim-moi-cap-nhap/tat-ca', title: 'Mới Cập Nhật', type: 'Grid', path: '' },
        { slug: 'the-loai/anime-1', title: 'Hoạt Hình Anime', type: 'Horizontal', path: '' },
        { slug: 'the-loai/cn-animation-34', title: 'Hoạt Hình Trung Quốc', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới cập nhật', slug: 'phim-moi-cap-nhap/tat-ca' },
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

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://animehay09.site";
    
    if (!slug) slug = "phim-moi-cap-nhap/tat-ca";
    slug = slug.replace(/\.html$/i, "");
    
    // Đối với trang chủ "Mới cập nhật" cấu trúc là: /phim-moi-cap-nhap/tat-ca-1.html
    if (slug === "phim-moi-cap-nhap/tat-ca") {
        return baseUrl + "/" + slug + "-" + page + ".html";
    }
    
    // Đối với thể loại: Trang 1 không có "trang-1", từ trang 2 trở đi mới có
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
    return "https://animehay09.site/" + slug.replace(/^\//, "");
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
    
    // Chặt HTML theo class mc để lấy từng bộ phim, cách này an toàn hơn Regex dài
    var parts = html.split(/class=["'](?:mc|movie-item)["']/i);
    
    for (var i = 1; i < parts.length; i++) {
        var p = parts[i];
        
        var urlM = p.match(/href=["']([^"']+)["']/i);
        var titleM = p.match(/class=["'][^"']*(?:mc__name|name-movie)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var imgM = p.match(/<img[^>]+src=["']([^"']+)["']/i) || p.match(/data-src=["']([^"']+)["']/i);
        var epM = p.match(/class=["'][^"']*(?:mc__ep-badge|episode-latest)[^"']*["'][^>]*>([\s\S]*?)<\//i);
        var scoreM = p.match(/class=["'][^"']*(?:mc__score|score)[^"']*["'][^>]*>([\s\S]*?)<\//i);

        if (urlM && titleM && imgM) {
            var url = urlM[1];
            var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
            
            // Loại bỏ các link vô tình trỏ thẳng vào tập phim
            if (slug.indexOf('xem-phim') !== -1) continue;
            
            movies.push({
                id: slug,
                title: PluginUtils.cleanText(titleM[1]),
                posterUrl: imgM[1],
                backdropUrl: imgM[1],
                quality: scoreM ? PluginUtils.cleanText(scoreM[1]) : "HD",
                episode_current: epM ? PluginUtils.cleanText(epM[1]) : "Full",
                lang: "Vietsub",
                year: 0
            });
        }
    }

    var totalPages = 100; // Cho cuộn thoải mái
    var currentPage = 1;
    var currentMatch = html.match(/class=["'][^"']*active[^"']*["'][^>]*>\s*<a[^>]*>(\d+)/i);
    if (currentMatch) currentPage = parseInt(currentMatch[1]);
    
    return JSON.stringify({
        items: movies,
        pagination: {
            currentPage: currentPage,
            totalPages: totalPages,
            totalItems: 9999,
            itemsPerPage: 20
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i);

        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.replace(/\|\| AnimeHay/gi, "").trim();
        var tapIdx = title.lastIndexOf(" Tập");
        if (tapIdx > 0) title = title.substring(0, tapIdx); // Cắt bỏ chữ " Tập 358" ra khỏi tên phim
        title = title.replace(/^Phim /gi, "").trim();

        var poster = posterM ? posterM[1] : "";
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        // BƯỚC QUAN TRỌNG: Cắt gọn HTML, CHỈ giữ lại khu vực chứa danh sách tập. 
        // Tránh tình trạng ăn vạ sang phần "Phim Tương Tự".
        var epBlock = "";
        var aimIdx = html.indexOf('aim-episodes');
        if (aimIdx !== -1) {
            epBlock = html.substring(aimIdx, html.indexOf('aim-desc', aimIdx) !== -1 ? html.indexOf('aim-desc', aimIdx) : html.length);
        } else {
            var wpIdx = html.indexOf('wp-eplist');
            if (wpIdx !== -1) {
                epBlock = html.substring(wpIdx, html.indexOf('wp-comments-block', wpIdx) !== -1 ? html.indexOf('wp-comments-block', wpIdx) : html.length);
            }
        }

        var episodes = [];
        var seenEps = {};
        
        if (epBlock) {
            var epRegex = /<a[^>]+href=["']([^"']+)["'][^>]*class=["'][^"']*(?:wp-ep|aim-ep-btn)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
            var epM;
            while ((epM = epRegex.exec(epBlock)) !== null) {
                var epUrl = epM[1];
                var rawInner = epM[2];
                var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");

                if (seenEps[epSlug]) continue;
                seenEps[epSlug] = true;

                var titleAttr = epM[0].match(/title=["']([^"']+)["']/i);
                var epDisplay = titleAttr ? PluginUtils.cleanText(titleAttr[1]) : PluginUtils.cleanText(rawInner);
                
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

        // Nếu phim lẻ không có list tập, tìm nút "Xem ngay"
        if (episodes.length === 0) {
            var watchBtn = html.match(/href=["']([^"']+)["'][^>]*class=["'][^"']*aim-btn-watch/i);
            if (watchBtn && watchBtn[1].indexOf('xem-phim') !== -1) {
                var epSlug = watchBtn[1].replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                episodes.push({id: epSlug, name: "Xem Ngay", slug: epSlug});
            }
        }

        // Sắp xếp tập 1 lên đầu
        if (episodes.length > 1) {
            var fM = episodes[0].name.match(/\d+/);
            var lM = episodes[episodes.length-1].name.match(/\d+/);
            if (fM && lM && parseInt(fM[0]) > parseInt(lM[0])) {
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
        var svMatch = html.match(/\$wp_servers\s*=\s*(\{[\s\S]*?\});/);
        
        if (svMatch) {
            var linkRegex = /['"](https?:\/\/[^'"]+)['"]/g;
            var lMatch;
            var links = [];
            while ((lMatch = linkRegex.exec(svMatch[1])) !== null) {
                links.push(lMatch[1]);
            }
            if (links.length > 0) streamUrl = links[0];
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

// =============================================================================
// RECURSIVE EMBED PARSER - BÓC LINK M3U8/MP4 TỪ TRANG IFRAME ĐỂ CHẠY EXOPLAYER
// =============================================================================

function parseEmbedResponse(html, sourceUrl) {
    try {
        var streamUrl = "";

        // 1. Quét tìm link m3u8 lộ thiên trong mã nguồn của trang iframe (ahay.stream / abyssplayer)
        var m3u8Match = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, ""); // Dọn dẹp ký tự escape \/
        }

        // 2. Nếu không có m3u8, thử tìm link mp4
        if (!streamUrl) {
            var mp4Match = html.match(/(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/i);
            if (mp4Match) {
                streamUrl = mp4Match[1].replace(/\\/g, "");
            }
        }

        // 3. Trả về link gốc
        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false, // Báo App đã tìm thấy link direct
                mimeType: streamUrl.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: {
                    "Referer": sourceUrl,
                    "Origin": sourceUrl.split('/').slice(0, 3).join('/'),
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });
        }

        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}
