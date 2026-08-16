// =============================================================================
// CẤU HÌNH TÊN MIỀN (SỬA NHANH Ở ĐÂY KHI WEB THAY ĐỔI DOMAIN)
// =============================================================================
var DOMAIN = "hhpanda.st";
var BASEURL = "https://" + DOMAIN;

function getManifest() {
    return JSON.stringify({
        "id": "hhpanda",
        "name": "HHPANDA",
        "description": "Xem phim Hoạt Hình 3D Trung Quốc chất lượng 4K siêu nét.",
        "info": "Plugin chính thức cho trang HHPANDA không quảng cáo.",
        "version": "1.0.0",
        "baseUrl": BASEURL,
        "iconUrl": "https://hhpanda.st/wp-content/uploads/2024/10/logo.webp",
        "isEnabled": true,
        "layoutType": "HORIZONTAL",
        "type": "MOVIE",
        "playerType": "embed" // Mở trực tiếp WebView khi bấm vào tập phim
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog(msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log(msg);
    }
}

// =============================================================================
// MENU & HOME SECTIONS
// =============================================================================

function getHomeSections() {
    try {
        var listurl = `
/moi-cap-nhat@@Mới Cập Nhật@@true
/hoan-thanh@@Hoàn Thành@@false
/most-viewed@@Top Xem Nhiều@@false
/showtimes@@Lịch Chiếu@@false
`;
        return JSON.stringify(buildMenu(listurl));
    } catch (e) {
        return JSON.stringify([]);
    }
}

function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        return JSON.stringify(buildMenu(listurl));
    } catch (e) {
        return JSON.stringify([]);
    }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        return JSON.stringify({ category: buildMenu(listurl) });
    } catch (e) {
        return JSON.stringify({ category: [] });
    }
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && (slug.indexOf("http") > -1 || slug.indexOf("search") > -1)) {
            return slug;
        }
        var page = 1;
        var path = slug || "";

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
            } catch (err) {}
        }

        var resultUrl = BASEURL + (path ? (path.indexOf("/") === 0 ? path : "/" + path) : "");
        if (page > 1) {
            resultUrl += (resultUrl.indexOf("?") > -1 ? "&" : "?") + "page/" + page;
        }
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        return BASEURL;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var filters = JSON.parse(filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':'));
            page = parseInt(filters.page) || 1;
        } catch (e) {}
    }
    var url = BASEURL + "/?s=" + encodeURIComponent(keyword || "");
    if (page > 1) url += "&page=" + page;
    return url.replace(/([^:]\/)\/+/g, "$1");
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        // Cấu trúc danh sách phim chuẩn WordPress / HalimThemes
        var itemRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
        var match;

        while ((match = itemRegex.exec(html)) !== null) {
            var block = match[1];
            var hrefM = /href=["']([^"']+)["']/i.exec(block);
            var titleM = /title=["']([^"']+)["']/i.exec(block);
            var imgM = /src=["']([^"']+)["']/i.exec(block);
            var epM = /<span class="episode">([\s\S]*?)<\/span>/i.exec(block);

            if (hrefM && titleM) {
                var href = hrefM[1];
                var title = titleM[1].trim();
                var poster = imgM ? imgM[1] : "";
                var currentEp = epM ? epM[1].replace(/<[^>]*>/g, "").trim() : "";

                if (poster && poster.indexOf("http") === -1) {
                    poster = BASEURL + poster;
                }

                items.push({
                    "id": href,
                    "title": title,
                    "posterUrl": poster,
                    "backdropUrl": poster,
                    "episode_current": currentEp
                });
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 999 }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(htmlContent, url) {
    try {
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(htmlContent) ||
            /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(htmlContent);
        var id = idMatch ? idMatch[1] : (url || "");

        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "";

        var rmatch = htmlContent.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];
        rmatch = htmlContent.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lname = rmatch[1];
        rmatch = htmlContent.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldes = rmatch[1];

        var servers = [];
        
        // Quét danh sách các Server (Ví dụ: #Vietsub, #Thuyết Minh)
        var serverRegex = /<div class="halim-server[^"]*">([\s\S]*?)<\/div>\s*<\/div>/gi;
        var sMatch;
        var serverBlocks = [];

        // Nếu trang có cấu trúc chia server dạng HalimThemes
        var serverNameRegex = /<span class="halim-server-name">([\s\S]*?)<\/span>/i;
        var listEpsRegex = /<ul[^>]*class="halim-list-eps"[^>]*>([\s\S]*?)<\/ul>/i;

        // Tách các khối server dựa trên cấu trúc hhpanda
        var serverParts = htmlContent.split('class="halim-server');
        
        for (var i = 1; i < serverParts.length; i++) {
            var block = serverParts[i];
            var sNameM = />#([^<]+)<\/span>/i.exec(block);
            var sName = sNameM ? sNameM[1].trim() : ("Server " + i);

            var episodes = [];
            var added = {};

            // Quét tất cả các tập trong server này, đảm bảo bắt trọn vẹn không sót tập cuối
            var epRegex = /<li[^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]+title=["']([^"']+)["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/gi;
            // Fallback đơn giản hơn nếu cấu trúc thay đổi
            var simpleEpRegex = /<a[^>]+data-ep=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]+title=["']([^"']+)["']/gi;
            
            var match;
            // Thử quét theo chuẩn thẻ li chứa a
            var liRegex = /<li\s+class="halim-episode[^"]*">([\s\S]*?)<\/li>/gi;
            var liMatch;

            while ((liMatch = liRegex.exec(block)) !== null) {
                var liHtml = liMatch[1];
                var aHrefM = /href=["']([^"']+)["']/i.exec(liHtml);
                var aTitleM = /title=["']([^"']+)["']/i.exec(liHtml);
                var epNameM = /<span>([\s\S]*?)<\/span>/i.exec(liHtml);

                if (aHrefM && aTitleM) {
                    var epUrl = aHrefM[1];
                    var epName = epNameM ? epNameM[1].trim() : aTitleM[1].trim();

                    if (!added[epUrl]) {
                        added[epUrl] = true;
                        var displayName = epName;
                        if (/^\d+(-?\d+)?$/.test(epName)) displayName = "Tập " + epName;
                        var slug = "tap-" + epName.replace(/\s+/g, "-");

                        episodes.push({
                            id: epUrl,
                            name: displayName,
                            slug: slug
                        });
                    }
                }
            }

            // Nếu quét theo li không ra, quét vét bằng toàn bộ thẻ a trong khối server
            if (episodes.length === 0) {
                var fallbackA = /<a[^>]+href=["']([^"']+)["'][^>]+title=["']([^"']+)["']/gi;
                var fMatch;
                while ((fMatch = fallbackA.exec(block)) !== null) {
                    var fUrl = fMatch[1];
                    var fName = fMatch[2].trim();
                    if (!added[fUrl] && fUrl.indexOf('javascript') === -1) {
                        added[fUrl] = true;
                        episodes.push({
                            id: fUrl,
                            name: fName.indexOf('Tập') === -1 ? ("Tập " + fName) : fName,
                            slug: "tap-" + fName.replace(/\s+/g, "-")
                        });
                    }
                }
            }

            if (episodes.length > 0) {
                servers.push({
                    name: sName,
                    episodes: episodes
                });
            }
        }

        // Nếu vẫn không tìm thấy server nào, tạo server mặc định lấy từ trang hiện tại
        if (servers.length === 0) {
            servers.push({
                name: "Xem Phim",
                episodes: [{ id: url, name: "Xem Ngay", slug: "full" }]
            });
        }

        return JSON.stringify({
            id: id,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "4K",
            servers: servers
        });
    } catch (e) {
        log("parseMovieDetail[err]: " + e);
        return JSON.stringify({ id: url, title: "Lỗi", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        return JSON.stringify({
            "url": url,
            "isEmbed": true, // Mở trực tiếp trang xem qua WebView của App
            "headers": {
                "Referer": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true });
    }
}

function parseCategoriesResponse() { return JSON.stringify(buildMenu(getLISTmenu())); }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
function parseSearchResponse(html) { return parseListResponse(html); }
function parseEmbedResponse() { return JSON.stringify({ url: "", isEmbed: false }); }
function sortEpisodesByName(data) { return data; }

function getLISTmenu() {
    return `
/the-loai/tu-tien@@Tu Tiên
/the-loai/kiem-hiep@@Kiếm Hiệp
/the-loai/co-trang@@Cổ Trang
/the-loai/huyen-huyen@@Huyền Huyễn
/the-loai/khoa-huyen@@Khoa Huyễn
/the-loai/ky-ao@@Kỳ Ảo
/the-loai/huyen-nghi@@Huyền Nghi
/the-loai/canh-ky@@Cạnh Kỹ
/the-loai/da-su@@Dã Sử
/the-loai/do-thi@@Đô Thị
/the-loai/dong-nhan@@Đồng Nhân
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
        menulist.push({ "slug": parts[0].trim(), "name": parts[1].trim() });
    }
    return menulist;
}

function _$() {
    return {
        find: function() { return this; },
        each: function() { return this; },
        text: function() { return ""; },
        attr: function() { return ""; },
        html: function() { return ""; },
        next: function() { return this; },
        parent: function() { return this; }
    };
}
