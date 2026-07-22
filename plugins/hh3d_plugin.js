// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var BASEURL = "https://yanhh3d.ac";

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d",
        "name": "HH3D - Yanhh3d",
        "description": "Trang xem phim Hoạt Hình 3D siêu hay.",
        "version": "1.2.0",
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
    if (page > 1) {
        url += "?page=" + page;
    }
    return url;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var filters = JSON.parse(filtersJson);
            if (filters.page) page = parseInt(filters.page);
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
// PARSERS (Sử dụng Regex thuần, siêu nhẹ, thay thế hoàn toàn _$ jQuery)
// =============================================================================

var PluginUtils = {
    cleanText: function (text) {
        if (!text) return "";
        return text.replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
    }
};

function parseListResponse(html) {
    try {
        var movies = [];
        // Cắt HTML theo block class="flw-item" để tránh lỗi Regex lồng nhau
        var parts = html.split('class="flw-item"');
        
        for (var i = 1; i < parts.length; i++) {
            // Lấy ra 1000 ký tự đầu của block để regex cho nhẹ và an toàn
            var block = parts[i].substring(0, 1500); 
            
            var hrefMatch = block.match(/<a[^>]+href="([^"]+)"/i);
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

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: 1,
                totalPages: 999 // Đặt cứng 999 để tính năng "Tải thêm" luôn hoạt động mượt mà
            }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html, url) {
    try {
        // Lấy Meta
        var idMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
        var id = idMatch ? idMatch[1] : (url || "");
        
        var slug = "";
        if (id) {
            var slugMatch = id.match(/\/phim\/([^\/]+)/i);
            slug = slugMatch ? slugMatch[1] : id;
        }

        var lname = "Đang cập nhật...", limg = "", ldes = "", lduran = "";
        var m = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i); if(m) lname = PluginUtils.cleanText(m[1]);
        m = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i); if(m) limg = m[1];
        m = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i); if(m) ldes = PluginUtils.cleanText(m[1]);
        m = html.match(/<meta\s+property="video:duration"\s+content="([^"]+)"/i); if(m) lduran = PluginUtils.cleanText(m[1]);

        // Hàm hỗ trợ cào Text cạnh Label
        function extractTextAfter(label) {
            var r = new RegExp(label + ".*?<[^>]+>([^<]+)", "i");
            var res = html.match(r);
            return res ? PluginUtils.cleanText(res[1]) : "";
        }

        var status = extractTextAfter("Trạng thái:");
        var year = extractTextAfter("Năm:");
        var episode_current = extractTextAfter("Tập mới nhất:");
        
        // Cào Category
        var category = "";
        var catRegex = /Thể loại:[\s\S]*?(<\/div>|<\/li>)/i;
        var catBlockMatch = html.match(catRegex);
        if (catBlockMatch) {
            var cats = [];
            var aRegex = /<a[^>]*>([^<]+)<\/a>/gi;
            var aMatch;
            while ((aMatch = aRegex.exec(catBlockMatch[0])) !== null) {
                cats.push(PluginUtils.cleanText(aMatch[1]));
            }
            category = cats.join(", ");
        }

        // Parse Servers & Episodes (Xử lý thông minh thay thế_$ jquery)
        var servers = [];
        var extra = "";
        
        // 1. Phân tích Tabs Server (Thuyết minh, Vietsub...)
        var detailBlockMatch = html.match(/class="[^"]*detail-infor-content[^"]*"([\s\S]*?)<\/ul>/i);
        if (detailBlockMatch) {
            var srvRegex = /<li[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi;
            var srvMatch;
            while ((srvMatch = srvRegex.exec(detailBlockMatch[1])) !== null) {
                var sHref = srvMatch[1];
                var sName = PluginUtils.cleanText(srvMatch[2]);
                if (sHref.indexOf('#') !== -1) {
                    var svId = sHref.split('#')[1];
                    // Tìm nội dung của tab này
                    var splitBySv = html.split('id="' + svId + '"');
                    if (splitBySv.length > 1) {
                        var epBlock = splitBySv[1].substring(0, 20000); // Lấy khoảng an toàn
                        var endBlock = epBlock.indexOf('class="tab-pane');
                        if (endBlock !== -1) epBlock = epBlock.substring(0, endBlock);
                        
                        var eps = [];
                        var epRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
                        var epMatch;
                        while ((epMatch = epRegex.exec(epBlock)) !== null) {
                            var epUrl = epMatch[1];
                            var epName = PluginUtils.cleanText(epMatch[2]);
                            if (epName && epUrl.indexOf('javascript') === -1) {
                                eps.push({
                                    id: epUrl,
                                    name: epName,
                                    slug: "tap-" + epName.replace(/\s+/g, "-")
                                });
                            }
                        }
                        if (eps.length > 0) servers.push({ name: sName, episodes: eps });
                    }
                }
            }
        }

        // Xử lý luồng tải ngầm khi phải bấm "Xem Phim" mới ra tập (Tính năng từ Code 2)
        var isPlayPage = html.indexOf('class="btn-play"') === -1 && (html.indexOf('list-severs') !== -1 || /\/(tap|episode)-/i.test(id));
        if (!isPlayPage) {
            var playBtnMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*btn-play[^"]*"/i) || html.match(/class="[^"]*film-buttons[^"]*"[\s\S]*?<a[^>]+href="([^"]+)"/i);
            if (playBtnMatch) {
                extra = playBtnMatch[1];
                if (extra.indexOf('http') === -1) extra = BASEURL + (extra.charAt(0) === '/' ? '' : '/') + extra;
            }
        }
        
        // Nếu load lần 2 (tại trang xem phim) thì làm rỗng extra để tránh lặp vô hạn
        if (servers.length > 0) {
            extra = "";
        }

        // Sort danh sách tập
        servers.forEach(function(server) {
            if (server.episodes) {
                server.episodes.sort(function(a, b) {
                    var matchA = a.name.match(/\d+/);
                    var matchB = b.name.match(/\d+/);
                    var numA = matchA ? parseInt(matchA[0], 10) : 0;
                    var numB = matchB ? parseInt(matchB[0], 10) : 0;
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
        return JSON.stringify({ id: url, title: "Lỗi dữ liệu", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        var allLinks = [];
        var linkBlockMatch = html.match(/class="[^"]*list-severs[^"]*"([\s\S]*?)(?:<\/div>|<\/ul>)/i);
        var searchArea = linkBlockMatch ? linkBlockMatch[1] : html;
        
        var linkRegex = /<a[^>]+data-src="([^"]+)"[^>]*>([^<]*)<\/a>/gi;
        var m;
        while ((m = linkRegex.exec(searchArea)) !== null) {
            allLinks.push({ link: m[1], name: PluginUtils.cleanText(m[2]).toLowerCase() });
        }

        var pool = { k4: null, hd: null, anyM3u8: null, anyEmbed: null };
        for (var i = 0; i < allLinks.length; i++) {
            var item = allLinks[i];
            var lName = item.name;
            var lUrl = item.link;
            
            if (lName.indexOf('4k') !== -1 && lUrl.indexOf('.m3u8') !== -1) {
                pool.k4 = lUrl;
            } else if (lName.indexOf('1080') !== -1 && lUrl.indexOf('.m3u8') !== -1) {
                pool.hd = lUrl;
            } else if (lUrl.indexOf('.m3u8') !== -1) {
                pool.anyM3u8 = lUrl;
            } else if (lUrl.indexOf('abyss') !== -1 || lUrl.indexOf('embed') !== -1 || lUrl.indexOf('iframe') !== -1) {
                pool.anyEmbed = lUrl;
            }
        }

        var selectedLink = pool.hd || pool.k4 || pool.anyM3u8 || pool.anyEmbed;

        if (selectedLink) {
            var isM3u8 = selectedLink.indexOf('.m3u8') !== -1;
            var streamlink = selectedLink;

            // Xử lý nối m3u8 bảo mật giống tác giả của yanhh3d
            if (isM3u8) {
                streamlink = selectedLink.replace(/(https?:\/\/[^\/]+)\/[\s\S]+?\/([^\/]+\.m3u8)$/, '$1/stream/m3u8/$2');
            }

            return JSON.stringify({
                url: streamlink,
                isEmbed: !isM3u8,
                mimeType: isM3u8 ? "application/x-mpegURL" : "",
                headers: {
                    "Referer": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                subtitles: []
            });
        }
        
        // Fallback: Nếu không tìm thấy trong list, tìm iframe trực tiếp
        var iframeMatch = html.match(/<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/i);
        if (iframeMatch) {
            var iframeSrc = iframeMatch[1];
            if (iframeSrc.indexOf('//') === 0) iframeSrc = 'https:' + iframeSrc;
            return JSON.stringify({
                url: iframeSrc,
                isEmbed: true,
                headers: { "Referer": BASEURL }
            });
        }

        return JSON.stringify({ url: "", headers: {} });
    } catch (e) {
        return JSON.stringify({ url: "", headers: {} });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
