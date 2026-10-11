## 11/10 — HUD điện thoại gọn, đóng lớp bản đồ, hướng dẫn cư dân và rà soát nhiệm vụ

- Thu gọn HUD điện thoại: tên/cấp và 4 nút tài khoản–thông báo–lưu–cài đặt ở hàng đầu; bốn số liệu thật ở hai cột. Thanh quản lý nằm ngang, camera hai cột, danh mục xây cuộn ngang. Bỏ thẻ nhiệm vụ thường trực trên điện thoại; vẫn mở/nhận nhiệm vụ từ nút quản lý. Chừa safe-area và giữ vùng xây giữa màn hình. Sửa CSS camera cũ đặt cả top/bottom gây giãn và chồng nút.
- Lớp bản đồ thành bảng hai cột, chú giải mở khi cần, nút tắt lớp màu có chữ rõ. Chọn lớp tự đóng; ×/Esc/bấm ngoài/bấm lại nút lớp/đổi công cụ đều đóng. Không đổi dữ liệu bản đồ hay mô phỏng. Chỉ hiện ngày/tháng/năm nhỏ ở góc dưới; tạm dừng/tốc độ/thời tiết chuyển vào Cài đặt, clock vẫn 1 giây thực = 5 giây game ở 1×.
- Hướng dẫn đón dân thành bốn bước hạ tầng có giá thật và nút đưa camera tới cổng/khu nhà. An toàn/chất lượng sống giữ kiểm tra thật trong mục mở rộng; không tạo dân hoặc giảm mục tiêu để làm nhiệm vụ trông hoàn thành. Giữ tiền/tài khoản/tiến trình/schema Supabase.
- Browser: game thật trong iframe 320×568, 360×640, 390×844, 480×854, 768×1024, 1024×768, 1600×1000 và 844×390. Hộp HUD/quản lý/camera/thanh xây/ngày/minimap/hint không giao nhau hoặc tràn viewport. Chọn nước, ×, tắt lớp màu về tự nhiên đều đóng; bản lưu QA giữ 260 dân/526.000 BC. Chưa kiểm điện thoại vật lý hoặc khẳng định FPS trên điện thoại. Bằng chứng `hud-unblock-responsive-20261011.json`, `hud-mobile-clear-20261011.png`, `layers-mobile-compact-20261011.png`.
- Sửa đọc điều kiện all/any của nhiệm vụ để hiện từng mục tiến độ. Rà đủ 300 ID/điều kiện/provider/phụ thuộc/EXP/14 receipts cũ: **104 có provider, 196 thiếu; chỉ 16 hiện có thể đi tới theo chuỗi, 88 có provider bị chặn bởi tiền đề thiếu**. Điểm chặn đầu ở nhóm 6 giáo dục (school_attendance/school_access_pct). Đã có báo cáo chi tiết, không gọi 300 nhiệm vụ đã chơi đủ. `docs/mission-audit-300.md` và `.json`; còn cần enrollment/nhân sự/năng lực trường, dispatch dịch vụ thật, vận tải mở rộng và server BXH.
- Tối ưu CPU giữ kết quả: index hộ gia đình một lần, cache tối đa 512 tuyến theo từng thành phố/phiên bản mạng, lấy hệ số thời tiết một lần/tick, cache tập điều kiện và tạo context nhiệm vụ khi cần. 12 lần reconcile cùng snapshot 5.000 dân: median **349,79 → 14,08 ms**, SHA state giống nhau. Đây là số đo riêng reconcile, không phải FPS.
- Renderer 5.000 dân vẫn chỉ vẽ 50 người/xe, 169 calls/416.526 triangles, medium/DPR1/Chrome155/MacIntel/1280×720. Lần đo sau 30,05s: 312 frames (~10,38 fps trung bình), median 14,9 fps, p95 frame167,5ms; CPU tick median9,7/p95 14,3ms, heap93,33MB. Lần trước median57,1/p9549,1ms; **không kết luận FPS cải thiện hoặc đã hết lag**. Tối ưu CPU riêng đã chứng minh nhưng render đông dân còn cần tối ưu/đo lại; chưa GPU bytes/RSS/worker. JSON trước/sau giữ nguyên số đo.
- Kiểm: suite hiện tại 208/208 PASS (gồm các test module đường sắt/hàng không chưa nối game); sau sửa lazy-context/cache chạy lại 25/25 foundation/campaign/road PASS; HUD/resident/campaign17/17 PASS. Build cuối và diff check PASS. Không có script lint/typecheck riêng. Tài khoản/RLS/save cloud/claim chống trùng live đã PASS ở ea355d5; không thay server/schema trong chặng này. Các file rail/aviation/engineered-roads đang phát triển được giữ local, **không coi đã có chức năng vận tải trong bản phát hành này**.
- Phát hành chặng này: code commit `fd9413f74e47bb019905fb7644b02242d64f9521` đã push GitHub main. Vercel deployment `836qe8J6Vcf8x1fB9zPv7QeKuxbi` **Ready**, build 15 giây; Source trên dashboard khớp đúng SHA. Domain https://buildcity26.vercel.app/ mở game thật với nhãn ngày 01/01/2026 thay thanh giờ dài và giữ bản lưu legacy 176 dân/12 tỷ. Ảnh điện thoại là kiểm thử iframe localhost cùng code; chưa điện thoại vật lý. Các mục cũ bên dưới là lịch sử, phần bị thay đổi lấy mục này làm chuẩn.

## 10/10 — Bảy đường mặt đất, giao lộ và mười cảnh quan 3D (local đã kiểm, chưa xác nhận production)

- Bảy profile có logic/giá/route/mesh thật: đường dân cư hai chiều, một chiều đổi hướng, hàng cây, đại lộ phân cách, làn bus, đi bộ và xe đạp. Route phân mode và hướng; bus/ô tô lệch làn đúng profile. Đường xe đạp hiện cho walk/bicycle và chặn ô tô nhưng **chưa có agent xe đạp**. Tín hiệu và người/xe dùng chung clock, pha từng hướng có vàng/clearance và pha người đi bộ; inspector có signal/yield/off và hàng chờ. Chưa có cao tốc, vòng xuyến, đường cong, nâng/hạ hoặc nút khác mức.
- Thêm 10 model cảnh quan riêng: tháp đồng hồ/quan sát/biểu tượng, cột cờ, tượng đài, cổng chào, đài phun, vườn hoa, ghế, đèn. Có giá/upkeep/nhu cầu điện nước; amenity lấy tác động lớn nhất, tối đa 6 điểm, cần kết nối/tiện ích. Không cung cấp điện/nước/viễn thông. Giữ pilot 13 kiến trúc tư nhân + 24 dịch vụ, tối đa 50 người/xe được vẽ chung (low/mobile 30), đặt công trình xuất hiện ngay, clock 1:5 và bản lưu cũ.
- UIRefresh có 48 SVG và HUD snapshot thật; catalogue/inspector có tên/giá/điều kiện/tác động. Responsive sáu viewport không tràn ngang (`hud-responsive-20261010.json`); chưa kiểm điện thoại vật lý. Ảnh/model thật, không gọi hero hoặc ảnh tham chiếu là thành phố đang mô phỏng.
- Catalogue đúng 300 nhiệm vụ/100 cấp theo bảng EXP; 104 nhiệm vụ có metric hỗ trợ, phần chưa có hệ thống khóa rõ; 14 nhiệm vụ/XP/receipts cũ giữ. Migration claims `202610100003_mission_campaign.sql` đã chạy live (`mission-migration-live-20261010.png`); claim server có owner/CAS/receipt và chống cấp lại tiền. **Client world chưa authoritative, BXH cạnh tranh chưa có**. Không tuyên bố toàn bộ 300 hoàn thành gameplay.
- Codec lossless 5.000 dân đã được test dưới 2 MB, giữ money/ledger/progression ngoài payload nén và đọc JSON cũ; không cắt dữ liệu mô phỏng. Fixture hiện tại 7.268.052 → 632.627 byte, deepEqual/canonical SHA roundtrip đạt. Nén/giải nén còn đồng bộ (~1.085/729 ms trên máy đang tải), chưa đo cloud live 5.000 dân; cần worker trước gọi lưu đông dân không giật.
- Kiểm cuối **179/179 PASS**, không fail/skip, **201,25 giây**, log `../../work/roads-release-tests.log`; build **PASS, 5,93 giây**, log `../../work/roads-release-build.log`. Hai chunk >500 kB còn warning. Browser xây/nâng đường và cảnh quan có trừ tiền, không đè ô đã chiếm; reload giữ 260 dân/526.800 BC/clock 63.386 giây/playback dừng (`roads-browser-builds-20261010.json`, `roads-save-reload-20261010.json`). Ảnh `roads-landmarks-{day,night,near,overhead}-20261010.png`, video `roads-traffic-20261010.webm`.
- Đo game 260 dân/36 công trình/71 đường: 10 giây/452 frames, median 58,8 FPS, frame p95 33,5 ms, CPU tick p95 1,9 ms, 55 calls. Fixture 5.000 dân/1.792 đường/2.289 agent active/50 render: 30,06 giây/1.164 frames, median 57,1 FPS, frame p95 49,4 ms, CPU tick p95 18,4 ms, 169 calls, heap 87,48 MB (`performance-roads-5000-20261010.json`). Median không chứng minh 60 FPS ổn định: trung bình 38,7 frames/s, có long task 2.404 ms. Chưa GPU bytes/RSS/điện thoại vật lý; routing còn đồng bộ.
- **Phát hành:** HEAD local `46098ef`; production Ready đã xác nhận gần nhất `cfa6aaf`. Các diff của chặng trên chưa là deployment đã xác nhận. Chi tiết/phạm vi còn thiếu tại `roads-landscape-status.md`; các mốc bên dưới là lịch sử và bị mục này thay thế ở phần đã đổi.

## 10/10 — Đặt công trình xuất hiện ngay (yêu cầu mới nhất)

- Thay chế độ chờ 15 phút game: đặt mẫu nhà/cửa hàng/xưởng là materialize mesh ngay trong lệnh place, kể cả tạm dừng hoặc chưa có tiện ích. Công viên qua lệnh construct cũng hoàn thành ngay, giữ hợp đồng và nhiệm vụ thật. Đường, điện, nước và dịch vụ vẫn quyết định hoạt động/cư dân; không tạo dân cư giả hoặc miễn chi phí.
- Bản lưu cũ được kiểm tra trước, sau đó các ô chờ và công viên đang thi công được hoàn thành khi mở. Hợp đồng đã giữ vốn không thu lại; tiền, đồng hồ, người và lựa chọn kiến trúc giữ nguyên. Dùng cấu trúc save hiện có, không đổi schema SQL/RLS. Các nâng cấp cấp công trình vẫn theo điều kiện và thời gian nâng cấp hiện có.
- Browser localhost: game đang dừng tại 00:48:39; đặt biệt thự chưa nối đường bằng lệnh game tăng sức chứa 24→36 ngay. Sau đó chọn Nhà mái ngói và bấm bản đồ bằng chuột, menu tự đóng, mô hình xuất hiện ngay, sức chứa 36→44; ngân sách chỉ trừ 800.000 phí cấp phép mỗi ô, giá xây giữ trong sổ tư nhân. Ảnh instant-building-placement-20261010.png.
- Giữ cache danh sách công trình để không quét toàn bản đồ mỗi bước mô phỏng. Không thêm geometry/texture hoặc thay giới hạn 50 người+xe. Kiểm tra cuối: toàn suite 158/158 PASS, không skip, 95,82 giây; build PASS 16,44 giây; diff check sạch. Reload browser giữ 2 dân, 44 chỗ ở, 9.902.600 BC và clock 2.919 giây đang dừng, không console error. Đã push cfa6aafb922ddef16734216f221e06432846b33f; Vercel production 5iH7wTySfRgMtByVunH93PwY4kyA Ready, domain https://buildcity26.vercel.app/ (xác nhận dashboard ngày 10/10).

## 10/10 — Báo rõ quy hoạch đang chờ xây (chặng trước, đã thay bằng đặt ngay ở trên)

- Giữ cơ chế xây thật: tư nhân xây mẫu 3D đã chọn khi đủ đường nối cổng, điện, nước, nước thải, nhu cầu và vốn; 900 giây game thi công (3 phút thực ở 1×). Không đổi giá, tài khoản hay schema bản lưu.
- Hướng dẫn khi chọn mẫu phân khu ghi rõ tự xây; hover ô đã quy hoạch và inspector báo điều kiện thiếu, tiến độ và thời gian còn lại. Đưa điều kiện và nút chọn tiện ích lên đầu inspector; đặt quy hoạch bằng tay có thông báo lý do đang chờ.
- Kiểm tra: 9/9 development-upgrades PASS, gồm phát triển cả 13 mẫu mesh, dừng/tiếp tục khi mất tiện ích, nâng cấp và save/load giữa thi công; build PASS 11,03 giây. Browser mã mới localhost: dựng đường/trạm điện/ô dân cư bằng lệnh game thật; inspector hiện chính xác thiếu nước sạch và nước thải, hai điều kiện đường/điện đạt. Bổ sung nước/nước thải và chạy 8×: nhà 3D hoàn thành, inspector Đang hoạt động, 24 chỗ ở, 2 cư dân; nguyên giá 432 triệu tư nhân, phí quy hoạch 800.000. Không có console error. Bằng chứng development-missing-utilities-20261010.png và development-house-completed-20261010.png.
- Giới hạn: tiến độ xây casual, chưa mô phỏng vật tư và đội thi công tư nhân. Chưa xác nhận triển khai thay đổi này trên Vercel.

## 10/10 — Giao diện sáng, khối 3D rõ hơn và báo giá xây thống nhất

- HUD trắng ngà/xanh rừng; chữ, thẻ công trình, inspector, nút và trạng thái lỗi được chỉnh độ tương phản/khoảng cách. Menu chọn xong vẫn tự đóng. Giá quy hoạch và vốn xây tư nhân tiếp tục ghi riêng.
- Camera khởi đầu/nút Về trung tâm tìm khu có công trình thật; thành phố trống dùng cổng vào. Cây dùng ba biến thể với geometry instancing có sẵn; chỉnh ánh sáng ngày, kính, mặt đường và nền móng. Không thêm texture, post-processing hoặc tăng giới hạn người/xe (50 tổng, low/mobile 30). Canvas đồng bộ bảng màu.
- Sửa lỗi giá hover Canvas dùng công thức cũ; lệnh xây, HUD và ghost 3D dùng chung placementQuote. Có kiểm ngân sách, cầu, nâng đường, nước, dốc, ngoài địa phương và ô đã chiếm. Phá dỡ hiển thị cả vốn nâng cấp công chưa sử dụng được hoàn trả, không tính vốn chủ đầu tư vào tiền thành phố.
- Kiểm tra: 156/156 npm test PASS (109,99 giây); build cuối PASS (4,75 giây), git diff --check sạch. Không có script lint/typecheck trong package. Browser localhost 1280×720: 3D → Canvas → 3D giữ 57 dân/1,8 triệu/clock; bấm xây đường thiếu tiền hiện Cần 14 triệu, Thiếu 12,2 triệu và không trừ tiền. Reload giữ bản lưu. Ảnh interface-3d-forest-refined-20261010.png, interface-build-catalog-refined-20261010.png, canvas-placement-budget-20261010.png.
- Chỉ số tại cảnh QA nhỏ, đang dừng: auto/low, DPR1, khoảng 30 FPS, 16 draw calls/8.564 triangles, 10 geometries, 0 textures; không phải benchmark thành phố đông dân. Chưa đo lại 5.000 dân sau chỉnh cây, chưa kiểm điện thoại vật lý. Bộ model chi tiết đầy đủ và các hệ thống còn thiếu ở mục dưới chưa hoàn tất.
- Tài khoản, Supabase/RLS, save schema và mô phỏng giữ nguyên; không migration. Đã push commit a7ec11b80e1e0fb8889dac7048f456897ae6898f lên main. Vercel deployment 3wc2TSzAD4wY6FMXcpJdK8nBe2kq Ready, 26 giây, Production Current với domain https://buildcity26.vercel.app/ (xác nhận dashboard lúc 16:17 ngày 10/10).

## 10/10/2026 — Vốn khởi đầu mới 10 tỷ đồng

Đổi NEW_CITY_CASH_BC thành 10.000.000 BC = 10 tỷ ₫. Server đăng ký, thành phố thường/địa phương và bắt đầu lại dùng cùng hằng số; trang chủ/form/thông báo hiển thị từ hằng số. Không cộng lại khi đăng nhập, không sửa số dư/ledger của bản lưu cũ; thưởng lên cấp vẫn 100 triệu. Không thay schema hay cần SQL.

Giao diện game dùng bảng trắng ngà/xanh rừng, chữ số đậm, trạng thái chọn rõ; menu tài chính cùng bảng màu. Nền đất giảm sắc vàng và độ tương phản ô, cây xanh đậm, nước xanh lam và ánh sáng trung tính; không tăng geometry, texture hoặc hiệu ứng GPU. Tài khoản vẫn dùng luồng/form thật, không đổi RLS/save/clock hay cap chung 50 người+xe (low/mobile30).

Kiểm tra: 27/27 account server/địa phương/vốn/nâng cấp đạt, rồi toàn suite149/149 đạt (192,957 giây), build đạt (27,90 giây), diff check đạt. Browser desktop1280×720: màu HUD/menu/market, form đúng3ô/10tỷ; save thử cũ57dân/1,8triệu/clock02:13:39 giữ nguyên sau lưu và tải lại. Ảnh interface-forest-paper-20261010.png. Chưa kiểm màu trên điện thoại thật; không benchmark lại vì chỉ đổi màu/vật liệu và CSS, không tuyên bố FPS tăng. Production: GitHub main `cda29fb0f4faeb348bea5eba457dcba62964135c`; Vercel deployment `ye5KefMga3vWrHi9X2tbSZ4VXALi` Ready23giây, domain https://buildcity26.vercel.app/ đã kiểm UI mới/10tỷ trên trang chủ và màu HUD thật. Bằng chứng interface-forest-paper-production-20261010.png và deployment-10-billion-theme-ready-20261010.png. Live API/Supabase hai tài khoản QA: vốn10tỷ cho bản thường/địa phương, openingCash đúng, retry giữ nguyên state/không cộng lại; signup/login/recovery/rotate/revoke/logout, RLS A/B/owner-spoof/hai thiết bị/save conflict409 đều PASS. Không cần cấu hình/key/SQL mới.

## 2026-10-10 — Kiến trúc, giá xây/nâng cấp, thời tiết và thị trường server

- 13 bản thiết kế nhà/thương mại/công nghiệp chọn và xây thật, mesh 3D khác hình dáng theo ảnh tham chiếu. Menu tự đóng sau chọn; phí quy hoạch 800 nghìn/400m² tách giá xây 81–633,6 triệu từ diện tích sàn/đơn giá. 24 dịch vụ giữ factory riêng; sửa giá công trình/đường/cầu theo bảng/công thức và giữ nguyên giá lịch sử bản cũ. Bỏ nâng miễn phí theo ngày; hợp đồng nâng 15 phút game có escrow/dự phòng, tiện ích mất thì dừng, sức chứa/điện nước/vận hành tăng theo cấp. Cấp 4–5 khóa rõ vì chưa có viễn thông/an sinh/dự phòng đủ F.
- Dự án tư nhân chỉ hoàn thành khi đủ đường/điện/nước/nước thải/nhu cầu, vốn tư nhân riêng không cộng vào ngân sách/BXH. Vốn người chơi mới 100 triệu không đổi. Các trường mới additive trong schema 6; save cũ vẫn mở. Sửa snapshot bỏ optional undefined để biên nhận retry so sánh JSON ổn định. Weather dùng chung clock: mưa chậm đường, nắng nóng tăng tải điện/nước. Chưa thủy văn/ngập/bão.
- Thu gọn attribution bản đồ thành nút nguồn nhỏ, nguồn/ODbL/giới hạn và tranh chấp vẫn trong hộp thông tin. Inspector nói rõ nguyên giá, phí đất, sức chứa và điều kiện nâng. Nút cẩm nang đổi thành Đóng cẩm nang cho đúng thao tác.
- Cổ phiếu 6 công ty hư cấu, giá server/biểu đồ 12 kỳ, mua/bán/danh mục/lãi lỗ/phí; xổ số 6/45 chọn số, mua vé, lịch/kết quả/vé trên server và nhận thưởng chống lặp. Chu kỳ 18.000 giây thực UTC, không dùng clock game. Lệnh tài chính cập nhật city money/ledger/revision và holdings/vé atomically; RLS/private revoke, owner/CAS, durable request và ngăn chi tiếp khi phản hồi chưa chắc chắn. Không tiền ngoài game, không runtime AI.
- Migration `202610100001_financial_game.sql` đã chạy Success trên project adnmfknbskbagiahstim. Sửa lỗi SQLSTATE 40001 làm PostgREST retry bằng migration `202610100002_conflict_http.sql`; đã chạy Success, không reset dữ liệu/khóa/RLS. Các RPC save/delete/finance business conflicts trả HTTP 409/PT409, client vẫn nhận bản máy chủ/giữ local khi xung đột.
- Kiểm: npm ci PASS; toàn bộ 149/149 tests PASS (222,063 giây); sau yêu cầu chốt cap 50/30, chạy lại 11/11 mobility/quality/budget PASS (2,984 giây), build PASS (9,66 giây). 5/5 DB/finance/retry sau sửa CAS PASS. Live Supabase: mua bán/sổ tiền/phí, ticket 2 vé, retry cùng request, không nhận sớm, A/B/guest, thiết bị khác, conflict HTTP409 đều PASS. Live tài khoản: signup retry/login/recovery/rotate/revoke/logout, profile/RLS/owner spoof, hai thiết bị/save/delete QA PASS. Không in password/token/recovery, chỉ QA account riêng; không chi tiền bản người chơi.
- Browser thật desktop 1280×720: xây từ 100 triệu, 4 loại model hoàn thiện, save/reload giữ 57 dân/1,8 triệu, nguyên giá và khóa nâng có điều kiện, bảng giá Supabase và chọn nhanh đúng 6 số. Ảnh `city-3d-playable-20261010.png`, `market-server-20261010.png`. Chưa xác minh cảm ứng/điện thoại thật: viewport override không đổi DOM kích thước, không gọi screenshot desktop là mobile.
- Giới hạn render theo yêu cầu cuối cùng: tối đa 50 đối tượng tính chung cả người lẫn xe ở mọi quy mô dân số, low/mobile=30; nearest heap ưu tiên theo dõi, cache active theo clock step, không giảm dân số hoặc bỏ hành trình thật. Chuyển động/render chạy client; không ghi từng frame lên Supabase. Đồng bộ cloud chỉ dirty mỗi 60 giây, local 15 giây; thị trường chỉ tải khi mở/refresh/đổi kỳ, countdown không gọi server mỗi giây.
- Đo bản chốt cap 50: 5.000 dân, medium/DPR1, Chrome 155/IAB 1280×720 trong 30,05 giây: đúng 50 rendered / 1.045 visible, vẫn 1.988 hành trình đang hoạt động, 833 xe, 2.500 người có việc và 512 lượt đến. Median 30 FPS, p95 frame 50,2ms, tick p95 21,4ms, 51 draw calls / 129.214 triangles. 7 long tasks, dài nhất 1,78s gồm chuẩn bị fixture; heap 78,18MB, không đo GPU/RSS. Bằng chứng JSON/ảnh `performance-3d-5000-cap50-20261010`. Giới hạn render không thay thế tối ưu CPU/worker còn thiếu.
- Đo low cap 30 với cùng 5.000 dân: 30,03 giây, đúng 30 rendered, median 29,9 FPS, p95 frame 50ms, tick p95 18ms, 40 draw calls / 79.746 triangles, heap 60,47MB. Dữ liệu dân/xe/việc/lượt đến giữ nguyên. JSON `performance-3d-5000-cap30-20261010.json`.
- Số đo chặng trung gian cap100/150 (chưa là cap cuối 50/30): 30 giây thực, Chrome 155/IAB 1280×720, medium/DPR1, cùng seed/góc rộng: sau cap 1.000 dân 100 rendered/245 visible/444 đang có journey, median 30,6 FPS, p95 frame 50ms, tick p95 6,6ms, 50 draw calls/105.702 triangles. 5.000 dân 150 rendered/1.045 visible/1.988 đang có journey, median 30,1 FPS, p95 frame 50,2ms, tick p95 27,4ms, 51 draw calls/150.326 triangles; 512 lượt đến, 833 xe và 2.500 việc làm giữ nguyên trước/sau. Trước cap: 220 rendered, 164.302 triangles, tick p95 29,1ms, median vẫn 30,1 FPS. Long tasks 12→5 nhưng lần dài nhất ~1,9s gồm chuẩn bị fixture; không khẳng định 60 FPS hay CPU tăng đồng đều. Có JSON trước/sau và screenshot, không RSS/GPU đo riêng.
- Production: commit `6dde06529f36d8f5652e99f432c4b3d50ec0ac94` đã push GitHub main. Vercel deployment `7HDdYVRnJXUBUZnuqALqvUYXYvDY` Ready, 17 giây, gán domain https://buildcity26.vercel.app/. Reload domain chính: renderer 3D/auto low budget30, thị trường đọc đủ 6 giá từ Supabase, lịch kỳ sau18:00 giờ Việt Nam và guest chặn giao dịch. Bằng chứng `deployment-cap50-ready-20261010.png`, `market-production-20261010.png`.
- Còn thiếu: toàn Lệnh 0–28/A–I chưa xong, 14 nhiệm vụ hiện hữu chưa 300, 216 mẫu chưa đủ model chi tiết, nhân sự/hàng đợi/dispatch và F4–5, worker/path queue, terrain rộng sparse chunks, BXH server chống gian lận. Trần save cloud 2 MB: fixture 1.000 dân ~2,13 MB và 5.000 ~6,48 MB chưa lưu được; không gọi save city đông dân hoàn tất. Cần compact/shared journeys/chunk snapshots trong chặng riêng có migration. Không tăng số model/render chỉ để che giới hạn.

## 2026-10-09 — Chọn công cụ xong tự đóng menu xây dựng

- Đã sửa vòng lặp chọn công cụ mở lại menu: nút nhóm mở danh mục, chọn một thẻ đóng danh mục ngay và giữ công cụ để bấm/kéo xây. Bấm lại nhóm để đổi; nút × đóng menu và giữ lựa chọn; Esc trở về Khám phá. Quản lý tuyến vẫn mở chức năng thật.
- Hướng dẫn xây rút thành nhãn nhỏ phía trên thanh công cụ, `pointer-events: none`; giữ thông báo giá thực tế/lỗi địa hình. Bỏ vị trí inline cũ khiến nhãn treo giữa bản đồ. Đóng bảng tin khi vào xây; mô tả đầy đủ giữ trong tooltip thẻ và thông tin công trình. Không đổi mô phỏng, tài khoản, schema hoặc save.
- Kiểm tra localhost trong trình duyệt thật 1280×720: chọn Đại lộ → menu ẩn, con trỏ crosshair, focus về canvas; bấm canvas nâng một đường lên đại lộ, tiền 26 → 18 triệu và vận hành -545.000 → -570.000 đ/tháng. Mở nhóm lại giữ Đại lộ; × giữ công cụ. Chọn Trạm nước khu phố cũng tự đóng; hit-test giữa nhãn trả canvas `world`, bảng tin ẩn. Esc khôi phục Khám phá và ẩn nhãn xây.
- Build bản cuối PASS (11,45 giây). Chưa kiểm trực tiếp thiết bị cảm ứng; không công bố số FPS mới vì không đổi renderer. Cảnh báo chunk Three 555 KB còn. Production commit `ff21ac9` đã được xác nhận **Ready** trên Vercel (deployment `6iyV53MbtayWb57joJFntDT65cmN`, build 14 giây), domain chính `https://buildcity26.vercel.app/`. Kiểm UI production 1063×710: chọn Đường phố tự đóng menu, giữ nhãn và công cụ; hit-test nhãn trả `world`; bản cũ vẫn 176 dân / 12 tỷ; console không có lỗi. Bằng chứng: `build-selection-closed-production.png`.

# Build City 26 — trạng thái triển khai

## 09/10 — 13 mẫu kiến trúc riêng, giữ bản lưu và kiểm hiệu năng

Đã triển khai model gốc cho 4 nhà thấp tầng, 3 chung cư theo cấp thực, 3 thương mại và 3 xưởng/kho. Hình dáng khác nhau: mái ngói prism, sân trong chữ L, biệt thự có cánh bên, chung cư giật cấp/hai khối/ban công, nhà chợ, văn phòng kính, xưởng mái đôi/kho/tank chế biến. Hash ô đất giữ mẫu ổn định khi save/load; palette mặt tiền, mái và accent có biến thể. Inspector có tên kiến trúc. Three và Canvas dùng chung descriptors; không sửa tiền/dân/logic/save schema. Mái chung chỉ 8 tam giác, dùng instancing; cửa sổ strip thay nhiều ô cửa, không thêm texture. Thấp tầng 8–13 parts, chung cư cấp 3 12–18, thương mại 9–16, công nghiệp 9; details xa có LOD.

Sửa cap renderer nhận sai nhịp rAF phân số bằng tolerance 0,5 ms, tránh bỏ khung chỉ vì 16,6 < 16,67 ms. Giữ cap 30/60 theo profile, không đổi thời gian mô phỏng.

**Kiểm:** 17/17 tests chặng này đạt, 0 skip, 20,58 giây (thiết kế/phân bố, giới hạn footprint/parts, save không mutation, màu overlay, raycast mái shared, frame timing, catalog/utilities và benchmark có employer/journey thật). Trước đó toàn suite 110/110 đạt. Build sau sửa đạt 15,30 giây; Three 555,04 KB / gzip 142,84 KB còn warning >500 KB. Browser không có JS error; ảnh `architecture-real-closeup.png` là renderer thật, không concept. Khu QA trong benchmark tách riêng, không ghi tài khoản/save/BXH; renderer game thường dùng chính module này.

**Đo 30 giây, IAB Chrome 155, 1280×720, medium/DPR1, cùng fixture/seed/góc rộng:** 1.848 cư dân, 924 có việc, 596 đang đi, 308 xe, 328 lượt đến. Trước sửa nhịp vẽ: median 30,7 FPS, 1.088 frames (~36,3 frames/s), p95 33,8 ms, 7 long tasks, dài nhất 802 ms. Sau: median 58,5 FPS, 1.211 frames (~40,4 frames/s), p95 49,4 ms, 17 long tasks, dài nhất 472 ms. Cả hai 40 draw calls, 57.576 triangles, 17 geometries, 0 textures. CPU tick p95 sau 3,9 ms. Median tốt hơn nhưng p95/long task chưa ổn định; không tuyên bố 60 FPS duy trì. JSON nguyên số đo tại architecture-performance-before/after.json. Chưa thiết bị điện thoại thật hoặc đo 10.000 người ở chặng này. Snapshot fixture 2.477.668 byte vượt trần cloud 2 MB hiện tại; fixture không ghi cloud, cần xử lý snapshot lớn riêng trước gọi save đông dân hoàn tất.

**Phát hành:** giao diện/vốn 697e2ee đã Vercel Ready và kiểm domain chính. Chặng kiến trúc b59929d đã push GitHub; Vercel deployment 4ZxdJRdBAZv4vMB5sF2EomNUSsc6 Ready (16s). Reload https://buildcity26.vercel.app/ thấy model mới trong thành phố legacy: vẫn 176 dân/12 tỷ, đổi 3D→Canvas→3D không thay số dư/dân và không lỗi JS. Ảnh architecture-production-3d/canvas.png. Con số 12 tỷ này thuộc bản lưu cũ được giữ theo yêu cầu, không là vốn tài khoản mới; account mới vẫn 100 triệu/đất trống.

## 09/10 — giao diện từ gói người dùng, chặng phát hành mới

Đã xem cả bốn ảnh Build_City_26_Giao_Dien.zip. Dựng lại trang chủ, đăng ký, đăng nhập và HUD theo xanh đêm/xanh ngọc/vàng, chữ lớn và bố cục chia ảnh/form. Trang chủ là màn đầu mỗi lần mở; nút Bắt đầu xây dựng mở đăng ký khi chưa đăng nhập, không đi thẳng vào thành phố tutorial cũ. Tài khoản mới do server tạo đất trống/100 triệu; không xóa account hoặc save cũ. Chọn địa phương/recovery/email cũ vẫn là luồng thật.

Trang chủ chưa tải core/Three.js; đã kiểm trước bấm có 0 canvas world3d. Sau mở game, quay trang chủ dừng simulation và GPU draw; tải lại không cộng thời gian offline. Ảnh ven biển riêng dùng built-in imagegen, WebP 481.128 byte, không phải cảnh mô phỏng; ghi chú trên UI. Toàn prompt/nguồn tại art-direction.md. Không có AI API runtime, không thêm texture cho game.

Kiểm: toàn 110 tests đạt (203,95s), build sau sửa điều hướng đạt 9,79s. Browser 1280×720: home→Bắt đầu→đăng ký đúng3input; card bottom715px, hiển thị đủ; hiện/ẩn password đổi type thật; login2input; mở game giữ26triệu bản kit đã lưu; quayhome. Không có JSerror. Ảnh reference-home/reference-register/reference-login; chưa mobile mới. Production commit 697e2ee đã Vercel Ready và reload domain chính hiện trang chủ mới; form đăng ký 3 ô mới đã kiểm thực (production-new-register.png). Không thêm BXH giả vào trang chủ; BXH server vẫn chưa hoàn tất.

Kiến trúc riêng đang được kiểm/đo ở chặng ngay dưới; không coi ảnh concept là chất lượng model trong game.

## 09/10/2026 — trạng thái hiện tại, vốn mới 100 triệu

Mục này thay các thông tin chờ GitHub/Vercel ở lịch sử bên dưới. Đã đọc toàn bộ đặc tả 1.356 dòng mới và cập nhật bản trong repo; `feature-coverage.md` đối chiếu 20 nhóm I, 32 dịch vụ S, mẫu công trình và bảng giá. Toàn Lệnh 0–28/A–I **chưa hoàn tất**; không đánh dấu catalog/mesh là hệ thống dịch vụ I3 hoàn chỉnh.

**Đã chỉnh mã và chơi được:**
- Vốn của tài khoản mới và thành phố mới là **100 triệu ₫ = 100.000 BC**, cả bản thường và địa phương Việt Nam. Server tự dựng trạng thái đầu, không nhận số tiền khởi đầu từ client. Retry đăng ký vẫn trả thành phố cũ, không cấp lại tiền. Save/ledger cũ giữ số dư; schema 6 không đổi.
- Khách mới bắt đầu đất trống. Menu bắt đầu lại có màn xác nhận, giữ địa hình/tên và tạo backup trước khi thay; cloud cũ giữ nguyên. Cổng vào có nút đưa camera đến đúng ô xây đường.
- Có **24 công trình** gồm ba trạm nhỏ (điện 100 kW, nước/nước thải 15 m³/ngày), các nhà máy nước, trung tâm rác, trường trung học/đại học, bệnh viện, cứu hỏa/cảnh sát lớn, quảng trường và thể thao. Công suất/phạm vi/phí thật; đường đứt hoặc thiếu tiện ích ảnh hưởng vận hành. Thu gom lớn xử lý rác nhanh hơn, alias dịch vụ không nhân đôi hạnh phúc.
- Menu xây có hình SVG riêng nhẹ, tên/giá/phí/công suất; model dùng geometry/material chung. Không thêm texture hoặc WebGL context. Chưa có nhân sự, hàng đợi, giường bệnh/xe dispatch riêng cho các biến thể; chưa đáp ứng đủ I3/I4.

**Kiểm tra:** npm ci đạt (25 packages, 0 vulnerabilities); `npm test` **110/110 đạt**, 0 skip, 165,11 giây; build đạt **32,90 giây**. Regression gồm tạo tài khoản server 100.000 BC ở bản thường/Hải Phòng, openingCash đúng, tải lại không nhận vốn thêm, save cũ không giảm tiền, cả 24 công trình save/render, tiện ích/coverage/garbage và xây thành phố có dân/việc làm với 100 triệu. Bài địa phương trước đó thất bại vì còn so với fixture tutorial 12 tỷ; đã sửa kỳ vọng theo quyết định mới và chạy lại toàn bộ đạt.

**Browser thực:** localhost5180 1280×720: reset từ bản đang có tạo backup, 0 dân/100 triệu; xây 5 đường + ba trạm nhỏ + dân cư/thương mại, còn **26 triệu**. Lưu/reload vẫn 26 triệu, không có JS error. Ảnh `empty-start-100-million.png`, `starter-utilities-budget.png`, `expanded-building-menu.png`. Chưa kiểm lại điện thoại: viewport override IAB không có hiệu lực. Chưa benchmark đông dân mới; số đo trước 19,9 FPS/1.000 cư dân vẫn chưa đạt mục tiêu. Three chunk 550,03 KB (gzip 140,70 KB) còn warning.

**Production:** GitHub đã push 9108038 và Vercel Ready; tên miền chính **https://buildcity26.vercel.app/**. Server secrets đã cấu hình. Supabase Site URL/redirect domain chính đã lưu và kiểm UI (`production-supabase-redirects.png`). Bản vốn/công trình/giao diện697e2ee đã push và Vercel Ready (deployment 6EwyAXcwD8m7Qwrzt8RpgdhSrmid); đã reload domain chính và kiểm form mới.

**QA tài khoản thật (bản 9108038):** đăng ký A/B, first city Hải Phòng, retry idempotent, trùng username, sai mật khẩu, profile/RLS riêng, chống owner spoof, chặn đọc/sửa/xóa/save người khác, own save retry và lưu/mở bằng phiên thứ hai đã đạt. Bài stale CAS chưa đạt (mã lỗi chưa xác nhận); một lần retry khác dừng do server Auth 503. Chưa chạy xong recovery/rotation/revocation/logout toàn chuỗi; chưa gọi toàn tài khoản production hoàn thành. Script chỉ dùng key công khai/JWT, không admin key. Tài khoản QA còn trong Auth, credentials chỉ ở RAM.

**Phần còn lại:** worker; thế giới xây 12,8 km/sparse streaming/mua đất; graph lane/parking/đa phương thức; dịch vụ có staff/queue/dispatch/resources; toàn BOQ và thi công; lifecycle/firm/hộ; nâng cấp F; 300 nhiệm vụ E/account EXP; BXH server authoritative và các nhóm I chưa triển khai. Thứ tự và giới hạn tại CODEX_HANDOFF/feature-coverage. Không có nút giả cho các nhóm chưa triển khai.


Đặc tả mới nhất: Build_City_26_Full_Codex_Prompts.md, 1.111 dòng, bổ sung Lệnh 20 / Phụ lục H. Đã đọc toàn bộ đặc tả và kiểm tra thay đổi. Các mốc dưới đây là lịch sử triển khai, không phải xác nhận hoàn tất toàn đặc tả. Giao diện tiền Việt (₫), 1 BC nội bộ = 1.000 đồng game; không dùng API AI.

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

## Chặng ưu tiên 08/10 — đồng hồ 1:5, schema 5

Đã chỉnh mặc định 1 giây thực = 5 giây game; bước physics 1 giây, interpolation 3D cùng clock; Observe 1:1; Pause/Resume giữ multiplier; playback/timestamp nằm trong save. Không bỏ elapsed frame dài; batch 120 bước giữ backlog và có thông báo. Hidden/modal pause, reload không bù offline. Migration 3/4 giữ ngày giờ, cư dân/ID, tiền và EXP. Các hợp đồng cũ giữ nguyên thời lượng, preset A5 ngắn chưa làm.

Kiểm tra: 78/78 tests PASS, build PASS (Three chunk vẫn 547,25 kB). Injected 10/60 giây tại 30/60/120 FPS cho 50/300 giây và state như nhau; đi bộ 65 m ở 1,3 m/s mất 50 giây game. Migration 202610080004_clock_saves.sql chạy thật trên Supabase, accepts_schema_5=true; ảnh supabase-clock-schema-verified.png. Không xóa dữ liệu cũ; chưa kiểm chứng Auth/JWT hai tài khoản.

Theo yêu cầu mới nhất, chặng đang làm là mỹ thuật + tối ưu Lệnh 2/15/G5–G6. World 12,8 km, mua đất, 100 bậc/300 nhiệm vụ và hợp đồng nâng cấp F vẫn **chưa hoàn tất**. Không đánh dấu available chức năng mô phỏng chưa có.


## Việt Nam — chặng A, địa hình thật và quần đảo (08/10/2026)

Đã có màn chọn 34 tỉnh/thành; tìm tên hiện tại/tên cũ, xem ranh giới, đổi vị trí khu chơi, xem trước cao độ/thủy hệ thật rồi tạo thành phố chơi được. 36 gói địa hình tải theo lựa chọn, SHA-256, cache RAM tối đa 4 gói/8 MB dữ liệu nguồn; dữ liệu sai/mất mạng chưa cache báo lỗi và cho thử lại. Production có service worker chỉ cache asset/public geodata, tối đa 4 gói địa hình/6 MB; không cache Auth, API hoặc bản lưu riêng. File index.html hướng dẫn mở máy chủ khi truy cập file://.

Danh mục hành chính kiểm chứng ngày 08/10/2026; hình ranh/thủy hệ nguồn OSM 07/05/2023 được hợp nhất theo các nhóm tỉnh 2025. Không khẳng định từng đỉnh ranh pháp lý hiện hành đã kiểm chứng. DEM Mapzen/USGS/NOAA nguồn thực, edition 2017; ô game 20 m lấy mẫu từ nguồn khoảng 30–38 m, không phải khảo sát độ phân giải 20 m. Preview 12,8 km nhưng khu xây vẫn 1,28 km (64×64); ghi rõ trên giao diện. Cổng đường là connector game; khởi đầu dân số 0.

Save 6 giữ DEM/metadata trong bản lưu, địa hình không phụ thuộc tải lại nguồn. Save 1–5 còn mở được. Migration additive 202610080005_geography_saves.sql đã chạy trên Supabase thật, accepts_schema_6=true; ảnh supabase-geography-schema-verified.png. Xây trên biển bị chặn đúng loại; cầu tính giá khác, dốc/ngoài tỉnh được kiểm tra qua command trước khi trừ tiền. Đã xây điện/nước/phân khu/đường tại Hạ Long, lưu/mở lại giữ tiền và địa hình; ảnh vietnam-ha-long-save-load.png.

Theo yêu cầu bổ sung, Hoàng Sa và Trường Sa xuất hiện trên bản đồ toàn quốc, có tìm kiếm, nút phóng tới, danh sách đảo và tọa độ. Hoàng Sa liên kết Đà Nẵng; Trường Sa liên kết Khánh Hòa theo danh mục đặc khu 2025. Không thêm thành tỉnh thứ 35/36. Gói riêng 45.410 byte: 12 điểm tham chiếu Hoàng Sa từ cổng Đà Nẵng; 46 đường bờ OSM Trường Sa và 9 địa danh có tên Việt. Đây là phạm vi dữ liệu hiện có, không phải toàn bộ đảo. Loại 7 vùng ranh hành chính ngoài biển của Khánh Hòa khỏi lớp tô đất; giữ nguyên dữ liệu ranh nguồn, dùng đường bờ thật ở lớp riêng. Chấm tròn là ký hiệu vị trí; khung nét đứt là cửa sổ xem, không phải đường ranh biển. Chưa có DEM đảo đáng tin cậy nên chưa mở khu xây tại hai quần đảo.

Giới hạn còn lại Lệnh 20 / H: mua đất/chunk 200 m, thế giới xây đầy đủ 12,8 km, hành trình xuyên nhiều chunk, land cover thật, thủy văn/triều/độ mặn/khai thác nước thật, chia sẻ topology ranh và đỉnh ranh pháp lý hiện hành. Renderer gom vùng 320 m hiện hữu, chưa phải streaming 200 m toàn thế giới; chưa có Worker. Không đánh dấu toàn Lệnh 20/G5–G6 đã hoàn thành. 100 bậc/300 nhiệm vụ, nâng cấp F, Auth username 3 ô và BXH server vẫn chưa xong.


Bằng chứng cuối chặng: 95/95 tests PASS (112,50 s), build PASS (6,02 s), kiểm tra riêng 6/6 sau bổ sung cache metadata đảo. Browser bấm từng quần đảo/chọn tọa độ/tìm không dấu/quay về terrain Khánh Hòa PASS; reload giữ save Hạ Long. Screenshot vietnam-archipelagos-national.png và hai ảnh chi tiết. Viewport kiểm tra quần đảo thực 1063 px; override mobile mới không có hiệu lực, cần kiểm lại riêng. Đo production 1.000 cư dân trong 30,02 s: FPS trung vị 19,9, frame p95 83,4 ms, CPU tick p95 0,6 ms, 38 draw calls, 16 vùng/14 geometry/0 texture; chưa đạt mục tiêu độ mượt. Dữ liệu/giới hạn đầy đủ tại performance-budget.md và performance-1000-20261008.json. Không dùng số tức thời để cam kết 60 FPS.


## Tài khoản username và triển khai — 09/10/2026

Đã chỉnh mã: đăng ký đúng ba ô, đăng nhập hai ô, chuẩn hóa username giữ nguyên mật khẩu, server `/api/account` gọi Supabase Admin/password Auth thật; profile và thành phố đầu tiên commit DB một lần. Reservation/nonce xử lý retry/orphan, không cấp lại tiền đầu. Tài khoản email cũ giữ đăng nhập/reset/xác nhận và bản lưu, có claim username. Thư viện giữ create/save/open/delete/CAS/backup, bổ sung tạo mã dự phòng mới có JWT + xác thực lại mật khẩu.

Mã dự phòng 192 bit chỉ trả một lần, lưu hash, claim atomic, thay mã sau sử dụng. RLS chặn access JWT cũ trong/sau recovery, Auth global signout thu hồi refresh. Private mapping/rate tables có RLS, revoke schema/table, RPC quản trị service_role-only; shared rate limiter qua DB, origin/payload limits, không log/return secret. Nếu mất phản hồi sau đổi mật khẩu, đăng nhập mật khẩu mới rồi tạo lại mã. Secrets chỉ Vercel server hoặc local ignored.

Kiểm chứng: npm ci PASS tải lockfile; 100/100 tests PASS, build PASS 8,24 s (Three chunk 549,05 kB/gzip 140,34 kB vẫn có warning). Sau thêm kiểm thử tạo lại mã: 6/6 account tests PASS 10,06 s; tổng hiện 101 tests. Account DB tests kiểm reservation/idempotency, private access/RLS A/B, recovery claim race, JWT iat epoch và mã cũ vô hiệu; API injected failure/origin/rate/owner/password được kiểm riêng. Đây là PostgreSQL fixture/mock, chưa phải Supabase Auth QA thật.

Supabase: migration 006 và 007 đã chạy Success trên project adnmfknbskbagiahstim, không xóa cities cũ. Vercel đăng nhập đúng supportstudy26-hue, import thấy repo buildcity26 nhưng repository GitHub vẫn trống; CLI credential hiện invalid tài khoản khác. Đã chuẩn bị env/public URL/key và ô secret server để người dùng nhập trực tiếp. Chưa triển khai Ready, chưa được gửi link game như đã deploy.

Còn lại: quyền push GitHub, nhập secret server, deploy/Ready, QA thật bằng scripts/verify-accounts.mjs, browser form/mobile/cloud save trên production, redirect email legacy theo domain thật. Snapshot JSONB 2 MB và BXH authoritative/account XP vẫn chưa hoàn tất; không nhận tiền/XP client làm điểm verified. Luồng email/SMTP thật chưa kiểm chứng.


Kiểm chứng bổ sung 09/10: SQL database thật trả accounts_ready/private_rls/profile_rls/server_code_rotation/revoked_session_policy=true, client_private_access/client_admin_rpc=false; ảnh supabase-accounts-verified.png. Browser localhost5180 xác nhận form đăng ký 3 inputs, login 2 inputs, thiếu server config trả 503 với thông báo giữ tiến trình/nút retry bật. Lưu/reload guest giữ tên Bình Minh, 176 dân, 12 tỷ đồng và clock tiếp tục; không có JS errors. Ảnh username-register-local.png, username-config-error-local.png. Chưa QA production/mobile mới.

Push HTTPS thực thất bại vì credential helper trỏ GitHub CLI đã bị xóa, terminal không có credentials. Chưa thay đổi quyền truy cập ngoài dịch vụ: đã tạo SSH public/private key local chỉ dành việc triển khai, public key cho người dùng tự thêm vào Deploy keys của đúng repo với write access. Private key nằm work/deployment-auth, ngoài repository/output, không in/chat/upload. Chưa thêm key lên GitHub, đang chờ người dùng. Vercel env secret cũng đang chờ người dùng nhập trực tiếp.

## 2026-10-09 — Giao diện gọn, đăng ký chọn địa phương, phóng đại quần đảo

- **Đã triển khai:** HUD dùng bề mặt đặc, bỏ blur; thu gọn thanh trên, tổng quan và công cụ. Bản tin mặc định đóng, mở bằng biểu tượng chuông; thông tin công trình/cư dân và cảnh báo vẫn dùng logic cũ. Điện thoại chỉ mở một bảng thông tin.
- **Đã triển khai:** đăng ký giữ đúng ba ô Tên thành phố/Tài khoản/Mật khẩu, thêm nút chọn địa phương riêng. Chọn trong danh mục 34 tỉnh/thành, tải gói địa hình có checksum và xem trước. Quay lại giữ tên/tài khoản, xóa mật khẩu khi đổi màn. Server dựng thành phố đầu tiên từ gói địa hình đóng kèm; không nhận địa hình hay URL tùy ý từ client. Retry cùng yêu cầu giữ địa phương và tên ban đầu.
- **Đã triển khai:** hai khung phóng đại Hoàng Sa/Trường Sa trong bản đồ quốc gia; chọn từng đảo, xem tọa độ, phóng lớn và thu/phóng bản đồ. Không sửa tọa độ/ranh giới hoặc diện tích địa lý. Điểm là ký hiệu vị trí; Hoàng Sa vẫn chỉ có 12 điểm tham chiếu, Trường Sa có đường bờ OSM chưa đầy đủ. Chưa có DEM được kiểm chứng để xây trên hai quần đảo.
- **Migration:** `202610090008_registration_geography.sql` đã chạy trên Supabase thật, kết quả Success. Chỉ thêm trường lựa chọn khởi đầu và RPC server, giữ nguyên bản lưu cũ; RLS/private quyền client không mở rộng.
- **Kiểm tra:** toàn bộ `npm test` **102/102**, không skip, 138,46 giây; build **đạt** 8,12 giây. PostgreSQL/PGlite kiểm địa phương bất biến khi retry, không thể commit địa hình khác và client không gọi được RPC; API kiểm region không hợp lệ trước khi tạo Auth user. UI thật kiểm chọn Hải Phòng, giữ tên/tài khoản, ba ô nhập; phóng Đảo Trường Sa vẫn đúng 8,64464°B / 111,91969°Đ.
- **Bằng chứng:** `interface-city-v2.png`, `interface-register-place.png`, `interface-vietnam-insets.png`, `supabase-registration-geography-migration.png`.
- **Hiệu năng/phạm vi:** thay đổi dùng CSS/SVG tĩnh, không thêm mesh/texture hoặc vòng render. CSS gzip 8,37 KB; chooser tải riêng gzip 5,93 KB. Chưa đo lại benchmark đông dân cho chặng UI này. Cảnh báo chunk Three 549 KB vẫn còn. Chưa kiểm Auth JWT hai tài khoản thật vì thiếu cấu hình server trong môi trường local/deployment.
- **Triển khai đang chờ:** deploy key đã thêm đúng fingerprint nhưng **Read-only** (kiểm UI GitHub 09/10), cần người dùng thêm lại với Allow write access. Vercel đã có project buildcity26 và tên ba biến `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` đã xuất hiện trong trang Environment Variables (không mở giá trị secret, chưa kiểm tính hợp lệ). Project đang **No Production Deployment**; chưa gửi link chơi online và chưa đánh dấu tài khoản production hoàn thành.

- **Giới hạn QA responsive:** công cụ viewport IAB trả về 1280×720 dù yêu cầu 390×844; không coi đó là bằng chứng chạy trên điện thoại. Cần kiểm trực tiếp trình duyệt điện thoại hoặc công cụ viewport hỗ trợ thực sự.

## Chặng 10/10/2026 — mỹ thuật, cư dân/xe và GIS Việt Nam mới

- **Bản đồ quốc gia đã tích hợp thực tế:** GeoJSON nhẹ/full lazy, 34 ID vn-* theo snapshot 2025-07-01 (6 thành phố), 63 tên cũ, toàn bộ MultiPolygon/holes, 4 đảo/quần đảo đúng tọa độ và cha hành chính, pan/zoom/reset/keyboard và responsive. Giữ 36 khu DEM/OSM trước đây; Phú Quốc tạo/xây/lưu/reload được. Offshore và Côn Đảo chưa có khu DEM được xác minh nên khóa xây. Save metadata có migration giữ bản cũ. Chi tiết code, bằng chứng và giới hạn: [national-map-integration.md](national-map-integration.md).
- **Mỹ thuật công trình:** bộ 216 ảnh mẫu cắt đúng frame; 24 dịch vụ có silhouette riêng, RCI có các biến thể, placement ghost dùng cùng model; tray gọn và tự đóng sau lựa chọn. Thay hộp chung trong 3D/Canvas; không đổi công suất/kinh tế theo hình ảnh. Chi tiết: [art-integration-status.md](art-integration-status.md).
- **Cư dân/phương tiện — chặng đầu, chưa hoàn thành toàn pack:** 144 tên/frame catalogue thật; 43 prototype mesh (27 cư dân, 9 ô tô, 7 xe buýt), 101 mẫu mới chỉ ảnh tham chiếu. Người thực/ô tô cá nhân và xe buýt thành phố có model, tay chân/bánh/cửa chuyển động theo quãng đường và trạng thái; bus có boarding/alighting/capacity/FIFO/fare thực, lưu đang đi xe. Làn cơ bản và tín hiệu/gap, chưa lane graph đầy đủ. Chưa có dispatch đủ nghề, xe chuyên dụng, xe hai bánh, đường sắt, tàu thủy và máy bay; không đánh dấu 144 model/nghiệp vụ hoàn tất. Chi tiết: [mobility-integration-status.md](mobility-integration-status.md).
- **Kiểm tra:** full 133/133 không skip; build đạt. Không có script lint/typecheck. Giữ auth/Supabase/API/RLS hiện có; chưa lấy regression tests làm bằng chứng live A/B mới. BXH/server-authoritative và các Lệnh 0–28 còn thiếu vẫn theo các mục trước, không tự đổi thành hoàn thành.

- **Kiểm tra cuối bản đồ:** 4/4 national-map đạt sau chỉnh tìm kiếm/pointer cancel; build9,63s đạt, Three556,75KB còn cảnh báo chunk. Browser lưu/reload người đang đi xe buýt giữ1/60 khách và146m. Benchmark5.000 dân trung bình40,5FPS, p95frame48,8ms; render220/1.988active. Local gzip hoạt động nhưng giới hạn Supabase2MB chưa được giải quyết cho thành phố đông dân.

## Tiếp tục10/10 — xác nhận bản online và cache quốc gia

Commit16adcf9 đã push GitHub, Vercel Ready22s; QA domain thật đủ34 vùng/1.608 polygon, tra Bắc Giang→Bắc Ninh, ba quick-focus đảo đúng hành chính và cấm xây. Ảnhnational-map-production.png. Giữ bản lưu/tài khoản người dùng, không reset thành phố production.

Đã bổ sung local cache riêng cho5 file quốc gia nhẹ, ngân sách tối đa2,8MB; full14,1MB và private requests không cache. Offline tests3/3 đạt; suite133/133 trước đó vẫn là bằng chứng regression, chưa gọi số134 là full-suite đã chạy. Bổ sung bắt lỗi dynamic import trong form đăng ký giữ các ô đã nhập. Commit0b72ff1 và bổ sung này chưa push vì auto-review hết usage limit; production chỉ xác nhận16adcf9.

Bố cục local thu gọn theo chiều cao laptop, cả4 inset trong dialog1280×720; ảnhnational-map-compact-local.png. Build cuối17,07s đạt; source diff check đạt. Phần này chưa có trên production16adcf9.
