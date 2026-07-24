// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://phimchillhdf.im";

function getManifest() {
    return JSON.stringify({
        "id": "phimchill",          
        "name": "Phim Chill",
        "description": "Phim online chất lượng cao",
        "version": "5.0.0",             
        "baseUrl": BASEURL,
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/motherless_logo.jpgphimchill.ico", 
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "danh-sach/phim-moi.html", "title": "Phim Mới Đề Cử", "type": "Grid" },
        { "slug": "quoc-gia/han-quoc.html", "title": "Phim Hàn Quốc", "type": "Grid" },
        { "slug": "quoc-gia/trung-quoc.html", "title": "Phim Trung Quốc", "type": "Grid" },
        { "slug": "quoc-gia/au-my.html", "title": "Phim Âu Mỹ", "type": "Grid" },
        { "slug": "danh-sach/phim-le.html", "title": "Top Phim Lẻ", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify({
        category: menulist
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    if (slug && slug.indexOf("http") > -1) {
        return slug;
    }

    try {
        var filters = typeof filtersJson === "string" ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        var page = parseInt(filters.page) || 1;
        var path = slug || "";

        if (filters.category) {
            if (Array.isArray(filters.category) && filters.category.length > 0) {
                path = filters.category[0].slug || path;
            } else if (typeof filters.category === "string") {
                path = filters.category;
            }
        }

        var url = BASEURL + (path ? "/" + path : "");
        if (page > 1) {
            url += "?page=" + page;
        }

        return url.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        var fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    var encodedKeyword = encodeURIComponent(keyword || "");
    var page = 1;

    try {
        var filters = typeof filtersJson === "string" ? JSON.parse(filtersJson || "{}") : (filtersJson || {});
        page = parseInt(filters.page) || 1;
    } catch (e) {}

    var url = BASEURL + "/?search=" + encodedKeyword;
    if (page > 1) {
        url += "&page=" + page;
    }

    return url;
}

function getUrlDetail(id) {
    if (!id) return "";
    if (id.indexOf('http') === 0) return id;
    return BASEURL + (id.startsWith('/') ? '' : '/') + id;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var seen = {};

        var articleRegex = /<article[\s\S]*?<\/article>/gi;
        var articles = html.match(articleRegex) || [];

        for (var i = 0; i < articles.length; i++) {
            var block = articles[i];

            var hrefMatch = block.match(/href="([^"]+)"/i);
            if (!hrefMatch) continue;
            var href = hrefMatch[1].trim();

            if (href.indexOf("/the-loai/") !== -1 || href.indexOf("/quoc-gia/") !== -1 || href.indexOf("/danh-sach/") !== -1 || href === BASEURL || href === BASEURL + "/") {
                continue;
            }

            var titleMatch = block.match(/title="([^"]+)"/i) || block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
            if (!titleMatch) continue;
            var title = titleMatch[1].replace(/<[^>]*>/g, '').trim();

            if (!title || title === "Video không tiêu đề" || title.length < 2) continue;

            var srcMatch = block.match(/src="([^"]+)"/i) || block.match(/data-src="([^"]+)"/i);
            var posterUrl = srcMatch ? srcMatch[1].trim() : "";

            if (posterUrl) {
                if (posterUrl.indexOf('/') === 0 && posterUrl.indexOf('//') !== 0) {
                    posterUrl = BASEURL + posterUrl;
                } else if (posterUrl.indexOf('http') !== 0 && posterUrl.indexOf('//') !== 0) {
                    posterUrl = BASEURL + "/" + posterUrl;
                }
            }

            if (!seen[href]) {
                items.push({
                    "id": href,
                    "title": title,
                    "posterUrl": posterUrl,
                    "backdropUrl": posterUrl,
                    "quality": "HD"
                });
                seen[href] = true;
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 20,
                "totalItems": items.length * 20,
                "itemsPerPage": 24
            }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// =============================================================================
// PARSER CHI TIẾT PHIM & BÓC SỐ TẬP CHUẨN XÁC TỪ PHẦN TRẠNG THÁI
// =============================================================================

function parseMovieDetail(htmlContent, url) {
    try {
        var idMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) ||
                      htmlContent.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
        var id = idMatch ? idMatch[1] : (url || "");
        
        var lname = "Đang cập nhật...";
        var limg = "";
        var ldes = "Không có mô tả.";
        var ldirec = "";
        var lactor = "";
        
        var rmatch = htmlContent.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) limg = rmatch[1];
        
        rmatch = htmlContent.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lname = rmatch[1];
        
        rmatch = htmlContent.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldes = rmatch[1];

        rmatch = htmlContent.match(/meta\s+property="video:director"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) ldirec = rmatch[1];

        rmatch = htmlContent.match(/meta\s+property="video:actor"\s+content="([^"]+)"/i);
        if (rmatch && rmatch[1]) lactor = rmatch[1];

        var episodes = [];
        var seenEp = {};
        
        // 1. Quét các link tập phim thực tế nếu có sẵn
        var aRegex = /<a[^>]*href="([^"]+\/phim\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        while ((match = aRegex.exec(htmlContent)) !== null) {
            var epUrl = match[1].trim();
            var epText = match[2].replace(/<[^>]*>/g, '').trim();

            if (epUrl.indexOf('http') !== 0) {
                epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;
            }

            if (epUrl.indexOf('tap-') !== -1 && !seenEp[epUrl]) {
                var numMatch = epUrl.match(/tap-(\d+)/i);
                var nameEp = numMatch ? ("Tập " + numMatch[1]) : (!isNaN(epText) ? ("Tập " + epText) : "Tập");
                
                episodes.push({
                    id: epUrl,
                    name: nameEp,
                    slug: epUrl.split('/').pop()
                });
                seenEp[epUrl] = true;
            }
        }

        // 2. Nếu chưa có danh sách tập, lấy chính xác số tập từ trường "Trạng thái" (Ưu tiên số sau chữ Tập hoặc số đứng trước dấu /)
        if (episodes.length === 0) {
            var totalEpisodes = 1;

            // Quét các dạng trạng thái: "Tập 11 Vietsub", "Hoàn tất 28/28", "Tập 27 Vietsub + TM"
            var statusBlockMatch = htmlContent.match(/Trạng\s*thái[\s\S]*?>([\s\S]*?)<\/(?:div|span|p|td)/i);
            var statusText = statusBlockMatch ? statusBlockMatch[1] : htmlContent;

            var epNumMatch = statusText.match(/Tập\s*(\d+)/i) || 
                             statusText.match(/\/\s*(\d+)\s*\)/i) || 
                             statusText.match(/(\d+)\s*\/\s*(\d+)/i);

            if (epNumMatch) {
                // Nếu dạng 28/28 thì lấy số phía sau hoặc số đơn lẻ sau chữ Tập
                totalEpisodes = parseInt(epNumMatch[2] || epNumMatch[1], 10) || 1;
            } else if (statusText.toLowerCase().indexOf("full") !== -1 || statusText.toLowerCase().indexOf("hoàn tất") !== -1) {
                // Nếu là phim lẻ hoặc hoàn tất nhưng không bắt được số, mặc định 1 hoặc quét tiếp
                totalEpisodes = 1;
            }

            var xemPhimMatch = htmlContent.match(/href="([^"]+\/phim\/[^"]+\/tap-1[^"]*)"/i) || 
                               htmlContent.match(/href="([^"]+\/tap-1[^"]*)"/i) ||
                               htmlContent.match(/href="([^"]+)"[^>]*>[^<]*Xem Phim/i);

            var baseEpUrl = "";
            if (xemPhimMatch) {
                baseEpUrl = xemPhimMatch[1];
                if (baseEpUrl.indexOf('http') !== 0) {
                    baseEpUrl = BASEURL + (baseEpUrl.startsWith('/') ? '' : '/') + baseEpUrl;
                }
            } else {
                var cleanId = id.replace(/_[^/]+\.html$/, "").replace(/\.html$/, "");
                baseEpUrl = cleanId + "/tap-1_" + Math.floor(Math.random() * 900000 + 100000) + ".html";
            }

            // Nếu chỉ có 1 tập (phim lẻ / full)
            if (totalEpisodes <= 1 && (statusText.toLowerCase().indexOf("full") !== -1 || statusText.toLowerCase().indexOf("hoàn tất (1/1)") !== -1)) {
                episodes.push({
                    id: baseEpUrl,
                    name: "Full",
                    slug: "full"
                });
            } else {
                // Tạo danh sách chính xác từ 1 đến totalEpisodes theo trạng thái
                for (var t = 1; t <= totalEpisodes; t++) {
                    var currentEpUrl = baseEpUrl.replace(/\/tap-\d+_[^/]+\.html/i, "/tap-" + t + "_" + (1370000 + t) + ".html");
                    if (currentEpUrl.indexOf('tap-') === -1) {
                        currentEpUrl = baseEpUrl.replace(/tap-1/, "tap-" + t);
                    }
                    episodes.push({
                        id: currentEpUrl,
                        name: "Tập " + t,
                        slug: "tap-" + t
                    });
                }
            }
        }

        // Sắp xếp lại thứ tự tập từ 1 đến N chuẩn xác
        if (episodes.length > 1) {
            episodes.sort(function(a, b) {
                var numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                var numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                return numA - numB;
            });
        }

        var servers = [];
        if (episodes.length > 0) {
            servers.push({
                name: "Danh Sách Vietsub",
                episodes: episodes
            });
        } else {
            servers.push({
                name: "Phim Lẻ",
                episodes: [{ id: id, name: "Full", slug: "full" }]
            });
        }

        return JSON.stringify({
            id: id,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            quality: "HD",
            year: 2026,
            rating: 8.0,
            servers: servers,
            casts: lactor,
            director: ldirec
        });
        
    } catch (e) {
        return JSON.stringify({
            id: url || "error",
            title: "Lỗi tải phim",
            servers: []
        });
    }
}

// =============================================================================
// PARSER CHI TIẾT TẬP PHIM & TRẢ THẲNG LINK STREAM M3U8
// =============================================================================

function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        var mimeType = "application/x-mpegURL";
        var isEmbed = false;

        var m3u8Match = html.match(/data-type="m3u8"[^>]*data-link="([^"]+)"/i) || html.match(/data-link="([^"]+\.m3u8[^"]*)"/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1];
        }

        if (!streamUrl) {
            var embedMatch = html.match(/data-type="embed"[^>]*data-link="([^"]+)"/i);
            if (embedMatch) {
                streamUrl = embedMatch[1];
                isEmbed = true;
            }
        }

        if (!streamUrl) {
            var genericMatch = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
            if (genericMatch) {
                streamUrl = genericMatch[1];
            } else {
                streamUrl = url;
                isEmbed = true;
            }
        }

        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": isEmbed,
            "mimeType": isEmbed ? "" : mimeType,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({
            url: url,
            isEmbed: true,
            headers: {}
        });
    }
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
danh-sach/phim-le.html@@Phim Lẻ
danh-sach/phim-bo.html@@Phim Bộ
the-loai/short-drama.html@@Phim Ngắn
the-loai/tinh-cam.html@@Tình Cảm
the-loai/am-nhac.html@@Âm Nhạc
the-loai/tam-ly.html@@Tâm Lý
the-loai/kinh-di.html@@Kinh Dị
the-loai/tai-lieu.html@@Tài Liệu
the-loai/tv-shows.html@@TV Shows
the-loai/hanh-dong.html@@Hành Động
the-loai/vien-tuong.html@@Viễn Tưởng
the-loai/than-thoai.html@@Thần Thoại
the-loai/vo-thuat.html@@Võ Thuật
the-loai/chien-tranh.html@@Chiến Tranh
the-loai/chinh-kich.html@@Chính Kịch
the-loai/phieu-luu.html@@Phiêu Lưu
the-loai/hai-huoc.html@@Hài Hước
the-loai/co-trang.html@@Cổ Trang
the-loai/gia-dinh.html@@Gia Đình
the-loai/hoc-duong.html@@Học Đường
the-loai/hinh-su.html@@Hình Sự
the-loai/bi-an.html@@Bí Ẩn
the-loai/phim-18.html@@Phim 18+
`;
}

function buildMenu(listurl) {
    let menulist = [];
    if (!listurl) return menulist;
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        if (!link || !name) continue;
        menulist.push({ "slug": link, "name": name });
    }
    return menulist;
}
