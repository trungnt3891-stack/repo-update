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
        "description": "Hoạt hình 3D Trung Quốc siêu nét.",
        "version": "2.0.2", // Phiên bản chuẩn hóa cho iOS VAX
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
    let menulist = [];
    if (!listurl) return menulist;
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        let check = parts[2] ? parts[2].trim() : undefined;
        if (!link || !name) continue;
        
        let item = {};
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
// URL GENERATION (BẢN AN TOÀN CHO IOS)
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
            // Đảm bảo không bị nhân đôi dấu gạch chéo
            if (path.indexOf('/') !== 0) path = '/' + path;
            resultUrl += path;
        }
        
        // Trang chủ của yanhh3d phân trang bằng /page/x chứ không phải ?page=x
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
// PARSERS (SỬ DỤNG STRING.SPLIT SIÊU NHẸ ĐỂ KHÔNG TREO IOS)
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
        // Cắt toàn bộ thẻ div chứa bộ phim (YanHH3D dùng class "halim-item")
        var parts = html.split('halim-item');
        
        for (var i = 1; i < parts.length; i++) {
            var p = parts[i];
            
            // Giới hạn trong thẻ article/div đó
            var endBlock = p.indexOf('</article>');
            if (endBlock === -1) endBlock = p.indexOf('</div></div>');
            if (endBlock !== -1) p = p.substring(0, endBlock);
            
            var urlM = p.match(/href=["']([^"']+)["']/i);
            var imgM = p.match(/src=["']([^"']+)["']/i) || p.match(/data-src=["']([^"']+)["']/i);
            var titleM = p.match(/title=["']([^"']+)["']/i) || p.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
            var epM = p.match(/class=["'][^"']*(?:episode|status|label)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i);

            if (urlM && titleM && imgM) {
                var url = urlM[1];
                if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('?s=') !== -1) continue;
                
                var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                var titleText = PluginUtils.cleanText(titleM[1]);
                
                if (!titleText || imgM[1].indexOf('avatar') !== -1) continue;

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
                "totalPages": 999, // Cho lướt mỏi tay
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

        var servers = [];
        
        // Cỗ máy hút tập phim siêu nhẹ (Tách Tab Thuyết Minh / Vietsub)
        var tmPart = htmlContent;
        var vsPart = "";
        
        var vsIdx = htmlContent.indexOf('id="vietsub"');
        if (vsIdx === -1) vsIdx = htmlContent.indexOf('href="#vietsub"');
        
        if (vsIdx !== -1) {
            tmPart = htmlContent.substring(0, vsIdx);
            vsPart = htmlContent.substring(vsIdx);
        }

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
                
                // Nhận diện link tập (có chữ tap- hoặc episode)
                if (epUrl.indexOf('tap-') !== -1 || epUrl.indexOf('-tap') !== -1 || epUrl.indexOf('/xem-phim') !== -1 || epUrl.indexOf('episode') !== -1) {
                    isEpisode = true;
                } else if (epText.length > 0 && epText.length <= 10 && /\d/.test(epText)) { 
                    isEpisode = true; 
                }

                if (isEpisode && epText.length > 0 && epText.length <= 25) {
                    if (epText.toLowerCase().indexOf('xem') !== -1 && epText.length > 10) continue;

                    var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                    
                    if (!seenEps[epSlug]) {
                        if (epText.indexOf('Tập') === -1 && epText.indexOf('Tap') === -1) {
                            if (!isNaN(epText.charAt(0)) || epText.charAt(0) === '0') epText = "Tập " + epText;
                        }
                        episodes.push({ id: epSlug, name: epText, slug: epSlug });
                        seenEps[epSlug] = true;
                    }
                }
            }

            if (episodes.length > 1) {
                var fM = episodes[0].name.match(/\d+/);
                var lM = episodes[episodes.length-1].name.match(/\d+/);
                if (fM && lM && parseInt(fM[0], 10) > parseInt(lM[0], 10)) {
                    episodes.reverse();
                }
            }
            return episodes;
        }

        var epTM = extractEps(tmPart);
        var epVS = extractEps(vsPart);

        if (vsIdx !== -1) {
            if (epTM.length > 0) servers.push({ name: "Thuyết Minh", episodes: epTM });
            if (epVS.length > 0) servers.push({ name: "Vietsub", episodes: epVS });
        } else {
            if (epTM.length > 0) servers.push({ name: "Danh Sách Tập", episodes: epTM });
        }

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
            extra: "" // Reset extra để không bị vòng lặp
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
