# Cư dân và phương tiện — chặng 10/10/2026

**Chưa hoàn thành toàn bộ yêu cầu 144 model và nghiệp vụ.** Không dùng số ảnh catalogue làm số phương tiện đang mô phỏng.

## Phần hoạt động trong game

- Giữ nguyên gói nguồn và 25 SHA trong `art-source/Build_City_26_People_Vehicles`. 144 ID/tên tiếng Việt/16 atlas được nối qua `mobility-art-assets.json` / `mobility-art.js`. Catalogue và inspector crop đúng frame manifest, giữ alpha; 16 WebP 4.684.388 byte. Script kiểm alpha của WebP so với PNG; không cắt 9 ô đều. LRU tối đa 4 atlas / 80 thumbnail, chỉ hydrate ảnh đang nhìn thấy.
- `mobility-models.js`: 43 prototype mesh bằng hình học code riêng, gồm 27 cư dân, 9 ô tô, 7 buýt. Có bộ phận tách tay/cẳng tay/chân/bàn chân, bánh, cửa, khớp buýt; chia sẻ geometry/material, instancing. Không gọi PNG là model 3D, không dùng sprite plane thay mesh. Đây là các mesh có pivot điều khiển, chưa xuất GLB/rig skinned.
- Trong bản đồ thực, tuổi cư dân chọn mẫu trẻ/thiếu niên/người lớn/cao tuổi, 6 mẫu ô tô cá nhân và bus-city được nối trạng thái core. 3D hỗ trợ xoay camera; Canvas vẫn fallback 2.5D. Người chỉ bước khi quãng đường tăng; bánh quay theo travelled/radius; cửa bus mở tại điểm dừng. On-bus không render trùng người đi bộ. Pause/1:5 dùng đồng hồ core chung.
- `mobility-path.js`: làn phải offset 2,5 m và vỉa hè 7 m; cao độ theo địa hình. Hành trình cũ không viết lại/teleport. `road-controller.js`: spatial cells, khoảng cách với xe đi trước kể cả bus đang dừng; chu kỳ giao lộ cơ bản theo đường kết nối. Đây chưa phải lane graph đầy đủ, chuyển làn hay mô hình va chạm hoàn chỉnh.
- `bus-planning.js` / `bus-operations.js`: dân không có xe có thể đi bộ tới điểm lên, xếp hàng FIFO, đi bus tuyến thật, xuống điểm đích và đi tiếp tới nơi làm. Fleet xuất phát depot, chạy từng chặng đường, dwell/door, boarding và alighting từng người, capacity 60. Vé 700 ₫/lượt được thu thật một lần từ hộ gia đình vào sổ tiền; không cộng lại vé trong daily finance. Không có tuyến/đường thì blocked; bỏ tuyến giải phóng người tại tọa độ hiện tại, không teleport.
- Inspector/theo dõi dùng citizen/vehicle ID thật, mục tiêu/trạng thái/hành trình thật. Forecast bus cũ tách khỏi số hành khách thực; ảnh catalogue chỉ rõ “Chưa nối nghiệp vụ” nếu mẫu chưa active.
- Save schema 6 thêm mobilityVersion=1 và artId/travelled/bus plan/trip/phase/passengers; giữ bản cũ thiếu artId qua lựa chọn deterministic. Kiểm unique passenger, capacity, reciprocity, path/speed/state. Không thay auth/API/RLS. Local khi đầy quota thử gzip lossless (fflate từ dependency Three MIT); active save và backup giữ payload/định danh pending cloud nguyên vẹn, không xóa backup cũ. Client cũ không hiểu trạng thái hành khách mới; không mở bản mới bằng client cũ.

## Chưa làm xong

101 mẫu chưa có mesh; nghề của cư dân chưa nối dispatch đầy đủ. Taxi/accessible/limo và buýt điện/articulated/minibus/coach/school/shuttle hiện mới prototype, chưa active theo nghiệp vụ. Hình dáng prototype chưa QA hoàn toàn theo mọi ảnh; shuttle cần dạng xe mở, khớp articulated cần tinh chỉnh trước khi activate. Chưa có xe hai bánh, dispatch công vụ/hàng hóa/xây dựng, đường sắt, tàu, cảng, sân bay/máy bay và quy trình vận hành đầy đủ. Xe cá nhân chưa có boarding/parking state chi tiết; chưa accessibility tuyến xe lăn, chưa chuyển tuyến/headway/ticket economy đầy đủ. Traffic reduction cũ còn aggregate; không gọi là traffic simulation hoàn chỉnh.

## Kiểm tra và hiệu năng

8 kiểm tra mobility/bus và 10 kiểm tra storage đều đạt; full suite cuối cùng cùng map **133/133** đạt. Bus tests có dân tự chọn tuyến, lên/xuống/thanh toán/đến việc làm; 65 người FIFO, capacity60 còn5 chờ; lưu giữa chuyến rồi resume 40 tick cho trạng thái giống nhau, fare không lặp; xóa tuyến không mất người.

Render culling/frustum, LOD và budget thấp100/vừa220/cao360; giới hạn đối tượng vẽ, không cắt số cư dân mô phỏng. Dùng shared 16 geometries / 6 materials; không tải atlas vào GPU của map.

Benchmark 30 giây trên IAB Chrome155/macOS, 1280×720, DPR1, medium, fixture riêng chạy core thật (không ghi Supabase/save người dùng): xem `mobility-performance-1000.json` và `mobility-performance-5000.json`. 1.000 dân: 1.207 frame / 30,02s, trung bình ~40,2 FPS, median56,2, p95 frame34,3ms, CPU tick p95 3,7ms; 444 active, 245 visible, **220 rendered**, 48 draw calls /119.154 triangles; load502,7ms. FPS median không phải 60FPS ổn định; long task tối đa507ms. GPU memory chưa đo; heap chỉ một sample có GC, không lấy làm chứng minh giảm memory. Chưa đo thiết bị di động thật.

Bản 1.000 dân trong benchmark serialize **2.132.565 byte**, vượt giới hạn cloud/import 2 MB hiện có. Local gzip có thể giữ bản này nhưng chưa giải quyết giới hạn cloud của thành phố đông dân; cần tối ưu save/server budget ở chặng tiếp theo, không tuyên bố cloud quy mô lớn đã đạt.

Đo thêm 5.000 dân trong 30,04 giây: 1.216 frame, trung bình **40,5 FPS**, median57,8; p95 frame **48,8 ms**, CPU tick p95 **20,7 ms**; 1.988 active / 1.045 visible / **220 rendered**, 49 draw calls / 127.010 triangles. Khởi tạo 1.557,3 ms, long task tối đa1.559 ms; serialize6.476.662 byte. Đây là giới hạn hiện tại, chưa đạt 60 FPS ổn định và chưa giải quyết cloud 2 MB.

Browser bản build đã kiểm lưu local → reload → mở lại fixture 176 dân: giữ clock08:00:42 tạm dừng, xe vehicle-265 / tuyến Bình Minh thực, 1/60 khách, travelled146m và cửa mở tại điểm dừng; cư dân Vũ Ngọc vẫn ở trạng thái Trên xe buýt. Fixture nằm origin QA5182, không thay thành phố người dùng origin5180.
