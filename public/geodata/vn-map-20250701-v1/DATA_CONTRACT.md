# Hợp đồng dữ liệu

## Các file

| File | Ý nghĩa | Sử dụng |
|---|---|---|
| `vietnam-34-full.geojson` | 34 features, geometry nguồn; metadata được làm sạch, thêm Côn Đảo có ghi nguồn | Tham chiếu chi tiết/tạo tiles |
| `vietnam-34-light.geojson` | 34 features giản lược tolerance 0,0008 độ | Bản đồ tổng quan |
| `mainland-and-coastal-reference.geojson` | Các thành phần có centroid ≤ 110°Đ | Lớp tham chiếu gần đất liền, **không phải land mask được chứng nhận** |
| `offshore-island-reef-reference.geojson` | Thành phần có centroid > 110°Đ từ Đà Nẵng/Khánh Hòa | Nét tham chiếu đảo/bãi/rạn; `buildable=false` |
| `con-dao-supplement.geojson` | 11 thành phần Côn Đảo từ nguồn GIS trước 2025, đã có trong file full | Ghi vết bổ sung; không render thêm lần nữa nếu đã dùng full/light |
| `provinces.json` | 34 vùng, ID, tên, bbox, điểm đặt số, màu và tên cũ | Search, selection, state |
| `provinces-34.csv` | Danh mục dễ đọc, UTF-8 BOM | Import/kiểm tra |
| `old-63-to-new-34.csv` | 63 tên trước sáp nhập → 34 ID mới | Tra tên cũ; không tạo ranh giới cũ |
| `islands.json` | Phú Quốc polygon; quần đảo bbox và điểm đặt nhãn | Quick-focus và thông tin |
| `viewer-map.json` | SVG core và dữ liệu cho bản xem offline | Tái dựng preview; không phải payload bắt buộc của game |

## Trường cần giữ

- `id`: `vn-*`, ổn định trong game; không phải mã hành chính nhà nước.
- `number`: số chú giải 1–34; không được dùng làm primary key cho dữ liệu thành phố lâu dài.
- `snapshot`: `2025-07-01`. Migrations khi thay snapshot phải có bảng chuyển ID và kiểm tra save cũ.
- `kind2025`: `province` hoặc `city`, chỉ đúng với mốc này.
- `mergedFrom2025`: tên đơn vị trước sáp nhập, dùng cho tìm kiếm.
- `sourceCode`: giá trị Ma gốc, chỉ dùng truy xuất nguồn; `sourceCodeIsOfficial=false`.
- `labelAnchorWgs84`: điểm bên trong polygon lớn nhất gần đất liền, dùng đặt số. Không phải thủ phủ hoặc tọa độ tâm tỉnh hành chính.
- `mainlandBounds`: bbox polygon lớn nhất, để zoom vào phần gần đất liền. Đây không phải bbox bao mọi đảo.
- `fullBounds`: bbox tất cả geometry, có thể rất lớn do quần đảo.

GeoJSON geometry là Polygon/MultiPolygon và có thể chứa holes. Không chỉ lấy ring đầu tiên rồi bỏ đảo. WGS84 `[longitude,latitude]`, không đảo hai giá trị. Lớp ngoài khơi không có tên từng đảo và không mô tả tình trạng kiểm soát thực địa.

## Tọa độ hiển thị

Bản xem dùng:

`x = ox + (longitude − lonMin) × cos(16°) × scale`

`y = oy + (latMax − latitude) × scale`

Phép chiếu này chỉ dùng màn hình bản đồ. Muốn game ở đơn vị mét cần phép chiếu cục bộ/origin phù hợp. Không lưu pixel SVG thành vị trí địa lý. Các marker của quần đảo chỉ là điểm đặt chữ; click/quản lý đảo phải dùng geometry và metadata được kiểm chứng.

Mọi phần ngoài khơi được coi là chưa xác minh xây dựng. Bbox không mang ý nghĩa chủ quyền, lãnh hải hoặc đất nổi. Chỉ enable xây dựng sau khi pipeline land mask/DEM riêng xác nhận.

## Gợi ý state sau tích hợp

`{ provinceId, mapSnapshot, originWgs84, localProjection, playableExtentMeters, terrainSourceVersion, cityState, schemaVersion }`

Đây là gợi ý schema, không phải migration Supabase đã chạy. Province boundary/label và địa hình/chơi game là các lớp khác nhau. Đọc lệnh Codex để triển khai vào kiến trúc thật của repository.
