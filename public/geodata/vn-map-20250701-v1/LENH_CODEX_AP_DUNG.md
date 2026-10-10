# Lệnh áp dụng bản đồ Việt Nam vào Build City 26

Giải nén `Build_City_26_Vietnam_Map.zip` vào dự án. Dán nguyên phần dưới vào Codex đang mở đúng repository game. Đây là yêu cầu triển khai; gói bản đồ tự nó chưa sửa code hoặc triển khai game của bạn.

```text
Tiếp tục xây dựng Build City 26 trong repository hiện tại. Đọc AGENTS.md và kiểm tra kiến trúc, package.json, hệ thống bản đồ, rendering, đăng nhập Supabase, save/load và bảng xếp hạng trước khi sửa. Giữ các tính năng đã hoạt động.

Tôi cung cấp thư mục Build_City_26_Vietnam_Map. Đọc trước README.md, docs/NGUON_VA_GIOI_HAN.md, docs/DATA_CONTRACT.md, data/provinces.json, data/islands.json và docs/QA_REPORT.json. Xem maps/VIET_NAM_BUILD_CITY_26.png để hiểu bố cục và XEM_BAN_DO.html để tham khảo thao tác.

1. Tích hợp bản đồ tổng quan Việt Nam có đủ 34 đơn vị cấp tỉnh theo snapshot 2025-07-01, gồm 28 tỉnh và 6 thành phố tại mốc đó. Dùng đúng data/vietnam-34-light.geojson cho bản đồ tổng quan. Khi cần độ chi tiết gốc thì tải data/vietnam-34-full.geojson theo nhu cầu, không đưa toàn bộ 14 MB vào JavaScript bundle khởi động. Không tự vẽ lại ranh giới bằng đa giác ngẫu nhiên.

2. Giữ ID vn-* trong provinces.json. Đây là ID của game, không phải mã hành chính chính thức. Nguồn đã sửa lỗi nhãn Đồng Tháp bị ghi trùng Lạng Sơn; không đưa lỗi đó trở lại. Côn Đảo đã được bổ sung từ GIS trước 2025 của cùng tác giả vào full/light, gắn TP. Hồ Chí Minh theo mốc 2025; không cộng supplement lần nữa. Bảng old-63-to-new-34.csv hỗ trợ tìm kiếm tên trước sáp nhập, không phải 63 ranh giới cũ. Cho tìm bằng tên có dấu/không dấu và tên cũ, chọn vùng, xem tên tỉnh/thành, zoom, pan, reset và tooltip. Hoàn thành đủ 34 vùng tương tác, không chỉ tạo một ảnh nền.

3. Phú Quốc ở phía tây nam, dùng đúng polygon trong islands.json, gắn với An Giang tại mốc 2025. Hoàng Sa và Trường Sa giữ vị trí WGS84 trong bộ dữ liệu; không kéo sát đất liền để vừa màn hình. Hoàng Sa gắn với Đà Nẵng và Trường Sa gắn với Khánh Hòa theo hệ thống hành chính Việt Nam ở mốc 2025. Có ba nút chuyển đến Phú Quốc, Hoàng Sa, Trường Sa. Các ô phóng to phải ghi rõ tỷ lệ riêng.

4. Không coi polygon hành chính là land mask. Dữ liệu ngoài khơi chứa cả đảo, đá, bãi, rạn; không tự tô kín toàn bộ rạn thành một đảo lớn để xây. data/offshore-island-reef-reference.geojson chỉ là lớp tham chiếu, buildable=false. Nếu chưa có dữ liệu đất nổi và địa hình được kiểm chứng, hiển thị lớp tham chiếu và chặn xây trên các vùng chưa phân loại. Không tạo đường biên lãnh hải/EEZ từ hộp focusBounds. Nhãn hành chính theo Việt Nam và ghi chú ngắn về tranh chấp quốc tế trong thông tin nguồn.

5. Tách bản đồ tổng quan cấp quốc gia với khu vực xây thành phố ở đơn vị mét. Người chơi chọn một địa điểm thực trong tỉnh rồi tải khu vực chơi cục bộ. Không nén chiều dài Việt Nam vào một ô 12,8 km. Với khu chơi dùng local origin/floating origin, lưu tọa độ gốc WGS84, phép chiếu, kích thước ô và phiên bản dữ liệu. Nếu dùng UTM, chọn vùng chiếu phù hợp từng địa điểm, không áp một vùng UTM duy nhất cho cả Việt Nam và tất cả quần đảo. Biến đổi tọa độ phải đảo ngược được với sai số được đo và báo cáo.

6. Gói này không có DEM, bathymetry, sông, đường thật hay quy hoạch xây dựng. Để mô phỏng núi, biển và đồng bằng thật, tìm dữ liệu DEM/đường/sông/bờ biển có giấy phép cho phép sử dụng, ghi nguồn và độ phân giải, clip theo khu chơi và xây pipeline tạo tile. Ưu tiên dữ liệu công khai không cần key nếu đáp ứng yêu cầu. Không gọi địa hình noise là địa hình Việt Nam thật. Khi chưa có DEM, đánh dấu khu chơi là chế độ địa hình minh họa; tách rõ dữ liệu tham chiếu khỏi dữ liệu mô phỏng.

7. Render nhẹ: tải địa hình theo chunk, LOD, culling, giới hạn draw calls, instancing và lựa chọn chất lượng; tránh shadow và hậu xử lý nặng mặc định. Province labels và icon rõ, màu thanh lịch theo PNG tham chiếu. Có giao diện responsive, zoom bằng chuột và nút trên điện thoại, điều hướng bàn phím cho danh sách, tùy chọn giảm chuyển động. Có trạng thái tải và lỗi thực, không che lỗi bằng dữ liệu giả.

8. Nối các khu chơi vào hệ thống thành phố và save/load hiện có. Nếu dự án đã dùng Supabase thì lưu provinceId, mapSnapshot, worldOriginWgs84, projection, cityState và schemaVersion; cập nhật migration và RLS cần thiết. Không nhúng service-role key vào trình duyệt. Bảng xếp hạng tiếp tục dùng dữ liệu đã xác thực ở server. Một giây thực bằng 5 giây trong game ở tốc độ mặc định, dùng một simulation clock duy nhất để dân, xe và kinh tế không lệch thời gian.

9. Tự viết và chạy kiểm tra cần thiết cho: đủ 34 ID và tên khác nhau, tìm tên cũ, tọa độ Phú Quốc/Hoàng Sa/Trường Sa, multipart/island selection, phép chiếu qua lại, vùng không được xây, save/load provinceId và origin, chuột và mobile. Chạy lint/typecheck/build của dự án và kiểm tra trực quan bản đồ bằng browser nếu có. Đọc QA trong gói để biết phần nào đã kiểm tra; không coi QA của gói là QA của game sau tích hợp.

10. Thực hiện code cụ thể, không chỉ trả một kế hoạch. Nếu đã có quyền truy cập repository thì tạo thay đổi để review theo workflow hiện có; nếu chưa có quyền triển khai thì báo chính xác bước còn thiếu. Không tuyên bố đã push GitHub, deploy Vercel hoặc dựng terrain thật khi chưa làm. Kết thúc bằng danh sách file thay đổi, kết quả kiểm tra, phần thật sự hoạt động và dữ liệu/key còn thiếu. Không yêu cầu key chỉ để xem bản đồ này.
```
