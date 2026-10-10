# Mỹ thuật công trình — 10/10/2026

Áp dụng `art-source/Build_City_26_Building_Art/LENH_CODEX_AP_DUNG.md` trên game hiện có. Đã đọc README, manifest, CSV, nguồn prompt và QA; kiểm hash 28 PNG gốc. Giữ nguyên gói gốc (24 atlas, 216 mẫu); PNG là ảnh tham chiếu/thumbnail, không là model 3D. Nguồn và giới hạn giấy phép: `art-source/ORIGIN.md`.

## Phạm vi thực hiện

- 24 loại dịch vụ/công trình đang có trong catalogue đã có factory riêng: transformer/substation, pump/tower, basins, kho bốc dỡ/rác, campus/sân trường, clinic/cánh bệnh viện, gara/tower cứu hỏa, police HQ, depot/stop và park/plaza/court. Mỗi loại khác silhouette, không chỉ đổi màu. 13 mẫu nhà/chung cư/thương mại/xưởng hiện có dùng chung registry và tiếp tục giữ hash theo tọa độ.
- 29 loại xây được (24 công trình + 3 phân khu + 2 đường) có mapping rõ. Road/avenue trên đất dùng SVG gốc; cầu dùng art tham chiếu tương ứng trong inspector, deck/pier/railing thật. Không đưa 187 ID tham chiếu còn lại vào menu mua giả.
- Mesh, ghost và đặt công trình dùng chung descriptors, đúng nền cao độ và footprint core 20×20 m. Entrance metadata, mái, cylinder, window/foliage geometry dùng chung. Chi tiết nhỏ bỏ ở LOD xa; giữ thực thể mô phỏng. Three có 6 material dùng chung, không texture ảnh trong cảnh. Canvas nhẹ đọc cùng mesh descriptors; không gọi sprite là 3D xoay được.
- Thumbnail theo frame đo trong manifest (không cắt đều 3×3): menu, inspector, cẩm nang, nhiệm vụ và nhiệm vụ chưa mở. Thumbnail không đưa dân/xe vẽ sẵn vào simulation. Giá/công suất đọc catalogue thật.
- HUD 68 px; bảng xây 308 px bên trái, tìm kiếm không dấu, scroll, × và chọn xong tự đóng. Inspector 280 px bên phải, camera tránh bảng thông tin. Minimap 170 px, nhãn đúng 1,28 km cho world 64×20 m. Palette navy/mint/gold, dock gọn, mobile dùng một bảng theo context. Cư dân và chế độ Quan sát tiếp tục truy cập qua menu.
- Nền giảm tương phản bàn cờ, phối màu theo vùng/seed và bờ; không thay heightfield, datum hay dữ liệu Việt Nam bằng ảnh nền. UI vẫn DOM thật; logo SVG city dùng đồng nhất với favicon. Hero riêng có sẵn được giữ. Signup 3 ô và login 2 ô; không thêm API AI hay social/email form mới.
- Tải atlas theo thumbnail nhìn thấy, cache 4 atlas / 80 thumbnail, observer bỏ node cũ. 24 WebP tổng 10.362.850 byte, giữ alpha; atlas decode 1254²×4 ≈ 6,29 MB mỗi ảnh, cache upper ≈ 25,16 MB (không là đo RSS/GPU thực). Không tải cả 24 lúc mở game.

## Mapping đang hoạt động

`facilityParts`/`buildingParts` là mesh factory chung cho Three/Canvas. Frame ở dưới là pixel nguồn nguyên kích thước 1254×1254; URL nằm trong `public`.

| gameplayTypeId / tên | artId | atlas / frame x,y,w,h | model / cấp thực |
|---|---|---|---|
| `road` / Đường phố | `road-bridge` | `/art/buildings/23-infrastructure.webp` / 17,516,407,290 | roadParts · 2 bề rộng, cầu theo ô nước |
| `avenue` / Đại lộ | `highway-bridge` | `/art/buildings/23-infrastructure.webp` / 436,461,380,320 | roadParts · 2 bề rộng, cầu theo ô nước |
| `residential` / Khu dân cư | `row-houses` | `/art/buildings/01-residential.webp` / 463,50,344,352 | buildingParts · 13 biến thể RCI theo tọa độ/cấp |
| `commercial` / Thương mại | `corner-shop` | `/art/buildings/02-commerce.webp` / 44,124,345,287 | buildingParts · 13 biến thể RCI theo tọa độ/cấp |
| `industrial` / Công nghiệp | `textile-factory` | `/art/buildings/04-processing.webp` / 8,463,429,355 | buildingParts · 13 biến thể RCI theo tọa độ/cấp |
| `smallPower` / Trạm điện khu phố | `transformer-station` | `/art/buildings/08-power-network.webp` / 443,65,378,315 | facilityParts(smallPower) · cấp 1 |
| `power` / Trạm điện | `distribution-substation` | `/art/buildings/08-power-network.webp` / 844,93,387,294 | facilityParts(power) · cấp 1 |
| `smallWater` / Trạm nước khu phố | `groundwater-pump` | `/art/buildings/09-water.webp` / 447,90,365,287 | facilityParts(smallWater) · cấp 1 |
| `water` / Trạm cấp nước | `water-tower` | `/art/buildings/09-water.webp` / 49,414,331,395 | facilityParts(water) · cấp 1 |
| `waterPump` / Nhà máy nước | `advanced-water-pump` | `/art/buildings/09-water.webp` / 841,85,396,303 | facilityParts(waterPump) · cấp 1 |
| `smallSewage` / Xử lý nước thải nhỏ | `sewage-treatment` | `/art/buildings/09-water.webp` / 12,863,404,329 | facilityParts(smallSewage) · cấp 1 |
| `sewage` / Xử lý nước thải | `sludge-processing` | `/art/buildings/10-environment.webp` / 438,473,411,317 | facilityParts(sewage) · cấp 1 |
| `treatmentPlant` / Nhà máy nước thải | `advanced-treatment` | `/art/buildings/09-water.webp` / 423,850,417,346 | facilityParts(treatmentPlant) · cấp 1 |
| `waste` / Thu gom rác | `waste-transfer` | `/art/buildings/10-environment.webp` / 18,92,410,305 | facilityParts(waste) · cấp 1 |
| `wasteCenter` / Trung tâm thu gom rác | `recycling-center` | `/art/buildings/10-environment.webp` / 18,488,410,317 | facilityParts(wasteCenter) · cấp 1 |
| `school` / Trường học | `primary-school` | `/art/buildings/11-education.webp` / 432,79,387,296 | facilityParts(school) · cấp 1 |
| `secondarySchool` / Trường trung học | `secondary-school` | `/art/buildings/11-education.webp` / 826,82,419,302 | facilityParts(secondarySchool) · cấp 1 |
| `university` / Đại học | `university` | `/art/buildings/11-education.webp` / 826,449,424,338 | facilityParts(university) · cấp 1 |
| `clinic` / Trạm y tế | `clinic` | `/art/buildings/12-healthcare.webp` / 41,122,349,283 | facilityParts(clinic) · cấp 1 |
| `hospital` / Bệnh viện | `large-hospital` | `/art/buildings/12-healthcare.webp` / 855,35,374,390 | facilityParts(hospital) · cấp 1 |
| `fire` / Trạm cứu hỏa | `small-fire-station` | `/art/buildings/14-fire-rescue.webp` / 49,81,349,324 | facilityParts(fire) · cấp 1 |
| `fireCenter` / Trung tâm cứu hỏa | `large-fire-station` | `/art/buildings/14-fire-rescue.webp` / 426,25,420,390 | facilityParts(fireCenter) · cấp 1 |
| `police` / Trạm cảnh sát | `small-police-station` | `/art/buildings/15-security-civic.webp` / 26,48,385,352 | facilityParts(police) · cấp 1 |
| `policeCenter` / Sở cảnh sát | `police-headquarters` | `/art/buildings/15-security-civic.webp` / 851,25,386,388 | facilityParts(policeCenter) · cấp 1 |
| `bus` / Bến xe buýt | `bus-depot` | `/art/buildings/17-local-transit.webp` / 11,81,444,320 | facilityParts(bus) · cấp 1 |
| `busStop` / Điểm dừng xe buýt | `bus-stop` | `/art/buildings/17-local-transit.webp` / 471,135,318,265 | facilityParts(busStop) · cấp 1 |
| `park` / Công viên | `small-park` | `/art/buildings/20-parks.webp` / 34,63,371,309 | facilityParts(park) · cấp 1 |
| `plaza` / Quảng trường | `public-plaza` | `/art/buildings/20-parks.webp` / 447,55,385,327 | facilityParts(plaza) · cấp 1 |
| `sportsPark` / Công viên thể thao | `sports-center` | `/art/buildings/21-sports-culture.webp` / 21,100,397,294 | facilityParts(sportsPark) · cấp 1 |

### Biến thể nhà và xưởng

- `townhouse` → `row-houses`.
- `tile-house` → `detached-house`.
- `garden-villa` → `residential-villa`.
- `courtyard` → `rural-house`.
- `terraced-apartment` → `midrise-apartments`.
- `twin-apartment` → `social-housing`.
- `balcony-apartment` → `affordable-apartments`.
- `shop-house` → `low-commercial`.
- `market-hall` → `traditional-market`.
- `glass-office` → `high-commercial`.
- `sawtooth` → `textile-factory`.
- `warehouse` → `private-warehouse`.
- `processing` → `food-factory`.

Các cấp nhà ở thật trong core đổi tầng/ban công/khối giật cấp; không ép tier 2–5 lên 24 dịch vụ chưa có logic nâng module. Kho/công nghiệp/thương mại giữ cấp hoạt động hiện có. Lên cấp bằng tiền và điều kiện tiện ích cho mọi công trình còn là chặng gameplay, không báo hoàn thành nhờ thay mesh.

## Kiểm chứng

- Tests registry kiểm 216 frame/anchor đúng bản gốc, mapping đủ 29 loại; 24 silhouettes khác nhau kể cả bỏ màu, bounds/metres/chiều cao hữu hạn; ghép ghost/placed cùng nền, raycast và save roundtrip không đổi tiền/IDs/agent state. Cầu/đường cùng descriptor; build/upgrade/demolish giữ core.
- Browser localhost 1280×720: menu Điện nước có ảnh riêng; tìm `nuoc` lọc 6 loại; ảnh ngoài vùng cuộn chưa tải; chọn trạm nước đóng menu, inspector ẩn, cursor crosshair; hit-test giữa hint trả canvas `world`.
- Thử core qua công cụ game trên browser: xây trạm nước 12 triệu, vốn 18→6 triệu; thêm đường 6 triệu thì trạm chuyển `Chưa kết nối`→`Đang hoạt động`; chọn đúng trạm thấy thumbnail/factory, phạm vi 8 ô / 15 m³/ngày; dùng Phá dỡ hoàn 3 triệu (25%) và mesh biến mất. JSON gốc trước thử đã xuất, kiểm qua validateSave: 18 triệu, 0 cư dân, 8 ô có công trình.
- Cảnh QA cách ly `benchmark.html` có toàn bộ 24 dịch vụ + nhà/cửa hàng/xưởng, dân và xe trong core; ảnh góc rộng/gần/trên là renderer thật, không ghi local/cloud/BXH. Trường, bệnh viện, tower/basins, fire/police, depot và park phân biệt được. Chưa có ga/cảng trong core nên không dựng công trình chức năng giả để đủ ảnh cảnh QA.
- 118/118 trước sửa ghost cao độ; 119/119 sau sửa và bổ sung build/demolish tests (154,87s). 9/9 local-storage tests đạt sau xử lý đầy bộ nhớ; kết quả suite cuối và build/deploy ghi bên dưới khi xác nhận.

## Đo trước/sau

Hai lần 30 giây, cùng fixture `architecture`, seed 26012026, góc rộng, 1280×720, quality medium, DPR1, IAB Chrome155. UA báo Macintosh Intel Mac OS X10_15_7; không suy đoán chip/GPU/RAM vật lý. Dừng tác vụ encode/test trước hai phép đo. Cả hai: 1.848 cư dân, 924 có việc, 596 đang đi, 308 xe, 328 lượt đến. Báo median FPS và tổng frames riêng vì median không chứng minh FPS duy trì.

| Chỉ số | Trước | Sau | QA 24 dịch vụ |
|---|---:|---:|---:|
| Median FPS | 59,5 | 55,9 | 54,9 |
| Frames / 30,01s | 1.404 | 1.285 | 1.218 |
| Frame p95 ms | 33,4 | 33,5 | 33,8 |
| CPU tick p95 ms | 1,7 | 2,5 | 1,5 |
| Draw calls | 40 | 45 | 49 |
| Triangles | 57.576 | 60.468 | 61.570 |
| Geometries / textures | 17 / 0 | 17 / 0 | 17 / 0 |
| JS heap bytes | 79.707.550 | 31.493.001 | 95.730.331 |
| Chuẩn bị fixture ms | 367,7 | 323,5 | 283,2 |
| Long tasks / dài nhất ms | 7 / 370 | 13 / 327 | 16 / 294 |

Heap ảnh hưởng GC, không diễn giải heap giảm thành tối ưu được chứng minh. GPU memory byte không có API đo, ghi null; texture count 0 thuộc renderer, không gồm decoded thumbnail DOM. Số liệu JSON: `art-performance-before/after/facilities.json`. Thời gian chuẩn bị fixture không phải thời gian mở catalogue; kiểm catalogue riêng cần phân biệt cold download và warm-cache. Không cam kết 60 FPS trên mọi máy hoặc 10.000 dân. Snapshot QA ≈2,48 MB vượt trần cloud 2 MB hiện tại; không gửi fixture này lên cloud.

## Lưu trữ và giới hạn còn lại

Kiểm tra thực phát hiện archive bị quota do 4 bản dự phòng cũ. Đã bổ sung fallback nén gzip cho **bản dự phòng mới** nếu raw bị quota: dùng fflate MIT đã có trong dependency Three. Không xóa/chuyển đổi bản cũ. Reader/export tự giải nén đúng bytes; dedupe so raw; kiểm ownership và nguyên payload pending. City/cloud schema không đổi; archive envelope có marker `bc26-local-archive-gzip-v1`, đọc song song raw cũ và gzip mới. Active draft vẫn format cũ; nếu cả compressed copy không vừa, vẫn chặn thay bản và báo lỗi, không xóa tiến trình. Có test quota mô phỏng, giữ raw/owner/pending và dedupe. Đây không phải tăng quota hay sửa trần cloud.

Các dịch vụ hiện có vẫn dựa trên mô phỏng vùng/công suất của core: chưa đầy đủ dispatch xe chuyên dụng, giường bệnh, lịch học, cargo theo mỗi người. Ga/cảng/sân bay/turbine/solar và nhiều template chưa có simulation, giữ làm tài liệu. Chưa có undo tổng quát trong core, không thêm nút undo giả. Thay mỹ thuật không làm các mục này thành hoàn tất. Backend/auth/RLS không sửa ở chặng này; không coi test form hoặc mock là kiểm lại toàn bộ production Supabase/BXH.

Ảnh PNG giữ alpha và crop đúng frame; đã xem thumbnail trên navy/inspector và atlas gốc. Nguồn có fringe nhỏ đỏ/vàng ở vài ảnh; giữ nguyên gốc, không tạo nền trắng. Không tuyên bố tất cả 216 ảnh đã được QA ở mọi nền/zoom. Cần tiếp tục kiểm và làm sạch derivative có fringe nếu thấy ở kích thước dùng thực.

## Bằng chứng ảnh thật

- `art-city-before.png`, `art-city-after.png`: cùng cảnh đối chiếu.
- `art-facilities-close.png`, `art-facilities-top.png`: models thật, zoom/góc khác nhau.
- `art-catalog-local.png`, `art-inspector-local.png`: menu và trạng thái tiện ích thật.
- Ảnh responsive/production và deployment Ready bổ sung khi kiểm xong.

## Cập nhật kiểm tra 10/10/2026

Sau tích hợp người/xe và GIS mới, full suite 133/133 đạt (198,344s), không skip. Local quota fallback mở rộng cho active save và backup, lossless, giữ pending cloud payload; 10 kiểm tra storage đạt. Không nâng schema DB. Renderer medium người/xe dùng budget220, xem mobility-integration-status.md cho số liệu mới; số liệu art trước đó không được dùng làm benchmark cho model người/xe mới. Chặng 144 model/nghiệp vụ còn thiếu được ghi riêng, không coi hoàn thành qua catalogue.
