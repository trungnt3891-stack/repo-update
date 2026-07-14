// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tv365-vietng",
        "name": "TV365 & VietNG",
        "version": "1.0.1",
        "baseUrl": "https://raw.githubusercontent.com/trungnt3891-stack/test/refs/heads/main/new.m3u",
        "iconUrl": "https://raw.githubusercontent.com/vietng228/m3u/refs/heads/main/Logo.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'truyen-hinh', title: '📺 Truyền Hình', type: 'Grid', path: 'tv365-vietng' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Truyền Hình', slug: 'truyen-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

var M3U_URL = "https://raw.githubusercontent.com/trungnt3891-stack/test/refs/heads/main/new.m3u";
// Link dự phòng nếu cần: "https://raw.githubusercontent.com/TV365-VN/TV365-DATA/refs/heads/main/error.m3u"

function getUrlList(slug, filtersJson) {
    return M3U_URL; // Luôn trả về 1 list duy nhất không cần query category
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
                group: groupMatch ? groupMatch[1] : 'Truyền Hình', // Lấy group gốc để làm mô tả, nếu không có thì mặc định
                logo: logoMatch ? logoMatch[1] : '',
                tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
                name: name,
                index: channelIndex++
            };
            currentUserAgent = '';
        } else if (line.indexOf('#EXTVLCOPT:http-user-agent=') === 0) {
            currentUserAgent = line.substring('#EXTVLCOPT:http-user-agent='.length).trim();
        } else if (line.indexOf('#EXTVLCOPT:') === 0 || line.indexOf('#KODIPROP:') === 0) {
            // Bỏ qua các cấu hình khác của VLC/Kodi
        } else if (line.indexOf('#') === 0) {
            // Bỏ qua comments
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

        // Lọc theo từ khóa tìm kiếm (nếu có)
        var searchKeyword = extractParamFromUrl(apiUrl, 'search');
        if (searchKeyword) {
            var keyword = searchKeyword.toLowerCase();
            channels = channels.filter(function (ch) {
                return ch.name.toLowerCase().indexOf(keyword) >= 0;
            });
        }
        // Khong can loc theo category nua, luon tra ve tat ca cho "truyen-hinh"

        var allItems = [];
        channels.forEach(function (channel) {
            allItems.push({
                id: makeChannelId(channel),
                title: channel.name,
                posterUrl: channel.logo || "https://via.placeholder.com/200x200?text=TV",
                backdropUrl: channel.logo || "",
                year: 2026,
                quality: "LIVE",
                episode_current: "Live",
                lang: "Việt Nam"
            });
        });

        return JSON.stringify({
            items: allItems,
            pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length, itemsPerPage: 5000 } // Tăng itemsPerPage lên cao để hiển thị hết 1 lượt
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
            name: "Nguồn Phát",
            episodes: episodes
        });

        return JSON.stringify({
            id: makeChannelId(channel),
            title: channel.name,
            originName: "Truyền Hình",
            posterUrl: channel.logo || "",
            backdropUrl: channel.logo || "",
            description: "Bạn đang xem kênh: " + channel.name + ". Nguồn phát được cung cấp bởi TV365 & VietNG.",
            year: 2026,
            rating: 10,
            quality: "FHD",
            servers: servers,
            episode_current: "Live",
            lang: "Việt Nam",
            category: "Truyền Hình",
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
        var userAgent = "VLC/3.0.0-git LibVLC/3.0.0-git";

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
    return JSON.stringify([
        { name: 'Truyền Hình', slug: 'truyen-hinh' }
    ]);
}

function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }
