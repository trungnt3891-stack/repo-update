// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "tinhlagitv",
        "name": "Tinhlagi TV",
        "version": "1.0.0",
        "baseUrl": "https://tinhlagi.pro/tivi",
        "iconUrl": "https://tinhlagi.pro/tinhlagi.ico",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE", // Bắt buộc là MOVIE để gọi Trình phát Video
        "layoutType": "VERTICAL",
        "playerType": "auto"
    });
}

function getHomeSections() {
    // VAX coi mỗi nhóm kênh như 1 bộ phim, ta hiển thị chúng ra Trang Chủ
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
    // Trang web này load toàn bộ kênh trên 1 trang duy nhất
    return "https://tinhlagi.pro/tivi";
}

function getUrlSearch(keyword, filtersJson) {
    return "https://tinhlagi.pro/tivi"; // Giao diện web không có API search trả về HTML tách biệt
}

function getUrlDetail(slug) {
    // Để lấy danh sách tập (các kênh con), ta lại tải trang chủ 1 lần nữa
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

// --- HÀM 1: TẠO DANH MỤC TRÊN TRANG CHỦ ---
// Thay vì in ra hàng trăm kênh rối mắt, ta in ra 7 "Cục" đại diện cho 7 nhóm kênh
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
            id: groups[i].id, // VD: "VTV". Sẽ ném vào hàm getUrlDetail
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

// --- HÀM 2: LẤY DANH SÁCH KÊNH (TẬP PHIM) TỪ TỪNG NHÓM ---
// Khi người dùng ấn vào Cục "VTV", hàm này sẽ quét HTML và moi ra VTV1, VTV2, VTV3... làm danh sách tập
function parseMovieDetail(html) {
    try {
        // App VAX không truyền thẳng slug vào hàm parseMovieDetail qua tham số.
        // NHƯNG, do cấu trúc đặc biệt của plugin này (đổi Group -> Movie), 
        // VAX sẽ quét toàn bộ file HTML. Chúng ta sẽ "gom" 7 nhóm kênh thành 7 Server khác nhau!
        // Như vậy, người dùng bấm vào 1 nhóm bất kỳ cũng sẽ thấy được toàn bộ 7 server để chọn qua lại.

        var requiredGroups = ["VTV", "VTVcab", "SCTV", "HTV", "HTVC", "Địa phương", "Thiết yếu"];
        var servers = [];

        var groupBlocks = html.split('<h2 class="group-title">');
        
        for (var i = 1; i < groupBlocks.length; i++) {
            var block = groupBlocks[i];
            
            // Tìm tên nhóm kênh (ví dụ "VTV (13)")
            var titleEnd = block.indexOf('</h2>');
            var rawTitle = block.substring(0, titleEnd);
            var groupName = PluginUtils.cleanText(rawTitle).split('(')[0].trim(); // Bỏ số lượng (13)
            
            // Lọc: Nếu tên nhóm không nằm trong danh sách yêu cầu, bỏ qua luôn!
            var isRequired = false;
            for (var j = 0; j < requiredGroups.length; j++) {
                if (groupName.indexOf(requiredGroups[j]) !== -1) {
                    isRequired = true;
                    groupName = requiredGroups[j]; // Chuẩn hóa tên (VD: "Thiết yếu (2)" -> "Thiết yếu")
                    break;
                }
            }
            if (!isRequired) continue;

            // Moi danh sách kênh trong nhóm đó (Các thẻ <a href="?url=...">)
            var episodes = [];
            var channelParts = block.split('class="channel-card');
            
            for (var k = 1; k < channelParts.length; k++) {
                var cp = channelParts[k];
                var urlM = cp.match(/href=["']\?url=([^&"']+)/i);
                var nameM = cp.match(/&name=([^"']+)/i);
                
                if (urlM && nameM) {
                    var streamLink = decodeURIComponent(urlM[1]); // Đã giải mã link https%3A...
                    var channelName = decodeURIComponent(nameM[1]).replace(/\+/g, " "); // Xóa dấu +
                    
                    // Gom thẳng link luồng m3u8 vào làm ID của tập phim
                    episodes.push({
                        id: streamLink, 
                        name: channelName,
                        slug: "live-channel"
                    });
                }
            }

            if (episodes.length > 0) {
                servers.push({
                    name: "Kênh " + groupName,
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

// --- HÀM 3: XỬ LÝ LINK STREAM VÀO PLAYER ---
function parseDetailResponse(html) {
    // Vì hàm parseMovieDetail ở trên đã ném thẳng cái đường dẫn luồng phát (m3u8/mpd) vào biến `id` 
    // Hệ thống VAX sẽ ngầm hiểu `id` chính là URL xem luôn!
    // Tuy nhiên, để tuân thủ luật của VAX (Nếu id là link thẳng m3u8 thì nó không gọi hàm này, 
    // nhưng nếu là link .mpd / .ts thì hên xui VAX vẫn đẩy vào đây), ta bọc thêm 1 lớp bảo hiểm trả rỗng.
    return JSON.stringify({}); 
}

function parseEmbedResponse(html, sourceUrl) {
    return JSON.stringify({ url: "", isEmbed: false });
}

// CÁC HÀM BẮT BUỘC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ"
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
