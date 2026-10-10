# Đường, cảnh quan và giao diện — 10/10/2026

Chặng này sửa game đang dùng, giữ tài khoản/Supabase, tiền, bản lưu, cư dân và đồng hồ 1 giây thực = 5 giây game. Đặt công trình vẫn xuất hiện ngay theo yêu cầu trực tiếp mới nhất; tiện ích, kết nối và chi phí tiếp tục quyết định hoạt động. Đây là trạng thái local đã kiểm, chưa xác nhận phát hành chặng này lên production.

## Đường và giao lộ đang hoạt động

`src/config/road-profiles.js` và `src/game/systems/{road-network,roads,mobility-path,road-controller,junctions}.js` dùng chung bảy profile đường mặt đất:

| Loại | Rộng / làn | Vận tốc profile | Hành vi thật |
|---|---|---|---|
| Đường dân cư hai chiều | 12 m / 2 | 30 km/h | Ô tô, bus và người đi bộ; vỉa hè |
| Đường một chiều | 10 m / 2 | 40 km/h | Route có hướng cho xe; đổi hướng bằng inspector, người đi bộ vẫn hai chiều |
| Đường phố hàng cây | 12 m / 2 | 30 km/h | Cây/vỉa hè riêng, giá và vận hành riêng |
| Đại lộ phân cách | 18 m / 4 | 50 km/h | Dải phân cách ngắt tại giao lộ, sức chứa cao hơn |
| Đường làn xe buýt | 18 m / 4 | 40 km/h | Bus lệch làn ngoài, ô tô làn trong; không chỉ đổi màu mặt đường |
| Đường đi bộ | 6 m / 0 làn xe | 5 km/h | Chặn route xe, nối route người đi bộ |
| Đường xe đạp | 6 m / 2 | 20 km/h | Mode bicycle/walk, chặn ô tô; **chưa có agent xe đạp vận hành** |

Profile vận tốc không bảo đảm xe luôn chạy ở mức đó: giao lộ, hàng chờ và thời tiết ảnh hưởng tốc độ thực. Đặt/nâng đường dùng quote cùng công thức và khấu trừ ngân sách; nước dùng giá cầu riêng. `junction-parts.js`/`street-environment.js` dựng vạch, vỉa hè, dải phân cách, cây, đèn và mesh tín hiệu từ trạng thái thật.

Đèn mặc định dùng một simulation clock cho mesh và người/xe. Chu kỳ bảo vệ từng hướng: xanh 10 giây, vàng 2 giây, clearance 2 giây; cuối chu kỳ có pha người đi bộ và clearance. Inspector cho signal/yield/off và hàng chờ theo hướng; controller dừng xe trước giao lộ và chỉ cho qua khi pha phù hợp. Route một chiều và mode được kiểm riêng, không dùng BFS hai chiều cho mọi xe. Đây vẫn là graph theo ô 20 m, chưa là lane graph/chuyển làn đầy đủ.

**Chưa triển khai:** cao tốc, nút khác mức, vòng xuyến, đường cong, nâng/hạ đường, hầm; chưa có mô phỏng xe đạp. Không mở các lựa chọn đó dưới dạng công cụ giả.

## Mười cảnh quan 3D riêng

`src/config/landmarks.js` và `src/game/render/landmark-parts.js` có tháp đồng hồ, tháp quan sát, tháp biểu tượng, cột cờ, tượng đài, cổng chào, đài phun, vườn hoa, ghế nghỉ và đèn cảnh quan. Mỗi loại có silhouette/chiều cao/giá/upkeep/nhu cầu điện nước riêng; tên/giá/tác động hiện trong catalogue và inspector. Mesh dựng từ geometry/material chung, có LOD/culling; không phải ảnh PNG đặt lên bản đồ.

Tác động cảnh quan lấy hiệu quả lớn nhất gần nhà, tối đa **6 điểm hài lòng**, chỉ khi có kết nối và đáp ứng nhu cầu của loại đó. Không nhân thưởng bằng đặt nhiều tháp, không coi tháp là điện/nước/viễn thông. Đài phun hiện là mesh cảnh quan có tiêu thụ điện nước; chưa mô phỏng chất lỏng vật lý.

Pilot kiến trúc hiện có vẫn là **13 mẫu tư nhân và 24 công trình dịch vụ**, dùng chung descriptor cho model/preview/Canvas; không tuyên bố đã dựng đủ toàn bộ 216 ảnh công trình hoặc 144 mẫu người–xe.

## UI và progression liên quan

- Gói UIRefresh dùng 48 SVG, HUD cập nhật từ snapshot thật; catalogue/inspector rõ loại, giá, điều kiện và tác động. Xem `src/ui/refresh/`, `src/ui/hud-snapshot.js`, `public/ui-refresh/`, `docs/ui-refresh/`. Responsive đã đo sáu viewport 390, 480, 768, 1024, 1600 px và 844×390; không tràn ngang (`hud-responsive-20261010.json`). Đây là kiểm viewport browser, chưa kiểm điện thoại vật lý.
- Catalogue mới có đúng 300 nhiệm vụ và bảng EXP 100 cấp, cap 4.230.468 XP. **104 nhiệm vụ có metric được hỗ trợ**, phần phụ thuộc hệ thống chưa có vẫn khóa/nêu lý do; chưa tuyên bố cả 300 đều chơi hoàn tất. 14 nhiệm vụ cũ, XP/receipts/thưởng đã nhận được giữ. Thưởng lên cấp 100 triệu chỉ cấp một lần.
- Claim nhiệm vụ đi qua server và migration `202610100003_mission_campaign.sql` đã chạy trên project thật; bằng chứng `mission-migration-live-20261010.png`. Server giữ biên nhận/chống claim lặp và CAS. **Client world chưa authoritative; chưa có BXH chống gian lận**, không gọi toàn mô phỏng là dữ liệu đã xác minh.
- Codec `src/services/city-codec.js` nén lossless phần dữ liệu lớn, giữ money/ledger/progression ở ngoài để finance/claim server cập nhật đúng. Raw JSON cũ vẫn đọc được; không bỏ cư dân, đường đi, vị trí hay receipt để đạt trần 2 MB. Test 5.000 dân deepEqual roundtrip, corruption, decoded-size limit và encode xác định đã nằm trong suite.

## Kiểm tra và bằng chứng

`npm test`: **179/179 PASS**, 0 fail/skip, **201,25 giây**, log `../../work/roads-release-tests.log`. `npm run build`: **PASS, 5,93 giây**, log `../../work/roads-release-build.log`. Build còn cảnh báo hai chunk trên 500 kB; không coi cảnh báo đó là lỗi build, cũng không coi tải khởi đầu đã tối ưu xong.

Browser game thật xây/nâng bảy loại đường và cảnh quan bằng lệnh có trừ tiền, gồm thông báo không chiếm đè công trình; kết quả lưu ở `roads-browser-builds-20261010.json`. Reload giữ **260 dân, 526.800 BC, clock 63.386 giây và playback đang dừng** (`roads-save-reload-20261010.json`). Ảnh thật: `roads-landmarks-day-20261010.png`, `roads-landmarks-night-20261010.png`, `roads-landmarks-near-20261010.png`, `roads-landmarks-overhead-20261010.png`; chuyển động thật trong `roads-traffic-20261010.webm`.

| Cảnh đo IAB Chrome 155 / 1280×720 / medium / DPR1 | Thời gian / frames | Median FPS | Frame p95 | CPU tick p95 | Draw calls | Heap |
|---|---:|---:|---:|---:|---:|---:|
| Game đang chơi: 260 dân, 36 công trình, 71 đường | 10 s / 452 | 58,8 | 33,5 ms | 1,9 ms | 55 | 30,11 MB |
| Fixture 5.000 dân, 1.792 ô đường, 2.289 agent hoạt động, 50 được vẽ | 30,06 s / 1.164 | 57,1 | 49,4 ms | 18,4 ms | 169 | 87,48 MB |

JSON gốc: `performance-roads-20261010.json`, `performance-roads-5000-20261010.json`. Median cao không phải 60 FPS liên tục: fixture trung bình khoảng 38,7 frames/s toàn cửa sổ đo, có hai long task, dài nhất 2.404 ms; tải cảnh 2.398,9 ms. Pathfinding còn đồng bộ, GPU bytes/RSS và điện thoại vật lý chưa đo. Cap người/xe **50 tổng**, low/mobile **30**, giữ toàn bộ 5.000 cư dân trong mô phỏng.

Kiểm bổ sung codec bằng fixture hiện tại: raw **7.268.052 byte → 632.627 byte**; `assert.deepEqual` PASS, SHA-256 sau canonical hóa khóa trước/sau đều `3a3cac0497c98b7c83e49ccc926d03975b5e889b1adc0858106d65373db01190`. Thứ tự key JSON có thể đổi, giá trị/ID/route/ledger giữ nguyên. Một lần encode/decode đồng bộ mất khoảng **1.085/729 ms** trên máy làm việc đang tải; cần chuyển việc nén sang worker/lập lịch phù hợp trước gọi thao tác lưu đông dân không giật. Chưa là một vòng save cloud live 5.000 dân mới.

## Phát hành và giới hạn còn lại

Tại thời điểm ghi tài liệu, HEAD local là `46098ef`; checkpoint production đã xác nhận gần nhất là `cfa6aaf`. Chặng này chưa có commit/push/Vercel Ready được xác nhận; người phụ trách deployment cập nhật mục này sau khi kiểm đúng commit/domain thật.

Tiếp tục ưu tiên worker/path queue và nén ngoài main thread; đối chiếu mọi nút quản lý với handler thật; nhân sự/hàng đợi/dispatch dịch vụ; tiếp tục các metric của 196 nhiệm vụ chưa được hỗ trợ. Không mở toàn bộ công cụ đường/chức năng còn thiếu chỉ bằng icon hoặc ảnh.
