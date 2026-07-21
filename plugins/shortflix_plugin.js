var BASEURL = "https://www.shortflix.net"; 
var BASEAPI = "https://www.shortflix.net/api/search?limit=100&language=vi_VN&lang=vi_VN";
function getManifest() {
    return JSON.stringify({
        "id": "shortflix",
        "name": "Phim Ngắn Hay",
        "description": "Phim Ngắn lồng tiếng vietsub hay",
        "version": "1.1.2",
        "baseUrl": "https://www.shortflix.net",
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/shortflix.png",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "exoplayer"
    });
}

function log(msg) {
    if (typeof nativeLog !== 'undefined') {
        nativeLog("[gamomephim] " + msg);
    } else if (typeof console !== 'undefined' && console.log) {
        console.log("[gamomephim] " + msg);
    }
}

function getHomeSections() {
    var listurl = '[{\"link\":\"&sortBy=last_episode_at\",\"name\":\"Phim Mới\"}]';
    var menulist = buildMenu(listurl, true);
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

// =============================================================================
// URL GENERATORS
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        log("getUrlList-slug: " + slug + " | filters: " + filtersJson);
        
        var page = 1;
        var path = slug || "";

        // Parse filtersJson để lấy số trang
        if (filtersJson) {
            var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
            try {
                var filters = JSON.parse(fixedJson);
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

        // Tạo URL cơ sở
        var resultUrl = "";
        if (path && path.indexOf("http") === 0) {
            resultUrl = path;
        } else {
            resultUrl = BASEAPI + (path ? path : "");
        }

        // Xử lý cursor phân trang:
        // Trang 1: Dùng URL gốc (không gắn cursor)
        // Trang 2+: Lấy cursor với index = page - 2
        if (page > 1) {
            var cursor = getPage(page - 2); // page 2 -> getPage(0), page 3 -> getPage(1)
            if (cursor) {
                var separator = resultUrl.indexOf("?") > -1 ? "&" : "?";
                resultUrl += separator + "cursor=" + encodeURIComponent(cursor);
            }
        }

        log("getUrlList Output: " + resultUrl);
        return resultUrl.replace(/([^:]\/)\/+/g, "$1");

    } catch (e) {
        console.log(e);
        return slug || BASEAPI;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return BASEAPI + "&q=" + encodeURIComponent(keyword);
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
    log("listurl Get:" + $url);
    try {
        var items = [];
        var $data = JSON.parse(html);
        
        if ($data && $data.items) {
            for (var $j = 0; $j < $data.items.length; $j++) {
                var $item = $data.items[$j];
                var year = "";
                var lang = "";
                var current = $item.status ? $item.status.replace("PUBLISHED", "Hoàn Thành") : "";
                
                // ĐÃ SỬA: Lấy slug/id trực tiếp từ $item
                var itemSlug = $item.slug || $item.id || "";
                var href = BASEURL + "/vi/videos/" + itemSlug;
                
                var quality = "HD";
                var title = $item.title || "";
                var src = $item.thumbnailUrl || "";

                if (href) {
                    var cleanThumb = src.replace(/&amp;/g, '&');

                    items.push({
                        "id": href,
                        "title": title.trim(),
                        "posterUrl": cleanThumb,
                        "backdropUrl": cleanThumb,
                        "quality": quality,
                        "lang": lang,
                        "episode_current": current
                    });
                }
            }
        }

        var nextpage = $data.nextCursor;
        log("nextCursor:" + nextpage);

        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": 1,
                "totalPages": 999
            }
        });

    } catch (e) {
        log(e);
        return JSON.stringify({
            "items": [{
                "id": $url,
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



function parseSearchResponse(html, url) {
    return parseListResponse(html, url);
}

function parseScript(rawScript) {
	const result = {
		success: false,
		data: {},
		embedHtml: ''
	};
	
	if (!rawScript || typeof rawScript !== 'string') {
		return result;
	}
	
	try {
		// 1. Giải mã các ký tự escape nháy đôi (\" -> ") và xóa xuống dòng thừa gây đứt chuỗi
		let cleaned = rawScript.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		cleaned = cleaned.replace(/[\r\n]+/g, ' ');
		
		// 2. Tìm vị trí bắt đầu của đối tượng "video": {
		const videoKey = '"video":{';
		const videoIndex = cleaned.indexOf(videoKey);
		
		if (videoIndex !== -1) {
			const startIndex = videoIndex + videoKey.length - 1; // Vị trí dấu '{' mở đầu đối tượng video
			let braceCount = 0;
			let endIndex = -1;
			
			// 3. Thuật toán đếm ngoặc nhọn để xác định chính xác điểm kết thúc của Object video
			for (let i = startIndex; i < cleaned.length; i++) {
				if (cleaned[i] === '{') {
					braceCount++;
				} else if (cleaned[i] === '}') {
					braceCount--;
					if (braceCount === 0) {
						endIndex = i + 1; // Vị trí dấu '}' đóng đối tượng video
						break;
					}
				}
			}
			
			if (endIndex !== -1) {
				const videoJsonStr = cleaned.substring(startIndex, endIndex);
				// Parse duy nhất JSON Object của video (bỏ qua toàn bộ rác Next.js RSC xung quanh)
				result.data = JSON.parse(videoJsonStr);
				result.success = true;
				return result;
			}
		}
		
		// Fallback dự phòng bằng Regex nếu tìm vị trí chuỗi thất bại
		const regexMatch = cleaned.match(/"video"\s*:\s*(\{[\s\S]*?\})\s*,\s*"tags"/);
		if (regexMatch && regexMatch[1]) {
			result.data = JSON.parse(regexMatch[1]);
			result.success = true;
		}
		
	} catch (error) {
		console.error("SafeParser Error:", error);
	}
	
	return result;
}

function parseMovieDetail(html, url) {
	try {
		//log(url);
		var id = url;
		var lname = "Đang cập nhật...";
		var limg = "";
		var ldes = "Không có mô tả.";
		var category = "";
		var episode_current = "";
		var quality = "";
		var year = 2026;
		var rating = 0;
		var servers = [];
		var extra = "";
		var lactor = "";
		var ldirec = "";
		var lduran = "";
		var status = "";
		
		lname = _$(html).find("h1").text();
		limg = _$(html).find('meta[property="og:image"]').attr("content");
		ldes = _$(html).find(".order-6:content('Giới thiệu')").text();
		category = _$(html).find(".text-sm:content('Thể loại:')").parent().text(" - ").replace("Thể loại - : - ", "");
		episode_current = _$(html).find("span:content('Tập mới nhất:')").parent().text().trim().replace("Tập mới nhất:", "");
		quality = "HD";
		year = _$(html).find("span:content('Thời gian xuất bản:')").parent().text().trim().replace("Thời gian xuất bản:", "");
		year = Number(year);
		lactor = _$(html).find("span:content('Diễn viên:')").parent().text().trim().replace("Diễn viên:", "");
		ldirec = _$(html).find("span:content('Đạo diễn:')").parent().text().trim().replace("Đạo diễn:", "");
		lduran = _$(html).find("span:content('Thời lượng:')").parent().text().trim().replace("Thời lượng:", "");
		status = _$(html).find("span:content('Trạng thái:')").parent().text().trim().replace("Trạng thái:", "");
		rating = _$(html).find("span:content('Điểm IMDB:')").parent().text().trim().replace("Điểm IMDB:", "");
		
		
		var script = _$(html).find("script:content('.m3u8')").html();
		if (!script) {
			script = _$(html).find("script:content('episodes')").html();
		}
		var $dataVD = parseScript(script);
		var servers = [];
		var $listepi = $dataVD.data.episodes;
		var $items = [];
		for (var $j = 0; $j < $listepi.length; $j++) {
			var $epinumber = $listepi[$j].episodeNumber;
			var $nameepi = "Tập " + $epinumber;
			var $item = {
				id: url + "?tap=" + $epinumber,
				name: $nameepi,
				slug: "tap-" + $epinumber
			}
			$items.push($item)
		}
		servers.push({
			name: "Server",
			episodes: $items
		})
		
		
		return JSON.stringify({
			id: id,
			title: lname,
			posterUrl: limg,
			backdropUrl: limg,
			description: ldes,
			quality: quality,
			year: year,
			rating: rating,
			status: status,
			category: category,
			episode_current: episode_current,
			servers: servers,
			duration: lduran || "",
			casts: lactor || "",
			director: ldirec || "",
			extra: extra
		});
	} catch (e) {
		log(e);
		return JSON.stringify({
			id: url || "error",
			title: "Lỗi tải thông tin chi tiết",
			servers: []
		});
	}
}
/*
var html = sourceHTML;
var url = window.location.href;
JSON.parse(parseMovieDetail(sourceHTML, url))
*/


function parseDetailResponse(html, url) {
	try {
		var tap = url.match(/tap=(\d+)/i);
		var tapVal = tap && tap[1] !== undefined ? tap[1] : "1";
		
		var script = _$(html).find("script:content('.m3u8')").html();
		var $subtitle = "";
		var $dataVD = parseScript(script);
		var $episodes = $dataVD.data.episodes || [];
		
		// 1. Ưu tiên tìm index dựa trên tên/số tập trong mảng episodes
		var tapcurrent = $episodes.findIndex(function(ep) {
			return ep.name == tapVal || ep.slug == tapVal || ep.episode == tapVal;
		});

		// 2. Nếu không tìm thấy theo tên/số, tính toán index dự phòng
		if (tapcurrent === -1) {
			var tapNum = Number(tapVal);
			// Nếu tap = 0 thì giữ nguyên index 0; nếu tap > 0 thì trừ 1
			tapcurrent = tapNum > 0 ? tapNum - 1 : 0;
		}

		// 3. Đảm bảo index luôn nằm trong phạm vi mảng hợp lệ
		if (tapcurrent < 0) tapcurrent = 0;
		if (tapcurrent >= $episodes.length) tapcurrent = $episodes.length - 1;

		var $epicurrent = $episodes[tapcurrent];
		if (!$epicurrent) throw new Error("Episode not found");

		var $video = $epicurrent.versions[0];
		var $linkstream = $video.videoUrl;
		var $hardsub = $video.hardSub;
		
		if ($hardsub === false && $video.subtitles && $video.subtitles.length > 0) {
			$subtitle = $video.subtitles[0].fileUrl;
		}
		
		return JSON.stringify({
			"url": $linkstream,
			"isEmbed": false,
			"mimeType": "application/x-mpegURL",
			"headers": {
				"Referer": BASEURL,
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
			},
			"subtitles": [{
				"lang": "vi",
				"url": $subtitle
			}]
		});
	} catch (e) {
		return JSON.stringify({
			"url": "",
			"headers": {}
		});
	}
}

/*
var html = sourceHTML;
var url = window.location.href + "?tap=22";
JSON.parse(parseDetailResponse(html, url))
*/

function sortEpisodesByName(data) {
    data.forEach(function(server) {
        if (server.episodes && Array.isArray(server.episodes)) {
            server.episodes.sort(function(a, b) {
                var matchA = a.name.match(/Tập\s*(\d+)/i);
                var matchB = b.name.match(/Tập\s*(\d+)/i);
                var numA = matchA ? parseInt(matchA[1], 10) : 0;
                var numB = matchB ? parseInt(matchB[1], 10) : 0;
                return numA - numB;
            });
        }
    });
    return data;
}

function parseCategoriesResponse(apiResponseJson) {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// /vi/latest-updates/
// {\"link\":\"/vi/latest-updates/\",\"name\":\"4K\"}

function getPage(number) {
    var $data = [
        "eyJpZCI6IjE1NDExMSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4NDIyMzI2ODU5Nn0",
        "eyJpZCI6IjE1MTgxNyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4Mzg0MjcyMTU3OX0",
        "eyJpZCI6IjE0ODIwMCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MzQyNjc0ODI5Nn0",
        "eyJpZCI6IjE0NjAxMSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4Mjk3MzM4OTM4NX0",
        "eyJpZCI6IjE0NDc3OCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MjcxMzU0NTk5N30",
        "eyJpZCI6IjEzOTg0MCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTc3MjM4NTEyMH0",
        "eyJpZCI6IjEzNzQ3MyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTUwNDUzNjM3M30",
        "eyJpZCI6IjEyOTkzMyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTIxNTA0NTUzNX0",
        "eyJpZCI6IjEyOTI1OSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTIxMjQwNDMyMn0",
        "eyJpZCI6IjEyODcwOCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTIxMDExMDg4N30",
        "eyJpZCI6IjEyODM0MSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE1OTY5MjcwNn0",
        "eyJpZCI6IjEyNzk0MiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE1NzU3NjM5MH0",
        "eyJpZCI6IjEyOTk3NiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE1MzA4NDQyMH0",
        "eyJpZCI6IjEyOTgzMSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE1MTQyMjI5OH0",
        "eyJpZCI6IjEyOTcwMiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE0OTgxODIyOX0",
        "eyJpZCI6IjEyNzU2NiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE0Nzk0MTExMn0",
        "eyJpZCI6IjEyNzE4OSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE0NTk4NzY0Mn0",
        "eyJpZCI6IjEyNjc4OCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE0Mzg5NjA4MH0",
        "eyJpZCI6IjEyNjQyMyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTE0MTkwODYxNX0",
        "eyJpZCI6IjEyNjA0MyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTEzOTQ3MDQ0OX0",
        "eyJpZCI6IjEyNTY2OCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTEzNzU0ODE5Mn0",
        "eyJpZCI6IjEyNTI1OCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTEzNTUxNTgyNX0",
        "eyJpZCI6IjEyMDQ2NiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTEwNzYxNDA3NX0",
        "eyJpZCI6IjEyODk2NSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTEwMzgxMjI3OX0",
        "eyJpZCI6IjEyODg0NCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTEwMTY2MDAyNH0",
        "eyJpZCI6IjEyODcwNiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA5OTM5NTE3MX0",
        "eyJpZCI6IjEyODU3MSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA5NzIyNDA2Mn0",
        "eyJpZCI6IjEyODQ0MCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA5NDk2Mzc0M30",
        "eyJpZCI6IjEyODMwMSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA5Mjg1NDA1NX0",
        "eyJpZCI6IjEyODE1NSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA5MDY1NzU4MH0",
        "eyJpZCI6IjEyODAyMSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA4ODMzNjU2MX0",
        "eyJpZCI6IjEyNzkwNSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA4NjIzMzQyOX0",
        "eyJpZCI6IjEyNzc3NSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA4NDA5ODU2MH0",
        "eyJpZCI6IjEyNzY1MSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA4MTY1MDk4MH0",
        "eyJpZCI6IjEyNzUxMSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA3OTE5NTczM30",
        "eyJpZCI6IjEyMDQ1OCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA3NzExMDIwN30",
        "eyJpZCI6IjEyNzIzNiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA3NTAwNTI3OH0",
        "eyJpZCI6IjEyNzEwNyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA3Mjg3MzIxM30",
        "eyJpZCI6IjEyNjk2OCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA3MDk2NDY0NX0",
        "eyJpZCI6IjEyNjgzMyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA2ODg4OTgwNn0",
        "eyJpZCI6IjEyNjY5OSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA2Njg4NDU4NH0",
        "eyJpZCI6IjEyNjU1NSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA2NDcyOTE2M30",
        "eyJpZCI6IjEyNjQyMiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA2MjYzMjA2OH0",
        "eyJpZCI6IjEyNjE2MiIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA1ODU3OTAyMX0",
        "eyJpZCI6IjEyNjAyOCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA1NjUwMzUwM30",
        "eyJpZCI6IjEyNTg3OSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA1NDQ2NDI0MX0",
        "eyJpZCI6IjEyNTc0MSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA1MjM2NDE4Nn0",
        "eyJpZCI6IjEyNTYxMCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA1MDE3MjA2Mn0",
        "eyJpZCI6IjEyNTM0MyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA0NjU3NTkxNH0",
        "eyJpZCI6IjEyNTIwNSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA0NDg4NDc4MH0",
        "eyJpZCI6IjEyNTA2MSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MTA0MjkwMzQ4OH0",
        "eyJpZCI6IjEyMjg2OSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MDk5OTI0OTg3MX0",
        "eyJpZCI6IjEyMDM5OCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MDk2OTI1MDY4OX0",
        "eyJpZCI6IjExNzk3NSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MDkwNjM0MDc5NH0",
        "eyJpZCI6IjExNTkxNyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MDUzNDc3NjY4M30",
        "eyJpZCI6IjExMzU5OCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MDQ4MzcyNzY3MH0",
        "eyJpZCI6IjExMTIwMSIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc4MDM5NDE3NDYwOH0",
        "eyJpZCI6IjEwNzMzNCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc3OTcxMzA3Nzg0MX0",
        "eyJpZCI6Ijk1MjIzIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc5MjcxOTcxNjY1fQ",
        "eyJpZCI6Ijk2NjM4IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc5MjI5MzMxNzU4fQ",
        "eyJpZCI6IjEwMTg1NyIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc3OTE4MDA1MDY5OX0",
        "eyJpZCI6IjEwMTc2NCIsInRpbWVzdGFtcCI6MCwib3JkZXJWYWx1ZSI6MTc3OTE3Nzc5NTI1Nn0",
        "eyJpZCI6Ijk2NTczIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc5MDY2MTc3NDkwfQ",
        "eyJpZCI6Ijk0ODg3IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc4MjExNjQ5MjQ3fQ",
        "eyJpZCI6Ijg1NzA4IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc3NTE3Mjg1MDcwfQ",
        "eyJpZCI6IjgyNTQ3IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc3MTk0MTA3Mjg3fQ",
        "eyJpZCI6IjY1NzY4IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc2MDc5MzgzMDQzfQ",
        "eyJpZCI6IjYxODIzIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc1Nzg1NDIxNzAzfQ",
        "eyJpZCI6IjYxMjUyIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc1NzU1MDUxODMzfQ",
        "eyJpZCI6IjU4MzE2IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc1NzM1Nzk2MjUxfQ",
        "eyJpZCI6IjYwNjI2IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc1NzEyMjI4MDE1fQ",
        "eyJpZCI6IjQ4MzMyIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NzQ4MTUwMjYyfQ",
        "eyJpZCI6IjQ3NzM1IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NjU2Mzc4Njc2fQ",
        "eyJpZCI6IjQ3NjI2IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NjU1MTEzNzcyfQ",
        "eyJpZCI6IjQ3NTI3IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NjUzOTQ3MTgyfQ",
        "eyJpZCI6IjQ3NDI5IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NjUyOTE1NjUyfQ",
        "eyJpZCI6IjQ3MjEwIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NjUwOTQyMDcwfQ",
        "eyJpZCI6IjMxOTMxIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NDI0NzM1MjMwfQ",
        "eyJpZCI6IjMzNTgwIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NDE4ODA2NjY4fQ",
        "eyJpZCI6IjMzNDk2IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NDE2OTI0OTc5fQ",
        "eyJpZCI6IjMzMzk0IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0NDE0OTM0NDI3fQ",
        "eyJpZCI6IjM0NjUwIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzc0MjA1NjIxMjE1fQ",
        "eyJpZCI6IjMwODUyIiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzczNDY5Nzk4NTQ2fQ",
        "eyJpZCI6IjI5Mzg4IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzcyNTE2NzI2NDQ3fQ",
        "eyJpZCI6IjI2ODE0IiwidGltZXN0YW1wIjowLCJvcmRlclZhbHVlIjoxNzcxODI1NjEyMTA2fQ",
        "eyJpZCI6IjI3OTEiLCJ0aW1lc3RhbXAiOjAsIm9yZGVyVmFsdWUiOjE3Njk0ODU0NTg4ODh9",
        "eyJpZCI6IjI2OTYiLCJ0aW1lc3RhbXAiOjAsIm9yZGVyVmFsdWUiOjE3Njk0ODQ4MzM5MDd9",
        "eyJpZCI6IjI1OTIiLCJ0aW1lc3RhbXAiOjAsIm9yZGVyVmFsdWUiOjE3Njk0ODQxNzI3NTV9",
        "eyJpZCI6IjI0ODciLCJ0aW1lc3RhbXAiOjAsIm9yZGVyVmFsdWUiOjE3Njk0ODM1NDA2MTR9"
    ];

    if (number >= 0 && number < $data.length) {
        return $data[number];
    }
    return "";
}


// q=l%E1%BB%93ng+ti%E1%BA%BFng
function getLISTmenu() {
    return `[{\"link\":\"&q=l%E1%BB%93ng+ti%E1%BA%BFng\",\"name\":\"Lồng Tiếng\"},{\"link\":\"&genre=tong-tai\",\"name\":\"Tổng tài\"},{\"link\":\"&genre=co-dai\",\"name\":\"Cổ đại\"},{\"link\":\"&genre=tam-ly\",\"name\":\"Tâm lý\"},{\"link\":\"&genre=ngon-tinh\",\"name\":\"Ngôn tình\"},{\"link\":\"&genre=hai-huoc\",\"name\":\"Hài hước\"},{\"link\":\"&genre=nu-cuong\",\"name\":\"Nữ cường\"},{\"link\":\"&genre=huyen-huyen\",\"name\":\"Huyền huyễn\"},{\"link\":\"&genre=toi-pham\",\"name\":\"Tội phạm\"},{\"link\":\"&genre=xuyen-khong\",\"name\":\"Xuyên không\"},{\"link\":\"&genre=thanh-xuan\",\"name\":\"Thanh xuân\"},{\"link\":\"&genre=hanh-dong\",\"name\":\"Hành động\"},{\"link\":\"&genre=kinh-di\",\"name\":\"Kinh dị\"},{\"link\":\"&genre=gia-dinh\",\"name\":\"Gia Đình\"},{\"link\":\"&genre=bi-an\",\"name\":\"Bí ẩn\"},{\"link\":\"&genre=dan-quoc\",\"name\":\"Dân quốc\"},{\"link\":\"&genre=trong-sinh\",\"name\":\"Trọng sinh\"},{\"link\":\"&genre=cuoi-truoc-yeu-sau\",\"name\":\"Cưới trước yêu sau\"},{\"link\":\"&genre=khoa-hoc-vien-tuong\",\"name\":\"Khoa học viễn tưởng\"},{\"link\":\"&genre=hanh-dong-ly-ky\",\"name\":\"Hành động ly kỳ\"},{\"link\":\"&genre=hien-dai\",\"name\":\"Hiện đại\"},{\"link\":\"&genre=bao-thu\",\"name\":\"Báo thù\"},{\"link\":\"&genre=the-thao\",\"name\":\"Thể thao\"},{\"link\":\"&genre=em-be\",\"name\":\"Em bé\"},{\"link\":\"&genre=nguoc-luyen\",\"name\":\"Ngược luyến\"},{\"link\":\"&genre=sung-ngot\",\"name\":\"Sủng ngọt\"},{\"link\":\"&genre=hieu-lam\",\"name\":\"Hiểu lầm\"},{\"link\":\"&genre=khac\",\"name\":\"Khác\"},{\"link\":\"&genre=hao-mon\",\"name\":\"Hào môn\"},{\"link\":\"&genre=tim-nguoi-than\",\"name\":\"Tìm người thân\"},{\"link\":\"&genre=quan-phiet\",\"name\":\"Quân phiệt\"},{\"link\":\"&genre=vuon-len-tu-so-khong\",\"name\":\"Vươn lên từ số không\"},{\"link\":\"&genre=tai-hop\",\"name\":\"Tái hợp\"},{\"link\":\"&genre=su-tro-lai\",\"name\":\"Sự trở lại\"},{\"link\":\"&genre=tam-ly-tinh-cam\",\"name\":\"Tâm lý tình cảm\"},{\"link\":\"&genre=truong-thanh\",\"name\":\"Trưởng thành\"}]`;
}

function buildMenu(menuStr, type) { 
    var menuArray = JSON.parse(menuStr); 
    let menulist = []; 
    if (!menuArray || !Array.isArray(menuArray)) return menulist; 
    var typeStr = type !== undefined ? String(type).trim() : undefined; 
    for (var i = 0; i < menuArray.length; i++) { 
        var item = menuArray[i]; 
        if (!item) continue; 
        var link = item.link ? String(item.link).trim() : ""; 
        var name = item.name ? String(item.name).trim() : ""; 
        if (!link || !name) continue; 
        var menuItem = {}; 
        if (typeStr === "false") { 
            menuItem = { "slug": link, "title": name, "type": "Horizontal" }; 
        } else if (typeStr === "true") { 
            menuItem = { "slug": link, "title": name, "type": "Grid" }; 
        } else { 
            menuItem = { "slug": link, "name": name }; 
        } 
        menulist.push(menuItem); 
    } 
    return menulist; 
}

function _$(htmlOrBlock){ 
	if (htmlOrBlock && typeof htmlOrBlock === 'object' && htmlOrBlock.elements) { return htmlOrBlock; } var instance = { sourceHtml: typeof htmlOrBlock === 'string' ? htmlOrBlock : '', elements: Array.isArray(htmlOrBlock) ? htmlOrBlock : (htmlOrBlock ? [htmlOrBlock] : []), length: 0, find: function (selector) { if (selector.indexOf(',') !== -1) { var results = []; var selectors = selector.split(',').map(function (s) { return s.trim(); }); for (var s = 0; s < selectors.length; s++) { if (selectors[s] === "") continue; var subInstance = this.find(selectors[s]); for (var r = 0; r < subInstance.elements.length; r++) { var element = subInstance.elements[r]; if (results.indexOf(element) === -1) { results.push(element); } } } var multiInstance = _$(results); multiInstance.sourceHtml = this.sourceHtml; return multiInstance; } var results = []; var contentFilter = ""; if (selector.indexOf(":content(") !== -1) { var contentMatch = selector.match(/:content\((?:"([^"]*)"|'([^']*)'|([^)]*))\)/); if (contentMatch) { contentFilter = contentMatch[1] || contentMatch[2] || contentMatch[3] || ""; selector = selector.replace(/:content\((?:"[^"]*"|'[^']*'|[^)]*)\)/, ""); } } var attrNameFilter = ""; var attrValueFilter = ""; var attrOperator = "="; var hasAttrFilter = false; var attrMatch = selector.match(/\[([a-zA-Z0-9_-]+)\s*([*^$]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]"']*))\]/); if (attrMatch) { hasAttrFilter = true; attrNameFilter = attrMatch[1]; attrOperator = attrMatch[2]; attrValueFilter = attrMatch[3] || attrMatch[4] || attrMatch[5] || ""; selector = selector.replace(/\[.*?\]/, ""); } var notSelector = ""; if (selector.indexOf(":not(") !== -1) { var notMatch = selector.match(/:not\(([^)]+)\)/); if (notMatch) { notSelector = notMatch[1]; selector = selector.replace(/:not\([^)]+\)/, ""); } } var isFirstFilter = selector.indexOf(":first") !== -1; var isLastFilter = selector.indexOf(":last") !== -1; selector = selector.replace(/:first|:last/g, ""); var targetTagName = ""; var targetId = ""; var targetClasses = []; var selectorToParse = selector.trim(); if (selectorToParse !== "") { var idIndex = selectorToParse.indexOf('#'); if (idIndex !== -1) { var afterId = selectorToParse.substring(idIndex + 1); var nextDot = afterId.indexOf('.'); targetId = nextDot === -1 ? afterId : afterId.substring(0, nextDot); selectorToParse = selectorToParse.substring(0, idIndex) + (nextDot === -1 ? "" : "." + afterId.substring(nextDot + 1)); } var classParts = selectorToParse.split('.'); var possibleTag = classParts.shift(); if (possibleTag) { targetTagName = possibleTag.toLowerCase(); } targetClasses = classParts.filter(function (c) { return c.length > 0; }); } for (var i = 0; i < this.elements.length; i++) { var currentHtml = this.elements[i]; var pos = 0; var subResults = []; while ((pos = currentHtml.indexOf('<', pos)) !== -1) { if (currentHtml.charAt(pos + 1) === '/' || currentHtml.charAt(pos + 1) === '!') { pos++; continue; } var endOpenTag = -1; var insideQuote = false; var quoteChar = ''; for (var j = pos + 1; j < currentHtml.length; j++) { var char = currentHtml.charAt(j); if ((char === '"' || char === "'") && currentHtml.charAt(j - 1) !== '\\') { if (!insideQuote) { insideQuote = true; quoteChar = char; } else if (char === quoteChar) { insideQuote = false; } } if (char === '>' && !insideQuote) { endOpenTag = j; break; } } if (endOpenTag === -1) break; var fullOpenTag = currentHtml.substring(pos, endOpenTag + 1); var tagMatch = fullOpenTag.match(/^<([a-zA-Z0-9_-]+)/); var currentTagName = tagMatch ? tagMatch[1].toLowerCase() : ""; var isMatched = true; if (targetTagName && targetTagName !== currentTagName) { isMatched = false; } var getClassAttr = fullOpenTag.match(/class\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var classMatchStr = getClassAttr ? (getClassAttr[1] || getClassAttr[2] || getClassAttr[3] || "") : ""; var getIdAttr = fullOpenTag.match(/id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i); var idMatchStr = getIdAttr ? (getIdAttr[1] || getIdAttr[2] || getIdAttr[3] || "") : ""; if (isMatched && targetId && idMatchStr !== targetId) { isMatched = false; } if (isMatched && targetClasses.length > 0) { if (classMatchStr) { var currentClasses = classMatchStr.trim().split(/\s+/); for (var c = 0; c < targetClasses.length; c++) { if (currentClasses.indexOf(targetClasses[c]) === -1) { isMatched = false; break; } } } else { isMatched = false; } } if (isMatched && hasAttrFilter) { var actualValue = ""; if (attrNameFilter === "class") { actualValue = classMatchStr; } else if (attrNameFilter === "id") { actualValue = idMatchStr; } else { var getAnyAttr = fullOpenTag.match(new RegExp(attrNameFilter + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); actualValue = getAnyAttr ? (getAnyAttr[1] || getAnyAttr[2] || getAnyAttr[3] || "") : ""; } var attrExists = fullOpenTag.search(new RegExp(attrNameFilter + '\\s*=', 'i')) !== -1; if (!attrExists) { isMatched = false; } else { if (attrOperator === "=") { if (attrNameFilter === "class") { var classes = actualValue.trim().split(/\s+/); if (classes.indexOf(attrValueFilter) === -1) isMatched = false; } else if (actualValue !== attrValueFilter) { isMatched = false; } } else if (attrOperator === "*=") { if (actualValue.indexOf(attrValueFilter) === -1) isMatched = false; } else if (attrOperator === "^=") { if (actualValue.indexOf(attrValueFilter) !== 0) isMatched = false; } else if (attrOperator === "$=") { if (actualValue.slice(-attrValueFilter.length) !== attrValueFilter) isMatched = false; } } } if (isMatched) { var startTagPos = pos; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var scanPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && scanPos < currentHtml.length) { var nextOpen = currentHtml.indexOf(openStr, scanPos); var nextClose = currentHtml.indexOf(closeStr, scanPos); if (nextClose === -1) { scanPos = currentHtml.length; break; } if (nextOpen !== -1 && nextOpen < nextClose) { depth++; scanPos = nextOpen + openStr.length; } else { depth--; scanPos = nextClose + closeStr.length; if (depth === 0) endTagPos = nClose = nextClose + closeStr.length; } } } var foundBlock = currentHtml.substring(startTagPos, endTagPos); if (contentFilter) { var pureText = foundBlock.replace(/<[^>]+>/g, "").trim(); var keywords = contentFilter.split('|'); var isContentMatched = false; for (var k = 0; k < keywords.length; k++) { if (pureText.indexOf(keywords[k].trim()) !== -1) { isContentMatched = true; break; } } if (!isContentMatched) { pos = endTagPos; continue; } } if (notSelector) { var isNotClass = notSelector.indexOf('.') === 0; var isNotId = notSelector.indexOf('#') === 0; var notValue = notSelector.substring(1); var hasNot = false; if (isNotClass && classMatchStr.indexOf(notValue) !== -1) hasNot = true; if (isNotId && idMatchStr.indexOf(notValue) !== -1) hasNot = true; if (!hasNot) subResults.push(foundBlock); } else { subResults.push(foundBlock); } pos = endTagPos; } else { pos++; } } if (isFirstFilter && subResults.length > 0) subResults = [subResults[0]]; if (isLastFilter && subResults.length > 0) subResults = [subResults[subResults.length - 1]]; results = results.concat(subResults); } var newInstance = _$(results); newInstance.sourceHtml = this.sourceHtml || currentHtml; return newInstance; }, each: function (callback) { for (var i = 0; i < this.elements.length; i++) { var childInstance = _$(this.elements[i]); childInstance.sourceHtml = this.sourceHtml; callback.call(childInstance, i, this.elements[i]); } return this; }, eq: function (index) { if (index < 0) index = this.elements.length + index; var matchedElement = this.elements[index]; this.elements = matchedElement ? [matchedElement] : []; this.length = this.elements.length; return this; }, attr: function (attrName) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var getAttr = elem.match(new RegExp(attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return getAttr ? (getAttr[1] || getAttr[2] || getAttr[3] || "") : ""; }, html: function () { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) return elem.substring(start, end); return ""; }, text: function (separator) { if (this.elements.length === 0) return ""; var elem = this.elements[0]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); if (typeof separator === 'string') { return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(separator); } return pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); } return ""; }, textAll: function (separator) { if (this.elements.length === 0) return ""; var sep = typeof separator === 'string' ? separator : " "; var allTexts = []; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var start = elem.indexOf('>') + 1; var end = elem.lastIndexOf('</'); if (start > 0 && end > start) { var content = elem.substring(start, end); var pureText = content.replace(/<\/?[^>]+(>|$)/g, "\n"); var cleanText = pureText .split('\n') .map(function (item) { return item.trim(); }) .filter(function (item) { return item !== ''; }) .join(' '); if (cleanText !== '') { allTexts.push(cleanText); } } } return allTexts.join(sep); }, next: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx === -1) continue; var scanPos = idx + elem.length; var nextOpen = this.sourceHtml.indexOf('<', scanPos); if (nextOpen !== -1) { if (this.sourceHtml.charAt(nextOpen + 1) === '/') continue; var endOpenTag = this.sourceHtml.indexOf('>', nextOpen); if (endOpenTag === -1) continue; var fullOpenTag = this.sourceHtml.substring(nextOpen, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var startTagPos = nextOpen; var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var sPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && sPos < this.sourceHtml.length) { var nOpen = this.sourceHtml.indexOf(openStr, sPos); var nClose = this.sourceHtml.indexOf(closeStr, sPos); if (nClose === -1) break; if (nOpen !== -1 && nOpen < nClose) { depth++; sPos = nOpen + openStr.length; } else { depth--; sPos = nClose + closeStr.length; if (depth === 0) endTagPos = nClose + closeStr.length; } } } results.push(this.sourceHtml.substring(startTagPos, endTagPos)); } } var nextInstance = _$(results); nextInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, parent: function () { var results = []; if (!this.sourceHtml) return this; for (var i = 0; i < this.elements.length; i++) { var elem = this.elements[i]; var idx = this.sourceHtml.indexOf(elem); if (idx <= 0) continue; var scanPos = idx - 1; while (scanPos >= 0) { var openTagPos = this.sourceHtml.lastIndexOf('<', scanPos); if (openTagPos === -1) break; if (this.sourceHtml.charAt(openTagPos + 1) !== '/' && this.sourceHtml.charAt(openTagPos + 1) !== '!') { var endOpenTag = this.sourceHtml.indexOf('>', openTagPos); if (endOpenTag !== -1 && endOpenTag > openTagPos) { var fullOpenTag = this.sourceHtml.substring(openTagPos, endOpenTag + 1); var spacePos = fullOpenTag.indexOf(' '); var currentTagName = (spacePos === -1) ? fullOpenTag.substring(1, fullOpenTag.length - 1).toLowerCase() : fullOpenTag.substring(1, spacePos).toLowerCase(); var endTagPos = endOpenTag + 1; var selfClosingTags = ['img', 'source', 'input', 'br', 'hr', 'link', 'meta']; if (selfClosingTags.indexOf(currentTagName) === -1 && fullOpenTag.indexOf('/>') === -1) { var depth = 1; var sPos = endOpenTag + 1; var openStr = '<' + currentTagName; var closeStr = '</' + currentTagName + '>'; while (depth > 0 && sPos < this.sourceHtml.length) { var nOpen = this.sourceHtml.indexOf(openStr, sPos); var nClose = this.sourceHtml.indexOf(closeStr, sPos); if (nClose === -1) break; if (nOpen !== -1 && nOpen < nClose) { depth++; sPos = nOpen + openStr.length; } else { depth--; sPos = nClose + closeStr.length; if (depth === 0) endTagPos = nClose + closeStr.length; } } } if (endTagPos >= idx + elem.length) { var parentBlock = this.sourceHtml.substring(openTagPos, endTagPos); if (results.indexOf(parentBlock) === -1) results.push(parentBlock); break; } } } scanPos = openTagPos - 1; } } var parentInstance = _$(results); parentInstance.sourceHtml = this.sourceHtml; this.elements = results; this.length = results.length; return this; }, closest: function (selector) { var results = []; if (!this.sourceHtml || this.elements.length === 0) return _$([]); for (var i = 0; i < this.elements.length; i++) { var currentElem = this.elements[i]; var currentObj = _$(currentElem); currentObj.sourceHtml = this.sourceHtml; var selfCheck = _$(this.sourceHtml).find(selector); var isSelfMatched = false; for (var s = 0; s < selfCheck.elements.length; s++) { if (selfCheck.elements[s] === currentElem) { isSelfMatched = true; break; } } if (isSelfMatched) { if (results.indexOf(currentElem) === -1) results.push(currentElem); continue; } var parentObj = currentObj.parent(); while (parentObj.elements.length > 0) { var parentElem = parentObj.elements[0]; var checkMatch = _$(this.sourceHtml).find(selector); var isMatched = false; for (var j = 0; j < checkMatch.elements.length; j++) { if (checkMatch.elements[j] === parentElem) { isMatched = true; break; } } if (isMatched) { if (results.indexOf(parentElem) === -1) results.push(parentElem); break; } parentObj = parentObj.parent(); } } var closestInstance = _$(results); closestInstance.sourceHtml = this.sourceHtml; return closestInstance; } }; instance.length = instance.elements.length; return instance; };
