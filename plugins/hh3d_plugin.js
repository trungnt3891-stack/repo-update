// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "3.0.0", // Cập nhật version để App xóa cache cũ
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
    var baseUrl = "https://yanhh3d.ac";
    
    if (!slug || slug === 'home') {
        if (page === 1) return baseUrl + "/";
        return baseUrl + "/page/" + page;
    }
    
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
            if (url === '/' || url.indexOf('yanhh3d.ac') === url.length - 10) continue;

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

function parseMovieDetail(html) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        // =====================================================================
        // BỘ HÚT TẬP PHIM CHUYÊN SÂU
        // =====================================================================
        
        // Chia HTML làm 2 nửa để lọc tab Thuyết Minh và Vietsub
        var tmPart = html;
        var vsPart = "";
        
        var splitVS = html.split(/id=["'][^"']*vietsub[^"']*["']|Vietsub/i);
        if (splitVS.length > 1) {
            tmPart = splitVS[0];
            vsPart = splitVS.slice(1).join(" ");
        }

        // Hàm cục bộ trích xuất các tập phim từ một đoạn HTML
        function extractEps(htmlPart) {
            var eps = [];
            var seen = {};
            var aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
            var aMatch;
            
            while ((aMatch = aRegex.exec(htmlPart)) !== null) {
                var epUrl = aMatch[1];
                var rawText = PluginUtils.cleanText(aMatch[2]);
                
                // Chỉ lấy link có chứa xem-phim hoặc tap-
                if (epUrl.indexOf('/xem-phim') !== -1 || epUrl.indexOf('tap-') !== -1) {
                    // CỰC KỲ QUAN TRỌNG: Lọc bỏ các nút "Xem Thuyết Minh", "Xem Ngay"
                    if (rawText.toLowerCase().indexOf('xem ') !== -1 || rawText.length > 15) continue;
                    
                    var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                    
                    if (!seen[epSlug]) {
                        // Thêm chữ "Tập" nếu nó chỉ là 1 con số (như 92, 91)
                        if (!isNaN(rawText)) {
                            rawText = "Tập " + rawText;
                        } else if (rawText.indexOf('Tập') === -1 && rawText.indexOf('Tap') === -1) {
                            rawText = "Tập " + rawText;
                        }
                        
                        eps.push({ id: epSlug, name: rawText, slug: epSlug });
                        seen[epSlug] = true;
                    }
                }
            }
            
            // Sắp xếp tự động xuôi từ Tập 1 -> Tập mới nhất
            if (eps.length > 1) {
                var fM = eps[0].name.match(/\d+/);
                var lM = eps[eps.length-1].name.match(/\d+/);
                if (fM && lM && parseInt(fM[0], 10) > parseInt(lM[0], 10)) {
                    eps.reverse();
                }
            }
            return eps;
        }

        var epTM = extractEps(tmPart);
        var epVS = extractEps(vsPart);
        
        var servers = [];
        if (epTM.length > 0) servers.push({ name: "Thuyết Minh", episodes: epTM });
        if (epVS.length > 0) servers.push({ name: "Vietsub", episodes: epVS });
        
        // Cứu cánh: Nếu web không chia tab, quét gộp toàn trang
        if (servers.length === 0) {
            var allEps = extractEps(html);
            if (allEps.length > 0) {
                servers.push({ name: "Danh Sách Tập", episodes: allEps });
            } else {
                // Nếu tìm cả trang vẫn không ra tập nào (nghĩa là đang ở trang phim 1 tập)
                // Ép App hiện 1 nút "Xem Phim" để bấm được
                var watchBtn = html.match(/href=["']([^"']+)["'][^>]*>.*?Xem/i);
                if (watchBtn && watchBtn[1].indexOf('xem-phim') !== -1) {
                    var wSlug = watchBtn[1].replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                    servers.push({ name: "Hệ Thống", episodes: [{id: wSlug, name: "Xem Ngay", slug: wSlug}]});
                }
            }
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
            status: "Đang cập nhật"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) streamUrl = m3u8Match[1].replace(/\\/g, "");
        
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
                    headers: { "Referer": "https://yanhh3d.ac/" },
                    isEmbed: true 
                });
            }
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { 
                    "Referer": "https://yanhh3d.ac/",
                    "Origin": "https://yanhh3d.ac",
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
