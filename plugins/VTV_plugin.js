// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tv365-vietng",
        "name": "TV365 & VietNG",
        "version": "1.0.0",
        "baseUrl": "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main",
        "iconUrl": "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/Logo.png", // Có thể thay bằng link logo của bạn
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'su-kien', title: '🔴 Sự Kiện Nổi Bật', type: 'Grid', path: 'tv365-vietng' },
        { slug: 'vtv', title: '📺 Kênh VTV', type: 'Grid', path: 'tv365-vietng' }
    ]);
}

// Lưu ý: Các Category này nên khớp với 'group-title' trong file m3u của bạn
function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất Cả', slug: 'all' },
        { name: 'Sự Kiện', slug: 'su-kien' },
        { name: 'VTV', slug: 'vtv' },
        { name: 'VTVcab', slug: 'vtvcab' },
        { name: 'HTV', slug: 'htv' },
        { name: 'SCTV', slug: 'sctv' },
        { name: 'Thể Thao', slug: 'the-thao' },
        { name: 'Rạp Phim', slug: 'rap-phim' },
        { name: 'Địa phương', slug: 'dia-phuong' },
        { name: 'Quốc Tế', slug: 'quoc-te' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

// Định nghĩa 2 link M3U bạn yêu cầu
var M3U_URL_PRIMARY = "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/new.m3u";
var M3U_URL_SECONDARY = "https://raw.githubusercontent.com/TV365-VN/TV365-DATA/refs/heads/main/error.m3u";

// Đặt link mặc định đang dùng
var CURRENT_M3U_URL = M3U_URL_PRIMARY;

function getUrlList(slug, filtersJson) {
    if (slug && slug !== 'all') {
        return CURRENT_M3U_URL + "?cat=" + encodeURIComponent(slug);
    }
    return CURRENT_M3U_URL;
    
    // TRƯỜNG HỢP APP HỖ TRỢ TRẢ VỀ CHUỖI NHIỀU LINK (Ngăn cách bằng phẩy hoặc ||):
    // return M3U_URL_PRIMARY + "||" + M3U_URL_SECONDARY;
}

function getUrlSearch(keyword, filtersJson) {
    return CURRENT_M3U_URL + "?search=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (slug.indexOf("http") === 0) {
        return slug;
    }
    return CURRENT_M3U_URL + "?id=" + encodeURIComponent(slug);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// CATEGORY SLUG ↔ group-title MAPPING (Cần map chuẩn xác với file M3U)
// =============================================================================

var CATEGORY_MAP = {
    'su-kien': 'Sự Kiện',
    'vtv': 'VTV',
    'vtvcab': 'VTVcab',
    'htv': 'HTV',
    'sctv': 'SCTV',
    'the-thao': 'Thể Thao',
    'rap-phim': 'Rạp Phim',
    'dia-phuong': 'Địa phương',
    'quoc-te': 'Quốc Tế'
};

// =============================================================================
// M3U PARSER
// =============================================================================

function parseM3U(text) {
    var lines = text.split('\n');
    var channels = [];
    var currentInfo = null;
    var currentUserAgent = '';
    var channelIndex = 0;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();

        if (line.indexOf('#EXTINF:') === 0) {
            var groupMatch = line.match(/group-title="([^"]*)"/);
            var logoMatch = line.match(/tvg-logo="([^"]*)"/);
            var tvgIdMatch = line.match(/tvg-id="([^"]*)"/);

            var commaIdx = line.lastIndexOf(',');
            var name = commaIdx >= 0 ? line.substring(commaIdx + 1).trim() : '';

            currentInfo = {
                group: groupMatch ? groupMatch[1] : '',
                logo: logoMatch ? logoMatch[1] : '',
                tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
                name: name,
                index: channelIndex++
            };
            currentUserAgent = '';
        } else if (line.indexOf('#EXTVLCOPT:http-user-agent=') === 0) {
            currentUserAgent = line.substring('#EXTVLCOPT:http-user-agent='.length).trim();
        } else if (line.indexOf('#EXTVLCOPT:') === 0 || line.indexOf('#KODIPROP:') === 0) {
            // Skip VLC/Kodi directives
        } else if (line.indexOf('#') === 0) {
            // Skip other directives
        } else if (line.length > 0 && (line.indexOf('http') === 0 || line.indexOf('//') === 0)) {
            if (currentInfo) {
                currentInfo.url = line;
                currentInfo.userAgent = currentUserAgent;
                channels.push(currentInfo);
                currentInfo = null;
                currentUserAgent = '';
            } else {
                currentUserAgent = '';
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
    if (channel.tvgId) {
        return channel.tvgId;
    }
    return (channel.group || 'unknown') + '::' + (channel.name || '') + '::' + channel.index;
}

function findChannelByIdInList(channels, channelId) {
    for (var i = 0; i < channels.length; i++) {
        if (makeChannelId(channels[i]) === channelId) {
            return channels[i];
        }
    }
    return null;
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var channels = parseM3U(apiResponseJson);

        // Filter by category
        var catSlug = extractParamFromUrl(apiUrl, 'cat');
        if (catSlug && catSlug !== 'all' && CATEGORY_MAP[catSlug]) {
            var groupName = CATEGORY_MAP[catSlug];
            channels = channels.filter(function (ch) {
                // Hỗ trợ match một phần nếu group-title trong m3u có chứa kí tự lạ
                return ch.group && ch.group.indexOf(groupName) !== -1;
            });
        }

        // Filter by search keyword
        var searchKeyword = extractParamFromUrl(apiUrl, 'search');
        if (searchKeyword) {
            var keyword = searchKeyword.toLowerCase();
            channels = channels.filter(function (ch) {
                return ch.name.toLowerCase().indexOf(keyword) >= 0;
            });
        }

        var allItems = [];
        channels.forEach(function (channel) {
            allItems.push({
                id: makeChannelId(channel),
                title: channel.name,
                posterUrl: channel.logo || "https://via.placeholder.com/200x200?text=TV", // Ảnh placeholder nếu mất logo
                backdropUrl: channel.logo || "",
                year: 2026,
                quality: "LIVE",
                episode_current: channel.group || "Live",
                lang: channel.group || ""
            });
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

        // Fallbacks for ID matching
        if (!channel) {
            var parts = channelId.split('::');
            if (parts.length >= 2) {
                var idx = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(idx)) {
                    for (var i = 0; i < channels.length; i++) {
                        if (channels[i].index === idx) { channel = channels[i]; break; }
                    }
                }
            }
        }
        if (!channel) {
            var parts2 = channelId.split('::');
            if (parts2.length >= 2) {
                var nameToFind = parts2[parts2.length - 2];
                for (var j = 0; j < channels.length; j++) {
                    if (channels[j].name === nameToFind) { channel = channels[j]; break; }
                }
            }
        }
        if (!channel) return "null";

        var servers = [];
        var episodes = [];
        var episodeId = channel.url;
        
        if (channel.userAgent) {
            episodeId += "|ua=" + encodeURIComponent(channel.userAgent);
        }

        episodes.push({
            id: episodeId,
            name: channel.name,
            slug: "stream"
        });

        servers.push({
            name: channel.group || "Nguồn Phát",
            episodes: episodes
        });

        var description = "Bạn đang xem kênh: " + channel.name + ". Nguồn phát được cung cấp bởi TV365 & VietNG.";

        return JSON.stringify({
            id: makeChannelId(channel),
            title: channel.name,
            originName: channel.group || "Live TV",
            posterUrl: channel.logo || "",
            backdropUrl: channel.logo || "",
            description: description,
            year: 2026,
            rating: 10,
            quality: "FHD",
            servers: servers,
            episode_current: "Live",
            lang: channel.group || "Việt",
            category: channel.group || "Truyền Hình",
            country: "Việt Nam",
            director: "TV365-DATA",
            casts: "Live Broadcast"
        });
    } catch (error) {
        return "null";
    }
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    try {
        var streamUrl = apiUrl || "";
        var userAgent = "VLC/3.0.0-git LibVLC/3.0.0-git"; // Header mặc định phổ biến cho list IPTV

        if (streamUrl.indexOf('|ua=') !== -1) {
            var parts = streamUrl.split('|ua=');
            streamUrl = parts[0];
            userAgent = decodeURIComponent(parts[1]);
        }

        return JSON.stringify({
            url: streamUrl,
            headers: { "User-Agent": userAgent },
            subtitles: []
        });
    } catch (error) {
        var streamUrlFallback = apiUrl || "";
        if (streamUrlFallback.indexOf('|ua=') !== -1) {
            streamUrlFallback = streamUrlFallback.split('|ua=')[0];
        }
        return JSON.stringify({
            url: streamUrlFallback,
            headers: { "User-Agent": "VLC/3.0.0-git LibVLC/3.0.0-git" },
            subtitles: []
        });
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

function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }
