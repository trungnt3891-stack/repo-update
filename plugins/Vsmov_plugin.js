// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VSMOV",
        "version": "1.0.1",
        "baseUrl": "https://vsmov.com",
        "iconUrl": "https://vsmov.com/logo.png", 
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-le', title: 'Phim Lẻ', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'tv-shows', title: 'TV Shows', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-thuyet-minh', title: 'Phim Thuyết Minh', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-long-tieng', title: 'Phim Lồng Tiếng', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-moi-cap-nhat', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'TV shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'Phim vietsub', slug: 'phim-vietsub' },
        { name: 'Phim thuyết minh', slug: 'phim-thuyet-minh' },
        { name: 'Phim lồng tiếng', slug: 'phim-long-tieng' },
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
// URL GENERATION
// =============================================================================

// Nếu VSMOV không chạy với đường dẫn này, bạn đổi thành "https://vsmov.com/api/v1" hoặc "https://vsmov.com/api"
var API_BASE = "https://vsmov.com/v1/api"; 

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

        return url;
    } catch (e) {
        return API_BASE + "/danh-sach/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var limit = filters.limit || 24;
    return API_BASE + "/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&limit=" + limit;
}

function getUrlDetail(slug) {
    // Thường API chi tiết bỏ đi chữ /v1/api/ mà gọi thẳng /phim/
    return "https://vsmov.com/phim/" + slug;
}

function getUrlCategories() { return API_BASE + "/the-loai"; }
function getUrlCountries() { return API_BASE + "/quoc-gia"; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || response || {};
        var items = data.items || [];
        var cdnDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "";

        if (Array.isArray(data)) {
            items = data;
        } else if (Array.isArray(response.items)) {
            items = response.items;
        }

        var params = data.params || {};
        var pagination = response.pagination || params.pagination || {};

        var movies = [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            movies.push({
                id: item.slug || item._id,
                title: item.name,
                posterUrl: getPosterUrl(item.poster_url, cdnDomain),
                backdropUrl: getPosterUrl(item.thumb_url, cdnDomain),
                year: item.year || 0,
                quality: item.quality || "",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            });
        }

        return JSON.stringify({
            items: movies,
            pagination: {
                currentPage: pagination.currentPage || 1,
                totalPages: Math.ceil((pagination.totalItems || 0) / (pagination.totalItemsPerPage || 24)),
                totalItems: pagination.totalItems || 0,
                itemsPerPage: pagination.totalItemsPerPage || 24
            }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(apiResponseJson) {
    return parseListResponse(apiResponseJson);
}

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || response || {};
        var movie = data.item || data.movie || response.movie || {};
        var episodes = data.episodes || response.episodes || [];
        var cdnDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "";

        var servers = [];
        for (var i = 0; i < episodes.length; i++) {
            var server = episodes[i];
            var serverEpisodes = [];
            if (server.server_data) {
                for (var j = 0; j < server.server_data.length; j++) {
                    var ep = server.server_data[j];
                    serverEpisodes.push({
                        id: ep.link_m3u8 || ep.link_embed,
                        name: ep.name,
                        slug: ep.slug
                    });
                }
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name, episodes: serverEpisodes });
            }
        }

        // ES5 compatible map/join
        var categories = "";
        if (movie.category && movie.category.length) {
            var catArr = [];
            for (var c = 0; c < movie.category.length; c++) { catArr.push(movie.category[c].name); }
            categories = catArr.join(", ");
        }

        var countries = "";
        if (movie.country && movie.country.length) {
            var couArr = [];
            for (var c2 = 0; c2 < movie.country.length; c2++) { couArr.push(movie.country[c2].name); }
            countries = couArr.join(", ");
        }

        var directors = (movie.director || []).join(", ");
        var actors = (movie.actor || []).join(", ");
        var ratingValue = 0, tmdbId = "", tmdbSeason = 0, tmdbType = "";

        if (movie.tmdb) {
            if (movie.tmdb.vote_average) ratingValue = movie.tmdb.vote_average;
            if (movie.tmdb.id) tmdbId = movie.tmdb.id;
            if (movie.tmdb.season) tmdbSeason = parseInt(movie.tmdb.season, 10);
            if (movie.tmdb.type) tmdbType = movie.tmdb.type;
        }

        var desc = movie.content || "";
        desc = desc.replace(/<[^>]*>/g, ""); // Xóa tag HTML

        return JSON.stringify({
            id: movie.slug || movie._id,
            title: movie.name,
            originName: movie.origin_name || "",
            posterUrl: getPosterUrl(movie.poster_url, cdnDomain),
            backdropUrl: getPosterUrl(movie.thumb_url, cdnDomain),
            description: desc,
            year: movie.year || 0,
            rating: ratingValue,
            quality: movie.quality || "",
            duration: movie.time || "",
            servers: servers,
            episode_current: movie.episode_current || "",
            lang: movie.lang || "",
            category: categories,
            country: countries,
            director: directors,
            casts: actors,
            status: movie.status || "",
            tmdbId: String(tmdbId),
            tmdbSeason: tmdbSeason || 0,
            tmdbType: tmdbType || ""
        });
    } catch (error) { return "null"; }
}

function parseDetailResponse(apiResponseJson) {
    return JSON.stringify({
        url: "", 
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://vsmov.com" },
        subtitles: []
    });
}

function parseCategoriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = data.items || response.items || (Array.isArray(response) ? response : []);
        var cats = [];
        for (var i = 0; i < items.length; i++) {
            cats.push({ name: items[i].name, slug: items[i].slug });
        }
        return JSON.stringify(cats);
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = data.items || response.items || (Array.isArray(response) ? response : []);
        var cou = [];
        for (var i = 0; i < items.length; i++) {
            cou.push({ name: items[i].name, value: items[i].slug });
        }
        return JSON.stringify(cou);
    } catch (e) { return "[]"; }
}

function parseYearsResponse(apiResponseJson) {
    return "[]";
}

function getPosterUrl(path, cdnDomain) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    var baseCdn = cdnDomain || "https://vsmov.com/uploads/movies/";
    if (baseCdn.slice(-1) === '/' && path.charAt(0) === '/') {
        return baseCdn + path.substring(1);
    } else if (baseCdn.slice(-1) !== '/' && path.charAt(0) !== '/') {
        return baseCdn + '/' + path;
    }
    return baseCdn + path;
}
