// =============================================================================
// CONFIGURATION & METADATA
// =============================================================================
var BASEURL = "https://hoathinh3d.co";

function getManifest() {
    return JSON.stringify({
        "id": "hh3d_concept",
        "name": "HH3D - Hoạt Hình 3D",
        "description": "Trang xem phim hoạt hình 3D Trung Quốc siêu hay.",
        "version": "1.4.0",
        "BASEURL": BASEURL,
        "iconUrl": "https://hoathinh3d.co/wp-content/uploads/2023/09/favicon.png",
        "isEnabled": true,
        "isAdult": false,
        "type": "MOVIE",
        "playerType": "auto",
        "layoutType": "VERTICAL"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[HH3D] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[HH3D] " + msg);
    }
}

// Hàm hỗ trợ build menu giống concept
function buildMenu(listStr) {
    var arr = listStr.trim().split('\n');
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        var parts = arr[i].trim().split('@@');
        if (parts.length >= 2) {
            result.push({
                slug: parts[0],
                title: parts[1] || parts[0],
                name: parts[1] || parts[0],
                type: 'Horizontal',
                path: ''
            });
        }
    }
    return result;
}

function getHomeSections() {
    var listurl = `
bang-xep-hang-hoat-hinh-trung-quoc@@Top 10@@false
phim-hoan-thanh@@Hoàn Thành@@false
hh3d-danh-gia-cao@@Xem Nhiều@@false
tien-hiep@@Tiên Hiệp@@false
kiem-hiep@@Kiếm Hiệp@@false
@@Mới Cập Nhật@@true
`;
    return JSON.stringify(buildMenu(listurl));
}

function getLISTmenu() {
    return `
phim-dang-chieu@@Đang chiếu@@false
phim-hoan-thanh@@Hoàn thành@@false
phim-hoat-hinh-3d-le@@Phim lẻ@@false
huyen-huyen@@Huyền huyễn@@false
xuyen-khong@@Xuyên không@@false
trung-sinh@@Trùng sinh@@false
tien-hiep@@Tiên hiệp@@false
co-trang@@Cổ trang@@false
hai-huoc@@Hài hước@@false
kiem-hiep@@Kiếm hiệp@@false
hien-dai@@Hiện đại@@false
`;
}

function getPrimaryCategories() {
    return JSON.stringify(buildMenu(getLISTmenu()));
}

function getFilterConfig() {
    var menulist = buildMenu(getLISTmenu());
    return JSON.stringify({
        sort: [
            { name: 'Mới cập nhật', value: 'latest' },
            { name: 'Đánh giá cao', value: 'rating' },
            { name: 'Xem nhiều', value: 'views' }
        ],
        category: menulist
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1 || slug.indexOf("search") > -1) {
            return slug;
        }
        
        let page = 1;
        let path = slug || "";

        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                let filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
                
                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }

        let resultUrl = BASEURL;
        if (path) {
            resultUrl += "/" + path;
        }
        resultUrl += "/page/" + page + "/";

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        let fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    let page = 1;
    if (filtersJson) {
        try {
            let filters = JSON.parse(filtersJson);
            page = parseInt(filters.page) || 1;
        } catch(e) {}
    }
    return BASEURL + "/page/" + page + "/?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug;
}

function getUrlCategories() { return BASEURL; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        
        // Sử dụng _$(html).find theo chuẩn concept mới
        _$(html).find(".halim-item").each(function () {
            var $item = _$(this);
            var $link = $item.find("a.halim-thumb").first();
            if (!$link.length) $link = $item.find("a").first();
            
            var href = $link.attr("href");
            var title = $link.attr("title") || $item.find(".entry-title").text() || "Đang cập nhật";
            var $img = $item.find("img");
            var src = $img.attr("data-src") || $img.attr("src") || $img.attr("data-srcset") || "";
            var episode = $item.find(".episode").text() || "Full";
            var quality = $item.find(".status").text() || "HD";

            if (src && src.indexOf("http") == -1) {
                src = BASEURL + src;
            }

            if (href) {
                var cleanThumb = src.replace(/&amp;/g, '&');
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb,
                    "episode_current": episode.trim(),
                    "quality": quality.trim()
                });
            }
        });

        // Xử lý phân trang
        var totalPages = 1;
        var currentMatch = html.match(/class=["'][^"']*current[^"']*["'][^>]*>(\d+)/i);
        if (currentMatch) totalPages = Math.max(totalPages, parseInt(currentMatch[1]) + 2); // Ước lượng page
        
        var pageNumMatch = html.match(/class=["'][^"']*page-numbers[^"']*["'][^>]*>(\d+)/g);
        if (pageNumMatch) {
            for(var i=0; i<pageNumMatch.length; i++) {
                var p = parseInt(pageNumMatch[i].replace(/[^\d]/g, ''));
                if (p > totalPages) totalPages = p;
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": totalPages || 999
            }
        });

    } catch (e) {
        return JSON.stringify({
            "items": [{ "id": $url, "title": "Lỗi parse list: " + e, "posterUrl": "", "backdropUrl": "" }],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html, url) {
    var lurl = url;
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var year = 2026;
    var rating = "0";
    var category = "";
    var status = "????";
    var duration = "????";
    var servers = [];

    try {
        var $html = _$(html);
        
        limg = $html.find('meta[property="og:image"]').attr("content") || $html.find('.movie-thumb img').attr('src');
        if (limg && limg.indexOf("http") == -1) limg = BASEURL + limg;
        
        lname = $html.find('h1.movie_name').text() || $html.find('meta[property="og:title"]').attr("content") || "";
        var orgName = $html.find('.org_title').text();
        if (orgName) lname += " (" + orgName.trim() + ")";

        ldes = $html.find('.entry-content').text() || $html.find('.video-item-info').text() || "";
        
        var yearTxt = $html.find('a[href*="release"]').text();
        if(yearTxt) year = parseInt(yearTxt);

        status = $html.find('.status').text() || $html.find('.new-ep').text() || "Hoàn tất";
        
        var categoriesArr = [];
        $html.find('a[rel="category tag"]').each(function() {
            categoriesArr.push(_$(this).text().trim());
        });
        category = categoriesArr.join(", ");

        // Parse ID phim để tạo link lấy Stream
        var postIdMatch = html.match(/post_id["']?\s*:\s*["']?(\d+)["']?/i) || html.match(/data-post-id=["'](\d+)["']/i);
        var postId = postIdMatch ? postIdMatch[1] : "";

        // Parse Server & Episodes
        var serverMap = {};
        $html.find('.halim-ajax-list-server span[data-subsv-id]').each(function() {
            var subId = _$(this).attr("data-subsv-id");
            var name = _$(this).text().trim();
            serverMap[subId] = name;
        });

        $html.find('.halim-list-eps').each(function() {
            var $ul = _$(this);
            var ulId = $ul.attr("id") || "";
            var svId = ulId.replace("listsv-", "");
            var serverName = serverMap[svId] || "Server " + (servers.length + 1);
            
            var episodes = [];
            $ul.find('li a').each(function() {
                var $a = _$(this);
                var epUrl = $a.attr("href");
                var epDisplay = $a.find("span").text() || $a.text();
                
                // Trích xuất slug của tập phim từ href
                var epSlugMatch = epUrl.match(/\/([^\/.]+)\.html/);
                var epSlugRaw = epSlugMatch ? epSlugMatch[1] : epUrl.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
                var epSlug = epSlugRaw.replace(/-sv\d+$/, "");

                // TẠO URL trực tiếp cho player.php để chuyển thẳng cho parseDetailResponse
                var directApiUrl = BASEURL + "/wp-content/themes/halimmovies/player.php?episode_slug=" + epSlug + "&server_id=" + svId + "&subsv_id=&post_id=" + postId;

                episodes.push({
                    id: directApiUrl, // Chuyền API URL trực tiếp làm ID
                    name: "Tập " + epDisplay.trim(),
                    slug: epUrl
                });
            });

            if (episodes.length > 0) {
                episodes.reverse(); // Đảo tập 1 lên đầu
                servers.push({
                    name: serverName,
                    episodes: episodes
                });
            }
        });

        // Fallback nếu không parse được server block
        if (servers.length === 0) {
            $html.find('.halim-server').each(function() {
                var svName = _$(this).find('.halim-server-name').text().trim() || "Server VIP";
                var episodes = [];
                _$(this).find('li a').each(function() {
                     episodes.push({
                         id: _$(this).attr('href'), 
                         name: _$(this).text().trim(),
                         slug: _$(this).attr('href')
                     });
                });
                if(episodes.length > 0) {
                    episodes.reverse();
                    servers.push({ name: svName, episodes: episodes });
                }
            });
        }

        return JSON.stringify({
            id: url,
            title: lname.trim(),
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes.trim(),
            servers: servers,
            quality: "HD",
            year: year,
            status: status.trim(),
            duration: duration,
            category: category,
            lang: "Vietsub"
        });

    } catch (e) {
        return JSON.stringify({
            id: lurl,
            title: "Lỗi parser detail: " + e,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            servers: servers,
            quality: "HD"
        });
    }
}

function parseDetailResponse(html, url) {
    try {
        var streamUrl = "";
        
        // Cố gắng lấy JSON từ file player.php
        var jsonMatch = html.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                var json = JSON.parse(jsonMatch[0]);
                if (json.file) streamUrl = json.file;
                else if (json.url) streamUrl = json.url;
                else if (json.data && json.data.sources) {
                    var sources = json.data.sources;
                    var iframeM = sources.match(/<iframe[^>]+src=["']([^"']+)["']/i);
                    if (iframeM) streamUrl = iframeM[1];
                    else {
                        var linkM = sources.match(/(https?:\/\/[^"'\s]+)/i);
                        if (linkM) streamUrl = linkM[1];
                    }
                }
            } catch(e) {}
        }

        // Nếu không có JSON, thử tìm iframe trực tiếp
        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+(?:src|data-src)=["']([^"']+)["']/i);
            if (iframeMatch) streamUrl = iframeMatch[1];
        }

        // Clean URL
        if(streamUrl) {
            streamUrl = streamUrl.replace(/\\\/|\\\\/g, "/").replace(/&amp;/g, "&");
            if (streamUrl.indexOf("//") === 0) streamUrl = "https:" + streamUrl;
        }

        // Nếu stream là blob hoặc m3u8 trực tiếp
        if (streamUrl && streamUrl.indexOf("blob:") === -1 && (streamUrl.indexOf('.m3u8') > -1 || streamUrl.indexOf('.mp4') > -1)) {
             return JSON.stringify({
                "url": streamUrl,
                "isEmbed": false,
                "headers": {
                    "Referer": BASEURL,
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                "subtitles": []
            });
        }

        // Mặc định ném qua cho parseEmbedResponse xử lý kèm Javascript Custom
        return JSON.stringify({
            "url": streamUrl || url,
            "isEmbed": true,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            },
            "subtitles": []
        });

    } catch (e) {
        return JSON.stringify({
            "url": url,
            "isEmbed": true,
            "headers": { "Referer": BASEURL }
        });
    }
}

function parseEmbedResponse(html, url) {
    try {
        if (url.toLowerCase().includes(".m3u8") || url.toLowerCase().includes(".mp4")) {
            return JSON.stringify({
                "url": url,
                "isEmbed": false,
                "mimeType": url.toLowerCase().includes(".m3u8") ? "application/x-mpegURL" : "video/mp4",
                "headers": {
                    "Referer": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                },
                "subtitles": []
            });
        } else {
            var streamUrl = url;
            var checkepi = "Tập đang phát";
            var typevideo = "true";
            
            // Tích hợp TextJS Custom Player của concept
            var customJs = textJS(typevideo, checkepi, url, streamUrl);
            
            return JSON.stringify({
                "url": streamUrl,
                "headers": {
                    "Referer": BASEURL,
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
                    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                    "Sec-Ch-Ua-Mobile": "?1",
                    "Sec-Ch-Ua-Platform": '"Android"',
                    "Accept": "*/*",
                    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
                    "X-Requested-With": "com.android.chrome",
                    "Custom-Js": customJs.trim()
                },
                "subtitles": []
            });
        }
    } catch (e) {
        log(e);
        return JSON.stringify({ url: url, headers: { "Referer": BASEURL } });
    }
}

function sortEpisodesByName(data) {
    data.forEach(server => {
        if (server.episodes && Array.isArray(server.episodes)) {
            server.episodes.sort((a, b) => {
                const matchA = a.name.match(/Tập\s*(\d+)/i);
                const matchB = b.name.match(/Tập\s*(\d+)/i);
                const numA = matchA ? parseInt(matchA[1], 10) : 0;
                const numB = matchB ? parseInt(matchB[1], 10) : 0;
                return numA - numB;
            });
        }
    });
    return data;
}

// =============================================================================
// CUSTOM JS PLAYER SCRIPT (TỪ CONCEPT FILE CỦA BẠN)
// =============================================================================
function textJS($links, checkepi, url, stream) {
    return `
LINKVIDEO = ${JSON.stringify($links)};
CHECKEPI = ${JSON.stringify(checkepi)};
URLPAGE = ${JSON.stringify(url)};
STREMLINL = ${JSON.stringify(stream)};
SCRIPTURL = "https://script.google.com/macros/s/AKfycbwsvLFzWMdxvX9ZH-3wnP3GJzS58v0CtT_0mlEYeOz6cOsgen9IR3c6VPv_EssPXMFzwQ/exec?name=hh3d&type=js";  
const style = document.createElement('style');
var customcss = 'body { background: black; overflow: hidden; }body * {background: black}';
style.innerHTML = customcss;
document.head.appendChild(style);

/* Build Video Begin*/

    var DEVELOPE = false;
// ─── HÀM TOAST ĐƯỢC ĐƯA RA NGOÀI (Có thể gọi ở mọi nơi) ───
globalThis.toastScrollQueue = globalThis.toastScrollQueue || [];
globalThis.isToastScrollRunning = globalThis.isToastScrollRunning || false;
globalThis.showToast = function(message, duration, check, scroll) {
        if (typeof duration === 'undefined') duration = 7000;
        if (typeof check === 'undefined') check = true;
        if (typeof scroll === 'undefined') scroll = false;
        if (check === false) return;
        
        if (scroll) {
            globalThis.toastScrollQueue.push({ message, duration });
            function processScrollQueue() {
                if (globalThis.isToastScrollRunning || globalThis.toastScrollQueue.length === 0) return;
                globalThis.isToastScrollRunning = true;
                var current = globalThis.toastScrollQueue.shift();
                var topContainer = document.getElementById('global-toast-top-container');
                if (!topContainer) {
                    topContainer = document.createElement('div');
                    topContainer.id = 'global-toast-top-container';
                    topContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:9999999;background:rgba(0,0,0,0.75);color:#fff;font-family:sans-serif;font-size:13px;padding:6px 15px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;min-height:28px;box-shadow:0 2px 10px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.3s ease;';
                    document.body.appendChild(topContainer);
                }
                topContainer.innerHTML = '';
                topContainer.style.opacity = '1';
                var textEl = document.createElement('span');
                textEl.style.cssText = 'white-space:nowrap;border-right:2px solid transparent;letter-spacing:0.5px;';
                topContainer.appendChild(textEl);
                var fullText = current.message;
                var charIndex = 0;
                var typingTimer;
                function typeWriter() {
                    if (charIndex < fullText.length) {
                        textEl.innerHTML += fullText.charAt(charIndex);
                        charIndex++;
                        typingTimer = setTimeout(typeWriter, 40);
                    } else {
                        setTimeout(function() {
                            topContainer.style.opacity = '0';
                            setTimeout(function() {
                                topContainer.remove();
                                globalThis.isToastScrollRunning = false;
                                processScrollQueue();
                            }, 300);
                        }, 10000);
                    }
                }
                typeWriter();
            }
            processScrollQueue();
            return;
        }
        
        var container = document.getElementById('global-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'global-toast-container';
            container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999999;display:flex;flex-direction:column;gap:10px;';
            document.body.appendChild(container);
        }
        var toastEl = document.createElement('div');
        toastEl.innerHTML = message;
        toastEl.style.cssText = 'background:rgba(50,50,50,0.95);color:#fff;padding:12px 24px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.2);font-family:sans-serif;font-size:14px;min-width:200px;transition:all 0.3s ease;transform:translateX(120%);opacity:0;';
        container.appendChild(toastEl);
        setTimeout(function() {
            toastEl.style.transform = 'translateX(0)';
            toastEl.style.opacity = '1';
        }, 10);
        setTimeout(function() {
            toastEl.style.transform = 'translateX(120%)';
            toastEl.style.opacity = '0';
            setTimeout(function() {
                toastEl.remove();
                if (container.childElementCount === 0) container.remove();
            }, 300);
        }, duration);
};
function runVideo(){
    'use strict';
    var DEVELOPE = false;
    
    function GetlinkVideo() {
        var originalVideo = document.querySelector('video');
        if (!originalVideo) {
            console.log("❌ Không tìm thấy thẻ video gốc trên trang!");
            return;
        }

        var highestId = window.setTimeout(function() {
            for (var i = highestId; i >= 0; i--) {
                window.clearInterval(i);
                window.clearTimeout(i);
            }
        }, 0);

        var playlist = scanSources();
        var stream1 = originalVideo.src || '';
        var stream2 = window.location.href;
        
        showToast("Đang khởi chạy trình phát tốt hơn.", 5000, true, true);
        buildVideoWithOriginal(originalVideo, stream1, stream2, playlist);
    }

    function scanSources() {
        var activeSrc = '';
        var servers = [];
        var episodes = [];
        var seen = new Set();
        var els = document.querySelectorAll('[class*="video"], [class*="player"], video, iframe');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var src = el.src || el.getAttribute('data-src') || '';
            if (!src) {
                var s = el.querySelector('source');
                if (s) src = s.src || s.getAttribute('src') || '';
            }
            if (src && (src.indexOf('.mp4') > -1 || src.indexOf('.m3u8') > -1 || src.indexOf('embed') > -1)) {
                if (!activeSrc) activeSrc = src;
                if (!seen.has(src)) {
                    seen.add(src);
                    var lbl = 'Server ' + (servers.length + 1);
                    if (src.indexOf('embed') > -1) lbl = 'Nhúng ' + (servers.length + 1);
                    servers.push({ label: lbl, src: src, type: 'server' });
                }
            }
        }
        var allLinks = document.querySelectorAll('a, button, [role="button"], [data-link]');
        for (var k = 0; k < allLinks.length; k++) {
            var el2 = allLinks[k];
            var href = el2.href || el2.getAttribute('href') || el2.getAttribute('data-src') || el2.getAttribute('data-link') || '';
            var txt = (el2.textContent || el2.innerText || '').trim();
            if (!href || href === '#' || href === window.location.href || seen.has(href)) continue;
            if (/(server|sv|nguồn|source|embed|link)/i.test(txt + ' ' + el2.className)) {
                if (href.indexOf('.mp4') > -1 || href.indexOf('.m3u8') > -1 || href.indexOf('embed') > -1) {
                    seen.add(href);
                    servers.push({ label: txt || 'Server ' + (servers.length + 1), src: href, type: 'server' });
                }
            }
        }
        var aTags = document.querySelectorAll('a');
        for (var j = 0; j < aTags.length; j++) {
            var a = aTags[j];
            var aHref = a.href || a.getAttribute('href');
            var aTxt = (a.textContent || a.innerText || '').trim();
            if (!aHref || aHref === '#' || aHref === window.location.href) continue;
            var isEpisode = false;
            if (/(tập|tap|ep|episode|chap|part)\s*(\d+|[ivx]+)/i.test(aTxt)) isEpisode = true;
            if (/(tập|tap|ep|episode|chap|part)[-\s]?(\d+|[ivx]+)/i.test(aHref)) isEpisode = true;
            if (a.className && /(^|\s)(ep|episode|tap|chapter|part|tapphim)(\d+|$)/i.test(a.className)) isEpisode = true;
            if (isEpisode) {
                episodes.push({ label: aTxt || 'Tập ' + (episodes.length + 1), src: aHref, type: 'episode' });
            }
        }
        return { activeSrc: activeSrc, servers: servers, episodes: episodes };
    }

    // GHI CHÚ: Hàm toast đã được declare toàn cục ở trên nên không cần lặp lại ở đây.
    
    function buildVideoWithOriginal(video, stream1, stream2, playlistData) {
        video.id = 'main-video';
        video.style.cssText = 'width:100%;height:100%;object-fit:contain;cursor:pointer;background:#000;outline:none;border:none;box-shadow:none;';
        video.controls = false;
        
        var container = document.createElement('div');
        container.id = 'custom-video-player';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999999;font-family:Segoe UI,Roboto,sans-serif;user-select:none;-webkit-user-select:none;outline:none;border:none;box-shadow:none;';

        var spinner = document.createElement('div');
        spinner.id = 'video-spinner';
        spinner.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border:4px solid rgba(255,255,255,0.3);border-top:4px solid #fff;border-radius:50%;animation:spin 1s linear infinite;z-index:10;pointer-events:none;display:none;';
        var spinStyle = document.createElement('style');
        spinStyle.textContent = '@keyframes spin{0%{transform:translate(-50%,-50%) rotate(0deg);}100%{transform:translate(-50%,-50%) rotate(360deg);}}';
        document.head.appendChild(spinStyle);

        var controls = document.createElement('div');
        controls.id = 'video-controls';
        controls.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;background:linear-gradient(transparent,rgba(0,0,0,0.85));padding:12px 16px 20px;box-sizing:border-box;transition:opacity 0.3s;opacity:0;z-index:20;';
        var progressWrap = document.createElement('div');
        progressWrap.style.cssText = 'width:100%;height:6px;background:rgba(255,255,255,0.3);border-radius:3px;cursor:pointer;position:relative;margin-bottom:12px;';
        var progressBar = document.createElement('div');
        progressBar.style.cssText = 'height:100%;background:#e74c3c;width:0%;border-radius:3px;position:relative;pointer-events:none;';
        var progressHandle = document.createElement('div');
        progressHandle.style.cssText = 'position:absolute;right:-6px;top:-4px;width:14px;height:14px;background:#e74c3c;border-radius:50%;opacity:0;transition:opacity 0.2s;pointer-events:none;';
        progressBar.appendChild(progressHandle);
        progressWrap.appendChild(progressBar);
        
        progressWrap.onmouseenter = function() { progressHandle.style.opacity = '1'; };
        progressWrap.onmouseleave = function() { progressHandle.style.opacity = '0'; };
        
        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;align-items:center;gap:12px;';

        var btnPlay = createBtn('⏸', 'Phát / Tạm dừng');
        var btnMute = createBtn('🔊', 'Tắt / Bật âm lượng');
        var timeDisplay = document.createElement('span');
        timeDisplay.style.cssText = 'color:#fff;font-size:13px;min-width:100px;';
        timeDisplay.textContent = '0:00 / 0:00';
        var btnReload = createBtn('🔄', 'Tải lại nguồn video');
        var spacer = document.createElement('div');
        spacer.style.cssText = 'flex:1;';
        var speedIndicator = document.createElement('span');
        speedIndicator.style.cssText = 'color:#fff;font-size:12px;opacity:0.8;';
        speedIndicator.textContent = '1.0x';
        var btnFullscreen = createBtn('⛶', 'Toàn màn hình');
        var btnPlaylist = createBtn('☰', 'Danh sách phát / Server');

        btnRow.appendChild(btnPlay);
        btnRow.appendChild(btnMute);
        btnRow.appendChild(timeDisplay);
        btnRow.appendChild(spacer);
        btnRow.appendChild(speedIndicator);
        btnRow.appendChild(btnReload);
        btnRow.appendChild(btnFullscreen);

        controls.appendChild(progressWrap);
        controls.appendChild(btnRow);
        
        var bigPlayBtn = document.createElement('div');
        bigPlayBtn.id = 'big-play-btn';
        bigPlayBtn.textContent = '▶';
        bigPlayBtn.style.cssText = 'text-indent:10px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:80px;background:rgba(0,0,0,0.6);border-radius:50%;display:none;align-items:center;justify-content:center;color:#fff;font-size:36px;cursor:pointer;z-index:15;';

        var seekOverlay = document.createElement('div');
        seekOverlay.id = 'seek-overlay';
        seekOverlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.7);color:#fff;padding:12px 24px;border-radius:8px;font-size:18px;font-weight:bold;pointer-events:none;opacity:0;transition:opacity 0.3s;z-index:30;';
        
        var playlistPanel = document.createElement('div');
        playlistPanel.id = 'playlist-panel';
        playlistPanel.style.cssText = 'position:fixed;top:0;right:0;width:300px;max-width:80%;height:100%;background:rgba(15,15,15,0.97);z-index:40;transform:translateX(100%);transition:transform 0.25s ease;overflow-y:auto;padding:20px;box-sizing:border-box;color:#fff;font-family:Segoe UI,Roboto,sans-serif;';
        var plHeader = document.createElement('div');
        plHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.2);';
        plHeader.innerHTML = '<span style="font-size:16px;font-weight:bold;">📋 Playlist</span>';
        var plClose = document.createElement('button');
        plClose.textContent = '✕';
        plClose.style.cssText = 'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;';
        plClose.onclick = function(e) { if (e) e.stopPropagation(); playlistPanel.style.transform = 'translateX(100%)'; };
        plHeader.appendChild(plClose);
        playlistPanel.appendChild(plHeader);

        var plContent = document.createElement('div');
        plContent.id = 'playlist-content';
        playlistPanel.appendChild(plContent);
        
        var playlistState = {
            servers: (playlistData && playlistData.servers) ? playlistData.servers.slice() : [],
            episodes: (playlistData && playlistData.episodes) ? playlistData.episodes.slice() : []
        };
        
        function buildSection(title, items, onClick, parent) {
            if (!items || items.length === 0) return;
            var sec = document.createElement('div');
            sec.style.cssText = 'margin-bottom:20px;';
            var secTitle = document.createElement('div');
            secTitle.textContent = title;
            secTitle.style.cssText = 'font-size:13px;text-transform:uppercase;opacity:0.6;margin-bottom:10px;';
            sec.appendChild(secTitle);
            for (var i = 0; i < items.length; i++) {
                (function(item) {
                    var btn = document.createElement('button');
                    btn.textContent = item.label;
                    btn.style.cssText = 'display:block;width:100%;text-align:left;padding:10px 12px;margin-bottom:6px;background:rgba(255,255,255,0.08);border:none;border-radius:6px;color:#fff;font-size:14px;cursor:pointer;transition:background 0.2s;';
                    btn.onmouseenter = function() { btn.style.background = 'rgba(231,76,60,0.3)'; };
                    btn.onmouseleave = function() { btn.style.background = 'rgba(255,255,255,0.08)'; };
                    btn.onclick = function(e) { if (e) e.stopPropagation(); onClick(item); };
                    sec.appendChild(btn);
                })(items[i]);
            }
            parent.appendChild(sec);
        }

        function renderPlaylist() {
            plContent.innerHTML = '';
            var hasAny = false;
            if (playlistState.servers.length > 1) {
                buildSection('🎥 Chuyển Server', playlistState.servers, function(item) { switchSource(item.src); }, plContent);
                hasAny = true;
            }
            if (playlistState.episodes.length > 0) {
                buildSection('📁 Tập phim', playlistState.episodes, function(item) { savePosition(); window.location.href = item.src; }, plContent);
                hasAny = true;
            }
            if (hasAny) {
                if (!btnPlaylist.parentNode) btnRow.appendChild(btnPlaylist);
                if (!playlistPanel.parentNode) container.appendChild(playlistPanel);
            } else {
                if (btnPlaylist.parentNode) btnPlaylist.parentNode.removeChild(btnPlaylist);
            }
        }

        container.appendChild(video);
        container.appendChild(spinner);
        container.appendChild(bigPlayBtn);
        container.appendChild(seekOverlay);
        container.appendChild(controls);
        container.appendChild(playlistPanel);

        var htmlTAG = document.getElementsByTagName("html")[0];
        htmlTAG.innerHTML = '';
        document.body = document.createElement('body');
        document.body.appendChild(container);
        document.head.innerHTML = '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">';
        document.head.appendChild(spinStyle);
        document.title = 'Dẹp hết quảng cáo rồi nha bạn.';

        var isPlaying = false;
        var isMuted = false;
        var currentSpeed = 1.0;
        var controlsTimeout = null;
        var isDraggingProgress = false;
        var isDraggingVideo = false;
        var lastSaveTime = 0;

        function generateVideoKey() {
            if (!video || !video.duration || isNaN(video.duration)) return null;
            var totalSeconds = Math.floor(video.duration);
            var hours = Math.floor(totalSeconds / 3600);
            var minutes = Math.floor((totalSeconds % 3600) / 60);
            var seconds = totalSeconds % 60;
            var pad = function(num) { return num < 10 ? '0' + num : num; };
            return 'VIDEO_' + pad(hours) + '_' + pad(minutes) + '_' + pad(seconds);
        }
        
        function savePosition() {
            if (!video || video.ended || !video.currentTime || isNaN(video.currentTime)) return;
            var saveKey = generateVideoKey();
            if (!saveKey) return;
            var now = Date.now();
            if (now - lastSaveTime < 4000) return;
            lastSaveTime = now;
            try {
                if (video.currentTime > 5 && (video.currentTime < video.duration - 5)) {
                    localStorage.setItem(saveKey, JSON.stringify({ time: video.currentTime, duration: video.duration, savedAt: now }));
                }
            } catch (e) {}
        }
        
        function clearSavedPosition() {
            try {
                var saveKey = generateVideoKey();
                if (saveKey) localStorage.removeItem(saveKey);
            } catch (e) {}
        }
        
        function restorePosition() {
            try {
                var saveKey = generateVideoKey();
                if (!saveKey) return false;
                var saved = localStorage.getItem(saveKey);
                if (saved) {
                    var data = JSON.parse(saved);
                    if (data && data.time && data.time > 5) {
                        if (data.time >= video.duration - 5) return false;
                        video.currentTime = data.time;
                        showToast('⏩ Đã tiếp tục phát từ ' + formatTime(data.time), 4000, true);
                        return true;
                    }
                }
            } catch (e) {}
            return false;
        }

        function switchSource(newSrc) {
            var wasPlaying = !video.paused;
            var prevTime = video.currentTime;
            stream1 = newSrc;
            video.src = newSrc;
            video.load();
            spinner.style.display = 'block';
            video.onloadeddata = function() {
                spinner.style.display = 'none';
                if (!restorePosition() && prevTime > 0) video.currentTime = prevTime;
                if (wasPlaying) video.play();
                showToast('Đã chuyển nguồn phát');
            };
            video.onerror = function() {
                spinner.style.display = 'none';
                showToast('Không thể phát nguồn này!');
            };
            playlistPanel.style.transform = 'translateX(100%)';
        }

        function createBtn(icon, title) {
            var btn = document.createElement('button');
            btn.textContent = icon;
            btn.title = title;
            btn.style.cssText = 'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;padding:4px 8px;border-radius:4px;transition:background 0.2s;outline:none;';
            btn.onmouseenter = function() { btn.style.background = 'rgba(255,255,255,0.2)'; };
            btn.onmouseleave = function() { btn.style.background = 'none'; };
            return btn;
        }

        function showSeekOverlay(text) {
            seekOverlay.textContent = text;
            seekOverlay.style.opacity = '1';
            clearTimeout(seekOverlay._timer);
            seekOverlay._timer = setTimeout(function() { seekOverlay.style.opacity = '0'; }, 800);
        }

        function formatTime(sec) {
            if (!sec || isNaN(sec)) return '0:00';
            var m = Math.floor(sec / 60);
            var s = Math.floor(sec % 60);
            return m + ':' + (s < 10 ? '0' + s : s);
        }

        function updateProgress() {
            if (video.duration && !isNaN(video.duration) && !isDraggingProgress) {
                var pct = (video.currentTime / video.duration) * 100;
                progressBar.style.width = pct + '%';
            }
            timeDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
        }

        function seekVideo(seconds) {
            var newTime = video.currentTime + seconds;
            if (newTime < 0) newTime = 0;
            if (video.duration && !isNaN(video.duration) && newTime > video.duration) newTime = video.duration;
            video.currentTime = newTime;
            showSeekOverlay((seconds > 0 ? '+' : '') + seconds + 's');
        }

        function togglePlay() {
            if (video.paused) {
                video.play().then(function() {
                    isPlaying = true; btnPlay.textContent = '⏸'; bigPlayBtn.style.display = 'none'; spinner.style.display = 'none';
                }).catch(function(e) {
                    video.muted = true;
                    video.play().then(function() { isMuted = true; btnMute.textContent = '🔇'; isPlaying = true; btnPlay.textContent = '⏸'; bigPlayBtn.style.display = 'none'; spinner.style.display = 'none'; });
                });
            } else {
                video.pause(); isPlaying = false; btnPlay.textContent = '▶'; bigPlayBtn.style.display = 'flex';
            }
        }

        function toggleMute() {
            video.muted = !video.muted;
            isMuted = video.muted;
            btnMute.textContent = isMuted ? '🔇' : '🔊';
            showToast(isMuted ? 'Đã tắt tiếng' : 'Đã bật tiếng');
        }

        function reloadVideo() {
            spinner.style.display = 'block';
            var currentTime = video.currentTime;
            var wasPlaying = !video.paused;
            video.src = stream1 + (stream1.indexOf('?') > -1 ? '&' : '?') + '_reload=' + Date.now();
            video.load();
            video.onloadeddata = function() {
                spinner.style.display = 'none';
                video.currentTime = currentTime;
                restorePosition();
                if (wasPlaying) video.play();
                showToast('Đã tải lại nguồn video');
            };
            video.onerror = function() {
                spinner.style.display = 'none';
                if (stream2 && stream2 !== stream1) {
                    showToast('Nguồn 1 lỗi, thử nguồn dự phòng...');
                    stream1 = stream2;
                    video.src = stream1;
                    video.load();
                } else {
                    showToast('Lỗi tải video! Kiểm tra nguồn.');
                }
            };
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) container.requestFullscreen().catch(function() {});
            else document.exitFullscreen().catch(function() {});
        }

        function showControls() {
            controls.style.opacity = '1';
            clearTimeout(controlsTimeout);
            controlsTimeout = setTimeout(function() { if (!isDraggingProgress) controls.style.opacity = '0'; }, 3000);
        }

        video.addEventListener('loadeddata', function() {
            spinner.style.display = 'none';
            updateProgress();
            if (isMuted && video.muted) { video.muted = false; isMuted = false; btnMute.textContent = '🔊'; }
            restorePosition();
        });
        video.addEventListener('loadedmetadata', function() { restorePosition(); });
        video.addEventListener('waiting', function() { spinner.style.display = 'block'; });
        video.addEventListener('playing', function() { spinner.style.display = 'none'; bigPlayBtn.style.display = 'none'; });
        video.addEventListener('error', function() { spinner.style.display = 'none'; showToast('Lỗi phát hoặc quảng cáo đang chặn luồng. Nhấn 🔄 để tải lại.'); btnPlay.textContent = '▶'; bigPlayBtn.style.display = 'flex'; });
        video.addEventListener('timeupdate', function() { updateProgress(); savePosition(); });
        video.addEventListener('ended', function() { btnPlay.textContent = '▶'; bigPlayBtn.style.display = 'flex'; isPlaying = false; clearSavedPosition(); });
        
        video.addEventListener('click', function(e) {
			    e.stopPropagation();
			    if (isDraggingVideo) { isDraggingVideo = false; return; }
			    var width = window.innerWidth;
			    var x = e.clientX;
			    if (x < width * 0.3) seekVideo(-10);
			    else if (x > width * 0.7) seekVideo(10);
			    else togglePlay();
			});

        video.addEventListener('volumechange', function() { btnMute.textContent = video.muted || video.volume === 0 ? '🔇' : '🔊'; });
        btnPlay.addEventListener('click', function(e) { e.stopPropagation(); togglePlay(); });
        btnMute.addEventListener('click', function(e) { e.stopPropagation(); toggleMute(); });
        btnReload.addEventListener('click', function(e) { e.stopPropagation(); reloadVideo(); });
        btnFullscreen.addEventListener('click', function(e) { e.stopPropagation(); toggleFullscreen(); });
        btnPlaylist.addEventListener('click', function(e) { e.stopPropagation(); playlistPanel.style.transform = 'translateX(0)'; });
        
        progressWrap.addEventListener('click', function(e) {
            e.stopPropagation();
            var rect = progressWrap.getBoundingClientRect();
            var pct = (e.clientX - rect.left) / rect.width;
            if (video.duration && !isNaN(video.duration)) video.currentTime = pct * video.duration;
            updateProgress();
        });
        progressWrap.addEventListener('mousedown', function(e) { isDraggingProgress = true; showControls(); });
        document.addEventListener('mousemove', function(e) {
            if (isDraggingProgress && video.duration && !isNaN(video.duration)) {
                var rect = progressWrap.getBoundingClientRect();
                var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                progressBar.style.width = (pct * 100) + '%';
                video.currentTime = pct * video.duration;
                updateProgress();
            }
        });
        document.addEventListener('mouseup', function() { isDraggingProgress = false; });
        container.addEventListener('mousemove', showControls);
        container.addEventListener('click', showControls);
        bigPlayBtn.addEventListener('click', function(e) { e.stopPropagation(); togglePlay(); });

        document.addEventListener('keydown', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            showControls();
            switch (e.key) {
                case 'ArrowLeft': e.preventDefault(); e.shiftKey ? seekVideo(-30) : (e.ctrlKey || e.altKey) ? seekVideo(-5) : seekVideo(-10); break;
                case 'ArrowRight': e.preventDefault(); e.shiftKey ? seekVideo(30) : (e.ctrlKey || e.altKey) ? seekVideo(5) : seekVideo(10); break;
                case ' ': case 'k': case 'K': e.preventDefault(); togglePlay(); break;
                case 'ArrowUp': e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); showToast('Âm lượng: ' + Math.round(video.volume * 100) + '%'); break;
                case 'ArrowDown': e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); showToast('Âm lượng: ' + Math.round(video.volume * 100) + '%'); break;
                case 'm': case 'M': e.preventDefault(); toggleMute(); break;
                case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
                case 'r': case 'R': e.preventDefault(); reloadVideo(); break;
                case 'Home': e.preventDefault(); video.currentTime = 0; showToast('Về đầu video'); break;
                case 'End': e.preventDefault(); if (video.duration && !isNaN(video.duration)) video.currentTime = video.duration - 1; break;
                case '>': case '.': e.preventDefault(); currentSpeed = Math.min(4, currentSpeed + 0.25); video.playbackRate = currentSpeed; speedIndicator.textContent = currentSpeed.toFixed(1) + 'x'; showToast('Tốc độ: ' + currentSpeed.toFixed(1) + 'x'); break;
                case '<': case ',': e.preventDefault(); currentSpeed = Math.max(0.25, currentSpeed - 0.25); video.playbackRate = currentSpeed; speedIndicator.textContent = currentSpeed.toFixed(1) + 'x'; showToast('Tốc độ: ' + currentSpeed.toFixed(1) + 'x'); break;
                case '0': e.preventDefault(); video.currentTime = 0; break;
                case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9': e.preventDefault(); if (video.duration && !isNaN(video.duration)) video.currentTime = video.duration * (parseInt(e.key) / 10); break;
            }
        });

        var touchStartX = 0, touchStartY = 0, isSwiping = false;
        container.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; isSwiping = false; }, { passive: true });
        container.addEventListener('touchmove', function(e) {
            if (e.touches.length !== 1) return;
            var dx = e.touches[0].clientX - touchStartX;
            var dy = e.touches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
                isSwiping = true;
                var seekSec = Math.round(dx / 15);
                if (Math.abs(seekSec) >= 1) { seekVideo(seekSec); touchStartX = e.touches[0].clientX; }
            }
            if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 20) {
                isSwiping = true;
                if (touchStartX > window.innerWidth / 2) {
                    var volChange = -dy / 200;
                    video.volume = Math.max(0, Math.min(1, video.volume + volChange));
                    showToast('🔊 ' + Math.round(video.volume * 100) + '%');
                    touchStartY = e.touches[0].clientY;
                }
            }
        }, { passive: true });

        var regionStartX = 0, regionOverlay = null;
        video.addEventListener('mousedown', function(e) {
            if (e.button !== 0) return;
            isDraggingVideo = false;
            regionStartX = e.clientX;
            regionOverlay = document.createElement('div');
            regionOverlay.style.cssText = 'position:fixed;top:0;height:100vh;background:rgba(231,76,60,0.3);pointer-events:none;z-index:25;';
            document.body.appendChild(regionOverlay);
        });
        document.addEventListener('mousemove', function(e) {
            if (!regionOverlay) return;
            isDraggingVideo = true;
            var left = Math.min(regionStartX, e.clientX);
            var width = Math.abs(e.clientX - regionStartX);
            regionOverlay.style.left = left + 'px';
            regionOverlay.style.width = width + 'px';
        });
        document.addEventListener('mouseup', function(e) {
            if (!regionOverlay) return;
            var deltaX = e.clientX - regionStartX;
            if (Math.abs(deltaX) > 50 && video.duration && !isNaN(video.duration)) {
                var startPct = Math.min(regionStartX, e.clientX) / window.innerWidth;
                video.currentTime = startPct * video.duration;
                showToast('⏩ Đã tua đến vùng chọn: ' + formatTime(video.currentTime));
                if (video.paused) togglePlay();
            }
            regionOverlay.remove();
            regionOverlay = null;
        });

        if (video.paused) {
            video.play().then(function() {
                isPlaying = true; btnPlay.textContent = '⏸';
                showToast('🎉 Đã bọc Player thành công lên video gốc! Xem phim mượt mà, sạch quảng cáo.', 5000, true, true);
            }).catch(function() {
                video.muted = true; isMuted = true; btnMute.textContent = '🔇';
                video.play();
                showToast('Đã phát tự động (Muted) - Bấm 🔊 hoặc phím M để bật tiếng');
            });
        } else {
            isPlaying = true;
            btnPlay.textContent = '⏸';
            showToast('🎉 Xem vui nhé các bạn.  ', 5000, true, true);
        }

        renderPlaylist();
        showControls();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', GetlinkVideo);
    } else {
        GetlinkVideo();
    }
}

function checkResume() {
	(function initVideoFlow() {
		if (document.querySelector('video')) {
			console.log("🎯 Tìm thấy thẻ video ngay lập tức. Khởi chạy luôn!");
			runVideo();
			return;
		}
		
		console.log("⏳ Chưa thấy video. Bắt đầu quét tìm video hoặc nút resumeBtn mỗi 1 giây...");
		let secondsPassed = 0;
		const maxSeconds = 20;
		const checkInterval = setInterval(function() {
			secondsPassed++;
			const videoElement = document.querySelector('video');
			const skipButton = document.getElementById("resumeBtn");
			
			if (videoElement) {
				clearInterval(checkInterval); 
				console.log("✓ Tìm thấy thẻ video xuất hiện trong vòng lặp! Khởi chạy ngay.");
				runVideo();
				return;
			}
			
			if (skipButton) {
				const style = window.getComputedStyle(skipButton);
				if (style.display !== 'none' && style.visibility !== 'hidden') {
					clearInterval(checkInterval); 
					console.log("🎯 Đã tìm thấy nút resumeBtn hiển thị! Click và đợi 2s...");
					skipButton.click();
					setTimeout(function() { runVideo(); }, 2000);
					return;
				}
			}
			
			if (secondsPassed >= maxSeconds) {
				clearInterval(checkInterval); 
				console.log("⏱ Đã hết 20 giây quét mà không tìm thấy gì.");
				showToast("⚠️ Vui lòng nhấn vào màn hình hoặc nút Xem Tiếp để tiếp tục phát phim!", 20000, true, false);
				runVideo();
			}
		}, 1000); 
	})();
}
setTimeout(checkResume, 1000);

function injectScriptAfterLoad(scriptUrl) {
    function doFetchAndInject() {
        console.log('⏳ Đang tiến hành fetch code từ:', scriptUrl);
        fetch(SCRIPTURL)
            .then(response => {
                if (!response.ok) throw new Error('Mã phản hồi từ Server không tốt: ' + response.status);
                return response.text(); 
            })
            .then(codeText => {
                const scriptElement = document.createElement('script');
                scriptElement.type = 'text/javascript';
                scriptElement.textContent = codeText;
                document.body.appendChild(scriptElement);
				if (CHECKEPI == "true") {
					showToast('Tập phim bạn chọn chưa có hoặc đã lỗi. Đã tự động đưa bạn về tập 1!', 60000, true);
				} else {
					showToast(CHECKEPI, 30000, true,true);
				}
            })
            .catch(error => { console.error('❌ Lỗi không thể fetch hoặc nhúng script:', error); });
    }
    
    if (document.readyState !== 'loading') { doFetchAndInject(); } 
    else { document.addEventListener('DOMContentLoaded', doFetchAndInject); }
}

function initCustomVideoFix() {
    if (SCRIPTURL && SCRIPTURL !== "undefined") {
        injectScriptAfterLoad(SCRIPTURL);
    }
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initCustomVideoFix);
} else {
	initCustomVideoFix();
}
`;
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
