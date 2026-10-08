# Đồng hồ và đơn vị — clock-5

Bước logic cố định 1 giây game. Thứ tự: clock → cập nhật ngày khi qua ranh giới → construction → citizens → vehicles → progression. Renderer 3D nội suy giữa hai bước, không sửa state mô phỏng. Vận tốc tính theo mét mỗi giây **game**, không chia lại cho tỷ lệ thời gian.

- Mặc định 1×: **1 giây thực = 5 giây game**. 10 giây = 50 giây game; 1 phút = 5 phút game; 12 phút = 1 giờ game; 4 giờ 48 phút = 1 ngày game.
- Quan sát: 1:1. Casual-time5-v1 cho phép 3×/8× tương ứng 15/40 giây game mỗi giây thực; UI ghi rõ casual nhanh. Chưa có ranked rule/server.
- Pause/Resume giữ tốc độ đã chọn; save lưu playback (rule, multiplier, paused, observe) và timestamp. Modal/tab ẩn ngừng thời gian. Không cộng giờ offline khi mở lại.
- Elapsed dùng performance.now/RAF timestamp đơn điệu. Không clamp frame dài: thời gian đã nhận ở backlog được giữ. Mỗi batch tối đa 120 bước; UI báo backlog. Physics không gộp thành một bước lớn.

Calendar UTC bắt đầu 01/01/2026; ngày/tháng/năm theo lịch thật, tháng 2 có 28/29 ngày. Lãi, thi công, chuyển động và lịch công việc cùng clock. Đi bộ 65 m ở 1,3 m/s mất 50 giây game, tức 10 giây thực nếu không chờ.

Hệ quả: hợp đồng 2 ngày mất 9 giờ 36 phút thực. Công viên cũ 10 ngày vẫn giữ timeline, chưa chuyển các hợp đồng sang preset rút gọn. Preset thi công casual theo A5 là việc còn phải triển khai riêng; không tăng ngày để che thời gian dài.

Schema 3/4 bước 10 giây được chuyển sang step=seconds, giữ nguyên timestamp, tiền, ID, lịch, EXP và receipts; mặc định playback mới 1:5. Schema 1/2 vẫn đổi tiền ×100 đúng một lần. Schema 5 không đổi timestamp khi load. Raw bản cũ được giữ trước migration; thiếu chỗ dự phòng không được mở một thành phố trống thay bản cũ.

Ô đất 20×20 m; map hiện 64×64 = 1.280×1.280 m, chưa đạt world 12,8 km. Position lưu x/y ngang, z cao độ bằng mét. Đi bộ 0,8–1,8 m/s; ô tô 30/3,6 m/s. Graph hiện theo tâm ô, chưa lanes/crossing/parking. Attendance chỉ tăng khi đến nơi. Điện kW; nước/nước thải m³/ngày (0,15 m³/người/ngày). Utilities còn theo bán kính/công suất tổng hợp.

Tiền core BC; 1 BC = 1.000 đồng game hiển thị. Đây là quy ước game, không phải tỷ giá thực. PRNG seed và societySeed, IDs, lịch, hành trình/segment/distance, contracts, ledger và command sequence được lưu. GPU/DOM/camera/cache tìm đường không nằm trong JSON.

Kiểm chứng: injected clock 10/60 giây, 30/60/120 FPS cho 50/300 giây và snapshot giống nhau; pause/hidden =0; observe 1:1; backlog không mất bước; save/load giữ tốc độ/tạm dừng và timestamps; hành trình 65 m đến đúng lúc, arrival một lần. Toàn bộ test thời điểm schema 5: 78/78 PASS.
