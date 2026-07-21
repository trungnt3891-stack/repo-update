// https://animevietsub.wiki
var BASEURL = "https://animevietsub.wiki";

function getManifest() {
    return JSON.stringify({
        "id": "animevietsub",
        "name": "Nguồn AnimeVietSub",
        "description": "Xem anime Vietsub chất lượng cao.",
        "version": "1.4",
        "BASEURL": "https://animevietsub.wiki",
        "iconUrl": "https://animevietsub.wiki/statics/default/images/logo.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[AnimeVsubCS] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[AnimeVsubCS] " + msg);
    }
}

function getHomeSections() {
    var listurl = `
/anime-moi-cap-nhat@@Anime Mới Cập Nhật@@true
/anime-bo@@Anime Bộ@@false
/anime-le@@Anime Lẻ/Movie@@false
/hoat-hinh-trung-quoc@@HH Trung Quốc@@false
/anime-sap-chieu@@Anime Sắp Chiếu@@false
`;
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify({
        category: menulist
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && (slug.indexOf("http") > -1 || slug.indexOf("tim-kiem") > -1)) {
            return slug;
        }
        let page = 1;
        let path = slug || "";

        if (filtersJson) {
            let fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

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

        if (path.startsWith("/")) path = path.substring(1);
        if (path.endsWith("/")) path = path.substring(0, path.length - 1);

        let resultUrl = BASEURL;
        if (path) {
            if (path === 'anime-moi-cap-nhat' && page === 1) {
                return BASEURL + "/";
            }
            resultUrl += "/" + path;
        }

        if (page > 1) {
            resultUrl += "/trang-" + page + ".html";
        } else if (path) {
            resultUrl += "/";
        }

        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        let fallback = BASEURL + (slug ? "/" + slug : "");
        return fallback.replace(/([^:]\/)\/+/g, "$1");
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEURL + "/tim-kiem/" + encodeURIComponent(keyword.trim()) + "/";
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    var cleanSlug = slug;
    if (cleanSlug.startsWith("/")) cleanSlug = cleanSlug.substring(1);
    if (cleanSlug.startsWith("phim/")) cleanSlug = cleanSlug.substring(5);
    return BASEURL + "/phim/" + cleanSlug;
}

function getUrlCategories() {
    return BASEURL;
}

function getUrlCountries() {
    return "";
}

function getUrlYears() {
    return "";
}

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html, $url) {
    try {
        var items = [];
        var seen = {};

        _$(html).find(".TPost").each(function () {
            var href = _$(this).find("a").attr("href");
            var title = _$(this).find(".Title").text() || _$(this).find("a").attr("title");
            var src = _$(this).find("img").attr("src") || _$(this).find("img").attr("data-src");
            
            if (src && src.indexOf("http") == -1) {
                src = BASEURL + src;
            }

            if (href && title) {
                if (href.indexOf("http") == -1) {
                    href = BASEURL + (href.startsWith("/") ? "" : "/") + href;
                }
                
                var slugMatch = /\/phim\/([^/]+)/.exec(href);
                var cleanId = slugMatch ? slugMatch[1] : href;
                if (seen[cleanId]) return;
                seen[cleanId] = true;

                var cleanThumb = src ? src.replace(/&amp;/g, '&') : "";

                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": cleanThumb,
                    "backdropUrl": cleanThumb
                });
            }
        });

        if (items.length === 0) {
            _$(html).find(".MovieList li").each(function () {
                var href = _$(this).find("a").attr("href");
                var title = _$(this).find(".Title").text() || _$(this).find("a").attr("title");
                var src = _$(this).find("img").attr("src") || _$(this).find("img").attr("data-src");

                if (src && src.indexOf("http") == -1) {
                    src = BASEURL + src;
                }

                if (href && title) {
                    if (href.indexOf("http") == -1) {
                        href = BASEURL + (href.startsWith("/") ? "" : "/") + href;
                    }
                    var cleanThumb = src ? src.replace(/&amp;/g, '&') : "";
                    items.push({
                        "id": href,
                        "title": title.trim(),
                        "posterUrl": cleanThumb,
                        "backdropUrl": cleanThumb
                    });
                }
            });
        }

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 999
            }
        });

    } catch (e) {
        return JSON.stringify({
            "items": [{
                "id": $url || BASEURL,
                "title": "Lỗi: " + e,
                "posterUrl": "",
                "backdropUrl": ""
            }],
            "pagination": {
                "currentPage": 1,
                "totalPages": 1
            }
        });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function formatEpisode(numStr) {
    var num = parseInt(numStr, 10);
    if (isNaN(num)) return "01";
    return num < 10 ? "0" + num : "" + num;
}

function parseMovieDetail(html, url) {
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var year = 2026;
    var status = "????";
    var duration = "????";
    var cast = "????";
    var direc = "????";
    var country = "";
    var category = "";
    var lang = "Vietsub";
    var servers = [];

    try {
        limg = _$(html).find('meta[property="og:image"]').attr("content");
        if (limg && limg.indexOf("http") == -1) {
            limg = BASEURL + limg;
        }
        lname = _$(html).find('meta[property="og:title"]').attr("content") || _$(html).find('h1.title').text();
        ldes = _$(html).find('.Description').text() || _$(html).find('#film-info-desc').text();
        
        var yearMatch = html.match(/Năm phát hành:[\s\S]*?>(\d{4})</i);
        if (yearMatch) year = Number(yearMatch[1]);

        var statusBlock = _$(html).find('span:content("Trạng thái:")').parent().text();
        if (statusBlock) status = statusBlock.replace(/Trạng thái:/g, "").trim();

        var countryBlock = _$(html).find('span:content("Quốc gia:")').parent().text();
        if (countryBlock) country = countryBlock.replace(/Quốc gia:/g, "").replace(/<[^>]*>/g, "").trim();

        var genreBlock = _$(html).find('span:content("Thể loại:")').parent().text();
        if (genreBlock) category = genreBlock.replace(/Thể loại:/g, "").replace(/<[^>]*>/g, "").trim();

        var episodes = [];
        var addedEps = {};
        
        var epPattern = /<a\s+[^>]*href="([^"]*(?:\/tap-[^"]+|\/xem-phim\.html))"[^>]*>([\s\S]*?)<\/a>/gi;
        var epMatch;
        while ((epMatch = epPattern.exec(html)) !== null) {
            var epUrl = epMatch[1];
            var epName = epMatch[2].replace(/<[^>]*>/g, "").trim();
            if (!epName) epName = "Full";

            if (epUrl.indexOf('http') !== 0) {
                epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;
            }

            if (!addedEps[epUrl]) {
                addedEps[epUrl] = true;
                if (/^\d+(\.\d+)?$/.test(epName)) {
                    epName = "Tập " + epName;
                }
                episodes.push({
                    id: epUrl,
                    name: epName,
                    slug: epUrl
                });
            }
        }

        if (episodes.length === 0) {
            var slugMatch = /\/phim\/([^/]+)/.exec(url);
            var filmSlug = slugMatch ? slugMatch[1] : "";
            if (filmSlug) {
                var playUrl = BASEURL + "/phim/" + filmSlug + "/xem-phim.html";
                episodes.push({
                    id: playUrl,
                    name: "Xem Phim",
                    slug: playUrl
                });
            }
        }

        servers.push({
            name: "AnimeVietSub",
            episodes: episodes
        });

        return JSON.stringify({
            id: url,
            title: lname,
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            servers: servers,
            quality: "HD",
            year: year,
            status: status,
            duration: duration,
            casts: cast,
            director: direc,
            country: country,
            category: category,
            lang: lang
        });

    } catch (e) {
        return JSON.stringify({
            id: url,
            title: "Lỗi phân tích chi tiết phim",
            posterUrl: limg,
            backdropUrl: limg,
            description: ldes,
            servers: servers,
            quality: "HD",
            year: year,
            status: status,
            duration: duration,
            casts: cast,
            director: direc
        });
    }
}

function parseDetailResponse(html, url) {
    try {
        var link = "";
        var match = /window\.PLAYER_DATA\s*=\s*(\{.*?\});/s.exec(html);
        if (match) {
            try {
                var data = JSON.parse(match[1]);
                if (data && data.link) link = data.link;
            } catch (err) {}
        }
        
        if (!link) {
            var iframeMatch = html.match(/<iframe[^>]*src="([^"]+)"/i);
            if (iframeMatch) link = iframeMatch[1];
        }

        if (!link) {
            link = url;
        } else if (link.indexOf('//') === 0) {
            link = "https:" + link;
        }

        return JSON.stringify({
            "url": link,
            "isEmbed": true,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            "subtitles": []
        });

    } catch (e) {
        return JSON.stringify({
            "url": url,
            "isEmbed": true,
            "headers": {
                "Referer": BASEURL
            }
        });
    }
}

function parseEmbedResponse(html, url) {
    try {
        var m3u8Match = /["'](https?:\/\/[^"'\s]*\.m3u8[^"'\s]*?)["']/i.exec(html) ||
                        /(https:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i.exec(html);

        if (m3u8Match) {
            return JSON.stringify({
                "url": m3u8Match[1],
                "isEmbed": false,
                "mimeType": "application/x-mpegURL",
                "headers": {
                    "Referer": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                "subtitles": []
            });
        }

        var streamUrl = url;
        var customJs = textJS("true", "Xem phim", url, streamUrl);

        return JSON.stringify({
            "url": streamUrl,
            "isEmbed": true,
            "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Custom-Js": customJs.trim()
            },
            "subtitles": []
        });

    } catch (e) {
        log(e);
        return JSON.stringify({
            url: url,
            isEmbed: true,
            headers: {
                "Referer": BASEURL
            }
        });
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

function textJS($links, checkepi, url, stream) {
    return `
LINKVIDEO = ${JSON.stringify($links)};
CHECKEPI = ${JSON.stringify(checkepi)};
URLPAGE = ${JSON.stringify(url)};
STREMLINL = ${JSON.stringify(stream)};
SCRIPTURL = ""; 

const style = document.createElement('style');
var customcss = 'body { background: black; overflow: hidden; } body * { background: black; }';
style.innerHTML = customcss;
document.head.appendChild(style);

globalThis.showToast = function(message, duration) {
    if (typeof duration === 'undefined') duration = 4000;
    var container = document.getElementById('global-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'global-toast-container';
        container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }
    var toastEl = document.createElement('div');
    toastEl.innerHTML = message;
    toastEl.style.cssText = 'background:rgba(50,50,50,0.95);color:#fff;padding:12px 24px;border-radius:8px;font-family:sans-serif;font-size:14px;';
    container.appendChild(toastEl);
    setTimeout(function() { toastEl.remove(); }, duration);
};

function runVideo() {
    'use strict';
    var video = document.querySelector('video');
    if (!video) {
        console.log("Không tìm thấy thẻ video gốc!");
        return;
    }

    video.style.cssText = 'width:100%;height:100%;object-fit:contain;background:#000;';
    
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;z-index:999999;';
    
    container.appendChild(video);
    document.body.innerHTML = '';
    document.body.appendChild(container);
    
    video.play().catch(function() {
        video.muted = true;
        video.play();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runVideo);
} else {
    runVideo();
}
`;
}

function checkResume() {
    (function initVideoFlow() {
        if (document.querySelector('video') || document.querySelector('iframe')) {
            runVideo();
            return;
        }
        setTimeout(runVideo, 1500);
    })();
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

function getLISTmenu() {
    return `
/the-loai/hanh-dong@@Hành Động
/the-loai/phieu-luu@@Phiêu Lưu
/the-loai/hoat-hinh@@Hoạt Hình
/the-loai/hai-huoc@@Hài Hước
/the-loai/hinh-su@@Hình Sự
/the-loai/tai-lieu@@Tài Liệu
/the-loai/chinh-kich@@Chính Kịch
/the-loai/gia-dinh@@Gia Đình
/the-loai/gia-tuong@@Giả Tưởng
/the-loai/lich-su@@Lịch Sử
/the-loai/kinh-di@@Kinh Dị
/the-loai/nhac@@Âm Nhạc
/the-loai/bi-an@@Bí Ẩn
/the-loai/lang-man@@Lãng Mạn
/the-loai/khoa-hoc-vien-tuong@@Khoa Học Viễn Tưởng
/the-loai/gay-can@@Gây Cấn
/the-loai/chien-tranh@@Chiến Tranh
/the-loai/tam-ly@@Tâm Lý
/the-loai/vo-thuat@@Võ Thuật
/the-loai/co-trang@@Cổ Trang
/the-loai/hoc-duong@@Học Đường
/the-loai/the-thao@@Thể Thao
/the-loai/kinh-dien@@Kinh Điển
/the-loai/gia-dinh-1@@Trẻ Em
`
}

function buildMenu(listurl) {
    let menulist = [];
    if (!listurl) return menulist;
    let lines = listurl.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.indexOf('@@') === -1) continue;
        let parts = line.split('@@');
        let link = parts[0] ? parts[0].trim() : "";
        let name = parts[1] ? parts[1].trim() : "";
        let check = parts[2] ? parts[2].trim() : undefined;
        if (!link || !name) continue;
        let item = {};
        if (check === "false") {
            item = { "slug": link, "title": name, "type": "Horizontal" };
        } else if (check === "true") {
            item = { "slug": link, "title": name, "type": "Grid" };
        } else {
            item = { "slug": link, "name": name };
        }
        menulist.push(item);
    }
    return menulist;
}

function _$(htmlOrBlock) {
    if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) {
        return htmlOrBlock;
    }
    var instance = {
        sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',
        elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),
        find: function(selector) {
            var results = [];
            var contentFilter = "";
            if (selector.indexOf(":content(")!==-1) {
                var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/);
                if (contentMatch) {
                    contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || "";
                    selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, "");
                }
            }
            var attrNameFilter = "";
            var attrValueFilter = "";
            var hasAttrFilter = false;
            var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/);
            if (attrMatch) {
                hasAttrFilter = true;
                attrNameFilter = attrMatch[1];
                attrValueFilter = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
                selector = selector.replace(/\[.*?\]/, "");
            }
            var notSelector = "";
            if (selector.indexOf(":not(")!==-1) {
                var notMatch = selector.match(/:not\(([^)]+)\)/);
                if (notMatch) {
                    notSelector = notMatch[1];
                    selector = selector.replace(/:not\([^)]+\)/, "");
                }
            }
            var isFirstFilter = selector.indexOf(":first") !== -1;
            var isLastFilter = selector.indexOf(":last") !== -1;
            selector = selector.replace(/:first|:last/g, "");
            var isClass = selector.indexOf('.') === 0;
            var isId = selector.indexOf('#') === 0;
            var isAttrOnly = (selector === "" && hasAttrFilter);
            var targetClasses = [];
            var targetId = "";
            var targetTagName = "";
            if (isClass) {
                targetClasses = selector.split('.').filter(function(c) { return c.length > 0; });
            } else if (isId) {
                targetId = selector.substring(1);
            } else if (!isAttrOnly) {
                targetTagName = selector.toLowerCase();
            }
            for (var i = 0; i < this.elements.length; i++) {
                var currentHtml = this.elements[i];
                var pos = 0;
                var subResults = [];
                while ((pos = currentHtml.indexOf('<', pos)) !== -1) {
                    if (currentHtml.charAt(pos+1) === '/' || currentHtml.charAt(pos+1) === '!') {
                        pos++;
                        continue;
                    }
                    var endOpenTag = currentHtml.indexOf('>', pos);
                    if (endOpenTag === -1) break;
                    var fullOpenTag = currentHtml.substring(pos, endOpenTag+1);
                    var spacePos = fullOpenTag.indexOf(' ');
                    var currentTagName = "";
                    if (spacePos === -1) {
                        currentTagName = fullOpenTag.substring(1, fullOpenTag.length-1).toLowerCase();
                    } else {
                        currentTagName = fullOpenTag.substring(1, spacePos).toLowerCase();
                    }
                    var isMatched = false;
                    if (isClass) {
                        var classMatchStr = "";
                        var classPos = fullOpenTag.indexOf('class="');
                        if (classPos !== -1) {
                            var startQuote = classPos + 7;
                            classMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf('"', startQuote));
                        } else {
                            classPos = fullOpenTag.indexOf("class='");
                            if (classPos !== -1) {
                                var startQuote = classPos + 7;
                                classMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf("'", startQuote));
                            }
                        }
                        if (classMatchStr) {
                            var currentClasses = classMatchStr.split(/\s+/);
                            var matchCount = 0;
                            for (var c = 0; c < targetClasses.length; c++) {
                                if (currentClasses.indexOf(targetClasses[c]) !== -1) matchCount++;
                            }
                            if (matchCount === targetClasses.length) isMatched = true;
                        }
                    } else if (isId) {
                        var idMatchStr = "";
                        var idPos = fullOpenTag.indexOf('id="');
                        if (idPos !== -1) {
                            var startQuote = idPos + 4;
                            idMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf('"', startQuote));
                        } else {
                            idPos = fullOpenTag.indexOf("id='");
                            if (idPos !== -1) {
                                var startQuote = idPos + 4;
                                idMatchStr = fullOpenTag.substring(startQuote, fullOpenTag.indexOf("'", startQuote));
                            }
                        }
                        if (idMatchStr === targetId) isMatched = true;
                    } else if (isAttrOnly) {
                        isMatched = true;
                    } else {
                        if (currentTagName === targetTagName) isMatched = true;
                    }
                    if (isMatched && hasAttrFilter) {
                        var searchStr1 = attrNameFilter + '="' + attrValueFilter + '"';
                        var searchStr2 = attrNameFilter + "='" + attrValueFilter + "'";
                        if (fullOpenTag.indexOf(searchStr1) === -1 && fullOpenTag.indexOf(searchStr2) === -1) {
                            isMatched = false;
                        }
                    }
                    if (isMatched) {
                        var startTagPos = pos;
                        var endTagPos = endOpenTag + 1;
                        var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta'];
                        if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) {
                            var depth = 1;
                            var scanPos = endOpenTag + 1;
                            var openStr = '<' + currentTagName;
                            var closeStr = '</' + currentTagName + '>';
                            while (depth > 0 && scanPos < currentHtml.length) {
                                var nextOpen = currentHtml.indexOf(openStr, scanPos);
                                var nextClose = currentHtml.indexOf(closeStr, scanPos);
                                if (nextClose === -1) {
                                    scanPos = currentHtml.length;
                                    break;
                                }
                                if (nextOpen !== -1 && nextOpen < nextClose) {
                                    depth++;
                                    scanPos = nextOpen + openStr.length;
                                } else {
                                    depth--;
                                    scanPos = nextClose + closeStr.length;
                                    if (depth === 0) endTagPos = nextClose + closeStr.length;
                                }
                            }
                        }
                        var foundBlock = currentHtml.substring(startTagPos, endTagPos);
                        if (contentFilter) {
                            var pureText = foundBlock.replace(/<[^>]+>/g, "").trim();
                            if (pureText.indexOf(contentFilter) === -1) {
                                pos = endTagPos;
                                continue;
                            }
                        }
                        subResults.push(foundBlock);
                        pos = endTagPos;
                    } else {
                        pos++;
                    }
                }
                results = results.concat(subResults);
            }
            var newInstance = _$(results);
            newInstance.sourceHtml = this.sourceHtml || currentHtml;
            return newInstance;
        },
        each: function(callback) {
            for (var i = 0; i < this.elements.length; i++) {
                var childInstance = _$(this.elements[i]);
                childInstance.sourceHtml = this.sourceHtml;
                callback.call(childInstance, i, this.elements[i]);
            }
            return this;
        },
        eq: function(index) {
            if (index < 0) index = this.elements.length + index;
            var matchedElement = this.elements[index];
            this.elements = matchedElement ? [matchedElement] : [];
            return this;
        },
        attr: function(attrName) {
            if (this.elements.length === 0) return "";
            var elem = this.elements[0];
            var searchStr = attrName + '="';
            var pos = elem.indexOf(searchStr);
            if (pos === -1) {
                searchStr = attrName + "='";
                pos = elem.indexOf(searchStr);
            }
            if (pos === -1) return "";
            var start = pos + searchStr.length;
            var quoteType = elem.charAt(start - 1);
            var end = elem.indexOf(quoteType, start);
            return end === -1 ? "" : elem.substring(start, end);
        },
        html: function() {
            if (this.elements.length === 0) return "";
            var elem = this.elements[0];
            var start = elem.indexOf('>') + 1;
            var end = elem.lastIndexOf('</');
            if (start > 0 && end > start) return elem.substring(start, end);
            return "";
        },
        text: function() {
            if (this.elements.length === 0) return "";
            var elem = this.elements[0];
            var start = elem.indexOf('>') + 1;
            var end = elem.lastIndexOf('</');
            if (start > 0 && end > start) {
                var content = elem.substring(start, end);
                return content.replace(/<\/?[^>]+(>|$)/g, "").trim();
            }
            return "";
        }
    };
    return instance;
}
