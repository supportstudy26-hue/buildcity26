# Hợp đồng tích hợp nhiệm vụ

## 1. ID, cấp và dependency

- `bc26-main-001-a` tới `bc26-main-100-c`, không dùng vị trí array làm ID.
- Mỗi nhóm cấp có A/B song song. C cần A và B **đã nhận thưởng**. Nhóm tiếp theo cần C nhóm trước đã nhận thưởng.
- `minCityLevel` không thay cho dependency. Người đã đạt cấp cao vẫn phải có trạng thái chiến dịch hợp lệ; không tự phát thưởng mọi nhiệm vụ vì level=100.
- Khởi đầu một nhóm khi dependency và cấp thỏa mãn. Lưu baseline của cả nhóm vào `bc26-stage-NNN` ngay lúc mở; A/B/C dùng chung baseline.
- Không mở baseline lại khi đổi tab, load save hoặc mở panel. Baseline và progress là một phần của state được lưu.
- Cấp 100 là cấp tối đa. EXP ở ba nhiệm vụ cuối chỉ tăng lifetimeXp; progressionXp tối đa 4.230.468.
- Nếu game có EXP ngoài chiến dịch, nó có thể giúp đạt cấp sớm; không bỏ dependency hoặc nhận thay phần thưởng chiến dịch.

## 2. Ngữ nghĩa điều kiện

`all`: mọi nhánh phải đúng. `any`: ít nhất một nhánh đúng. Không cho all/any rỗng tự thành true.

Metric không tồn tại, unsupported, NaN, stale hoặc không xác minh được: **false/đang thiếu dữ liệu**, không thay bằng 0 hoặc một con số giả. Đặc biệt điều kiện `<=` không được tự thành true vì field đang undefined.

- `snapshot`: đo state hiện tại; không đếm lịch sử nhà đã phá.
- `counter_since_stage_activation`: counter tích lũy hiện tại trừ baseline lưu khi mở nhóm. Không nhận công việc trước khi mở nhóm, không reset counter làm âm delta, không đếm event ID trùng.
- `window`: cửa sổ trượt tối đa 600 giây game, tối thiểu 5 mẫu hợp lệ. Thu thập theo simulation ticks với khoảng lấy mẫu nhất quán. Panel mở/đóng không ảnh hưởng dữ liệu.
- `holdGameSeconds`: tất cả điều kiện giữ đồng thời liên tục, đo bằng simulation clock. Điều kiện sai trước khi đủ hold thì reset hold về 0.
- Pause không tăng hold. Reload phải khôi phục hold từ state hợp lệ, không dùng thời gian đóng tab làm thời gian đã duy trì điều kiện.
- Khi điều kiện đã đạt đủ, tạo bằng chứng hoàn thành và latch earned. Bằng chứng phải có stage, metric/source revision và simulation tick phù hợp; không cho client tự gửi earned=true để nhận tiền.

1 giây thực = 5 giây game ở tốc độ mặc định. Giữ 1.200 giây game là 240 giây thực, không phải 1.200 giây ngoài đời.

## 3. Không đánh tráo nội dung metric

- `completed_buildings`: đã xây xong, chưa yêu cầu vận hành. Dùng ở bước nền để tránh vòng lặp nhà → dân → điện/nước → nhân lực.
- `active_buildings`: xây xong, không bị phá, đúng kind/tier, đủ điều kiện thực tế và có công suất; nhà/dịch vụ đóng cửa không tính là đang hoạt động.
- `upgrades_completed`: nâng cấp thực sau baseline; nhánh dự phòng chấp nhận công trình đang hoạt động đã ở tier đủ cao. Không đếm bấm nút nhưng thiếu tiền.
- `population`: cư dân cư trú thật, không tính du khách hoặc số spawn trang trí.
- `passenger_trips`: chuyến hoàn thành có người thật, đúng nguồn/đích; `purpose=work` là mục đích đi làm, không phải một phương thức tên work.
- `mode=public_transit`: tổng các phương thức công cộng đang có. `mode=intercity_rail` phải là tàu khách ra vùng ngoài, không đánh tráo bằng tàu hàng.
- `transit_transfer_trips`: một chuyến cư dân có chuyển ít nhất hai tuyến/phương thức công cộng và hoàn thành; không cộng từng đoạn thành nhiều chuyến.
- `delivered_units`: bên nhận chấp nhận hàng và cập nhật tồn kho; không đếm xe chỉ đi ngang kho. `goods=any` là tổng đúng một lần, không cộng lặp theo từng tag.
- `via=trade_gateway`: qua cảng biển/cảng cạn hoạt động. `purpose=intercity_trade`: giao thương ra/vào vùng ngoài, có đối tác/đích và giao nhận thật.
- `visitors_served`: người thật sử dụng cơ sở/điểm đến, có capacity và cooldown; không tăng theo frame hoặc hover.
- `verified_save_count`: backend xác nhận revision của đúng chủ thành phố. Bản lưu local đơn thuần không tính. Save chứa tối thiểu revision và trạng thái nhiệm vụ gọn để tránh phụ thuộc vòng lặp dung lượng.
- `operating_profit_per_game_minute`: thu vận hành trừ chi vận hành; **không tính thưởng nhiệm vụ, khoản vay, tiền bán/phá công trình hoặc tiền admin**.
- `debt`: dư nợ không âm. Giá trị nợ âm là dữ liệu không hợp lệ, không dùng để nhận thưởng.
- `max_air_pollution_pct`, `max_noise_pct`: chỉ số chuẩn hóa 0–100 có công thức công bố, đo ở vùng cư trú thực; không dùng toàn bản đồ trống để kéo trung bình xuống.
- `flood_risk_housing_pct`: theo mô hình địa hình/thoát nước đã triển khai, không tự điền 0 khi thiếu DEM hoặc thiếu mô hình nguy cơ.
- `school_access_pct`, `health_access_pct`, `fire_access_pct`, v.v.: xét đường tiếp cận và công suất, không chỉ khoảng cách tròn.
- Các tỷ lệ không có mẫu/nhu cầu thì undefined, không tự cho 100%. Phúc lợi có nhánh riêng khi `eligible_social_households=0`, nhưng vẫn cần khảo sát thực và cơ sở hoạt động ở nhóm trước.
- `social_assessment`: nhân viên dịch vụ khảo sát/đánh giá hộ thật, ghi kết quả, có ngân sách và cooldown; không tạo một event giả để bỏ qua phúc lợi.
- `eldercare`: dịch vụ cho người cao tuổi có nhu cầu, có thể gồm chăm sóc dự phòng hợp lệ. Generator cư dân phải có nhóm tuổi đa dạng; không ép chờ nhiều chục năm game để xuất hiện người cao tuổi đầu tiên.
- `service_inspection`, `fire_inspection`: kiểm tra cơ sở/đường/tải/rủi ro thật, có job và cooldown. Nhiệm vụ không yêu cầu đốt nhà hay tạo tai nạn để có event.
- `education_completion_pct`: chu kỳ đào tạo mô phỏng có thời lượng cấu hình rõ. Có thể dùng kỳ rút gọn cho gameplay, nhưng ghi đó là chu kỳ mô phỏng, không âm thầm đổi đồng hồ 1:5 hoặc yêu cầu chờ một năm ngoài đời.
- `research_completed`: dự án có ngân sách, nhân lực và thời lượng mô phỏng; không hoàn tất bằng nút bấm không tiêu nguồn lực.

## 4. Bootstrap và mở khóa

Các loại công trình/tuyến/tier trong unlocks.json cần khả dụng **trước** khi làm nhiệm vụ yêu cầu chúng. Giá trị là cấp muộn nhất được mở, không cấm mở sớm. Không khóa cảng ở cấp 70 trong khi nhiệm vụ cấp 61 yêu cầu cảng.

Tier mục tiêu kéo theo mọi tier thấp hơn phải có đường nâng cấp. Hai nhánh ANY có cùng EXP và tiền; không bắt hoàn thành cả hai.

Để thành phố trống khởi động, phải có cơ chế xây dựng và vận hành điện/nước cơ bản trước khi cư dân tới: ví dụ đội dịch vụ thuê bên ngoài có chi phí trong giai đoạn đầu. Công trình vẫn phải thực sự có điều kiện vận hành; không cho metric active giả là true. Phải kiểm tra không có vòng lặp cư dân cần điện/nước nhưng nhân viên điện/nước chỉ xuất hiện sau cư dân.

Giá/thu nhập/công suất cần playtest với catalogue thật. Không để toàn bộ thưởng trước nhiệm vụ ít hơn chi phí bắt buộc tới mức không có cách kiếm tiền hợp lệ. Không đổi EXP rời rạc nếu chưa tính lại bảng tổng.

Kịch bản đất liền dùng dry_port/rail/bus trong các nhánh phù hợp. Kịch bản đảo nhỏ cần profile theo diện tích/kịch bản được xác định riêng, giữ ID/version mapping và kiểm tra đủ EXP; không tự đặt dân ảo hoặc mở xây trên reef để đạt 60.000.

## 5. Nhận thưởng và lưu state

- Production phải xác thực chủ thành phố, bản catalogue, prerequisite và bằng chứng đạt mục tiêu ở server.
- Một transaction ghi ledger UNIQUE(city_id, catalogue_id, mission_id), cộng tiền/EXP và cập nhật progress. Retry cùng ID không cộng thêm.
- Prototype in-memory chỉ chứng minh logic cơ bản, không chứng minh chống nhiều tab hoặc client sửa tiền. Test Supabase/RLS thực sau tích hợp.
- Không reset quest khi chuyển preset đồ họa, đổi camera, pause, reconnect hoặc rename city.
- Save giữ catalogueVersion, stage đang mở, claimed IDs/bitset, baseline counters, hold/earned evidence cần thiết và XP. **Không lưu toàn bộ 300 mô tả/condition vào mỗi cityState**, không sao chép mesh/texture/catalogue tĩnh hoặc event log vô hạn.
- Ghi nhận screenshot hiện tại báo bản lưu lớn hơn 2 MiB. Repo phải kiểm tra serializer: loại dữ liệu tĩnh/trùng lặp, lưu state tối thiểu và dùng storage/chunk manifest có owner/revision nếu vẫn vượt giới hạn. Không cắt bớt cư dân hoặc quest để làm save vừa rồi mất tiến trình.
- Khi đổi schema/version, thêm migration rõ, giữ state chưa commit và backup/checkpoint. Không đặt lại thành phố về cấp 1.

## 6. Di chuyển 14 nhiệm vụ cũ

Kiểm tra ID, điều kiện, phần thưởng đã nhận và curve cũ trong repository thật. Tạo bảng oldId → newId chỉ khi nội dung tương đương; không mặc định 14 nhiệm vụ đầu khớp 14 ID mới.

- Trạng thái đã nhận tương đương không được trả thưởng lần hai.
- Nếu nhiệm vụ cũ gộp nhiều mục tiêu mới, xác minh phần đã làm từ dữ liệu save và ghi nguồn migration; không coi toàn bộ nhóm mới đã xong khi thiếu bằng chứng.
- Giữ cấp cũ tối thiểu và quy đổi EXP phần dư theo curve mới có giới hạn, không trừ tiền thưởng đã nhận. Lifetime XP cũ giữ riêng nếu cần đối soát.
- Nếu giữ một curve khác vì compatibility, phải chứng minh tổng EXP và từng bước mở khóa đủ lên cấp 100. Không chỉ sửa missionCount thành 300.
- Snapshot công trình tier cao có thể đáp ứng nhánh dự phòng nâng cấp; counters sau mở nhóm vẫn phải làm thật, không dùng số job trước baseline.

## 7. Giới hạn QA hiện có

Script đã kiểm tra cấu trúc, dependency không vòng, ba nhiệm vụ mỗi nhóm, EXP đủ và logic tham chiếu (missing metrics, nhánh đất liền, hold/pause, duplicate claim trong bộ nhớ).

Chưa kiểm tra game thực có đủ các service/metric; chưa playtest tiền, thời gian, dân số; chưa kiểm tra Supabase transaction, RLS hoặc save lớn. Fixture không phải một thành phố thật. Codex phải thực hiện các kiểm tra tích hợp tương ứng trước khi báo hoàn thành.
