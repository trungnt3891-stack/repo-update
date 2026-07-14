// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsmov",
        "name": "VSMOV",
        "version": "1.0.4",
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
        { slug: 'subteam', title: 'Subteam', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-thuyet-minh', title: 'Phim Thuyết Minh', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-long-tieng', title: 'Phim Lồng Tiếng', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-moi-cap-nhat-v3', title: 'Phim Mới Cập Nhật', type: 'Grid', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat-v3' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
        { name: 'TV shows', slug: 'tv-shows' },
        { name: 'Hoạt hình', slug: 'hoat-hinh' },
        { name: 'Phim vietsub', slug: 'phim-vietsub' },
        { name: 'Phim thuyết minh', slug: 'phim-thuyet-minh' },
        { name: 'Phim lồng tiếng', slug: 'phim-long-tieng' },
        { name: 'Subteam', slug: 'subteam' },
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
// URL GENERATION (GIỮ Y HỆT KKPHIM)
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;

        var listSlugs = ['phim-vietsub', 'subteam', 'phim-thuyet-minh', 'phim-long-tieng', 'phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-chieu-rap', 'phim-moi-cap-nhat'];
        var basePath = listSlugs.indexOf(slug) !== -1 ? "danh-sach" : "the-loai";

        var typeList = slug;

        if (typeList === 'phim-moi') typeList = 'phim-moi-cap-nhat-v3';

        if (slug === 'phim-moi-cap-nhat-v3' || typeList === 'phim-moi-cap-nhat-v3') {
            return "https://vsmov.com/danh-sach/phim-moi-cap-nhat-v3?page=" + page;
        }

        var url = "https://vsmov.com/v1/api/" + basePath + "/" + typeList + "?page=" + page;

        if (filters.limit) url += "&limit=" + filters.limit;
        else url += "&limit=24";

        if (filters.country) url += "&country=" + filters.country;
        if (filters.year) url += "&year=" + filters.year;
        if (filters.category) url += "&category=" + filters.category;
        if (filters.sort) url += "&sort_field=" + filters.sort;

        return url;
    } catch (e) {
        return "https://vsmov.com/v1/api/danh-sach/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var limit = filters.limit || 24;
    return "https://vsmov.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&limit=" + limit;
}

function getUrlDetail(slug) {
    return "https://vsmov.com/phim/" + slug;
}

function getUrlCategories() { return "https://vsmov.com/the-loai"; }
function getUrlCountries() { return "https://vsmov.com/quoc-gia"; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var data = response.data || {};
        var items = data.items || [];
        
        // Tự động nhận diện CDN ảnh của VSMOV trả về
        var cdnDomain = data.APP_DOMAIN_CDN_IMAGE || response.pathImage || "https://vsmov.com/uploads/movies/";

        if (Array.isArray(data)) {
            items = data;
        } else if (Array.isArray(response.items)) {
            items = response.items;
        }

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
        var movie = response.movie || {};
        var episodes = response.episodes || [];
        var cdnDomain = response.pathImage || "https://vsmov.com/uploads/movies/";

        var servers = [];
        episodes.forEach(function (server) {
            var serverEpisodes = [];
            if (server.server_data) {
                server.server_data.forEach(function (ep) {
                    serverEpisodes.push({
                        id: ep.link_m3u8 || ep.link_embed,
                        name: ep.name,
                        slug: ep.slug
                    });
                });
            }
            if (serverEpisodes.length > 0) {
                servers.push({ name: server.server_name, episodes: serverEpisodes });
            }
        });

        var categories = (movie.category || []).map(function (c) { return c.name; }).join(", ");
        var countries = (movie.country || []).map(function (c) { return c.name; }).join(", ");
        var directors = (movie.director || []).join(", ");
        var actors = (movie.actor || []).join(", ");

        var ratingValue = 0;
        var tmdbId = "";
        var tmdbSeason = 0;
        var tmdbType = "";
        if (movie.tmdb) {
            if (movie.tmdb.vote_average) ratingValue = movie.tmdb.vote_average;
            if (movie.tmdb.id) tmdbId = movie.tmdb.id;
            if (movie.tmdb.season) tmdbSeason = parseInt(movie.tmdb.season, 10);
            if (movie.tmdb.type) tmdbType = movie.tmdb.type;
        }

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            originName: movie.origin_name || "",
            posterUrl: getPosterUrl(movie.poster_url, cdnDomain),
            backdropUrl: getPosterUrl(movie.thumb_url, cdnDomain),
            description: (movie.content || "").replace(/<[^>]*>/g, ""),
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
        var items = (response.data && response.data.items) ? response.data.items : (response.items || (Array.isArray(response) ? response : []));
        return JSON.stringify(items.map(function (i) { return { name: i.name, slug: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseCountriesResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = (response.data && response.data.items) ? response.data.items : (response.items || (Array.isArray(response) ? response : []));
        return JSON.stringify(items.map(function (i) { return { name: i.name, value: i.slug }; }));
    } catch (e) { return "[]"; }
}

function parseYearsResponse(apiResponseJson) {
    return "[]";
}

// Bổ sung cdnDomain thay vì hardcode tĩnh như bản KKPhim
function getPosterUrl(path, cdnDomain) {
    if (!path) return "";
    if (path.indexOf("http") === 0) return path;
    var baseCdn = cdnDomain;
    if (baseCdn.slice(-1) === '/' && path.charAt(0) === '/') {
        return baseCdn + path.substring(1);
    } else if (baseCdn.slice(-1) !== '/' && path.charAt(0) !== '/') {
        return baseCdn + '/' + path;
    }
    return baseCdn + path;
}
