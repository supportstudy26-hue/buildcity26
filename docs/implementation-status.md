# Build City 26 — trạng thái triển khai

Đặc tả: Build_City_26_Full_Codex_Prompts.md, đã đọc đủ 561 dòng. Yêu cầu bổ sung mới nhất: giao diện tiền Việt (₫), nhiệm vụ và mỗi lần lên cấp cộng 100 triệu đồng game. Giữ BC trong core/bản lưu, hiển thị 1 BC = 1.000 đồng game. Không dùng API AI.

## Lệnh 0 — kiểm tra nền, cấu hình đang tiếp tục

Đọc README/VALIDATION/CODEX_NEXT, toàn đặc tả và các hệ thống hiện tại. npm ci thành công; baseline 56/56 tests; production build JS 313,13 kB (gzip 90,16). Source trước Lệnh 1 được backup ngoài repository tại work/build-city-26-before-command-1.tar.gz; không gồm env/token/save người dùng.

Đã chạy supabase/schema.sql và migration additive schema 3 trên project adnmfknbskbagiahstim ngày 08/10/2026, qua dashboard đã đăng nhập đúng chủ dự án. Kết quả kiểm tra thật: cities có RLS bật, 4 policy owner, 0 hàng trước QA, RPC chấp nhận schema 3. supabase/tests/rls.sql trên PostgreSQL thật PASS A/B, spoof owner, guest, retry, revision conflict, delete; transaction rollback, không để lại danh tính/city QA. Bằng chứng: supabase-schema-verified.png, supabase-rls-sql-verified.png.

**Chưa có bằng chứng Auth hai tài khoản/JWT qua Data API**, email/recovery thật hoặc production. Test SQL role claims không thay bằng chứng này. Form cũ email còn giữ tương thích; form username đúng 3 ô và API server thuộc Lệnh 17 chưa triển khai. Remote GitHub đã gắn; đang chuẩn bị commit/push và Vercel.

## Lệnh 1 — hoàn tất nền triển khai, có giới hạn được ghi rõ

- Core tách clock/world/roads/households/citizens/firms/vehicles/utilities/services/construction/economy/events/save; UI command queue validate, sequence/receipt idempotent, đồng hồ cố định 10 giây, lịch tháng thật.
- Map 64×64, ô 20 m; stable IDs và seed; 176 cư dân cũ được phân vào hộ ≤4, không đổi tổng; firms/jobs và xe liên hệ cư dân. Save giữ lịch, vị trí, route, segment, contracts, ledger, receipts; không lưu renderer/cache.
- Cư dân ngày thường đi làm/về theo route và vận tốc; attendance khi đến; phá đường chặn đúng vị trí, nối lại tiếp tục. Renderer vẽ từ thực thể core, bỏ đoàn xe trang trí. Chọn cư dân/xe để theo dõi, có nút chờ chuyến tiếp theo và Quan sát.
- Công viên thi công 10 ngày, escrow/cancel/complete qua receipt; save giữa thi công và chuyến đi không nhân tiền/thực thể. Loan cash−debt và cash ledger đối chiếu.
- Migration schema 1/2 →3: tiền/nợ ×100 một lần, map cũ/seed/pop giữ; database RPC nhận 1/2/3. Cloud pending cũ giữ nguyên payload cho retry, migration gửi sau ACK.
- Browser thật Codex IAB desktop 1440×960 và viewport điện thoại 390×844, cổng QA 5174. Chọn citizen-2 đang đi làm, watch departure tự chuyển Quan sát; pause/local save và inspector. Điện thoại chỉ mở một bảng thông tin; inspector dưới 34vh, map/camera còn thao tác. Không reset bản local của người chơi ở cổng 5173. Không lỗi console JS tại lần QA được ghi.
- Kiểm tra: 67 tests gồm deterministic day replay/load giữa trip, batch speed/pause, road break/resume, duplicate commands, park escrow/complete/load/cancel, legacy migration, ledger, SQL và uncertain pending migration. Build production được ghi trong VALIDATION.md.

Giới hạn: z còn phẳng; graph theo ô chưa lanes/sidewalk; dân cư growth/dịch vụ/thuế và lưu lượng UI còn tổng hợp; chưa lifecycle/rent/shopping, bus boarding thực hoặc goods/payroll. Đây là nền Lệnh 1, không đánh dấu Lệnh 3–14 đã xong. Giá catalog chưa thay hết Phụ lục A. Auth mới/BXH server chưa có.

## Lệnh 2 — bản 3D chơi được, schema 4

- Three.js 0.186.1 tải qua dynamic import. Nhà, cửa hàng, nhà xưởng, công trình công cộng, cây, người và xe dựng bằng hình học riêng; không texture hoặc tài nguyên game khác. Dữ liệu mô phỏng không nằm trong renderer.
- Heightfield 65×65 điểm, mét, sông/bờ/đồi; mặt nền công trình bằng cao độ cao nhất của ô. Cầu có cao độ và trụ. Inspector có cao độ/độ dốc. Agent lấy z từ mặt đường/nền thật.
- Orbit/pan/zoom, nhìn trên, raycast nhà/đường, theo ID cư dân; low/medium/high, bóng tùy mức và ánh sáng đêm. Canvas 2.5D cùng core/save; tự fallback nếu WebGL không khởi tạo hoặc mất context.
- Instancing theo 64 vùng, shared geometry/material, frustum và giảm chi tiết từ khoảng cách. Bounds instance cập nhật sau transform. Nhóm thay đổi được dispose trước khi dựng lại; actor không sinh riêng cho renderer và vẫn mô phỏng ngoài camera.
- Migration 3→4 giữ tiền/seed/ID/tọa độ ngang, địa hình phẳng tương thích. Bản terrain-4 sớm chưa có progression nhận XP 0; raw local được giữ trước nâng. Save 1/2 vẫn chuyển tiền đúng một lần. Cloud retry giữ payload cũ trước ACK.
- Đã chạy migration 202610080003_terrain_saves.sql thật trên Supabase; xác minh RPC chấp nhận schema 4, ảnh supabase-terrain-schema-verified.png. Không xóa save cũ.

Giới hạn: graph vẫn theo ô, chưa quy tắc độ dốc/snapping/cầu/hầm Lệnh 3; lane paint chỉ hình vẽ, chưa lane traffic. Chưa benchmark GPU/memory dài hạn và 10.000 agent hoặc thiết bị Safari/iPhone thật. Chưa thử mất WebGL context thực. Người/xe có hình thể và hướng, tay/chân theo vận tốc; chưa đủ đèn xe/animation boarding. Three chunk 547,25 kB (gzip 139,75 kB), build còn cảnh báo chunk >500 kB. Không đánh dấu toàn bộ Lệnh 2 đã kiểm chứng.

## Nhiệm vụ và cấp thành phố — bổ sung theo yêu cầu người dùng

14 nhiệm vụ: dân số 100/500/1.000/5.000/10.000, 5 ô đường mới nối mạng, 20 cư dân đã đến làm thực, tiện ích đủ 100 dân, công viên thi công hoàn tất và hoạt động, trường/y tế/rác/cứu hỏa/cảnh sát đạt độ phủ. Điều kiện giữ 1 ngày mô phỏng; bị mất điều kiện sẽ bắt đầu lại. XP được cấp một lần qua receipt ID và rule city-missions-1, giữ trong save 4.

Cấp tính từ tổng XP theo công thức đặc tả. Mỗi lần vượt một cấp: +100.000 BC = **100 triệu đồng game**, cash ledger ghi level-grant theo ID duy nhất. Không cộng lại khi save/load/login. Đã bỏ bonus dân số legacy để tránh thưởng hai hệ thống. Tiền lịch sử và milestones cũ vẫn giữ. Nhóm nhiệm vụ cấp sau mở dần; không khóa lại công cụ đã có của bản chơi cũ.

UI Nhiệm vụ có thanh XP, yêu cầu, tiến độ 24 giờ, nút mở đúng công cụ và danh sách đã hoàn thành. Điện thoại có nút cấp/XP dễ mở. Cấp thành phố casual được ghi rõ; chưa phải account progression/BXH verified và không gửi cash/XP client làm score chính thức.

Kiểm tra mốc 0.4: npm ci PASS (25 packages); 75/75 tests PASS, không skipped; npm run build PASS. Test gồm heightfield/migration 1–4, raycast bounds, ổn định nhiệm vụ bị đứt tiện ích, công viên phải active, đúng 100 triệu lên cấp, ledger đối chiếu và mở save không nhận lại thưởng.

Browser Codex IAB 1280×720 và viewport 390×844, cổng QA 5174: xây 5 ô đường và công viên thật, bổ sung điện/nước/cứu hỏa, chạy 8× đến cấp 2/550 XP, thấy toast +100 triệu và mở nhiệm vụ cấp 2. Save/reload vẫn 550 XP và tiền 10.847.808 BC trước/sau; Canvas↔3D vẫn cùng tiền/dân. Nhóm dịch vụ đạt điều kiện thêm 450 XP ngày kế tiếp. Raycast nhà 14,20 trả inspector dân cư/cao độ 1,9m; low thực ghi 29 FPS, 39 draw calls, 22 geometries/0 textures ở cảnh 377 dân (chỉ số tức thời, không benchmark). Ảnh preview-3d-missions-desktop.png và preview-3d-missions-mobile.png. Sửa thiếu loading element gây lỗi khởi động trong bản trung gian; phiên tab mới sau sửa không lỗi JS.

GitHub: commit foundation 9c78054 đã có local, remote chưa push thành công. Browser đã đăng nhập chủ repository, CLI hiện tài khoản khác không có quyền push. Xét duyệt tự động từ chối yêu cầu CLI scope workflow; đang chờ người dùng cho phép rõ quyền đó để đưa cả CI. Vercel chưa deploy/Ready.

## Tiếp theo

| Lệnh | Trạng thái | Phần còn lại |
|---|---|---|
| 2 | Bản 3D chơi được | Chưa benchmark dài hạn/raycast mọi trường hợp; xem giới hạn bên dưới |
| 3–4 | Chưa hoàn tất | Lane/sidewalk/crossing, preview cầu/hầm, toàn bảng chi phí |
| 5–7 | Có nền ID/trip | Lifecycle, lịch đa mục tiêu, lane traffic/parking |
| 8–14 | Chưa hoàn tất | Logistics, utilities networks, dispatch, boarding, ledger/P&L, crews/weather |
| 15–16 | Có inspector nền | Dashboards/tutorial, Worker và benchmark |
| 17 | Chưa hoàn tất | API username 3-field/recovery, legacy claim, JWT Data API QA, snapshot lớn |
| 18–19 | Nhiệm vụ/cấp casual đã có | Account XP, authoritative ranked replay/BXH chưa có |
| 20 | Chưa hoàn tất | Scenario toàn hệ thống và production Auth/save/deploy |

Không ghi PGlite/mock là kiểm chứng production. Không nhận JSON cash/XP client làm verified score. Secret/service_role chỉ ở server, không frontend/GitHub/chat.
