// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

var API_URL = "https://vsmov.com/api/v1"; // Thay đổi nếu đường dẫn API base của VSMOV khác
var DOMAIN_IMAGE = "https://vsmov.com/uploads/movies/"; // Đường dẫn ảnh mặc định nếu API không trả về full link

function getManifest() {
    return JSON.stringify({
        "id": "vsmov-api",
        "name": "VSMOV Phim",
        "version": "1.0.0",
        "baseUrl": "https://vsmov.com",
        "iconUrl": "https://via.placeholder.com/500x500.png?text=VSMOV", 
        "isEnabled": true,
        "type": "VIDEO",
        "layoutType": "HORIZONTAL",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi-cap-nhat', title: '🔥 Phim Mới Cập Nhật', type: 'Grid', path: 'vsmov-api' },
        { slug: 'phim-le', title: '🎬 Phim Lẻ', type: 'Grid', path: 'vsmov-api' },
        { slug: 'phim-bo', title: '📺 Phim Bộ', type: 'Grid', path: 'vsmov-api' },
        { slug: 'hoat-hinh', title: '🦄 Hoạt Hình', type: 'Grid', path: 'vsmov-api' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim Mới', slug: 'phim-moi-cap-nhat' },
        { name: 'Phim Lẻ', slug: 'phim-le' },
        { name: 'Phim Bộ', slug: 'phim-bo' },
        { name: 'Hoạt Hình', slug: 'hoat-hinh' },
        { name: 'TV Shows', slug: 'tv-shows' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({});
}

// =============================================================================
// URL GENERATION
// =============================================================================

// Helper để lấy số trang nếu app hỗ trợ load more
function getPage(filtersJson) {
    try {
        var filters = JSON.parse(filtersJson);
        if (filters && filters.page) return filters.page;
    } catch (e) {}
    return 1;
}

function getUrlList(slug, filtersJson) {
    var page = getPage(filtersJson);
    if (slug === 'phim-moi-cap-nhat') {
        return API_URL + "/danh-sach/phim-moi-cap-nhat?page=" + page;
    }
    return API_URL + "/danh-sach/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    var page = getPage(filtersJson);
    // API tìm kiếm chuẩn thường có dạng này
    return API_URL + "/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&page=" + page;
}

function getUrlDetail(slug) {
    // Slug ở đây chính là mã phim (id) được truyền từ list vào
    return API_URL + "/phim/" + encodeURIComponent(slug);
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS (XỬ LÝ CHUỖI JSON API TRẢ VỀ)
// =============================================================================

// Xử lý link ảnh: Nếu API trả về link có sẵn http thì giữ nguyên, không thì nối với domain ảnh
function getImageUrl(url, cdnDomain) {
    if (!url) return "";
    if (url.indexOf("http") === 0) return url;
    var baseCdn = cdnDomain ? cdnDomain : DOMAIN_IMAGE;
    return baseCdn + url;
}

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var json = JSON.parse(apiResponseJson);
        var items = [];
        var totalPages = 1;
        var currentPage = 1;
        var totalItems = 0;
        var cdnDomain = "";

        // Tùy theo cấu trúc VSMOV, dữ liệu có thể nằm trong json.data hoặc json.items
        var dataObj = json.data ? json.data : json;
        
        if (dataObj.APP_DOMAIN_CDN_IMAGE) cdnDomain = dataObj.APP_DOMAIN_CDN_IMAGE;

        var movieList = dataObj.items ? dataObj.items : (Array.isArray(dataObj) ? dataObj : []);

        if (dataObj.params && dataObj.params.pagination) {
            currentPage = dataObj.params.pagination.currentPage || 1;
            totalPages = dataObj.params.pagination.totalPages || 1;
            totalItems = dataObj.params.pagination.totalItems || 0;
        }

        movieList.forEach(function (movie) {
            items.push({
                id: movie.slug || movie._id, // Gắn slug làm ID để truyền sang getUrlDetail
                title: movie.name || movie.title,
                posterUrl: getImageUrl(movie.thumb_url, cdnDomain),
                backdropUrl: getImageUrl(movie.poster_url, cdnDomain),
                year: movie.year || new Date().getFullYear(),
                quality: movie.quality || "HD",
                episode_current: movie.episode_current || "",
                lang: movie.lang || "Vietsub"
            });
        });

        return JSON.stringify({
            items: items,
            pagination: { 
                currentPage: currentPage, 
                totalPages: totalPages, 
                totalItems: totalItems, 
                itemsPerPage: 24 
            }
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
        var json = JSON.parse(apiResponseJson);
        // Lấy object chi tiết phim
        var dataObj = json.data ? json.data : json;
        var item = dataObj.item ? dataObj.item : dataObj;
        
        var cdnDomain = dataObj.APP_DOMAIN_CDN_IMAGE || "";

        var servers = [];
        // Lấy danh sách server và tập phim
        var episodesData = item.episodes || [];
        
        episodesData.forEach(function (serverObj) {
            var episodes = [];
            var serverData = serverObj.server_data || [];
            
            serverData.forEach(function (ep) {
                // Link m3u8 là nguồn phát trực tiếp của tập phim
                var streamUrl = ep.link_m3u8 || ep.link_embed || "";
                if (streamUrl) {
                    episodes.push({
                        id: streamUrl, 
                        name: ep.name || "Full",
                        slug: ep.slug || "full"
                    });
                }
            });

            if (episodes.length > 0) {
                servers.push({
                    name: serverObj.server_name || "Server Chính",
                    episodes: episodes
                });
            }
        });

        // Xử lý diễn viên & đạo diễn (thường API trả về mảng)
        var casts = Array.isArray(item.actor) ? item.actor.join(", ") : (item.actor || "");
        var director = Array.isArray(item.director) ? item.director.join(", ") : (item.director || "");

        return JSON.stringify({
            id: item.slug || item._id,
            title: item.name || "",
            originName: item.origin_name || "",
            posterUrl: getImageUrl(item.thumb_url, cdnDomain),
            backdropUrl: getImageUrl(item.poster_url, cdnDomain),
            description: item.content || "Không có nội dung mô tả",
            year: item.year || 0,
            rating: 10,
            quality: item.quality || "HD",
            servers: servers,
            episode_current: item.episode_current || "",
            lang: item.lang || "Vietsub",
            category: "Phim",
            country: Array.isArray(item.country) ? item.country.map(c => c.name).join(", ") : "Quốc Tế",
            director: director,
            casts: casts
        });
    } catch (error) {
        return "null";
    }
}

// Khi người dùng bấm vào 1 Tập Phim, URL của tập đó được truyền vào apiUrl
function parseDetailResponse(apiResponseJson, apiUrl) {
    // Với phim VOD, apiUrl ở đây thường chính là link m3u8 ta đã nhét vào "id" ở phần parseMovieDetail
    return JSON.stringify({
        url: apiUrl || "",
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        },
        subtitles: []
    });
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }
