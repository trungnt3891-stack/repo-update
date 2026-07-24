// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "YanHH3D",
        "version": "2.4.0", // Nâng version để xóa cache app cũ
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

// ĐÃ FIX: Quét toàn bộ HTML để không sót bất cứ tập nào
function parseMovieDetail(html) {
    try {
        var titleM = html.match(/<meta property="og:title" content="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        var title = titleM ? PluginUtils.cleanText(titleM[1]) : "";
        title = title.split('|')[0].replace(/Phim /gi, "").trim(); 

        var posterM = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var poster = posterM ? posterM[1] : "";

        var descM = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/<div[^>]*class=["'][^"']*desc[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        var desc = descM ? PluginUtils.cleanText(descM[1]) : "";

        var vietsubEpisodes = [];
        var thuyetMinhEpisodes = [];
        var seenV = {};
        var seenT = {};

        // Quét toàn bộ thẻ <a> có trong mã nguồn trang web
        var aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var aMatch;

        while ((aMatch = aRegex.exec(html)) !== null) {
            var epUrl = aMatch[1];
            var innerText = PluginUtils.cleanText(aMatch[2]).trim();
            var lowerText = innerText.toLowerCase();

            // 1. Lọc bỏ các liên kết nhiễu
            if (!epUrl || epUrl.indexOf('javascript') === 0 || epUrl.indexOf('#') === 0) continue;
            if (lowerText.indexOf('thuyết minh') !== -1 || lowerText.indexOf('vietsub') !== -1 || 
                lowerText.indexOf('trailer') !== -1 || lowerText.indexOf('download') !== -1) {
                continue;
            }
            if (epUrl.indexOf('the-loai') !== -1 || epUrl.indexOf('nam-phat-hanh') !== -1 || 
                epUrl.indexOf('quoc-gia') !== -1 || epUrl.indexOf('?s=') !== -1 || epUrl.indexOf('/page/') !== -1) {
                continue;
            }

            // 2. Nhận diện chính xác liên kết tập phim
            var isEpisode = false;
            
            // Dấu hiệu A: Link có chứa chữ tap- hoặc episode
            if (epUrl.indexOf('/tap-') !== -1 || epUrl.indexOf('-tap-') !== -1 || epUrl.indexOf('/episode') !== -1 || epUrl.indexOf('/xem-phim') !== -1) {
                isEpisode = true;
            } 
            // Dấu hiệu B: Tên hiển thị chỉ toàn là số (VD: 1, 2, 150)
            else if (!isNaN(innerText) && innerText.length > 0 && innerText.length <= 4) {
                isEpisode = true;
            } 
            // Dấu hiệu C: Tên hiển thị chứa từ "Tập" và độ dài ngắn
            else if (lowerText.indexOf('tập ') === 0 && innerText.length < 15) {
                isEpisode = true;
            }

            // 3. Phân loại Thuyết Minh và Vietsub
            if (isEpisode) {
                var epSlug = epUrl.replace(/https?:\/\/[^\/]+\//i, "").replace(/^\//, "");
                
                var epDisplay = innerText;
                if (!isNaN(epDisplay)) epDisplay = "Tập " + epDisplay; // Định dạng số lại cho đẹp
                if (lowerText === "xem phim" || lowerText === "xem ngay") epDisplay = "Tập 1";

                // Nhận biết Vietsub thông qua link chứa sever2 hoặc vietsub
                var isVietsub = epUrl.indexOf('/sever2/') !== -1 || epUrl.indexOf('-vietsub') !== -1;

                if (isVietsub) {
                    if (!seenV[epSlug]) {
                        vietsubEpisodes.push({ id: epSlug, name: epDisplay, slug: epSlug });
                        seenV[epSlug] = true;
                    }
                } else {
                    if (!seenT[epSlug]) {
                        thuyetMinhEpisodes.push({ id: epSlug, name: epDisplay, slug: epSlug });
                        seenT[epSlug] = true;
                    }
                }
            }
        }

        // 4. Sắp xếp các tập phim theo thứ tự tăng dần (Từ 1 -> End)
        function sortEpisodes(eps) {
            if (eps.length > 1) {
                var fM = eps[0].name.match(/\d+/);
                var lM = eps[eps.length-1].name.match(/\d+/);
                if (fM && lM && parseInt(fM[0], 10) > parseInt(lM[0], 10)) {
                    eps.reverse();
                }
            }
            return eps;
        }

        vietsubEpisodes = sortEpisodes(vietsubEpisodes);
        thuyetMinhEpisodes = sortEpisodes(thuyetMinhEpisodes);

        var servers = [];
        if (thuyetMinhEpisodes.length > 0) {
            servers.push({ name: "Thuyết Minh", episodes: thuyetMinhEpisodes });
        }
        if (vietsubEpisodes.length > 0) {
            servers.push({ name: "Vietsub", episodes: vietsubEpisodes });
        }
        
        // Cứu cánh nếu trang web lỗi giao diện, trả về 1 nút dự phòng
        if (servers.length === 0) {
             servers.push({ name: "Hệ Thống", episodes: [{ id: "", name: "Đang Cập Nhật", slug: "" }] });
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
            status: (vietsubEpisodes.length + thuyetMinhEpisodes.length) + " Tập"
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
