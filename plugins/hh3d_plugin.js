// =============================================================================
// CẤU HÌNH TÊN MIỀN - CHỈ CẦN SỬA DÒNG NÀY NẾU WEB ĐỔI TÊN MIỀN
// =============================================================================
var ROOT_DOMAIN = "https://yanhh3d.ac";

// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "description": "Trang xem phim Hoạt Hình 3D siêu hay.",
        "version": "2.0.2", 
        "baseUrl": ROOT_DOMAIN, 
        "iconUrl": ROOT_DOMAIN + "/wp-content/uploads/2023/01/cropped-logo-1-192x192.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function getLISTmenu() {
    return `
/phim-moi-cap-nhat@@Mới Cập Nhật@@true
/the-loai/tien-hiep@@Tiên Hiệp@@false
/the-loai/huyen-huyen@@Huyền Huyễn@@false
/the-loai/xuyen-khong@@Xuyên Không@@false
/the-loai/trung-sinh@@Trùng Sinh@@false
/the-loai/hai-huoc@@Hài Hước@@false
/the-loai/co-trang@@Cổ Trang@@false
/the-loai/hanh-dong@@Hành Động@@false
`;
}

function buildMenu(listurl) {
    var menulist = [];
    if (!listurl) return menulist;
    var lines = listurl.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        var parts = line.split('@@');
        var link = parts[0] ? parts[0].trim() : "";
        var name = parts[1] ? parts[1].trim() : "";
        var check = parts[2] ? parts[2].trim() : undefined;
        if (!link || !name) continue;
        
        var item = {};
        if (check === "false") {
            item = { "slug": link, "title": name, "type": "Horizontal" };
        } else if (check === "true") {
            item = { "slug": link, "title": name, "type": "Grid" };
        } else {
            item = { "slug": link, "name": name };
        }
        menulist.push(item);
    }
    return menulist;
}

function getHomeSections() {
    var listurl = `/phim-moi-cap-nhat@@Mới Cập Nhật@@true\n/the-loai/tien-hiep@@Tiên Hiệp@@false\n/the-loai/huyen-huyen@@Huyền Huyễn@@false`;
    return JSON.stringify(buildMenu(listurl));
}

function getPrimaryCategories() {
    return JSON.stringify(buildMenu(getLISTmenu()));
}

function getFilterConfig() { 
    return JSON.stringify({ category: buildMenu(getLISTmenu()) }); 
}

// =============================================================================
// URL GENERATION 
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1 || slug.indexOf("search") > -1) {
            return slug;
        }
        var page = 1;
        var path = slug || "/phim-moi-cap-nhat";
        
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (e) {}
        }
        
        var resultUrl = ROOT_DOMAIN;
        if (path) {
            if (path.indexOf('/') !== 0) path = '/' + path;
            resultUrl += path;
        }
        
        if (page > 1) {
            resultUrl += "/page/" + page;
        }
        
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (err) {
        return ROOT_DOMAIN;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return ROOT_DOMAIN + "/page/1?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return ROOT_DOMAIN + (slug.indexOf('/') === 0 ? slug : "/" + slug);
}

function getUrlCategories() { return ROOT_DOMAIN; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS (SỬ DỤNG STRING.SPLIT SIÊU TỐC)
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
        // Cắt chuỗi theo thẻ a để cào phim cực nhẹ và nhanh
        var parts = html.split('<a ');
        
        for (var i = 1; i < parts.length; i++) {
            var p = parts[i];
            
            var hrefM = p.match(/href=["']([^"']+)["']/i);
            if (!hrefM) continue;
            var url = hrefM[1];

            // Bỏ qua các link nhiễu, menu
            if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('?s=') !== -1) continue;
            if (url === '/' || url === ROOT_DOMAIN || url === ROOT_DOMAIN + '/') continue;

            var imgM = p.match(/<img[^>]+src=["']([^"']+)["']/i) || p.match(/data-src=["']([^"']+)["']/i);
            if (!imgM || imgM[1].indexOf('avatar') !== -1) continue;

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

// BỘ CÀO TẬP PHIM CHUYÊN SÂU - THUẬT TOÁN TỰ ĐỘNG PHÁT HIỆN TAB
function parseMovieDetail(htmlContent, url) {
    try {
        var id = url ? url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "") : "";
        
        var titleM = htmlContent.match(/<meta property="og:title" content="([^"]+)"/i) || htmlContent.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "Đang cập nhật...";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = htmlContent.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = htmlContent.match(/<meta property="og:description" content="([^"]+)"/i) || htmlContent.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "Không có mô tả.";

        // --- TIỀN XỬ LÝ HTML: Cắt bỏ Sidebar và Footer để tránh cào nhầm "Tập mới nhất"
        var htmlToParse = htmlContent;
        var sidebarIdx = htmlToParse.indexOf('id="sidebar"');
        if (sidebarIdx === -1) sidebarIdx = htmlToParse.indexOf('class="sidebar"');
        if (sidebarIdx === -1) sidebarIdx = htmlToParse.indexOf('id="right-sidebar"');
        if (sidebarIdx !== -1) htmlToParse = htmlToParse.substring(0, sidebarIdx);
        
        var footerIdx = htmlToParse.indexOf('<footer');
        if (footerIdx !== -1) htmlToParse = htmlToParse.substring(0, footerIdx);

        // --- THUẬT TOÁN TỰ NHẬN DIỆN SERVER DỰA TRÊN SỰ LẶP LẠI TẬP PHIM ---
        var servers = [];
        var currentEps = [];
        var currentSeenNames = {};
        var serverIndex = 0;

        var aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var aMatch;
        
        while ((aMatch = aRegex.exec(htmlToParse)) !== null) {
            var epUrl = aMatch[1];
            var epDisplay = PluginUtils.cleanText(aMatch[2]);
            
            // Loại link thư mục
            if (epUrl.indexOf('the-loai') !== -1 || epUrl.indexOf('page') !== -1 || epUrl.indexOf('?s=') !== -1) continue;
            
            var isEpisode = false;
            // Dấu hiệu 1: Link chứa tap-, xem-phim, episode
            if (epUrl.indexOf('tap-') !== -1 || epUrl.indexOf('-tap') !== -1 || epUrl.indexOf('/xem-phim') !== -1 || epUrl.indexOf('episode') !== -1) {
                isEpisode = true;
            } 
            // Dấu hiệu 2: Nút chỉ chứa số hoặc chữ ngắn (VD: 92, 93)
            else if (!isNaN(epDisplay) && epDisplay.length > 0 && epDisplay.length <= 5) {
                isEpisode = true;
            }
            
            if (isEpisode && epDisplay.length > 0 && epDisplay.length <= 25) {
                // Lọc nút "Xem Thuyết Minh", "Xem Ngay", "Trailer"
                if (epDisplay.toLowerCase().indexOf('xem') !== -1 && epDisplay.length > 10) continue;
                if (epDisplay.toLowerCase().indexOf('trailer') !== -1) continue;
                
                var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                var baseName = epDisplay;
                
                // Đắp thêm chữ "Tập" cho đẹp
                if (baseName.indexOf('Tập') === -1 && baseName.indexOf('Tap') === -1) {
                    if (!isNaN(baseName.charAt(0)) || baseName.charAt(0) === '0') {
                        baseName = "Tập " + baseName;
                    }
                }
                
                // CỐT LÕI TẠO TAB TỰ ĐỘNG: 
                // Nếu tập này đã xuất hiện trong Server hiện tại -> Chắc chắn đang sang Tab mới
                if (currentSeenNames[baseName]) {
                    servers.push({ episodes: currentEps });
                    currentEps = [];
                    currentSeenNames = {};
                    serverIndex++;
                }
                
                // Thêm tập vào Server hiện tại
                if (!currentSeenNames[baseName]) {
                    currentEps.push({ id: epSlug, name: baseName, slug: epSlug });
                    currentSeenNames[baseName] = true;
                }
            }
        }
        
        // Push nốt Server cuối cùng vào mảng
        if (currentEps.length > 0) {
            servers.push({ episodes: currentEps });
        }
        
        // --- CHUẨN HÓA TÊN TAB VÀ SẮP XẾP ---
        for (var i = 0; i < servers.length; i++) {
            var eps = servers[i].episodes;
            
            // Xếp ngược lại thành thứ tự từ 1 -> Mới nhất (nếu web đang đảo ngược)
            if (eps.length > 1) {
                var fM = eps[0].name.match(/\d+/);
                var lM = eps[eps.length-1].name.match(/\d+/);
                if (fM && lM && parseInt(fM[0], 10) > parseInt(lM[0], 10)) {
                    eps.reverse();
                }
            }
            
            // Đặt tên Tab siêu chuẩn của YanHH3D (Thường là Thuyết Minh trước, Vietsub sau)
            if (servers.length === 2) {
                servers[0].name = "Thuyết Minh";
                servers[1].name = "Vietsub";
            } else if (servers.length === 1) {
                servers[0].name = "Danh Sách Phát";
            } else {
                servers[i].name = "Server " + (i + 1);
            }
        }

        // --- CỨU CÁNH CHO PHIM LẺ / CHƯA CÓ TẬP ---
        if (servers.length === 0) {
            var watchBtn = htmlContent.match(/href=["']([^"']+)["'][^>]*>.*?Xem/i);
            if (watchBtn && watchBtn[1].indexOf('xem-phim') !== -1) {
                var wSlug = watchBtn[1].replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                servers.push({ name: "Hệ Thống", episodes: [{id: wSlug, name: "Xem Ngay", slug: wSlug}]});
            } else {
                servers.push({ name: "Hệ Thống", episodes: [{id: "", name: "Đang cập nhật", slug: ""}]});
            }
        }

        return JSON.stringify({
            id: id,
            title: title,
            posterUrl: poster,
            backdropUrl: poster,
            description: desc,
            servers: servers,
            quality: "HD",
            lang: "Vietsub / Thuyết Minh",
            year: 0,
            rating: 8.5,
            category: "Hoạt Hình 3D",
            status: servers[0].episodes.length > 0 ? servers[0].episodes.length + " Tập" : "Đang cập nhật",
            extra: "" 
        });

    } catch (e) {
        return JSON.stringify({ id: url || "error", title: "Lỗi", servers: [] });
    }
}

function parseDetailResponse(html, url) {
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
        
        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

function parseEmbedResponse(html, sourceUrl) {
    return parseDetailResponse(html, sourceUrl);
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    return JSON.stringify(buildMenu(listurl));
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
