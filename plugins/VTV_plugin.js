// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.0.5", // Nâng version để App xóa bộ nhớ đệm
        "baseUrl": "https://tinhlagi.pro/tivi",
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", 
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'truyen-hinh', title: 'Danh Mục Kênh Truyền Hình', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất Cả', slug: 'truyen-hinh' }
    ]);
}

function getFilterConfig() { return JSON.stringify({}); }

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    return "https://tinhlagi.pro/tivi";
}

function getUrlSearch(keyword, filtersJson) {
    return "https://tinhlagi.pro/tivi";
}

function getUrlDetail(slug) {
    return "https://tinhlagi.pro/tivi";
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
    var groups = [
        { id: "VTV", name: "Kênh VTV", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/VTV6.png" },
        { id: "VTVcab", name: "Kênh VTVcab", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/ONPHIMVIET.png" },
        { id: "SCTV", name: "Kênh SCTV", img: "https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/sctv1.png" },
        { id: "HTV", name: "Kênh HTV", img: "https://s7771.cdn.mytvnet.vn/vimages/8c/ce/ee/e7/79/98/8cee7-phtv1hd-channel-unkn.png" },
        { id: "HTVC", name: "Kênh HTVC", img: "https://raw.githubusercontent.com/vuminhthanh12/Logo/refs/heads/main/htvcthuanviet.png" },
        { id: "Địa phương", name: "Kênh Địa Phương", img: "https://upload.wikimedia.org/wikipedia/vi/9/90/THP-Logo.png" },
        { id: "Thiết yếu", name: "Kênh Thiết Yếu", img: "https://i.ytimg.com/vi/sFLUmdwp0Z8/maxresdefault.jpg" }
    ];

    var items = [];
    for (var i = 0; i < groups.length; i++) {
        items.push({
            id: groups[i].id, 
            title: groups[i].name,
            posterUrl: groups[i].img,
            backdropUrl: groups[i].img,
            quality: "HD",
            episode_current: "Live",
            lang: "Viet",
            year: 0
        });
    }

    return JSON.stringify({
        items: items,
        pagination: { currentPage: 1, totalPages: 1, totalItems: items.length, itemsPerPage: 10 }
    });
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    try {
        var requiredGroups = ["VTVcab", "VTV", "SCTV", "HTVC", "HTV", "Địa phương", "Thiết yếu"];
        var servers = [];

        var groupBlocks = html.split(/<h2[^>]*class=["'][^"']*group-title[^"']*["'][^>]*>/i);
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            
            var titleEnd = block.indexOf('</h2>');
            if (titleEnd === -1) continue;
            
            // Xử lý tên nhóm kênh: Bỏ phần số lượng "(13)", xóa các ký tự lạ như "🌐|"
            var rawTitle = block.substring(0, titleEnd);
            var cleanTitle = PluginUtils.cleanText(rawTitle).split('(')[0];
            var groupName = cleanTitle.replace(/[^\w\sđĐ]/gi, '').trim(); 
            
            // So khớp CHÍNH XÁC tên nhóm kênh để tránh lặp (HTV không được dính vào HTVC)
            var isRequired = false;
            var matchedGroupName = "";
            for (var j = 0; j < requiredGroups.length; j++) {
                if (groupName.toLowerCase() === requiredGroups[j].toLowerCase()) {
                    isRequired = true;
                    matchedGroupName = requiredGroups[j]; 
                    break;
                }
            }
            if (!isRequired) continue;

            var episodes = [];
            var seenEps = {};
            
            // DÙNG REGEX QUÉT TRỰC TIẾP URL: Tuyệt đối không bỏ sót VTV1, HTV1
            var channelRegex = /href=["']\?url=([^&"']+)&(?:amp;)?name=([^#"']+)[^"']*["']/gi;
            var match;
            
            while ((match = channelRegex.exec(block)) !== null) {
                var streamLink = decodeURIComponent(match[1]); 
                var channelName = decodeURIComponent(match[2]).replace(/\+/g, " ").trim();
                
                // Tránh lỗi lặp lại kênh do web in trùng
                if (!seenEps[streamLink]) {
                    episodes.push({
                        id: streamLink, 
                        name: channelName,
                        slug: "live-channel"
                    });
                    seenEps[streamLink] = true;
                }
            }

            if (episodes.length > 0) {
                servers.push({
                    name: "Kênh " + matchedGroupName,
                    episodes: episodes
                });
            }
        }

        return JSON.stringify({
            id: "",
            title: "Tivi Trực Tuyến",
            posterUrl: "https://tinhlagi.pro/tinhlagi.ico",
            backdropUrl: "https://tinhlagi.pro/tinhlagi.ico",
            description: "Hệ thống Xem Tivi trực tuyến tốc độ cao. Hãy chọn danh sách kênh (Server) ở bên dưới.",
            servers: servers,
            quality: "LIVE",
            lang: "Viet",
            year: 0,
            rating: 0,
            category: "Truyền Hình",
            status: "Đang phát sóng"
        });
    } catch (e) {
        return JSON.stringify({});
    }
}

function parseDetailResponse(html) {
    return JSON.stringify({}); 
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ"
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
