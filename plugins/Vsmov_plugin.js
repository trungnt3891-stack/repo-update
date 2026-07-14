// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov-proxy",
        "name": "VSMOV (Bypass)",
        "version": "3.0.0",
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
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'TV shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'Phim chiếu rạp', slug: 'phim-chieu-rap' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Thời gian cập nhật', value: 'modified.time' },
            { name: 'Năm phát hành', value: 'year' },
            { name: 'Theo ID', value: '_id' }
        ]
    });
}

// =============================================================================
// HÀM BỌC PROXY (BYPASS CLOUDFLARE)
// =============================================================================
var API_BASE = "https://vsmov.com/api"; 

// Hàm này sẽ bọc link VSMOV qua 1 server trung gian để lấy dữ liệu raw JSON
function getProxyUrl(targetUrl) {
    return "https://api.allorigins.win/raw?url=" + encodeURIComponent(targetUrl);
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

        if (filters.country) url += "&country=" + filters.country;
        if (filters.year) url += "&year=" + filters.year;
        if (filters.category) url += "&category=" + filters.category;
        if (filters.sort) url += "&sort_field=" + filters.sort;

        return getProxyUrl(url); // ÉP QUA PROXY
    } catch (e) {
        return getProxyUrl(API_BASE + "/danh-sach/" + slug);
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var limit = filters.limit || 24;
    var page = filters.page || 1;
    var url = API_BASE + "/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&limit=" + limit + "&page=" + page;
    return getProxyUrl(url);
}

function getUrlDetail(slug) {
    return getProxyUrl(API_BASE + "/phim/" + slug);
}

function getUrlCategories() { return getProxyUrl(API_BASE + "/the-loai"); }
function getUrlCountries() { return getProxyUrl(API_BASE + "/quoc-gia"); }
function getUrlYears() { return getProxyUrl(API_BASE + "/nam"); }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = data.items || [];
        var cdnDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "https://vsmov.com/uploads/movies/";

        if (Array.isArray(data)) items = data;
        else if (Array.isArray(response.items)) items = response.items;
        if (!Array.isArray(items)) items = [];

        var params = data.params || {};
        var pagination = response.pagination || params.pagination || {};

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

        var totalItems = pagination.totalItems || movies.length || 0;
        var itemsPerPage = pagination.totalItemsPerPage || 24;

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: pagination.currentPage || 1,
                totalPages: Math.ceil(totalItems / itemsPerPage) || 1,
                totalItems: totalItems,
                itemsPerPage: itemsPerPage
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
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

        var categories = Array.isArray(movie.category) ? movie.category.map(function (c) { return c.name; }).join(", ") : "";
        var countries = Array.isArray(movie.country) ? movie.country.map(function (c) { return c.name; }).join(", ") : "";
        
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
            category: categories,
            country: countries,
            director: Array.isArray(movie.director) ? movie.director.join(", ") : "",
            casts: Array.isArray(movie.actor) ? movie.actor.join(", ") : ""
        });
    } catch (error) { return "null"; }
}

function parseDetailResponse(apiResponseJson) {
    return JSON.stringify({ url: "", headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://vsmov.com" }, subtitles: [] });
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var r = JSON.parse(apiResponseJson);
        var items = (r.data && r.data.items) ? r.data.items : (r.items || (Array.isArray(r) ? r : []));
        if (!Array.isArray(items)) return "[]";
        return JSON.stringify(items.map(function (i) { return { name: i.name, slug: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var r = JSON.parse(apiResponseJson);
        var items = (r.data && r.data.items) ? r.data.items : (r.items || (Array.isArray(r) ? r : []));
        if (!Array.isArray(items)) return "[]";
        return JSON.stringify(items.map(function (i) { return { name: i.name, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseYearsResponse(apiResponseJson) {
    try {
        var r = JSON.parse(apiResponseJson);
        var items = (r.data && r.data.items) ? r.data.items : (r.items || (Array.isArray(r) ? r : []));
        if (!Array.isArray(items)) return "[]";
        return JSON.stringify(items.map(function (i) { return { name: i.name, value: i.name || i.slug }; }));
    } catch (e) { return "[]"; }
}

function getPosterUrl(path, cdnDomain) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    var base = cdnDomain;
    if (base.slice(-1) === '/' && path.charAt(0) === '/') return base + path.substring(1);
    if (base.slice(-1) !== '/' && path.charAt(0) !== '/') return base + '/' + path;
    return base + path;
}
