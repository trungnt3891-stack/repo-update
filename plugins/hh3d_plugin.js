// =============================================================================
// CẤU HÌNH TÊN MIỀN - CHỈ CẦN SỬA DÒNG NÀY NẾU WEB ĐỔI ĐỊA CHỈ
// =============================================================================
var ROOT_DOMAIN = "https://yanhh3d.ac";

// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "2.0.1", 
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
// PARSERS (BÓC TÁCH DỮ LIỆU) - SỬ DỤNG SPLIT ĐỂ TỐI ƯU TỐC ĐỘ 100%
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
        var parts = html.split('<a ');
        
        for (var i = 1; i < parts.length; i++) {
            var p = parts[i];
            
            var hrefM = p.match(/href=["']([^"']+)["']/i);
            if (!hrefM) continue;
            var url = hrefM[1];

            // Bỏ qua link rác, link thư mục
            if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('?s=') !== -1) continue;
            if (url === '/' || url === ROOT_DOMAIN || url === ROOT_DOMAIN + '/') continue;

            // Bắt buộc phải có ảnh thì mới là bộ phim
            var imgM = p.match(/<img[^>]+src=["']([^"']+)["']/i) || p.match(/data-src=["']([^"']+)["']/i);
            if (!imgM || imgM[1].indexOf('avatar') !== -1) continue;

            // Lấy tiêu đề phim
            var titleM = p.match(/title=["']([^"']+)["']/i) || p.match(/alt=["']([^"']+)["']/i);
            var titleText = titleM ? titleM[1] : "";
            if (!titleText) {
                var endA = p.indexOf('</a>');
                if (endA !== -1) {
                    titleText = PluginUtils.cleanText(p.substring(p.indexOf('>') + 1, endA));
                }
            }
            if (!titleText) continue;

            var epM = p.match(/class=["'][^"']*(?:ep|episode|label|status)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i);
            var episode = epM ? PluginUtils.cleanText(epM[1]) : "HD";
            var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");

            movies.push({
                id: slug,
                title: PluginUtils.cleanText(titleText),
                posterUrl: imgM[1],
                backdropUrl: imgM[1],
                quality: "HD",
                episode_current: episode,
                lang: "Vietsub/TM",
                year: 0
            });
        }

        var currentPage = 1;
        var currentMatch = html.match(/class=["'][^"']*current[^"']*["'][^>]*>(\d+)</i);
        if (currentMatch) currentPage = parseInt(currentMatch[1], 10);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: 100, // Cấp đủ 100 trang để vuốt vô hạn
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

        // TÁCH TAB THUYẾT MINH & VIETSUB CỰC KỲ AN TOÀN
        var tmPart = html;
        var vsPart = "";
        
        var vsIdx = html.indexOf('id="vietsub"');
        if (vsIdx === -1) vsIdx = html.indexOf('href="#vietsub"');
        if (vsIdx === -1) vsIdx = html.indexOf('>Vietsub<');
        
        if (vsIdx !== -1) {
            tmPart = html.substring(0, vsIdx);
            vsPart = html.substring(vsIdx);
        }

        // Cỗ máy hút tập phim bằng Split (Không dùng Regex rườm rà)
        function extractEps(block) {
            var episodes = [];
            var seenEps = {};
            var aParts = block.split('<a ');
            
            for (var i = 1; i < aParts.length; i++) {
                var p = aParts[i];
                var urlM = p.match(/href=["']([^"']+)["']/i);
                if (!urlM) continue;
                
                var epUrl = urlM[1];
                if (epUrl.indexOf('the-loai') !== -1 || epUrl.indexOf('?s=') !== -1 || epUrl.indexOf('page') !== -1) continue;

                var endA = p.indexOf('</a>');
                if (endA === -1) continue;
                var epText = PluginUtils.cleanText(p.substring(p.indexOf('>') + 1, endA));
                
                var isEpisode = false;
                
                // Nhận diện link có chứa tap- hoặc episode
                if (epUrl.indexOf('tap-') !== -1 || epUrl.indexOf('-tap') !== -1 || epUrl.indexOf('/xem-phim') !== -1 || epUrl.indexOf('episode') !== -1) {
                    isEpisode = true;
                } else if (epText.length > 0 && epText.length <= 10 && /\d/.test(epText)) { 
                    // Nhận diện nếu tên nút chứa số (VD: 92, 93 TL)
                    isEpisode = true; 
                }

                if (isEpisode && epText.length > 0 && epText.length <= 25) {
                    // Cắt bỏ nút to (Xem Thuyết Minh)
                    if (epText.toLowerCase().indexOf('xem') !== -1 && epText.length > 10) continue;

                    var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                    
                    if (!seenEps[epSlug]) {
                        // Thêm chữ Tập vào nếu nó bị trống
                        if (epText.indexOf('Tập') === -1 && epText.indexOf('Tap') === -1) {
                            if (!isNaN(epText.charAt(0)) || epText.charAt(0) === '0') {
                                epText = "Tập " + epText;
                            }
                        }
                        episodes.push({ id: epSlug, name: epText, slug: epSlug });
                        seenEps[epSlug] = true;
                    }
                }
            }

            // Xếp theo thứ tự từ 1 -> Mới nhất
            if (episodes.length > 1) {
                var fM = episodes[0].name.match(/\d+/);
                var lM = episodes[episodes.length-1].name.match(/\d+/);
                if (fM && lM && parseInt(fM[0], 10) > parseInt(lM[0], 10)) {
                    episodes.reverse();
                }
            }
            return episodes;
        }

        var servers = [];
        var epTM = extractEps(tmPart);
        var epVS = extractEps(vsPart);

        if (vsIdx !== -1) {
            if (epTM.length > 0) servers.push({ name: "Thuyết Minh", episodes: epTM });
            if (epVS.length > 0) servers.push({ name: "Vietsub", episodes: epVS });
        } else {
            if (epTM.length > 0) servers.push({ name: "Danh Sách Tập", episodes: epTM });
        }

        // Cứu cánh nếu phim lẻ chưa có tập
        if (servers.length === 0) {
            var watchBtn = html.match(/href=["']([^"']+)["'][^>]*>.*?Xem/i);
            if (watchBtn && watchBtn[1].indexOf('xem-phim') !== -1) {
                var wSlug = watchBtn[1].replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                servers.push({ name: "Hệ Thống", episodes: [{id: wSlug, name: "Xem Ngay", slug: wSlug}]});
            } else {
                servers.push({ name: "Hệ Thống", episodes: [{id: "", name: "Đang cập nhật", slug: ""}]});
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
            status: servers[0].episodes.length > 0 ? servers[0].episodes.length + " Tập" : "Đang cập nhật"
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

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
