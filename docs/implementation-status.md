# Build City 26 — trạng thái triển khai

Đặc tả: Build_City_26_Full_Codex_Prompts.md, đã đọc đủ 561 dòng. Yêu cầu bổ sung mới nhất của người dùng: giao diện tiền Việt (₫). Giữ BC trong core/bản lưu, hiển thị 1 BC = 1.000 đồng game. Không dùng API AI.

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

## Tiếp theo

| Lệnh | Trạng thái | Phần còn lại |
|---|---|---|
| 2 | Chưa bắt đầu | Three.js, heightfield, raycast, quality/LOD/fallback |
| 3–4 | Chưa hoàn tất | Lane/sidewalk/crossing, preview cầu/hầm, toàn bảng chi phí |
| 5–7 | Có nền ID/trip | Lifecycle, lịch đa mục tiêu, lane traffic/parking |
| 8–14 | Chưa hoàn tất | Logistics, utilities networks, dispatch, boarding, ledger/P&L, crews/weather |
| 15–16 | Có inspector nền | Dashboards/tutorial, Worker và benchmark |
| 17 | Chưa hoàn tất | API username 3-field/recovery, legacy claim, JWT Data API QA, snapshot lớn |
| 18–19 | Chưa bắt đầu | XP receipts, authoritative ranked replay/BXH |
| 20 | Chưa hoàn tất | Scenario toàn hệ thống và production Auth/save/deploy |

Không ghi PGlite/mock là kiểm chứng production. Không nhận JSON cash/XP client làm verified score. Secret/service_role chỉ ở server, không frontend/GitHub/chat.
