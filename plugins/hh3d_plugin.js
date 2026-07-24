// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "2.0.0", // Cập nhật version để App xóa bộ nhớ đệm
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
    
    // ĐÃ FIX: Điều hướng trang chủ đúng chuẩn
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
        
        // Hút toàn bộ thẻ a có chứa ảnh bên trong để làm danh sách phim
        var aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var aMatch;

        while ((aMatch = aRegex.exec(html)) !== null) {
            var url = aMatch[1];
            var inner = aMatch[2];

            // Bỏ qua các link nhiễu (danh mục, trang, tab)
            if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('?s=') !== -1) continue;
            if (url === '/' || url.indexOf('yanhh3d.ac') === url.length - 10) continue;

            // Kiểm tra xem thẻ a này có ảnh không (phân biệt phim với text thường)
            var imgMatch = inner.match(/<img[^>]+src=["']([^"']+)["']/i) || inner.match(/data-src=["']([^"']+)["']/i);
            if (!imgMatch || imgMatch[1].indexOf('avatar') !== -1) continue;

            // Cào tên phim
            var titleMatch = inner.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i) || inner.match(/title=["']([^"']+)["']/i) || inner.match(/alt=["']([^"']+)["']/i);
            var title = titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "";
            
            // Cào số tập hiện tại
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

        // Fake phân trang để lướt thoải mái
        var currentPage = 1;
        var currentMatch = html.match(/class=["'][^"']*current[^"']*["'][^>]*>(\d+)</i);
        if (currentMatch) currentPage = parseInt(currentMatch[1], 10);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: 100, // Hardcode 100 trang để cuộn vô hạn
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

        var episodes = [];
        var seenEps = {};
        
        // Quét siêu chính xác: moi tất cả link tập (Nút Xem, Số Tập) có trong HTML
        var aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var aMatch;
        
        while ((aMatch = aRegex.exec(html)) !== null) {
            var epUrl = aMatch[1];
            var rawInner = aMatch[2];
            var epDisplay = PluginUtils.cleanText(rawInner);
            
            var isEpisode = false;
            
            // Điều kiện nhận diện 1 nút là Nút Tập Phim
            if (epUrl.indexOf('tap-') !== -1 || epUrl.indexOf('/xem-phim') !== -1 || epUrl.indexOf('episode') !== -1) {
                isEpisode = true;
            } else if (epDisplay.toLowerCase().indexOf('xem thuyết minh') !== -1 || epDisplay.toLowerCase().indexOf('xem vietsub') !== -1 || epDisplay.toLowerCase().indexOf('xem ngay') !== -1) {
                isEpisode = true;
            } else if (!isNaN(epDisplay) && epDisplay.length > 0 && epDisplay.length < 5) { 
                isEpisode = true; // Bắt các nút chứa số (ví dụ: 90, 91, 92)
            }

            if (isEpisode && epDisplay.length > 0 && epDisplay.length < 30) {
                var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                
                if (!seenEps[epSlug]) {
                    // Chuẩn hóa tên tập (92 -> Tập 92)
                    if (epDisplay.toLowerCase().indexOf('xem') === -1 && epDisplay.indexOf('Tập') === -1 && epDisplay.indexOf('Tap') === -1 && !isNaN(epDisplay.charAt(0))) {
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

        var servers = [];
        if (episodes.length > 0) {
            // Sắp xếp các tập theo thứ tự cũ lên trước nếu web đang để lộn ngược
            var fM = episodes[0].name.match(/\d+/);
            var lM = episodes[episodes.length-1].name.match(/\d+/);
            if (fM && lM && parseInt(fM[0], 10) > parseInt(lM[0], 10)) {
                episodes.reverse();
            }
            servers.push({ name: "Danh sách phát", episodes: episodes });
        } else {
            // Bảo hiểm an toàn nếu bị ẩn danh sách: Thêm 1 nút "Xem Phim" ép chạy
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
            status: episodes.length + " Tập"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        
        // 1. Quét thẳng link m3u8 nằm trong html (Phổ biến nhất ở YanHH3D)
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, "");
        }
        
        // 2. Thử tìm link mp4
        if (!streamUrl) {
            var mp4Match = html.match(/(https?:\/\/[^"'\s<>]*\.mp4[^"'\s<>]*)/i);
            if (mp4Match) streamUrl = mp4Match[1].replace(/\\/g, "");
        }

        // 3. Quét Iframe nhúng phòng hờ
        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) {
                streamUrl = iframeMatch[1];
                if (streamUrl.indexOf("//") === 0) streamUrl = "https:" + streamUrl;
                return JSON.stringify({
                    url: streamUrl,
                    headers: { "Referer": "https://yanhh3d.ac/" },
                    isEmbed: true // Kích hoạt parseEmbedResponse
                });
            }
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                headers: { 
                    "Referer": "https://yanhh3d.ac/",
                    "Origin": "https://yanhh3d.ac",
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

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ" TRÊN VAX
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
