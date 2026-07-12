// =============================================================================
// VAAPP Plugin-Crophim Pro (Đồng bộ cấu trúc 100% theo chuẩn RophimFake)
// Tên file bắt buộc khi lưu:s crophim_plugin.js
// =============================================================================
BASEURL = "https://abci.media";
function getManifest() {
    return JSON.stringify({
        "id": "phimhayok",          
        "name": "phimhayok",
        "description": "Nguồn xem phim Online ổn định",
        "version": "1.1",             
        "baseUrl": "https://abci.media",
        "iconUrl": "https://raw.githubusercontent.com/alokillgtv-gif/VAXAPPSCRIPT/main/img/phimhayok.jpg",
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "auto"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "chuyen-muc/motphim", "title": "Phim Mới", "type": "Grid"}
    ]);
}

function getPrimaryCategories() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify(menulist);
}

// ĐÃ SỬA: Lỗi cú pháp khai báo biến trong JSON.stringify
function getFilterConfig() {
    var listurl = getLISTmenu();
    var menulist = buildMenu(listurl);
    return JSON.stringify({
        sort: [
            { name: 'Phim Lẻ', value: 'phim-le' },
            { name: 'Phim Bộ', value: 'phim-bo' },
            { name: 'Phim Ngắn', value: 'phim-ngan' }
        ],
        category: menulist
    });
}

// =============================================================================
// URL GENERATION (Bóc tách slug sạch theo khuôn mẫu mới)
// =============================================================================

function getUrlList(slug, filtersJson) {
    if (slug && slug.indexOf("http") !== -1) {
        // Nếu có JSON và có page, ta có thể chèn page vào link (tùy bạn cấu hình, ở đây trả về slug gốc để tránh lỗi)
        return slug;
    }
    var path = "";
    // Thay thế các key không có dấu nháy bằng key có dấu nháy để sửa lỗi JSON lỏng lẻo
    if (filtersJson) {
        var fixedJson = filtersJson.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        var filters = JSON.parse(fixedJson);
        page = parseInt(filters.page) || 1;
        // Chỉ lấy category từ JSON nếu không truyền slug vào hàm
        // https://y2mate.ink/?s=&genres=bao-thu&regions=&years=&categories=phim-ngan
        if (filters.category || filters.sort) {
            if (filters.category) {
                if (Array.isArray(filters.category) && filters.category.length > 0) {
                    path += "&genres=" + filters.category[0].slug;
                } else if (typeof filters.category === 'string') {
                    path += "&genres=" + filters.category;
                }
            }
            if (filters.sort) {
                if (Array.isArray(filters.sort) && filters.sort.length > 0) {
                    path += "&categories=" + filters.sort[0].value;
                } else if (typeof filters.sort === 'string') {
                    path += "&categories=" + filters.sort;
                }
            }
            //console.log("sort");
            return BASEURL + "/page/" + page + "/?s=" + path;
            
        }
        if (slug === "phim-le" || slug === "phim-bo" || slug === "phim-ngan") {
            //console.log("menu");
            return BASEURL + "/page/" + page + "/?s=&categories=" + slug;
        }
        if(slug.indexOf("chuyen-muc") > -1){
            return BASEURL  + "/" + slug + "/page/" + page;
        }
        //console.log("main");
        return BASEURL + "/page/" + page + "/?s=&genres=" + slug;
    }
    else {
        if (slug.indexOf("http") == -1) {
            if (slug === "phim-le" || slug === "phim-bo" || slug === "phim-ngan") {
                //console.log("menu");
                return BASEURL + "/?s=&categories=" + slug;
            }
            return BASEURL + "/?s=&genres=" + slug;
        }
        else {
            return slug
        }
    }
}

/*

//var BASEURL = "https://y2mate.ink";
// Test trường hợp của bạn (slug = "kinh-di", có kèm filter JSON)
//var filtersJson = '{"page":5,"category":[{"slug":"am-nhac","name":"Âm Nhạc"}],"sort":[{"name":"Phim Lẻ","value":"phim-le"}]}';
//console.log(getUrlList("kinh-di", filtersJson)); 
// Kết quả chuẩn: https://y2mate.ink/page/5?genres=kinh-di&categories=phim-le
// (genres "kinh-di" truyền ngoài vào đã ghi đè "am-nhac" trong JSON theo đúng logic ưu tiên slug)
// Test trường hợp không có filter JSON
//var filtersJson = '{"page":6}';
//console.log(getUrlList("https://y2mate.ink/?s=b%C3%A1o+th%C3%B9", filtersJson));
// Kết quả chuẩn: https://y2mate.ink?categories=phim-bo

*/
function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
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

function parseListResponse(html) {
    try {
        var items = [];
        var regexList = new RegExp('<div class="module-item-pic"><a\\s+href="([^"]+)"\\s+title="([^"]+)"[\\s\\S]*?<img[^>]*data-src="([^"]+)"', 'g');
        var matchList;
        
        while ((matchList = regexList.exec(html)) !== null) {
          if(matchList[3]){
            var cleanThumb = matchList[3].replace(/&amp;/g, '&'); 
            items.push({
                "id": matchList[1],          
                "title": matchList[2].trim(), 
                "posterUrl": cleanThumb,  
                "backdropUrl": cleanThumb
            });
          }
        }
        
        var totalPages = 1; 
        var currentPage = 1; 

        if (html && html.indexOf('id="page"') > -1) {
            var pageSectionBox = html.match(new RegExp('<div id="page">([\\s\\S]*?)<\/div>', 'i'));
            if (pageSectionBox && pageSectionBox[1]) {
                var pageHtml = pageSectionBox[1];
                var currentMatch = pageHtml.match(new RegExp('class="[^"]*page-current[^"]*">(\\d+)<', 'i'));
                if (currentMatch) {
                    currentPage = parseInt(currentMatch[1], 10);
                }

                var pageNumbers = [];
                var pageRegex = new RegExp('>(\\d+)<\\/a>', 'g');
                var pageMatch;
                
                while ((pageMatch = pageRegex.exec(pageHtml)) !== null) {
                    pageNumbers.push(parseInt(pageMatch[1], 10));
                }

                if (pageNumbers.length > 0) {
                    totalPages = Math.max.apply(Math, pageNumbers);
                }
                if (totalPages < currentPage) {
                    totalPages = currentPage;
                }
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";
    var year = 2026;
    var direc = "????";
    var cast = "????";
    var status = "????";
    var duration = "1:09:00 | 16 | 16";
    var rating = "????";
	  var servers = [{}];
  try {
    
    rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
    
    rmatch = html.match(/video-info-aux[\s\S]*?(\d+)[\s\S]*?<\/div>/i);
    if (rmatch && rmatch[1]) { year = rmatch[1]; }
    
    rmatch = html.match(/video-info-actor[\s\S]*?title="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { direc = rmatch[1]; }
    
    rmatch = html.match(/Trạng thái[\s\S]*?video-info-item">([\s\S]*?)<\/div>/i);
    if (rmatch && rmatch[1]) { status = rmatch[1].trim(); }
    
    rmatch = html.match(/Thời lượng[\s\S]*?video-info-item">([\s\S]*?)<\/div>/i);
    if (rmatch && rmatch[1]) { duration = rmatch[1].trim(); }
    
    var split = duration.replace(/\s|\s+/gi,"").split("|");
	  var stime = split[0];
	  var firstEP = Number(split[1]);
	  var lastEP = Number(split[1]);
	  duration = "Độ Dài: " + stime + ", Tập: " + firstEP + "/" + lastEP;
    

// Bước 1: Tìm vùng HTML nằm trong class video-info-actor
  const containerRegex = /Diễn viên[\s\S]*?class="[^"]*video-info-actor[^"]*"[\s\S]*?<\/div>/;
  const containerMatch = html.match(containerRegex);

if (containerMatch) {
    const actorHtml = containerMatch[0]; // Chỉ lấy đoạn HTML bên trong div này
    
    // Bước 2: Tìm tất cả tên diễn viên trong đoạn HTML đã được giới hạn
    const actorRegex = />([^<]+)<\/a>/g;
    const matches = [...actorHtml.matchAll(actorRegex)];
    
    const actors = matches.map(match => match[1]);
    cast = actors.join("").replace(/\n/gi,",").replace(/,,/gi,", ")
    // Kết quả: [ 'Kiều Minh Tuấn', 'Mạc Văn Khoa', 'Mỹ Uyên', 'Ngọc Trinh', 'Trương Thế Vinh' ]
} 

	var rmatch = html.match(/video-info-footer display[\s\S]*?href="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1] }
	
	if(lurl.indexOf("full") > -1){
		servers = [
            {
                name: "Server",
                episodes: [
                    { id: lurl, name: "Xem Ngay", slug: "full" }
                ]
            }
        ];
	}
	else{
	var surl = lurl.match(/([\s\S]*?\/tap-)(\d+)([\s\S]*)/);
    var furl = surl[1];
    var eurl = surl[3];
    var episodes = [];
    for(var j = 1;j < firstEP;j++){
      var itemEp = {};
      itemEp.id = furl + j + eurl;
      itemEp.name = "Tập " + j;
      itemEp.slug = "tap-" + j;
      episodes.push(itemEp);
    }
    servers = [
            {
                name: "Server",
                episodes: episodes
            }
    ];
	}       
	var streamUrl = "";
	var rmatch = html.match(/id="streaming-sv"[^>]*?data-link="(https?:[^"]*)"/i);
    if (rmatch && rmatch[1]) { streamUrl = rmatch[1]; }
    return JSON.stringify({
        id: streamUrl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes + "\r\n\r\n\r\n" + streamUrl + "\r\n\r\n\r\n" + JSON.stringify(servers),
        servers: servers,
        quality: "HD",
        year: year,
        status: status,
        duration: duration,
        casts: cast,
        director: direc
    });
  }
  catch (e) {
        return JSON.stringify({
        id: lurl,
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
        director: direc
      });
    }
}
//<link rel="preload" href="https://video3.cdnsolutions.media/key=kePlMtN+ADhubUR5+oDV3A,end=1782846000/data=2405:4802:918e:9690:213f:c9b0:ee12:58e-dvp/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:,1920x1080:1080p:/029/485/972/_TPL_.av1.mp4.m3u8" as="fetch" crossorigin="true">
function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        
        var rmatch = html.match(/id="streaming-sv"[^>]*?data-link="(https?:[^"]*)"/i);
   	    if (rmatch && rmatch[1]) { streamUrl = rmatch[1]; }
		
          return JSON.stringify({
              url: streamUrl,
              "headers": {
                "Referer": BASEURL,
                "Origin": BASEURL,
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
                // Đánh lừa thuật toán Client Hints của tường lửa
                "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                "Sec-Ch-Ua-Mobile": "?1",
                "Sec-Ch-Ua-Platform": '"Android"',
                
                // Khai báo kiểu dữ liệu được chấp nhận giống như trình duyệt thật
                "Accept": "*/*",
                "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
                "X-Requested-With": "com.android.chrome"
            }
          });
          } catch (error) {
              return JSON.stringify({ url: "", headers: {} });
          }
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
phim-le@@Phim Lẻ
phim-bo@@Phim Bộ
phim-ngan@@Phim Ngắn
phim-18@@Phim 18+
hai-huoc@@Hài Hước
hanh-dong@@Hành Động
hoat-hinh@@Hoạt Hình
kinh-di@@Kinh Dị
kich-tinh@@Kịch Tính
am-nhac@@Âm Nhạc
anime@@Anime
bao-thu@@Báo Thù
bi-an@@Bí Ẩn
boy-love@@boy love
cao-boi-mien-tay@@Cao Bồi Miền Tây
chiem-huu@@Chiếm Hữu
chien-tranh@@Chiến Tranh
chinh-kich@@Chính Kịch
chuong-trinh-truyen-hinh@@Chương Trình Truyền Hình
co-trang@@Cổ Trang
cuoi-gia-yeu-that@@Cưới Giả Yêu Thật
cuoi-truoc-yeu-sau@@Cưới Trước Yêu Sau
du-hanh-thoi-gian@@Du Hành Thời Gian
gay-can@@Gây Cấn
gia-dinh@@Gia Đình
gia-tuong@@Giả Tưởng
he-thong@@Hệ Thống
hinh-su@@Hình Sự
hoc-duong@@Học Đường
khoa-hoc@@Khoa Học
kinh-dien@@Kinh Điển
lang-man@@Lãng Mạn
lgbt@@LGBT
lich-su@@Lịch Sử
mien-tay@@Miền Tây
nam-than@@Nam Thần
ngoai-tinh@@Ngoại Tình
ngon-tinh@@Ngôn Tình
nguoc-luyen-tan-tam@@Ngược Luyến Tàn Tâm
nu-cuong-su-nghiep@@Nữ Cường Sự Nghiệp
phan-boi@@Phản Bội
phieu-luu@@Phiêu Lưu
tai-lieu@@Tài Liệu
tam-ly@@Tâm Lý
than-thoai@@Thần Thoại
the-thao@@Thể Thao
tien-hiep@@Tiên Hiệp
tinh-1-dem@@Tình 1 Đêm
tinh-cam@@Tình Cảm
toi-pham@@Tội Phạm
tong-tai@@Tổng Tài
tra-thu@@Trả thù
trao-than-phan@@Tráo Thân Phận
tre-em@@Trẻ Em
trong-sinh@@Trọng Sinh
trung-sinh@@Trùng Sinh
vien-tuong@@Viễn Tưởng
vo-thuat@@Võ Thuật
vua-yeu-vua-han@@Vừa Yêu Vừa Hận
xuyen-khong@@Xuyên Không
xuyen-sach@@Xuyên Sách
`
}


// Hàm tách menu bằng list-ĐÃ TỐI ƯU: Không dùng Regex lặp để tránh treo app
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

function trimHTML(inhtml) {
    var result = inhtml.replace(/<[^>]*>/g, '');
    result = result.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n|\r/gi, '-')
        .replace(/\s+/gi, ' ')
        .replace(/^,+|,+$/g, "");
    return result;
}