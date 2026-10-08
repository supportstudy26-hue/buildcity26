# Tiếp tục Build City 26

Đọc toàn Build_City_26_Full_Codex_Prompts.md và docs/implementation-status.md. Đây là đặc tả được người dùng chỉ định; bỏ các yêu cầu cũ mâu thuẫn. Ngoại lệ mới hơn: hiển thị tiền bằng đồng Việt Nam theo src/config/money.js, core vẫn BC. Không dùng API AI hoặc tài nguyên game khác.

Lệnh 1 có nền fixed-step/IDs/events/ledger/save; còn mô phỏng tổng hợp trong growth/utilities/traffic/thuế. Tiếp tục từng chặng có tương tác, kiểm tra và cập nhật status; không đánh dấu model trang trí thành mô phỏng thật. Bản Lệnh 2 Three.js/terrain-4 và 14 nhiệm vụ casual đã chơi được, có giới hạn trong status; tiếp theo Lệnh 3 graph đường và Lệnh 4 bảng chi phí. Mỗi lần lên cấp thưởng 100 triệu ₫ game qua receipt; API username/BXH phải xử lý bằng server, giữ email auth cũ để claim/migrate sau này.

Supabase schema 6 đã chạy thật, SQL RLS rollback PASS nhưng JWT/Auth hai tài khoản qua Data API chưa QA. Không hỏi chạy lại SQL đã chạy. Chỉ thêm migration mới, không xóa save. Đừng gửi/admin key ở frontend/GitHub/chat. GitHub remote là supportstudy26-hue/buildcity26; Vercel chưa xác nhận Ready/production. Chỉ báo link đã deploy sau khi kiểm tra.

npm ci, npm test, npm run build; browser QA desktop/mobile. Giữ backup local trước migration/import/new; cloud retry dùng payload/requestId bất biến và CAS revision. Chưa có ranked verified, tuyệt đối không tạo leaderboard từ JSON client.


Ưu tiên mới nhất: Lệnh 20 / Phụ lục H. Chặng A đã có 34 tỉnh/thành, 36 gói terrain thật, save 6 và lớp xem Hoàng Sa/Trường Sa; đọc docs/vietnam-map.md trước khi sửa. Không tô ranh hành chính ngoài biển như đất; dữ liệu đảo chưa đầy đủ, không tự bịa DEM/polygon. Tiếp tục full world 12,8 km + sparse chunks 200 m + mua đất và hành trình xuyên chunk theo từng mốc kiểm chứng; giữ core, tiền và mọi save cũ. Tiếp đó 100 bậc/300 nhiệm vụ/nâng cấp F. Các chặng trên chưa hoàn tất.

Nguồn JSONseq OSM 2023 đã đối chiếu với danh mục hợp nhất; không gọi mọi đỉnh ranh là ranh pháp lý 2026. Rebuild phải chạy prepare-archipelagos.py sau prepare-vietnam.py để cập nhật checksum. Benchmark thật tại /benchmark.html tách khỏi save người chơi; báo các chỉ số đo được và giới hạn, không cam kết 60 FPS khi chưa đạt.
