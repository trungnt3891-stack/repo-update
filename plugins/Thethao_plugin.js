// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "bong-da-live",
        "name": "Trực Tiếp Bóng Đá",
        "version": "1.0.0",
        "baseUrl": "https://xoilac-iptv.vercel.app",
        "iconUrl": "https://via.placeholder.com/500x500.png?text=Bong+Da", // Thay bằng link logo quả bóng của bạn
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'bong-da', title: '⚽ Trực Tiếp Hôm Nay', type: 'Grid', path: 'bong-da-live' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Trực Tiếp', slug: 'bong-da' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

var M3U_URL = "https://xoilac-iptv.vercel.app/playlist.m3u";

function getUrlList(slug, filtersJson) {
    return M3U_URL; 
}

function getUrlSearch(keyword, filtersJson) {
    return M3U_URL; // Có thể bỏ qua search cho bóng đá vì list thường ngắn
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
// M3U PARSER (Đã được ép cứng vào 1 nhóm Thể Thao)
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
            var logoMatch = line.match(/tvg-logo="([^"]*)"/);
            var tvgIdMatch = line.match(/tvg-id="([^"]*)"/);

            var commaIdx = line.lastIndexOf(',');
            var name = commaIdx >= 0 ? line.substring(commaIdx + 1).trim() : '';

            currentInfo = {
                group: 'Bóng Đá', 
                logo: logoMatch ? logoMatch[1] : 'https://via.placeholder.com/200x200?text=Live',
                tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
                name: name,
                index: channelIndex++
            };
            currentUserAgent = '';
        } else if (line.indexOf('#EXTVLCOPT:http-user-agent=') === 0) {
            currentUserAgent = line.substring('#EXTVLCOPT:http-user-agent='.length).trim();
        } else if (line.indexOf('#') === 0) {
            // Bỏ qua comments
        } else if (line.length > 0 && (line.indexOf('http') === 0 || line.indexOf('//') === 0)) {
            if (currentInfo) {
                currentInfo.url = line;
                currentInfo.userAgent = currentUserAgent;
                channels.push(currentInfo);
                currentInfo = null;
                currentUserAgent = '';
            }
        }
    }
    return channels;
}

// =============================================================================
// HELPERS
// =============================================================================

function makeChannelId(channel) {
    if (channel.tvgId) return channel.tvgId;
    return (channel.name || 'match') + '::' + channel.index;
}

function findChannelByIdInList(channels, channelId) {
    for (var i = 0; i < channels.length; i++) {
        if (makeChannelId(channels[i]) === channelId) return channels[i];
    }
    return null;
}

function extractParamFromUrl(url, param) {
    if (!url) return "";
    var match = url.match(new RegExp('[?&]' + param + '=([^&]+)'));
    return match ? decodeURIComponent(match[1]) : "";
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var channels = parseM3U(apiResponseJson);
        var allItems = [];
        
        channels.forEach(function (channel) {
            allItems.push({
                id: makeChannelId(channel),
                title: channel.name,
                posterUrl: channel.logo,
                backdropUrl: channel.logo,
                year: 2026,
                quality: "LIVE",
                episode_current: "Live",
                lang: "Việt Nam"
            });
        });

        return JSON.stringify({
            items: allItems,
            pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length, itemsPerPage: 100 }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson, apiUrl) { return parseListResponse(apiResponseJson, apiUrl); }

function parseMovieDetail(apiResponseJson, apiUrl) {
    try {
        var channelId = extractParamFromUrl(apiUrl, 'id');
        if (!channelId) return "null";

        var channels = parseM3U(apiResponseJson);
        var channel = findChannelByIdInList(channels, channelId);

        // Fallback match
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
        if (!channel) return "null";

        var servers = [{
            name: "Xoilac Server",
            episodes: [{
                id: channel.userAgent ? channel.url + "|ua=" + encodeURIComponent(channel.userAgent) : channel.url,
                name: "Xem Trận Đấu",
                slug: "stream"
            }]
        }];

        return JSON.stringify({
            id: makeChannelId(channel),
            title: channel.name,
            originName: "Live Stream",
            posterUrl: channel.logo,
            backdropUrl: channel.logo,
            description: "Trực tiếp trận đấu: " + channel.name,
            year: 2026,
            rating: 10,
            quality: "FHD",
            servers: servers,
            episode_current: "Live",
            lang: "Việt Nam",
            category: "Thể Thao",
            country: "Việt Nam",
            director: "Xoilac",
            casts: "22 Cầu Thủ"
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
            headers: { 
                "User-Agent": userAgent,
                "Referer": "https://xoilac-iptv.vercel.app/" // Thêm Referer chống chặn
            },
            subtitles: []
        });
    } catch (error) {
        return JSON.stringify({
            url: apiUrl,
            headers: { "User-Agent": "VLC/3.0.0-git LibVLC/3.0.0-git" },
            subtitles: []
        });
    }
}

function parseCategoriesResponse(apiResponseJson) {
    return JSON.stringify([{ name: 'Trực Tiếp', slug: 'bong-da' }]);
}
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }
