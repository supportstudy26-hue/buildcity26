# Build City 26 — 0.4

Game web xây dựng thành phố tiếng Việt, đồ họa Three.js 3D/SVG riêng và Canvas 2.5D nhẹ, chạy trên máy tính và điện thoại. Không dùng API AI hoặc tài nguyên Cities: Skylines. Đặc tả đang triển khai: Build_City_26_Full_Codex_Prompts.md; tiến độ và giới hạn tại docs/implementation-status.md.

Map 64×64, 20 m/ô (1.280×1.280 m), đường/đại lộ/cầu, RCI, điện/nước/nước thải/rác và dịch vụ; ngân sách/thuế/vay, cảnh báo và bản đồ lớp. Lệnh 1 bổ sung fixed timestep/đồng hồ chung/lịch tháng thật, cư dân/hộ/firm/xe có ID, lịch đi làm/về và route/vị trí thực; có chọn/theo dõi cư dân và Quan sát. Công viên có hợp đồng 10 ngày và escrow; ledger/command receipts chống trả hai lần. Growth, lưu lượng, dịch vụ, thuế và bus còn mô phỏng tổng hợp; chưa phải lifecycle/logistics/lane traffic đầy đủ.

Bản 0.4 thêm địa hình cao thấp, camera 3D, chất lượng nhẹ/vừa/cao và 14 nhiệm vụ theo cấp. Nhiệm vụ giữ điều kiện đủ một ngày, XP cấp một lần; mỗi lần lên cấp nhận 100 triệu ₫ game. Lưu/mở lại giữ receipt chống thưởng trùng. Đây là cấp thành phố casual; account/BXH server chưa triển khai.

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

Chơi 1×: một ngày mô phỏng trong 30 giây thực; Quan sát: 1 giây thực = 1 giây mô phỏng. Pause/modal/tab nền ngừng mô phỏng. Xem docs/time-model.md về timestep/ETA và giới hạn.

Migration schema 1/2 →3→4 mở map 38/48/64, giữ tọa độ/seed/pop, chuyển tiền/nợ ×100 đúng một lần. Bản thô local được archive trước khi chuyển; payload cloud pending giữ nguyên để retry. Load giữa hành trình/công trường giữ IDs, vị trí, progress và receipts. Schema 4 giữ heightfield mét và nhiệm vụ/cấp. Bản schema 3 dùng nền phẳng tương thích; không hạ schema 4 về client cũ.

Local tự lưu 15 giây; cloud 60 giây sau lần lưu đầu, một request mỗi lúc. Lỗi mạng/server giữ pending, dùng lại UUID; thiết bị stale báo conflict và cho mở cloud/lưu bản fork/xuất JSON. Thư viện city tách owner. Có backup local và import/export; kiểm tra dữ liệu trước load. JSONB hiện giới hạn 2 MB; snapshot lớn sẽ cần thiết kế Storage tại Lệnh 17.

## Supabase và tài khoản

docs/SUPABASE_SETUP.md và supabase/schema.sql; project đã có bản cũ dùng migrations theo thứ tự. Đã chạy SQL schema 4 và QA RLS transaction rollback trên project thật; chưa có QA Auth/JWT hai tài khoản qua Data API. PGlite tests không thay production Auth QA.

Luồng email cũ được giữ (xác nhận, đăng nhập, quên/đặt lại mật khẩu, logout). **Đăng ký mới đúng 3 ô Tên thành phố/Tài khoản/Mật khẩu, login username 2 ô, mã khôi phục server và legacy claim chưa triển khai**; thuộc Lệnh 17. Không coi email form hiện tại là đã đáp ứng yêu cầu mới. Server admin key chỉ đặt môi trường server; không gửi qua chat.

## GitHub → Vercel

Remote người dùng chỉ định: https://github.com/supportstudy26-hue/buildcity26.git. Vite build npm run build, output dist, vercel.json và CI Node 24 đã chuẩn bị. Vercel env frontend như trên; server-only secrets cho API mới khi triển khai. Redirect URLs dành luồng email cũ/provider thật, cấu hình domain production sau Ready. Chưa báo deployment hoàn tất khi chưa kiểm tra production Auth/save.

## Cấu trúc

src/game/core.js là facade; src/game/systems/ chứa hệ thống mô phỏng và save. src/game/renderer.js chỉ vẽ; src/config/ chứa catalog/đơn vị/tiền. src/app.js và index.html/style.css là UI; src/icons.js là icon SVG riêng. src/services/ chứa Auth/Data API/local/cloud sync. supabase/ chứa schema/migrations/RLS tests; scripts/verify-supabase.mjs là QA JWT Data API bằng hai tài khoản thật; tests/ gồm fixtures/migration/invariants/regressions. ASSET_LICENSES.md ghi nguồn tài nguyên.
