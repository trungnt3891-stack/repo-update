// =============================================================================
// RECURSIVE EMBED PARSER - ÉP CHẠY THẲNG EXOPLAYER (KHÔNG QUA WEBVIEW)
// =============================================================================

function parseEmbedResponse(html, sourceUrl) {
    try {
        var streamUrl = "";
        
        // Tìm link m3u8 ẩn trong mã nguồn của trang iframe
        var m3u8Match = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/i);
        if (m3u8Match) {
            streamUrl = m3u8Match[1].replace(/\\/g, "");
        }

        // Nếu không có m3u8, thử tìm link mp4
        if (!streamUrl) {
            var mp4Match = html.match(/(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/i);
            if (mp4Match) {
                streamUrl = mp4Match[1].replace(/\\/g, "");
            }
        }

        if (streamUrl) {
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false, // Tắt Embed, ép VAX đẩy thẳng link cho ExoPlayer
                mimeType: streamUrl.indexOf(".m3u8") !== -1 ? "application/x-mpegURL" : "video/mp4",
                headers: {
                    "Referer": sourceUrl,
                    "Origin": sourceUrl.split('/').slice(0, 3).join('/'),
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });
        }

        return JSON.stringify({ url: "", isEmbed: false });
    } catch (e) {
        return JSON.stringify({ url: "", isEmbed: false });
    }
}

// =============================================================================
// CÁC HÀM BẮT BUỘC KHÁC ĐỂ TRÁNH LỖI "FILE KHÔNG HỢP LỆ" TRÊN TIVI
// =============================================================================
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
