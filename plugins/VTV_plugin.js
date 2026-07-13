// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vmttv_pro",
        "name": "VMT TV Pro",
        "version": "2.0.1",
        "baseUrl": "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main",
        "iconUrl": "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/Logo.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'su-kien', title: '🔴 Sự Kiện Trực Tiếp', type: 'Grid', path: 'vmttv' },
        { slug: 'vtv', title: '📺 Kênh VTV & Thiết Yếu', type: 'Horizontal', path: 'vmttv' },
        { slug: 'htv', title: '🎬 Kênh HTV & SCTV', type: 'Horizontal', path: 'vmttv' },
        { slug: 'bong-da-quoc-te', title: '⚽ Thể thao Quốc Tế', type: 'Horizontal', path: 'vmttv' },
        { slug: 'rap-phim', title: '🍿 Rạp Phim & Giải Trí', type: 'Horizontal', path: 'vmttv' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '🔴 Sự Kiện', slug: 'su-kien' },
        { name: '📺 VTV', slug: 'vtv' },
        { name: '🎬 HTV', slug: 'htv' },
        { name: '🍿 SCTV', slug: 'sctv' },
        { name: '⚽ Thể Thao', slug: 'bong-da-quoc-te' },
        { name: '🎬 Rạp Phim', slug: 'rap-phim' },
        { name: '📍 Địa Phương', slug: 'dia-phuong' },
        { name: '🌍 Quốc Tế', slug: 'quoc-te' },
        { name: '🌐 Tất Cả', slug: 'all' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION & CATEGORY MAPPING
// =============================================================================

var M3U_URL = "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/vmttv";

var CATEGORY_MAP = {
    'fifa-world-cup-2026': 'FIFA WORLD CUP 2026',
    'su-kien': 'Sự Kiện',
    'the-thao-quoc-te': 'THỂ THAO QUỐC TẾ',
    'bong-da-quoc-te': '⚽| Thể thao quốc tế',
    'tvb': 'TVB',
    'live-events': 'LIVE EVENTS 🔴',
    'su-kien-tv360': 'Sự Kiện TV360',
    'su-kien-vtvprime': 'Sự Kiện VTVPrime',
    'rap-phim': 'Rạp Phim',
    'vtv': 'VTV',
    'vtvcab': 'VTVcab',
    'sctv': 'SCTV',
    'in-the-box': '📦| In The Box',
    'htv': 'HTV',
    'htvc': 'HTVC',
    'thiet-yeu': '🌐| Thiết yếu',
    'dia-phuong': 'Địa phương',
    'quoc-te': 'Quốc Tế',
    'radio': 'Radio',
    'vietnam-radio': '🇻🇳 Vietnam Radio',
    'uk-radio': '🇬🇧 UK Radio',
    'han-quoc': '🇰🇷| Hàn Quốc',
    'trung-quoc': '🇨🇳| Trung Quốc',
    'thai-lan': '🇹🇭| Thái Lan',
    'campuchia': '🇰🇭| Campuchia'
};

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
// M3U ADVANCED PARSER (DRM, UA, Referer)
// =============================================================================

function parseM3U(text) {
    var lines = text.split('\n');
    var channels = [];
    
    var currentInfo = null;
    var currentUserAgent = '';
    var currentReferer = '';
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

            // Loại bỏ dòng rác
            if (name.indexOf('---') >= 0 || name === '') continue;

            currentInfo = {
                group: groupMatch ? groupMatch[1] : 'Khác',
                logo: logoMatch ? logoMatch[1] : '',
                tvgId: tvgIdMatch ? tvgIdMatch[1] : '',
                name: name,
                index: channelIndex++
            };
            
            // Reset params
            currentUserAgent = '';
            currentReferer = '';
            currentLicenseType = '';
            currentLicenseKey = '';

        } else if (line.indexOf('#EXTVLCOPT:http-user-agent=') === 0) {
            currentUserAgent = line.substring(27).trim();
        } else if (line.indexOf('#EXTVLCOPT:http-referrer=') === 0 || line.indexOf('#EXTVLCOPT: http-referrer=') === 0) {
            currentReferer = line.split('=')[1].trim();
        } else if (line.indexOf('#KODIPROP:inputstream.adaptive.license_type=') === 0) {
            currentLicenseType = line.split('=')[1].trim();
        } else if (line.indexOf('#KODIPROP:inputstream.adaptive.license_key=') === 0) {
            currentLicenseKey = line.substring(43).trim(); 
        } else if (line.length > 0 && (line.indexOf('http') === 0 || line.indexOf('//') === 0 || line.indexOf('rtmp') === 0)) {
            if (currentInfo) {
                currentInfo.url = line;
                currentInfo.userAgent = currentUserAgent;
                currentInfo.referer = currentReferer;
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
    return encodeURIComponent(channel.group + '::' + channel.name + '::' + channel.index);
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
                return ch.group === groupName || ch.group.indexOf(groupName) >= 0; 
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
                posterUrl: channel.logo || "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/Logo.png",
                quality: channel.licenseType ? "VIP" : "LIVE",
                episode_current: channel.group || "Live",
                lang: "Việt"
            };
        });

        return JSON.stringify({
            items: allItems,
            pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length, itemsPerPage: 5000 }
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
        var channelId = decodeURIComponent(extractParamFromUrl(apiUrl, 'id'));
        if (!channelId) return "null";

        var channels = parseM3U(apiResponseJson);
        var channel = null;
        
        for (var i = 0; i < channels.length; i++) {
            if (channelId === makeChannelId(channels[i]) || channelId === channels[i].tvgId) {
                channel = channels[i];
                break;
            }
        }
        
        // Fallback match name
        if (!channel) {
            var parts = channelId.split('::');
            if (parts.length >= 2) {
                var nameToFind = parts[parts.length - 2];
                for (var j = 0; j < channels.length; j++) {
                    if (channels[j].name === nameToFind) { channel = channels[j]; break; }
                }
            }
        }
        
        if (!channel) return "null";

        // GÓI TOÀN BỘ THÔNG SỐ VÀO URL 
        var episodeId = channel.url;
        if (channel.userAgent) episodeId += "|ua=" + encodeURIComponent(channel.userAgent);
        if (channel.referer) episodeId += "|ref=" + encodeURIComponent(channel.referer);
        if (channel.licenseType) episodeId += "|drm_type=" + encodeURIComponent(channel.licenseType);
        if (channel.licenseKey) episodeId += "|drm_key=" + encodeURIComponent(channel.licenseKey);

        var servers = [{
            name: channel.group || "Live Source",
            episodes: [{ id: episodeId, name: channel.name, slug: "stream" }]
        }];

        return JSON.stringify({
            id: makeChannelId(channel),
            title: channel.name,
            posterUrl: channel.logo || "",
            description: "Kênh: " + channel.name + " | Nhóm: " + (channel.group || "IPTV"),
            quality: channel.licenseType ? "DRM Protected" : "LIVE",
            servers: servers,
            episode_current: "Live"
        });
    } catch (error) {
        return "null";
    }
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    try {
        var streamUrl = apiUrl || "";
        var userAgent = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36";
        var referer = "";
        var drmType = "";
        var drmKey = "";

        // BÓC TÁCH THÔNG SỐ TRUYỀN TỪ MOVIE DETAIL
        if (streamUrl.indexOf('|') !== -1) {
            var parts = streamUrl.split('|');
            streamUrl = parts[0];
            for (var i = 1; i < parts.length; i++) {
                if (parts[i].indexOf('ua=') === 0) userAgent = decodeURIComponent(parts[i].substring(3));
                else if (parts[i].indexOf('ref=') === 0) referer = decodeURIComponent(parts[i].substring(4));
                else if (parts[i].indexOf('drm_type=') === 0) drmType = decodeURIComponent(parts[i].substring(9));
                else if (parts[i].indexOf('drm_key=') === 0) drmKey = decodeURIComponent(parts[i].substring(8));
            }
        }

        var responseObj = {
            url: streamUrl,
            headers: { "User-Agent": userAgent },
            subtitles: []
        };

        if (referer) {
            responseObj.headers["Referer"] = referer;
        }

        if (drmType && drmKey) {
            responseObj.drm = {
                type: drmType.indexOf("clearkey") !== -1 ? "clearkey" : "widevine",
                licenseUrl: drmKey
            };
        }

        return JSON.stringify(responseObj);
    } catch (error) {
        return JSON.stringify({ url: apiUrl.split('|')[0] || "", headers: { "User-Agent": "Mozilla/5.0" } });
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
