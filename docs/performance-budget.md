# Hiệu năng — đo thật 08/10/2026

Bản đo production `/benchmark.html`, sandbox riêng, không ghi city/tài khoản/BXH người chơi. Báo cáo `performance-1000-20261008.json`, ảnh `performance-1000-20261008.png`. Đây là một lần đo 30,02 giây trên trình duyệt Chrome 155 của máy hiện tại, viewport đo 1280×720; không đại diện điện thoại hoặc mọi GPU.

| Chỉ số | Kết quả |
|---|---:|
| Cư dân / đang di chuyển / xe | 1.000 / 333 / 167 |
| FPS trung vị | 19,9 |
| Khoảng khung hình p95 | 83,4 ms |
| CPU tick trung vị / p95 | 0,4 / 0,6 ms |
| Long task / dài nhất | 2 / 517 ms |
| Draw calls / tam giác | 38 / 74.660 |
| Vùng render / geometry / texture | 16 / 14 / 0 |
| Renderer / chất lượng / DPR | Three.js / vừa / 1 |
| Dữ liệu save | 1.878.103 byte |
| Heap trình duyệt báo | 25.709.947 byte |

167 lượt đến nơi được core ghi nhận; actor lấy mục tiêu/route/vị trí từ mô phỏng. CPU tick chạy đồng bộ, chưa dùng Worker/queue. Đo gồm khởi tạo scene/cold compilation; không che long task. FPS hiện chưa đạt mục tiêu độ mượt; không khẳng định đạt G5–G6. Báo cáo này chưa bao gồm 5.000/10.000 cư dân hay địa hình Việt Nam đông dân.

Đã giảm vùng render từ 64 còn 16, giữ mesh/material dùng chung, bỏ bóng ở thấp/vừa và đặt DPR 1; không làm mất thực thể mô phỏng. Static scene chỉ dựng lại khi signature thay đổi. Gộp vùng hiện là 320 m của map 64×64, chưa phải streaming chunk 200 m của thế giới 12,8 km. Dữ liệu địa lý RAM giới hạn 4 gói/8 MB dữ liệu nguồn; cache production 4 gói/6 MB. Heap parse/geometry thực tế lớn hơn bytes JSON nguồn, không dùng cache budget làm số đo tổng RAM.

Lớp Hoàng Sa/Trường Sa thêm 45.410 byte nguồn, 46 đường bờ và 21 ký hiệu có tên, SVG trong dialog; không thêm texture, actor hoặc simulation loop. Chưa có đo riêng FPS do lớp này hoặc browser quota/eviction dài hạn.

Chặng tiếp theo: đo 5.000/10.000 và cảnh Việt Nam, actor allocation/culling, modal render throttling, pathfinding queue/Worker rồi thiết kế sparse chunk; bảo toàn IDs/routes/save và đo lại cùng điều kiện sau mỗi thay đổi.
