# Bản đồ Việt Nam — tích hợp 10/10/2026

## Code và dữ liệu hoạt động

- `src/game/geography/chooser.js`: màn quốc gia trong game thật, 34 địa phương / 1.608 thành phần polygon nhẹ, chọn bằng hình học hoặc danh sách; Enter/Space; kéo chuột, cuộn, nút zoom/reset, phím mũi tên. Có xử lý hai pointer để pinch, chưa thử trên điện thoại vật lý.
- `national.js`, `overview.js`: GeoJSON nhẹ nguyên văn 1.924.832 byte, tải khi mở màn chọn; toàn bộ Polygon/MultiPolygon và holes giữ nguyên. Equirectangular, vĩ tuyến chuẩn 16°B. Không dời tọa độ đảo. Những thành phần ngoài khơi vẽ nét tham chiếu, không tô làm đất xây.
- Ranh đầy đủ 14.088.803 byte chỉ tải khi bấm “Tải ranh chi tiết”, có giới hạn kích thước/checksum/lỗi và trạng thái thử lại. Dữ liệu GIS là file public riêng, không import vào JS bundle. Đóng chooser giải phóng DOM và các handler chứa dữ liệu này.
- `provinces.json`, `old-63-to-new-34.csv`: 34 ID `vn-*`, 28 tỉnh / 6 thành phố theo **2025-07-01**; tra cả 63 tên cũ, có/không dấu, dấu gạch và khoảng trắng. Bảng `src/config/vietnam-province-ids.json` nối ID mới với mã của 36 gói địa hình trước đây; mã gói không bị đổi, đăng ký địa phương vẫn dùng API regionId cũ.
- Phú Quốc → An Giang; Hoàng Sa → Đà Nẵng; Trường Sa → Khánh Hòa; Côn Đảo → TP. Hồ Chí Minh. Bốn nút quick-focus và bốn ô xem riêng có ghi **tỷ lệ riêng**. Phú Quốc/Côn Đảo dùng geometry đi kèm trong inset; quần đảo dùng các thành phần nguồn ở tọa độ gốc. 11 thành phần Côn Đảo đã trong full/light, không render supplement lần nữa.
- `city.js`, `local-projection.js`, `save-metadata.js`, `data.js`: khu thành phố tách khỏi bản đồ quốc gia. Chọn 36 địa điểm có DEM/OSM đã chuẩn bị trước; khung tham khảo 12,8 km, khu xây 1,28 × 1,28 km, ô 20 m. UTM 48N hoặc 49N phù hợp từng gói. Phú Quốc có khu `91-island`; **chưa có DEM/đất nổi đã kiểm chứng ở Hoàng Sa, Trường Sa, Côn Đảo, nên không tạo khu xây ở đó**.

## Bản lưu và Supabase

`world.geography` lưu provinceId `vn-*`, provinceCode cũ, mapSnapshot, mapVersion, worldOriginWgs84 tại góc NW của khu xây, localProjection (EPSG, origin UTM, trục east-south, mét), terrainSourceVersion. Anchor vẫn là tâm khu. Metadata đi cùng JSON cityState trong luồng Supabase hiện hữu; schemaVersion vẫn 6, RLS/API/quyền tài khoản không đổi.

Migration lúc đọc đổi provinceId 2 chữ số thành vn-* và bổ sung metadata; giữ nguyên regionId, raster, công trình, tiền, EXP, đồng hồ và hành trình. Bản dự phòng giữ payload cũ. Không cần thay bảng SQL cho các trường JSONB này. Kiểm tra roundtrip và migration trên **36 khu** đạt; chưa chạy lại tài khoản A/B trên Supabase thật trong chặng này, nên không lấy unit test thay bằng bằng chứng live cloud.

## Bằng chứng kiểm tra

- `npm test`: **133/133**, không skip, 198,34 giây. Sau sửa tìm kiếm dấu gạch/khoảng trắng, chạy lại 4 test national map. Repository không có script lint/typecheck; không tuyên bố đã chạy hai script đó.
- Đủ 34 tên/ID, 63 tên cũ, checksum 6 payload, số thành phần full/light, holes, 11 component Côn Đảo không trùng, cha của 4 đảo/quần đảo, offshore buildable=false, lỗi 503/checksum/oversize, legacy save migration.
- Sai số khứ hồi mét ↔ WGS84 trên 36 khu và 3 điểm mỗi khu: max **0,000084222 m**. So sánh UTM tính từ anchor với utmCenter gói: max **0,000046571 m**. Đây là sai số công thức, không phải độ chính xác địa hình hay ranh địa chính.
- Trình duyệt IAB: chọn Bắc Giang → Bắc Ninh; bốn quick-focus; chọn multipart Đà Nẵng bằng Enter; panel báo ngoài khơi cấm xây; kéo viewBox, zoom/reset; tải full thành công.
- Phú Quốc: chọn gói DEM thật EPSG:32648, tạo vốn 100 triệu; thêm đường (6 triệu) và phân khu (3,125 triệu), còn **90,875 triệu**, lưu local, reload/mở lại giữ tiền, 5 ô đường, thời gian **87 giây game**, tạm dừng, đúng An Giang / `91-island`.
- Responsive **390 × 844**: document scrollWidth=clientWidth=390, dialog 374 px; danh sách 34 vùng và controls không tràn ngang. Chưa xác minh pinch trên thiết bị cảm ứng thật.
- PNG tham chiếu đã xem; đọc nguồn HTML preview. Browser URL policy chặn `file://`, không mở được chính preview HTML offline qua công cụ; kiểm tra browser thực hiện trên màn game đã tích hợp.

Ảnh: `national-map-overview.png`, `national-map-mobile.png`, `national-map-phu-quoc-playable.png`. Ảnh tổng quan đã cập nhật sau chỉnh kích thước chú giải và ô phóng to.

## Nguồn và giới hạn đã xác minh

GIS: Nguyễn Duy Liêm (2025), [Free-GIS-Data, commit ccb9f4a](https://github.com/nguyenduy1133/Free-GIS-Data/tree/ccb9f4ae992418bfeefd06da1eb42d0249632176). Đã đọc README tại commit: cho sử dụng công khai miễn phí, yêu cầu ghi nguồn; không gán giấy phép MIT cho GIS. Nguồn cung cấp theo hiện trạng, không chứng nhận đo đạc pháp lý. Các file tích hợp copy nguyên văn từ pack và có SHA trong manifest.

Tên/mốc: [Chính phủ — 34 đơn vị](https://xaydungchinhsach.chinhphu.vn/chi-tiet-34-don-vi-hanh-chinh-cap-tinh-tu-12-6-2025-119250612141845533.htm), [Nghị quyết 202/2025/QH15](https://vanban.chinhphu.vn/?docid=213930&pageid=27160). Đã mở nguồn nghị quyết 1659, 1667, 1685 cho nhãn quần đảo/Côn Đảo. Metadata Đồng Tháp đã sửa lỗi nhãn Lạng Sơn trong source; không tự sửa đỉnh GIS.

Pack quốc gia **không có DEM, độ sâu biển, đường/sông hay land mask**. Địa hình playable là pipeline OSM/Mapzen trước đây, không phải dữ liệu tự sinh từ pack; xem `vietnam-map.md`. Độ cao DEM ~30–38 m được nội suy sang 20 m, nước nội địa gần đúng, không mô phỏng thủy văn/triều. Không chọn điểm tùy ý rồi tạo noise gọi là địa hình Việt Nam thật. Chưa mở xây cả tỉnh hay toàn khung 12,8 km. Gói nhẹ simplify từng feature, không chứng nhận topology chung chính xác ở zoom sâu.

Nhãn hành chính Hoàng Sa/Trường Sa theo hệ thống Việt Nam tại mốc 2025; chủ quyền có tranh chấp quốc tế. Không mô tả kiểm soát thực địa, không vẽ EEZ/lãnh hải từ bbox. Thiếu dữ liệu cần bổ sung theo pipeline, không cần API key chỉ để xem bản đồ.

Tình trạng GitHub/Vercel phải dựa vào commit/push và deployment Ready thực tế; không lấy `npm run build` làm chứng nhận deployment.
