function getManifest() {
    return JSON.stringify({
        "id": "tinhlagi-proxy",
        "name": "Bóng Đá TV (Proxy)",
        "version": "1.0.4",
        "type": "VIDEO"
    });
}

function getUrlList(slug) {
    // Dùng Proxy của Codetabs để vượt rào CORS và chặn truy cập
    var targetUrl = "http://tinhlagi.pro/s.m3u";
    return "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(targetUrl);
}

function parseListResponse(apiResponseJson) {
    // ... Giữ nguyên logic parseM3U ở code trước ...
    var lines = apiResponseJson.split('\n');
    var items = [];
    var currentTitle = "";
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
            currentTitle = line.substring(line.lastIndexOf(',') + 1).trim();
        } else if (line.startsWith('http')) {
            items.push({ id: line, title: currentTitle, quality: "LIVE", episode_current: "Live" });
        }
    }
    return JSON.stringify({ items: items });
}

// Hàm quan trọng để phát video khi đã có proxy
function parseDetailResponse(apiResponseJson, apiUrl) {
    return JSON.stringify({
        url: apiUrl,
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "http://tinhlagi.pro/" 
        }
    });
}
