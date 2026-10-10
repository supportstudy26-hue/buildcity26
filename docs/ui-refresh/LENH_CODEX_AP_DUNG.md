# Lệnh đưa cho Codex — Cập nhật giao diện Build City 26

```text
Tiếp tục dự án Build City 26 đang mở. Tích hợp bộ Build_City_26_UI_Refresh để làm lại HUD, tiền, icon điện/nước/dân số và các bảng chức năng cho đẹp, nhẹ và nhất quán.

1. Đọc README.md, docs/HUONG_DAN_TICH_HOP.md, assets/icons.json, ui/bc26-ui.css, ui/bc26-hud.js và ui/bc26-hud.d.ts. Mở XEM_GIAO_DIEN.html/ảnh chụp để hiểu thiết kế. Kiểm tra framework và HUD hiện tại trước khi sửa. Giữ các thay đổi đang làm trong repo; không reset nhánh hay ghi đè tính năng của tôi.

2. Thiết kế áp dụng: bảng tối xanh #142330, chữ sáng #f0f5fa, chữ phụ #adc0cd; số tiền vàng; điện vàng, nước xanh, dân số tím; nút chính xanh bạc hà. Bo góc 12–18px, khoảng cách thoáng, viền mảnh. Dùng cùng hệ 48 icon SVG, không trộn emoji/icon phông/icon hộp vuông tạm. Icon ở 20–24px, nét nhất quán, focus rõ, nút chính tối thiểu 44px. Cảnh báo có cả chữ và màu.

3. Thay HUD cũ bằng component tương thích kiến trúc repo. Nếu React thì chuyển bố cục và logic sang React/TypeScript; nếu DOM thì dùng createCityHud. Không chồng hai HUD lên nhau. Scope CSS, không làm hỏng trang chủ/đăng nhập/đăng ký.

4. Ngân quỹ: số dư, thu, chi, chênh lệch, nợ, kỳ ngân sách. Trên HUD hiển thị rút gọn, khi bấm mở bảng số chính xác. Đây là tiền trong game, không tự gắn ký hiệu VND. Thu/chi phải cùng kỳ; không đổi cơ chế tính tiền chỉ để khớp số mẫu.

5. Điện/nước: biểu thị đúng tỷ lệ công trình hoặc cư dân được phục vụ, công suất, nhu cầu, đơn vị, tải và cơ sở hoạt động. Ghi rõ định nghĩa và mẫu số. Ngưỡng màu của gói chỉ là ngưỡng trình bày, không tự thay đổi quy tắc mô phỏng. Thiếu dữ liệu hiện “— / Chưa có dữ liệu”; mẫu số bằng 0 không tự coi là 100%. Nối nút lớp dữ liệu với lớp phủ điện/nước thật.

6. Dân số, hài lòng, nhà ở/việc làm; EXP, cấp thành phố và nhiệm vụ: lấy từ simulation/save hiện tại. Level tối đa 100. Dùng catalogue 300 nhiệm vụ thật nếu đã tích hợp; không thay bằng nhiệm vụ mẫu “Một khu phố đáng sống” trong preview. Trạng thái nhận thưởng lấy từ máy chủ/ledger; bấm nhiều lần không nhận trùng.

7. Thanh công cụ xây dựng: đường, nhà ở, thương mại, sản xuất, hạ tầng, dịch vụ, giao thông, cảnh quan, địa hình và tháo dỡ. Danh mục có tìm kiếm, giá xây/bảo trì, cấp mở khóa và lý do nút không dùng được. Mở rộng các nhóm con phù hợp 54 building kinds/công trình đang có. Không đổi ID công trình đang lưu. Kiểm tra tiền/cấp/địa hình/đường đi lần nữa khi thực hiện; không tin trạng thái disabled của UI.

8. Bảng công trình: tên, model thumbnail nếu đã có, trạng thái vận hành và lý do thiếu dịch vụ, cấp, nhân viên/cư dân, sức chứa, bảo trì, giá và lợi ích nâng cấp. Nâng cấp thực sự tác động vào hệ thống hiện tại. Tháo dỡ mở xác nhận cụ thể, hiển thị hoàn tiền/chi phí và tác động, rồi mới thực hiện. Không chỉ thay nhãn cấp bằng số khác.

9. Nối tất cả nút: bản đồ Việt Nam, lớp dữ liệu, ngân sách, BXH tiền/cấp, nhiệm vụ, thông báo và vị trí, lưu game, cài đặt, pause/resume. Giữ tỷ lệ thời gian mặc định 1 giây thực = 5 giây game; pause dừng mô phỏng thật. Không để nút chỉ toast mà gọi là hoàn thành.

10. Responsive: kiểm tra tối thiểu 390×844, 480×854, 768×1024, 1024×768, 1600×1000 và ngang điện thoại. Thanh công cụ có cuộn riêng trên màn hẹp; không cuộn tràn cả trang; bảng chi tiết không ra ngoài màn. Bảo vệ thao tác trên bản đồ khi chạm UI. Mobile có thể thu gọn nhiệm vụ nhưng vẫn có cách mở danh sách. Dialog có Escape, focus trap và trả focus; icon trang trí aria-hidden, button có nhãn tiếng Việt.

11. Hiệu năng: SVG gốc, không tải web font/thư viện icon lớn/blur toàn màn hình. Chỉ cập nhật số liệu khi đổi hoặc tối đa khoảng 4–5 lần/giây; không tái tạo cả HUD mỗi frame. Memoize danh mục, giữ focus/tìm kiếm và trạng thái panel qua update. Game loop không chạy trong React state. Dọn listener/timer khi unmount. Đo FPS và input trên game thật; báo kết quả thực tế thay vì cam kết 60 FPS khi chưa đo.

12. Không đưa canvas minh họa, giá mẫu, dữ liệu dân số mẫu hay hàm __bc26Demo vào production. Nền màn chơi dùng engine và model đang có. Dùng icon ở assets và module ui; preview chỉ để tham khảo. Không đưa static icon/catalogue vào từng city save làm tăng kích thước bản lưu.

13. Chạy các checks phù hợp repo và kiểm tra thực tế: tiền âm/tiền lớn/chưa có dữ liệu; thiếu điện/nước; không dân; cấp1 và cấp100; thiếu tiền/khóa công trình; cập nhật snapshot khi đang tìm kiếm; nâng cấp/tháo dỡ; claim nhiệm vụ; pause; lưu/tải; click/chạm bản đồ và dialog; bàn phím; breakpoint. Kiểm tra cả tiền/nhiệm vụ sau reload. Không chỉ chạy build và kết luận mọi tính năng hoàn tất.

14. Khi xong, báo rõ file đã sửa, ảnh trước/sau nếu có, chức năng đã nối, checks đã chạy, hiệu năng đã đo và phần chưa làm. Chỉ nói push/deploy khi đã thực hiện. Nếu chưa có khóa Supabase/Vercel thì hoàn thiện phần local và .env.example; không yêu cầu khóa AI, không đưa khóa bí mật vào frontend.
```
