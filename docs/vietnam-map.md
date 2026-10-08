# Chế độ Việt Nam — dữ liệu và giới hạn

Mở **Lưu và cài đặt → Bản đồ Việt Nam · 34 tỉnh/thành**. Màn Toàn quốc có hai nút **Xem Hoàng Sa / Xem Trường Sa**; tìm không dấu cũng nhận ra quần đảo và tỉnh/thành tương ứng. Chọn đảo/bãi để xem tọa độ; chuyển về địa hình của tỉnh/thành để bắt đầu xây. Hai quần đảo hiện chỉ có lớp xem địa lý, chưa có khu xây giả lập trên đảo.

## Nguồn và ngày

- Danh mục tỉnh/thành: [Cổng Chính phủ](https://chinhphu.vn/thong-tin-tinh-thanh), kiểm tra 08/10/2026. Danh mục hiện tại gồm 34 đơn vị; 9 thành phố theo các thay đổi đã đối chiếu. Mã theo danh mục hành chính được dẫn trong manifest.
- Đặc khu Hoàng Sa / Trường Sa: [danh mục sắp xếp cấp xã 2025 của Chính phủ](https://xaydungchinhsach.chinhphu.vn/danh-sach-3321-don-vi-hanh-chinh-cap-xa-tai-34-tinh-thanh-sau-sap-xep-sap-nhap-119250710102358656.htm). Hoàng Sa thuộc Đà Nẵng; Trường Sa thuộc Khánh Hòa. Không tính hai quần đảo thành hai tỉnh mới.
- 12 điểm tham chiếu Hoàng Sa: dữ kiện DMS trong bảng tọa độ [Cổng Đà Nẵng](https://cttdt.danangportal.gov.vn/vi/w/ubnd-huyen-hoang-sa-i); dữ kiện nguồn giữ tại scripts/geodata/archipelago-reference.json. Không dùng vị trí chấm làm diện tích đảo hoặc tự dựng polygon đảo.
- Ranh/thủy hệ/bờ biển/địa danh: [OpenStreetData VN JSONseq](https://files.openstreetdata.org/extracts/VN.geo.jsonseq.bz2), ảnh chụp dữ liệu 07/05/2023; SHA-256 `8204eee8fb1530f16cf9868797b831f46f010bf7e4aeedc9242a4d5e15fd8059`, 350.148.471 byte. [© OpenStreetMap contributors · ODbL](https://www.openstreetmap.org/copyright). Nhóm 63 tỉnh cũ hợp nhất theo danh mục 2025; chưa kiểm chứng từng đỉnh ranh pháp lý năm 2026.
- Trường Sa: 46 way đường bờ thực trong cửa sổ 111,5–117° Đông / 7,5–12° Bắc, 9 địa danh có tên Việt. Lưu OSM ID và tên gốc trong metadata. Điểm đảo Trường Sa từ node `n5127953791`; đường bờ `w614161275`. Không khẳng định phủ đủ mọi đảo/bãi.
- DEM: [Mapzen/AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), USGS SRTM/GMTED và NOAA ETOPO1; edition 2017, z12, từng gói lưu hash/Last-Modified tile. Nguồn lục địa khoảng 30–38 m; ô game 20 m lấy mẫu lại, không tăng độ chính xác. Đáy biển ETOPO1 thô hơn nhiều; datum hỗn hợp chưa chuyển đổi/kiểm chuẩn khảo sát Việt Nam.

## Hiển thị và bảo toàn bản lưu

Ranh hành chính ngoài biển không phải đường bờ đất. Lớp tô đất của Khánh Hòa bỏ 7 thành phần hành chính hoàn toàn phía đông 110°; file ranh gốc giữ nguyên. Lớp đường bờ Trường Sa được vẽ riêng từ OSM. Điểm tham chiếu dùng ký hiệu tròn, bãi cạn dùng ký hiệu rỗng. Khung nét đứt chỉ biểu thị cửa sổ xem, không biểu thị ranh giới biển.

36 gói địa hình có preview 12,8×12,8 km; vùng xây chi tiết hiện 1,28×1,28 km, raster 64×64 ô. Gói tải lười và kiểm SHA-256; không dùng địa hình procedural thay thế khi lỗi tải. Bộ nhớ cache 4 gói/8 MB dữ liệu nguồn; production cache public 4 gói/6 MB và metadata. Save 6 nhúng DEM cùng metadata, giữ save cũ 1–5. Bổ sung lớp quần đảo không thay đổi schema, tiền hay vị trí trong save.

## Tái tạo

Python dependencies trong scripts/geodata/requirements.txt. Bộ dữ liệu này dùng JSONseq 2023; extractor PBF chưa phải pipeline được kiểm chứng cho danh mục nguồn này.

```sh
python scripts/geodata/extract-jsonseq.py --help
python scripts/geodata/prepare-vietnam.py --help
python scripts/geodata/prepare-archipelagos.py /path/to/osm-filtered
```

Chạy bước quần đảo sau bước địa hình để cập nhật checksum manifest. Không đưa dữ liệu nguồn hàng trăm MB vào bundle frontend.

## Chưa hoàn thành

DEM/đường bờ đầy đủ Hoàng Sa, DEM đảo Trường Sa; full world xây 12,8 km, mua đất và streaming chunk 200 m; topology pháp lý hiện hành; land cover/thủy văn/triều/độ mặn. Đây là chặng A của Lệnh 20 / Phụ lục H, không phải hoàn tất toàn đặc tả.
