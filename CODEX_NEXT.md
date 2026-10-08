# Tiếp tục Build City 26

Đọc toàn Build_City_26_Full_Codex_Prompts.md và docs/implementation-status.md. Đây là đặc tả được người dùng chỉ định; bỏ các yêu cầu cũ mâu thuẫn. Ngoại lệ mới hơn: hiển thị tiền bằng đồng Việt Nam theo src/config/money.js, core vẫn BC. Không dùng API AI hoặc tài nguyên game khác.

Lệnh 1 có nền fixed-step/IDs/events/ledger/save; còn mô phỏng tổng hợp trong growth/utilities/traffic/thuế. Tiếp tục từng chặng có tương tác, kiểm tra và cập nhật status; không đánh dấu model trang trí thành mô phỏng thật. Bản Lệnh 2 Three.js/terrain-4 và 14 nhiệm vụ casual đã chơi được, có giới hạn trong status; tiếp theo Lệnh 3 graph đường và Lệnh 4 bảng chi phí. Mỗi lần lên cấp thưởng 100 triệu ₫ game qua receipt; API username/BXH phải xử lý bằng server, giữ email auth cũ để claim/migrate sau này.

Supabase schema 4 đã chạy thật, SQL RLS rollback PASS nhưng JWT/Auth hai tài khoản qua Data API chưa QA. Không hỏi chạy lại SQL đã chạy. Chỉ thêm migration mới, không xóa save. Đừng gửi/admin key ở frontend/GitHub/chat. GitHub remote là supportstudy26-hue/buildcity26; Vercel chưa xác nhận Ready/production. Chỉ báo link đã deploy sau khi kiểm tra.

npm ci, npm test, npm run build; browser QA desktop/mobile. Giữ backup local trước migration/import/new; cloud retry dùng payload/requestId bất biến và CAS revision. Chưa có ranked verified, tuyệt đối không tạo leaderboard từ JSON client.
