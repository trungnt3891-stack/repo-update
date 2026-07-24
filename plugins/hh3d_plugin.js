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
        "description": "Hoạt Hình 3D Trung Quốc siêu nét.",
        "version": "2.0.3", // Version mới nhất, fix lỗi load tab TM/VS
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
        var parts = html.split('<a '); // Cắt siêu nhẹ
        
        for (var i = 1; i < parts.length; i++) {
            var p = parts[i];
            var endA = p.indexOf('</a>');
            if (endA !== -1) p = p.substring(0, endA);
            
            var urlM = p.match(/href=["']([^"']+)["']/i);
            var titleM = p.match(/title=["']([^"']+)["']/i) || p.match(/>([^<]+)</i);
            var imgM = p.match(/<img[^>]+src=["']([^"']+)["']/i) || p.match(/data-src=["']([^"']+)["']/i);
            var epM = p.match(/class=["'][^"']*(?:episode|status|label)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i);

            if (urlM && titleM && imgM) {
                var url = urlM[1];
                if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('?s=') !== -1) continue;
                if (url === '/' || url.indexOf(ROOT_DOMAIN.replace('https://', '')) === url.length - ROOT_DOMAIN.length + 8) continue;
                
                var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                var titleText = PluginUtils.cleanText(titleM[1]);
                
                if (imgM[1].indexOf('avatar') !== -1 || !titleText) continue;

                movies.push({
                    "id": slug,
                    "title": titleText,
                    "posterUrl": imgM[1],
                    "backdropUrl": imgM[1],
                    "quality": "HD",
                    "episode_current": epM ? PluginUtils.cleanText(epM[1]) : "Cập nhật",
                    "lang": "Vietsub/TM",
                    "year": 0
                });
            }
        }

        var currentPage = 1;
        var currentMatch = html.match(/class=["'][^"']*current[^"']*["'][^>]*>(\d+)</i);
        if (currentMatch) currentPage = parseInt(currentMatch[1], 10);

        return JSON.stringify({
            "items": movies,
            "pagination": {
                "currentPage": currentPage,
                "totalPages": 100, 
                "totalItems": 9999,
                "itemsPerPage": 20
            }
        });

    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

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

        // Khoanh vùng khu vực chứa tập phim để tăng tốc độ phân tích
        var htmlToParse = htmlContent;
        var contentStart = htmlToParse.indexOf('class="halim-list-eps"');
        if (contentStart === -1) contentStart = htmlToParse.indexOf('id="halim-list-server"');
        if (contentStart !== -1) {
            var contentEnd = htmlToParse.indexOf('</section>', contentStart);
            if (contentEnd === -1) contentEnd = htmlToParse.indexOf('<footer', contentStart);
            if (contentEnd !== -1) {
                htmlToParse = htmlToParse.substring(contentStart, contentEnd);
            }
        }

        // TÁCH TAB THUYẾT MINH & VIETSUB
        var tmPart = htmlToParse;
        var vsPart = "";
        
        // Tìm mốc phân tách bằng chữ Vietsub hoặc ID vietsub
        var vsIdx = htmlToParse.indexOf('>Vietsub<');
        if (vsIdx === -1) vsIdx = htmlToParse.indexOf('href="#vietsub"');
        if (vsIdx === -1) vsIdx = htmlToParse.indexOf('id="vietsub"');
        
        if (vsIdx !== -1) {
            tmPart = htmlToParse.substring(0, vsIdx);
            vsPart = htmlToParse.substring(vsIdx);
        }

        // Hàm trích xuất tập phim từ HTML cục bộ
        function extractEps(block) {
            var episodes = [];
            var seenEps = {};
            var aParts = block.split('<a ');
            
            for (var i = 1; i < aParts.length; i++) {
                var p = aParts[i];
                var urlM = p.match(/href=["']([^"']+)["']/i);
                if (!urlM) continue;
                
                var epUrl = urlM[1];
                var endA = p.indexOf('</a>');
                if (endA === -1) continue;
                
                var rawText = PluginUtils.cleanText(p.substring(p.indexOf('>') + 1, endA));
                
                // Nhận diện link có chứa tap- hoặc episode, và text < 15 ký tự (chống bắt nhầm tiêu đề)
                if ((epUrl.indexOf('tap-') !== -1 || epUrl.indexOf('-tap') !== -1 || epUrl.indexOf('/xem-phim') !== -1 || epUrl.indexOf('episode') !== -1) && rawText.length > 0 && rawText.length <= 15) {
                    
                    // Loại bỏ các nút to
                    if (rawText.toLowerCase().indexOf('xem') !== -1) continue;

                    var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                    
                    if (!seenEps[epSlug]) {
                        // Thêm chữ Tập vào nếu nó chỉ là số (như trong hình: 150, 149...)
                        if (rawText.indexOf('Tập') === -1 && rawText.indexOf('Tap') === -1) {
                            if (!isNaN(rawText.charAt(0)) || rawText.charAt(0) === '0') {
                                rawText = "Tập " + rawText;
                            }
                        }
                        episodes.push({ id: epSlug, name: rawText, slug: epSlug });
                        seenEps[epSlug] = true;
                    }
                }
            }

            // Sắp xếp tăng dần (Tập 1 -> mới nhất) theo yêu cầu của bạn
            if (episodes.length > 0) {
                episodes.sort(function(a, b) {
                    var matchA = a.name.match(/\d+/);
                    var matchB = b.name.match(/\d+/);
                    var numA = matchA ? parseInt(matchA[0], 10) : 0;
                    var numB = matchB ? parseInt(matchB[0], 10) : 0;
                    return numA - numB;
                });
            }
            return episodes;
        }

        var servers = [];
        var epTM = extractEps(tmPart);
        var epVS = extractEps(vsPart);

        // Gán vào Server
        if (vsIdx !== -1) {
            if (epTM.length > 0) servers.push({ name: "Thuyết Minh", episodes: epTM });
            if (epVS.length > 0) servers.push({ name: "Vietsub", episodes: epVS });
        } else {
            // Không có tab thì gộp lại
            if (epTM.length > 0) servers.push({ name: "Danh Sách Phát", episodes: epTM });
        }

        // Fix trường hợp phim lẻ / trailer (ép chạy)
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
        return JSON.stringify({
            id: url || "error",
            title: "Lỗi",
            servers: []
        });
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
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
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
