// =============================================================================
// CẤU HÌNH & METADATA
// =============================================================================

// Chuyển link github dạng blob sang link raw để lấy nội dung text trực tiếp
var RAW_M3U_URL = "https://raw.githubusercontent.com/hieumx/yanhh3d-iptv/main/playlist.m3u";

function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d_iptv",
        "name": "YanHH3D (M3U)",
        "description": "Nguồn phim hoạt hình 3D load siêu tốc từ Playlist M3U của hieumx.",
        "version": "2.0.0",
        "BASEURL": RAW_M3U_URL,
        "iconUrl": "https://hoathinh3d.co/wp-content/uploads/2023/09/favicon.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "playerType": "auto",
        "layoutType": "VERTICAL"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[YanHH3D-M3U] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[YanHH3D-M3U] " + msg);
    }
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'all', title: 'Danh Sách Phim (M3U)', type: 'Grid', path: '' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Tất cả phim', slug: 'all' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        category: [
            { name: "Tất cả phim", value: "all" }
        ]
    });
}

// =============================================================================
// M3U PARSER CORE: Biến Playlist phẳng thành cấu trúc Phim Bộ
// =============================================================================

function parseM3UToGroups(m3uText) {
    var groups = {};
    var lines = m3uText.split('\n');
    var currentItem = null;

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;

        if (line.indexOf('#EXTINF:') === 0) {
            currentItem = { title: "Không tên", posterUrl: "", group: "" };
            
            // Lấy ảnh bìa
            var logoMatch = line.match(/tvg-logo=["']([^"']+)["']/i);
            if (logoMatch) currentItem.posterUrl = logoMatch[1];
            
            // Lấy tên nhóm (Tên Phim)
            var groupMatch = line.match(/group-title=["']([^"']+)["']/i);
            if (groupMatch) currentItem.group = groupMatch[1];
            
            // Lấy tiêu đề (Tên Tập)
            var commaIndex = line.indexOf(',');
            if (commaIndex !== -1) {
                currentItem.title = line.substring(commaIndex + 1).trim();
            }
        } else if (line.indexOf('#') !== 0) {
            // Đây là dòng chứa Link Video
            if (currentItem) {
                var streamUrl = line;
                var gName = currentItem.group;
                var epName = currentItem.title;
                
                // Fallback: Nếu không có group-title, tự động tách từ Tên (VD: "Đấu La Đại Lục - Tập 1")
                if (!gName) {
                    var match = epName.match(/(.*?)\s*[-_:]?\s*(Tập|Ep|Part)\s*\d+/i);
                    if (match) {
                        gName = match[1].trim();
                    } else {
                        gName = epName; // Nếu không có chữ "Tập", lấy nguyên tên
                    }
                }
                
                // Rút gọn tên tập cho đẹp (VD: Xóa tên phim khỏi tên tập)
                if (gName && epName.indexOf(gName) !== -1 && gName !== epName) {
                    epName = epName.replace(gName, "").replace(/^[\s\-\_:]+/, "").trim();
                    if (!epName.toLowerCase().startsWith("tập") && !epName.toLowerCase().startsWith("ep")) {
                        epName = "Tập " + epName;
                    }
                }
                if (!gName) gName = "Danh sách khác";

                // Nhóm vào object chung
                if (!groups[gName]) {
                    groups[gName] = {
                        title: gName,
                        posterUrl: currentItem.posterUrl,
                        episodes: []
                    };
                }
                
                groups[gName].episodes.push({
                    id: streamUrl, // Truyền trực tiếp link stream làm ID
                    name: epName,
                    slug: streamUrl
                });
                
                // Nếu nhóm chưa có ảnh bìa, lấy ảnh của tập đầu tiên
                if (!groups[gName].posterUrl && currentItem.posterUrl) {
                    groups[gName].posterUrl = currentItem.posterUrl;
                }
                
                currentItem = null; // Reset cho tập tiếp theo
            }
        }
    }
    
    // Convert object thành mảng Array
    var result = [];
    for (var key in groups) {
        result.push(groups[key]);
    }
    return result;
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var filters = JSON.parse(filtersJson);
            page = filters.page || 1;
        } catch(e) {}
    }
    // Gắn thêm param để parseListResponse biết đang ở page nào
    return RAW_M3U_URL + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var page = 1;
    if (filtersJson) {
        try {
            var filters = JSON.parse(filtersJson);
            page = filters.page || 1;
        } catch (e) {}
    }
    return RAW_M3U_URL + "?page=" + page + "&search=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    // Nếu app gọi detail_group, truyền tên nhóm vào url để bóc tách
    if (slug && slug.startsWith("detail_group|")) {
        var groupName = slug.split("|")[1];
        return RAW_M3U_URL + "?detail=" + encodeURIComponent(groupName);
    }
    // Nếu là link trực tiếp (khi click tập phim), trả về nguyên bản
    return slug;
}

function getUrlCategories() { return RAW_M3U_URL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, url) {
    try {
        var page = 1;
        var pageMatch = url.match(/page=(\d+)/);
        if (pageMatch) page = parseInt(pageMatch[1]);
        
        // 1. Phân tích toàn bộ M3U thành các bộ phim
        var groups = parseM3UToGroups(html);
        
        // 2. Lọc nếu đang ở chế độ tìm kiếm
        var searchMatch = url.match(/search=([^&]+)/);
        if (searchMatch) {
            var keyword = decodeURIComponent(searchMatch[1]).toLowerCase();
            groups = groups.filter(function(g) {
                return g.title.toLowerCase().indexOf(keyword) !== -1;
            });
        }
        
        // 3. Phân trang nội bộ (PAGINATION MOCKING)
        var limit = 24; 
        var start = (page - 1) * limit;
        var end = start + limit;
        var paginatedGroups = groups.slice(start, end);
        var totalPages = Math.ceil(groups.length / limit) || 1;
        
        var items = [];
        paginatedGroups.forEach(function(g) {
            items.push({
                id: "detail_group|" + g.title, // Tạo ID ảo để App gọi getUrlDetail
                title: g.title,
                posterUrl: g.posterUrl || "https://hoathinh3d.co/wp-content/uploads/2023/09/favicon.png",
                backdropUrl: g.posterUrl,
                episode_current: g.episodes.length > 1 ? g.episodes.length + " Tập" : "Full",
                quality: "HD"
            });
        });
        
        return JSON.stringify({
            items: items,
            pagination: {
                currentPage: page,
                totalPages: totalPages
            }
        });
    } catch(e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseMovieDetail(html, url) {
    try {
        var groupName = "";
        var detailMatch = url.match(/detail=([^&]+)/);
        if (detailMatch) groupName = decodeURIComponent(detailMatch[1]);
        
        var groups = parseM3UToGroups(html);
        var selectedGroup = null;
        
        // Tìm đúng nhóm phim user vừa bấm vào
        for(var i = 0; i < groups.length; i++) {
            if (groups[i].title === groupName) {
                selectedGroup = groups[i];
                break;
            }
        }
        
        if (selectedGroup) {
            return JSON.stringify({
                id: url,
                title: selectedGroup.title,
                posterUrl: selectedGroup.posterUrl || "https://hoathinh3d.co/wp-content/uploads/2023/09/favicon.png",
                backdropUrl: selectedGroup.posterUrl,
                description: "Danh sách phát được tổng hợp từ nguồn IPTV (M3U) của YanHH3D. Tốc độ cao, không quảng cáo, xem trực tiếp qua trình phát nội tại.",
                status: selectedGroup.episodes.length + " Tập",
                year: 2024,
                category: "Hoạt Hình 3D",
                servers: [{
                    name: "Nguồn IPTV (M3U)",
                    episodes: selectedGroup.episodes
                }]
            });
        }
        return "{}";
    } catch(e) {
        return "{}";
    }
}

function parseDetailResponse(html, url) {
    // Vì ID tập phim chính là link trực tiếp (.m3u8, .mp4, .ts)
    // Chúng ta không cần parse web nữa, ném thẳng vào Player phát ngay lập tức.
    return JSON.stringify({
        url: url,
        isEmbed: false, // Báo cho app biết đây là link direct, không phải iframe web
        headers: {
            "User-Agent": "VLC/3.0.16 LibVLC/3.0.16",
            "Accept": "*/*"
        }
    });
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
