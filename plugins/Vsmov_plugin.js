// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VSMOV (Codetabs)",
        "version": "4.0.0",
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
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'TV shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Thời gian', value: 'modified.time' },
            { name: 'Năm', value: 'year' }
        ]
    });
}

// =============================================================================
// PROXY BYPASS (CODETABS)
// =============================================================================
var API_BASE = "https://vsmov.com/api"; 

function getProxyUrl(url) {
    // Trạm trung chuyển ổn định hơn để lách tường lửa
    return "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(url);
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;

        var listSlugs = ['phim-vietsub', 'subteam', 'phim-thuyet-minh', 'phim-long-tieng', 'phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap', 'phim-moi-cap-nhat'];
        var basePath = listSlugs.indexOf(slug) !== -1 ? "danh-sach" : "the-loai";
        var typeList = slug;

        if (typeList === 'phim-moi' || typeList === 'phim-moi-cap-nhat-v3') typeList = 'phim-moi-cap-nhat';

        var url = API_BASE + "/" + basePath + "/" + typeList + "?page=" + page;
        if (filters.limit) url += "&limit=" + filters.limit;
        else url += "&limit=24";

        return getProxyUrl(url); 
    } catch (e) {
        return getProxyUrl(API_BASE + "/danh-sach/" + slug);
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var url = API_BASE + "/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&limit=24&page=" + (filters.page || 1);
    return getProxyUrl(url);
}

function getUrlDetail(slug) { return getProxyUrl(API_BASE + "/phim/" + slug); }
function getUrlCategories() { return getProxyUrl(API_BASE + "/the-loai"); }
function getUrlCountries() { return getProxyUrl(API_BASE + "/quoc-gia"); }
function getUrlYears() { return getProxyUrl(API_BASE + "/nam"); }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        // CHỐNG XOAY MÒNG MÒNG: NẾU TRẢ VỀ HTML LÀ BỊ CHẶN
        if (!apiResponseJson || apiResponseJson.indexOf("<html") !== -1 || apiResponseJson.indexOf("cloudflare") !== -1) {
            return JSON.stringify({
                items: [{ id: "error", title: "❌ API Đang Bị Chặn (Lỗi Cloudflare)", posterUrl: "https://via.placeholder.com/300x450?text=Bi+Chan", backdropUrl: "", year: 0, quality: "Lỗi", episode_current: "Lỗi", lang: "Bảo mật" }],
                pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 1 }
            });
        }

        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = data.items || [];
        var cdnDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "https://vsmov.com/uploads/movies/";

        if (Array.isArray(data)) items = data;
        else if (Array.isArray(response.items)) items = response.items;
        if (!Array.isArray(items)) items = [];

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: getPosterUrl(item.poster_url, cdnDomain),
                backdropUrl: getPosterUrl(item.thumb_url, cdnDomain),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            };
        });

        if (movies.length === 0) {
             movies.push({ id: "empty", title: "Không có dữ liệu", posterUrl: "", backdropUrl: "", year: 0, quality: "", episode_current: "", lang: "" });
        }

        return JSON.stringify({
            items: movies,
            pagination: { currentPage: 1, totalPages: 100, totalItems: 2000, itemsPerPage: 24 }
        });
    } catch (error) {
        return JSON.stringify({
            items: [{ id: "error2", title: "❌ Lỗi đọc định dạng", posterUrl: "", backdropUrl: "", year: 0, quality: "Lỗi", episode_current: "Lỗi", lang: "" }],
            pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 1 }
        });
    }
}

function parseSearchResponse(apiResponseJson) { return parseListResponse(apiResponseJson); }

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || response || {};
        var movie = data.item || data.movie || response.movie || {};
        var episodes = data.episodes || response.episodes || [];
        var cdnDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "https://vsmov.com/uploads/movies/";

        var servers = [];
        if (Array.isArray(episodes)) {
            episodes.forEach(function (server) {
                var serverEpisodes = [];
                if (server.server_data && Array.isArray(server.server_data)) {
                    server.server_data.forEach(function (ep) {
                        if (ep.link_m3u8 || ep.link_embed) {
                            serverEpisodes.push({ id: ep.link_m3u8 || ep.link_embed, name: ep.name, slug: ep.slug });
                        }
                    });
                }
                if (serverEpisodes.length > 0) servers.push({ name: server.server_name, episodes: serverEpisodes });
            });
        }
        
        return JSON.stringify({
            id: movie.slug,
            title: movie.name || "",
            originName: movie.origin_name || "",
            posterUrl: getPosterUrl(movie.poster_url, cdnDomain),
            backdropUrl: getPosterUrl(movie.thumb_url, cdnDomain),
            description: (movie.content || "").replace(/<[^>]*>/g, ""),
            year: movie.year || 0,
            rating: movie.tmdb ? (movie.tmdb.vote_average || 0) : 0,
            quality: movie.quality || "",
            duration: movie.time || "",
            servers: servers,
            episode_current: movie.episode_current || "",
            lang: movie.lang || "",
            category: Array.isArray(movie.category) ? movie.category.map(function (c) { return c.name; }).join(", ") : "",
            country: Array.isArray(movie.country) ? movie.country.map(function (c) { return c.name; }).join(", ") : "",
            director: Array.isArray(movie.director) ? movie.director.join(", ") : "",
            casts: Array.isArray(movie.actor) ? movie.actor.join(", ") : ""
        });
    } catch (error) { return "null"; }
}

function parseDetailResponse(apiResponseJson) {
    return JSON.stringify({ url: "", headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://vsmov.com" }, subtitles: [] });
}

function parseCategoriesResponse(apiResponseJson) { return "[]"; }
function parseCountriesResponse(apiResponseJson) { return "[]"; }
function parseYearsResponse(apiResponseJson) { return "[]"; }

function getPosterUrl(path, cdnDomain) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    var base = cdnDomain;
    if (base.slice(-1) === '/' && path.charAt(0) === '/') return base + path.substring(1);
    if (base.slice(-1) !== '/' && path.charAt(0) !== '/') return base + '/' + path;
    return base + path;
}
