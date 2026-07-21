function parseMovieDetail(htmlContent, url) {
    try {
        var $doc = _$(htmlContent);
        var id = $doc.find("link[rel='canonical']").attr("href") || $doc.find("meta[property='og:url']").attr("content");
        var title = $doc.find("h1[itemprop='name']").text() || $doc.find("h1.title").text();
        var description = $doc.find(".Description, #film-info-desc").text();
        var posterUrl = $doc.find("img.poster, .attachment-img-mov-md").attr("src") || $doc.find("img.poster").attr("data-src");

        var genres = $doc.find("span:content('Thể loại:')").parent().find("a").text(", ");
        var countries = $doc.find("span:content('Quốc gia:')").parent().find("a").text(", ");
        var year = parseInt($doc.find("span:content('Năm phát hành:')").parent().find("a").text()) || 0;

        var statusNode = $doc.find("span:content('Trạng thái:')").parent();
        var status = statusNode.text().replace("Trạng thái:", "").trim();

        var episode_current = "";
        if (status) {
            var epMatch = /(Tập \d+|Full|Hoàn Tất)/i.exec(status);
            if (epMatch) episode_current = epMatch[1];
        }

        // ==========================================
        // CẢI TIẾN TRÍCH XUẤT TẬP PHIM
        // ==========================================
        var episodes = [];
        var seenEp = {};
        
        $doc.find("a").each(function() {
            var epUrl = this.attr("href");
            if (!epUrl) return;
            
            // Tìm các link chứa 'tap-' hoặc 'tap=' (định dạng URL tập của AnimeVietSub)
            if (epUrl.indexOf('tap-') !== -1 || epUrl.indexOf('tap=') !== -1) {
                var epName = this.text().trim();
                
                // Nếu text rỗng, thử lấy qua thuộc tính title
                if (!epName) epName = this.attr("title").trim();
                
                // Lọc bỏ những thẻ a không hợp lệ (tên quá dài không phải là tập)
                if (epName && epName.length < 25) {
                    if (epUrl.indexOf('http') !== 0) {
                        epUrl = BASEURL + (epUrl.startsWith('/') ? '' : '/') + epUrl;
                    }
                    
                    // Làm sạch tên tập để làm key khử trùng lặp (ví dụ: "Tập 01" -> "01")
                    var cleanName = epName.replace(/tập|tạp/gi, "").trim();
                    if (!cleanName) cleanName = epName;
                    
                    // Khử trùng lặp dựa trên Tên Tập (Rất quan trọng khi phim có nhiều Server)
                    if (!seenEp[cleanName]) {
                        seenEp[cleanName] = true;
                        episodes.push({ 
                            id: epUrl, 
                            name: epName, 
                            slug: epUrl 
                        });
                    }
                }
            }
        });

        // Sắp xếp tập phim thông minh (Bắt đúng số 100.5, 01_Part1...)
        episodes.sort(function(a, b) {
            var matchA = a.name.match(/[\d.]+/);
            var matchB = b.name.match(/[\d.]+/);
            var numA = matchA ? parseFloat(matchA[0]) : 0;
            var numB = matchB ? parseFloat(matchB[0]) : 0;
            return numA - numB;
        });

        var servers = [];
        if (episodes.length > 0) {
            servers.push({
                name: "AnimeVietSub",
                episodes: episodes
            });
        }
        // ==========================================

        var slug = "";
        if (id) {
            var slugMatch = /\/phim\/([^/]+)/.exec(id);
            slug = slugMatch ? slugMatch[1] : id;
        }
        if (!slug) {
            var slugMatch2 = /\/phim\/([^/]+)/.exec(htmlContent);
            slug = slugMatch2 ? slugMatch2[1] : "";
        }

        var extra = "";
        // Kích hoạt việc crawl ngầm trang xem-phim.html nếu đang ở trang chi tiết
        var isPlayPage = (id && id.indexOf("xem-phim") > -1) || htmlContent.indexOf("window.PLAYER_DATA") > -1;
        if (!isPlayPage && slug && slug !== "error") {
            extra = BASEURL + "/phim/" + slug + "/xem-phim.html";
        }

        return JSON.stringify({
            id: slug,
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            year: year,
            servers: servers,
            episode_current: episode_current,
            lang: "Vietsub",
            quality: "FHD",
            category: genres,
            country: countries,
            status: status,
            extra: extra
        });
    } catch (e) {
        return JSON.stringify({ id: "error", title: "", servers: [] });
    }
}
