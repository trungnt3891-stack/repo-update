// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "2.5.0", // Phiên bản mới: Tự động tạo danh sách tập
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

        var blocks = html.split('<article');
        if (blocks.length < 3) blocks = html.split('class="item');
        if (blocks.length < 3) blocks = html.split('class="halim-item');
        if (blocks.length < 3) blocks = html.split('class="post-item');

        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            
            var urlMatch = block.match(/href=["']([^"']+)["']/i);
            var imgMatch = block.match(/src=["']([^"']+)["']/i) || block.match(/data-src=["']([^"']+)["']/i);
            var titleMatch = block.match(/title=["']([^"']+)["']/i) || block.match(/alt=["']([^"']+)["']/i);
            var epMatch = block.match(/class=["'][^"']*(ep|episode|label|status)[^"']*["'][^>]*>([^<]+)</i);

            if (urlMatch && imgMatch && titleMatch) {
                var url = urlMatch[1];
                var img = imgMatch[1];
                var title = PluginUtils.cleanText(titleMatch[1]);
                var episode = epMatch ? PluginUtils.cleanText(epMatch[2]) : "HD";

                if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('?s=') !== -1) continue;
                if (img.indexOf('avatar') !== -1) continue;

                if (title && !seen[url]) {
                    var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                    movies.push({
                        id: slug,
                        title: title,
                        posterUrl: img,
                        backdropUrl: img,
                        quality: "HD",
                        episode_current: episode,
                        lang: "Vietsub / TM",
                        year: 0
                    });
                    seen[url] = true;
                }
            }
        }

        var currentPage = 1;
        var currentMatch = html.match(/class=["'][^"']*current[^"']*["'][^>]*>(\d+)</i);
        if (currentMatch) currentPage = parseInt(currentMatch[1], 10);

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: currentPage,
                totalPages: 100,
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

// ĐÃ CẬP NHẬT: Dùng thuật toán nhân bản danh sách tập từ Trang Thông Tin
function parseMovieDetail(html) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        // 1. Trích xuất Slug phim chuẩn (VD: pham-nhan-tu-tien)
        var baseSlug = "";
        var ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/i) || html.match(/<link rel="canonical" href="([^"]+)"/i);
        if (ogUrl) {
            var urlObj = ogUrl[1].replace(/\/$/, "");
            baseSlug = urlObj.substring(urlObj.lastIndexOf("/") + 1);
        }

        // 2. Tìm số lượng tập lớn nhất hiện có
        var maxEp = 1;
        var epMatch1 = html.match(/Tập mới nhất:.*?Tập\s*(\d+)/i); // Bắt chữ "Tập mới nhất: Tập 183"
        var epMatch2 = html.match(/Thời lượng:.*?(\d+)\//i);       // Bắt chữ "Thời lượng: 183/..."
        
        if (epMatch1) {
            maxEp = parseInt(epMatch1[1], 10);
        } else if (epMatch2) {
            maxEp = parseInt(epMatch2[1], 10);
        } else {
            // Rà soát vét đáy các link có chữ tap- để tìm số lớn nhất
            var linkRegex = /tap-(\d+)/gi;
            var lM;
            while ((lM = linkRegex.exec(html)) !== null) {
                var n = parseInt(lM[1], 10);
                if (n > maxEp) maxEp = n;
            }
        }

        // 3. Kiểm tra xem phim có các Server nào (TM / Vietsub)
        var lowerHtml = html.toLowerCase();
        var hasTM = lowerHtml.indexOf('xem thuyết minh') !== -1;
        var hasSub = lowerHtml.indexOf('xem vietsub') !== -1 || lowerHtml.indexOf('/sever2/') !== -1;
        if (!hasTM && !hasSub) hasTM = true; // Chốt hạ mặc định

        var vietsubEpisodes = [];
        var thuyetMinhEpisodes = [];

        // 4. Vòng lặp siêu tốc: Tự động đúc danh sách tập
        if (baseSlug && maxEp > 0) {
            for (var i = 1; i <= maxEp; i++) {
                var epName = "Tập " + i;
                if (hasTM) {
                    thuyetMinhEpisodes.push({
                        id: baseSlug + "/tap-" + i,
                        name: epName,
                        slug: baseSlug + "/tap-" + i
                    });
                }
                if (hasSub) {
                    vietsubEpisodes.push({
                        id: "sever2/" + baseSlug + "/tap-" + i,
                        name: epName,
                        slug: "sever2/" + baseSlug + "/tap-" + i
                    });
                }
            }
        } 

        // 5. Đóng gói Server
        var servers = [];
        if (thuyetMinhEpisodes.length > 0) {
            servers.push({ name: "Thuyết Minh", episodes: thuyetMinhEpisodes });
        }
        if (vietsubEpisodes.length > 0) {
            servers.push({ name: "Vietsub", episodes: vietsubEpisodes });
        }
        
        // Cứu cánh nếu trang web bị lỗi hoặc phim lẻ 1 tập
        if (servers.length === 0) {
             servers.push({ name: "Hệ Thống", episodes: [{ id: baseSlug + "/tap-1", name: "Đang Cập Nhật / Full", slug: baseSlug + "/tap-1" }] });
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
            status: maxEp + " Tập"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        
        var m3u8Match = html.match(/(https?:\/\/[^"'\s<>]*\.m3u8[^"'\s<>]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, "");
        }
        
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
                    headers: { "Referer": "https://yanhh3d.ac/" },
                    isEmbed: true
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

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
