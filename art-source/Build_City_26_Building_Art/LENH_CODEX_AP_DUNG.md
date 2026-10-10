# BUILD CITY 26 — ÁP DỤNG ĐỒ HỌA CÔNG TRÌNH VÀ SỬA GIAO DIỆN

Đưa nguyên thư mục đã giải nén vào workspace của repo Build City 26. Đọc `README.md`, `manifest.json`, `DANH_MUC_CONG_TRINH.csv` và file này. Ảnh trong `ui/` là thiết kế tham chiếu; các số liệu trong ảnh là minh họa, không thay thế catalogue giá/công suất hoặc state thật.

## Lệnh giao việc — dán vào Codex

```text
Bạn đang sửa game Build City 26 đang chạy, không tạo dự án mới. Đọc toàn bộ thư mục Build_City_26_Building_Art, nhất là LENH_CODEX_AP_DUNG.md và manifest.json. Kiểm tra repo, renderer, component UI, catalogue công trình, hệ thống build/upgrade/select và saves trước khi sửa. Giữ framework và các tính năng đang chạy. Không cần API AI.

Sửa hai vấn đề: công trình đang là các hộp gần giống nhau, và UI quá lớn che bản đồ. Áp dụng bộ 24 atlas / 216 mẫu công trình, hạ tầng và module làm tài nguyên tham chiếu; dùng ui/01-gameplay-redesign.png cho hướng bố cục. Làm thay đổi thật trong repo, không chỉ ghi kế hoạch hoặc đổi ảnh ở trang giới thiệu.

Với renderer 3D có xoay camera: PNG là thumbnail và bản tham chiếu thiết kế, không phải file model. Dựng mesh gốc theo từng template bằng geometry kết hợp hoặc GLB có nguồn rõ ràng. Không dán ảnh lên một hình hộp và gọi đó là nhà 3D. Đặt đúng footprint, chiều cao, entrance, pivots, vật liệu, LOD và ID. Mọi loại công trình đã cho người chơi xây phải có hình dáng riêng, và preview/ghost/placed/inspector phải cùng template. Không dùng lại một hộp đổi màu cho trạm nước, nước thải, rác, trường và bệnh viện.

Với renderer isometric cố định đang dùng: có thể dùng atlas bằng frame trong manifest và depth-sort/anchor đúng; không giả vờ PNG có thể xoay 360 độ. Khi cần 3D xoay được vẫn phải dựng mesh. Giữ chuyển động người/xe, tuyến và mô phỏng; không thay viewport bằng một bức ảnh thành phố tĩnh.

Áp dụng đủ mục 1–7 phía dưới theo từng chặng. Khi hoàn thành, chạy build, kiểm tra trình duyệt và save/load, ghi ảnh trước/sau và danh sách loại đã thay. Không báo đủ nếu mới thay thumbnail mà công trình trên bản đồ vẫn là khối hộp. Tiếp tục các loại còn thiếu trong phạm vi đã giao, ghi handoff nếu phiên làm việc hết thời lượng.
```

## 1. Registry và mapping ảnh

- Tạo `BuildingArtRegistry` hoặc mở rộng registry hiện có, map gameplay `buildingTypeId` sang `artId` trong manifest. ID ảnh là ID mỹ thuật, không mặc nhiên giống ID công trình trong simulation. Lập bảng mapping rõ ràng; không suy đoán theo giá, màu hoặc index mảng.
- `frame` đã lấy theo vùng hình thực tế của từng mẫu; **không chia atlas thành 9 ô bằng nhau rồi cắt cứng**. Một số mái/tháp cao vượt vùng chia đều dự kiến. Dùng `{x,y,width,height}` của từng entry. Các PNG gốc vẫn nguyên vẹn.
- Dùng ảnh tương ứng cho thẻ xây, inspector, tutorial, unlock, mission và danh mục. Cùng một `buildingTypeId` phải ra cùng mẫu; biến thể giữ seed qua save/load.
- Các tên tương đương như nhà trẻ/mầm non hoặc trạm viễn thông/node phải mapping theo catalogue thật. Template chưa có trong simulation chỉ xuất hiện trong tài liệu/editor phù hợp; không tạo nút mua giả vì đã có ảnh.
- Không lấy số lượng xe/khách vẽ sẵn trong ảnh làm occupancy. Chỉ simulation quyết định dân, staff, cargo, queue và service outcomes.
- Tích hợp helper `integration/atlas-loader.ts` nếu phù hợp, hoặc chuyển sang module JS/framework đang dùng. Đây là helper nạp/vẽ ảnh; không phải một game engine hoặc mesh factory.

## 2. Sửa toàn bộ mô hình công trình

Primitive như box vẫn được dùng làm tường/thân nhà, nhưng hình hoàn chỉnh phải có cấu trúc, mái và thiết bị phù hợp. Dùng mesh dùng chung và instancing cho cửa sổ, lan can, cột, cây; đừng tạo hàng trăm material riêng.

| Nhóm | Hình dáng và chi tiết phải nhận biết được |
|---|---|
| Nhà biệt lập/liền kề | Mái nghiêng/ngói, tầng, cửa, mái che, ban công, sân; nhà ống có tỷ lệ mặt tiền hợp lý |
| Chung cư/văn phòng | Tầng/ban công hoặc facade kính, podium, thang/sảnh, mái kỹ thuật; dáng thấp/trung/cao khác nhau |
| Trường học/đại học | Khối lớp, sân, cổng, mái, khu hoạt động; không dùng mesh clinic đổi màu |
| Phòng khám/bệnh viện | Cánh nhà, lối cấp cứu, gara/helipad đúng loại; biểu tượng y tế tự thiết kế |
| Điện | Turbine có cánh và trụ, solar có dãy panel, nhà máy có tổ máy/stack, substation có transformers/busbars |
| Nước | Pump có intake/pipes; tháp nước có bồn trên chân; tank có bể; xử lý có basins/aeration |
| Rác/sản xuất | Kho/cửa bốc dỡ, conveyor/tanks/silos/stacks đúng loại; rác và tồn kho theo trạng thái, không tô sẵn vô hạn |
| Cứu hỏa/cảnh sát/bưu chính | Garage bays, yard, rooftop equipment và mặt tiền đặc trưng; màu chỉ là một dấu hiệu phụ |
| Giao thông | Depot có service bays; stop có canopy; ga có platform/ray; airport có terminal/jetbridge/ground structures |
| Cảng/thủy sản | Quay, dock, crane, yard, lạnh/kho; bến chạm nước thật; oil rig có legs/deck/derrick |
| Công viên/văn hóa/du lịch | Path/gate, cây, ghế, fountain, ride/enclosure, sân/khán đài, hotel wings; footprint riêng |
| Cầu/hầm/bãi đỗ | Piers/deck/railings, portal, ramp/slots/gates; cầu mở có pivot và phần động riêng |

Giữ collision/selection dựa trên footprint và IDs của core; mesh trang trí không đổi capacity hoặc ngân sách. Dỡ/xây/nâng không nhân đôi công trình. Tier 2–5 thêm tầng/cánh/module/tiện ích đúng config và footprint, không chỉ phóng to cùng một hộp. Bộ ảnh hiện tại là mẫu cơ sở, **chưa có 5 ảnh cấp độ cho từng mẫu**; dựng biến thể bằng mesh/registry, ghi trạng thái thật.

Chỉnh địa hình để bớt cảm giác bàn cờ: phối màu đất/cỏ có biến thiên nhẹ theo seed và biome, blending sườn/bờ, cây phù hợp vùng, mặt nước và shoreline. Grid quy hoạch chỉ hiện khi xây hoặc bật layer, không phủ mạnh toàn màn hình. Không ghi đè địa hình Việt Nam bằng nền ảnh; giữ datum, dữ liệu nguồn và tính mét. Kiểm tra nhãn quy mô minimap bằng kích thước world thật, không đổi nhãn 1,28 km thành 12,8 km nếu dữ liệu chưa rộng tương ứng.

## 3. Thu gọn UI và giữ bản đồ dễ nhìn

- Desktop: top HUD khoảng 60–68 CSS px; gồm brand/city, level/EXP, cash, population và clock. Hạn chế khoảng trống lớn, không dùng một thanh cao hơn 100px khi viewport đủ rộng.
- Dock dưới khoảng 64–76px, có icon SVG đồng bộ và nhãn ngắn: Khám phá, Đường, Phân khu, Điện nước, Dịch vụ, Công viên, Vận tải, Phá dỡ. Tooltip, selected/disabled state rõ; không dùng emoji thay icon.
- Bảng xây đặt ở trái, rộng 280–320px, đóng/thu gọn được. Thẻ/row có thumbnail riêng, tên, giá, năng lực và trạng thái. Search/filter/scroll trong panel; không để một bảng thẻ lớn nằm giữa bản đồ. Nếu cần catalogue toàn màn hình, chỉ mở khi người chơi chủ động yêu cầu và có nút đóng rõ.
- Inspector bên phải 260–300px khi chọn thực thể; đóng được; dữ liệu thật, nguyên nhân thiếu dịch vụ, hành động nâng cấp và báo giá. Không thường trực chiếm chỗ khi chưa chọn gì.
- Minimap khoảng 150–190px; controls camera thành một cụm nhỏ; missions dạng chip/panel gọn. Khi hai panel đóng, bản đồ chiếm ít nhất 80% vùng chơi; khi cả hai mở, phần viewport còn lại vẫn đủ thao tác.
- Palette: nền #0B1220, panel #152238, mint #4DE0B7, gold #F6CB66, chữ sáng. Radius 10–14px, border mảnh, shadow nhẹ; chữ 13–16px ở controls, title 18–22px. Mức tương phản và active state phải rõ, không lạm dụng glass blur.
- Responsive: ở màn hình hẹp dùng một bottom sheet theo context; không mở đồng thời hai panel lớn. Touch targets ít nhất 44px, safe areas và scrolling không bị dock che. Giữ click-through cho viewport, không để wrapper trong suốt toàn màn hình chặn chọn nhà.
- Giữ UI tiếng Việt; format đơn vị và tiền theo cấu hình đã chốt. Không bê số liệu, ký hiệu đồng tiền hoặc giá trong ảnh thiết kế vào config. Tiền game có nhãn rõ, không đổi đơn vị gây nhân ngân quỹ.

## 4. Trang chủ, đăng ký và đăng nhập

Tham chiếu `ui/02-homepage.png`, `03-signup.png`, `04-login.png`. Chốt một logo/bộ icon thống nhất cho mọi trang; các ảnh minh họa có biến thể logo, không coi chúng là bộ vector master. Dựng SVG master trong repo.

Đăng ký vẫn đúng 3 ô: **Tên thành phố · Tài khoản · Mật khẩu**. Đăng nhập đúng 2 ô: **Tài khoản · Mật khẩu**. Giữ Supabase, validation, trạng thái loading/error, unique username và recovery bằng mã. Không thêm email/phone/social-login chỉ vì một thư viện auth cung cấp sẵn. Không tạo account/local-save giả rồi báo đã đồng bộ.

Có thể dùng ảnh thành phố cho hero/auth background, nén phù hợp trên bản deploy; CSS layout thực phải responsive và có form DOM thật. Không biến nguyên ảnh giao diện thành một trang có các vùng click giả. Không phát sinh API AI hoặc dịch vụ mất phí để tải ảnh.

## 5. Hiệu năng và chất lượng

- Chỉ tải atlas của nhóm UI đang mở; cache theo URL, có eviction khi cần. Không tải/decode cả 24 atlas ngay lúc mở game. PNG giải nén/GPU tốn hơn dung lượng ZIP; theo dõi texture memory thực.
- Card thumbnail dùng background/Canvas cached; không tạo một renderer/WebGL loop cho mỗi card. Core simulation không phụ thuộc ảnh đã tải hay chưa.
- Mesh/material dùng chung, culling theo camera, near/medium/far LOD, instancing foliage/window details; một directional shadow ở preset phù hợp. Những chi tiết không nhìn thấy ở zoom xa được bỏ ở render, không bỏ thực thể mô phỏng.
- DPR/quality presets theo tài liệu game; tắt DOF/bloom nặng mặc định. Chụp/so sánh thực tế với scene trước thay đổi: FPS/frame time p95, draw calls, triangles, JS/GPU memory và thời gian mở catalogue. Ghi thiết bị/browser thật đã đo; không cam kết 60 FPS trên mọi máy.
- Xem cạnh trong suốt trên nền cỏ, nền navy, nền sáng ở nhiều mức zoom. PNG tạo ảnh có thể có fringe ở cạnh; nếu thấy, sửa pipeline alpha/material/asset phù hợp và kiểm tra lại. Không xử lý alpha bằng cách bỏ nền trong suốt hoặc tạo khung trắng quanh cả hình.

## 6. Kiểm tra trước khi báo xong

1. Lập cảnh kiểm tra có tối thiểu nhà ở, cửa hàng, trường, bệnh viện, pump, water tower, wastewater, rác, fire/police, depot/ga, nhà máy, park và cảng. So mẫu trong atlas với thumbnail và công trình đặt trên map.
2. Nhà/công trình có silhouette đúng loại; các loại không liên quan không dùng một model giống hệt chỉ đổi màu. Thử các góc camera thực của renderer, gần và xa; mô hình không chìm/nổi sai khỏi nền.
3. Preview/ghost có đúng footprint; xây, chọn, nâng cấp, phá và undo hợp lệ vẫn chạy; đường vào, xe dispatch, dân và mạng utilities không bị mất do thay mesh.
4. Save trước sửa và load sau sửa giữ IDs, dân, tiền, công trình, tài khoản/ownership. Mesh/render cache có thể dựng lại từ IDs; không lưu texture/DOM vào save. Migration nếu đổi schema và có kiểm chứng.
5. Desktop 1440/1280 và mobile khoảng 390px: không che button, không HUD quá cao, panel mở/đóng đúng, scroll/touch và game selection không tranh event.
6. Auth đúng số ô; Supabase/cloud save/BXH giữ hoạt động thật. Local/mock check và production check được báo riêng.
7. Chạy build/checks phù hợp, browser console không có lỗi ảnh/mapping/texture; mọi template hoạt động có art mapping. Báo danh sách đã thay, chưa thay và bằng chứng, không chỉ báo “UI đẹp hơn”.

## 7. Bàn giao và deploy

Ghi `docs/art-integration-status.md`: artId ↔ gameplayTypeId, thumbnail path/frame, mesh factory/model, tier variants, QA và giới hạn. Ghi before/after screenshots và performance results. Giữ tài nguyên gốc, mapping và license/origin notes trong repo. Nếu có quyền GitHub/Vercel thì commit và deploy thay đổi, smoke test bản production trước khi báo URL hoàn thành; thiếu quyền chỉ hỏi phần chặn việc và hoàn thành các phần độc lập.

Mục tiêu: thành phố thật sự có các công trình đẹp, khác nhau và sử dụng được, cùng UI gọn. Không thay cả dự án đang làm bằng một demo mới, không gọi PNG là GLB, không dùng screenshot thành phố làm bằng chứng mô phỏng.
