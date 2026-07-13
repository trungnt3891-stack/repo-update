// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "truyenhinh_pro",
        "name": "Truyền Hình Pro",
        "version": "2.0.0",
        "baseUrl": "https://github.com", 
        "iconUrl": "https://i.imgur.com/8Q5YZbX.png", // Bạn có thể thay logo app của bạn
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'the-thao', title: '🔴 Thể Thao Trực Tiếp', type: 'Grid', path: 'danh-sach' },
        { slug: 'vtv', title: '📺 Kênh VTV', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'htv-thvl', title: '🎬 HTV & THVL', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'sctv', title: '🍿 Phim SCTV', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'quoc-te', title: '🌍 Quốc Tế', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '⚽ Thể Thao', slug: 'the-thao' },
        { name: '📺 VTV', slug: 'vtv' },
        { name: '🎬 HTV - THVL', slug: 'htv-thvl' },
        { name: '🍿 SCTV', slug: 'sctv' },
        { name: '🌍 Quốc Tế', slug: 'quoc-te' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION (THAY LINK GITHUB CỦA BẠN VÀO ĐÂY)
// =============================================================================

// Thay link raw github chứa file TruyenHinh.m3u của bạn vào biến này
var M3U_URL = "https://raw.githubusercontent.com/ten-github-cua-ban/repo/main/TruyenHinh.m3u";

function getUrlList(slug, filtersJson) {
    if (slug && slug !== 'all') {
        return M3U_URL + "?cat=" + encodeURIComponent(slug);
    }
    return M3U_URL;
}

function getUrlSearch(keyword, filtersJson) {
    return M3U_URL + "?search=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) return slug;
    return M3U_URL + "?id=" + encodeURIComponent(slug);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// CATEGORY SLUG ↔ group-title MAPPING (Khớp với file M3U mới)
// =============================================================================

var CATEGORY_MAP = {
    'vtv': '📺 VTV',
    'htv-thvl': '🎬 HTV - THVL',
    'sctv': '🍿 SCTV',
    'quoc-te': '🌍 QUỐC TẾ',
    'the-thao': '⚽ THỂ THAO TRỰC TIẾP'
};

// =============================================================================
// M3U ADVANCED PARSER (Hỗ trợ bắt mã DRM KODIPROP)
// =============================================================================

function parseM3U(text) {
    var lines = text.split('\n');
    var channels = [];
    var currentInfo = null;
    
    var currentUserAgent = '';
    var currentLicenseType = '';
    var currentLicenseKey = '';
    var channelIndex = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line.indexOf('#EXTINF:') === 0) {
            var groupMatch = line.match(/group-title="([^"]*)"/);
            var logoMatch = line.match(/tvg-logo="([^"]*)"/) || line.match(/group-logo="([^"]*)"/);
            var tvgIdMatch = line.match(/tvg-id="([^"]*)"/);

            var commaIdx = line.lastIndexOf(',');
            var name = commaIdx >= 0 ? line.substring(commaIdx + 1).trim() : '';

            currentInfo = {
                group: groupMatch ? groupMatch[1] : 'Khác',
                logo: logoMatch ? logoMatch[1] : '',
                tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
                name: name,
                index: channelIndex++
            };
            
            // Reset params cho luồng mới
            currentUserAgent = '';
            currentLicenseType = '';
            currentLicenseKey = '';
            
        } else if (line.indexOf('#EXTVLCOPT:http-user-agent=') === 0) {
            currentUserAgent = line.substring('#EXTVLCOPT:http-user-agent='.length).trim();
        } else if (line.indexOf('#KODIPROP:inputstream.adaptive.license_type=') === 0) {
            currentLicenseType = line.substring('#KODIPROP:inputstream.adaptive.license_type='.length).trim();
        } else if (line.indexOf('#KODIPROP:inputstream.adaptive.license_key=') === 0) {
            currentLicenseKey = line.substring('#KODIPROP:inputstream.adaptive.license_key='.length).trim();
        } else if (line.indexOf('#') === 0) {
            // Skip other tags
        } else if (line.length > 0 && (line.indexOf('http') === 0 || line.indexOf('//') === 0)) {
            if (currentInfo) {
                currentInfo.url = line;
                currentInfo.userAgent = currentUserAgent;
                currentInfo.licenseType = currentLicenseType;
                currentInfo.licenseKey = currentLicenseKey;
                
                channels.push(currentInfo);
                currentInfo = null;
            }
        }
    }
    return channels;
}

// =============================================================================
// HELPERS
// =============================================================================

function extractParamFromUrl(url, param) {
    if (!url) return "";
    var match = url.match(new RegExp('[?&]' + param + '=([^&]+)'));
    return match ? decodeURIComponent(match[1]) : "";
}

function makeChannelId(channel) {
    if (channel.tvgId) return channel.tvgId;
    return (channel.group || 'unknown') + '::' + (channel.name || '') + '::' + channel.index;
}

function findChannelByIdInList(channels, channelId) {
    for (var i = 0; i < channels.length; i++) {
        if (makeChannelId(channels[i]) === channelId) return channels[i];
    }
    return null;
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var channels = parseM3U(apiResponseJson);
        var catSlug = extractParamFromUrl(apiUrl, 'cat');
        
        if (catSlug && catSlug !== 'all' && CATEGORY_MAP[catSlug]) {
            var groupName = CATEGORY_MAP[catSlug];
            channels = channels.filter(function (ch) {
                return ch.group === groupName;
            });
        }

        var searchKeyword = extractParamFromUrl(apiUrl, 'search');
        if (searchKeyword) {
            var keyword = searchKeyword.toLowerCase();
            channels = channels.filter(function (ch) {
                return ch.name.toLowerCase().indexOf(keyword) >= 0;
            });
        }

        var allItems = channels.map(function (channel) {
            return {
                id: makeChannelId(channel),
                title: channel.name,
                posterUrl: channel.logo || "https://i.imgur.com/8Q5YZbX.png", // Default logo
                backdropUrl: channel.logo || "",
                year: 0,
                quality: "LIVE",
                episode_current: channel.group || "Live",
                lang: channel.group || ""
            };
        });

        return JSON.stringify({
            items: allItems,
            pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length, itemsPerPage: 1000 }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson, apiUrl) {
    return parseListResponse(apiResponseJson, apiUrl);
}

function parseMovieDetail(apiResponseJson, apiUrl) {
    try {
        var channelId = extractParamFromUrl(apiUrl, 'id');
        if (!channelId) return "null";

        var channels = parseM3U(apiResponseJson);
        var channel = findChannelByIdInList(channels, channelId);

        if (!channel) return "null";

        // Gói cẩn thận các thông số UA và DRM vào ID luồng
        var episodeId = channel.url;
        if (channel.userAgent) {
            episodeId += "|ua=" + encodeURIComponent(channel.userAgent);
        }
        if (channel.licenseType && channel.licenseKey) {
            episodeId += "|drm_type=" + encodeURIComponent(channel.licenseType) + "|drm_key=" + encodeURIComponent(channel.licenseKey);
        }

        return JSON.stringify({
            id: makeChannelId(channel),
            title: channel.name,
            originName: channel.group,
            posterUrl: channel.logo || "",
            backdropUrl: channel.logo || "",
            description: "Đang phát trực tiếp: " + channel.name,
            year: 2024,
            rating: 5,
            quality: "LIVE",
            servers: [{
                name: "Stream Mặc Định",
                episodes: [{ id: episodeId, name: "Xem ngay", slug: "live" }]
            }],
            episode_current: "Live",
            lang: "Việt Nam",
            category: channel.group,
            country: "Việt Nam",
            director: "Hệ thống Truyền Hình",
            casts: ""
        });
    } catch (error) {
        return "null";
    }
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    try {
        var streamUrl = apiUrl || "";
        var userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36";
        var drmType = "";
        var drmKey = "";

        // Bóc tách các tham số cấu hình ra khỏi ID luồng
        if (streamUrl.indexOf('|') !== -1) {
            var parts = streamUrl.split('|');
            streamUrl = parts[0];
            for (var i = 1; i < parts.length; i++) {
                if (parts[i].indexOf('ua=') === 0) {
                    userAgent = decodeURIComponent(parts[i].substring(3));
                } else if (parts[i].indexOf('drm_type=') === 0) {
                    drmType = decodeURIComponent(parts[i].substring(9));
                } else if (parts[i].indexOf('drm_key=') === 0) {
                    drmKey = decodeURIComponent(parts[i].substring(8));
                }
            }
        }

        var responseObj = {
            url: streamUrl,
            headers: { "User-Agent": userAgent },
            subtitles: []
        };

        // Kích hoạt giải mã DRM nếu có
        if (drmType && drmKey) {
            // DRM type có thể là 'clearkey' hoặc 'widevine'
            responseObj.drm = {
                type: drmType.replace("org.w3.", ""), 
                licenseUrl: drmKey
            };
        }

        return JSON.stringify(responseObj);
    } catch (error) {
        return JSON.stringify({ url: apiUrl || "", headers: { "User-Agent": "Mozilla/5.0" } });
    }
}

function parseCategoriesResponse(apiResponseJson) {
    var cats = [];
    var keys = Object.keys(CATEGORY_MAP);
    for (var i = 0; i < keys.length; i++) {
        cats.push({ name: CATEGORY_MAP[keys[i]], slug: keys[i] });
    }
    return JSON.stringify(cats);
}
