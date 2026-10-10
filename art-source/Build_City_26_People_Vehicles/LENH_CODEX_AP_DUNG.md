# Build City 26 — lệnh tích hợp cư dân và phương tiện

Giải nén gói này vào thư mục tạm trong repo Build City 26 đang phát triển. Đưa toàn bộ khối lệnh dưới đây cho Codex. Đây là gói hình tham chiếu và thumbnail, không phải bản game đã tích hợp. Tên đường dẫn trong lệnh là đề xuất; điều chỉnh theo cấu trúc repo hiện hữu.

## Lệnh chính — dán nguyên phần này vào Codex

```text
Tiếp tục đúng repo Build City 26 hiện tại. Đọc AGENTS.md, package.json, engine, cơ chế save, catalogue công trình, navigation, UI, tests và README trước khi sửa. Tích hợp bộ Build_City_26_People_Vehicles với 144 mẫu trong 16 atlas PNG. Giữ cùng phong cách bộ công trình đã có. Hoàn thành mã chạy được, thay thế người/xe placeholder trong bản đồ thực tế và kiểm thử; không dừng ở bản kế hoạch hoặc chỉ đổi ảnh trong menu.

1. KHẢO SÁT VÀ IMPORT
- Đọc manifest.json, DANH_MUC_CU_DAN_PHUONG_TIEN.csv, ANIMATION_PROFILES.json và README.md của gói.
- Đưa PNG cần dùng và manifest vào public/assets/build-city-26-mobility/ hoặc đường dẫn chuẩn của repo. Ánh xạ art ID ổn định tới citizen/vehicle catalogue, route type và chức năng dịch vụ hiện hữu. Lưu ID, không lưu đường dẫn tuyệt đối hoặc texture bytes trong Supabase.
- Atlas kích thước khác nhau; dùng frame từng mẫu, không chia cứng 3x3 bằng tọa độ đều. Giữ alpha khi decode/upload GPU. Không biến nền RGB ẩn của pixel alpha=0 thành nền màu; không loại alpha khi nén.
- integration/atlas-loader.ts là helper cho thumbnail Canvas, không phải renderer thế giới 3D. Giữ cảnh báo ảnh một góc nhìn và trạng thái lỗi tải.
- Không gọi API AI; không cần AI key cho gói đã tạo. Không tải tài sản từ Cities: Skylines, hãng xe/hãng bay hay trò chơi khác. Bỏ chữ, logo, huy hiệu trang trí khi dựng model; dùng màu và hình dạng tự thiết kế.

2. ĐỒ HỌA THẾ GIỚI
- Gói là ảnh tĩnh thể hiện phong cách 3D; không phải GLB/FBX, rig hoặc animation. Nếu game có camera xoay tự do, phải dựng mesh nguyên bản hoặc tạo GLB mới theo hình tham chiếu và kiểm tra. Không đặt một ảnh billboard duy nhất rồi báo đã có 3D 360 độ.
- Người có đầu, tóc, thân, cánh tay, bàn tay, chân, giày và quần áo riêng; silhouette phân biệt trẻ em, thiếu niên, người lớn, người cao tuổi. Dùng skeleton humanoid dùng chung với biến thể chiều cao/tỷ lệ phù hợp; không chỉ phóng to một trẻ em thành người lớn. Người dùng xe lăn có model xe và chuyển động bánh riêng.
- Ô tô có thân cong, kính, bánh, đèn, gương; xe máy có tay lái, bánh, yên và người lái đội mũ. Không thay tất cả bằng hộp chữ nhật.
- Bus nối khớp, tram, đầu máy/toa tàu phải có module/pivot và khoảng cách thật, cửa nằm đúng vị trí. Một toa trong ảnh không đại diện cho toàn bộ đoàn tàu.
- Tàu thủy có phần thân trên và dưới mực nước, boong, cabin, cột; máy bay có cánh, động cơ, càng đáp và bề mặt điều khiển; trực thăng có thân, rotor chính/đuôi hoặc hai rotor tandem.
- Dựng trong đơn vị mét theo gameplay catalogue. Kích thước pixel của ảnh dùng để hiển thị catalogue, không là tỷ lệ vật lý giữa xe và người. Chiều dài toàn đoàn tàu, sải cánh, bán kính rotor phải ảnh hưởng clearance.
- Neo humanoid tại mặt đất dưới chân; xe tại tâm footprint mặt đất; tàu tại mực nước; aircraft tại root transform có chiều cao; cabin cáp treo ở điểm treo trên dây. Tách shadow khỏi mesh chuyển động.

3. CƯ DÂN VÀ HÀNH VI
- Dữ liệu mỗi người có ID ổn định, householdId, tuổi/nhóm tuổi, nhà, việc làm/trường học, nhu cầu, lịch ngày, tiền/thu nhập liên quan core, phương thức di chuyển, trạng thái và tripId.
- Chọn mục đích đi lại từ mô phỏng: nhà -> trường/việc -> mua sắm/dịch vụ/vui chơi -> nhà. Lịch có biến thiên có seed, tránh mọi người rời nhà cùng một giây. Người thất nghiệp, khách du lịch, người cao tuổi có lịch phù hợp.
- Đi đúng mạng lối đi, vỉa hè, cầu vượt, điểm qua đường; chờ đèn, tránh chướng ngại vật, có đường tiếp cận phù hợp xe lăn. Chọn phương thức dựa trên khoảng cách, khả năng tiếp cận, chi phí và thời gian.
- Walk/idle/run/wait/cross/board/alight/sit/work thật theo state. Độ dài bước theo vận tốc để không trượt chân. Không chạy animation đi bộ khi agent đang đứng.
- Chuyển người vào xe chỉ sau khi tới đúng điểm lên; số người lên không vượt chỗ, số xuống trả về mạng đi bộ. Người đang trên xe không vẫn xuất hiện đi bộ bên đường.
- Một mẫu ngoại hình dùng cho nhiều cư dân nhưng population từ core, không đếm mesh render để tính dân số. Không spawn người trang trí rồi báo đã mô phỏng dân cư.
- Nhân viên dịch vụ có ca, căn cứ, nhiệm vụ và liên kết xe/địa điểm khi core hỗ trợ. Người giao hàng giao parcel có ID; không tự hoàn thành giao hàng vì animation đã xong.

4. XE ĐƯỜNG BỘ VÀ XE HAI BÁNH
- Dùng lane graph có làn, chiều, tốc độ, giao lộ, đèn, đường một chiều, hạn chế xe nặng, điểm quay và chỗ đỗ. Đi bên phải theo bản đồ Việt Nam của game.
- Planner chọn route hợp lệ; local controller giữ khoảng cách, giảm tốc ở cua, chờ đèn và nhường tại giao lộ. Chuyển làn có điều kiện và khoảng trống, không xuyên xe khác.
- Tốc độ m/s từ sim clock. Bánh quay từ khoảng đường đi chia bán kính bánh; bánh trước quay theo góc lái, thân xoay theo hướng làn. Bật đèn phanh, xi nhan, đèn ban đêm theo state.
- Ô tô cá nhân: người lên ở cửa/chỗ đỗ rồi đi, đến đỗ và trả người về đi bộ. Taxi: dispatch -> đến đón -> chờ lên -> chở -> trả -> trống; tính phí theo core.
- Bicycle: người đạp, crank/bánh quay; motorcycle: người ngồi đúng yên, tay đúng tay lái, bánh quay và nghiêng hợp lý khi cua. Xe rickshaw phải có người đạp và ghế hành khách.
- Delivery: nhận hàng tại depot/shop, đỗ đúng chỗ giao, làm việc/trao hàng rồi cập nhật kho và order. Xe tải có tải trọng, loại hàng, chi phí hoạt động và hạn chế đường.
- Các mẫu không tự cung cấp simulation; nối vehicle ID vào systems đang có và triển khai phần còn thiếu thật.

5. DỊCH VỤ VÀ MÁY CÔNG TRÌNH
- Cứu thương đi tới người bệnh, có thời gian chăm sóc và đưa về cơ sở còn năng lực; xe chữa cháy có thời gian triển khai, chữa cháy, nguồn nước và quay về.
- Cảnh sát/cứu hộ/xe chỉ huy có dispatch và kết quả nhiệm vụ; ưu tiên khẩn cấp có quy tắc giao thông, không teleport.
- Xe rác đi theo tuyến và gom từng điểm, đủ tải phải về cơ sở; recycler có phân loại tương ứng. Sweeper quay chổi khi làm việc; xe tưới phun ở thời điểm làm việc; hút cống có state dừng triển khai vòi.
- Hearse có công việc vận chuyển riêng, hình ảnh và hành vi tôn trọng, không hiệu ứng gây sốc. Xe chăm công viên chạy trong mạng đường dịch vụ hợp lệ.
- Máy xúc xoay cabin/khớp cần/gầu; loader nâng gầu; bulldozer có xích; roller quay trống; mixer quay bồn; dump nâng thùng khi đổ; crane có outriggers/boom/cáp và vùng an toàn; forklift nâng càng.
- Máy chỉ hoạt động khi construction job được giao. Tiến độ/chi phí/lượng vật liệu từ core; animation phản ánh state, không thay thế kiểm tra công trình có đủ điều kiện.
- Tractor/combine có vùng canh tác và mùa vụ theo game; máy gặt hoạt động trong ruộng, không chạy xuyên nhà. Snowplow là tùy chọn biome tuyết; chỉ bật nếu map/thời tiết thực sự có tuyết, không tự thêm tuyết vào toàn Việt Nam.

6. VẬN TẢI CÔNG CỘNG VÀ ĐƯỜNG SẮT
- Route có danh sách stop, lịch/headway, đội xe, depot, giá vé, operating cost, capacity và độ tin cậy. Biểu đồ/tần suất lấy số liệu thật.
- Bus dừng vào điểm hợp lệ, mở cửa, lên/xuống theo hàng chờ và dwell time; đầy thì người còn lại chờ chuyến sau. Khớp bus/tram quay theo đường, không kéo giãn texture.
- Tàu hỏa theo rail graph, track gauge của game, điện hóa phù hợp, block occupancy và signal; không có hai đoàn cùng chiếm block. Bogie theo tiếp tuyến tại vị trí riêng, các toa bám theo khoảng cách dọc đường ray.
- Metro ngầm có tunnel và layer riêng; tram tương tác giao lộ. Không vẽ tàu ngầm xuyên mặt đất.
- Freight train đặt chuyến từ nhu cầu hàng và terminal thật, xếp/dỡ có thời gian và năng lực. Capacity toàn đoàn bằng tổng toa; cập nhật hàng theo transfer transaction.
- Cabin cáp treo bám cable spline, tiến theo tuyến, treo thẳng theo trọng lực, dừng/chậm tại station, lên/xuống đúng điểm và số chỗ. Không coi đây là xe chạy trên đường.

7. THUYỀN, TÀU BIỂN
- Water graph có độ sâu, bề rộng, vùng cấm, cầu/clearance, luồng ra ngoài map và bến. Tàu có draft và bán kính quay tương ứng, không đi qua đất hoặc nước nông.
- State: ở bến -> boarding/loading -> rời bến -> chạy -> chờ chỗ -> cập bến -> unloading -> kết thúc/tiếp chuyến.
- Rudder/propeller hoặc outboard có pivot; wake chỉ sinh khi chuyển động trên nước và tắt khi đứng. Dao động nhỏ theo nước, không xuyên qua boong cầu.
- Passenger ferry/waterbus/cruise chở người thực từ trip/stop. Vehicle ferry mang danh sách xe thật; xe đã lên không vẫn chạy trên đường cũ. Tàu hàng/sà lan chuyển hàng đúng cảng/kho.
- Fishing có vùng khai thác, sức chứa, thời gian đánh bắt và unload. Tug/dredger/research/rescue có job chuyên biệt. Không spawn các tàu ngoài biển chỉ để tăng giả số xuất nhập khẩu.

8. MÁY BAY, TRỰC THĂNG, DRONE
- Airport có gate, taxiway, runway, stand occupancy, terminal/transfer và route ngoài map. Chuyến bay có lịch, máy bay được gán, hành khách/hàng, fuel/maintenance và chi phí.
- Airplane: gate/loading -> pushback khi phù hợp -> taxi -> chờ runway -> takeoff roll -> climb -> cruise/đi ngoài map -> approach -> landing -> taxi -> gate/unload.
- Runway conflict phải khóa hợp lệ cả cất và hạ; clearance đủ sải cánh. Pitch/bank chuyển mượt, flap/gear và propeller tương ứng state; đèn landing/beacon theo state.
- Chuyến outside map có trạng thái transit có thời gian, điểm ingress/egress rõ; không phải hoàn thành vận chuyển ngay khi biến mất khỏi màn hình. Không yêu cầu vẽ toàn thế giới.
- Seaplane dùng water runway phù hợp; firefighting aircraft/trực thăng có job và tài nguyên thật.
- Helicopter: startup rotor -> lift -> cruise -> hover/tiếp cận -> landing -> rotor stop. Rotor chính/đuôi/tandem độc lập đúng kiểu model, dùng blur rẻ khi quay nhanh. Có bán kính an toàn.
- Drone có pin, base, task, no-fly/obstacle clearance của game, bay/hover/hạ cánh; survey tạo kết quả job thật, delivery chuyển parcel thật. Drone không dùng đường bộ.
- Không cần mô phỏng hàng không chuyên nghiệp; cần chuyển động và logic nhất quán với gameplay, không xuyên nhà, không bay là là trên đường như ô tô.

9. THỜI GIAN, LƯU VÀ HIỆU NĂNG WEB
- Giữ mặc định 1 giây thực = 5 giây trong game, dùng một simulation clock chung cho lịch, tốc độ, chi phí, job và chuyến đi. Pause dừng mô phỏng; render UI vẫn hoạt động. Giới hạn frame delta khi tab bị treo; tránh nhân 5 hai lần.
- Fixed-step core, nội suy render, tách route planner khỏi mỗi frame; queue/caching/invalidate graph hợp lý. Có thể worker nếu engine hiện hữu phù hợp.
- Dùng instancing cho mẫu lặp, LOD/culling theo màn hình/chunk, pooling, shared materials, texture tải theo nhóm. Không tạo toàn bộ 144 model và skeleton cho mỗi cư dân. Population lớn vẫn giữ dữ liệu core nhưng giới hạn phần visual có chính sách; không đổi số dân vì giới hạn render.
- Đề xuất ngân sách mesh ban đầu (cần đo và điều chỉnh): humanoid LOD0 ~1800 triangles/LOD1 ~700; ô tô ~2500/~900; toa rail ~3000/~1200; máy bay/tàu lớn ~6000/~2000. Tránh shadow động/transparent overdraw cho mọi agent.
- Phân lớp nhân vật xa: marker/silhouette hoặc rất ít bone; gần: rig được cập nhật theo budget. Không spawn/despawn hiện rõ quanh camera; chặn tối đa công việc render mỗi frame.
- Báo median/P95 frame time, draw calls, texture/GPU memory nếu công cụ hỗ trợ, JS heap và số agent active/visible; ghi máy/browser/scenario thật. Mục tiêu 30 FPS trên cấu hình trung bình, 60 trên desktop phù hợp; không khẳng định "không lag" nếu chưa đo.
- Save citizen ID, route/job/trip, occupancy, inventory, timestamp và PRNG seed có migration/version. Load khôi phục không double passenger/double cargo/double charge; tránh ghi Supabase mỗi frame.
- Giữ đăng ký 3 ô tên thành phố/tài khoản/mật khẩu, đăng nhập 2 ô tài khoản/mật khẩu, auth, save và BXH thật; không thêm ô tùy tiện để làm bản demo này.
- Không lộ service_role hoặc bí mật trong frontend. Nếu phần cần config Supabase thực chưa có, liệt kê đúng biến thiếu và để trạng thái thiếu cấu hình rõ, không giả thành đăng nhập thành công.

10. UI VÀ KIỂM THỬ TRƯỚC KHI BÁO HOÀN THÀNH
- Catalogue có ảnh đúng mẫu và tên tiếng Việt; inspector hiện route, điểm đến, status, người/hàng, chi phí/bảo trì tương ứng agent thật. Không có card lớn che bản đồ. Thumbnail load lỗi có fallback có nhãn; fallback không được coi là mesh hoàn thành.
- Kiểm tra 144 asset IDs unique, 16 atlas tải được, frame hợp lệ và alpha đúng trên nền sáng/tối; mapping registry không thiếu mục. Không hardcode một ảnh cho tất cả xe.
- Scenario người đi học/đi làm về nhà; chờ đèn; đổi bus; bus đầy; xe lăn tiếp cận stop; taxi trả khách; xe tải giao hàng; garbage về depot đầy; ambulance/fire nhiệm vụ; máy xúc theo tiến độ.
- Scenario đoàn tàu vào cua + block bị chiếm; phà chở người/xe; tàu lớn bị cấm nước nông; máy bay chờ runway bận rồi hạ/cất; helicopter landing; drone hết pin; cable-car lên/xuống.
- Save/reload lúc người đang trên xe và tàu đang unload; pause/resume; 60 giây thật = 300 giây game ở tốc độ mặc định với sai số bước mô phỏng hợp lý; đổi camera; zoom gần/xa; CPU tải cao.
- Chạy các lệnh build/typecheck/lint/test phù hợp repo. Kiểm tra screenshot bản đồ có người, xe và công trình thật trong scene, không chỉ ảnh catalogue. Ghi rõ phần animation/mesh/service nào xong hoặc còn thiếu; không tuyên bố đã xong vì có PNG.
- Tối ưu theo số đo thật, giữ hành vi có nghĩa. Không phá các chức năng cũ để đạt FPS. Không làm website demo khác thay cho game hiện tại.

Thực hiện hết phần có thể triển khai trong repo, sửa lỗi và bàn giao thay đổi review được cùng kết quả kiểm tra. Nêu config/asset hoặc credential thật còn thiếu; không bịa deployment hoặc kết quả test. Làm việc trực tiếp trên game hiện có.
```

## Nếu Codex chỉ thay thumbnail

```text
Các PNG đã có nhưng người và xe trong map vẫn là placeholder. Hãy tiếp tục phần mesh, rig/pivot, route/controller và nối trạng thái core của lệnh chính. Kiểm tra trực tiếp scene khi zoom gần, camera xoay, dừng/chạy, lên/xuống và save/reload. Không báo hoàn thành chỉ vì menu hiển thị đủ ảnh.
```

## Nếu cần kiểm tra phần đã làm

```text
Đối chiếu 10 phần của LENH_CODEX_AP_DUNG.md với code hiện tại. Xuất bảng từng hệ thống: art ID -> registry -> mesh/rig -> controller -> simulation data -> save -> scenario đã kiểm tra. Sửa thiếu mapping, animation giả, teleport, clipping, double passenger/cargo và lỗi scale trước khi báo xong. Không ghi "pass" nếu chưa chạy hoặc chưa có bằng chứng.
```
