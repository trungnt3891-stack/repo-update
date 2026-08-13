// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "nguoncnew",
        "name": "Phim NguonC Xoá Quảng Cáo",
        "version": "1.0.1", // Đã fix lỗi chí mạng JS Comment. Sniffer siêu tốc.
        "baseUrl": "https://phim.nguonc.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/nguonC.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "embedtoexoplay", // Kích hoạt Webview chạy ngầm
        "debug": true 
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'the-loai' },
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'phim-moi-cap-nhat' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'TV Shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'updated' },
            { name: 'Mới nhất', value: 'new' },
            { name: 'Lượt xem', value: 'view' }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var sort = filters.sort || "updated";

        if (slug === 'phim-moi-cap-nhat' && !filters.category && !filters.country && !filters.year) {
            return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=" + page;
        }

        if (filters.category) return "https://phim.nguonc.com/api/films/the-loai/" + filters.category + "?page=" + page + "&sort=" + sort;
        if (filters.country) return "https://phim.nguonc.com/api/films/quoc-gia/" + filters.country + "?page=" + page + "&sort=" + sort;
        if (filters.year) return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + filters.year + "?page=" + page + "&sort=" + sort;

        if (/^\d{4}$/.test(slug)) return "https://phim.nguonc.com/api/films/nam-phat-hanh/" + slug + "?page=" + page + "&sort=" + sort;

        var listSlugs = ['phim-le', 'phim-bo', 'phim-dang-chieu', 'tv-shows', 'subteam'];
        if (listSlugs.indexOf(slug) >= 0) {
            if (slug !== 'hoat-hinh') {
                return "https://phim.nguonc.com/api/films/danh-sach/" + slug + "?page=" + page + "&sort=" + sort;
            }
        }

        var countrySlugs = [
            'au-my', 'anh', 'trung-quoc', 'indonesia', 'viet-nam', 'phap', 'hong-kong',
            'han-quoc', 'nhat-ban', 'thai-lan', 'dai-loan', 'nga', 'ha-lan',
            'philippines', 'an-do', 'quoc-gia-khac'
        ];
        if (countrySlugs.indexOf(slug) >= 0) return "https://phim.nguonc.com/api/films/quoc-gia/" + slug + "?page=" + page + "&sort=" + sort;

        return "https://phim.nguonc.com/api/films/the-loai/" + slug + "?page=" + page + "&sort=" + sort;
    } catch (e) {
        return "https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=1";
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://phim.nguonc.com/api/films/search?keyword=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    var realSlug = slug.split("|")[0];
    if (realSlug.indexOf("http") === 0) return slug;
    return "https://phim.nguonc.com/api/film/" + slug;
}

function getUrlCategories() { return "https://phim.nguonc.com"; }
function getUrlCountries() { return "https://phim.nguonc.com"; }
function getUrlYears() { return "https://phim.nguonc.com"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === "string" ? JSON.parse(apiResponseJson) : apiResponseJson;
        var data = response.data || {};
        var items = [];

        if (Array.isArray(data)) items = data;
        else if (Array.isArray(response.items)) items = response.items;
        else if (data.items && Array.isArray(data.items)) items = data.items;

        var paginate = response.paginate || response.pagination || (data.params && data.params.pagination) || {};

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getImageUrl(item.thumb_url),
                backdropUrl: getImageUrl(item.poster_url),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.current_episode || item.episode_current || "",
                lang: item.language || item.lang || ""
            };
        });

        var currentPage = paginate.current_page || paginate.currentPage || 1;
        var totalItems = paginate.total_items || paginate.totalItems || 0;
        var itemsPerPage = paginate.items_per_page || paginate.itemsPerPage || paginate.totalItemsPerPage || 24;

        var totalPages = paginate.total_page || paginate.totalPages || 0;
        if (totalPages === 0 && itemsPerPage > 0) totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages === 0) totalPages = 1;

        return JSON.stringify({
            items: movies,
            pagination: { currentPage: currentPage, totalPages: totalPages, totalItems: totalItems, itemsPerPage: itemsPerPage }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = typeof apiResponseJson === "string" ? JSON.parse(apiResponseJson) : apiResponseJson;
        var movie = response.movie || response.data?.item || response.data || {};

        var rawEpisodes = movie.episodes || response.episodes || response.data?.item?.episodes || [];

        var servers = [];
        if (Array.isArray(rawEpisodes)) {
            rawEpisodes.forEach(function (server) {
                var episodes = [];
                var serverItems = server.items || server.server_data || [];

                if (Array.isArray(serverItems)) {
                    serverItems.forEach(function (ep) {
                        var m3u8 = ep.m3u8 || ep.link_m3u8 || "";
                        var embed = ep.embed || ep.link_embed || "";
                        
                        var link = embed || m3u8;

                        if (link) {
                            episodes.push({
                                id: link,
                                name: ep.name || ep.episode_name || "",
                                slug: ep.slug || ep.episode_slug || ""
                            });
                        }
                    });
                }

                if (episodes.length > 0) {
                    servers.push({
                        name: server.server_name || server.name || "Server",
                        episodes: episodes
                    });
                }
            });
        }

        var extractGroup = function (categoryObj, groupName) {
            if (!categoryObj) return "";
            for (var key in categoryObj) {
                var group = categoryObj[key];
                if (group && group.group && group.group.name === groupName && group.list && group.list.length > 0) {
                    return group.list.map(function (item) { return item.name; }).join(", ");
                }
            }
            return "";
        };

        var extractedYear = extractGroup(movie.category, "Năm");

        return JSON.stringify({
            id: movie.slug || "",
            title: movie.name || "",
            posterUrl: getImageUrl(movie.thumb_url),
            backdropUrl: getImageUrl(movie.poster_url),
            description: (movie.description || movie.content || "").replace(/<[^>]*>/g, ""),
            year: parseInt(movie.year || extractedYear) || 0,
            rating: parseFloat(movie.view) || 0,
            quality: movie.quality || "HD",
            servers: servers,
            episode_current: movie.current_episode || movie.episode_current || "",
            lang: movie.language || movie.lang || "",
            casts: movie.casts || movie.actor || "",
            director: movie.director || "",
            category: extractGroup(movie.category, "Thể loại"),
            country: extractGroup(movie.category, "Quốc gia"),
            view: parseInt(movie.view) || 0,
            status: movie.status || ""
        });
    } catch (error) {
        return "{}";
    }
}

// =============================================================================
// [TRÙM CUỐI] HOOK BLOB M3U8 + AUTO CLICK + QUÉT THẺ VIDEO (KHÔNG COMMENT JS)
// =============================================================================
function parseDetailResponse(html, apiUrl) {
    try {
        var url = apiUrl.split("|")[0];

        // MÃ JS HOOK - XÓA SẠCH MỌI DẤU CHÚ THÍCH // ĐỂ TRÁNH LỖI KHI MINIFY
        var customJsCode = `
        (function() {
            if (window._vaapp_hooked) return;
            window._vaapp_hooked = true;

            var playerHeaders = JSON.stringify({
                "Referer": "https://embed.streamc.xyz/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            });

            if (typeof URL !== 'undefined' && URL.createObjectURL) {
                var originalCreateObjectURL = URL.createObjectURL;
                URL.createObjectURL = function(blob) {
                    var blobUrl = originalCreateObjectURL.apply(this, arguments);
                    if (blob && (blob instanceof Blob || blob instanceof File)) {
                        var processContent = function(content) {
                            if (content && content.trim().indexOf('#EXTM3U') === 0) {
                                if (window.SnifferBridge && typeof window.SnifferBridge.playM3u8Content === 'function') {
                                    window.SnifferBridge.log("Da bat Blob M3U8 thanh cong!");
                                    window.SnifferBridge.playM3u8Content(content, window.location.href, playerHeaders);
                                }
                            }
                        };
                        if (typeof blob.text === 'function') {
                            blob.text().then(processContent).catch(function(){});
                        } else {
                            var reader = new FileReader();
                            reader.onload = function(e) { processContent(e.target.result); };
                            reader.readAsText(blob);
                        }
                    }
                    return blobUrl;
                };
            }

            var checkCount = 0;
            var checkInterval = setInterval(function() {
                try {
                    var skipBtn = document.getElementById("resumeBtn");
                    if (skipBtn) {
                        var style = window.getComputedStyle(skipBtn);
                        if (style.display !== 'none' && style.visibility !== 'hidden') {
                            skipBtn.click();
                        }
                    }

                    var playBtn = document.querySelector('.jw-icon-display, .vjs-big-play-button, .plyr__control--overlaid, .play-btn');
                    if (playBtn) playBtn.click();

                    var video = document.querySelector('video');
                    if (video && video.src && video.src.indexOf('http') === 0) {
                        if (window.SnifferBridge) {
                            window.SnifferBridge.log("Da bat duoc link video: " + video.src);
                            window.SnifferBridge.play(video.src, playerHeaders);
                        }
                        clearInterval(checkInterval);
                    } else {
                        if (window.SnifferBridge) window.SnifferBridge.log("Dang cho the video xuat hien... (" + checkCount + ")");
                    }

                    checkCount++;
                    if (checkCount > 30) {
                        clearInterval(checkInterval);
                    }
                } catch (err) {
                    if (window.SnifferBridge) window.SnifferBridge.log("Loi CustomJS: " + err.message);
                }
            }, 1000);
        })();
        `;

        return JSON.stringify({
            "url": url,
            "isEmbed": true, 
            "headers": {
                // Giữ lại Header chống Cloudflare của StreamC
                "Referer": "https://embed.streamc.xyz/",
                "Origin": "https://embed.streamc.xyz/",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                "Sec-Ch-Ua-Mobile": "?1",
                "Sec-Ch-Ua-Platform": '"Android"',
                "Accept": "*/*",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
                "X-Requested-With": "com.android.chrome",
                
                // Khiên chặn Webview tàng hình mở Popup quảng cáo
                "Block-Ads": "true",
                "Block-Redirects": "true",
                
                // Gắn CustomJS đã XÓA DẤU CHÚ THÍCH // (Tránh lỗi gom dòng)
                "Custom-Js": customJsCode.replace(/\n/g, " ").replace(/\r/g, "").trim()
            },
            "subtitles": []
        });
    } catch (e) {
        return JSON.stringify({ "url": apiUrl.split("|")[0], "isEmbed": true, "headers": {} });
    }
}

function parseEmbedResponse(htmlContent, url) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
function getImageUrl(path) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    return "https://img.phimapi.com/" + path;
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }
