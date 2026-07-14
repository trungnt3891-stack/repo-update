// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vtv_diaphuong_tv",
        "name": "VTV & Local TV",
        "version": "1.0.0",
        "baseUrl": "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main",
        "iconUrl": "",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'vtv', title: '📺 Truyền Hình VTV', type: 'Grid', path: 'new.m3u' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'VTV', slug: 'vtv' },
        { name: 'Địa phương', slug: 'dia-phuong' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

// Thay thế bằng link M3U chứa các kênh bạn mong muốn
var M3U_URL = "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/new.m3u";

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
    if (slug.indexOf("http") === 0) {
        return slug;
    }
    return M3U_URL + "?id=" + encodeURIComponent(slug);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// CATEGORY SLUG ↔ group-title MAPPING (Tinh gọn lại)
// =============================================================================
// Lưu ý: Giá trị bên phải ('VTV', 'Địa phương') phải khớp với thẻ group-title="..." trong file m3u
var CATEGORY_MAP = {
    'vtv': 'VTV',
    'dia-phuong': 'Địa phương'
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

        var allItems = [];
        channels.forEach(function (channel) {
            allItems.push({
                id: makeChannelId(channel),
                title: channel.name,
                posterUrl: channel.logo || "",
                backdropUrl: channel.logo || "",
                year: 0,
                quality: "LIVE",
                episode_current: channel.group || "Live",
                lang: channel.group || ""
            });
        });

        return JSON.stringify({
            items: allItems,
            pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length, itemsPerPage: 500 }
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
            name: channel.group || "Live Source",
            episodes: episodes
        });

        var description = "Kênh: " + channel.name;
        if (channel.group) description += " | Nhóm: " + channel.group;

        return JSON.stringify({
            id: makeChannelId(channel),
            title: channel.name,
            originName: "",
            posterUrl: channel.logo || "",
            backdropUrl: channel.logo || "",
            description: description,
            year: 0,
            rating: 0,
            quality: "LIVE",
            servers: servers,
            episode_current: "Live",
            lang: channel.group || "Việt",
            category: channel.group || "TV",
            country: "Việt",
            director: "Local TV",
            casts: ""
        });
    } catch (error) {
        return "null";
    }
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    try {
        var streamUrl = apiUrl || "";
        var userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

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
