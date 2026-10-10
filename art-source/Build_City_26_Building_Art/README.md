# Build City 26 — Bộ ảnh công trình và hướng dẫn áp dụng

**216 mẫu mỹ thuật**, gom vào **24 PNG atlas nền trong suốt**, mỗi atlas 9 mẫu. Có nhà ở, cửa hàng, văn phòng, sản xuất, tài nguyên, nông nghiệp, điện/nước/rác, giáo dục/y tế/phúc lợi, cứu hộ/an ninh, bưu chính/viễn thông, vận tải/cảng, công viên, văn hóa/du lịch, cầu đường và module mở rộng.

Đây là PNG dựng phong cách 3D, dùng cho thumbnail, game isometric cố định hoặc làm mẫu dựng model. **Không có GLB/FBX/mesh xoay 360° trong gói này.** Chưa có bộ năm tier cho mỗi loại hoặc animation động. Những công trình/module trong ảnh không tự tạo chức năng trong game; cần mapping và handlers/mô hình đang có trong repo.

## Mở và dùng

1. Giải nén nguyên thư mục `Build_City_26_Building_Art`.
2. Mở `XEM_BO_ANH.html` để xem từng nhóm, từng mã; chạy trực tiếp trong trình duyệt, không cần API hoặc cài dependency.
3. Đưa thư mục vào workspace Codex của repo Build City 26.
4. Gửi lệnh: **“Đọc LENH_CODEX_AP_DUNG.md trong Build_City_26_Building_Art và thực hiện toàn bộ yêu cầu trên repo hiện tại.”**

## File chính

- `atlases/`: 24 PNG gốc, 1254 × 1254 pixel mỗi ảnh, có alpha thật.
- `manifest.json`: 216 mã/tên Việt, nhóm, file, vùng ảnh thực và anchor khởi tạo. Dùng `frame`, không chia ô 3×3 cứng.
- `DANH_MUC_CONG_TRINH.csv`: bảng tên/mã/vị trí và tọa độ để xem bằng Excel hoặc đọc trong Codex.
- `ui/01-gameplay-redesign.png`: hướng sửa màn chơi sau phản hồi “toàn khối vuông, UI che bản đồ”.
- `ui/02-homepage.png`, `03-signup.png`, `04-login.png`: các ảnh thiết kế trang chủ/tài khoản đã tạo trước đó.
- `LENH_CODEX_AP_DUNG.md`: lệnh sửa công trình thật trên map, thumbnail, UI, hiệu năng và kiểm tra trước deploy.
- `integration/atlas-loader.ts`: ví dụ loader/cache và Canvas thumbnail; thích nghi theo framework của repo. Không thay engine hiện tại.
- `PROMPTS_TAO_ANH.json`: tập prompt đã dùng với công cụ tạo ảnh tích hợp; không cần AI API để dùng bộ PNG.
- `image-qa.json`, `frame-qa.json`: kiểm tra alpha, dimensions, regions và số cụm hình chính. Đây là kiểm tra bộ ảnh, không phải benchmark game.

## Phạm vi và chất lượng

Mỗi mẫu có một `artId` riêng; một số là công trình, một số là cơ sở hạ tầng hoặc module. Tên/kiểu đa dạng phục vụ catalogue, không khẳng định game hiện tại đã có đủ 216 chức năng. Những số giá/công suất/dân trong ảnh UI là số minh họa và có thể không nhất quán; dùng catalogue/core làm nguồn duy nhất khi lập trình. Một số ảnh có xe/cảnh vật trang trí, không dùng chúng làm thực thể mô phỏng.

Frames được lấy từ bounding rectangles của 9 cụm alpha chính từng atlas và cộng padding nhỏ, không sửa pixel PNG gốc. Camera/proportion là định hướng mỹ thuật, chưa hiệu chuẩn theo metres/footprint thật. Anchor là giá trị khởi tạo; Codex cần chỉnh theo renderer và kiểm tra không lẫn ảnh lân cận, đặc biệt mái/tháp cao, edges/alpha fringe trên nền sáng/tối. Ảnh không phải dữ liệu collision hay địa hình thực.

Tài nguyên tạo mới bằng công cụ tạo ảnh cho Build City 26; không trích xuất assets của game tham chiếu. Khi tạo mesh/texture/vector bổ sung, ghi nguồn/giấy phép trong repo. Giữ Supabase, tài khoản, bản lưu và simulation đang chạy; thay đồ họa không được làm mất tiến trình.
