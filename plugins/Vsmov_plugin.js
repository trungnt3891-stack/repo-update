// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VSMOV",
        "version": "2.0.0",
        "baseUrl": "https://vsmov.com",
        "iconUrl": "https://vsmov.com/logo.png",
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' }
    ]);
}

// Tắt toàn bộ bộ lọc phức tạp để tránh lỗi 500 từ Server VSMOV
function getFilterConfig() {
    return "{}";
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var page = 1;
    try {
        var filters = JSON.parse(filtersJson || "{}");
        if (filters.page) page = filters.page;
    } catch (e) {}

    var typeList = slug;
    if (typeList === 'phim-moi' || typeList === 'phim-moi-cap-nhat-v3') {
        typeList = 'phim-moi-cap-nhat';
    }

    var isDanhSach = ['phim-vietsub', 'subteam', 'phim-thuyet-minh', 'phim-long-tieng', 'phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap', 'phim-moi-cap-nhat'].indexOf(typeList) !== -1;
    var basePath = isDanhSach ? "danh-sach" : "the-loai";

    return "https://vsmov.com/api/" + basePath + "/" + typeList + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    return "https://vsmov.com/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&limit=24";
}

function getUrlDetail(slug) {
    return "https://vsmov.com/api/phim/" + slug;
}

function getUrlCategories() { return "https://vsmov.com/api/the-loai"; }
function getUrlCountries() { return "https://vsmov.com/api/quoc-gia"; }
function getUrlYears() { return "https://vsmov.com/api/nam"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        // NẾU API TRẢ VỀ HTML HOẶC TRỐNG RỖNG (BỊ CHẶN CLOUDFLARE)
        if (!apiResponseJson || apiResponseJson.indexOf("<html") !== -1 || apiResponseJson.indexOf("cloudflare") !== -1) {
            return JSON.stringify({
                items: [{
                    id: "error",
                    title: "❌ VSMOV Đang Chặn API (Lỗi Cloudflare)",
                    posterUrl: "https://via.placeholder.com/300x450?text=Loi+API",
                    backdropUrl: "https://via.placeholder.com/300x450?text=Loi+API",
                    year: 2024, quality: "ERROR", episode_current: "Lỗi", lang: "Bị chặn"
                }],
                pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 1 }
            });
        }

        var response = JSON.parse(apiResponseJson);
        var data = response.data || response || {};
        var items = data.items || response.items || [];
        var cdnDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "https://vsmov.com/uploads/movies/";

        if (Object.prototype.toString.call(items) !== '[object Array]') items = [];

        var movies = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            movies.push({
                id: item.slug,
                title: item.name,
                posterUrl: getPosterUrl(item.poster_url, cdnDomain),
                backdropUrl: getPosterUrl(item.thumb_url, cdnDomain),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            });
        }

        // Đảm bảo không lỗi phân trang
        if (movies.length === 0) {
            movies.push({
                id: "empty", title: "Không tìm thấy phim", posterUrl: "", backdropUrl: "", year: 0, quality: "", episode_current: "", lang: ""
            });
        }

        return JSON.stringify({
            items: movies,
            pagination: { currentPage: 1, totalPages: 100, totalItems: 1000, itemsPerPage: 24 }
        });
    } catch (error) {
        // NẾU LỖI CÚ PHÁP (JSON PARSE FAILED)
        return JSON.stringify({
            items: [{
                id: "error2", title: "❌ Lỗi đọc dữ liệu từ máy chủ", posterUrl: "", backdropUrl: "", year: 0, quality: "", episode_current: "", lang: ""
            }],
            pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 1 }
        });
    }
}

function parseSearchResponse(apiResponseJson) { return parseListResponse(apiResponseJson); }

function parseMovieDetail(apiResponseJson) { return "null"; }
function parseDetailResponse(apiResponseJson) { return "{}"; }
function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }

function getPosterUrl(path, cdnDomain) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    var baseCdn = cdnDomain;
    if (baseCdn.slice(-1) === '/' && path.charAt(0) === '/') return baseCdn + path.substring(1);
    if (baseCdn.slice(-1) !== '/' && path.charAt(0) !== '/') return baseCdn + '/' + path;
    return baseCdn + path;
}
