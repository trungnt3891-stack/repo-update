function getManifest() {
    return JSON.stringify({
        "id": "test-iptv",
        "name": "TEST KÊNH IPTV",
        "version": "1.0.0",
        "baseUrl": "https://tinhlagi.pro",
        "isEnabled": true,
        "type": "VIDEO"
    });
}

function getUrlList(slug, filtersJson) {
    // Dùng trực tiếp link đích (nếu bạn biết link raw sau khi redirect)
    return "https://tinhlagi.pro/s.m3u"; 
}

function parseListResponse(apiResponseJson, apiUrl) {
    var lines = apiResponseJson.split('\n');
    var items = [];
    // Chỉ lấy 20 kênh đầu tiên để kiểm tra app có load được không
    var count = 0; 

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.indexOf('#EXTINF:') === 0 && count < 20) {
            var name = line.substring(line.lastIndexOf(',') + 1);
            var url = lines[i+1];
            if (url && url.indexOf('http') === 0) {
                items.push({
                    id: url,
                    title: name,
                    posterUrl: "",
                    quality: "LIVE",
                    episode_current: "Test",
                    lang: "Việt"
                });
                count++;
            }
        }
    }
    return JSON.stringify({ items: items, pagination: { currentPage: 1, totalPages: 1 } });
}

function parseDetailResponse(apiResponseJson, apiUrl) {
    return JSON.stringify({ url: apiUrl, headers: { "User-Agent": "Mozilla/5.0" } });
}

function getUrlDetail(slug) { return slug; }
function parseMovieDetail(a, b) { return JSON.stringify({ servers: [{ episodes: [{ id: b, name: "Play" }] }] }); }
function getUrlSearch(k) { return ""; }
function getUrlCategories() { return ""; }
function parseCategoriesResponse() { return "[]"; }
function parseSearchResponse() { return "[]"; }
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }
function getFilterConfig() { return "{}"; }
function getHomeSections() { return "[]"; }
function getPrimaryCategories() { return "[]"; }
