# Lệnh đưa 300 nhiệm vụ vào Build City 26

Đặt thư mục `Build_City_26_300_Missions` trong workspace game, rồi dán nguyên lệnh dưới đây.

```text
Tiếp tục bản Build City 26 đang sửa. Đọc AGENTS.md và git status/diff trước; giữ các thay đổi UI, model, account và save đang làm.

Ảnh tiến độ hiện tại báo chỉ có 14 nhiệm vụ và EXP mới đủ khoảng cấp 7. Tôi cung cấp catalogue cụ thể trong Build_City_26_300_Missions, không phải chỉ một khung theo nhóm cấp.

Đọc README.md, DANH_SACH_300_NHIEM_VU.md, docs/QUY_TAC_TICH_HOP.md, data/missions-300.json, data/levels-1-100.json, data/unlocks.json và data/metric-contract.json. Xem docs/QA_REPORT.json để biết các kiểm tra đã qua và giới hạn. source/mission-reference.mjs là code tham chiếu, không phải backend production.

1. Import đủ 300 nhiệm vụ có ID/tên/mục tiêu/phần thưởng cụ thể. Có ba nhiệm vụ mỗi nhóm cấp 1–100. A/B song song, C cần A/B đã nhận; nhóm tiếp theo cần C nhóm trước. Không tạo placeholder “nhiệm vụ cấp N” hay chỉ tăng biến missionCount.

2. Áp dụng curve EXP được cung cấp hoặc migration tương thích được chứng minh. Với curve mới, từ cấp 1 EXP=0 tới cấp 100 cần 4.230.468 EXP; tổng 297 nhiệm vụ nhóm cấp 1–99 bằng đúng số này. Ba nhiệm vụ cuối có EXP cộng lifetime, cap vẫn 100. Không để người chơi tới cấp 7 rồi hết nhiệm vụ/EXP.

3. Làm adapter cho từng metric/filter trên simulation state và event thật. Công trình cần đang hoạt động đúng kind/tier; chuyến đi/giao hàng/dịch vụ cần hoàn thành và áp dụng kết quả. Missing/undefined/NaN/stale hoặc hệ thống chưa có không tự hoàn thành, đặc biệt với điều kiện <=. Không cho fixtures/test mode rò vào production.

4. Tạo job/handler còn thiếu trước khi kích hoạt nhiệm vụ phụ thuộc nó. Dùng unlocks.json để mở công trình/tier/tuyến đúng lúc; kiểm tra bootstrap điện/nước và nhân lực không tạo vòng lặp. Với phương án địa hình ANY chỉ cần một nhánh hợp lệ, phần thưởng như nhau. Nâng cấp có nhánh chấp nhận công trình tier cao đã tồn tại để người dùng cũ không kẹt.

5. Lưu baseline counters khi mở nhóm đúng một lần. Dữ liệu sau baseline tính theo event/job ID hợp lệ; không đếm lại khi reload. Hold dùng simulation clock, mặc định 1 giây thực=5 giây game; pause không cộng, mất điều kiện trước khi đủ thì reset. Hoàn thành có earned evidence; client không được tự đặt earned=true để lĩnh tiền.

6. Làm UI nhiệm vụ: đang làm, khóa, đã đủ điều kiện, đã nhận; thanh tiến độ từng mục tiêu; EXP/tiền; lý do còn thiếu; nút nhận thưởng; chỉ dẫn tới công trình hoặc panel liên quan. Với ANY hiển thị lựa chọn hợp lệ. Hiển thị cấp/EXP thật và ba nhiệm vụ kết chiến dịch ở cấp 100.

7. Nhận thưởng qua backend có xác minh chủ thành phố, prerequisite và completion evidence; transaction và ledger unique để reload/retry/hai tab không nhân đôi EXP/tiền. Giữ RLS, không nhúng service-role key vào client. Prototype trong bộ nhớ không đủ để tuyên bố đã chống gian lận.

8. Kiểm tra 14 nhiệm vụ cũ, curve và các phần thưởng đã nhận; tạo mapping/migration theo nội dung thật. Không xóa lịch sử, reset cấp, trừ tiền hoặc trả lại thưởng đã nhận. Giữ save cũ tối thiểu ở cấp cũ; quy đổi phần dư EXP có kiểm tra.

9. Sửa vấn đề bản lưu >2 MiB đang báo trong tiến độ: không nhúng 300 mô tả/conditions hoặc mesh/catalogue tĩnh vào cityState. Lưu claimed IDs/bitset, stage, baseline, hold/earned evidence và XP gọn. Nếu world state vẫn lớn, dùng serializer tối thiểu và storage/chunk manifest có revision/ownership phù hợp. Không cắt cư dân hoặc nhiệm vụ gây mất dữ liệu, không chỉ tăng giới hạn tùy ý rồi báo đã sửa.

10. Chạy script validate của gói, sau đó test trong repository: đủ 300 ID, có đường lên 100, nhiệm vụ hiện đúng mục tiêu, unlock không kẹt, counters không đếm trùng, pause/reload giữ tiến độ, migration nhiệm vụ cũ, backend double-claim và save đông dân. Thử các nhóm cấp đầu/giữa/cuối bằng fixture riêng chỉ cho test; ít nhất chơi thử luồng đầu trong trình duyệt với dân và dịch vụ thật. Playtest tiền, giá/công suất và thời lượng; nếu chỉnh moneyMultiplier phải ghi rõ, không làm lệch EXP.

Hoàn thành code tích hợp, chạy lint/typecheck/build và báo số nhiệm vụ thực sự khả dụng, metrics đã nối, hệ thống còn thiếu, kết quả test/save/migration và trạng thái deploy thật. Không dừng ở việc thêm JSON hoặc tạo bảng nhiệm vụ chưa hoạt động.
```
