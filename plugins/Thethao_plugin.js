// ... [Giữ nguyên phần getManifest, getHomeSections, getPrimaryCategories] ...

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'VTV', slug: 'vtv' },
        { name: 'Thể Thao', slug: 'the-thao' },
        { name: 'Khác', slug: 'khac' }
    ]);
}

// =============================================================================
// PARSER: TỰ ĐỘNG CHIA FOLDER
// =============================================================================

function parseListResponse(apiResponseJson, apiUrl) {
    try {
        var lines = apiResponseJson.split('\n');
        var allItems = [];
        var currentName = "";

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.indexOf('#EXTINF:') === 0) {
                currentName = line.substring(line.lastIndexOf(',') + 1);
            } else if (line.length > 0 && line.indexOf('#') !== 0 && (line.indexOf('http') === 0 || line.indexOf('//') === 0)) {
                
                // --- LOGIC CHIA FOLDER ---
                var folder = "Khác";
                var upName = currentName.toUpperCase();
                
                if (upName.indexOf("VTV") !== -1) {
                    folder = "VTV";
                } else if (upName.indexOf("BONG DA") !== -1 || upName.indexOf("XOILAC") !== -1 || upName.indexOf("K+") !== -1 || upName.indexOf("THE THAO") !== -1) {
                    folder = "Thể Thao";
                }
                // -------------------------

                allItems.push({
                    id: line,
                    title: currentName,
                    posterUrl: "https://via.placeholder.com/200x200?text=" + folder,
                    backdropUrl: "",
                    year: 2026,
                    quality: "LIVE",
                    episode_current: folder, // Dùng để hiển thị tên Folder/Nhóm
                    lang: "Việt Nam"
                });
            }
        }

        // Lọc theo slug (nếu app truyền slug vào apiUrl)
        var cat = extractParamFromUrl(apiUrl, 'cat'); // Hàm hỗ trợ bạn đã có
        if (cat) {
            allItems = allItems.filter(function(item) {
                if (cat === 'vtv') return item.episode_current === 'VTV';
                if (cat === 'the-thao') return item.episode_current === 'Thể Thao';
                return item.episode_current === 'Khác';
            });
        }

        return JSON.stringify({
            items: allItems,
            pagination: { currentPage: 1, totalPages: 1, totalItems: allItems.length, itemsPerPage: 500 }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}
