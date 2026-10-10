# Tài nguyên Build City 26

| Tài nguyên | Nguồn | Điều kiện |
|---|---|---|
| Icon SVG (`src/icons.js`) | Vẽ bằng mã riêng trong dự án | Không dùng bộ icon hoặc hình ảnh từ game khác |
| Địa hình, cây, nhà, người, xe Three.js/Canvas | Mesh/hình học procedural của dự án | Không chứa texture, bản đồ hoặc thiết kế nhận diện từ Cities: Skylines |
| Giao diện, bảng màu và map procedural | Mã riêng Build City 26 | Không nhập UI/asset game khác |
| Font | System UI của thiết bị | Không phân phối file font |

Chưa dùng texture/sprite/audio bên thứ ba. Dependencies npm là thư viện phần mềm, không phải tài nguyên game; giấy phép kèm package trong node_modules. Khi thêm tài nguyên ngoài phải ghi nguồn và giấy phép tại đây trước khi sử dụng.


Dữ liệu địa lý chế độ Việt Nam (khác map procedural):

| Dữ liệu | Nguồn | Giấy phép / phạm vi |
|---|---|---|
| Ranh, thủy hệ, đường bờ Trường Sa | © OpenStreetMap contributors; bản trích OpenStreetData VN 07/05/2023 | ODbL-1.0; giữ nguồn, hash và IDs; gói database dẫn xuất phân phối công khai trong public/geodata |
| Cao độ | Mapzen terrain v1.1; USGS SRTM/GMTED, NOAA ETOPO1 | Dữ liệu nguồn public domain; giữ attribution, phiên bản/Last-Modified/hash từng tile |
| Điểm tham chiếu Hoàng Sa | Cổng thông tin Đà Nẵng; bảng tọa độ công bố | Trích xuất dữ kiện tên/tọa độ có dẫn nguồn, không sao chép hình bản đồ/ảnh/văn bản bài viết |

Chi tiết, URL nguồn và giới hạn tại docs/vietnam-map.md. Không sử dụng bất kỳ bản đồ/asset Cities: Skylines.

Menu công trình (`src/ui/build-card.js`) và model biến thể mới là SVG/primitive tự viết cho Build City 26, không lấy từ game khác, không thêm bitmap/texture/âm thanh bên ngoài.

Ảnh ven biển `public/art/coastal-city-v1.webp`: tạo riêng bằng built-in imagegen theo art direction từ ZIP người dùng, ngày09/10/2026. Prompt và cách dùng ở docs/art-direction.md; UI ghi ảnh minh họa. Không lấy ảnh từ Cities: Skylines, không gọi AI runtime.

Kiến trúc 09/10: 13 thiết kế procedural gốc trong building-designs.js, shared roof prism trong gable-geometry.js. Nhà/cửa hàng/xưởng không dùng ảnh, texture hoặc model thương mại bên ngoài.

## GIS Việt Nam từ gói người dùng (10/10/2026)

`public/geodata/vn-map-20250701-v1/`: Nguyễn Duy Liêm (2025), Dữ liệu GIS Việt Nam, Free-GIS-Data, commit `ccb9f4ae992418bfeefd06da1eb42d0249632176`. README nguồn cho phép dùng công khai miễn phí và yêu cầu trích nguồn; không tuyên bố MIT. Xem NGUON_VA_GIOI_HAN.md và manifest.json cùng thư mục. Full/light đã bổ sung Côn Đảo có nguồn và sửa nhãn Đồng Tháp; hình ngoài khơi chưa xác minh đất nổi, chỉ tham chiếu.

## Bộ ảnh cư dân/phương tiện do người dùng cung cấp

Nguồn bất biến `art-source/Build_City_26_People_Vehicles/`; SHA nguồn và mô tả từng frame giữ theo manifest. WebP alpha tại `public/art/mobility/` được tạo bằng script của repo, không tải asset game khác. Model 3D được viết bằng hình học riêng trong `mobility-models.js`, không coi PNG là model. Chưa xác minh quyền bên thứ ba ngoài nguồn gói do người dùng cung cấp; không tự gán giấy phép nguồn. Không gọi API AI khi game chạy.
