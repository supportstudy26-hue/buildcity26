# Tiếp tục Build City 26

Đọc toàn bộ đặc tả root và docs/feature-coverage.md, implementation-status.md, CODEX_HANDOFF.md. Yêu cầu mới hơn: vốn tài khoản/thành phố mới 100 triệu ₫ (100.000 BC); giữ tiền save cũ. Không dùng API AI hoặc tài nguyên game khác.

Repo supportstudy26-hue/buildcity26 đã push; Vercel production https://buildcity26.vercel.app/ hoạt động, secret chỉ server; Supabase schema 6 và migration 008 đã chạy. Không xin lại quyền push/triển khai đã có.

Chặng mới có 24 công trình, menu vector nhẹ, đất trống và backup, bộ tiện ích giá nhỏ. Đây là mở rộng nền, không phải toàn I3. Tiếp tục theo dependencies: worker/graph/world streaming, dịch vụ có năng lực/nhân sự/hàng đợi/trip, chi phí/thi công, nâng cấp F, 300 nhiệm vụ E, các hệ thống I còn thiếu. Không tạo nút giả, không đánh dấu nhóm hoàn tất chỉ vì có catalog/mesh.

Auth live A/B đăng ký/RLS/hai phiên đã qua, CAS stale/recovery QA chưa đạt. Script chỉ dùng public key và JWT QA, không dùng admin key để chứng minh RLS. Tập trung lấy mã lỗi stale trước khi sửa. Luồng email thật và mobile mới chưa kiểm chứng.
