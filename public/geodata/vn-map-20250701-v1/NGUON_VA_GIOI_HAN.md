# Nguồn, phiên bản và giới hạn

Ngày dựng: 2026-10-10. Mốc hành chính được chọn: **2025-07-01**, theo sắp xếp năm 2025. Không tự suy đoán thay đổi phân loại tỉnh/thành sau mốc này.

## Tên và sáp nhập

1. Chính phủ — Chi tiết 34 đơn vị hành chính cấp tỉnh:
   https://xaydungchinhsach.chinhphu.vn/chi-tiet-34-don-vi-hanh-chinh-cap-tinh-tu-12-6-2025-119250612141845533.htm
2. Nghị quyết 202/2025/QH15, ngày 12-06-2025:
   https://vanban.chinhphu.vn/?docid=213930&pageid=27160
3. Phú Quốc, An Giang — Nghị quyết 1654/NQ-UBTVQH15, bản danh sách:
   https://xaydungchinhsach.chinhphu.vn/sap-xep-dvhc-danh-sach-102-xa-phuong-dac-khu-cua-tinh-an-giang-moi-119250622171340485.htm
4. Hoàng Sa, Đà Nẵng — Nghị quyết 1659/NQ-UBTVQH15:
   https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-1659-nq-ubtvqh15-sap-xep-cac-dvhc-cap-xa-cua-thanh-pho-da-nang-nam-2025-119250616202714604.htm
5. Trường Sa, Khánh Hòa — Nghị quyết 1667/NQ-UBTVQH15:
   https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-1667-nq-ubtvqh15-sap-xep-cac-dvhc-cap-xa-cua-tinh-khanh-hoa-nam-2025-119250616200424907.htm

6. Côn Đảo, TP. Hồ Chí Minh — Nghị quyết 1685/NQ-UBTVQH15:
   https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-1685-nq-ubtvqh15-sap-xep-cac-dvhc-cap-xa-cua-thanh-pho-ho-chi-minh-nam-2025-119250616211341304.htm

Đặc khu là cấp xã trong hệ thống sau sắp xếp, không cộng thêm vào 34 đơn vị cấp tỉnh. Gói không bao gồm toàn bộ tên đô thị, xã, phường hoặc tất cả đảo nhỏ được đặt tên.

## Hình học GIS

**Ghi công:** Nguyễn Duy Liêm. (2025). Dữ liệu GIS Việt Nam. Free-GIS-Data.
https://github.com/nguyenduy1133/Free-GIS-Data

Commit được dùng: `ccb9f4ae992418bfeefd06da1eb42d0249632176`.
Đường dẫn nguồn: `Vietnam Administrative Divisions (Post-2025) - Đơn vị hành chính Việt Nam (Từ 2025)/Provinces.geojson`.
File tải nguyên văn: `source/provinces-original.geojson`. SHA-256 ghi trong báo cáo QA.

README nguồn cho phép sử dụng công khai miễn phí và yêu cầu ghi nguồn khi sử dụng/phân phối. Câu ngắn trong README: “This data is provided free of charge for public use.” Không giả định có một giấy phép MIT áp dụng cho GIS nếu nguồn không ghi như vậy. Nguồn nêu dữ liệu được cung cấp theo hiện trạng, không bảo đảm hoàn toàn chính xác/cập nhật. Nếu sử dụng bản cập nhật khác, kiểm tra lại README và điều kiện tại phiên bản đó.

Thiết kế bố cục và code dựng/xem trong gói được tạo cho Build City 26. Dữ liệu GIS là dữ liệu bên thứ ba có ghi công như trên. Không phải hình ảnh hoặc asset của Cities: Skylines II.

## Sửa lỗi nguồn đã thực hiện

Feature thứ 10 (index 9), thuộc tính `Ma="31"`, có bbox xấp xỉ `[105.1852, 10.1345, 106.8225, 10.9734]`. Hình học nằm ở Đồng Tháp/Tiền Giang, nhưng `TinhThanh` và `SapNhap` trong nguồn bị chép thành Lạng Sơn. Đổi nhãn thành **Đồng Tháp**, tra sáp nhập từ nguồn Chính phủ. Feature Lạng Sơn thật (index 19, `Ma="11"`) ở `[106.0949, 21.3251, 107.3641, 22.4615]` được giữ nguyên.

Sửa metadata và bổ sung cụm Côn Đảo vào geometry TP. Hồ Chí Minh; giữ nguyên tọa độ các thành phần nguồn, không tự vẽ thêm tọa độ. Bỏ population/area/STT gốc khỏi dữ liệu xuất vì có giá trị chưa đồng nhất với công bố hành chính; không dùng chúng làm dân số hoặc chi phí game thật. `sourceCode` chỉ để truy xuất nguồn, không phải mã hành chính được chứng nhận. `number` 1–34 là số trong chú giải của gói.

Nguồn bổ sung Côn Đảo: cùng repository/commit, `Vietnam Administrative Divisions (Pre-2025) - Đơn vị hành chính Việt Nam (Trước 2025)/Provinces_included_Paracel_SpratlyIslands.geojson`, lưu ở `source/provinces-pre2025-check.geojson`. Lấy 11 thành phần từ feature `Name="Ba Ria - Vung Tau"` có centroid trong khoảng 106,5–106,8°Đ, 8,6–8,9°B; không lấy hai thành phần xa hơn phía tây. Polygon lớn là đảo Côn Sơn. Gắn với TP. Hồ Chí Minh theo mốc 2025 và Nghị quyết 1685. Côn Đảo đã có trong full/light, `con-dao-supplement.geojson` chỉ dùng truy xuất nguồn, không cộng thêm lần nữa.

## Quần đảo và Phú Quốc

Phú Quốc lấy polygon thực trong nguồn An Giang, bbox xấp xỉ `[103.8323,10.0052,104.0810,10.4524]`. Không thay hình đảo bằng một hình vuông hay một điểm giả. Marker Phú Quốc trên ảnh là điểm đặt nhãn, không phải địa điểm trung tâm hành chính.

Hoàng Sa và Trường Sa lấy các hình học ngoài khơi có trong nguồn, giữ lon/lat. Hình học này chứa cả đảo, bãi và rạn; chưa phân loại phần nổi/chìm, chưa khảo sát lại đường bờ từng đảo. Marker ở `[112,16.5]` và `[114.3,10]` chỉ đặt nhãn quần đảo, không khẳng định có đảo ngay tại điểm đó.

Ô phóng to Trường Sa dùng phạm vi hiển thị tham chiếu khoảng 111°30′–117°20′Đ, 6°50′–12°B. Các hình học ngoài hộp này trong file Khánh Hòa gốc vẫn giữ trong GeoJSON; không khẳng định tất cả hình ngoài hộp đó thuộc cùng một quần đảo. Phạm vi là bbox để zoom, không phải đường biên lãnh hải hoặc chủ quyền.

Tham khảo phạm vi địa lý quần đảo: Bộ Tư pháp, tài liệu phổ biến pháp luật biển đảo:
https://pbgdpl.gov.vn/SMPT_Publishing_UC/TinTuc/PrintTL.aspx?ItemID=1113&idb=1&l=%2Fnoidung%2Ftintuc%2FLists%2FNghiencuutraodoi
Hoàng Sa, Cổng thông tin Đà Nẵng:
https://danang.gov.vn/vi/web/dng/w/ubnd-huyen-hoang-sa-i
Hai trang này có thể hạn chế truy cập trực tiếp; chúng chỉ bổ sung tham chiếu phạm vi, không dùng để tự dựng lại ranh giới.

Nhãn hành chính theo hệ thống Việt Nam và mốc 2025. Chủ quyền Hoàng Sa và Trường Sa có tranh chấp quốc tế. Bản đồ không mô tả tình trạng kiểm soát thực địa hoặc vẽ đường phân định biển.

## Phép chiếu và LOD

GeoJSON: tọa độ WGS84, thứ tự **kinh độ, vĩ độ**. Bản đồ chính: equirectangular, vĩ tuyến chuẩn 16°B; toàn bộ hình học dùng chung phép chiếu và tỷ lệ. Thanh 200 km là xấp xỉ tại vĩ tuyến chuẩn. Không dùng ảnh để đo khoảng cách ngoài điều kiện đó.

`vietnam-34-full.geojson` giữ tọa độ geometry nguồn và có Côn Đảo bổ sung từ file trước 2025. `vietnam-34-light.geojson` dùng Shapely `simplify(tolerance=0.0008, preserve_topology=True)`. Tolerance theo độ, không phải hằng số mét trên mọi vĩ độ. `preserve_topology` áp dụng từng feature, không chứng nhận cả bộ là một coverage có cạnh chung hoàn hảo; đường biên vùng kề có thể lệch vài pixel khi phóng rất sâu. Game cần giữ full geometry hoặc tạo pipeline topology/tiles nếu cần zoom sâu.

Chưa có DEM, độ sâu biển, đường, sông, quy hoạch hoặc land mask được kiểm chứng. Không phát sinh dữ liệu thật từ noise ngẫu nhiên. Không dùng bộ này làm bản đồ địa chính, bản đồ phân định biển hoặc dẫn đường hàng hải.
