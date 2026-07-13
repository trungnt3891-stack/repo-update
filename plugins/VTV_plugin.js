// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "truyenhinh_vn",
        "name": "Truyền Hình VN",
        "version": "2.0.0",
        "baseUrl": "https://raw.githubusercontent.com/HaNoiIPTV/HaNoiIPTV.m3u/master/hanoiiptv.m3u",
        "iconUrl": "https://raw.githubusercontent.com/HaNoiIPTV/HaNoiIPTV.m3u/master/Danh%20s%C3%A1ch%20k%C3%AAnh/Nh%C3%B3m%20k%C3%AAnh%20t%E1%BB%95ng%20h%E1%BB%A3p.png",
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'vtv', title: '📺 Kênh VTV', type: 'Horizontal', path: 'truyenhinh_vn' },
        { slug: 'htv', title: '🎬 Kênh HTV & THVL', type: 'Horizontal', path: 'truyenhinh_vn' },
        { slug: 'sctv', title: '🍿 Phim SCTV', type: 'Horizontal', path: 'truyenhinh_vn' },
        { slug: 'quoc-te', title: '🌍 Kênh Quốc Tế', type: 'Horizontal', path: 'truyenhinh_vn' },
        { slug: 'the-thao', title: '⚽ Thể Thao & Sự Kiện', type: 'Grid', path: 'truyenhinh_vn' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: '📺 VTV', slug: 'vtv' },
        { name: '🎬 HTV & THVL', slug: 'htv' },
        { name: '🍿 SCTV', slug: 'sctv' },
        { name: '🌍 Quốc Tế', slug: 'quoc-te' },
        { name: '⚽ Thể Thao', slug: 'the-thao' },
        { name: '📍 Địa Phương', slug: 'dia-phuong' },
        { name: '📦 In The Box', slug: 'in-the-box' },
        { name: '🌐 Tất Cả', slug: 'all' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION & CATEGORY MAPPING
// =============================================================================

var M3U_URL = "https://raw.githubusercontent.com/HaNoiIPTV/HaNoiIPTV.m3u/master/hanoiiptv.m3u";

// Map slug với "group-title" thực tế trong file M3U của HaNoiIPTV
var CATEGORY_MAP = {
    'vtv': 'KÊNH VTV',
    'htv': 'HTV',
    // Gom chung THVL vào HTV cho gọn (tùy bạn chỉnh)
    'sctv': 'SCTV',
    'quoc-te': 'Quốc tế',
    'the-thao': 'Sự Kiện TV360', 
    'dia-phuong': 'Địa phương',
    'in-the-box': 'In The Box'
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
// M3U ADVANCED PARSER (Hỗ trợ DRM, User-Agent, Referer)
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
            
            var commaIdx = line.lastIndexOf(',');
            var name = commaIdx >= 0 ? line.substring(commaIdx + 1).trim() : '';

            // Bỏ qua các dòng kẻ phân cách (ví dụ: --------)
            if (name.indexOf('---') >= 0 || name === '') continue;

            currentInfo = {
                // Ưu tiên gom các kênh THVL vào nhóm HTV để hiển thị
                group: groupMatch ? (groupMatch[1] === 'THVL' ? 'HTV' : groupMatch[1]) : 'Khác',
                logo: logoMatch ? logoMatch[1] : '',
                name: name,
                index: channelIndex++
            };
            
            // Reset thông số cho kênh mới
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
            currentLicenseKey = line.substring(43).trim(); // Bắt phần sau dấu =
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
                // Chấp nhận tìm kiếm chứa từ khóa group (vì VTV có nhiều group con)
                return ch.group.indexOf(groupName) >= 0; 
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
        
        // Tìm kênh dựa trên ID tự tạo
        for (var i = 0; i < channels.length; i++) {
            if (channelId === (channels[i].group + '::' + channels[i].name + '::' + channels[i].index)) {
                channel = channels[i];
                break;
            }
        }
        if (!channel) return "null";

        // GÓI TOÀN BỘ THÔNG SỐ VÀO URL ĐỂ CHUYỂN XUỐNG PARSE DETAIL
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
            description: "Kênh: " + channel.name + " | Thuộc nhóm: " + (channel.group || "IPTV"),
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
        // Mặc định thiết lập UA của TiviMate để stream ổn định hơn
        var userAgent = "ExoPlayerDemo/2.19.1 (Linux; Android 15.0.0;) ExoPlayerLib/2.19.1";
        var referer = "";
        var drmType = "";
        var drmKey = "";

        // BÓC TÁCH CÁC THÔNG SỐ ĐÃ GÓI TỪ BƯỚC TRƯỚC
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

        // Truyền cấu hình DRM nếu kênh bị mã hóa (VD: Nhóm Sự kiện TV360, Kênh Sing, Astro)
        if (drmType && drmKey) {
            responseObj.drm = {
                type: drmType === "org.w3.clearkey" ? "clearkey" : "widevine",
                licenseUrl: drmKey
            };
        }

        return JSON.stringify(responseObj);
    } catch (error) {
        // Fallback an toàn
        return JSON.stringify({ url: apiUrl.split('|')[0], headers: { "User-Agent": "Mozilla/5.0" } });
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
