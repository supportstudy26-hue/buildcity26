# Kiểm chứng — 08/10/2026

Baseline trước Lệnh 1: npm ci thành công, npm test 56/56, npm run build thành công (JS 313,13 kB/gzip 90,16 kB). Bản nền ban đầu 0.1 có 10 tests và QA Supabase giả lập; đó là bằng chứng lịch sử, không phải production mới.

Bản 0.3 foundation-3: npm test 67 tests (bổ sung deterministic fixed-step, migration một lần, save/load giữa trip/construction, pause/speed, IDs/occupancy, ledger/receipts, blocking đường, uncertain old pending giữ nguyên). PGlite thực thi schema/migrations/RLS SQL và thử RPC schema 3/retry idempotent. Kết quả cuối: 67/67 PASS, không skipped; npm run build PASS, Vite 7.3.7, 73 modules, JS 338,54 kB/gzip 98,76 kB, CSS 25,31 kB/gzip 5,96 kB.

Supabase PostgreSQL thật: schema/RLS/4 owner policies/RPC schema 3 đã kiểm tra; script SQL A/B PASS, transaction rollback. Ảnh supabase-schema-verified.png và supabase-rls-sql-verified.png. Chưa chạy Auth/JWT Data API A/B; không gọi SQL claims test là kiểm chứng đăng nhập/email/recovery.

Browser thực: Codex In-app Browser, desktop 1440×960 và mobile viewport 390×844; theo dõi citizen-2 đi làm bằng path thực, watch departure/Quan sát, pause, local save, inspector. Đã xem screenshot và sửa chồng bảng mobile. Ảnh preview-foundation-desktop.png, preview-foundation-mobile.png. Logs không lỗi JS tại lần QA. Đây chưa phải Safari/iPhone phần cứng thật.

Chưa kiểm chứng: benchmark GPU/disposal dài hạn và performance 10.000 agents, lane/crossing/car-following, household lifecycle, logistics, bus boarding, mạng utilities, payroll/P&L, username 3-field server/recovery, verified BXH, GitHub push/Vercel Ready và production Auth/save. Xem trạng thái chi tiết trong docs/implementation-status.md.

## Bản 0.4 — terrain-4 và nhiệm vụ casual

npm ci PASS (25 packages, cache offline); npm test 75/75 PASS, không skipped; production build PASS, 82 modules. JS chính 352,45 kB/gzip 103,46 kB, Three dynamic chunk 547,25 kB/gzip 139,75 kB, CSS 26,89 kB/gzip 6,25 kB. Cảnh báo Three chunk >500 kB còn tồn tại. Npm báo install scripts esbuild/fsevents chưa có allowScripts explicit; build thực vẫn PASS.

5 test terrain/render: save cao độ mét; migration 3 giữ tiền/IDs/vị trí; checkpoint terrain sớm thiếu nhiệm vụ vẫn nâng; procedural descriptor không mutate core/nền hợp lý; Three InstancedMesh bounds/raycast sau biến đổi. 3 test progression: ngưỡng XP và đúng 100 triệu; mất tiện ích reset 24h; đường/công viên hoàn tất và active lên cấp, cash ledger/receipt không trùng sau load. Database QA thêm RPC schema 4 retry. Các test SQL ở máy dùng PGlite; migration schema 4 thật đã kiểm tra qua Supabase dashboard.

Browser IAB desktop 1280×720/mobile viewport 390×844: công viên hoàn thành, cấp 2/550 XP và toast +100 triệu; nhóm cấp 2 mở; save/reload và đổi renderer giữ ngân sách 10.847.808 BC. Raycast chọn nhà 14,20 có cao độ 1,9m. Low thực 29 FPS/39 draw calls/22 geometry/0 textures tại 377 dân, không coi đây là benchmark dài hạn. Screenshots preview-3d-missions-desktop.png và preview-3d-missions-mobile.png. Bản trung gian thiếu loader đã sửa; tab mới không lỗi JS. Chưa thử mất context WebGL thực hoặc loop dựng/xóa dài hạn. Production preview cổng 4173 khởi động 3D, 5 vòng dựng/phá cùng ô đều đúng tiền (6.000 BC xây, 1.500 BC thu hồi), road count quay về 76; tài nguyên giữ 24 geometries/2 textures qua cả 5 vòng, 29–30 FPS tức thời. Không lỗi JS. Đã kiểm tra nhìn trên và ánh sáng đêm; sửa mặt đường trùng mặt nền gây sọc nhấp nháy.
