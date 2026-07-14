// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "vsphim-official",
        "name": "Vsphim Official",
        "version": "1.0.0",
        "baseUrl": "https://nguon.vsphim.com",
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
        { slug: 'hoat-hinh', title: 'Hoạt Hình', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Phim mới', slug: 'phim-moi-cap-nhat' },
        { name: 'Phim bộ', slug: 'phim-bo' },
        { name: 'Phim lẻ', slug: 'phim-le' },
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
// URL GENERATION (TRỎ ĐÚNG API NGUỒN)
// =============================================================================
var API_BASE = "https://nguon.vsphim.com/api"; 

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    var typeList = (slug === 'phim-moi' || slug === 'phim-moi-cap-nhat-v3') ? 'phim-moi-cap-nhat' : slug;
    
    // Sử dụng endpoint chuẩn của Vsphim
    var basePath = ['phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows', 'phim-moi-cap-nhat'].indexOf(typeList) !== -1 ? "danh-sach" : "the-loai";
    return API_BASE + "/" + basePath + "/" + typeList + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    return API_BASE + "/tim-kiem?keyword=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    return API_BASE + "/phim/" + slug;
}

function getUrlCategories() { return API_BASE + "/the-loai"; }
function getUrlCountries() { return API_BASE + "/quoc-gia"; }
function getUrlYears() { return API_BASE + "/nam"; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var items = response.items || (response.data ? response.data.items : []);
        var cdn = response.pathImage || "https://img.ophim.live/uploads/movies/";

        var movies = items.map(function (item) {
            return {
                id: item.slug,
                title: item.name,
                posterUrl: (item.poster_url && item.poster_url.indexOf('http')===0) ? item.poster_url : cdn + item.poster_url,
                backdropUrl: (item.thumb_url && item.thumb_url.indexOf('http')===0) ? item.thumb_url : cdn + item.thumb_url,
                year: item.year || 0,
                quality: item.quality || "HD",
                episode_current: item.episode_current || "",
                lang: item.lang || ""
            };
        });

        return JSON.stringify({ items: movies, pagination: { currentPage: 1, totalPages: 100 } });
    } catch (e) { return JSON.stringify({ items: [] }); }
}

function parseSearchResponse(apiResponseJson) { return parseListResponse(apiResponseJson); }

function parseMovieDetail(apiResponseJson) {
    try {
        var response = JSON.parse(apiResponseJson);
        var movie = response.movie || {};
        var episodes = response.episodes || [];
        var cdn = response.pathImage || "https://img.ophim.live/uploads/movies/";

        var servers = [];
        episodes.forEach(function (server) {
            var eps = [];
            if (server.server_data) {
                server.server_data.forEach(function (ep) {
                    eps.push({ id: ep.link_m3u8 || ep.link_embed, name: ep.name, slug: ep.slug });
                });
            }
            if (eps.length > 0) servers.push({ name: server.server_name, episodes: eps });
        });

        return JSON.stringify({
            id: movie.slug,
            title: movie.name,
            posterUrl: (movie.poster_url && movie.poster_url.indexOf('http')===0) ? movie.poster_url : cdn + movie.poster_url,
            description: (movie.content || "").replace(/<[^>]*>/g, ""),
            servers: servers,
            category: (movie.category || []).map(function(c){return c.name}).join(", ")
        });
    } catch (e) { return "null"; }
}

function parseDetailResponse(apiResponseJson) {
    return JSON.stringify({ url: "", headers: { "User-Agent": "Mozilla/5.0" }, subtitles: [] });
}

function parseCategoriesResponse(apiResponseJson) {
    var r = JSON.parse(apiResponseJson);
    return JSON.stringify(r.map(function(i){ return {name: i.name, slug: i.slug}; }));
}

function parseCountriesResponse(apiResponseJson) {
    var r = JSON.parse(apiResponseJson);
    return JSON.stringify(r.map(function(i){ return {name: i.name, value: i.slug}; }));
}

function parseYearsResponse(apiResponseJson) { return "[]"; }
