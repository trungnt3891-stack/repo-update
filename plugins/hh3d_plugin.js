// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://yanhh3d.ac";

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "HH3D - Yanhh3d",
        "description": "Trang xem phim Hoạt Hình 3D siêu hay.",
        "version": "1.2.5",
        "baseUrl": BASEURL,
        "iconUrl": "https://bilutv.asia/img/bilutvlogo-ngang.jpg",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: '/moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: '' },
        { slug: '/the-loai/huyen-huyen', title: 'Huyền Huyễn', type: 'Horizontal', path: '' },
        { slug: '/the-loai/tien-hiep', title: 'Tiên Hiệp', type: 'Horizontal', path: '' },
        { slug: '/the-loai/co-trang', title: 'Cổ Trang', type: 'Horizontal', path: '' },
        { slug: '/the-loai/hai-huoc', title: 'Hài Hước', type: 'Horizontal', path: '' },
        { slug: '/the-loai/kiem-hiep', title: 'Kiếm Hiệp', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Huyền Huyễn', slug: '/the-loai/huyen-huyen' },
        { name: 'Xuyên Không', slug: '/the-loai/xuyen-khong' },
        { name: 'Trùng Sinh', slug: '/the-loai/trung-sinh' },
        { name: 'Tiên Hiệp', slug: '/the-loai/tien-hiep' },
        { name: 'Cổ Trang', slug: '/the-loai/co-trang' },
        { name: 'Hài Hước', slug: '/the-loai/hai-huoc' },
        { name: 'Kiếm Hiệp', slug: '/the-loai/kiem-hiep' },
        { name: 'Hiện Đại', slug: '/the-loai/hien-dai' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        category: [
            { name: "Huyền Huyễn", value: "/the-loai/huyen-huyen" },
            { name: "Xuyên Không", value: "/the-loai/xuyen-khong" },
            { name: "Trùng Sinh", value: "/the-loai/trung-sinh" },
            { name: "Tiên Hiệp", value: "/the-loai/tien-hiep" },
            { name: "Cổ Trang", value: "/the-loai/co-trang" },
            { name: "Hài Hước", value: "/the-loai/hai-huoc" },
            { name: "Kiếm Hiệp", value: "/the-loai/kiem-hiep" },
            { name: "Hiện Đại", value: "/the-loai/hien-dai" }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    if (slug && slug.indexOf("http") === 0) return slug;
    var page = 1;
    var path = slug || "/moi-cap-nhat";
    if (filtersJson) {
        try {
            var filters = JSON.parse(filtersJson);
            if (filters.page) page = parseInt(filters.page);
            if (filters.category) path = filters.category;
        } catch (e) {}
    }
    var url = BASEURL + (path.charAt(0) === '/' ? path : '/' + path);
    if (page > 1) url += "?page=" + page;
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var f = JSON.parse(filtersJson);
            if (f.page) page = parseInt(f.page);
        } catch (e) {}
    }
    var url = BASEURL + "/search?keysearch=" + encodeURIComponent(keyword);
    if (page > 1) url += "&page=" + page;
    return url;
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf("http") === 0) return slug;
    return BASEURL + (slug.charAt(0) === '/' ? slug : '/' + slug);
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS 
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
    }
};

function parseListResponse(html) {
    try {
        var movies = [];
        var parts = html.split('class="flw-item"');
        for (var i = 1; i < parts.length; i++) {
            var block = parts[i].substring(0, 1500); 
            var hrefMatch = block.match(/href="([^"]+)"/i);
            var titleMatch = block.match(/title="([^"]+)"/i);
            var imgMatch = block.match(/<img[^>]+src="([^"]+)"/i);
            var qualityMatch = block.match(/class="[^"]*tick-dub[^"]*"[^>]*>([^<]+)/i);
            var currentMatch = block.match(/class="[^"]*tick-rate[^"]*"[^>]*>([^<]+)/i);

            if (hrefMatch && imgMatch) {
                var href = hrefMatch[1];
                if (href.indexOf("http") === -1) href = BASEURL + (href.charAt(0) === '/' ? '' : '/') + href;
                var img = imgMatch[1].replace(/&amp;/g, '&');
                if (img.indexOf("http") === -1) img = BASEURL + (img.charAt(0) === '/' ? '' : '/') + img;

                movies.push({
                    id: href,
                    title: titleMatch ? PluginUtils.cleanText(titleMatch[1]) : "",
                    posterUrl: img,
                    backdropUrl: img,
                    quality: qualityMatch ? PluginUtils.cleanText(qualityMatch[1]) : "HD",
                    episode_current: currentMatch ? PluginUtils.cleanText(currentMatch[1]) : "Full"
                });
            }
        }
        return JSON.stringify({ items: movies, pagination: { currentPage: 1, totalPages: 999 } });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

function parseMovieDetail(html, url) {
    try {
        var idMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
        var id = idMatch ? idMatch[1] : (url || "");
        var slug = "";
        if (id) {
            var slugMatch = id.match(/\/phim\/([^\/]+)/i);
            slug = slugMatch ? slugMatch[1] : id;
        }

        var lname = "Đang cập nhật...", limg = "", ldes = "", lduran = "", status = "", year = "", episode_current = "", category = "";
        var m;
        if ((m = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i))) lname = PluginUtils.cleanText(m[1]);
        if ((m = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i))) limg = m[1];
        if ((m = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i))) ldes = PluginUtils.cleanText(m[1]);
        if ((m = html.match(/<meta\s+property="video:duration"\s+content="([^"]+)"/i))) lduran = PluginUtils.cleanText(m[1]);
        
        var r;
        if ((r = html.match(/Trạng thái:.*?<[^>]+>([^<]+)/i))) status = PluginUtils.cleanText(r[1]);
        if ((r = html.match(/Năm:.*?<[^>]+>([^<]+)/i))) year = PluginUtils.cleanText(r[1]);
        if ((r = html.match(/Tập mới nhất:.*?<[^>]+>([^<]+)/i))) episode_current = PluginUtils.cleanText(r[1]);

        var catBlockMatch = html.match(/Thể loại:[\s\S]*?(<\/div>|<\/li>)/i);
        if (catBlockMatch) {
            var cats = [];
            var aRegex = /<a[^>]*>([^<]+)<\/a>/gi;
            var aMatch;
            while ((aMatch = aRegex.exec(catBlockMatch[0])) !== null) {
                cats.push(PluginUtils.cleanText(aMatch[1]));
            }
            category = cats.join(", ");
        }

        var servers = [];
        // Tìm block chứa tập phim
        var inforContent = html.match(/class="[^"]*detail-infor-content[^"]*"([\s\S]*?)<div class="clearfix"/i);
        if (!inforContent) inforContent = html.match(/class="[^"]*detail-infor-content[^"]*"([\s\S]*?)<footer/i);
        
        if (inforContent) {
            var block = inforContent[1];
            var srvRegex = /<a[^>]+href="#([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            var match;
            while ((match = srvRegex.exec(block)) !== null) {
                var sId = match[1];
                var sName = PluginUtils.cleanText(match[2]);
                var epBlockRegex = new RegExp('id=["\']' + sId + '["\'][\\s\\S]*?(?:<\/div>\\s*<\/div>|<div id="|<div class="clearfix)', 'i');
                var epBlockMatch = block.match(epBlockRegex);
                
                if (epBlockMatch) {
                    var eps = [];
                    var epRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
                    var epM;
                    while ((epM = epRegex.exec(epBlockMatch[0])) !== null) {
                        var epUrl = epM[1];
                        var epName = PluginUtils.cleanText(epM[2]);
                        if (epUrl.indexOf('javascript') === -1 && epUrl.indexOf('#') !== 0) {
                            if (epUrl.indexOf('http') === -1) epUrl = BASEURL + (epUrl.charAt(0) === '/' ? '' : '/') + epUrl;
                            eps.push({ id: epUrl, name: epName, slug: "tap-" + epName.replace(/\s+/g, "-") });
                        }
                    }
                    if (eps.length > 0) servers.push({ name: sName, episodes: eps });
                }
            }
        }

        // Lấy nút Xem phim (extra) để app load ngầm sang trang xem phim nếu đang ở trang giới thiệu
        var extra = "";
        if (servers.length === 0) {
            var playBtnMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*btn-play[^"]*"/i) || 
                               html.match(/class="[^"]*film-buttons[^"]*"[\s\S]*?<a[^>]+href="([^"]+)"/i) ||
                               html.match(/<a[^>]+href="([^"]+)"[^>]*>Xem phim<\/a>/i);
            if (playBtnMatch) {
                extra = playBtnMatch[1];
                if (extra.indexOf('http') === -1) extra = BASEURL + (extra.charAt(0) === '/' ? '' : '/') + extra;
            }
        }

        // Sắp xếp tập
        servers.forEach(function(server) {
            if (server.episodes) {
                server.episodes.sort(function(a, b) {
                    var numA = a.name.match(/\d+/) ? parseInt(a.name.match(/\d+/)[0], 10) : 0;
                    var numB = b.name.match(/\d+/) ? parseInt(b.name.match(/\d+/)[0], 10) : 0;
                    return numA - numB;
                });
            }
        });

        return JSON.stringify({
            id: slug || id || "unknown",
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: year,
            rating: 8.5,
            status: status,
            category: category,
            episode_current: episode_current,
            servers: servers,
            duration: lduran,
            casts: "",
            director: "",
            extra: extra 
        });
    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        var pool = { k4: null, hd: null, anyM3u8: null, anyEmbed: null };
        var aRegex = /<a[^>]+data-src="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var m;
        while ((m = aRegex.exec(html)) !== null) {
            var link = m[1];
            var name = PluginUtils.cleanText(m[2]).toLowerCase();
            if (name.indexOf('4k') !== -1 && link.indexOf('.m3u8') !== -1) {
                pool.k4 = link;
            } else if (name.indexOf('1080') !== -1 && link.indexOf('.m3u8') !== -1) {
                pool.hd = link;
            } else if (link.indexOf('.m3u8') !== -1) {
                pool.anyM3u8 = link;
            } else {
                pool.anyEmbed = link;
            }
        }

        var selectedLink = pool.hd || pool.k4 || pool.anyM3u8 || pool.anyEmbed;

        if (!selectedLink) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) selectedLink = iframeMatch[1];
        }

        if (selectedLink) {
            if (selectedLink.indexOf('//') === 0) selectedLink = 'https:' + selectedLink;
            var isM3u8 = selectedLink.indexOf('.m3u8') !== -1;
            var streamlink = selectedLink;

            if (isM3u8) {
                // Regex chuẩn xác nhất để convert domain/folder/index.m3u8 => domain/stream/m3u8/index.m3u8 (tránh lỗi ngốn RAM của engine)
                streamlink = selectedLink.replace(/(https?:\/\/[^\/]+)\/[\s\S]+?\/([^\/]+\.m3u8)(?:\?.*)?$/, '$1/stream/m3u8/$2');
            }

            return JSON.stringify({
                url: streamlink,
                isEmbed: false,
                mimeType: isM3u8 ? "application/x-mpegURL" : "",
                headers: {
                    "Referer": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                subtitles: []
            });
        }
        return JSON.stringify({ url: "", headers: {} });
    } catch (e) {
        return JSON.stringify({ url: "", headers: {} });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
