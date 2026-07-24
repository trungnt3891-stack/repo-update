// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "3.1.0", // Fix dứt điểm Lỗi Tìm Kiếm & Lỗi Trùng Lặp Phim
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
        { slug: 'hoat-hinh-3d', title: 'Hoạt Hình 3D', type: 'Horizontal', path: '' },
        { slug: 'hoat-hinh-2d', title: 'Hoạt Hình 2D', type: 'Horizontal', path: '' },
        { slug: 'hoat-hinh-4k', title: 'Hoạt Hình 4K', type: 'Horizontal', path: '' },
        { slug: 'hoan-thanh', title: 'Đã Hoàn Thành', type: 'Horizontal', path: '' },
        { slug: 'dang-chieu', title: 'Đang Chiếu', type: 'Horizontal', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Mới Cập Nhật', slug: 'home' },
        { name: 'Hoạt Hình 3D', slug: 'hoat-hinh-3d' },
        { name: 'Hoạt Hình 2D', slug: 'hoat-hinh-2d' },
        { name: 'Hoạt Hình 4K', slug: 'hoat-hinh-4k' },
        { name: 'Đã Hoàn Thành', slug: 'hoan-thanh' },
        { name: 'Đang Chiếu', slug: 'dang-chieu' },
        { name: 'Phim Lẻ | Ova', slug: 'phim-le' },
        { name: 'Huyền Huyễn', slug: 'the-loai/huyen-huyen' },
        { name: 'Tiên Hiệp', slug: 'the-loai/tien-hiep' },
        { name: 'Xuyên Không', slug: 'the-loai/xuyen-khong' },
        { name: 'Cổ Trang', slug: 'the-loai/co-trang' }
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

// ĐÃ FIX CỰC CHUẨN: Đường dẫn tìm kiếm tương thích 100% với WordPress của YanHH3D
function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var cleanKeyword = encodeURIComponent(keyword.trim());
    
    if (page === 1) {
        return "https://yanhh3d.ac/?s=" + cleanKeyword;
    } else {
        return "https://yanhh3d.ac/page/" + page + "/?s=" + cleanKeyword;
    }
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

// ĐÃ FIX: Hàm quét danh sách chuẩn cho Trang Chủ và Danh Mục (Chống trùng lặp 100%)
function parseListResponse(html) {
    try {
        var movies = [];
        var seen = {};

        // Tách block bằng thẻ article hoặc class item chuẩn của theme Halim/YanHH3D
        var blocks = html.split(/<article/i);
        if (blocks.length < 2) blocks = html.split(/class=["'][^"']*halim-item[^"']*["']/i);
        if (blocks.length < 2) blocks = html.split(/class=["'][^"']*item[^"']*["']/i);

        for (var i = 1; i < blocks.length; i++) {
            var block = blocks[i];
            
            var urlMatch = block.match(/href=["']([^"']+)["']/i);
            var imgMatch = block.match(/src=["']([^"']+)["']/i) || block.match(/data-src=["']([^"']+)["']/i);
            var titleMatch = block.match(/title=["']([^"']+)["']/i) || block.match(/alt=["']([^"']+)["']/i) || block.match(/<h[234][^>]*>([^<]+)<\/h[234]>/i);
            var epMatch = block.match(/class=["'][^"']*(ep|episode|label|status|time)[^"']*["'][^>]*>([^<]+)</i);

            if (urlMatch && imgMatch && titleMatch) {
                var url = urlMatch[1];
                var img = imgMatch[1] || imgMatch[2];
                var title = PluginUtils.cleanText(titleMatch[1]);
                var episode = epMatch ? PluginUtils.cleanText(epMatch[2]) : "HD";

                // Bỏ qua các link nhiễu không phải phim
                if (url.indexOf('the-loai') !== -1 || url.indexOf('page') !== -1 || url.indexOf('?s=') !== -1) continue;
                if (img.indexOf('avatar') !== -1 || img.indexOf('logo') !== -1 || img.indexOf('banner') !== -1) continue;
                if (url === '/' || url.indexOf('javascript:') !== -1 || url.indexOf('#') === 0) continue;

                var slug = url.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "").replace(/\/$/, "");
                
                // Lọc trùng lặp nghiêm ngặt
                if (title && slug && !seen[slug]) {
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
                    seen[slug] = true; 
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

// ĐÃ FIX RIÊNG BẢN TÌM KIẾM: Loại bỏ triệt để Sidebar Bảng Xếp Hạng, chỉ giữ kết quả chuẩn
function parseSearchResponse(html) {
    try {
        // Cắt bỏ phần Sidebar / Bảng Xếp Hạng bên phải
        var cleanHtml = html;
        var sidebarIdx = cleanHtml.indexOf('id="sidebar"') !== -1 ? cleanHtml.indexOf('id="sidebar"') : cleanHtml.indexOf('class="sidebar"');
        if (sidebarIdx === -1) sidebarIdx = cleanHtml.indexOf('<aside');
        
        if (sidebarIdx !== -1) {
            cleanHtml = cleanHtml.substring(0, sidebarIdx);
        }

        return parseListResponse(cleanHtml);
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
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

        var baseSlug = "";
        var ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/i) || html.match(/<link rel="canonical" href="([^"]+)"/i);
        if (ogUrl) {
            var urlObj = ogUrl[1].replace(/\/$/, "");
            baseSlug = urlObj.substring(urlObj.lastIndexOf("/") + 1);
        }

        var maxEp = 1;
        var epMatch1 = html.match(/Tập mới nhất:.*?Tập\s*(\d+)/i);
        var epMatch2 = html.match(/Thời lượng:.*?(\d+)\//i);
        
        if (epMatch1) {
            maxEp = parseInt(epMatch1[1], 10);
        } else if (epMatch2) {
            maxEp = parseInt(epMatch2[1], 10);
        } else {
            var linkRegex = /tap-(\d+)/gi;
            var lM;
            while ((lM = linkRegex.exec(html)) !== null) {
                var n = parseInt(lM[1], 10);
                if (n > maxEp) maxEp = n;
            }
        }

        var lowerHtml = html.toLowerCase();
        var hasTM = lowerHtml.indexOf('xem thuyết minh') !== -1;
        var hasSub = lowerHtml.indexOf('xem vietsub') !== -1 || lowerHtml.indexOf('/sever2/') !== -1;
        if (!hasTM && !hasSub) hasTM = true;

        var vietsubEpisodes = [];
        var thuyetMinhEpisodes = [];

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

        var servers = [];
        if (thuyetMinhEpisodes.length > 0) {
            servers.push({ name: "Thuyết Minh", episodes: thuyetMinhEpisodes });
        }
        if (vietsubEpisodes.length > 0) {
            servers.push({ name: "Vietsub", episodes: vietsubEpisodes });
        }
        
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
