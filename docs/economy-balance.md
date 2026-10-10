# Tiền, migration và kế toán hiện tại

Yêu cầu “theo tiền Việt” nhận sau đặc tả: UI dùng vi-VN, ký hiệu ₫, rút gọn triệu/tỷ; một BC nội bộ hiển thị 1.000 đồng game. Không dùng cách đổi đơn vị chỉ trên một màn hình. Format dùng chung tại src/config/money.js.

Schema 1/2: money, loanBalance và nguyên giá đã biết nhân 100 duy nhất khi chuyển lên schema 3. Schema 3 có currency=BC và currencyMigration; load tiếp không nhân lại. Map, dân số, tọa độ và seed giữ; bản local thô được archive trước khi ghi lại. Payload cloud đang chờ xác nhận giữ nguyên schema/nội dung/requestId đến khi server ACK, rồi bản đã chuyển được lưu ở revision kế tiếp.

Theo quyết định mới ngày 09/10/2026, tài khoản/thành phố mới bắt đầu **100.000 BC = 100 triệu ₫ game**. Không cộng bù hoặc cắt tiền tài khoản/bản lưu cũ. Fixture tutorial `createCity()` giữ 12.000.000 BC để kiểm hồi quy; luồng người chơi và server đăng ký dùng `createEmptyCity()` với `NEW_CITY_CASH_BC`. Vay tối đa 5.000.000 BC, 5%/năm, phân bổ theo ngày trong năm thực của lịch mô phỏng; tiền vay và dư nợ cùng tăng. Vay không tính vào taxIncome. Ledger hiện đối chiếu openingCash + cash flows = money. Mỗi giao dịch có receipt ID; retry không phát sinh tiền lần hai. Khi journal quá 3.000 dòng, dòng cũ được kết chuyển vào openingCash; receipt vẫn giữ để chống lặp.

Công viên mới có hợp đồng 15 phút game (900 giây); hợp đồng cũ giữ thời lượng đã lưu, giữ toàn giá trong escrow, không phục vụ trước hoàn tất, hủy hoàn khoản chưa chi một lần. Tài sản mới lưu historicalCost, phá hoàn 25% khoản đã trả; tài sản map có sẵn không hoàn tiền. Hợp đồng hiện chưa có vật tư, thiết bị, đội thi công hay dự phòng riêng.

**Chưa hoàn tất Lệnh 4/12:** giá mua mới đã tách BOQ cơ bản và phí đất, nhưng chưa có đủ chi tiết I4; thuế và vé dự báo theo số liệu tổng hợp. Chưa dùng đầy đủ khối lượng/đơn giá Phụ lục A, payroll, tiêu dùng điện/nước/nhiên liệu, P&L, quỹ hộ/doanh nghiệp và transit thu tiền sau boarding. Không dùng số liệu này cho BXH verified. Không mô tả mức giá hiện tại là giá thị trường Việt Nam.

## Bộ khởi đầu 100 triệu

Ba trạm nhỏ mới: điện 100 kW giá 15 triệu, nước 15 m³/ngày giá 12 triệu, nước thải 15 m³/ngày giá 12 triệu; bán kính 8 ô, phí tháng lần lượt 150/120/150 nghìn đồng game. Đây là giá cân bằng game để khởi đầu, chưa phải dự toán khối lượng I4 hoặc giá thị trường.

Ví dụ đã kiểm: 3 ô đường ×14 triệu + ba trạm 39 triệu + ba ô quy hoạch ×800.000 đồng = 83,4 triệu; còn 16,6 triệu. Kiểm thực trong browser: 4 ô đường + ba trạm + 4 ô phân khu hết 98,2 triệu, còn 1,8 triệu. Nhà chỉ nghiệm thu sau 900 giây game với đường, điện, nước, xử lý nước thải và nhu cầu đủ. Giá xây do vốn tư nhân trả riêng, không phải phí tô đất. Không nhận thưởng vốn thêm khi tải lại; ledger openingCash của thành phố mới là 100.000 BC.

Nhà máy nước/nước thải, trường trung học/đại học và bệnh viện dùng giá A2; các biến thể còn lại có giá cân bằng được ghi trực tiếp trong catalog. Công suất/phạm vi/phí thật tác động hệ thống hiện có. Chưa hoàn thiện nhân sự, hàng đợi, phương tiện dịch vụ, định mức vật tư và bảng dự toán toàn I4.

## Giá xây, phí quy hoạch và nâng cấp — 10/10

Một ô 20×20m có phí quy hoạch 2 BC/m² = 800 BC = 800.000 đồng game. Chọn mẫu khi tô đất lưu `blueprint`, không đặt ngay chung cư hoàn thiện. 13 mẫu tính diện tích sàn × đơn giá A/D: nhà phố 432 triệu/24 chỗ, nhà mái ngói 81 triệu/8 chỗ, biệt thự 216 triệu/12 chỗ, sân trong 108 triệu/12 chỗ, chung cư giật cấp 518,4 triệu/48 chỗ, hai khối 633,6 triệu/64 chỗ, ban công 517,5 triệu/48 chỗ. Shop 144 triệu/16 việc, chợ 168 triệu/24, văn phòng 484 triệu/48; xưởng 356,8 triệu/28, kho 234,4 triệu/20, chế biến 404 triệu/32. Đây là bảng cân bằng game, không phải báo giá thi công thị trường.

Giá đường 14 triệu/ô = 20m×12m×50 BC/m² mặt đường + 80m² vỉa hè×25 BC/m². Đại lộ 25,4 triệu/ô; cầu đường 134 triệu/ô gồm mặt cầu và trụ. Nâng đường chỉ trả chênh lệch. Cao độ/dốc dùng hệ số đặt chung trong core/UI. Nguyên giá tài sản cũ giữ nguyên.

Nâng công trình có hợp đồng trả trước: cấp 2/3 bằng 25%/45% nguyên giá + 10% dự phòng; nghiệm thu trả lại dự phòng một lần. Sức chứa/công suất hệ số 1/1,25/1,5/1,75/2; vận hành tăng 1/1,15/1,35/1,6/1,9. Mất tiện ích dừng tiến độ; không còn nâng cấp miễn phí theo ngày. Cấp 4/5 có báo rõ chưa đủ hệ thống viễn thông/an sinh/dự phòng, không có nút nâng giả. Chưa nhân sự/vật tư/đội thi công toàn I4.

## Cổ phiếu và xổ số bằng tiền game

6 doanh nghiệp hư cấu; cập nhật giá mỗi 18.000 giây UTC thực trên Supabase. Giá từng kỳ từ seed riêng phía DB, ±20% giá cơ sở; không theo giá cổ phiếu ngoài đời. Mua/bán giá server, phí 0,1% làm tròn lên tối thiểu 1 BC. Không bán khống; danh mục giữ ở server theo ID thành phố. Không phát thêm vốn tài khoản, không chuyển số dư ví bên ngoài.

Xổ số 6/45: vé 10.000 đồng; chọn 6 số khác nhau 1–45, tối đa 50 vé cùng bộ/lệnh. Mỗi kỳ 5 giờ thực toàn hệ thống; kết quả quá khứ xác định từ seed riêng, không lộ kỳ tương lai, không đổi khi tải lại. Trùng 3/4/5/6 nhận 30 nghìn/1 triệu/100 triệu/10 tỷ đồng game mỗi vé. Nút đối soát nhận thưởng cho toàn vé đã đến hạn một lần. Không yêu cầu trình duyệt luôn mở hoặc cron để xác định kỳ đã đóng. UI đếm lùi chỉ để hiển thị; DB quyết định kỳ.

Giao dịch khóa dòng city, kiểm revision/chủ sở hữu/sổ tiền, cập nhật holdings/vé/ledger/revision trong một transaction. Biên nhận chống lặp được lưu trước khi gửi; mất mạng giữ cùng request ID và tạm dừng thành phố đến khi đối soát. Xung đột trả PT409, không dùng SQLSTATE 40001 gây lặp trong PostgREST 14: [tài liệu Supabase](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b). RLS và revoke bảo vệ bảng private; chỉ RPC chủ sở hữu đọc danh mục/vé. Tiền toàn game vẫn xuất phát mô phỏng client nên chưa phải nền kinh tế/BXH chống gian lận đầy đủ. JSON không sao chép danh mục sang ID city mới. Trần bản lưu cloud 2 MB vẫn là giới hạn hiện hữu.
