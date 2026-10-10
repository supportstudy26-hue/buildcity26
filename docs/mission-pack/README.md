# Build City 26 — 300 nhiệm vụ cụ thể, đủ cấp 1–100

**Đã viết 300 nhiệm vụ: ba nhiệm vụ cho mỗi nhóm cấp từ 1 tới 100.** Mỗi nhiệm vụ có tên riêng, mục tiêu cụ thể, điều kiện kiểm tra, EXP, tiền thưởng, điều kiện mở và ID ổn định.

Bộ trước mới có khung theo nhóm cấp, chưa phải danh mục nhiệm vụ đầy đủ. Gói này bổ sung danh mục thực, kèm kiểm tra tổng EXP và logic tham chiếu. Chưa tích hợp hoặc thử cân bằng trong repository game của bạn.

## Dùng ngay

1. Giải nén thư mục `Build_City_26_300_Missions` vào dự án.
2. Mở **DANH_SACH_300_NHIEM_VU.md** để đọc đủ 300 nhiệm vụ bằng tiếng Việt. Mỗi nhiệm vụ có mục tiêu và phần thưởng.
3. Nếu muốn xem dạng bảng, mở **data/missions-300.csv** bằng Excel/Numbers; file UTF-8 có BOM.
4. Đưa **LENH_CODEX_AP_DUNG.md** cho Codex đang mở repository game. Codex cần nối metric/handlers vào mô phỏng thật, không chỉ hiển thị danh mục.

## Dữ liệu và số lượng

| File | Nội dung |
|---|---|
| data/missions-300.json | 300 nhiệm vụ có điều kiện all/any, phần thưởng, dependency, hold và baseline |
| data/levels-1-100.json | 100 cấp, ngưỡng EXP tích lũy và EXP tới cấp sau |
| data/unlocks.json | 54 loại công trình và các tier/tuyến cần mở không muộn hơn nhiệm vụ |
| data/metric-contract.json | 54 metric chuẩn và tên loại công trình |
| data/missions-300.csv | Bảng nhiệm vụ dễ đọc/import |
| docs/QUY_TAC_TICH_HOP.md | Quy tắc thời gian, độ hợp lệ, lưu, nhận thưởng, địa hình và migration |
| docs/QA_REPORT.json | Kiểm tra cấu trúc và logic tham chiếu, cùng giới hạn thực tế |
| source/build_missions.py | Nguồn 100 nhóm nhiệm vụ được viết cụ thể, mỗi nhóm ba nhiệm vụ |
| source/mission-reference.mjs | Bộ hàm tham chiếu; không phải backend xác thực production |
| source/validate.mjs | Kiểm tra catalogue, curve EXP và logic tham chiếu |

## EXP đã tính đủ

`EXP tới cấp tiếp theo tại cấp L = 200 + 80 × (L−1) + 12 × (L−1)²`, áp dụng L=1…99.

Mỗi nhóm cấp có ba phần thưởng EXP theo tỷ trọng khoảng 30% / 30% / 40%, làm tròn xuống hai phần đầu và phần cuối nhận phần còn lại. **Tổng mỗi nhóm đúng bằng EXP cần tới cấp tiếp theo.**

- Cấp 1 cần 200 EXP: ba nhiệm vụ thưởng 60 + 60 + 80.
- Tổng cần để đạt cấp 100: **4.230.468 EXP**.
- Tổng nhiệm vụ nhóm cấp 1–99: **4.230.468 EXP**, đủ lên cấp 100 từ EXP=0 nếu hoàn tất và nhận thưởng tất cả.
- Hoàn thành 297 nhiệm vụ đầu sẽ đạt cấp 100 theo curve này.
- Nhiệm vụ 298–300 ở cấp 100 là phần kết chiến dịch. Vẫn có EXP, cộng vào lifetime XP, không sinh cấp 101.
- Lifetime XP nếu làm đủ cả 300 nhiệm vụ từ đầu: **4.356.200**.

Các số này đã được kiểm tra bằng script; **không có nghĩa giá xây, tốc độ dân tới ở hoặc thời gian chơi đã được playtest** trong bản game thật.

## Không ép thành phố chọn biển

Các nhóm cần cảng, phà hoặc cửa ngõ có lựa chọn tương đương cho đất liền: cảng biển/cảng cạn; phà/bus liên vùng; sân bay/ga tàu liên vùng; bãi đáp/cứu hỏa nâng cấp. Phần thưởng bằng nhau, chỉ cần hoàn thành một nhánh hợp lệ.

Nhiệm vụ nâng cấp cũng chấp nhận công trình đang hoạt động ở tier mục tiêu trở lên để người có thành phố cũ không bị kẹt vì đã nâng hết nhà. Phúc lợi có nhánh khảo sát nhu cầu thật nếu không có hộ cần hỗ trợ; không ép người chơi tạo nghèo đói.

## Phạm vi và cân bằng

Các tiền thưởng là đơn vị tiền game, chưa hiệu chuẩn theo giá công trình hiện tại, không phải tiền thật hoặc báo giá Việt Nam. Tất cả giá trị được ghi cụ thể; Codex có thể áp dụng một moneyMultiplier chung sau khi đo, ghi migration/version và báo lý do. Không đổi EXP tùy ý làm thiếu đường lên cấp 100.

Catalogue là chiến dịch đô thị thông thường, có mốc cuối 60.000 cư dân mô phỏng. Đây không phải yêu cầu render 60.000 mesh người cùng lúc. Kịch bản đảo rất nhỏ cần một profile nhiệm vụ riêng phù hợp diện tích đất nổi; không nén công trình hoặc mở xây trên rạn để ép đạt dân số.

Gói chưa sửa lỗi bản lưu lớn trong repo. Lệnh Codex có yêu cầu xử lý giới hạn 2 MiB đã thấy trong ảnh, lưu progress gọn và giữ ID; việc đó cần triển khai và kiểm tra trong game.

## Tái dựng và kiểm tra

Python 3 và Node.js, không cần dependency ngoài:

```bash
python3 source/build_missions.py
node source/validate.mjs
```

Không cần AI API hoặc key để đọc/sinh catalogue. Việc nối Supabase sử dụng cấu hình thật của repository hiện có.
