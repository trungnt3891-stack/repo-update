// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "4.0.0", // Cập nhật version để App xóa cache
        "baseUrl": "https://yanhh3d.ac", 
        "iconUrl": "https://yanhh3d.ac/wp-content/uploads/2023/01/cropped-logo-1-192x192.png", 
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
        { slug: 'the-loai/tien-hiep', title: 'Tiên Hiệp', type: 'Horizontal', path: '' },
        { slug: 'the-loai/huyen-huyen', title: 'Huyền Huyễn', type: 'Horizontal', path: '' },
        { slug: 'the-loai/xuyen-khong', title: 'Xuyên Không', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'phim-moi-cap-nhat' },
        { name: 'Hoàn Thành', slug: 'phim-hoan-thanh' },
        { name: 'Tiên Hiệp', slug: 'the-loai/tien-hiep' },
        { name: 'Huyền Huyễn', slug: 'the-loai/huyen-huyen' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong' },
        { name: 'Trùng Sinh', slug: 'the-loai/trung-sinh' },
        { name: 'Hài Hước', slug: 'the-loai/hai-huoc' },
        { name: 'Cổ Trang', slug: 'the-loai/co-trang' },
        { name: 'Hành Động', slug: 'the-loai/hanh-dong' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var baseUrl = "https://yanhh3d.ac";
    
    if (!slug) slug = "phim-moi-cap-nhat";
    slug = slug.replace(/\.html$/i, "");
    
    if (page === 1) {
        return baseUrl + "/" + slug;
    } else {
        return baseUrl + "/" + slug + "/page/" + page;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://yanhh3d.ac/page/" + page + "?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return "https://yanhh3d.ac/" + slug.replace(/^\//, "");
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

// ĐÃ KHÔI PHỤC LẠI HÀM CŨ HOẠT ĐỘNG HOÀN HẢO CHO TRANG CHỦ
function parseListResponse(html) {
    var movies = [];
    var parts = html.split('<a ');
    
    for (var i = 1; i < parts.length; i++) {
        var p = parts[i];
        
        var endA = p.indexOf('</a>');
        if (endA !== -1) p = p.substring(0, endA);
        
        var urlM = p.match(/href=["']([^"']+)["']/i);
        var titleM = p.match(/title=["']([^"']+)["']/i) || p.match(/>([^<]+)</i);
        var imgM = p.match(/<img[^>]+src=["']([^"']+)["']/i) || p.match(/data-src=["']([^"']+)["']/i);
        var epM = p.match(/class=["'][^"']*(?:episode|status|label)[^"']*["'][^>]*>([\s\S]*?)<\//i);

        if (urlM && titleM && imgM) {
            var url = urlM[1];
            if (url.indexOf('/the-loai/') !== -1 || url.indexOf('/page/') !== -1 || url.indexOf('?s=') !== -1) continue;
            
            var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
            var titleText = PluginUtils.cleanText(titleM[1]);
            
            if (imgM[1].indexOf('avatar') !== -1 || !titleText) continue;

            movies.push({
                id: slug,
                title: titleText,
                posterUrl: imgM[1],
                backdropUrl: imgM[1],
                quality: "HD",
                episode_current: epM ? PluginUtils.cleanText(epM[1]) : "Cập nhật",
                lang: "Vietsub/TM",
                year: 0
            });
        }
    }

    var totalPages = 1;
    var currentPage = 1;
    var currentMatch = html.match(/class=["'][^"']*current[^"']*["'][^>]*>(\d+)</i);
    if (currentMatch) {
        currentPage = parseInt(currentMatch[1], 10);
    }
    
    var pageRegex = /\/page\/(\d+)/gi;
    var pageMatch;
    while ((pageMatch = pageRegex.exec(html)) !== null) {
        var pageNum = parseInt(pageMatch[1], 10);
        if (pageNum > totalPages) totalPages = pageNum;
    }

    return JSON.stringify({
        items: movies,
        pagination: {
            currentPage: currentPage,
            totalPages: totalPages > 0 ? totalPages : 1,
            totalItems: 9999,
            itemsPerPage: 20
        }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// BỘ CÀO TẬP PHIM CHUYÊN SÂU THEO TAB (THUYẾT MINH / VIETSUB)
function parseMovieDetail(html) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        var servers = [];
        
        // Chia HTML theo các tab "Thuyết Minh" và "Vietsub"
        var tmPart = html;
        var vsPart = "";
        var splitVS = html.split(/id=["'][^"']*vietsub[^"']*["']|class=["'][^"']*vietsub[^"']*["']/i);
        
        if (splitVS.length > 1) {
            tmPart = splitVS[0];
            vsPart = splitVS[1];
        }

        // Cỗ máy hút tập phim từ HTML cục bộ
        function extractEps(block) {
            var episodes = [];
            var seenEps = {};
            var aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            var aMatch;
            
            while ((aMatch = aRegex.exec(block)) !== null) {
                var epUrl = aMatch[1];
                var rawInner = aMatch[2];
                var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");

                // Bỏ qua các link nhiễu
                if (epUrl.indexOf('/the-loai') !== -1 || epUrl.indexOf('?s=') !== -1 || epUrl.indexOf('page') !== -1) continue;

                var epDisplay = PluginUtils.cleanText(rawInner);
                
                // Điều kiện để được coi là Nút Tập Phim: Text ngắn gọn, không chứa các từ sai lệch
                if (epDisplay.length > 0 && epDisplay.length <= 20 && epDisplay.toLowerCase().indexOf('xem') === -1) {
                    
                    // Nếu là số trống không thì thêm chữ "Tập" vào cho đẹp
                    if (!isNaN(epDisplay) || (epDisplay.indexOf('Tập') === -1 && epDisplay.indexOf('Tap') === -1)) {
                        epDisplay = "Tập " + epDisplay;
                    }
                    
                    if (!seenEps[epSlug]) {
                        episodes.push({ id: epSlug, name: epDisplay, slug: epSlug });
                        seenEps[epSlug] = true;
                    }
                }
            }
            
            // Sắp xếp tự động xuôi từ Tập 1
            if (episodes.length > 1) {
                var fM = episodes[0].name.match(/\d+/);
                var lM = episodes[episodes.length-1].name.match(/\d+/);
                if (fM && lM && parseInt(fM[0], 10) > parseInt(lM[0], 10)) {
                    episodes.reverse();
                }
            }
            return episodes;
        }

        // Nhồi các tập phim đã bóc được vào Server tương ứng
        if (splitVS.length > 1) {
            var epTM = extractEps(tmPart);
            var epVS = extractEps(vsPart);
            if (epTM.length > 0) servers.push({ name: "Thuyết Minh", episodes: epTM });
            if (epVS.length > 0) servers.push({ name: "Vietsub", episodes: epVS });
        } else {
            // Nếu không chia tab thì gom tất cả vào chung
            var allEps = extractEps(html);
            if (allEps.length > 0) servers.push({ name: "Danh Sách Tập", episodes: allEps });
        }

        // Fallback an toàn nếu lỡ phim không có tập nào (phim lẻ)
        if (servers.length === 0) {
            servers = [{ name: "Máy chủ VIP", episodes: [{id: "", name: "Xem Phim", slug: ""}] }];
        }

        return JSON.stringify({
            id: "",
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "HD",
            lang: "Vietsub / Thuyết Minh",
            year: 0,
            rating: 0,
            category: "Hoạt Hình 3D",
            status: servers[0].episodes.length + " Tập"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, "");
        }

        if (!streamUrl) {
            var fileMatch = html.match(/["']?file["']?\s*:\s*["'](https?:\/\/[^"']+)["']/i);
            if (fileMatch) streamUrl = fileMatch[1].replace(/\\/g, "");
        }

        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) {
                streamUrl = iframeMatch[1];
                if (streamUrl.indexOf("//") === 0) streamUrl = "https:" + streamUrl;
                
                return JSON.stringify({
                    url: streamUrl,
                    headers: { "Referer": "https://yanhh3d.ac/" },
                    isEmbed: true 
                });
            }
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { "Referer": "https://yanhh3d.ac/" },
                isEmbed: false 
            });
        }
        
        return JSON.stringify({});
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseEmbedResponse(html, sourceUrl) {
    try {
        var streamUrl = "";
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, "");

        if (!streamUrl) {
            var mp4Match = html.match(/(https?:\/\/[^"'\s<>]*\.mp4[^"'\s<>]*)/i);
            if (mp4Match) streamUrl = mp4Match[1].replace(/\\/g, "");
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false,
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

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI FILE KHÔNG HỢP LỆ TRÊN VAX
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
