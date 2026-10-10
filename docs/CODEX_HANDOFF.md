Cập nhật10/10: NEW_CITY_CASH_BC=10.000.000 BC (10tỷ₫) cho thành phố/tài khoản mới, không cộng vào save cũ. Themegame mới ở src/ui/city-theme.css: paper/forest, scene giảm màu vàng. Toàn149tests/build đạt; ảnhinterface-forest-paper-20261010.png, đang kiểmproduction.

Production 10/10/2026: code `6dde065` đã push main; Vercel `7HDdYVRnJXUBUZnuqALqvUYXYvDY` Ready/domain buildcity26.vercel.app đã kiểm thật. Bản chốt giới hạn chung 50 người+xe, low/mobile30; benchmark 5.000 dân xác nhận50/30. Thị trường production đọc Supabase thành công; migrations finance/CAS đã áp dụng, không cần thêm key.

# Bàn giao Build City 26

## Mục tiêu đang tiếp tục

Triển khai toàn đặc tả root Lệnh 0–28 và A–I. Mục tiêu lớn chưa đạt; xem feature-coverage, không coi 24 catalog items là toàn dịch vụ. Yêu cầu mới hơn 09/10: tài khoản/thành phố mới có 100 triệu đồng game; giữ save cũ.

## 10/10 — Chặng mới

Đã triển khai 13 blueprint 3D có giá/thi công/owner thật, escrow nâng cấp có điều kiện/capacity/maintenance, mưa/nắng tác động simulation; save 6 additive, legacy được giữ. Cổ phiếu/xổ số 5 giờ thực dùng Supabase RPC và private tables, tiền game chính city/ledger, retry/CAS/durable requests. Hai migration 202610100001 và 202610100002 đã chạy live. Lỗi CAS gây infinite retry của PostgREST đã đổi PT409; live finance/account/RLS hai user và hai device đều PASS. Cả renderer giới hạn chung người + xe tối đa 50, low/mobile30 theo yêu cầu cuối; không cắt dân số hay path khỏi save. Xem implementation-status mới nhất và JSON đo hiệu năng. Trần snapshot 2 MB vẫn là blocker save thành phố đông dân, phải làm compact snapshots/shared path thật, không bỏ entities.

## Bản vừa kiểm

npm ci; npm test 110/110; npm run build. UI desktop thực khởi đầu 100 triệu, xây kit còn 26 triệu, save/reload giữ tiền. Tất cả công trình mới dùng service family của nền mô phỏng có sẵn, chưa staff/dispatch. Không đổi schema/DB, không reset account hoặc save đang có.

GitHub supportstudy26-hue/buildcity26 đã có quyền push qua deploy key chỉ repo. Không đưa private key hay env secret lên Git. Vercel đã có project buildcity26, domain https://buildcity26.vercel.app/, Supabase redirect đúng domain. Bản vốn/giao diện697e2ee đã Vercel Ready, domain chính hiện trang chủ/register mới; chặng 13 kiến trúc b59929d đã Vercel Ready và QA domain chính, 3D/Canvas giữ city legacy.

## Điểm cần xử lý tiếp theo

1. Production account QA: `QA_BASE_URL=https://buildcity26.vercel.app QA_ALLOW_CREATE=1 npm run test:accounts:live`. Script tạo hai user QA riêng, password/code/JWT ở RAM; chỉ public key. Các bước trước stale CAS đã đạt, mã lỗi stale cần chẩn đoán; mạng/Auth 503 cũng đã gặp. Không nâng quyền để bypass RLS, không nhận client money làm BXH. Recovery/rotate/revocation phải chạy xong mới đánh dấu đạt.
2. Worker và graph/chunk: core hiện 64×64 ô 20m, khu xây thật 1,28km. Preview địa lý 12,8km không phải world xây toàn bộ. Thiết kế sparse chunks 200m, parcel ownership, path graph + snapshot migration giữ IDs/clock/ledger trước mở map lớn. Không phóng kích thước ô để giả world lớn.
3. Dịch vụ I3/I4: staff/resource/queue/dispatch và trip hoàn thành rồi mới cộng hiệu quả; dữ liệu nguồn/cost BOQ, thiếu điện/nước/đường/kinh phí giảm actualcapacity. Giữ save legacy alias/giá nguyên gốc.
4. 300 nhiệm vụ E và nâng cấp F: cửa sổ 15 phút, tutorial khởi đầu nhanh, tránh ngày chờ hiện hữu; XP/receipt không thưởng lại, công trình có conditions/tiers/thi công. Account score phải server replay/validation.
5. Theo từng nhóm coverage: toàn 20 I/32 S/mẫu I2/bảng I4, scenarios T1…T8, mobile và benchmark thật. Không tạo nút giả cho hệ thống chưa có.

## Giới hạn hiện hữu

Nguồn địa lý có caveat OSM2023 và DEM2017; quần đảo có điểm/đường bờ chưa đầy đủ, chưa DEM xây. 14 nhiệm vụ casual, cấp có công thức/100 triệu bonus nhưng chưa 300 mission và account verified. JSONB snapshot max2MB. Mobile mới chưa kiểm; benchmark kiến trúc 1.848 cư dân median58,5FPS nhưng p9549,4ms và long tasks chưa ổn định; chưa đạt 60FPS duy trì. Fixture snapshot2,48MB vượt trần cloud2MB. Không mô tả toàn game như thành phố thật đã hoàn thành.
