# Build City 26 — 0.4

Game web xây dựng thành phố tiếng Việt, đồ họa Three.js 3D/SVG riêng và Canvas 2.5D nhẹ, chạy trên máy tính và điện thoại. Không dùng API AI hoặc tài nguyên Cities: Skylines. Đặc tả đang triển khai: Build_City_26_Full_Codex_Prompts.md; tiến độ và giới hạn tại docs/implementation-status.md.

Map 64×64, 20 m/ô (1.280×1.280 m), đường/đại lộ/cầu, RCI, điện/nước/nước thải/rác và dịch vụ; ngân sách/thuế/vay, cảnh báo và bản đồ lớp. Lệnh 1 bổ sung fixed timestep/đồng hồ chung/lịch tháng thật, cư dân/hộ/firm/xe có ID, lịch đi làm/về và route/vị trí thực; có chọn/theo dõi cư dân và Quan sát. Công viên có hợp đồng 10 ngày và escrow; ledger/command receipts chống trả hai lần. Growth, lưu lượng, dịch vụ, thuế và bus còn mô phỏng tổng hợp; chưa phải lifecycle/logistics/lane traffic đầy đủ.

Thành phố mới và tài khoản mới có **100 triệu ₫**, khởi đầu từ đất trống. Có 24 công trình trong catalog, ba trạm điện/nước/nước thải nhỏ để bắt đầu; menu xây ghi giá, phí và công suất/phạm vi. Bắt đầu lại tạo bản dự phòng trước khi thay thành phố; bản cloud và tiền trong save cũ được giữ.

Bản 0.4 thêm địa hình cao thấp, camera 3D, chất lượng nhẹ/vừa/cao và 14 nhiệm vụ theo cấp. Nhiệm vụ giữ điều kiện đủ một ngày, XP cấp một lần; mỗi lần lên cấp nhận 100 triệu ₫ game. Lưu/mở lại giữ receipt chống thưởng trùng. Đây là cấp thành phố casual; account/BXH server chưa triển khai.

Trang chủ và tài khoản theo gói giao diện người dùng: nền ven biển riêng, form đăng ký3ô/login2ô; trang chủ tải nhẹ trước khi tải game/Three.js. Nút bắt đầu mở đăng ký khi chưa đăng nhập.

## Chạy

Node 22.12+ (CI dùng Node 24):

```sh
npm ci
cp .env.example .env.local
npm run dev -- --host 127.0.0.1
npm test
npm run build
```

Mở http://127.0.0.1:5173/. Không có Supabase vẫn chơi/local save được. Env frontend chỉ gồm VITE_SUPABASE_URL (URL gốc) và VITE_SUPABASE_PUBLISHABLE_KEY hoặc anon key; không dùng secret/service_role. .env.local và session/mật khẩu không commit.

## Tiền, thời gian và bản lưu

Giao diện hiển thị đồng Việt Nam (₫), 1 BC nội bộ = 1.000 đồng game, cùng formatter ở tất cả màn hình. Đây là thông số cân bằng game. Giá bản nền hiện chưa thay đầy đủ theo Phụ lục A; xem docs/economy-balance.md. Vay tối đa 5 tỷ ₫ game, 5%/năm, cash và debt cùng tăng; chưa có verified BXH.

Chơi 1×: 1 giây thực = 5 giây game (một ngày game mất 4 giờ 48 phút thực); Quan sát: 1 giây thực = 1 giây mô phỏng. Pause/modal/tab nền ngừng mô phỏng. Xem docs/time-model.md về timestep/ETA và giới hạn.

Migration schema 1/2 →3→4 mở map 38/48/64, giữ tọa độ/seed/pop, chuyển tiền/nợ ×100 đúng một lần. Bản thô local được archive trước khi chuyển; payload cloud pending giữ nguyên để retry. Load giữa hành trình/công trường giữ IDs, vị trí, progress và receipts. Schema 4 giữ heightfield mét và nhiệm vụ/cấp. Bản schema 3 dùng nền phẳng tương thích; không hạ schema 4 về client cũ.

Local tự lưu 15 giây; cloud 60 giây sau lần lưu đầu, một request mỗi lúc. Lỗi mạng/server giữ pending, dùng lại UUID; thiết bị stale báo conflict và cho mở cloud/lưu bản fork/xuất JSON. Thư viện city tách owner. Có backup local và import/export; kiểm tra dữ liệu trước load. JSONB hiện giới hạn 2 MB; snapshot lớn sẽ cần thiết kế Storage tại Lệnh 17.

## Supabase và tài khoản

docs/SUPABASE_SETUP.md và supabase/schema.sql; project đã có bản cũ dùng migrations theo thứ tự. Đã chạy SQL schema 6/migration 008 trên project thật. QA Auth/JWT A/B đã qua đăng ký, retry, đăng nhập, RLS và lưu/mở ở hai phiên; bài xung đột/recovery đầy đủ còn chưa đạt. PGlite tests không thay production Auth QA.

Luồng email cũ được giữ (xác nhận, đăng nhập, quên/đặt lại mật khẩu, logout). Đã viết đăng ký mới đúng 3 ô Tên thành phố/Tài khoản/Mật khẩu, đăng nhập 2 ô, API server cấp JWT Supabase thật, khôi phục bằng mã dự phòng một lần, tạo lại mã khi biết mật khẩu và nhận tên tài khoản cho tài khoản email cũ. Migration tạo profile/thành phố đầu tiên một lần và bổ sung RLS chặn phiên cũ sau khôi phục. Server production đã cấu hình và tạo tài khoản thật; chưa đánh dấu toàn bộ recovery/xung đột đã kiểm chứng. Server admin key chỉ đặt môi trường server; không gửi qua chat.

## GitHub → Vercel

Remote người dùng chỉ định: https://github.com/supportstudy26-hue/buildcity26.git. Vite build npm run build, output dist, vercel.json và CI Node 24 đã chuẩn bị. Vercel env frontend như trên; server-only secrets cho API mới khi triển khai. Redirect URLs dành luồng email cũ/provider thật, cấu hình domain production sau Ready. Website production: **https://buildcity26.vercel.app/**. Supabase Site URL và redirect production đã cấu hình; deployment Ready đã kiểm, mỗi bản mới cần kiểm lại. Giới hạn Auth QA ghi tại implementation-status.

## Cấu trúc

src/game/core.js là facade; src/game/systems/ chứa hệ thống mô phỏng và save. src/game/renderer.js chỉ vẽ; src/config/ chứa catalog/đơn vị/tiền. src/app.js và index.html/style.css là UI; src/icons.js là icon SVG riêng. src/services/ chứa Auth/Data API/local/cloud sync. supabase/ chứa schema/migrations/RLS tests; scripts/verify-supabase.mjs là QA JWT Data API bằng hai tài khoản thật; tests/ gồm fixtures/migration/invariants/regressions. ASSET_LICENSES.md ghi nguồn tài nguyên.


## Bản đồ Việt Nam (chặng A)

Menu có 34 tỉnh/thành, preview địa hình/thủy hệ thật 12,8 km, 36 khu chơi tải theo lựa chọn. Khu xây vẫn 1,28 km; chưa có mua đất/full world. Hoàng Sa/Trường Sa có nhãn, phóng tới, danh sách điểm đảo/tọa độ và đường bờ Trường Sa từ nguồn thật; chưa có DEM đảo để mở khu xây. Xem docs/vietnam-map.md về nguồn, giấy phép và phần chưa kiểm chứng. Save 6 giữ địa hình; bản cũ tiếp tục mở được. Production có cache asset/public geodata offline, không cache tài khoản/API.

Bản GIS snapshot 2025-07-01 và 63 tên cũ đã tích hợp vào màn Việt Nam; file full tải theo yêu cầu. Xem [bằng chứng và giới hạn bản đồ](docs/national-map-integration.md). Bộ cư dân/phương tiện đang ở chặng đầu; xem [trạng thái 144 mẫu](docs/mobility-integration-status.md), không phải cả 144 model/nghiệp vụ đều hoàn thành.


### Thị trường tiền game (10/10)

Trong menu **Cổ phiếu & xổ số** hoặc màn ngân sách: 6 cổ phiếu hư cấu, mua/bán/danh mục và xổ số 6/45. Đăng nhập rồi lưu city lên Supabase để giao dịch; khách chỉ xem giá/kết quả. Chu kỳ server 5 giờ thực (18.000 giây UTC), độc lập tốc độ 1×/3×/8×. Một vé 10.000 đồng game. Đối soát vé đã đến hạn để nhận thưởng một lần.

Dự án hiện tại đã chạy migration 202610100001_financial_game và 202610100002_conflict_http. Cài mới dùng schema.sql; dự án có sẵn chạy hai migration theo thứ tự, giữ seed và dữ liệu. Không cần cron/trình duyệt mở để xác định kỳ đã đóng. Không đưa secret seed hoặc service-role ra frontend. Kiểm tra thật bằng `QA_BASE_URL=https://buildcity26.vercel.app QA_ALLOW_CREATE=1 npm run test:finance:live` (tạo hai user QA riêng, không dùng admin key). Script tài khoản riêng kiểm recovery/RLS không đụng tài khoản người chơi.

Đồ họa giữ toàn bộ dân số/mô phỏng nhưng chỉ render người/xe gần camera: tối đa 50 đối tượng đang đi lại tính cả người và xe, ở mọi quy mô dân số; máy yếu/điện thoại tối đa 30. Chất lượng cao cũng không vượt cap. Giới hạn cloud snapshot vẫn 2 MB; chưa gọi city 5.000 dân lưu cloud hoàn chỉnh. Xem docs/implementation-status.md và các JSON hiệu năng.
