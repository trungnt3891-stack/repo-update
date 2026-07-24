// =============================================================================
// TÊN MIỀN GỐC - CHỈ CẦN SỬA Ở ĐÂY NẾU WEB ĐỔI TÊN MIỀN
// =============================================================================
var ROOT_DOMAIN = "https://yanhh3d.ac";

// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "6.0.0", // Nâng version để xóa cache cũ
        "baseUrl": ROOT_DOMAIN, 
        "iconUrl": ROOT_DOMAIN + "/wp-content/uploads/2023/01/cropped-logo-1-192x192.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'home', title: 'Mới Cập Nhật', type: 'Grid', path: '' },
        { slug: 'the-loai/tien-hiep', title: 'Tiên Hiệp', type: 'Horizontal', path: '' },
        { slug: 'the-loai/huyen-huyen', title: 'Huyền Huyễn', type: 'Horizontal', path: '' },
        { slug: 'the-loai/xuyen-khong', title: 'Xuyên Không', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'home' },
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
    
    if (!slug || slug === 'home') {
        if (page === 1) return ROOT_DOMAIN + "/";
        return ROOT_DOMAIN + "/page/" + page;
    }
    
    slug = slug.replace(/\.html$/i, "");
    if (page === 1) {
        return ROOT_DOMAIN + "/" + slug;
    } else {
        return ROOT_DOMAIN + "/" + slug + "/page/" + page;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return ROOT_DOMAIN + "/page/" + page + "?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return ROOT_DOMAIN + "/" + slug.replace(/^\//, "");
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

// ĐÃ KHÔI PHỤC HOÀN TOÀN BỘ KHUNG V2 CHUẨN XÁC CỦA BẠN CHO TRANG CHỦ
function parseListResponse(html) {
    try {
        var movies = [];
        var seen = {};
        
        var aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var aMatch;

        while ((aMatch = aRegex.exec(html)) !== null) {
            var url = aMatch[1];
            var inner = aMatch[2];

            if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('?s=') !== -1) continue;
            // So sánh tên miền linh hoạt
            if (url === '/' || url.indexOf(ROOT_DOMAIN.replace('https://', '')) === url.length - ROOT_DOMAIN.length + 8) continue;

            var imgMatch = inner.match(/<img[^>]+src=["']([^"']+)["']/i) || inner.match(/data-src=["']([^"']+)["']/i);
            if (!imgMatch || imgMatch[1].indexOf('avatar') !== -1) continue;

            var titleMatch = inner.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i) || inner.match(/title=["']([^"']+)["']/i) || inner.match(/alt=["']([^"']+)["']/i);
            var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "";
            
            var epMatch = inner.match(/<span[^>]*class=["'][^"']*(ep|episode|label|status)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) 
                       || inner.match(/<div[^>]*class=["'][^"']*(ep|episode|label|status)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
            var episode = epMatch ? PluginUtils.cleanText(epMatch[2]) : "HD";

            if (title && !seen[url]) {
                var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                movies.push({
                    id: slug,
                    title: title,
                    posterUrl: imgMatch[1],
                    backdropUrl: imgMatch[1],
                    quality: "HD",
                    episode_current: episode,
                    lang: "Vietsub / TM",
                    year: 0
                });
                seen[url] = true;
            }
        }

        var currentPage = 1;
        var currentMatch = html.match(/class=["'][^"']*current[^"']*["'][^>]*>(\d+)</i);
        if (currentMatch) currentPage = parseInt(currentMatch[1], 10);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: 100, 
                totalItems: 9999,
                itemsPerPage: 20
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// BỘ LỌC TẬP PHIM CHUYÊN SÂU THEO TỪNG TAB
function parseMovieDetail(html) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        // Hàm cục bộ: Hút tập phim từ một khối HTML
        function extractEps(block) {
            var episodes = [];
            var seenEps = {};
            var aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            var aMatch;
            
            while ((aMatch = aRegex.exec(block)) !== null) {
                var epUrl = aMatch[1];
                var rawInner = aMatch[2];
                var epDisplay = PluginUtils.cleanText(rawInner);
                
                var isEpisode = false;
                
                // Nhận diện link tập phim
                if (epUrl.indexOf('tap-') !== -1 || epUrl.indexOf('/xem-phim') !== -1 || epUrl.indexOf('episode') !== -1) {
                    isEpisode = true;
                } else if (!isNaN(epDisplay) && epDisplay.length > 0 && epDisplay.length < 5) { 
                    isEpisode = true; 
                }

                if (isEpisode && epDisplay.length > 0 && epDisplay.length < 30) {
                    // CẮT BỎ CÁC NÚT TO (như "Xem Thuyết Minh", "Xem Ngay") để không lẫn vào danh sách
                    if (epDisplay.toLowerCase().indexOf('xem') !== -1 && epDisplay.length > 10) continue;

                    var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                    
                    if (!seenEps[epSlug]) {
                        // Gắn chữ Tập vào nếu nó chỉ là con số
                        if (epDisplay.indexOf('Tập') === -1 && epDisplay.indexOf('Tap') === -1 && !isNaN(epDisplay.charAt(0))) {
                            epDisplay = "Tập " + epDisplay;
                        }
                        episodes.push({
                            id: epSlug,
                            name: epDisplay,
                            slug: epSlug
                        });
                        seenEps[epSlug] = true;
                    }
                }
            }

            // Đảo ngược danh sách nếu web đang để lộn xộn
            if (episodes.length > 1) {
                var fM = episodes[0].name.match(/\d+/);
                var lM = episodes[episodes.length-1].name.match(/\d+/);
                if (fM && lM && parseInt(fM[0], 10) > parseInt(lM[0], 10)) {
                    episodes.reverse();
                }
            }
            return episodes;
        }

        // TÁCH TAB THUYẾT MINH & VIETSUB
        var tmPart = html;
        var vsPart = "";
        
        var splitVS = html.split(/id=["'][^"']*vietsub[^"']*["']|href=["'][^"']*#vietsub[^"']*["']/i);
        if (splitVS.length > 1) {
            tmPart = splitVS[0];
            vsPart = splitVS.slice(1).join(" ");
        }

        var servers = [];
        var epTM = extractEps(tmPart);
        var epVS = extractEps(vsPart);

        if (splitVS.length > 1) {
            if (epTM.length > 0) servers.push({ name: "Thuyết Minh", episodes: epTM });
            if (epVS.length > 0) servers.push({ name: "Vietsub", episodes: epVS });
        } else {
            // Nếu không chia tab, gom hết vào 1 Server
            if (epTM.length > 0) servers.push({ name: "Danh sách phát", episodes: epTM });
        }

        // Bảo hiểm an toàn nếu bị ẩn danh sách (Phim chiếu rạp 1 tập)
        if (servers.length === 0) {
            servers.push({ name: "Hệ Thống", episodes: [{id: "", name: "Xem Phim", slug: ""}]});
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
            status: (servers.length > 0 && servers[0].episodes.length > 0) ? servers[0].episodes.length + " Tập" : "Đang cập nhật"
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
            var mp4Match = html.match(/(https?:\/\/[^"'\s<>]*\.mp4[^"'\s<>]*)/i);
            if (mp4Match) streamUrl = mp4Match[1].replace(/\\/g, "");
        }

        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) {
                streamUrl = iframeMatch[1];
                if (streamUrl.indexOf("//") === 0) streamUrl = "https:" + streamUrl;
                return JSON.stringify({
                    url: streamUrl,
                    headers: { "Referer": ROOT_DOMAIN + "/" },
                    isEmbed: true 
                });
            }
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { 
                    "Referer": ROOT_DOMAIN + "/",
                    "Origin": ROOT_DOMAIN,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
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
                    "User-Agent": "Mozilla/5.0"
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
