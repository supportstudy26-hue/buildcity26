# Tiền, migration và kế toán hiện tại

Yêu cầu “theo tiền Việt” nhận sau đặc tả: UI dùng vi-VN, ký hiệu ₫, rút gọn triệu/tỷ; một BC nội bộ hiển thị 1.000 đồng game. Không dùng cách đổi đơn vị chỉ trên một màn hình. Format dùng chung tại src/config/money.js.

Schema 1/2: money, loanBalance và nguyên giá đã biết nhân 100 duy nhất khi chuyển lên schema 3. Schema 3 có currency=BC và currencyMigration; load tiếp không nhân lại. Map, dân số, tọa độ và seed giữ; bản local thô được archive trước khi ghi lại. Payload cloud đang chờ xác nhận giữ nguyên schema/nội dung/requestId đến khi server ACK, rồi bản đã chuyển được lưu ở revision kế tiếp.

Theo quyết định mới ngày 09/10/2026, tài khoản/thành phố mới bắt đầu **100.000 BC = 100 triệu ₫ game**. Không cộng bù hoặc cắt tiền tài khoản/bản lưu cũ. Fixture tutorial `createCity()` giữ 12.000.000 BC để kiểm hồi quy; luồng người chơi và server đăng ký dùng `createEmptyCity()` với `NEW_CITY_CASH_BC`. Vay tối đa 5.000.000 BC, 5%/năm, phân bổ theo ngày trong năm thực của lịch mô phỏng; tiền vay và dư nợ cùng tăng. Vay không tính vào taxIncome. Ledger hiện đối chiếu openingCash + cash flows = money. Mỗi giao dịch có receipt ID; retry không phát sinh tiền lần hai. Khi journal quá 3.000 dòng, dòng cũ được kết chuyển vào openingCash; receipt vẫn giữ để chống lặp.

Công viên có hợp đồng 10 ngày, giữ toàn giá trong escrow, không phục vụ trước hoàn tất, hủy hoàn khoản chưa chi một lần. Tài sản mới lưu historicalCost, phá hoàn 25% khoản đã trả; tài sản map có sẵn không hoàn tiền. Hợp đồng hiện chưa có vật tư, thiết bị, đội thi công hay dự phòng riêng.

**Chưa hoàn tất Lệnh 4/12:** catalog còn là bảng giá bản nền ×100; thuế và vé dự báo theo số liệu tổng hợp. Chưa dùng đầy đủ khối lượng/đơn giá Phụ lục A, payroll, tiêu dùng điện/nước/nhiên liệu, P&L, quỹ hộ/doanh nghiệp và transit thu tiền sau boarding. Không dùng số liệu này cho BXH verified. Không mô tả mức giá hiện tại là giá thị trường Việt Nam.

## Bộ khởi đầu 100 triệu

Ba trạm nhỏ mới: điện 100 kW giá 15 triệu, nước 15 m³/ngày giá 12 triệu, nước thải 15 m³/ngày giá 12 triệu; bán kính 8 ô, phí tháng lần lượt 150/120/150 nghìn đồng game. Đây là giá cân bằng game để khởi đầu, chưa phải dự toán khối lượng I4 hoặc giá thị trường.

Ví dụ đã kiểm: 5 ô đường ×6 triệu + ba trạm 39 triệu + hai ô quy hoạch ×2,5 triệu = 74 triệu; còn 26 triệu. Nhà mọc và việc làm phát triển khi có đường/tiện ích/nhu cầu. Không nhận thưởng vốn thêm khi tải lại; ledger openingCash của thành phố mới là 100.000 BC.

Nhà máy nước/nước thải, trường trung học/đại học và bệnh viện dùng giá A2; các biến thể còn lại có giá cân bằng được ghi trực tiếp trong catalog. Công suất/phạm vi/phí thật tác động hệ thống hiện có. Chưa hoàn thiện nhân sự, hàng đợi, phương tiện dịch vụ, định mức vật tư và bảng dự toán toàn I4.
