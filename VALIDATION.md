# Kiểm tra chặng màu/dự phòng/một thành phố — 11/10/2026

Full suite 217/217 PASS, không skip, 222,36 s; sau sửa xung đột review thêm một test, chạy backup/city-replacement/cloud-sync 19/19 PASS. SQL migration một thành phố chạy PGlite và Supabase thật. Live 2 tài khoản kiểm A/B RLS/atomic replacement/CAS/retry/save-load PASS. Live nhiệm vụ chống trùng/khôi phục/xuyên owner và codec 5.000 dân PASS.

Browser: kiểm các ô ngân sách/nhiệm vụ/cư dân/inspector/cài đặt/catalogue/thị trường/bản đồ. Kết quả đo màu ở `docs/ui-contrast-audit-20261011.json`; disabled không tính. Ngân sách game thật 390×844 không tràn ngang; không điện thoại phần cứng. Tình huống localStorage plaintext bị chặn: tháo dỡ, backup, login và mở cloud PASS; thay thành phố hủy giữ cũ, xác nhận chỉ còn một, cũ còn backup. Không dùng ảnh minh họa làm bằng chứng game.

Build cuối PASS **12,26 s**.  Không có lint/typecheck script; cảnh báo chunk Three/building-designs >500 kB còn có. GitHub/Vercel code `bf09f19` completed/success; browser domain chính kiểm ngân sách 24 mẫu chữ, min 5,53:1, giữ bản legacy 176 dân. Ảnh production trong docs. Các phần sau là lịch sử kiểm chứng, trạng thái mới nhất lấy `docs/implementation-status.md`.

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

## Clock-5 — 08/10/2026

78/78 tests PASS (189,65 s), không skipped; build PASS (19,78 s), main JS 353,90 kB/gzip104,01; Three 547,25/gzip139,74 kB. Injected elapsed/FPS, arrival 65 m, schema 4→5, pause/speed persistence và old uncertain cloud request giữ đúng payload. Live Supabase schema 5 migration PASS, ảnh docs/supabase-clock-schema-verified.png.


## Việt Nam / quần đảo — 08/10/2026

npm test: **95/95 PASS**, không skipped (112,50 s); gồm 36 terrain packages/checksum/save 6, legacy saves, các command nước/dốc/cầu, loader abort/checksum/oversize và service-worker bảo vệ cache public. Sau chỉnh UI quay về tỉnh từ quần đảo: npm run build PASS (6,02 s). Kiểm tra riêng archipelagos/offline-worker sau bổ sung metadata cache: 6/6 PASS (0,73 s).

Build: main JS 308,47 kB/gzip89,26; chooser lazy 12,78/gzip5,26; Three 549,05/gzip140,34; CSS30,17/gzip6,98. Three còn cảnh báo >500 kB. Layer quần đảo 45.410 byte raw, fetch lazy cùng chooser; không thêm texture, không thêm vòng mô phỏng hoặc renderer.

Browser thật Codex IAB tại QA 5175: bản đồ toàn quốc có Hoàng Sa/Trường Sa; bấm Xem từng quần đảo phóng đúng khung địa lý. Chọn Đảo Trường Sa ra 8,64464° Bắc / 111,91969° Đông; Hoàng Sa ra 16,53333° Bắc / 111,60194° Đông. Reload giữ tên QA Hạ Long 08-10 và save hiện có. Ảnh docs/vietnam-archipelagos-national.png, docs/vietnam-hoang-sa-detail.png, docs/vietnam-truong-sa-detail.png. Kiểm tra rộng 1063 px; lần yêu cầu override mobile mới không thay viewport thực, nên không coi đó là bằng chứng mobile mới. Mobile chooser trước đó có ảnh/kiểm tra riêng; cần tái kiểm thử quần đảo ở viewport điện thoại thật.

Production preview 4175 đã tắt máy chủ có chủ đích rồi reload tab QA: game và thành phố QA Offline Đà Nẵng vẫn mở từ service-worker, clock giữ 00:00:03, 12 tỷ ₫, không ghi/xóa city khác. Đã khởi động lại preview sau thử nghiệm. Không gọi bài thử này là QA Supabase mất mạng hoặc xác nhận mọi khu địa hình đều sẵn offline. Cache gói chưa tải/metadata đảo được kiểm bằng unit test; chưa kiểm đầy đủ eviction/quota browser thật.

Supabase migration geography schema 6 đã chạy thật; ảnh docs/supabase-geography-schema-verified.png. Auth/JWT hai tài khoản, production GitHub/Vercel vẫn chưa kiểm chứng. Lệnh 20/H đầy đủ vẫn còn world xây 12,8 km/chunk/mua đất/DEM đảo/thủy văn; xem docs/implementation-status.md.


09/10/2026 account checkpoint: npm ci PASS; all 100/100 tests PASS; build PASS 8.24s. Focused account rotation/owner/password tests 6/6 PASS after the extra test (101 total cases). PGlite and SDK injection only, not real Auth. Supabase migrations 006/007 applied Success. Live username/JWT QA script ready, deployment/config pending. See docs/implementation-status.md for exact scope.

### UI và địa phương đăng ký — 09/10/2026

`npm test`: 102/102 đạt, không skip. `npm run build`: đạt; cảnh báo chunk Three 549 KB. Migration 008 chạy Supabase: Success. Browser localhost: đăng ký ba input, chọn Hải Phòng và quay lại giữ tên/tài khoản; xem riêng Hoàng Sa/Trường Sa, tọa độ khi phóng Đảo Trường Sa 8,64464°B / 111,91969°Đ. Không tăng tài nguyên WebGL. Production và Auth JWT hai tài khoản thật vẫn chưa xác nhận; deploy key hiện Read-only.

## 09/10 — vốn 100 triệu, đất trống và 24 công trình

npm ci đạt; toàn 110/110 tests đạt, không skip (165,11s); build đạt (32,90s), Three chunk550,03KB warning. tests/expanded-city kiểm server tạo100.000BC/openingCash ở bản thường/địa phương; build kit74.000BC có dân/việc làm, oldsave giữ tiền; mọi24 loại roundtrip; công suất/đứt đường/range/budget/rác.

Browser localhost5180: màn reviewreset/backup, 0 dân100triệu; xây5đường+ba trạm+hai zone còn26triệu, save/reload giữ26triệu, JSerror không có. Ảnh empty-start-100-million/starter-utilities-budget. Chưa benchmark/mobile mới.

Production9108038 Ready/domain chính/redirect đã kiểm. Authlive A/B qua đăng ký/RLS/savehai phiên, staleCAS/recovery chuỗi chưa đạt, server503 có gặp. Xem implementation-status để không nhầm QA fixture với live.

## Chặng kiến trúc riêng 09/10

17/17 tests mục tiêu đạt: building-designs, render-quality, expanded-city, benchmark. Build đạt 15,30s. Khu QA riêng dùng renderer/core thật và không lưu tài khoản. 13 mẫu độc lập, chọn ổn định theo tọa độ; save cũ không thay đổi tiền/entities. Xem docs/implementation-status và architecture-performance-before/after.json: median58,5FPS ở1.848 dân; p9549,4ms, 17longtasks còn hạn chế. Chưa mobile/10.000dân mới; không gọi toàn đặc tả hoàn tất.
