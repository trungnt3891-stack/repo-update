// =============================================================================
// CẤU HÌNH & METADATA (HYBRID: WEB + M3U)
// =============================================================================

var BASEURL = "https://hoathinh3d.co";
// Chuyển link blob github sang raw để lấy text trực tiếp
var M3U_URL = "https://raw.githubusercontent.com/hieumx/yanhh3d-iptv/main/playlist.m3u";

function getManifest() {
    return JSON.stringify({
        "id": "hh3d_hybrid",
        "name": "HH3D & Yanhh3d",
        "description": "Kết hợp Website HH3D và Playlist M3U Github.",
        "version": "2.0.0",
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
        nativeLog("[HH3D-Hybrid] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[HH3D-Hybrid] " + msg);
    }
}

// =============================================================================
// QUẢN LÝ MENU & DANH MỤC
// =============================================================================

function getHomeSections() {
    // Kết hợp mục M3U lên đầu, sau đó là các mục của Web
    var listurl = `
m3u_all@@Kho Phim M3U (Github)@@true
bang-xep-hang-hoat-hinh-trung-quoc@@Top 10 (Web)@@false
phim-hoan-thanh@@Hoàn Thành (Web)@@false
hh3d-danh-gia-cao@@Xem Nhiều (Web)@@false
/@@Mới Cập Nhật (Web)@@true
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
    return JSON.stringify({ category: menulist });
}

function getLISTmenu() {
    return `
m3u_all@@Tất cả phim M3U
phim-dang-chieu@@Web: Đang chiếu
phim-hoan-thanh@@Web: Hoàn thành
phim-hoat-hinh-3d-le@@Web: Phim lẻ
huyen-huyen@@Web: Huyền huyễn
xuyen-khong@@Web: Xuyên không
trung-sinh@@Web: Trùng sinh
tien-hiep@@Web: Tiên hiệp
co-trang@@Web: Cổ trang
kiem-hiep@@Web: Kiếm hiệp
`;
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        if (slug && slug.indexOf("http") > -1 || (slug && slug.indexOf("search") > -1)) {
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
                    if (Array.isArray(filters.category) && filters.category.length > 0) path = filters.category[0].slug;
                    else if (typeof filters.category === 'string') path = filters.category;
                }
            } catch (jsonErr) {}
        }

        // ĐỊNH TUYẾN M3U
        if (path === 'm3u_all') {
            // Truyền page qua URL param ảo để parse ở parseListResponse
            return M3U_URL + "?page=" + page;
        }

        // ĐỊNH TUYẾN WEB
        let resultUrl = BASEURL;
        if (path && path !== "/") {
            resultUrl += "/" + path.replace(/^\//, "");
        }
        if (page > 1) {
            resultUrl += "/page/" + page + "/";
        } else if (path) {
            resultUrl += "/";
        }
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");
    } catch (e) {
        return BASEURL;
    }
}

function getUrlSearch(keyword, filtersJson) {
    let page = 1;
    if (filtersJson) {
        try { let filters = JSON.parse(filtersJson); page = filters.page || 1; } catch (e) {}
    }
    // Search hiện tại hỗ trợ trên Web
    return BASEURL + "/page/" + page + "/?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    
    // ĐỊNH TUYẾN CHUYÊN BIỆT CHO M3U
    if (slug.indexOf("M3U8|") === 0) {
        // Ép app tải một link dung lượng siêu nhẹ (chính file m3u) để đánh lừa không fetch vào file video nặng
        return M3U_URL + "?detail=" + slug;
    }
    
    // ĐỊNH TUYẾN AJAX PLAYER (WEB)
    if (slug.indexOf("|") !== -1) {
        var parts = slug.split("|");
        if (parts.length >= 3) {
            return BASEURL + "/wp-content/themes/halimmovies/player.php?episode_slug=" + parts[0] + "&server_id=" + parts[2] + "&subsv_id=&post_id=" + parts[1];
        }
    }
    
    if (slug.indexOf('http') === 0) return slug;
    return BASEURL + "/" + slug.replace(/^\//, "");
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
        
        // 1. LUỒNG XỬ LÝ CHO M3U GITHUB
        if ($url.indexOf("playlist.m3u") > -1) {
            var lines = html.split('\n');
            var currentItem = null;
            
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line.indexOf('#EXTINF') === 0) {
                    currentItem = {};
                    var logoMatch = line.match(/tvg-logo="([^"]+)"/i);
                    currentItem.posterUrl = logoMatch ? logoMatch[1] : "https://hoathinh3d.co/wp-content/uploads/2023/09/favicon.png";
                    var titleSplit = line.split(',');
                    currentItem.title = titleSplit.length > 1 ? titleSplit[1].trim() : "Phim Không Tên";
                } else if (line.indexOf('http') === 0) {
                    if (currentItem) {
                        // Mã hóa dữ liệu gọn vào id để parseDetail bắt được
                        currentItem.id = "M3U8|" + encodeURIComponent(line) + "|" + encodeURIComponent(currentItem.title) + "|" + encodeURIComponent(currentItem.posterUrl);
                        currentItem.backdropUrl = currentItem.posterUrl;
                        currentItem.episode_current = "Tập 1";
                        currentItem.quality = "M3U";
                        items.push(currentItem);
                        currentItem = null;
                    }
                }
            }
            
            // Chia trang ảo cho M3U (20 item/trang)
            var page = 1;
            var matchPage = $url.match(/page=(\d+)/);
            if (matchPage) page = parseInt(matchPage[1]);
            var limit = 20; 
            var totalPages = Math.ceil(items.length / limit) || 1;
            var start = (page - 1) * limit;
            var pagedItems = items.slice(start, start + limit);
            
            return JSON.stringify({
                items: pagedItems,
                pagination: { currentPage: page, totalPages: totalPages }
            });
        }

        // 2. LUỒNG XỬ LÝ CHO WEB HOATHINH3D
        _$(html).find(".halim-item").each(function () {
            var aTag = this.find("a").eq(0);
            var href = aTag.attr("href");
            var title = aTag.attr("title") || this.find(".entry-title").text();
            
            var imgTag = this.find("img").eq(0);
            var src = imgTag.attr("data-src") || imgTag.attr("src") || imgTag.attr("data-srcset");
            var ep = this.find(".episode").text() || "Full";
            var quality = this.find(".status").text() || "HD";

            if (src && src.indexOf("http") == -1) src = BASEURL + src;
            if (href) {
                items.push({
                    "id": href,
                    "title": title.trim(),
                    "posterUrl": src,
                    "backdropUrl": src,
                    "episode_current": ep.trim(),
                    "quality": quality.trim()
                });
            }
        });

        var totalPages = 1;
        var currentPage = 1;
        var currentMatch = html.match(/<span[^>]*class="[^"]*current[^"]*"[^>]*>(\d+)<\/span>/i);
        if (currentMatch) currentPage = parseInt(currentMatch[1]);
        
        var pageRegex = /page\/(\d+)\//g;
        var pageMatch;
        while ((pageMatch = pageRegex.exec(html)) !== null) {
            var p = parseInt(pageMatch[1]);
            if (p > totalPages) totalPages = p;
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages || 1 }
        });

    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html, "");
}

function parseMovieDetail(html, url) {
    try {
        // 1. XỬ LÝ DETAIL CỦA PHIM M3U
        if (url.indexOf("detail=M3U8|") > -1) {
            var rawSlug = url.split("detail=")[1];
            var parts = rawSlug.split("|");
            var streamUrl = decodeURIComponent(parts[1]);
            var title = decodeURIComponent(parts[2]);
            var poster = decodeURIComponent(parts[3]);
            
            return JSON.stringify({
                id: rawSlug,
                title: title,
                posterUrl: poster,
                backdropUrl: poster,
                description: "Danh sách phát phim trực tiếp từ Playlist M3U của Github Yanhh3d.",
                servers: [{
                    name: "M3U Server",
                    episodes: [{ 
                        // Dùng mánh fake link bằng param play để tránh app fetch file video khổng lồ
                        id: M3U_URL + "?play=" + encodeURIComponent(streamUrl), 
                        name: "Xem Ngay", 
                        slug: "m3u_play" 
                    }]
                }],
                quality: "M3U VOD", year: 2024, status: "Hoàn Thành", duration: "Đang cập nhật"
            });
        }

        // 2. XỬ LÝ DETAIL CỦA PHIM WEB
        var limg = _$(html).find('meta[property="og:image"]').attr("content");
        var lname = _$(html).find('h1.entry-title').text() || _$(html).find('h1.movie_name').text();
        var otherName = _$(html).find('.org_title').text();
        if(otherName && lname) lname += " (" + otherName.trim() + ")";

        var descText = _$(html).find('.entry-content').text();
        var ldes = descText ? descText.trim() : _$(html).find('meta[name="description"]').attr("content");
        
        var postIdMatch = html.match(/post_id["']?\s*:\s*["']?(\d+)["']?/i) || html.match(/data-post-id=["'](\d+)["']/i);
        var postId = postIdMatch ? (postIdMatch[1] || postIdMatch[2]) : "";
        var servers = [];
        
        var serverBlockRegex = /<ul[^>]*id="listsv-(\d+)"[^>]*class="[^"]*halim-list-eps[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi;
        var listMatch;
        
        while ((listMatch = serverBlockRegex.exec(html)) !== null) {
            var svId = listMatch[1];
            var listHtml = listMatch[2];
            var episodes = [];
            var epRegex = /<li[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi;
            var epMatch;
            while ((epMatch = epRegex.exec(listHtml)) !== null) {
                var epUrl = epMatch[1];
                var epInner = epMatch[2].replace(/<[^>]*>/g, "").trim(); 
                var epSlugRaw = epUrl.replace(/https?:\/\/[^\/]+\//, "").replace(/\/$/, "");
                var epSlug = epSlugRaw.replace(/-sv\d+$/, "");
                var specialId = epSlug + "|" + postId + "|" + svId;

                episodes.push({
                    id: specialId,
                    name: "Tập " + epInner,
                    slug: epSlugRaw
                });
            }
            if (episodes.length > 0) {
                episodes.reverse(); 
                servers.push({ name: "Server " + svId, episodes: episodes });
            }
        }

        return JSON.stringify({
            id: url, title: lname, posterUrl: limg, backdropUrl: limg,
            description: ldes, servers: servers, quality: "HD"
        });

    } catch (e) {
        return JSON.stringify({ id: url, title: "Lỗi tải phim", servers: [] });
    }
}

function parseDetailResponse(html, url) {
    try {
        // 1. NẾU LÀ PLAY M3U -> Trả thẳng link Native
        if (url.indexOf("play=") > -1) {
            var streamUrl = decodeURIComponent(url.split("play=")[1]);
            return JSON.stringify({
                url: streamUrl,
                isEmbed: false,
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
            });
        }

        // 2. XỬ LÝ AJAX TỪ WEB
        var streamUrl = "";
        var jsonMatch = html.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                var json = JSON.parse(jsonMatch[0]);
                if (json.file) streamUrl = json.file;
                else if (json.url) streamUrl = json.url;
                else if (json.data && json.data.sources) {
                    var sources = json.data.sources;
                    var iframeM = sources.match(/src="([^"]+)"/i);
                    if (iframeM) streamUrl = iframeM[1];
                }
            } catch (e) {}
        }
        
        if (!streamUrl) {
            var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
            if (iframeMatch) streamUrl = iframeMatch[1];
        }

        if (streamUrl) {
            streamUrl = streamUrl.replace(/\\\/|\\\\/g, "/");
            var isEmbed = streamUrl.indexOf(".m3u8") === -1 && streamUrl.indexOf(".mp4") === -1;
            return JSON.stringify({
                "url": streamUrl,
                "isEmbed": isEmbed,
                "headers": {
                    "Referer": BASEURL,
                    "Origin": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            });
        }
        
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": { "Referer": BASEURL }});
    } catch (e) {
        return JSON.stringify({ "url": url, "isEmbed": true, "headers": { "Referer": BASEURL }});
    }
}

function parseEmbedResponse(html, url) {
    try {
        if (url.toLowerCase().indexOf(".m3u8") > -1 || url.toLowerCase().indexOf(".mp4") > -1) {
            return JSON.stringify({
                "url": url,
                "isEmbed": false,
                "headers": {
                    "Referer": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            });
        } else {
            // Nhúng Script Tối ưu UI cho Web
            var customJs = textJS("true", "Xem phim HH3D", url, url);
            return JSON.stringify({
                "url": url,
                "headers": {
                    "Referer": BASEURL,
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36",
                    "Custom-Js": customJs.trim()
                }
            });
        }
    } catch (e) {
        return JSON.stringify({ url: url, headers: { "Referer": BASEURL } });
    }
}

function parseCategoriesResponse() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}
function parseCountriesResponse() { return "[]"; }
function parseYearsResponse() { return "[]"; }

// =============================================================================
// TIỆN ÍCH HỖ TRỢ
// =============================================================================

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
        if (check === "false") item = { "slug": link, "title": name, "type": "Horizontal" };
        else if (check === "true") item = { "slug": link, "title": name, "type": "Grid" };
        else item = { "slug": link, "name": name };
        menulist.push(item);
    }
    return menulist;
}

function _$(htmlOrBlock) {
    if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; }
    var instance = {
        sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '',
        elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []),
        find: function(selector) {
            var results = [];
            var contentFilter = "";
            if (selector.indexOf(":content(") !== -1) {
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
            if (selector.indexOf(":not(") !== -1) {
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
                    if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; }
                    var endOpenTag = currentHtml.indexOf('>', pos);
                    if (endOpenTag === -1) break;
                    var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1);
                    var spacePos = fullOpenTag.indexOf(' ');
                    var currentTagName = "";
                    if (spacePos === -1) {
                        currentTagName = fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase();
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
                                if (nextClose === -1) { scanPos = currentHtml.length; break; }
                                if (nextOpen !== -1 && nextOpen < nextClose) {
                                    depth++; scanPos = nextOpen + openStr.length;
                                } else {
                                    depth--; scanPos = nextClose + closeStr.length;
                                    if (depth === 0) endTagPos = nextClose + closeStr.length;
                                }
                            }
                        }
                        var foundBlock = currentHtml.substring(startTagPos, endTagPos);
                        if (contentFilter) {
                            var pureText = foundBlock.replace(/<[^>]+>/g, "").trim();
                            if (pureText.indexOf(contentFilter) === -1) { pos = endTagPos; continue; }
                        }
                        if (notSelector) {
                            var isNotClass = notSelector.indexOf('.') === 0;
                            var isNotId = notSelector.indexOf('#') === 0;
                            var notValue = notSelector.substring(1);
                            var hasNot = false;
                            if (isNotClass && fullOpenTag.indexOf('class="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;
                            if (isNotId && fullOpenTag.indexOf('id="') !== -1 && fullOpenTag.indexOf(notValue) !== -1) hasNot = true;
                            if (!hasNot) subResults.push(foundBlock);
                        } else {
                            subResults.push(foundBlock);
                        }
                        pos = endTagPos;
                    } else {
                        pos++;
                    }
                }
                if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]];
                if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]];
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
            if (pos === -1) { searchStr = attrName + "='"; pos = elem.indexOf(searchStr); }
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
};

// -----------------------------------------------------------------------------
// TEXTJS (Custom Player Injector Của Bạn)
// -----------------------------------------------------------------------------
function textJS($links, checkepi, url, stream) {
    return `
LINKVIDEO = ${JSON.stringify($links)};
CHECKEPI = ${JSON.stringify(checkepi)};
URLPAGE = ${JSON.stringify(url)};
STREMLINL = ${JSON.stringify(stream)};
SCRIPTURL = "https://script.google.com/macros/s/AKfycbwsvLFzWMdxvX9ZH-3wnP3GJzS58v0CtT_0mlEYeOz6cOsgen9IR3c6VPv_EssPXMFzwQ/exec?name=hoathinh3d&type=js";  
const style = document.createElement('style');
var customcss = 'body { background: black; overflow: hidden; }body * {background: black}';
style.innerHTML = customcss;
document.head.appendChild(style);

/* Build Video Begin*/

    var DEVELOPE = false;
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
    function GetlinkVideo() {
        var originalVideo = document.querySelector('video');
        if (!originalVideo) {
            console.log("❌ Không tìm thấy thẻ video gốc trên trang!");
            return;
        }
        var highestId = window.setTimeout(function() {
            for (var i = highestId; i >= 0; i--) { window.clearInterval(i); window.clearTimeout(i); }
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
                    servers.push({ label: (src.indexOf('embed') > -1 ? 'Nhúng ' : 'Server ') + (servers.length + 1), src: src, type: 'server' });
                }
            }
        }
        return { activeSrc: activeSrc, servers: servers, episodes: episodes };
    }

    function buildVideoWithOriginal(video, stream1, stream2, playlistData) {
        video.id = 'main-video';
        video.style.cssText = 'width:100%;height:100%;object-fit:contain;cursor:pointer;background:#000;outline:none;border:none;box-shadow:none;';
        video.controls = false;
        
        var container = document.createElement('div');
        container.id = 'custom-video-player';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999999;font-family:Segoe UI,Roboto,sans-serif;user-select:none;-webkit-user-select:none;outline:none;border:none;box-shadow:none;';

        var spinner = document.createElement('div');
        spinner.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border:4px solid rgba(255,255,255,0.3);border-top:4px solid #fff;border-radius:50%;animation:spin 1s linear infinite;z-index:10;pointer-events:none;display:none;';
        var spinStyle = document.createElement('style');
        spinStyle.textContent = '@keyframes spin{0%{transform:translate(-50%,-50%) rotate(0deg);}100%{transform:translate(-50%,-50%) rotate(360deg);}}';
        document.head.appendChild(spinStyle);

        var controls = document.createElement('div');
        controls.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;background:linear-gradient(transparent,rgba(0,0,0,0.85));padding:12px 16px 20px;box-sizing:border-box;transition:opacity 0.3s;opacity:0;z-index:20;';
        var progressWrap = document.createElement('div');
        progressWrap.style.cssText = 'width:100%;height:6px;background:rgba(255,255,255,0.3);border-radius:3px;cursor:pointer;position:relative;margin-bottom:12px;';
        var progressBar = document.createElement('div');
        progressBar.style.cssText = 'height:100%;background:#e74c3c;width:0%;border-radius:3px;position:relative;pointer-events:none;';
        progressWrap.appendChild(progressBar);
        
        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;align-items:center;gap:12px;';

        var btnPlay = document.createElement('button'); btnPlay.textContent = '⏸'; btnPlay.style.cssText = 'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;';
        var timeDisplay = document.createElement('span'); timeDisplay.style.cssText = 'color:#fff;font-size:13px;min-width:100px;'; timeDisplay.textContent = '0:00 / 0:00';
        var spacer = document.createElement('div'); spacer.style.cssText = 'flex:1;';
        var btnFullscreen = document.createElement('button'); btnFullscreen.textContent = '⛶'; btnFullscreen.style.cssText = 'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;';

        btnRow.appendChild(btnPlay);
        btnRow.appendChild(timeDisplay);
        btnRow.appendChild(spacer);
        btnRow.appendChild(btnFullscreen);

        controls.appendChild(progressWrap);
        controls.appendChild(btnRow);

        container.appendChild(video);
        container.appendChild(spinner);
        container.appendChild(controls);

        var htmlTAG = document.getElementsByTagName("html")[0];
        htmlTAG.innerHTML = '';
        document.body = document.createElement('body');
        document.body.appendChild(container);
        document.title = 'Dẹp hết quảng cáo rồi nha bạn.';

        function formatTime(sec) {
            if (!sec || isNaN(sec)) return '0:00';
            var m = Math.floor(sec / 60);
            var s = Math.floor(sec % 60);
            return m + ':' + (s < 10 ? '0' + s : s);
        }

        function updateProgress() {
            if (video.duration) progressBar.style.width = ((video.currentTime / video.duration) * 100) + '%';
            timeDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
        }

        btnPlay.onclick = function(e) { 
            e.stopPropagation(); 
            if(video.paused) { video.play(); btnPlay.textContent = '⏸'; } 
            else { video.pause(); btnPlay.textContent = '▶'; }
        };

        btnFullscreen.onclick = function(e) { 
            e.stopPropagation(); 
            if (!document.fullscreenElement) container.requestFullscreen().catch(function() {});
            else document.exitFullscreen().catch(function() {});
        };

        video.addEventListener('timeupdate', updateProgress);
        video.addEventListener('waiting', function() { spinner.style.display = 'block'; });
        video.addEventListener('playing', function() { spinner.style.display = 'none'; btnPlay.textContent = '⏸'; });
        
        container.addEventListener('mousemove', function(){
            controls.style.opacity = '1';
            clearTimeout(container.controlsTimeout);
            container.controlsTimeout = setTimeout(function() { controls.style.opacity = '0'; }, 3000);
        });

        if (video.paused) {
            video.play().catch(function() { video.muted = true; video.play(); });
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', GetlinkVideo);
    else GetlinkVideo();
}

setTimeout(runVideo, 1000);

function injectScriptAfterLoad(scriptUrl) {
    if (CHECKEPI == "true") showToast('Tập phim bạn chọn chưa có hoặc đã lỗi. Đã tự động đưa bạn về tập 1!', 60000, true);
    else showToast(CHECKEPI, 30000, true,true);
}
injectScriptAfterLoad(SCRIPTURL);

`;
}
