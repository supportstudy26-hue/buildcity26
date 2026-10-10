# Build City 26 — Cư dân và phương tiện

144 mẫu thiết kế nguyên bản trong **16 atlas PNG nền trong suốt**, mỗi atlas có 9 mẫu. Đồng bộ bảng màu kem, xanh ngọc, xanh đậm, đỏ đất và vàng dịu với bộ công trình Build City 26.

## Mở và sử dụng

1. Giải nén toàn bộ ZIP; mở XEM_BO_ANH.html để xem từng mẫu trên nền sáng/tối. Trang xem chạy offline, không cần đăng nhập.
2. Mỗi PNG là bảng 9 mẫu, không phải 9 file rời. manifest.json và DANH_MUC_CU_DAN_PHUONG_TIEN.csv cho vùng frame riêng của từng mẫu. Không chia ảnh theo 9 ô bằng nhau.
3. Đưa gói này vào repo hiện tại và dán lệnh trong LENH_CODEX_AP_DUNG.md cho Codex.
4. integration/atlas-loader.ts hỗ trợ tải/draw thumbnail có cache. animation profiles là bản thiết kế yêu cầu, không chứa clip hoặc model.

## Phạm vi

- 27 cư dân/nhân viên: trẻ em, thiếu niên, người lớn, cao tuổi, người dùng xe lăn, nghề nghiệp và nhân viên dịch vụ.
- 117 phương tiện/máy: ô tô/taxi, xe đạp/xe máy/xích lô, xe hàng, khẩn cấp, dịch vụ, xây dựng, bus/tram/metro, rail, thuyền/phà, tàu biển, máy bay, trực thăng/drone, nông nghiệp/sân bay/cáp treo.
- Mỗi mẫu có một góc nhìn isometric và một tư thế/trạng thái tham chiếu. Bộ này chưa có tám hướng, walk cycle, clip hoạt hình, âm thanh, GLB/FBX hoặc rig.
- PNG dùng được cho thumbnail và góc nhìn cố định. Camera 3D xoay tự do cần model dựng thêm; không thể suy ra mặt sau chính xác từ một ảnh.
- Dữ liệu people/vehicle, giao thông, năng lực dịch vụ, chi phí, chuyến bay và giao hàng vẫn cần code trong game; gói art không tự cài các hệ thống ấy.
- Không thay core đăng nhập, Supabase, save, BXH, tốc độ 1:5 hoặc catalogue cân bằng hiện có bằng dữ liệu minh họa.

## Lưu ý kỹ thuật

Kích thước PNG có thể khác nhau theo nhóm; xem atlasWidth/atlasHeight trong manifest. Frame là pixel, không là mét. Mẫu được chuẩn hóa để nhìn rõ trong catalogue, nên máy bay và xe con không có tỷ lệ vật lý tương ứng trong ảnh.

PNG giữ alpha thật. Một số trình xem bỏ qua alpha và hiển thị RGB ẩn như nền màu; trình duyệt Canvas trong XEM_BO_ANH.html sử dụng alpha. Nếu pipeline nén ảnh, giữ alpha và kiểm tra viền trên cả nền sáng/tối. Frame được đo từ silhouette chính và cộng khoảng đệm; dùng cho thumbnail/reference, có thể cần tinh chỉnh pivot theo mesh thật.

Các shadow mềm và đồ nghề đang gắn trong ảnh là hình tham chiếu tĩnh. Khi dựng model, tách bánh, cửa, cánh quạt, cần máy, người lái và shadow để điều khiển được. Thiết kế game không dùng chữ/logo hãng từ hình minh họa.

QA.json ghi kiểm tra byte ảnh, alpha, số silhouette chính, frame và bounds. Chưa kiểm chứng hiệu năng hoặc tích hợp ở website Vercel/repo game của bạn.

PROMPTS_TAO_ANH.json lưu prompt tạo/chỉnh ảnh; SHA256.json giúp kiểm tra nguyên vẹn gói tải.
