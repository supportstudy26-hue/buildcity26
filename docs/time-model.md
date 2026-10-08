# Đồng hồ và đơn vị — foundation-3

Core dùng bước cố định 10 giây mô phỏng, thứ tự clock → cập nhật theo ngày nếu qua ranh giới → construction → citizens → vehicles. Analyze/reconcile quan hệ chạy ở command và ngày mới, không chạy mỗi frame vẽ. Ngày/tháng/năm theo lịch UTC mô phỏng, bắt đầu 01/01/2026; tháng 2 có 28/29 ngày theo năm.

- Chơi 1×: 1 giây thực = 2.880 giây mô phỏng (48 phút); một ngày = 30 giây thực. 3× và 8× nhân cùng đồng hồ cho lịch, chuyển động, công trường và thu chi.
- Quan sát: 1 giây thực = 1 giây mô phỏng. Vị trí logic cập nhật mỗi 10 giây; renderer Canvas hiện chưa nội suy nên có thể thấy bước nhảy giữa các lần cập nhật.
- Pause, modal và tab nền ngừng toàn bộ mô phỏng. Không cộng thời gian offline. Mỗi frame nhận tối đa 0,25 giây thực; backlog đã nhận được giữ, xử lý tối đa 1.200 bước mỗi batch, không bỏ bước đã xếp hàng.
- “Quan sát chuyến tiếp theo” chạy nhanh đến lúc đúng ID bắt đầu chuyến, rồi chuyển sang thời gian tự nhiên. Không đổi vị trí, lịch hay vận tốc trong core.

Ô đất 20×20 m; map 64×64 là 1.280×1.280 m. Position lưu x/y ngang và z cao độ bằng mét; graph hiện đi theo tâm ô, z=0. Đi bộ 0,8–1,8 m/s theo hồ sơ; ô tô hiện 30/3,6 m/s. ETA tính từ chiều dài route chia vận tốc; attendance chỉ tăng khi đến nơi, không khi bắt đầu đi. Lane, crossing, đèn, parking và car-following thuộc Lệnh 3/6/7, chưa có.

Điện kW; nước/nước thải m³/ngày, 0,15 m³/người/ngày. Chưa có mạng ống/cáp và meter theo từng hộ. Kinh tế lưu BC; giao diện theo yêu cầu mới của người dùng hiển thị ₫ qua hệ số 1 BC = 1.000 đồng game. Đây là quy ước hiển thị, không phải tỷ giá hay giá xây dựng ngoài đời.

Seed địa hình/growth và societySeed xorshift32 được lưu riêng để không làm đổi seed cũ khi tạo hộ. IDs/counters, schedules, path/segment/distance, contracts, cash receipts và command sequence được lưu. Renderer/camera/DOM/cache BFS không nằm trong JSON. Load xây lại cache; cùng rule version/seed/sequence phải cho cùng snapshot trong tests (so sánh sâu, không nới sai số).

Ngày tăng trưởng còn dùng quy tắc tổng hợp bản nền; households/citizens tái đối chiếu đúng tổng dân số và sức chứa. Đây chưa phải mô phỏng sinh/tử, hợp đồng thuê hoặc nhập cư của Lệnh 5.
