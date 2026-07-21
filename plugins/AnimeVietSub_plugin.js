// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "animevietsub",
        "name": "AnimeVietSub",
        "version": "1.1.2",
        "baseUrl": "https://animevietsub.wiki",
        "iconUrl": "https://animevietsub.wiki/statics/default/images/logo.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "embedtoexoplay"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'anime-moi-cap-nhat', title: 'Anime Mới Cập Nhật', type: 'Grid', path: '/' },
        { slug: 'anime-bo', title: 'Anime Bộ', type: 'Horizontal', path: 'anime-bo' },
        { slug: 'anime-le', title: 'Anime Lẻ/Movie', type: 'Horizontal', path: 'anime-le' },
        { slug: 'hoat-hinh-trung-quoc', title: 'HH Trung Quốc', type: 'Horizontal', path: 'hoat-hinh-trung-quoc' },
        { slug: 'anime-sap-chieu', title: 'Anime Sắp Chiếu', type: 'Horizontal', path: 'anime-sap-chieu' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Anime Bộ', slug: 'anime-bo' },
        { name: 'Anime Lẻ', slug: 'anime-le' },
        { name: 'HH Trung Quốc', slug: 'hoat-hinh-trung-quoc' },
        { name: 'Anime Sắp Chiếu', slug: 'anime-sap-chieu' },
        { name: 'Hành Động', slug: 'the-loai/hanh-dong' },
        { name: 'Phiêu Lưu', slug: 'the-loai/phieu-luu' },
        { name: 'Hài Hước', slug: 'the-loai/hai-huoc' },
        { name: 'Phép Thuật', slug: 'the-loai/phep-thuat' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'latest' },
            { name: 'Lượt xem', value: 'view' },
            { name: 'Bình chọn', value: 'rating' }
        ]
    });
}

function log(msg) {
    if (typeof console !== 'undefined' && console.log) {
        console.log("[AnimeVsubPlugin] " + msg);
    }
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        var targetSlug = slug;
        if (filters.category) {
            targetSlug = "the-loai/" + filters.category;
        }

        if (targetSlug.startsWith("/")) targetSlug = targetSlug.substring(1);
        if (targetSlug.endsWith("/")) targetSlug = targetSlug.substring(0, targetSlug.length - 1);

        var baseUrl = "https://animevietsub.wiki";
        
        if (targetSlug === 'anime-moi-cap-nhat' || targetSlug === '') {
            if (page === 1) return baseUrl + "/";
            return baseUrl + "/anime-moi-cap-nhat/trang-" + page + ".html";
        }

        if (page === 1) {
            return baseUrl + "/" + targetSlug + "/";
        } else {
            return baseUrl + "/" + targetSlug + "/trang-" + page + ".html";
        }
    } catch (e) {
        return "https://animevietsub.wiki/";
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var cleanKeyword = encodeURIComponent(keyword.trim());
        
        if (page === 1) {
            return "https://animevietsub.wiki/tim-kiem/" + cleanKeyword + "/";
        } else {
            return "https://animevietsub.wiki/tim-kiem/" + cleanKeyword + "/trang-" + page + ".html";
        }
    } catch (e) {
        return "https://animevietsub.wiki/";
    }
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    var cleanSlug = slug;
    if (cleanSlug.startsWith("/")) cleanSlug = cleanSlug.substring(1);
    if (cleanSlug.startsWith("phim/")) cleanSlug = cleanSlug.substring(5);
    return "https://animevietsub.wiki/phim/" + cleanSlug;
}

function getUrlCategories() { return "https://animevietsub.wiki"; }
function getUrlCountries() { return "https://animevietsub.wiki"; }
function getUrlYears() { return "https://animevietsub.wiki"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(htmlContent) {
    try {
        var movies = [];
        var seen = {};

        function extractMovie(cardHtml) {
            var linkMatch = /<a\s+[^>]*href="([^"]*\/phim\/[^"]+)"[^>]*(?:title="([^"]+)")?/i.exec(cardHtml);
            if (!linkMatch) linkMatch = /<a\s+href="([^"]+)"\s+title="([^"]+)"/i.exec(cardHtml);
            if (!linkMatch) return null;

            var href = linkMatch[1];
            var slug = href;
            var slugMatch = /\/phim\/([^/]+)/.exec(href);
            if (slugMatch) {
                slug = slugMatch[1];
            } else {
                slug = href.substring(href.lastIndexOf('/') + 1) || href;
            }
            slug = slug.replace(/\/$/, '');
            if (seen[slug]) return null;
            seen[slug] = true;

            var epMatch = /<span class="mli-eps">[\s\S]*?<i>([^<]+)<\/i>/i.exec(cardHtml);
            var episode_current = epMatch ? "Tập " + epMatch[1].trim() : "";

            var imgMatch = /<img[^>]*(?:src|data-src)="([^"]+)"/i.exec(cardHtml);
            var posterUrl = imgMatch ? imgMatch[1] : "";

            var titleMatch = /<h2[^>]*class="Title"[^>]*>([\s\S]*?)<\/h2>/i.exec(cardHtml) || /<div class="Title">([\s\S]*?)<\/div>/i.exec(cardHtml);
            var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : (linkMatch[2] || "");

            var year = 0;
            var yearMatch = /<span class="Date[^"]*">\s*(\d{4})\s*<\/span>/i.exec(cardHtml) || /\((\d{4})\)/.exec(title);
            if (yearMatch) year = parseInt(yearMatch[1]);

            return {
                id: slug,
                title: title,
                posterUrl: posterUrl,
                backdropUrl: posterUrl,
                year: year,
                quality: "HD",
                episode_current: episode_current,
                lang: "Vietsub"
            };
        }

        var articlePattern = /<article class="TPost[^"]*">[\s\S]*?<\/article>/gi;
        var match;
        while ((match = articlePattern.exec(htmlContent)) !== null) {
            var movie = extractMovie(match[0]);
            if (movie) movies.push(movie);
        }

        if (movies.length === 0) {
            var listBlock = /<ul class="MovieList Newepisode">[\s\S]*?<\/ul>/i.exec(htmlContent);
            if (listBlock) {
                var liPattern = /<li>[\s\S]*?<\/li>/gi;
                while ((match = liPattern.exec(listBlock[0])) !== null) {
                    var movie = extractMovie(match[0]);
                    if (movie) movies.push(movie);
                }
            }
        }

        if (movies.length === 0) {
            var divPattern = /<div class="TPost[^"]*">[\s\S]*?<\/div>\s*<\/div>/gi;
            while ((match = divPattern.exec(htmlContent)) !== null) {
                var movie = extractMovie(match[0]);
                if (movie) movies.push(movie);
            }
        }

        var totalPages = 1;
        var lastPageMatch = /href="[^"]*trang-(\d+)\.html"[^>]*>Trang Cuối<\/a>/i.exec(htmlContent);
        if (lastPageMatch) {
            totalPages = parseInt(lastPageMatch[1]);
        } else {
            var pagePattern = /class="page[^"]*">(\d+)<\/a>/gi;
            var pMatch;
            while ((pMatch = pagePattern.exec(htmlContent)) !== null) {
                var pNum = parseInt(pMatch[1]);
                if (pNum > totalPages) totalPages = pNum;
            }
        }

        var currentPage = 1;
        var curPageMatch = /class="[^"]*current[^"]*">(\d+)<\/span>/i.exec(htmlContent);
        if (curPageMatch) currentPage = parseInt(curPageMatch[1]);

        return JSON.stringify({
            items: movies,
            pagination: { currentPage: currentPage, totalPages: totalPages }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(htmlContent) {
    return parseListResponse(htmlContent);
}

function parseMovieDetail(htmlContent) {
    try {
        var idMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(htmlContent) || /<meta\s+property="og:url"\s+content="([^"]+)"/i.exec(htmlContent);
        var id = idMatch ? idMatch[1] : "";

        var titleMatch = /<h1[^>]* itemprop="name">([\s\S]*?)<\/h1>/i.exec(htmlContent) || /<h1 class="title">([\s\S]*?)<\/h1>/i.exec(htmlContent);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";

        var descMatch = /<div class="Description[^"]*" itemprop="description">([\s\S]*?)<\/div>/i.exec(htmlContent) || /<div id="film-info-desc"[^>]*>([\s\S]*?)<\/div>/i.exec(htmlContent);
        var description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").trim() : "";

        var posterMatch = /<img[^>]*class="[^"]*attachment-img-mov-md[^"]*"[^>]*(?:src|data-src)="([^"]+)"/i.exec(htmlContent) || /<img class="poster"[^>]*(?:src|data-src)="([^"]+)"/i.exec(htmlContent);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var genres = [];
        var genreBlockMatch = /<li>\s*<span class="info-title">Thể loại:<\/span>([\s\S]*?)<\/li>/i.exec(htmlContent) || /Thể loại:([\s\S]*?)(?:<br|<\/li>)/i.exec(htmlContent);
        if (genreBlockMatch) {
            var genrePattern = /<a[^>]*>([^<]+)<\/a>/gi;
            var genreMatch;
            while ((genreMatch = genrePattern.exec(genreBlockMatch[1])) !== null) genres.push(genreMatch[1].trim());
        }

        var countries = [];
        var countryBlockMatch = /<li>\s*<span class="info-title">Quốc gia:<\/span>([\s\S]*?)<\/li>/i.exec(htmlContent);
        if (countryBlockMatch) {
            var countryPattern = /<a[^>]*>([^<]+)<\/a>/gi;
            var countryMatch;
            while ((countryMatch = countryPattern.exec(countryBlockMatch[1])) !== null) countries.push(countryMatch[1].trim());
        }

        var year = 0;
        var yearMatch = /<li>\s*<span class="info-title">Năm phát hành:<\/span>[\s\S]*?<a[^>]*>(\d{4})<\/a>/i.exec(htmlContent) || /Season:[\s\S]*?- (\d{4})/i.exec(htmlContent);
        if (yearMatch) year = parseInt(yearMatch[1]);

        var statusMatch = /<li>\s*<span class="info-title">Trạng thái:<\/span>\s*([\s\S]*?)<\/li>/i.exec(htmlContent);
        var status = statusMatch ? statusMatch[1].replace(/<[^>]*>/g, "").trim() : "";

        var episode_current = "";
        if (status) {
            var epMatch2 = /(Tập \d+|Full|Hoàn Tất)/i.exec(status);
            if (epMatch2) episode_current = epMatch2[1];
        }

        var slug = "";
        if (id) {
            var slugMatch = /\/phim\/([^/]+)/.exec(id);
            slug = slugMatch ? slugMatch[1] : id;
        }
        if (!slug) {
            var slugMatch2 = /\/phim\/([^/]+)/.exec(htmlContent);
            slug = slugMatch2 ? slugMatch2[1] : "";
        }

        // --- CẢI TIẾN QUÉT TẬP PHIM CHỐNG MẤT TẬP ---
        var episodes = [];
        var addedEps = {};
        
        // Quét TẤT CẢ các thẻ <a> trong trang
        var epPattern = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        var match;
        
        while ((match = epPattern.exec(htmlContent)) !== null) {
            var epUrl = match[1].trim();
            var rawName = match[2].replace(/<[^>]*>/g, "").trim();
            
            if (epUrl === '#' || epUrl.toLowerCase().indexOf('javascript') > -1) continue;
            
            // Lọc: Phải là link tập phim hoặc link xem phim của bộ này
            var isEp = false;
            if (epUrl.indexOf('tap-') > -1 || epUrl.indexOf('xem-phim') > -1) {
                if (slug && epUrl.indexOf(slug) > -1) {
                    isEp = true;
                } else if (epUrl.startsWith('tap-') || epUrl.startsWith('/tap-') || epUrl.startsWith('xem-phim')) {
                    isEp = true; // Relative link hợp lệ
                }
            }
            
            if (isEp) {
                // Chuẩn hóa đường dẫn
                if (epUrl.startsWith('/')) {
                    epUrl = "https://animevietsub.wiki" + epUrl;
                } else if (!epUrl.startsWith('http')) {
                    epUrl = "https://animevietsub.wiki/phim/" + slug + "/" + epUrl;
                }
                
                // Tránh add trùng lặp cùng 1 tập
                if (!addedEps[epUrl]) {
                    addedEps[epUrl] = true;
                    var epName = rawName;
                    
                    if (/^\d+(\.\d+)?$/.test(epName)) epName = "Tập " + epName; // Gắn chữ Tập nếu chỉ có số
                    if (!epName || epName.toLowerCase() === 'xem') epName = "Full"; // Fallback tên
                    
                    episodes.push({ id: epUrl, name: epName, slug: epUrl });
                }
            }
        }

        // Cải tiến hàm Sort an toàn: Xử lý mượt cả tập số lẫn tập mang chữ
        episodes.sort(function(a, b) {
            var numA = a.name.match(/\d+(\.\d+)?/);
            var numB = b.name.match(/\d+(\.\d+)?/);
            
            var valA = numA ? parseFloat(numA[0]) : (a.name === "Full" ? 0 : 9999);
            var valB = numB ? parseFloat(numB[0]) : (b.name === "Full" ? 0 : 9999);
            
            if (valA === valB) return a.name.localeCompare(b.name);
            return valA - valB;
        });

        // Hỗ trợ fetch trang xem-phim ngầm định nếu trang Info rỗng tập phim
        var isPlayPage = (id && id.indexOf("xem-phim") > -1) || htmlContent.indexOf("window.PLAYER_DATA") > -1;
        var extra = "";
        if (!isPlayPage && slug && slug !== "error") {
            extra = "https://animevietsub.wiki/phim/" + slug + "/xem-phim.html";
        }

        var servers = [];
        if (episodes.length > 0) {
            servers.push({ name: "AnimeVsub", episodes: episodes });
        }

        return JSON.stringify({
            id: slug,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            year: year,
            servers: servers,
            episode_current: episode_current,
            lang: "Vietsub",
            quality: "HD",
            category: genres.join(", "),
            country: countries.join(", "),
            status: status,
            extra: extra
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "", servers: [] });
    }
}

function parseDetailResponse(htmlContent, pageUrl) {
    try {
        var link = "";
        var match = /window\.PLAYER_DATA\s*=\s*(\{.*?\});/s.exec(htmlContent);
        if (match) {
            var data = JSON.parse(match[1]);
            if (data && data.link) link = data.link;
        }
        
        if (!link) {
            var iframeMatch = htmlContent.match(/<iframe[^>]*src="([^"]+)"/i);
            if (iframeMatch) link = iframeMatch[1];
        }
        
        if (link) {
            if (link.indexOf('//') === 0) link = "https:" + link;
            
            // --- FIX FRAME KILLER (CHÌA KHÓA QUAN TRỌNG) ---
            // Bắt buộc trả về isEmbed: false để ép app TẢI link iframe và đưa xuống hàm parseEmbedResponse
            // thay vì bật WebView lên và dính lỗi chặn frame.
            return JSON.stringify({
                url: link,
                isEmbed: false, 
                headers: {
                    "Referer": pageUrl || "https://animevietsub.wiki/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                subtitles: []
            });
        }
        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
    }
}

function parseEmbedResponse(htmlContent, url) {
    try {
        // App sẽ đổ mã nguồn HTML của trang iframe vào đây. 
        // Ta dùng Regex moi trực tiếp file m3u8/mp4 ra phát luôn, lờ đi đoạn mã JS chặn frame.
        var m3u8Match = /["'](https?:\/\/[^"'\s]*\.(?:m3u8|mp4)[^"'\s]*?)["']/i.exec(htmlContent) ||
                        /(https?:\/\/[^\s"'<>]+\.(?:m3u8|mp4)[^\s"'<>]*)/i.exec(htmlContent) ||
                        /file\s*:\s*["']([^"']+?)["']/i.exec(htmlContent) ||
                        /source\s*:\s*["']([^"']+?)["']/i.exec(htmlContent);
        
        if (m3u8Match) {
            var finalUrl = m3u8Match[1];
            if (finalUrl.indexOf('.m3u8') > -1 || finalUrl.indexOf('.mp4') > -1) {
                return JSON.stringify({
                    url: finalUrl,
                    isEmbed: false,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": url, // Referer phải là link của trang Iframe
                        "Origin": "https://animevietsub.wiki"
                    },
                    subtitles: []
                });
            }
        }

        // Phương án dự phòng: Nếu thực sự không bóc được m3u8 thì đành mở Webview
        // Gắn script bẻ khóa Object window.top mạnh nhất có thể.
        var bypassJs = "try { Object.defineProperty(window, 'top', { get: function() { return window; } }); Object.defineProperty(window, 'parent', { get: function() { return window; } }); } catch(e) {}";
        
        return JSON.stringify({
            url: url,
            isEmbed: true,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://animevietsub.wiki/",
                "Custom-Js": bypassJs,
                "Block-Scripts": "avs-shield|devtools|debugger"
            },
            subtitles: []
        });
    } catch (e) {
        return JSON.stringify({ url: url, isEmbed: true, headers: {}, subtitles: [] });
    }
}

// =============================================================================
// CATEGORIES
// =============================================================================

function parseCategoriesResponse(htmlContent) {
    try {
        var categories = [];
        var menuBlock = /<ul class="sub-menu[^"]*">([\s\S]*?)<\/ul>/i.exec(htmlContent);
        if (menuBlock) {
            var catPattern = /<a\s+href="[^"]*\/the-loai\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            var catMatch;
            while ((catMatch = catPattern.exec(menuBlock[1])) !== null) {
                var catSlug = catMatch[1].replace(/\//g, "");
                var catName = catMatch[2].trim();
                if (catSlug && catName) categories.push({ name: catName, slug: catSlug });
            }
        }
        
        if (categories.length === 0) {
            var fallbackPattern = /<a\s+href="[^"]*\/the-loai\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            var fbMatch;
            while ((fbMatch = fallbackPattern.exec(htmlContent)) !== null) {
                var fbSlug = fbMatch[1].replace(/\//g, "");
                var fbName = fbMatch[2].trim();
                var exists = false;
                for (var i = 0; i < categories.length; i++) {
                    if (categories[i].slug === fbSlug) { exists = true; break; }
                }
                if (!exists && fbSlug && fbName) categories.push({ name: fbName, slug: fbSlug });
            }
        }
        return JSON.stringify(categories);
    } catch (e) {
        return "[]";
    }
}

function parseCountriesResponse(htmlContent) { return "[]"; }
function parseYearsResponse(htmlContent) { return "[]"; }
