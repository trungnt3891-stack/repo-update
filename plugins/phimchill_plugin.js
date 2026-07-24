// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://phimchillhdf.im";

function getManifest() {
    return JSON.stringify({
        "id": "phimchill",          
        "name": "Phim Chill",
        "description": "Phim online chất lượng cao",
        "version": "2.0.3",             
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
// PARSERS - TỐI ƯU LOAD TRANG CHỦ & THƯ MỤC
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var seen = {};

        var regex = /<a[^>]*href=["']([^"']+\/phim\/[^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]*(?:src|data-src)=["']([^"']+)["']/gi;
        var match;

        while ((match = regex.exec(html)) !== null) {
            var url = match[1].trim();
            var title = match[2].replace(/<[^>]*>/g, '').trim();
            var posterUrl = match[3].trim();

            if (!title || title === "Video không tiêu đề") continue;

            if (posterUrl.indexOf('/') === 0 && posterUrl.indexOf('//') !== 0) {
                posterUrl = BASEURL + posterUrl;
            } else if (posterUrl.indexOf('http') !== 0 && posterUrl.indexOf('//') !== 0) {
                posterUrl = BASEURL + "/" + posterUrl;
            }

            if (!seen[url]) {
                items.push({
                    "id": url,
                    "title": title,
                    "posterUrl": posterUrl,
                    "backdropUrl": posterUrl,
                    "quality": "HD"
                });
                seen[url] = true;
            }
        }

        if (items.length === 0) {
            var articleRegex = /<article[\s\S]*?<\/article>/gi;
            var articles = html.match(articleRegex) || [];
            for (var j = 0; j < articles.length; j++) {
                var block = articles[j];
                var hMatch = block.match(/href="([^"]+\/phim\/[^"]+)"/i);
                var tMatch = block.match(/title="([^"]+)"/i);
                var iMatch = block.match(/(?:src|data-src)="([^"]+)"/i);

                if (hMatch && tMatch) {
                    var link = hMatch[1].trim();
                    var name = tMatch[1].trim();
                    var img = iMatch ? iMatch[1].trim() : "";

                    if (img.indexOf('/') === 0 && img.indexOf('//') !== 0) img = BASEURL + img;

                    if (!seen[link]) {
                        items.push({
                            "id": link,
                            "title": name,
                            "posterUrl": img,
                            "backdropUrl": img,
                            "quality": "HD"
                        });
                        seen[link] = true;
                    }
                }
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 50,
                "totalItems": items.length * 50,
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
// PARSER CHI TIẾT PHIM & BÓC TÁCH ĐẦY ĐỦ TẤT CẢ CÁC TẬP VÀ SERVER
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

        var servers = [];

        // Quét các khối danh sách server tập phim trên website (ví dụ: Danh Sách KK, Danh Sách NC...)
        var serverBlockRegex = /<span[^>]*class="[^"]*text-zinc-200[^"]*">([\s\S]*?)<\/span>\s*<div[^>]*class="[^"]*flex\s+row\s+flex-wrap[^"]*">([\s\S]*?)<\/div>/gi;
        var sMatch;
        var hasServerBlocks = false;

        while ((sMatch = serverBlockRegex.exec(htmlContent)) !== null) {
            hasServerBlocks = true;
            var serverName = sMatch[1].replace(/<[^>]*>/g, '').trim() || "Vietsub";
            var serverHtml = sMatch[2];

            var episodes = [];
            var seenEp = {};
            
            // Quét tất cả các thẻ a trong khối server đó
            var aRegex = /<a[^>]*href="([^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
            var aMatch;
            while ((aMatch = aRegex.exec(serverHtml)) !== null) {
                var epUrl = aMatch[1].trim();
                var epText = aMatch[2].replace(/<[^>]*>/g, '').trim();

                if (epUrl.indexOf('http') !== 0) {
                    epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;
                }

                if (epText && !seenEp[epUrl]) {
                    var formattedName = isNaN(epText) ? epText : ("Tập " + epText);
                    episodes.push({
                        id: epUrl,
                        name: formattedName,
                        slug: epUrl.split('/').pop()
                    });
                    seenEp[epUrl] = true;
                }
            }

            if (episodes.length > 0) {
                servers.push({
                    name: serverName,
                    episodes: episodes
                });
            }
        }

        // Dự phòng nếu trang phim không khớp cấu trúc trên, quét toàn bộ link tập có đuôi .html
        if (servers.length === 0) {
            var episodesFallback = [];
            var seenFallback = {};
            var generalARegex = /<a[^>]*href="([^"]+\/phim\/[^"]+\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
            var gMatch;
            while ((gMatch = generalARegex.exec(htmlContent)) !== null) {
                var fUrl = gMatch[1].trim();
                var fText = gMatch[2].replace(/<[^>]*>/g, '').trim();

                if (fUrl.indexOf('http') !== 0) fUrl = BASEURL + (fUrl.startsWith('/') ? '' : '/') + fUrl;

                if ((fText && !isNaN(fText) || fUrl.indexOf('tap-') !== -1) && !seenFallback[fUrl]) {
                    episodesFallback.push({
                        id: fUrl,
                        name: isNaN(fText) ? (fText || "Tập") : ("Tập " + fText),
                        slug: fUrl.split('/').pop()
                    });
                    seenFallback[fUrl] = true;
                }
            }

            if (episodesFallback.length > 0) {
                servers.push({
                    name: "Danh Sách Vietsub",
                    episodes: episodesFallback
                });
            } else {
                servers.push({
                    name: "Phim Lẻ",
                    episodes: [{ id: id, name: "Full", slug: "full" }]
                });
            }
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
