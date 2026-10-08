# BUILD CITY 26 — BỘ LỆNH PHÁT TRIỂN GAME WEB ĐẦY ĐỦ

## Cách dùng

Mở thư mục mã nguồn Build City 26 trong Codex và đưa file này vào cùng workspace. Gửi Lệnh 0 trước, rồi lần lượt Lệnh 1 → 28. Mỗi lệnh phải tạo ra chức năng chạy được và có bằng chứng kiểm tra. Có thể dùng lệnh tiếp tục ở cuối file để chuyển sang chặng kế tiếp. Với dự án đã triển khai một phần, kiểm tra chức năng thật và tiếp tục từ phần còn thiếu, không tạo lại dự án.

**Yêu cầu mới đã chốt:** đăng ký đúng 3 ô **Tên thành phố · Tài khoản · Mật khẩu**, đăng nhập bằng tài khoản/mật khẩu; có **BXH cấp độ** và **BXH tiền**. Các yêu cầu này thay thế hướng đăng ký email và phạm vi không có leaderboard trong bản bàn giao trước.

**Bổ sung ngày 08/10/2026:** tốc độ mặc định **1 giây ngoài đời = 5 giây trong game**; bản đồ chuẩn **12,8 × 12,8 km**, mở đất theo khu; thêm các Lệnh 20–27 về bản đồ lớn, giao thông vùng, ngành sản xuất, công trình xã hội, hạ tầng nâng cao, thiên tai, nhiệm vụ và công cụ sáng tạo. Có **100 bậc nhiệm vụ, mỗi nhiệm vụ nhận EXP**, và **nhà/công trình nâng cấp bằng tiền cùng điều kiện tiện ích**. Giữ yêu cầu trong ảnh: nhiệm vụ theo cấp và thưởng **100 triệu tiền game mỗi cấp tăng thêm**, nhận đúng một lần. Mọi mục dưới đây là yêu cầu triển khai, không phải xác nhận đã xây xong.

Đây là đặc tả mục tiêu phát triển, không phải danh sách chức năng đã hoàn thành. Bản nền hiện tại là Canvas isometric; tài khoản và cloud save đã có mã nhưng cần cấu hình/kiểm chứng Supabase thật. Đồ họa 3D, từng cư dân và mô phỏng giao thông chi tiết là các phần sẽ xây tiếp.

### Quy ước về giá và tính chân thực

- Các mức giá bên dưới là **giá thiết kế cho tiền game BC**, không phải báo giá xây dựng thực tế hay tỷ giá của một đồng tiền ngoài đời. BC không đổi thành tiền thật. Không đặt ký hiệu `$` hoặc `₫` cạnh giá BC.
- Tính chân thực đến từ khối lượng, công suất, tiền công, vật tư, nhiên liệu, lịch hoạt động, dòng tiền và giới hạn dịch vụ. Đơn giá nằm trong cấu hình để hiệu chỉnh bằng mô phỏng.
- Nếu sau này muốn dùng chi phí của một địa phương thật, phải xác định quốc gia, năm giá, loại công trình và nguồn dữ liệu; không tự coi các hệ số trong file là giá thực tế.
- Chất lượng “người dân đi như thật” được xác định bằng: thực thể có ID, hộ gia đình, nhà, công việc/trường; lịch hoạt động; hành trình có đích; đi đúng mạng vỉa hè/đường; tuân thủ tín hiệu; đến nơi mới chuyển trạng thái; tài nguyên và tiền thay đổi theo hành động đã xảy ra.
- Các vận tốc và nhu cầu sử dụng tài nguyên nêu dưới đây là giá trị khởi tạo của mô phỏng, có thể hiệu chỉnh; không trình bày chúng như thống kê dân số hay tiêu chuẩn pháp luật.

## Lệnh 0 — Chỉ dẫn tổng thể và nguyên tắc làm việc

```text
Bạn đang tiếp tục game web Build City 26 từ mã nguồn hiện tại. Đọc README.md, VALIDATION.md, CODEX_NEXT.md và toàn bộ file Build_City_26_Full_Codex_Prompts.md. Chạy npm ci, npm test, npm run build, rồi kiểm tra game trong trình duyệt trước khi sửa.

Mục tiêu: game xây và quản lý thành phố 3D có kinh tế, hạ tầng, từng hộ gia đình, từng người dân, doanh nghiệp và phương tiện hoạt động có nguyên nhân. Website lên GitHub → Vercel; đăng nhập và bản lưu ở Supabase. Giao diện tiếng Việt. Không dùng API AI.

Giữ tên Build City 26 và tạo thiết kế, mesh, texture, âm thanh, bản đồ riêng. Không lấy mã, assets, UI hoặc dữ liệu từ Cities: Skylines. Với tài nguyên bên thứ ba, kiểm tra giấy phép, ghi nguồn và điều kiện sử dụng vào ASSET_LICENSES.md.

Mô phỏng single-player chạy ở trình duyệt, chuyển tác vụ nặng vào Web Worker. Vercel phục vụ website và API tài khoản/BXH; Supabase quản lý Auth và dữ liệu. Không thiết kế một vòng game liên tục nằm trong một request serverless. Có leaderboard cấp độ/tiền theo yêu cầu, chưa thêm multiplayer hoặc thanh toán.

Tạo docs/implementation-status.md để ghi từng chặng, phần đã kiểm chứng, giới hạn và việc tiếp theo. Làm theo Lệnh 1 → 28, mỗi lần hoàn thành một chặng có thể chơi được rồi kiểm tra. Giữ package-lock, cấu hình deploy, bản lưu và Auth đang hoạt động. Khi đổi schema, có migration và kiểm tra bản cũ. Ưu tiên sửa tỷ lệ thời gian và nền bản đồ lớn trước khi thêm hàng loạt công trình. Không thay những phần đã làm tốt bằng một bản demo mới.

Form đăng ký đúng 3 ô: Tên thành phố, Tài khoản, Mật khẩu. Không thêm email, số điện thoại hoặc ô xác nhận mật khẩu vào form này. Đăng nhập đúng 2 ô: Tài khoản, Mật khẩu. Bản cũ dùng email cần migration tương thích, không xóa tài khoản hoặc bản lưu cũ. Leaderboard là dữ liệu trực tuyến có chủ sở hữu, không phải bảng local giả lập.

Chỉ hỏi tôi khi thiếu quyền GitHub/Vercel, cấu hình Supabase hoặc quyết định thực sự chặn công việc. Trong lúc chờ, tiếp tục phần không phụ thuộc. Không ghi secret vào mã, log, bản lưu, prompt hay GitHub. Chỉ dùng publishable/anon key ở frontend.

Mỗi chặng phải có: thay đổi mã nguồn, chức năng tương tác được, kiểm tra phù hợp, một tình huống minh họa và báo cáo ngắn. Nếu còn thiếu thì ghi rõ; không đánh dấu hoàn thành chỉ vì có nút hoặc có model trang trí.
```

## Lệnh 1 — Nền mô phỏng, đồng hồ và bản lưu

```text
Tách phần core hiện tại thành các hệ thống độc lập: clock, world, roads, households, citizens, firms, vehicles, utilities, services, construction, economy, events và save. Hệ thống render đọc snapshot; không tự sửa state kinh tế. UI gửi command được validate vào core.

Dùng fixed timestep và một thứ tự cập nhật rõ ràng. Mọi khoảng cách tính bằng mét, diện tích m², điện kW/kWh, nước m³, tiền BC. Tính năng tăng tốc phải làm tăng đồng hồ mô phỏng cùng với chuyển động, lịch làm, hàng hóa và thu chi; không chỉ tăng ngày lịch trong khi xe đi ở một đồng hồ khác.

Đặt tốc độ mặc định chính xác 1 giây ngoài đời = 5 giây mô phỏng: timeScale = 5, không phải 5 phút hoặc 5 giờ. simulationDelta = elapsedRealSeconds × 5. Hiển thị “1 giây thực = 5 giây game”. Có Pause và chế độ Quan sát 1:1; Resume từ Pause khôi phục tốc độ đang chọn. Normal/ranked mặc định 1:5; tốc độ khác chỉ mở nếu được ghi rõ trong rule set, không tự tăng tốc khi đạt cấp mới.

Xe, người, animation, lịch làm, sự kiện, điện/nước, thi công, lãi vay và thuế đều dùng một đồng hồ mô phỏng. Vận tốc đi bộ 1,3 m/s là mét mỗi giây GAME; ở tỷ lệ 1:5, người đi được khoảng 6,5 m mỗi giây thực trên đường trống. Tách bước physics nhỏ và interpolation để không nhảy vị trí, xuyên người hoặc vượt đèn đỏ khi gộp thời gian. Không giảm vận tốc vật lý để bù tỷ lệ đồng hồ.

Dùng đồng hồ đơn điệu cho elapsed time, không lấy số frame hoặc đồng hồ hệ điều hành làm lịch game. Khi chuyển tab ẩn hoặc đóng game, mặc định pause; khi quay lại không bù nhiều giờ bằng một tick lớn. Nếu máy xử lý chậm, hiển thị trạng thái và cho phép pause để xử lý backlog có giới hạn; không âm thầm bỏ thời gian/sự kiện. Save lưu simulation timestamp và speed setting, reload không cộng thời gian ngoài đời đã đóng ứng dụng.

Ghi docs/time-model.md: 10 giây thực = 50 giây game; 1 phút thực = 5 phút game; 12 phút thực = 1 giờ game; 4 giờ 48 phút thực = 1 ngày game. Với tỷ lệ này, 2 ngày thi công là 9 giờ 36 phút thực; không giấu hệ quả thời gian dài. Dùng lịch thực của mô phỏng cho tháng; không nhảy ngày chỉ để trả lương hay mở khóa. Các chế độ thi công rút gọn được mô tả riêng tại Phụ lục A5, không làm đổi đồng hồ chung.

Kiểm tra đồng hồ bằng injected clock: các cửa sổ 10/60 giây thực lần lượt tăng 50/300 giây game; Pause tăng 0; save/load không nhảy lịch; 30/60/120 FPS cho cùng elapsed time có kết quả tương đương; hành trình 65 m ở 1,3 m/s mất 50 giây game, tương đương 10 giây thực khi không có chờ.

Cho mỗi thực thể một ID ổn định, lưu seed của PRNG. Cùng seed và cùng command sequence phải tái tạo kết quả trong cùng phiên bản mô phỏng, trong mức sai số số học được quy định. Lưu vị trí, trạng thái, hành trình, lịch hẹn và RNG; tải lại không sinh thêm cư dân/xe hoặc trả tiền lần thứ hai.

Thiết kế command queue, domain events và transaction IDs để ngăn double-spend. Lưu stable state, không lưu object renderer, geometry, DOM hoặc toàn bộ cache tìm đường. Graph/cache được xây lại có kiểm soát sau load.

Tạo migration từ schemaVersion 1 của bản nền. Map cũ phải mở được. Mỗi ô cũ mặc định 20 × 20 m; công trình cũ được gán footprint phù hợp. Có thể chuyển số tiền cũ sang BC bằng hệ số 100 trong migration duy nhất, ghi rõ phiên bản đã chuyển và không áp dụng lại lần thứ hai. Cư dân tổng hợp cũ được phân bổ vào các hộ có sức chứa tương ứng mà không đổi tổng dân số ngoài sai số được báo cáo.

Kiểm tra: save/load giữa chuyến đi; save/load giữa xây dựng; hai lần load không tăng tiền hoặc dân số; replay một ngày không mất/nhân đôi thực thể; pause dừng mọi phần của mô phỏng; đổi tốc độ không thay đổi kết quả logic.
```

## Lệnh 2 — Bản đồ và renderer 3D riêng

```text
Nâng renderer sang Three.js theo từng bước, giữ core và bản lưu tách rời. Có bản 3D chạy được trước khi mở rộng cảnh vật. Tạo mesh riêng cho nhà, cửa hàng, nhà xưởng, công trình công cộng, người, xe và cây; không chép thiết kế có nhận diện của game khác.

Yêu cầu mới: tất cả nhóm nhà/công trình và các phần khác của thành phố đều được cải thiện hình thức, đồng thời tối ưu theo Phụ lục G5–G6. Ưu tiên nét đẹp từ hình khối, phối màu, bố cục và ánh sáng đơn giản; không dựa vào texture khổng lồ, nhiều đèn/bóng động hoặc hiệu ứng toàn màn để che mô hình nghèo nàn. Giữ chức năng mô phỏng và đơn vị vật lý; đây không phải yêu cầu chuyển game thành ảnh trang trí.

Bản đồ có địa hình cao thấp, sông/hồ, bờ nước và vùng xây dựng. Dữ liệu địa hình là heightfield với đơn vị mét. Hiển thị độ dốc, cao độ và mặt nước; công trình đặt trên nền hợp lý, đường/cầu có cao độ thật. Không dựng nhà chìm vào đất hoặc xe chạy xuyên địa hình.

Thay giới hạn bản đồ nhỏ bằng world mặc định 12.800 × 12.800 m, diện tích 163,84 km². Đây là diện tích mô phỏng/xây dựng thật, không chỉ zoom camera ra xa. World chia chunk tải theo nhu cầu; khu sở hữu, streaming và culling là ba cơ chế riêng. Chi tiết kích thước, mở đất, minimap, migration và hiệu năng tại Lệnh 20.

Camera orbit/pan/zoom, chọn đối tượng bằng raycast, chế độ góc nhìn từ trên xuống, theo dõi cư dân/xe. Giới hạn camera, hỗ trợ chuột và cảm ứng, tránh UI chặn thao tác bản đồ. Có ánh sáng ngày/đêm, bóng có thể giảm/tắt và chất lượng thấp/vừa/cao.

Dùng instancing cho vật thể lặp, LOD cho nhà/xe/người, nhóm theo vùng, frustum culling và disposal tài nguyên. Cập nhật bounding volume khi biến đổi instance để culling/raycast đúng. Agent ở ngoài camera vẫn tồn tại và tiếp tục hoạt động, chỉ giảm chi tiết vẽ.

Người có hình thể nhìn được, không chỉ là chấm sáng. Ở gần có dáng đi với chân/tay nhịp nhàng; tốc độ animation liên hệ vận tốc để hạn chế trượt chân. Xe có hướng, bánh và đèn phù hợp. Đứng chờ phải dừng bước; lên xe gắn vị trí người với vehicle.

Nếu WebGL không khả dụng, cung cấp thông báo rõ và chế độ 2.5D giữ chức năng cơ bản. Không dùng ảnh tĩnh làm bề mặt chơi.

Kiểm tra: tải bản đồ cũ; xây/xóa đối tượng nhiều lần không tăng bộ nhớ vô hạn; raycast đúng nhà/đường; agent không xuyên nền; chất lượng thấp vẫn thao tác được; chụp và xem thực tế desktop/mobile.
```

## Lệnh 3 — Xây đường, vỉa hè và giao lộ

```text
Thay đường dạng ô thuần bằng graph đường gồm node, segment, lane, lane connector, sidewalk, crossing và building entrance. Cho phép đường thẳng, cong, nối, chia segment, giao lộ chữ T/ngã tư, một chiều, hai chiều, đại lộ, đường đi bộ, cầu và hầm.

Mỗi segment có chiều dài 3D, độ rộng, số làn, hướng, tốc độ thiết kế, độ dốc, loại mặt đường, quyền đi qua và condition. Chiều dài/diện tích dùng để báo giá thật theo config. Node ở hai cao độ khác nhau không tự tạo giao lộ. Cầu cần độ cao vượt mặt nước và trụ; hầm cần portal và khoảng phủ đất phù hợp.

Tạo lane connectors cho rẽ trái, thẳng, rẽ phải theo hình học và quy định. Có làn vào đúng làn ra; không rẽ xuyên dải phân cách. Vỉa hè kết nối với lối vào công trình, điểm chờ qua đường và bến xe. Người đi bộ dùng graph riêng liên thông qua crossing.

Đường mới phải có preview, snapping, kiểm tra bán kính cong/độ dốc/collision. Khóa command trong khi confirm để không trừ tiền hai lần. Kéo đường chưa confirm không trừ tiền. Nâng cấp đường tính khối lượng phần tăng thêm và chi phí tháo dỡ; các lối vào phải cập nhật.

Khi phá đường, vô hiệu hóa đúng graph version, hủy cache liên quan và tìm lại tuyến. Agent đang ở đoạn bị phá chuyển sang trạng thái bị chặn/đợi xử lý hợp lý; không biến mất hoặc nhảy tới đích. Không cần chạy lại mọi tuyến trên toàn bản đồ mỗi frame.

Kiểm tra: hai đường khác cao độ; giao lộ chữ T; cầu qua sông; đường cụt; đường một chiều; phá một nút giữa tuyến; tạo crossing rồi theo dõi một người qua đúng vị trí.
```

## Lệnh 4 — Bảng chi phí, khối lượng và hợp đồng

```text
Triển khai bảng giá BC trong Phụ lục A của file đặc tả này, để trong src/config/economy.* hoặc cấu trúc tương đương. Ghi rõ đây là giá game để cân bằng, không phải báo giá xây dựng ngoài đời. Dùng một nguồn cấu hình cho UI preview, core, sổ kế toán và test.

Đường: nền/mặt đường = diện tích × đơn giá loại đường; vỉa hè = diện tích thực × đơn giá; dây/ống tích hợp = chiều dài × đơn giá. Thêm khối lượng đào/đắp × đơn giá đất, trụ cầu, portal hầm, chi phí mua đất và dự phòng. Không cộng lại vỉa hè/ống đã nằm trong một đơn giá tổng hợp.

Công trình: footprint × đơn giá công trình tương ứng hoặc giá cố định theo capacity tier, sau đó cộng đấu nối, đào nền, trang bị và đất. Chọn một mô hình phù hợp từng loại và ghi rõ để không tính hai lần. Mở rộng trường/bệnh viện tăng đúng chỗ học/giường và số nhân viên.

Preview hiển thị khối lượng, xây dựng, thiết bị, đất, dự phòng, tổng cam kết, chi phí vận hành dự kiến/tháng, thời gian thi công và ngân sách còn lại. Xây công trình công cộng là chi của thành phố; nhà/xưởng tư nhân do doanh nghiệp/hộ/nhà đầu tư chịu chi phí, không lấy nguyên giá nhà từ ngân sách thành phố chỉ vì người chơi tô phân khu.

Hợp đồng có ID, tổng cam kết, phần đã thanh toán, phần chưa thanh toán, phần escrow và vật tư cần. Tiền escrow không đồng thời được tính như expense đã thực hiện. Không có tiền thì command bị từ chối trước mutation.

Hoàn tiền theo khoản chi lịch sử và vật tư thu hồi thực tế; không dựa trên giá catalog mới. Hủy hợp đồng hoàn phần chưa chi, trừ khoản hủy đã cấu hình. Phá tài sản cũ có chi phí tháo dỡ và giá phế liệu; không được tạo tiền bằng xây/phá liên tiếp. Tài sản có sẵn trong map mặc định không có khoản chi của người chơi để hoàn.

Kiểm tra ví dụ đường hai làn 100 m, rộng 12 m, diện tích 1.200 m²: phần nền/mặt đường theo 50 BC/m² là 60.000 BC, sau đó cộng riêng các hạng mục được chọn. Đổi chiều dài thì giá đổi tương ứng; xác nhận hai lần không chi hai lần; đổi catalog không tạo exploit hoàn tiền.
```

## Lệnh 5 — Hộ gia đình, từng cư dân và nhà ở

```text
Tạo từng Citizen và Household có ID. Citizen gồm tuổi, ngày sinh, sức khỏe, học vấn, kỹ năng, việc làm/trường, thu nhập, phương tiện, nhu cầu, sở thích di chuyển và lịch sinh hoạt. Household gồm thành viên, địa chỉ, thu nhập/chi phí chung, tiền tiết kiệm, hợp đồng thuê/sở hữu và phương tiện dùng chung.

Các nhóm trẻ em, thanh thiếu niên, người lao động và người cao tuổi có lịch và nhu cầu khác nhau. Dân số UI phải là số Citizen tồn tại, không phải biến tổng độc lập được tăng ngẫu nhiên. Người mới đến là một hồ sơ có nhu cầu nhà, khả năng chi trả và phương thức đi vào thành phố.

Nhà có số căn, sức chứa, tình trạng, giá thuê, tiện ích, cửa vào, địa chỉ và danh sách hộ. Hộ chỉ chuyển vào khi còn căn phù hợp, đủ tiền, có hợp đồng và hành trình chuyển nhà. Không nhét 70 người vào nhà sức chứa 24. Định cư, chuyển đi, sinh và tử là domain events có điều kiện.

Giá thuê và lựa chọn nhà phụ thuộc diện tích, chất lượng, khả năng tiếp cận việc làm, dịch vụ và môi trường. Thuế cao/thuê cao không làm tất cả dân bỏ đi cùng một tick; hộ đánh giá ngân sách theo chu kỳ, dùng tiết kiệm, tìm nhà/việc trước khi chuyển đi.

Vòng đời chạy theo lịch mô phỏng. Mức sinh/tử là tham số thiết kế theo độ tuổi, sức khỏe và quy mô hộ, không phải tung xúc xắc toàn thành phố mỗi frame. Tránh sinh/tử để bù thủ công lỗi sức chứa.

Cho người chơi chọn một cư dân để xem tên được tạo riêng, tuổi, hộ, nhà, công việc/trường, thu nhập, mục tiêu hiện tại, phương thức đi và lý do đang đợi. Có thể theo dõi cả ngày và truy nguyên mọi thay đổi.

Kiểm tra: hộ 4 người chuyển vào căn còn 4 chỗ; hộ thiếu tiền tìm lựa chọn rẻ hơn; người mất việc tìm lại việc; tổng Citizen bằng dân số báo cáo; save/load giữ nguyên quan hệ hộ/nhà/việc.
```

## Lệnh 6 — Lịch sinh hoạt và người đi bộ như thật

```text
Triển khai state machine/behavior system cho từng người: ở nhà, ngủ, chuẩn bị, đi bộ, chờ qua đường, chờ xe, trên xe, ở nơi làm/trường, mua hàng, giải trí, khám bệnh, bị chặn và chuyển nhà. Mỗi trạng thái có điều kiện vào/ra và một mục tiêu cụ thể.

Ngày thường: người lao động có ca, học sinh có giờ học; cuối tuần/ca đêm có lịch khác. Giờ đi không giống hệt cho tất cả; lấy offset có seed trong một khoảng hợp lý. Người cân nhắc ETA và mức trễ, được đánh dấu trễ nếu thực sự không đến kịp.

Chuyến đi bắt đầu từ cửa công trình, đi theo sidewalk/crossing đến cửa đích hoặc trạm phương tiện. Đi qua đường chỉ tại crossing hợp lệ và theo tín hiệu/quyền ưu tiên. Không đi xuyên nhà, băng qua cao tốc hoặc vượt sông nếu chưa có cầu dành cho họ.

Vận tốc đi bộ mặc định 1,3 m/s theo đơn vị thời gian mô phỏng; cho các hồ sơ biến thiên khoảng 0,8–1,8 m/s và giảm khi đông, mệt hoặc có hạn chế vận động. Tránh va chạm ở quy mô cục bộ bằng separation/steering và hàng đợi; không cần physics engine cho từng người. Khi đông, người dồn hàng, giảm tốc và chờ thay vì chồng kín một điểm.

Muốn dùng ô tô phải có ô tô khả dụng trong hộ, đi đến chỗ đỗ, lên xe, chạy tới nơi có chỗ đỗ rồi đi bộ chặng cuối. Muốn đi bus phải đi đến trạm, chờ xe có tuyến thích hợp, có ghế/sức chứa rồi mới lên. Hết chỗ thì tiếp tục đợi hoặc đổi phương án.

Sau mua hàng, tiền và tồn kho cập nhật khi giao dịch hoàn tất; sau khám, sức khỏe cập nhật theo điều trị; sau đến trường/làm, attendance được ghi. Agent tắc đường không được nhận trạng thái đã tới nơi chỉ vì giờ lịch đã qua.

Kiểm tra bằng camera theo một người: nhà → việc → cửa hàng → nhà, cùng một ID, vị trí liên tục, đủ cửa vào, đường qua đường, chờ hợp lệ, giao dịch và lịch được lưu. Thử phá tuyến giữa chuyến, hết chỗ bus, tắt crossing, mưa và công trình đóng cửa.
```

## Lệnh 7 — Xe, tìm đường và ùn tắc thật

```text
Tạo Vehicle với ID, owner/operator, loại, kích thước, vị trí làn, tốc độ, gia tốc, route, cargo/passengers, nhiên liệu và mục đích chuyến. Có ô tô, xe máy, bus, xe tải, cứu thương, cứu hỏa, cảnh sát, xe rác và xe thi công theo các hệ thống đã triển khai.

Tìm đường trên lane graph bằng cost gồm thời gian, congestion dự đoán, loại xe, cấm đường, phí và turn penalty. Cache theo graph version và loại agent; có giới hạn công việc mỗi tick. Agent đổi tuyến khi lý do hợp lệ, không đổi mỗi frame hoặc biết hoàn hảo toàn bộ tương lai.

Triển khai car-following, khoảng cách an toàn, gia tốc/phanh, giới hạn tốc độ, chuyển làn có kiểm tra khoảng trống và làn chuẩn bị rẽ. Tốc độ cơ sở: phố dân cư 30 km/h, đường chính 50, đại lộ 60, cao tốc 90, đều là giá trị game cấu hình. Quy đổi km/h → m/s rõ ràng.

Giao lộ có đèn/ưu tiên, stop line, vùng xung đột, crossing và xe chờ. Không cho xe vào giao lộ khi không có chỗ thoát để tránh khóa ngã tư. Ưu tiên khẩn cấp theo cấu hình nhưng vẫn tránh va chạm; không đi xuyên xe khác.

Ô tô cần bãi/chỗ đỗ. Không có chỗ thì tìm bãi khác, xếp hàng hoặc quay lại; không biến mất tại cửa. Xe tải cần điểm loading/unloading, bus có dwell time và capacity.

Congestion đo từ tốc độ thực, thời gian hành trình, hàng đợi và throughput từng đoạn. Không lấy dân số chia số ô đường để giả lập một phần trăm giao thông. Số chuyến phát sinh phải đến từ nhu cầu cư dân/doanh nghiệp/dịch vụ; không tự sinh đoàn xe trang trí.

Kiểm tra: giờ cao điểm tại một ngã tư; chuyển pha đèn tạo khác biệt; thêm lane đúng vị trí cải thiện bottleneck; thêm lane sau bottleneck không tự chữa tắc; đường một chiều; làn rẽ; xe cấp cứu; đỗ xe; đường đứt không teleport. Cho người chơi chọn xe để xem mục tiêu và hành trình thật.
```

## Lệnh 8 — Phân khu, doanh nghiệp và hàng hóa

```text
Tách phân khu, lô đất và công trình. Các vùng dân cư/thương mại/công nghiệp có mật độ, footprint, chiều cao, nhu cầu và loại công trình được phép. Công trình không mọc chỉ vì random: cần lô hợp lệ, đường tiếp cận, nguồn vốn, vật tư, nhu cầu và utility capacity.

Tạo Firm với tiền mặt, hàng tồn, nhân viên, vị trí tuyển dụng, yêu cầu học vấn, wages, lịch mở cửa, năng lực sản xuất, hợp đồng và lợi nhuận. Jobs UI là tổng vị trí thật; thất nghiệp tính trên người đủ tuổi/điều kiện muốn làm, không trên toàn dân số.

Người nộp/tìm việc theo kỹ năng, ca và khả năng đi lại. Công ty thiếu nhân viên, điện, nguyên liệu hoặc đầu ra giảm sản lượng có lý do. Người không đến làm vì tắc đường ảnh hưởng attendance và sản lượng theo cấu hình, không làm toàn công ty ngừng ngay.

Chuỗi hàng tối thiểu: nhập nguyên liệu → xưởng → kho → cửa hàng → hộ. Mỗi chuyến có lượng hàng, nguồn, đích, route, thời gian bốc dỡ và chi phí. Hàng chỉ vào tồn kho sau khi xe đến/giao xong. Không có đường ra ngoài thì nhập/xuất bị chặn.

Thêm thị trường ngoài thành phố với giá mua/bán, nhu cầu và công suất kết nối được cấu hình. Tiền từ xuất khẩu có đối tác ngoài; tránh vòng tiền vô hạn giữa doanh nghiệp mà không có bán hàng/giá trị tạo ra.

Cửa hàng có giờ mở, tồn kho, nhân viên, khách đang chờ; khách chọn cửa hàng theo hàng cần mua, giá và ETA. Doanh nghiệp trả lương, thuê, utility, vận tải và thuế từ tài khoản của mình. Không ghi doanh thu cửa hàng thành thu nhập thành phố; thành phố nhận đúng phần thuế/phí.

Kiểm tra: cắt đường nhập khiến tồn kho giảm rồi thiếu nguyên liệu; khôi phục đường và giao hàng phục hồi; người thiếu học vấn không được gán việc yêu cầu cao; cửa hàng bán hết hàng; lương trả đúng một lần mỗi kỳ; tài sản tư nhân không trừ nhầm quỹ thành phố.
```

## Lệnh 9 — Điện, nước, nước thải và môi trường

```text
Thay tiện ích chỉ dùng bán kính bằng network và công suất: nguồn, trạm, dây/ống, load, kết nối, capacity và bottleneck. Đường có thể chứa ống/cáp nếu người chơi chọn; đoạn này phải có asset/network data, không tự coi mọi đường đã có mọi utility.

Điện: nguồn phát có kW khả dụng, ramp/availability, nhiên liệu hoặc gió/nắng, vận hành và đấu nối. Trạm phân phối và dây có giới hạn. Nhu cầu từ hoạt động thực của nhà/xưởng/dịch vụ; bill theo kWh. Quá tải gây load shedding theo ưu tiên, không ngắt toàn bộ thành phố đồng loạt vì vượt 1 đơn vị.

Nước: lưu lượng m³/ngày, source/pump/tank/pipe; kiểm tra nguồn nước và contamination. Nhu cầu dân cư khởi tạo 0,15 m³/người/ngày, công nghiệp theo sản lượng và công trình theo người sử dụng; đây là tham số game. Bể chứa giữ phần cấp dư, giới hạn đúng capacity.

Nước thải phát sinh từ người/hoạt động, đi qua cống đến xử lý hoặc điểm xả. Nhà máy xử lý có capacity, năng lượng, staff và hiệu suất; quá tải làm phần chưa xử lý ra môi trường đúng vị trí. Điểm lấy nước phía ô nhiễm ảnh hưởng chất lượng nếu chưa xử lý.

Ô nhiễm gồm khí/đất/nước/tiếng ồn với nguồn khác nhau, thời gian phát tán và hồi phục. Công nghiệp/xe phát thải theo hoạt động. Nước có dòng chảy; chất ô nhiễm không lập tức xuất hiện ở toàn sông. Công viên không tự xóa chất độc/nước thải ngay lập tức.

UI xem từng network, thiếu nguồn hay nghẽn truyền dẫn, capacity/usage, chất lượng và bill. Các hệ thống bảo toàn lượng trong mức sai số quy định: cấp = dùng + lưu + thất thoát có khai báo.

Kiểm tra: thừa phát nhưng dây quá nhỏ; water source ô nhiễm; bể cạn; cống tắc; nhà máy quá tải; đóng trạm rồi mở lại; utility ngừng ảnh hưởng đúng hoạt động và thể hiện lý do.
```

## Lệnh 10 — Dịch vụ công với nhân viên, xe và thời gian đáp ứng

```text
Triển khai giáo dục, y tế, cứu hỏa, cảnh sát, rác thải và bảo trì đường theo hoạt động cụ thể, thay cho cộng hạnh phúc bằng vòng bán kính.

Trường: chỗ học, lớp/ca, giáo viên, học sinh đăng ký, attendance và tiến độ học theo kỳ. Trường xa/thiếu đường tạo đi học trễ và thiếu chỗ. Tiến bộ học vấn không tăng chỉ vì đứng gần trường một ngày.

Y tế: người bệnh, lịch khám, hàng đợi, bác sĩ, phòng khám, giường và thời gian điều trị. Cứu thương cần nhận cuộc gọi, đi tới bệnh nhân, đưa về cơ sở còn chỗ, rồi quay về trạng thái sẵn sàng. Khả năng đáp ứng tính từ route và nguồn lực.

Cứu hỏa: cháy phát sinh từ hazard tích lũy của công trình/hoạt động, condition và seed. Dispatch có xe và lính; xe đến mới bắt đầu dập. Cháy lan theo vật liệu/khoảng cách/gió có kiểm soát. Mất điện/nước và thiệt hại có dữ liệu. Không sinh thảm họa ngẫu nhiên chỉ để tạo kịch tính.

Cảnh sát: incident có nguồn, mức độ, người/đối tượng liên quan ở mức trừu tượng, gọi/dispatch, travel, xử lý và hậu quả. Phòng ngừa phụ thuộc tuần tra/đáp ứng/điều kiện kinh tế, không chỉ vòng tròn màu xanh.

Rác: kg hoặc tấn được tạo từ hộ/doanh nghiệp, thùng có sức chứa, lịch xe, truck capacity, pickup, unload, xử lý và landfill capacity. Xe rác không đi một vòng trang trí rồi tự xóa rác toàn thành phố.

Ngân sách dịch vụ quyết định nhân viên/ca/xe/lịch bảo trì. Staff là Citizen được tuyển hoặc nguồn ngoài được mô tả rõ, có wages. Công trình đẹp nhưng thiếu staff/điện phải có trạng thái giảm công suất. Thêm xe tạo chi mua xe, lương driver và nhiên liệu.

Kiểm tra: đầy giường, thiếu giáo viên, xe rác đầy, đội chữa cháy hết xe, đường bị chặn làm ETA tăng, dịch vụ từ ngoài thành phố có giới hạn và phí. Mỗi sự cố phải xem được timeline và trạng thái xử lý.
```

## Lệnh 11 — Xe buýt, tram, metro và chuyển phương tiện

```text
Làm bus hoàn chỉnh trước, rồi tram và metro khi bus đã kiểm chứng. Tuyến gồm điểm dừng theo thứ tự, depot, timetable/headway, số xe, sức chứa, fare, chiều tuyến, chiều về và turnaround. Hạ tầng tram/metro chỉ mở khi graph, đường ray và trạm thật đã hoạt động.

Người chọn phương thức bằng generalized cost gồm đi bộ đầu/cuối chuyến, chờ, thời gian trên xe, chuyển tuyến, fare, khả năng chi trả và sở thích. Người không biết chính xác tương lai; dùng thông tin lịch/ước tính đã có.

Passenger ở trong hàng đợi của một stop và destination/transfer cụ thể. Bus đến đúng stop, mở cửa, cho xuống trước lên sau, cập nhật capacity rồi khởi hành. Xe đầy thì người chưa lên tiếp tục chờ. Xe hỏng/lạc tuyến tạo delay thực, không cho hành khách lên một xe vô hình.

Có chuyến một phương thức và chuyến đi bộ → bus → đi bộ; sau đó chuyển tuyến bus → tram/metro. Không trừ fare hai lần nếu cấu hình vé chuyển tuyến cho phép. Fare được ghi khi boarding/ticket validation, revenue thuộc operator được xác định.

Tram chạy trên rail graph, signal và giao cắt hợp lệ. Metro có tuyến ray/hầm, platform, depot và train; không chỉ vẽ line trên bản đồ. Mỗi hệ thống có giá hạ tầng, xe, staff, điện/nhiên liệu và bảo trì.

Dashboard hiển thị ridership thực, waiting time, load factor, on-time, chi phí và lợi nhuận/trợ giá từng tuyến. Dùng các trip thực để tính mức giảm xe cá nhân; không cộng một bonus giảm ùn tắc cố định quanh depot.

Kiểm tra: hai tuyến có transfer; một bus đầy; tuyến chạy sai chiều; xóa stop; giảm headway làm waiting time giảm có điều kiện; tăng xe vượt khả năng đường có thể gây chậm; metro đóng làm người tìm đường khác.
```

## Lệnh 12 — Kinh tế, thuế và sổ ngân sách

```text
Triển khai municipal ledger, household accounts, firm accounts và operator accounts. Mọi giao dịch có ID, timestamp, category, source, destination, amount và reference thực thể/sự kiện. Không ghi cả doanh thu và net profit thành hai khoản thu của thành phố.

Khởi tạo tiền game theo Phụ lục A; các mức thuế và wages là hệ số cân bằng, không phải luật/giá thật. Income tax thu trên wages thực trả, corporate tax trên taxable profit dương, property tax theo giá trị đánh giá và kỳ tính. Utility fare/fee thu theo tiêu thụ hoặc dịch vụ đã cung cấp. Có breakdown theo kỳ.

Chi gồm hợp đồng xây, đất, staff wages, nhiên liệu, năng lượng, vật tư, bảo trì, xử lý chất thải, trợ giá và lãi vay. Giá vận hành trong catalog phải tách fixed maintenance, wages và variable inputs. Đừng vừa thu một phí upkeep tổng đã chứa wages rồi lại trừ wages lần nữa.

Vay vốn tăng cash đồng thời tăng debt; không gọi khoản vay là doanh thu hoạt động. Trả gốc giảm cash và debt; lãi là expense. Có lịch trả, hạn mức, interest rate cấu hình, dự báo trả nợ và cảnh báo trước khi ký.

Demand RCI xuất phát từ hộ đang tìm nhà, vacancies, affordability, người tìm việc, doanh nghiệp muốn mở rộng, hàng bán và cơ sở hạ tầng. Không lấy một thanh random độc lập. Thuế/giá ảnh hưởng quyết định theo thời gian và độ trễ có giải thích.

Land value theo accessibility, tiện ích, môi trường, nguy cơ, cung/cầu và dịch vụ. Hạnh phúc tách thành nhà ở, thu nhập, việc làm, đi lại, sức khỏe, giáo dục, môi trường và an ninh; hiển thị lý do theo hộ/cư dân.

Có dòng tiền thực và khoản cam kết tương lai, dự báo 3/6/12 tháng, lựa chọn chi tiêu và các mức khó. Hết tiền không xóa thành phố; dịch vụ giảm theo khả năng trả và người chơi có lựa chọn điều chỉnh.

Kiểm tra một tháng với ledger đối chiếu opening cash + cash inflows − cash outflows = closing cash, nợ đối chiếu riêng. Test cuối tháng ngắn/dài, save giữa payroll, lương nhân viên công, lỗ doanh nghiệp, thuế âm không được tạo subsidy ngoài thiết kế.
```

## Lệnh 13 — Công trường, thời gian thi công và bảo trì

```text
Xây công trình qua các bước đã lên lịch: thiết kế/giải phóng mặt bằng, chuẩn bị nền, giao vật tư, thi công, đấu nối, nghiệm thu và mở cửa. Công trình đang xây không cung cấp capacity đầy đủ.

Mỗi contract cần workers, equipment, materials, vốn và đường tiếp cận. Staff/xe thi công có schedule hoặc hợp đồng nguồn ngoài có giới hạn. Vật tư thiếu thì công trường chậm, có lý do và ETA thay đổi. Đường mới có thể chia đoạn nghiệm thu để xe dùng phần đã hoàn tất.

Cho chế độ xây nhanh trong sandbox để người chơi thử bố cục; chế độ mô phỏng dùng thời gian thật của hệ thống. Dữ liệu hợp đồng và kinh tế vẫn thống nhất, không nhầm build nhanh với hoàn tiền miễn phí.

Road condition và building condition giảm theo thời gian, lưu lượng/tải, thời tiết và bảo trì. Condition thấp ảnh hưởng năng lực/chi phí/hazard theo cấu hình. Bảo trì cần ngân sách và crews; đường đóng một phần khi thi công, agent đổi tuyến thật.

Nâng cấp công trình có footprint mới, giai đoạn vận hành giảm, capacity bổ sung, staff và thiết bị. Không ép citizen ra khỏi nhà ngay mà không có phương án di dời. Thu hồi đất có ownership, compensation và timeline.

Kiểm tra: công trường không tiếp cận được, thiếu vật tư, pause/resume, hủy giữa chừng, tiền escrow đối chiếu, đấu nối thiếu điện, đường đang sửa gây delay, save/load đúng tiến độ và không thanh toán lặp.
```

## Lệnh 14 — Thành phố sống, thời tiết và các lựa chọn quy hoạch

```text
Thêm ngày/đêm và weather có seed: nắng, mưa, gió, nhiệt độ ở mức mô phỏng phù hợp. Weather ảnh hưởng tải điện/nước, công trường, tầm nhìn/tốc độ và lựa chọn phương tiện bằng hệ số rõ. Không tạo thảm họa mới mỗi vài phút chỉ để tăng sự kiện.

Nhà/trường/xưởng/cửa hàng/công viên có giờ hoạt động. Đêm người và đèn phản ánh occupancy; có ca đêm, xe dịch vụ và logistics. Công viên có visitors thực đi tới, dwell time và hoạt động nghỉ ngơi; không spawn người trang trí không có household.

Mở district với policies: giới hạn xe tải, pedestrian zone, speed limit, parking fee, giờ giao hàng, hỗ trợ transit, mức dịch vụ và ưu tiên đầu tư. Policy phải tác động graph, lựa chọn và ledger, đồng thời hiển thị lợi ích/chi phí dự kiến và kết quả đo được.

Mở giao thương ngoài bản đồ bằng một hoặc nhiều cửa vào: đường bộ, rail và cảng khi triển khai đủ vehicle/cargo graph. Kết nối ngoài có capacity và cost, không sinh tài nguyên vô hạn ở mọi công trình.

Nếu thêm thiên tai, dùng hazard được giải thích từ địa hình/thời tiết/hạ tầng: nước dâng/ngập theo cao độ, cháy theo hazard, mất điện theo network. Đảm bảo người chơi thấy nguy cơ, có công cụ phòng ngừa và hỗ trợ; có tùy chọn tắt disasters.

Âm thanh riêng/được cấp phép cho môi trường, xây dựng và phương tiện, có volume/mute. Không yêu cầu camera/microphone/location của người chơi.

Kiểm tra: policy cấm xe tải làm logistics đổi tuyến; mưa làm demand/đường thay đổi có kiểm soát; cơ sở đóng giờ khiến người chọn đích khác; pedestrian zone vẫn tiếp cận bằng người/xe khẩn cấp theo policy; thời tiết replay từ cùng seed.
```

## Lệnh 15 — Giao diện quản lý và giải thích nguyên nhân

```text
Thiết kế UI tiếng Việt riêng cho Build City 26. Mở trực tiếp vào game hoặc màn chọn thành phố, có camera và công cụ rõ. Giữ map là trung tâm; desktop có panel đóng/mở, mobile có bottom sheet và controls không đè toàn bộ vùng chơi.

Áp dụng đầy đủ hệ giao diện và icon tại Phụ lục G: nền xanh than, panel gọn, icon SVG đồng bộ, toolbar dạng dock, asset cards có preview thật, inspector dễ đọc và trạng thái tương tác rõ. Đây là yêu cầu sửa UI chạy trong game hiện tại, không chỉ vẽ một mockup hoặc sửa màn đăng nhập. Giữ event handlers, dữ liệu mô phỏng, camera, Auth, save, missions và BXH đang hoạt động.

Toolbar: đường, phân khu, tiện ích, dịch vụ, vận tải, công viên, district và phá dỡ. Preview trước khi confirm có chi phí ngay/tháng, công suất, yêu cầu, thời gian xây và cảnh báo. Có undo cho command được định nghĩa rõ; undo không đảo ngược thời gian hoặc các giao dịch đã phát sinh sau command một cách tùy tiện.

Inspector cho Citizen, Household, Firm, Vehicle, Building, Road, utility và transit line. Hiển thị dữ liệu thật từ core: trạng thái, nguồn/đích, tuyến, ETA, chi phí, capacity, lỗi và reason chain. Người chơi phải trả lời được “vì sao dân chưa đến/nhà không mọc/xe đang đợi/doanh nghiệp lỗ”.

Lớp bản đồ: lanes/turns, đi bộ, transit, congestion, jobs, affordability, land value, điện, nước/cống, rác, health, education, security, noise và pollution. Mỗi lớp có đơn vị/legend đúng và lấy từ mô phỏng, không tô màu ngẫu nhiên.

Dashboard có lịch sử và khoảng thời gian cho dân số, cash flow, demand, unemployment, commute, utility, service waiting và environment. Thông báo có nguồn sự kiện, mức ưu tiên, vị trí và hành động liên quan. Gộp cảnh báo lặp để không spam.

Tutorial bằng những nhiệm vụ có kiểm tra điều kiện: xây đường → cấp utility → phân khu → quan sát một hộ → tạo việc làm → xem commute → chỉnh ngân sách. Trợ giúp là nội dung viết sẵn, không gọi API AI.

Kiểm tra chữ tiếng Việt, độ tương phản, keyboard, touch/pinch, canvas resize, modal focus, viewport 390 × 844 và màn desktop; panel phải đóng được để chơi. Không để button đã hiện nhưng handler chưa hoạt động.
```

## Lệnh 16 — Hiệu năng, quy mô và mô phỏng không mất người

```text
Đo hiệu năng trước khi tối ưu. Tạo benchmark city 300, 1.000, 5.000 và 10.000 cư dân; có đường, doanh nghiệp, chuyến đi, dịch vụ và giờ cao điểm thật. Ghi thiết bị, browser, quality, dân số, active agents, CPU tick, FPS, memory và pathfinding queue.

Chuyển core/tìm đường phù hợp vào Web Worker, giao tiếp bằng compact snapshots/deltas và transferables. Render interpolate giữa snapshot; không clone toàn world mỗi frame. Dùng spatial index cho lân cận, culling/LOD và instancing. Chunk world theo vùng để graph/update tìm đúng phần thay đổi.

Agent ngoài camera vẫn có identity, location, state, schedule và hành trình. Có thể update theo event hoặc tần suất thấp hơn trên đoạn đường trống, nhưng phải bảo toàn arrival, hàng đợi, hàng hóa, thời gian và tiền. Vào khu vực đông/giao lộ phải dùng detailed update. Không bỏ agent rồi sinh đại một người khác khi camera quay lại.

Giới hạn số công việc tìm đường mỗi tick, ưu tiên emergency/deadline theo quy tắc rõ và hiển thị trạng thái tính route. Không freeze UI để tính hàng nghìn A* đồng thời. Không lưu cache quá lớn hoặc snapshot từng frame vào Supabase.

Mục tiêu ban đầu là thao tác mượt ở 1.000 cư dân trên desktop cấu hình vừa; đo để quyết định mục tiêu mở rộng. Không hứa hàng trăm nghìn người nếu chưa có số liệu. Thiết bị yếu được giảm quality/render distance và giới hạn quy mô minh bạch; không âm thầm bỏ chuyến đi để làm FPS cao.

Kiểm tra memory leak, tab nền, context lost, Worker restart và recovery từ last checkpoint. Khi đóng tab, mặc định pause mô phỏng; khi mở lại, không tự cộng nhiều năm offline. Chỉ thêm offline progression sau khi có thuật toán bảo toàn và được mô tả rõ.
```

## Lệnh 17 — Supabase thật, lưu lớn và đồng bộ nhiều thiết bị

```text
Thay form Auth bằng yêu cầu mới: đăng ký Tên thành phố, Tài khoản, Mật khẩu; đăng nhập Tài khoản, Mật khẩu. Không yêu cầu người chơi nhập email/số điện thoại/xác nhận mật khẩu. Tên thành phố cho phép tiếng Việt, dài 1–36 ký tự sau trim; tên tài khoản 3–24 ký tự a-z, 0-9, dấu gạch dưới, normalize lowercase, unique case-insensitive; mật khẩu ít nhất 8 ký tự, không trim hoặc lowercase mật khẩu. Có nút xem/ẩn mật khẩu và thông báo lỗi rõ.

Supabase Auth password không có username login native. Triển khai lớp tài khoản riêng phía server giữ username → auth user ID/identity; Supabase vẫn quản lý hash mật khẩu và session JWT hợp lệ. Có thể cấp identity email nội bộ duy nhất trên tên miền do ứng dụng kiểm soát, không trỏ tới email của người thật và không gửi email. Với mô hình này, tạo user qua Admin API chỉ ở server và cấu hình chặn đăng ký Auth trực tiếp nếu cần để tránh vượt luồng kiểm tra username. Không coi identity nội bộ là email người chơi đã cung cấp/xác minh.

Tạo API register/login/recovery trên Vercel hoặc Supabase Edge Functions. API register validate và reserve username unique, tạo Auth user rồi commit profile + thành phố đầu tiên bằng flow idempotent có xử lý lỗi/tài khoản mồ côi. API login tra mapping private phía server, xác thực mật khẩu bằng Supabase Auth và trả session để SDK client tiếp tục dùng RLS/refresh. Không dùng service key như session người chơi. Khóa quyền admin chỉ nằm trong server secret SUPABASE_SECRET_KEY hoặc SUPABASE_SERVICE_ROLE_KEY, không có tiền tố VITE_, không yêu cầu tôi dán secret vào chat.

profiles có user_id, username, display city name và thời gian tạo; mappings/recovery nằm ở schema private hoặc bảng không cấp quyền Data API cho client. Không lưu password vào profiles/cities/localStorage. Quyền read/write profiles riêng và dữ liệu công khai tối thiểu của BXH tách riêng. Username và quyền admin không lấy từ user_metadata do client tự đổi.

Sau đăng ký, tự tạo thành phố đầu tiên theo tên đã nhập và đăng nhập người chơi. Tên thành phố không phải username; có thể trùng tên giữa các người chơi. Cho đổi tên thành phố về sau nhưng không tạo một tài khoản mới hoặc một bản ghi BXH mới. Nếu lỗi tạo city, có trạng thái đăng ký dở và retry rõ, không lặp tạo người dùng/nhận tiền khởi tạo.

Không có email nên khôi phục bằng mã dự phòng: sinh mã ngẫu nhiên đủ mạnh ở server, chỉ hiển thị một lần sau khi đăng ký; server lưu hash và mỗi mã dùng một lần. Form khôi phục riêng dùng tài khoản + mã + mật khẩu mới, có rate limit, giới hạn thử, response không tiết lộ mapping và invalidate session cũ sau đổi mật khẩu. Mất cả mật khẩu lẫn mã thì nói rõ không thể tự khôi phục; không giả vờ gửi email và không đặt lại mật khẩu chỉ bằng tên thành phố.

Rate limit/IP + username cho register/login/recovery bằng storage chia sẻ hoặc dịch vụ phù hợp, không chỉ một biến RAM của serverless. Không log mật khẩu/session/mã khôi phục. Không cache response chứa token; kiểm tra origin/CSRF khi dùng cookie và CORS đúng domain; dùng HTTPS, cookie HttpOnly/Secure/SameSite nếu chọn kiến trúc cookie. Nếu dùng session SDK theo kiến trúc hiện có, mô tả rủi ro XSS và xử lý input/render đúng.

Kiểm tra dữ liệu username race/duplicate, chữ hoa/thường, tên tiếng Việt, password không bị trim, đăng nhập sai/đúng, refresh session, đăng xuất, recovery, retry register và migrate tài khoản email cũ. Tài khoản cũ cần luồng claim username sau khi xác thực bằng phương thức cũ; chỉ hiển thị luồng tương thích cho tài khoản cũ, không thêm email vào form đăng ký mới.

Giữ RLS: từng owner chỉ đọc/ghi/xóa dữ liệu của mình. Kiểm tra bằng ít nhất hai tài khoản qua Data API, không chỉ bằng cách ẩn thành phố khỏi UI. Publishable/anon key chỉ là key frontend; owner phải được xác định từ session/JWT hợp lệ, không tin owner_id người dùng tự gửi.

Giữ optimistic revision cho save; stale device không ghi đè bản mới. Có lựa chọn tải bản cloud, tạo bản fork/new city hoặc xuất local. Auto-save debounce, một save đang chạy tại một thời điểm, mutation mới trong lúc save phải được lưu ở lần sau. Đổi tài khoản/thành phố khi request đang chạy không gắn kết quả save nhầm đối tượng.

Khi số agent làm snapshot vượt giới hạn JSONB 2 MB hiện tại, đo rồi nâng thiết kế: metadata/revision trong Database và snapshot nén trong private Storage nếu cần. Thay schema/RPC bằng migration; không chỉ gửi file lớn vào endpoint vẫn giới hạn 2 MB.

Với Storage, có ownership policy cho bucket/path, metadata có checksum/schema/build version. Upload snapshot immutable mới trước, rồi commit metadata bằng compare-and-swap; thất bại CAS không đổi active snapshot. Có cleanup có giới hạn cho blob mồ côi, không xóa bản active. Không public bucket chứa save riêng tư.

Khôi phục dữ liệu có validation, migrations, checksum và rollback khi save hỏng. Dùng transaction/event IDs để không trả wages hay contract hai lần sau reconnect. Autosave lên cloud theo checkpoint, không gửi vị trí từng người mỗi frame.

Kiểm tra: hai người dùng, hai tab, hai thiết bị, token hết hạn, logout giữa request, mất mạng khi upload, CAS fail, bản lưu lớn, corrupt import, tải version cũ và xóa city kèm blob theo quyền. Ghi rõ client-side simulation chưa có anti-cheat, không đưa vào thi đấu có thưởng.
```

## Lệnh 18 — Cấp độ, XP và dữ liệu bảng xếp hạng

```text
Tạo progression cho account và thành phố xếp hạng chính, có XP, level, unlocks và achievement receipts. Level 1 khởi tạo XP 0. XP cần cho bước từ level L tới L+1: 500 + 250 × (L−1). Tổng XP tối thiểu để đạt level L: 500 × (L−1) + 125 × (L−1) × (L−2). Level được tính từ total XP, không cho client ghi một level tùy ý.

Giới hạn cấp thành phố là 100, cần tổng 1.262.250 EXP theo công thức trên. EXP và XP là cùng một đại lượng, UI dùng chữ EXP. Bậc nhiệm vụ 1–99 gồm ba nhiệm vụ A/B/C theo Phụ lục E; tổng EXP mỗi bậc bằng nhu cầu lên cấp tương ứng. A nhận floor(0,40 × T), B nhận floor(0,35 × T), C nhận T − A − B, với T = 500 + 250 × (bậc − 1). Ví dụ bậc 1: 200/175/125 EXP; bậc 10: 1.100/962/688; bậc 99: 10.000/8.750/6.250. EXP nhận ngay khi một nhiệm vụ hoàn tất hợp lệ, không phải chờ đủ cả bậc. Milestone ngoài chuỗi có thể giúp đạt level sớm, nhưng chuỗi chính vẫn mở tuần tự sau khi bậc trước hoàn tất; không skip receipt hoặc bắt nhiệm vụ phải trùng level hiện tại. Bậc 100 là ba thử thách cuối, thưởng 10.000/10.000/10.000 EXP; lưu EXP vượt ngưỡng cho thống kê nhưng không lên cấp 101, không trả thêm thưởng cấp vì vượt cap.

Mỗi bước tăng cấp thành phố trả thưởng đúng một lần với giá trị hiển thị 100.000.000 đơn vị tiền game theo yêu cầu. Dùng một economy config cho đơn vị lưu và đơn vị hiển thị: bộ giá trong file dùng BC; nếu giao diện muốn ghi “100 triệu đồng game”, quy ước hiển thị 1 BC = 1.000 đơn vị đồng game, nên reward = 100.000 BC. Đây chỉ là phép đổi đơn vị nội bộ, không phải tỷ giá tiền thật. Nếu dự án hiện dùng toàn bộ giá trực tiếp bằng đồng game, migration mọi số dư, giá, nợ, thưởng và BXH cùng một hệ số; không đổi riêng tiền thưởng thành 100 triệu BC. Không tự đổi đơn vị bản lưu đã có mà không migration.

Level 1 không nhận thưởng lên cấp. Receipt unique theo city ID/rule/target level; transaction grant và receipt atomic. Reload, đổi thiết bị, click lại, retry hoặc tạo fork không trả thêm. Khi XP vượt nhiều cấp, tạo đủ các receipt còn thiếu theo rule. Với BXH, server xác thực XP và trả thưởng; khoản này hiện riêng trong ledger “Trợ cấp lên cấp”, không tính là doanh thu doanh nghiệp. Chuỗi mission và điều kiện chống nhận lại tại Lệnh 26.

XP đến từ milestone lần đầu và nhiệm vụ có điều kiện kiểm chứng, không cộng mỗi frame hoặc mỗi lần save/login. Mặc định mốc dân cư đạt bền vững 100/500/1.000/5.000/10.000 lần lượt thưởng 100/300/600/2.000/4.000 XP; “bền vững” là duy trì 1 ngày mô phỏng và đủ housing/utilities. Cột mốc có ID unique, receipt và rule version. Mốc tăng dịch vụ, logistics, transit hoặc happiness có điều kiện tồn tại thật và duy trì; không thưởng vì chỉ đặt một asset rồi phá.

Mỗi tài khoản có một thành phố tham gia BXH chính; các save/fork khác vẫn chơi được nhưng không cộng tiền/XP qua nhiều thành phố để nhân tiền khởi tạo. Đổi thành phố xếp hạng phải có quy tắc server, không copy score từ city khác. Giữ account progression và city progression tách rõ, không trộn hai level trên UI.

Tạo public leaderboard projection tối thiểu: rank, username, city name, verified level, verified XP, verified money score, city ID không nhạy cảm, thời điểm cập nhật và rule/season. Không public snapshot, private identity email, session, recovery hash, lịch từng người hoặc chủ sở hữu bằng dữ liệu không cần thiết.

BXH cấp độ sắp level desc → total XP desc → thời điểm đạt mốc asc → ID ổn định. BXH tiền dùng tiền ngân sách thuần: treasury cash tổng có kiểm chứng − dư nợ gốc; show cả cash và debt trong tooltip. Tiền hộ/doanh nghiệp không cộng vào tiền thành phố. Hạn chế cash score âm bằng hiển thị số âm đúng; không clamp rồi xếp sai.

Tiền vay không làm tăng money score vì cash tăng đồng thời debt tăng. Sandbox, infinite money, import/fork từ file chưa kiểm chứng và bản bật cheat/dev tools không đủ điều kiện verified BXH. Không cộng số dư của nhiều city và không nhận lại grant nhiều lần bằng reset.

Có unique key theo user/season và city chọn, indexes phù hợp, pagination/keyset, cơ chế cập nhật idempotent theo checkpoint revision. Client chỉ có quyền đọc leaderboard public và quản lý lựa chọn/city của mình theo policy; không update level/XP/money projection. Profile public cần escape/render an toàn, không raw HTML.

Kiểm tra: hai người khác dữ liệu; tie stable; đạt mốc một lần; load/save không nhận XP lần nữa; vay/trả gốc không tự tăng score; sandbox/import không vào bảng verified; đổi tên cập nhật hàng hiện tại; 10.000 dòng vẫn phân trang được.
```

## Lệnh 19 — BXH trực tuyến, xác thực điểm và giao diện

```text
Triển khai hai tab BXH Cấp độ và BXH Tiền trong game, có top 100/phân trang, hàng của tôi, tên tài khoản, tên thành phố, cấp/XP hoặc tiền thuần, thời điểm cập nhật và trạng thái đủ điều kiện. Có bảng loading/empty/error/retry và dữ liệu thực đọc từ server. Không sinh đối thủ giả cho đầy bảng.

Tiền/XP chính thức phải được server tính từ state/command history đã kiểm chứng, không lấy con số client gửi làm chuẩn. Chỉ chuyển việc ghi score vào service-role API là chưa đủ chống sửa save: API đó vẫn phải kiểm chứng dữ liệu và tính score. Không gọi một bảng nhận cash/level từ JSON client là BXH chống gian lận.

Thiết kế ranked checkpoint có rule version, seed, checkpoint ID/revision và thời gian server. Nhận command hợp lệ, verify ownership/sequence/idempotency và replay hoặc cập nhật phần core có thẩm quyền từ checkpoint server. Tính XP, cash, debt và receipts sau commit thành công; client nhận lại verified score. Các hàm score/economy dùng cùng quy tắc, tie-break và seed; kết quả khác biệt có recovery/rollback hợp lý.

Game casual/local vẫn chạy client như trước. Chế độ xếp hạng có điều kiện rõ: online, rule set chuẩn, city khởi tạo bởi server, chưa import/chỉnh seed/tài chính, và checkpoint hợp lệ. Giới hạn thời gian mô phỏng được chấp nhận từ timestamp server cộng khoảng tăng tốc allowed; không tin số day/time client tự gửi. Disconnected ranked city có thể chơi local/fork; khi reconnect chỉ merge theo policy được kiểm chứng, không nhận một snapshot tùy ý thành bản ranked.

Không chạy vòng game vô hạn trong serverless. Xử lý command/replay theo batch và checkpoint có giới hạn, timeout/retry idempotent; benchmark để quyết định quy mô ranked initial. Nếu validation toàn core vượt budget Vercel, nêu rõ giới hạn và đề xuất worker/backend phù hợp trước khi hứa city quy mô lớn có verified ranking. Có thể giới hạn ranked city đầu kỳ ở quy mô đã đo được; casual city vẫn mở rộng theo năng lực máy. Không bỏ mô phỏng/validation để che timeout.

Tần suất score update theo checkpoint, mặc định không nhiều hơn một lần 30–60 giây mỗi city; polling hoặc Supabase Realtime theo thay đổi projection, không gửi vị trí từng agent để cập nhật BXH. Cập nhật score chỉ sau save/checkpoint hợp lệ, có status “chưa đồng bộ” khi mạng lỗi. Thiết bị cũ không ghi đè verified state mới.

Thiết kế season/rule version để thay công thức không trộn bảng không tương đương. Lưu snapshot season cũ nếu đã có; không tự reset dữ liệu của người dùng ngoài quy tắc mùa đã công bố. Trang lịch sử/season là optional nếu chưa triển khai đầy đủ; UI không có season giả.

Kiểm tra adversarial: sửa localStorage, JSON, network request cash/XP/level; duplicate command; mốc dân cư nhấp nháy; fake elapsed days; extra grant; vay tối đa; đổi owner; import save; hai thiết bị ghi cùng revision; timeout giữa commit; RLS attempts. Tất cả phải không tạo score vượt state hợp lệ. Báo đúng mức kiểm chứng, không hứa không thể hack hoặc chống bot tuyệt đối.
```

## Lệnh 20 — Bản đồ rộng, mở đất và nhiều địa hình

```text
Yêu cầu bổ sung: có chế độ Bản đồ Việt Nam theo Phụ lục H, đủ 34 đơn vị hành chính cấp tỉnh tại phiên bản dữ liệu đã kiểm chứng ngày 08/10/2026. Tổng quan cả nước dùng địa giới thật; khu đang chơi lấy coastline, sông và cao độ từ dữ liệu địa lý có nguồn/giấy phép. Giữ chế độ map sinh procedural riêng cho sandbox. Không biến bản đồ Việt Nam thành một hình đất ngẫu nhiên rồi gắn 34 nhãn.

World chuẩn 12,8 × 12,8 km = 163,84 km². Chia thành 16 × 16 khu quy hoạch, mỗi khu 800 × 800 m. Khởi đầu sở hữu một cụm 2 × 2 khu, tổng 1,6 × 1,6 km; chọn vị trí có đường kết nối vùng và nguồn nước phù hợp. Bản đồ nâng cao 25,6 × 25,6 km = 655,36 km² chỉ mở sau benchmark, không hứa cùng hiệu năng trên mọi thiết bị.

Trong chế độ Việt Nam, kích thước trên là cửa sổ xây dựng cục bộ trên nền địa lý toàn quốc, không phải ép cả nước vào hình vuông 12,8 km. Có thể mở rộng cửa sổ theo chunk và benchmark; tổng quan vẫn thấy toàn quốc và đủ tỉnh/thành. Hành trình, diện tích, chi phí và cao độ trong khu chơi giữ đơn vị mét thật.

Tọa độ tính bằng mét. Chunk streaming mặc định 200 × 200 m, toàn map chuẩn có 64 × 64 chunk nhưng chỉ tải chi tiết quanh camera và vùng có hoạt động. Không cấp phát một mảng thực thể dày cho toàn thế giới. Địa hình nền sinh theo seed; save lưu seed/version và phần đã sửa. Node đường, công trình, cư dân và vùng sở hữu dùng dữ liệu thưa. Camera có thể xem vùng chưa mua, nhưng command xây phải kiểm tra quyền sở hữu/độ dốc/hành lang bảo vệ.

Mua đất theo lô 200 × 200 m bên trong khu 800 m. Giá cơ sở 20 BC/m² theo Phụ lục A: một lô 40.000 m² là 800.000 BC trước chỉ số giá đất; một khu đầy đủ 640.000 m² là 12.800.000 BC. Preview diện tích, giá, địa hình, phần không xây được và ngân sách trước khi mua. Không thu lại tiền cho đất đã có; đất khởi đầu là grant ban đầu nhận một lần. Mở rộng thường cần giáp vùng đã sở hữu hoặc có kết nối hợp pháp; mua đảo cần phương án cầu/phà. Level mở quyền mua, không đồng nghĩa tặng tiền hoặc công trình tự vận hành.

Có preset đồng bằng, sông lớn, ven biển, đảo, thung lũng, đồi núi; mỗi preset có seed, tài nguyên và ít nhất một kết nối bên ngoài dùng được. Tránh seed khởi đầu toàn nước/đá dốc. Bản đồ có rừng, đất nông nghiệp, bãi biển, hồ và khoáng sản theo cấu hình. Hiển thị độ cao/độ dốc, đất xây được, tài nguyên, vùng ngập và kết nối ngoại vùng.

Minimap toàn vùng, north marker, thước khoảng cách, tìm công trình/địa chỉ, bookmark camera, zoom tới cảnh báo và hiển thị ranh đất. Camera đi được khắp map thật, không dừng ở giới hạn grid cũ. Terraform có khối lượng đào/đắp, tiền, xử lý công trình đã có và ảnh hưởng dòng nước; không tạo miễn phí vật liệu để bán.

Migration giữ map 38 × 38 ô cũ, ô 20 m: vùng 760 × 760 m được đặt tại origin xác định bên trong world lớn. Giữ tương quan vị trí, ID, tiền, đường, công trình và dân số; dịch tọa độ đúng một lần. Địa hình ngoài vùng cũ sinh mới; terrain vùng cũ giữ nền/cao độ tương thích. Không random lại map mỗi load.

Kiểm tra xây ở hai vị trí cách nhau hơn 5 km, mua đất giáp ranh, route qua nhiều chunk, save/load, quay camera từ góc này sang góc kia và tải bản cũ. Agent/hàng vẫn tồn tại khi chunk render unload. Ghi bộ nhớ, frame time, worker time và save size cho vùng trống lẫn vùng xây nhiều; world rộng không đồng nghĩa tự động có hàng triệu agent.
```

## Lệnh 21 — Giao thông vùng, cảng và sân bay

```text
Mở rộng mạng với cao tốc, đường gom, vòng xuyến, nút giao khác mức, làn bus riêng, đường xe đạp, bãi park-and-ride, taxi, phà, đường sắt hành khách/hàng hóa, ga, depot, cảng và sân bay. Triển khai theo chuỗi bus/bike → đường sắt → cảng/phà → sân bay; mỗi chặng có tuyến hoạt động thật.

Mỗi phương tiện có capacity, route, người lái/crew, nhiên liệu/điện, lịch, bảo trì và depot. Người đi xe đạp có vị trí liên tục, chọn mạng được phép và gửi xe; taxi có booking, pickup và fare. Xe bus riêng chỉ hưởng tốc độ khi lane graph thực sự cho phép. Park-and-ride cần còn chỗ, kết nối đi bộ và transit hoạt động.

Tàu cần block occupancy, tín hiệu, platform capacity, lịch dừng và hàng đợi; đoàn không xuyên nhau. Hàng rail được chuyển qua kho/xe tải bằng giao dịch cargo có ID. Cảng cần mặt nước đủ điều kiện, tuyến tàu, cầu bến, thiết bị bốc dỡ và cổng logistics; thiếu đường/crew thì giảm throughput. Phà có lịch, bến và boarding từng người/xe theo capacity.

Sân bay có runway/taxiway/gate, slot, nhân viên và ground handling. Máy bay chỉ xuất hiện từ scheduled trip và external demand có giới hạn; hành khách đi tiếp bằng mạng trong thành phố. Chi phí runway, terminal và máy bay tách riêng; hãng tư nhân chịu chi phí máy bay nếu city chỉ vận hành sân bay. Không biến sân bay thành máy tạo tiền vô hạn.

Kết nối vùng là market boundary có hàng đợi/capacity/travel time và giá cấu hình. Không cần mô phỏng toàn bộ thành phố ngoài map. Hàng/người rời map được ghi trạng thái transit, không tự quay lại ngay ở cổng khác. Đóng tuyến có hoàn vé/đổi tuyến theo policy và không nhân đôi hành khách.

Kiểm tra hành trình nhà → bike/bus → ga → tàu ra vùng; chuyến hàng cảng → kho → xưởng; full platform, tắc cổng cảng và sân bay thiếu điện. UI nêu nút thắt thực tế và doanh thu trừ chi phí.
```

## Lệnh 22 — Tài nguyên và chuỗi sản xuất mở rộng

```text
Thêm nông trại, nhà kính, chăn nuôi, đánh cá, trồng rừng/xưởng gỗ, mỏ đá/quặng, luyện kim, chế biến thực phẩm, vật liệu xây dựng, hóa chất, điện tử và dược phẩm. Mỗi ngành cần recipe định lượng, labor, điện/nước, diện tích, storage, giá đầu vào/đầu ra, thời gian và chất thải. Có mùa vụ và đất phù hợp cho nông nghiệp; sản lượng không được cộng chỉ vì diện tích đã tô màu.

Tài nguyên hữu hạn như quặng có deposit và lượng còn lại; khai thác giảm trữ lượng theo hàng đã tạo. Rừng có chu kỳ tăng trưởng/tái trồng; thủy sản có stock, tái sinh và giới hạn. Đất bạc màu, ô nhiễm hoặc nước thiếu làm giảm sản lượng theo cơ chế có thể xem. Khôi phục môi trường có chi phí, thời gian và hiệu quả đo được.

Chuỗi minh họa: đồng ruộng → silo → xưởng thực phẩm → kho lạnh → siêu thị → hộ; quặng → luyện kim → vật liệu → công trường; gỗ → xưởng → nội thất → cửa hàng. Hàng có đơn vị và batch; perishables có expiry/temperature và tổn thất. Thiếu input dừng batch, không cho inventory âm. Recipe và yield trong game phải bảo toàn khối lượng theo quy ước, ghi rõ phần thải.

Doanh nghiệp có vốn, đơn hàng, tín dụng, payroll, thuế, nhu cầu mở rộng và phá sản. Nhà máy tư nhân dùng vốn của firm; subsidies từ city là ledger transfer có giới hạn. External market có supply/demand và biên giá hữu hạn; không khai thác vòng mua/bán tức thì để kiếm tiền vô hạn.

Dashboard chuỗi cung ứng hiển thị nhu cầu, tồn kho, tuyến giao, lead time, labor thiếu và profit. Kiểm tra thiếu xe tải, đứt đường, cạn mỏ, mùa vụ xấu, hàng hỏng và phá sản; save/load giữ batch/order/credit không trả tiền lặp.
```

## Lệnh 23 — Giáo dục, phúc lợi, văn hóa và du lịch

```text
Thêm nhà trẻ, trường nghề, thư viện, nhà xã hội, cơ sở chăm sóc người cao tuổi, nghĩa trang/nhà hỏa táng, trung tâm thể thao, sân vận động, bảo tàng, nhà hát, quảng trường, bãi biển công cộng, khách sạn và trung tâm hội nghị. Mỗi cơ sở có footprint, owner, capacity, staff, lịch mở, chi phí cố định/biến đổi, đầu vào và điều kiện hoạt động. Công trình độc đáo dùng thiết kế riêng.

Trẻ được phân vào chỗ học theo tuổi, route và capacity; tiến bộ học tập cần attendance và thời gian, không nâng bằng cấp ngay khi xây trường. Chăm sóc dài hạn cần giường/nhân viên và ngân sách hộ hoặc hỗ trợ. Nhà xã hội có eligibility, căn trống, waiting list, rent và maintenance; không tự tăng happiness toàn map. Người mất có state và dịch vụ liên quan xử lý theo mô hình nhẹ, tránh mất ID/đếm sai dân số.

Hỗ trợ tiếp cận gồm lối vào, crossing, ramp, thang máy/ga phù hợp và route với hạn chế vận động. Người có mobility profile chọn tuyến đi được. Cảnh báo “không có tuyến tiếp cận” phải xuất phát từ graph, không chỉ từ bán kính.

Du khách có mục tiêu, lịch ở lại, ví, booking khách sạn, arrival/departure và phương thức di chuyển. Occupancy hotel, ticket và chi tiêu là giao dịch; khách đông có thể gây tắc đường/rác/ồn. Sự kiện cần địa điểm, ngân sách, nhân sự, security, sức chứa, vé và kế hoạch transit. Không spawn khách vô hạn để bù doanh thu âm.

Kiểm tra trường đầy, nhà xã hội có hàng đợi, khách không đến được khách sạn, event bị mất điện và người dùng xe lăn không qua được cầu thang. Inspector giải thích năng lực phục vụ thật, không dùng icon trang trí làm bằng chứng.
```

## Lệnh 24 — Hạ tầng nâng cao và quy hoạch chi tiết

```text
Thêm pin lưu trữ, điện mặt trời mái nhà, xử lý/tái chế rác, mạng viễn thông, hồ điều hòa, đê, trạm bơm chống ngập, tưới nông nghiệp và tùy chọn sưởi/làm mát tập trung cho map phù hợp khí hậu. Hệ thống mới phải dựa trên supply/demand/network thay vì một vòng tròn phủ sóng giả.

Pin có power kW và capacity kWh riêng, state of charge, hiệu suất và degradation; không phát ra nhiều năng lượng hơn đã nạp. Solar thay đổi theo thời tiết/ngày đêm; thêm roof solar phải kiểm tra diện tích. Rác được phân loại, thu gom, sorting yield và phần dư; vật liệu tái chế bán theo thị trường chứ không tạo tiền tự động.

Internet có nodes, cáp, capacity và service subscription; gián đoạn ảnh hưởng ngành phụ thuộc theo config. Dịch vụ tư nhân thu từ tài khoản household/firm. Nếu city đầu tư hạ tầng thì ownership và phí wholesale rõ, không thu cả subscription lẫn wholesale hai lần cho cùng khoản.

District policies thêm giới hạn chiều cao, mật độ, cây xanh, parking, giờ giao hàng, khu phát thải thấp, trợ cấp transit, ưu tiên xe khẩn cấp và phân loại rác. Luật có tác động mô phỏng/chi phí và độ trễ; không thay tất cả người/nhà ngay trong một frame. Hộ/firm phải có quyền chọn di chuyển/đổi hoạt động khi điều kiện thay đổi.

Quy hoạch hỗn hợp cho retail tầng trệt + nhà ở tầng trên có capacity/entrance/owner ledger tách rõ. Tái phát triển có relocation, đền bù, hợp đồng và mất capacity tạm thời. Preview tổng chi trước phá dỡ; không xóa cư dân rồi tạo lại với ví mặc định.

Thêm upgrade level 1–5 cho nhà ở, khu ở và công trình có khả năng nâng cấp; các điều kiện, chi phí và thay đổi công suất tại Phụ lục F. Upgrade là hợp đồng có tiền/vật tư/crew/thời gian, không chỉ đổi màu mesh. Khu ở nâng cấp hạ tầng chung; từng tòa nhà chỉ nâng nếu đáp ứng điều kiện riêng. Không coi toàn bộ district lên cấp khi một nhà đã nâng. Công trình công dùng treasury; nhà tư nhân dùng vốn owner/firm và trợ cấp city nếu người chơi chủ động chọn.

Kiểm tra pin cạn, quá tải cáp, nhà máy tái chế thiếu xe, đổi policy ảnh hưởng có nguyên nhân và tái định cư không mất hộ/tiền.
```

## Lệnh 25 — Thời tiết, thiên tai và khả năng phục hồi

```text
Thêm mưa, hạn, sóng nóng/lạnh, gió mạnh, cháy lan và ngập theo preset khí hậu. Cơ chế risk dựa trên terrain, dòng nước, dryness, nguồn cháy, condition và hoạt động; có seed và config công khai. Động đất/bão lớn là scenario tùy chọn, không random phá city khi chế độ thiên tai đã tắt.

Nước mưa theo lưu vực, khả năng thấm, thoát nước, capacity bơm và mực sông; mô hình đơn giản phải ghi giới hạn, không quảng cáo là công cụ dự báo ngoài đời. Đê có cao trình/condition; hồ điều hòa có thể tích; máy bơm cần điện và nơi xả. San lấp làm thay đổi dòng chảy thật trong mô hình.

Khi xảy ra sự cố: phát cảnh báo, đóng vùng nguy hiểm, route sơ tán tới shelter có capacity, dispatch crews, đánh giá damage và chi sửa. Shelter cần staff, vật tư và sanitation. Hộ đi sơ tán bằng mạng còn sử dụng được, không teleport và không vừa ở nhà vừa ở shelter. Kiểm tra ưu tiên người dễ bị tổn thương theo config.

Cho người chơi chọn thiên tai Off/Low/Standard khi tạo casual city; ranked dùng rule chung. Scenario disasters có objective và report. Mất điện dây chuyền, bẩn nguồn nước và thất thoát hàng phải là event có ledger/causal chain, không gán phần trăm damage cho toàn thành phố tùy ý.

Kiểm tra ngập đường dẫn tới clinic, bơm mất điện, shelter full, đóng cầu khi bus đang đi và repair sau sự cố. Save/load giữa sơ tán giữ người, hàng, condition và tiền.
```

## Lệnh 26 — Nhiệm vụ, thưởng cấp và mục tiêu dài hạn

```text
Tạo sổ nhiệm vụ theo cấp, tutorial, achievement và scenario; mỗi mission có ID/version, mô tả tiếng Việt, prerequisites, điều kiện định lượng, progress, duration, XP/reward và receipt. Triển khai đủ 100 bậc × 3 nhiệm vụ A/B/C tại Phụ lục E, tức 300 nhiệm vụ chính, không chỉ làm 10 mẫu rồi ghi đã đủ 100. Cấp thành phố tối đa 100; dùng công thức EXP tại Lệnh 18. UI cho biết tiến độ đo được, số EXP sẽ nhận và lý do chưa hoàn tất. Thưởng nhiệm vụ được cấu hình riêng, không tự nhân bằng thưởng lên cấp.

Chỉ đánh dấu mission available khi subsystem cần thiết đã hoạt động thật. Trong lúc triển khai, bậc phụ thuộc tính năng chưa làm hiển thị “Chưa triển khai” trong catalog, không có nút claim giả. Có dependency graph; kiểm tra không có vòng lặp như đòi metro để mở khóa metro. Với map không có biển/quặng hoặc thiên tai tắt, thay objective bằng biến thể tương đương cùng reward/rule đã định sẵn, không chặn người chơi ở một level.

Nhóm đầu: nối đường ngoài vùng, nhà có người ở, cấp đủ điện/nước, tạo việc và hoàn thành một chuyến đi làm. Nhóm giữa: bus có hành khách thật, thu gom rác, giao hàng từ xưởng, xử lý nước thải và cân ngân sách. Nhóm cao: kết nối rail/cảng, giảm commute, tỷ lệ đi transit, mở đại học, năng lượng sạch và khôi phục sau thiên tai. Điều kiện cần mẫu số/cửa sổ đo rõ để không hoàn thành do một frame ngẫu nhiên hoặc dân số bằng 0.

Nhiệm vụ ngắn khởi đầu có thể hoàn thành trong vài phút game ở tỷ lệ 1:5. Milestone dài vẫn dùng ngày/tháng game thật và hiển thị thời gian dự kiến. Không bắt người mới chờ 1 ngày game (4 giờ 48 phút thực) chỉ để biết tutorial đúng; không âm thầm nén ngày trong mission.

Thưởng lên cấp: mỗi bước level city tăng +100 triệu đơn vị tiền game hiển thị, dùng quy đổi nhất quán tại Lệnh 18. Claim một lần, receipt durable; UI có “Đã nhận”. Chuỗi nhiệm vụ có giới hạn/rule để phá-xây, bỏ dân rồi nhận lại, reset hoặc tạo thêm city không farm grants trên BXH. Offline casual có receipt local; chuyển lên ranked phải được server kiểm chứng, không nhận lại khoản đã có.

Có challenge riêng: thành phố ven biển, vùng công nghiệp, nông nghiệp, transit-first, cứu ngân sách và phục hồi ngập. Mỗi challenge có map seed, objective, giới hạn, difficulty và điều kiện thắng/thua. Sandbox tách bảng ranked. Season không tự reset save, thưởng không quy đổi ra tiền thật.

Kiểm tra qua nhiều cấp cùng lúc, retry claim, reload, hai tab, reconnect, đổi rule và import save. Giữ badge/level account khác city; không lấy level casual tự khai làm level BXH verified.
```

## Lệnh 27 — Công cụ xây dựng và trải nghiệm chơi

```text
Thêm blueprint, công cụ đo, grid tùy chọn, snap đường, align công trình, mass upgrade, tìm kiếm asset tiếng Việt, favorite và undo/redo có giới hạn. Blueprint lưu hình học/tham số, không mang theo cư dân/tiền/XP/receipts. Đặt blueprint cần đất, slope, vật tư và báo tổng giá từng hạng mục; overlap hoặc thiếu funds phải fail/commit theo policy rõ, không đặt nửa công trình mà trừ hết tiền.

Map editor cho seed/terrain/resources/external connections và kiểm tra map chơi được. Custom map/mod rules được gắn nhãn casual; dữ liệu import validate kích thước, số entity và references. Ưu tiên JSON schema, không chạy script tùy ý từ bản đồ tải vào. Không cần xây chợ mod hoặc multiplayer trong phạm vi này.

Photo mode, camera tự do, theo dõi người/xe, timelapse từ frame capture được người dùng bật, xuất ảnh và chia sẻ thành phố dạng read-only. Chia sẻ chỉ sau thao tác chủ sở hữu; không tự public save, username identity private hoặc recovery data. Gallery là chức năng chỉ hiện nếu backend chia sẻ thực sự hoạt động.

Âm thanh môi trường do vị trí/sự kiện, có mute và volume; assets có giấy phép. UI keyboard/touch, remap shortcuts cơ bản, text scaling, colorblind palette, reduced motion và hướng dẫn cơ chế. Có notification inbox, pin cảnh báo, lọc ưu tiên và giúp người chơi tìm nguyên nhân tại công trình.

Statistics export gồm CSV ngân sách/traffic/service, không bao gồm secrets hoặc dữ liệu Auth. Có lịch sử save, autosave/checkpoint rõ, backup/download và import validation; hiển thị save revision và xung đột thay vì ghi đè im lặng.

Kiểm tra đặt blueprint sát ranh đất/cầu, undo sau giao dịch, mobile gestures, save lớn, export, import hỏng và share private/off. Bàn giao docs/features-catalog.md ghi từng tính năng: hoạt động, đơn giản hóa, chưa làm; không có nút giả báo thành công.
```

## Lệnh 28 — Kiểm chứng toàn hệ thống, GitHub và Vercel

```text
Chạy kiểm tra phù hợp, build production và browser QA trên game thực. Tạo một kịch bản chơi được: một hộ tới thành phố, thuê nhà, tìm việc, đi làm, mua hàng, dùng bus, trả tiền và thuế; xưởng nhận hàng, sản xuất, giao cửa hàng; dịch vụ nhận và xử lý một yêu cầu. Có thể theo dõi từng thực thể xuyên suốt.

Tạo deterministic test scenarios và invariants: ID duy nhất; population = Citizen count; occupancy không vượt capacity; vehicle capacity không vượt; hàng không âm; không giao hàng trước arrival; không đồng thời ở nhà và trên xe; ledger đối chiếu; đường/vỉa hè hợp lệ; payroll/refund không lặp; save/load không nhân đôi thực thể; cùng seed replay nhất quán.

Thử thực tế các ca khó: thiếu điện, nước bẩn, tắc giao lộ, thiếu nhân viên, mất việc, nợ quá mức, full bus, full hospital, công trường thiếu vật tư, phá tuyến đang có xe và conflict cloud. Các hệ thống phải suy giảm có lý do và phục hồi được.

Kiểm tra form đăng ký đúng 3 ô và login đúng 2 ô; profile/first city được tạo một lần; username unique; recovery bằng mã thật; Supabase RLS với hai tài khoản; verified BXH level/tiền và các trường hợp sửa score. Kiểm tra Chrome và Safari nếu có môi trường, desktop/mobile; ghi rõ browser/device nào thực sự đã kiểm tra. Test giả lập Supabase không được ghi là đã kiểm tra Auth/RLS/BXH server thật. Cho tôi một báo cáo ngắn về khả năng đã làm được và giới hạn còn lại.

Chuẩn bị GitHub repository theo tôi chỉ định, commit mã cùng lockfile, migration và hướng dẫn. Không commit .env, token, local Auth session hoặc save của tôi. Cấu hình Vercel từ package/project hiện tại, biến môi trường đúng; tách frontend publishable key khỏi server-only admin key. Username Auth không phụ thuộc email redirect; chỉ giữ Site URL/Redirect URLs cho luồng tương thích cũ hoặc provider thật nếu có. Nếu cần quyền tài khoản thì yêu cầu tôi kết nối.

Deploy khi có quyền, kiểm tra trạng thái deployment thành công và smoke test production Auth/save trước khi báo hoàn thành. Nếu deploy thất bại, sửa nguyên nhân cụ thể và deploy lại; không đưa URL chưa hoạt động như kết quả hoàn tất.

Bàn giao README, ASSET_LICENSES, schema/migrations, hướng dẫn backup/restore, docs/implementation-status, báo cáo hiệu năng và danh sách giới hạn. Game vẫn phải chơi được khi chưa có API AI và chưa bật tài khoản, với local save rõ ràng.
```

## Phụ lục A — Bảng chi phí BC để Codex triển khai

**Tất cả số dưới đây là mặc định thiết kế game, có thể hiệu chỉnh.** Chi phí bảo trì cố định trong bảng **không gồm** wages, nhiên liệu, điện, nước, vật tư hoặc lãi vay, trừ khi một hàng ghi rõ khác. Các khoản đó tính riêng theo thực tế sử dụng để tránh trừ hai lần.

### A1. Hạ tầng theo khối lượng

| Hạng mục | Đơn vị | Chi xây cơ sở | Bảo trì cố định mỗi tháng |
| --- | --- | ---: | ---: |
| Mặt/nền đường hai làn | m² | 50 BC | 0,04 BC |
| Mặt/nền đường bốn làn | m² | 65 BC | 0,06 BC |
| Mặt/nền đường sáu làn | m² | 80 BC | 0,08 BC |
| Mặt/nền cao tốc | m² | 95 BC | 0,09 BC |
| Vỉa hè/lối đi bộ | m² | 25 BC | 0,015 BC |
| Lối xe đạp | m² | 30 BC | 0,02 BC |
| Mặt/nền cầu | m² | 350 BC | 0,30 BC |
| Trụ cầu | trụ | 25.000 BC | 20 BC |
| Hầm đường bộ | m² mặt cắt quy đổi của segment | 650 BC | 0,50 BC |
| Portal hầm | đầu hầm | 150.000 BC | 250 BC |
| Đào/đắp đất | m³ | 12 BC | — |
| Cáp điện phân phối | m | 35 BC | 0,03 BC |
| Ống nước | m | 45 BC | 0,04 BC |
| Cống nước thải | m | 55 BC | 0,05 BC |
| Đường ray tram hai chiều | m tuyến | 800 BC | 0,80 BC |
| Metro ngầm hai chiều | m tuyến | 4.000 BC | 4 BC |
| Đèn tín hiệu | giao lộ | 12.000 BC | 50 BC |
| Điểm crossing có tín hiệu | điểm | 4.000 BC | 20 BC |

Quy ước hầm đường bộ: khối lượng quy đổi = chiều dài centerline × chiều rộng roadbed; đơn giá này là gói hầm game, không tính thêm mặt/nền đường thường. Cầu dùng giá mặt/nền cầu thay cho mặt/nền thường, rồi cộng trụ. Tram/metro dùng m tuyến đã gồm hai chiều ray; không nhân hai lần vì có hai hướng. Đất, đấu nối và công việc khác cộng theo cấu hình, tránh trùng hạng mục.

Ví dụ đường phố 100 m: roadbed 12 m → 1.200 m² × 50 = 60.000 BC. Hai vỉa hè rộng 2 m → 400 m² × 25 = 10.000 BC. Chọn cáp + nước + cống 100 m → 13.500 BC. Tổng trực tiếp 83.500 BC; dự phòng 10% → 8.350 BC; **cam kết 91.850 BC**, trước mua đất và đào/đắp phát sinh. Dự phòng chỉ thành expense khi được sử dụng.

### A2. Công trình, công suất và bảo trì

| Công trình/tier | Chi xây cơ sở | Công suất/chỗ | Bảo trì cố định/tháng | Nhân sự dự kiến khi đủ tải |
| --- | ---: | --- | ---: | ---: |
| Trạm phân phối điện | 250.000 BC | 5 MW truyền tải | 800 BC | 3 |
| Turbine gió | 2.000.000 BC | 2 MW danh định, phụ thuộc gió | 3.000 BC | 4 |
| Điện mặt trời | 1.200.000 BC | 1 MW danh định, phụ thuộc nắng | 1.500 BC | 3 |
| Máy phát dự phòng | 350.000 BC | 0,5 MW, cần nhiên liệu | 1.000 BC | 3 |
| Trạm bơm/cấp nước | 650.000 BC | 5.000 m³/ngày | 2.000 BC | 6 |
| Bể chứa nước | 200.000 BC | 2.000 m³ | 500 BC | 1 |
| Xử lý nước thải | 1.200.000 BC | 5.000 m³/ngày | 4.000 BC | 8 |
| Trạm trung chuyển rác | 300.000 BC | 100 tấn lưu tạm | 1.000 BC | 5 |
| Khu xử lý/chôn lấp | 800.000 BC | 10.000 tấn tổng sức chứa; 20 tấn/ngày xử lý | 3.000 BC | 8 |
| Trường tiểu học | 1.500.000 BC | 300 học sinh | 3.000 BC | 18 |
| Trường trung học | 2.500.000 BC | 500 học sinh | 5.000 BC | 28 |
| Cơ sở đại học nhỏ | 8.000.000 BC | 1.000 sinh viên | 12.000 BC | 60 |
| Phòng khám | 1.200.000 BC | 8 phòng, 80 lượt/ngày tối đa | 3.000 BC | 15 |
| Bệnh viện nhỏ | 6.000.000 BC | 60 giường, 20 phòng khám | 12.000 BC | 70 |
| Trạm cứu hỏa | 900.000 BC | gara 2 xe; xe mua riêng | 2.000 BC | 12 |
| Trạm cảnh sát | 800.000 BC | gara 3 xe; xe mua riêng | 2.000 BC | 12 |
| Depot bus | 900.000 BC | 10 chỗ xe; xe mua riêng | 2.500 BC | 8 nhân sự depot, chưa gồm driver |
| Điểm dừng bus | 12.000 BC | hàng đợi vật lý theo footprint | 30 BC | 0 |
| Depot tram | 2.500.000 BC | 6 đoàn; đoàn mua riêng | 5.000 BC | 15, chưa gồm driver |
| Trạm tram | 100.000 BC | theo chiều dài platform | 250 BC | 0–2 |
| Depot metro | 8.000.000 BC | 8 đoàn; đoàn mua riêng | 12.000 BC | 30, chưa gồm driver |
| Trạm metro | 4.000.000 BC | 2 platform | 6.000 BC | 8 |
| Công viên nhỏ | 150.000 BC | 2.000 m²; 100 khách đồng thời | 300 BC | 2 |
| Bãi đỗ xe mặt đất | 60 BC/m² | 30 m²/chỗ gồm circulation | 0,04 BC/m² | 1 nhân viên/100 chỗ |
| Nhà kho công cộng | 400.000 BC | 500 tấn hàng | 1.000 BC | 6 |

Công suất vận hành thực phụ thuộc ca/staff, đầu vào, equipment, condition và nguồn điện; công suất danh định không tự bảo đảm phục vụ toàn bộ. Giá trường/bệnh viện đã gồm thiết bị cơ bản trong tier; không cộng lại thiết bị cơ bản, chỉ cộng thiết bị hoặc capacity nâng cấp.

### A3. Xe và vận hành biến đổi

| Loại | Giá mua | Sức chứa/tải | Bảo trì cố định/tháng, chưa gồm vận hành |
| --- | ---: | --- | ---: |
| Ô tô hộ gia đình | 25.000 BC | 4 người | 50 BC |
| Xe máy | 3.000 BC | 2 người | 10 BC |
| Bus tiêu chuẩn | 180.000 BC | 40 ghế + 20 đứng | 400 BC |
| Xe tải | 100.000 BC | 12 tấn | 250 BC |
| Xe rác | 150.000 BC | 8 tấn | 350 BC |
| Xe cứu thương | 120.000 BC | 1 bệnh nhân + tổ trực | 300 BC |
| Xe cứu hỏa | 250.000 BC | tổ 4 người; bồn 3 m³ | 500 BC |
| Xe cảnh sát | 45.000 BC | tổ 2 người | 100 BC |
| Đoàn tram | 1.200.000 BC | 180 người | 1.500 BC |
| Đoàn metro | 4.500.000 BC | 600 người | 5.000 BC |

Nhiên liệu mặc định 1,5 BC/lít. Tiêu hao cơ sở: ô tô 0,07 lít/km, bus 0,30, xe tải 0,28, xe rác 0,35; thêm idle/load theo cấu hình. Điện/nước giá cơ sở bán cho khách: 0,20 BC/kWh, 1,50 BC/m³. Không dùng giá bán như chi phí sản xuất của mọi nguồn. Mỗi nguồn có input/efficiency riêng; nhà cung cấp ghi doanh thu từ bill và chi phí riêng.

Giá vé mặc định: bus 2 BC, tram 2,5 BC, metro 3 BC; cấu hình transfer window và discount. Parking mặc định 1 BC/giờ, có trần/ngày và policy miễn phí theo district. Public operator thu vé; private operator chỉ chuyển thành phố phần thuế/nhượng quyền đã thiết kế.

### A4. Nhà và công trình tư nhân

| Loại | Mô hình giá cơ sở | Sức chứa khởi tạo |
| --- | --- | --- |
| Nhà thấp tầng | 900 BC/m² sàn, chưa gồm đất | 80 m²/căn; 4 người/căn |
| Chung cư thấp/trung tầng | 1.100 BC/m² sàn, chưa gồm đất | 60 m²/căn; 3 người/căn |
| Chung cư cao tầng | 1.400 BC/m² sàn, chưa gồm đất | 60 m²/căn; theo số căn thật |
| Cửa hàng | 1.000 BC/m² sàn, chưa gồm đất/tồn kho | jobs theo loại và diện tích |
| Nhà xưởng | 800 BC/m² sàn + equipment theo ngành | jobs/capacity theo dây chuyền |
| Kho tư nhân | 600 BC/m² sàn + equipment | capacity theo thiết kế |

Nhà đầu tư tư nhân trả chi phí này, có tài khoản và khả năng vay được mô tả. Thành phố thu phí quy hoạch/giấy phép theo config; không trả tiền xây toàn bộ nhà chỉ vì tô khu dân cư.

Đất đầu kỳ: 20 BC/m² ở vùng cơ sở, nhân land-value index 0,5–5 dựa trên mô phỏng. Giá thuê xuất phát từ nguyên giá, condition, demand và affordability; để default annual rent yield 5% làm điểm khởi tạo, không gán nó như lợi suất ngoài đời. Giá thuê tháng tính theo phần căn và không đồng thời thu tiền mua nhà lẫn thuê cùng kỳ cho cùng hợp đồng.

### A5. Thuế, tiền lương, khoản vay và thời gian xây

- Tiền thành phố mới mặc định: 12.000.000 BC ở normal. Private capital và tiết kiệm hộ tách khỏi municipal cash. Sandbox có ngân sách không giới hạn nhưng gắn nhãn rõ, không ảnh hưởng bản normal.
- Wages khởi tạo theo nhóm công việc: cơ bản 1.600 BC/người/tháng; skilled 2.200; professional 3.000. Vai trò giáo viên/bác sĩ/kỹ sư/driver có bảng riêng, ca và kỹ năng. Đây là cấu hình cân bằng game.
- Income tax 10% wages thực trả; corporate tax 10% taxable profit dương; property tax 0,8% assessed value/năm. Cho cấu hình khoảng thuế phù hợp thiết kế, hiển thị đúng căn cứ tính và không tính lại trên cùng giao dịch.
- Lãi vay khởi tạo 5%/năm, term và lịch gốc rõ. Tính theo dư nợ và ngày lịch, không trừ 5% mỗi tháng. Trả gốc không gọi là chi phí lợi nhuận, nhưng vẫn là cash outflow.
- Gói công trình cơ sở: dự phòng 10% trên direct construction subtotal. Tiền mua đất, thuế/phí và khoản escrow trình bày riêng. Dự phòng chưa dùng được giải phóng sau nghiệm thu.
- Thời gian hợp đồng: đường 100 m 2–5 ngày mô phỏng; park 10 ngày; trạm utility 20–40; school/clinic 40–60; hospital 90–150; metro theo khối lượng và crews. Đây là thời gian game, phụ thuộc vật tư/staff và có sandbox instant-build.
- Do tỷ lệ thời gian mới 1:5, cung cấp preset “Xây dựng rút gọn” cho casual, chọn rõ khi tạo thành phố: đường 100 m 5–15 phút game, park 15–30 phút, utility nhỏ 30–60 phút, school/clinic 1–2 giờ, hospital 4–8 giờ. Chỉ thay work-required của hợp đồng bằng cấu hình đã công bố; vẫn cần crews, vật tư, tiền và đường tiếp cận. Preset “Thi công dài” giữ số ngày phía trên. Ranked chọn một preset chung cho cả mùa và ghi vào rule version. Không tự áp dụng instant-build cho normal hoặc nhảy thời gian của toàn thành phố để hoàn thành công trường.
- Giấy phép/quy hoạch: 2 BC/m² đất được cấp phép là default game. Không thu mỗi lần người chơi preview/tô lại cùng một vùng chưa thay đổi.
- Khi hiệu chỉnh giá, giữ invariant kế toán và test scenario. Viết docs/economy-balance.md, ghi default, công thức, giả định, các kịch bản thu/chi và điểm dễ phá cân bằng. Không tăng bonus tự động chỉ để che một hệ thống kinh tế chưa cân đối.

## Phụ lục B — Chuỗi minh họa bắt buộc cho “người đi như thật”

1. Hộ được tạo với ngân sách và thành viên; chọn căn trống, ký hợp đồng.
2. Hộ đi vào thành phố và đến nhà; occupancy cập nhật khi chuyển vào hoàn tất.
3. Một người đủ điều kiện nhận việc tại firm có job vacancy, wages và ca.
4. Người tính route/ETA, rời cửa nhà, đi trên sidewalk, qua crossing hợp lệ.
5. Nếu chọn bus: tới stop, đứng chờ, bus tới, kiểm tra capacity, trả fare, lên xe, xuống đúng stop, đi bộ chặng cuối.
6. Đến cổng nơi làm mới ghi arrival/attendance. Trễ do tắc đường hiển thị reason chain.
7. Firm dùng labor/inputs để sản xuất. Hàng tồn thay đổi sau sản xuất/giao hàng, tiền lương vào đúng kỳ.
8. Người sau ca tới cửa hàng mở cửa còn hàng; mua trong khả năng chi trả, hộ/firm/thuế cập nhật đúng giao dịch.
9. Người về nhà, ăn/nghỉ/ngủ theo lịch. Household ledger có rent/utility/taxes theo căn cứ.
10. Save giữa bước bất kỳ, load lại vẫn cùng ID, vị trí/hành trình/hộ/tiền; không spawn bản sao và không auto-complete cả ngày.

## Phụ lục C — Tiêu chí để nghiệm thu một chặng

- Có interaction thật trong game và dữ liệu core tương ứng.
- Có trạng thái đang làm, hoàn tất và thất bại có nguyên nhân.
- Save/load đúng dữ liệu mới và migration bản cũ.
- Có test phù hợp, chạy build và kiểm tra UI phần đã thay đổi.
- Có một scenario người chơi quan sát được để chứng minh.
- Chức năng còn mô phỏng đơn giản phải được ghi rõ; không dùng animation trang trí làm bằng chứng cho logic đã hoàn thành.
- Không có tài nguyên chưa rõ quyền sử dụng; không có secret trong client/repo.

## Phụ lục D — Chi phí và năng lực của công trình bổ sung

Giá thiết kế game, không phải báo giá thật. Nguyên giá dưới đây chưa gồm đất, đường tiếp cận, tuyến/cáp, xe hoặc đoàn tàu mua riêng. Bảo trì/tháng chưa gồm wages, vật tư, điện/nước, nhiên liệu và lãi. Công suất tối đa chỉ đạt khi có đủ nhân lực/đầu vào, dùng đúng thời gian game. Các cơ sở tư nhân do owner trả tiền. Asset catalog phải thêm footprint, cổng vào, construction work, inputs, staffing theo ca và unlocks trước khi cho xây.

| Công trình | Nguyên giá BC | Công suất thiết kế | Bảo trì BC/tháng | Nhân viên thiết kế |
|---|---:|---|---:|---:|
| Bãi park-and-ride | 300.000 | 100 ô, chưa gồm tuyến bus | 800 | 3 |
| Ga hành khách nhỏ | 2.000.000 | 2 sân ga, 300 người chờ | 4.000 | 12 |
| Ga hàng hóa | 3.000.000 | 200 tấn/ngày | 6.000 | 20 |
| Bến phà | 700.000 | 1 cầu bến, 100 người chờ | 1.500 | 5 |
| Cảng hàng hóa nhỏ | 8.000.000 | 1 cầu bến, 500 tấn/ngày | 15.000 | 40 |
| Sân bay vùng nhỏ | 15.000.000 | 1 runway, 2 gate, 12 lượt cất/hạ cánh/ngày | 30.000 | 80 |
| Nông trại | 200.000 | 10 ha, 100 tấn thu hoạch/vụ khi đủ điều kiện | 1.000 | 12 |
| Nhà kính | 500.000 | 1 ha, 2 tấn/ngày | 2.000 | 10 |
| Trại chăn nuôi | 450.000 | 100 vật nuôi; recipe cấu hình theo loại | 1.500 | 10 |
| Cơ sở đánh cá | 400.000 | xử lý 10 tấn/ngày, tàu mua riêng | 1.200 | 8 |
| Lâm trường | 300.000 | 20 ha, khai thác theo tuổi cây/trữ lượng | 1.000 | 10 |
| Xưởng gỗ | 800.000 | 20 tấn input/ngày | 2.500 | 16 |
| Mỏ đá/quặng nhỏ | 1.500.000 | 50 tấn/ngày, hữu hạn theo deposit | 4.000 | 20 |
| Xưởng thực phẩm | 1.200.000 | 15 tấn input/ngày | 3.000 | 24 |
| Xưởng vật liệu | 1.800.000 | 30 tấn input/ngày | 4.000 | 24 |
| Nhà máy luyện kim | 4.000.000 | 40 tấn input/ngày | 9.000 | 40 |
| Nhà máy điện tử | 3.000.000 | 500 sản phẩm/ngày theo recipe | 6.000 | 36 |
| Nhà máy dược | 3.500.000 | 1.000 đơn vị thuốc/ngày theo recipe | 7.000 | 40 |
| Kho lạnh | 800.000 | 200 tấn storage | 2.000 | 10 |
| Nhà trẻ | 600.000 | 60 trẻ | 1.500 | 12 |
| Trường nghề | 2.000.000 | 200 học viên | 4.000 | 20 |
| Thư viện | 700.000 | 100 người đồng thời | 1.500 | 6 |
| Cơ sở chăm sóc người cao tuổi | 2.000.000 | 40 giường | 4.000 | 24 |
| Khu nhà xã hội | 3.000.000 | 40 căn × tối đa 3 người | 5.000 | 6 quản lý/bảo trì |
| Nghĩa trang | 700.000 | 1.000 chỗ tổng | 1.500 | 6 |
| Nhà hỏa táng | 1.000.000 | 8 ca/ngày | 2.500 | 8 |
| Trung tâm thể thao | 1.200.000 | 150 người đồng thời | 3.000 | 12 |
| Sân vận động nhỏ | 5.000.000 | 5.000 chỗ | 10.000 | 30, event crew riêng |
| Bảo tàng | 2.000.000 | 200 khách đồng thời | 4.000 | 16 |
| Nhà hát | 2.500.000 | 300 ghế | 5.000 | 20 |
| Khách sạn | 2.000.000 | 50 phòng × 2 khách | 4.000 | 20 |
| Trung tâm hội nghị | 3.500.000 | 500 chỗ | 7.000 | 24 |
| Pin lưu trữ | 1.000.000 | 1 MW / 2 MWh | 2.000 | 2 |
| Trung tâm tái chế | 1.800.000 | 30 tấn input/ngày | 4.000 | 20 |
| Trạm viễn thông | 300.000 | 500 thuê bao theo network capacity | 800 | 3 |
| Hồ điều hòa | 400.000 | 10.000 m³ | 1.000 | 2 |
| Trạm bơm chống ngập | 600.000 | 0,2 m³/s khi đủ điện | 1.500 | 4 |
| Shelter | 500.000 | 100 người tạm trú | 1.000 | 6, surge staff riêng |

Đơn giá bổ sung: đường ray đôi 1.000 BC/m tuyến, cáp viễn thông 15 BC/m, đường xe đạp theo A1, đê 250 BC/m³ đắp. Roof solar 150 BC/m², công suất giả định 0,15 kW/m². Đoàn tàu vùng 3.000.000 BC/đoàn, 300 ghế; locomotive hàng 2.000.000 BC, wagon 120.000 BC/60 tấn; phà hành khách 800.000 BC/100 người. Đây là thông số cân bằng, có recipe vận hành riêng; không coi công suất tối đa như doanh thu bảo đảm.

## Phụ lục E — 100 bậc nhiệm vụ tăng dần, 300 nhiệm vụ có EXP

Bậc nhiệm vụ khác cấp hiện tại khi người chơi nhận EXP từ milestone khác. Hoàn thành bậc trước mở bậc sau; từng A/B/C có thể nhận EXP riêng. ID dạng `campaign:v1:tier:001:A`; server kiểm chứng và receipt ngăn nhận lại. “Có” nghĩa công trình đang hoạt động, có route và đủ nguồn lực, không chỉ đặt mesh. “Giao/chuyến/phục vụ” cần arrival/completion event thật.

EXP bậc n từ 1–99: T = 500 + 250 × (n−1), chia A/B/C = floor(40% T), floor(35% T), phần còn lại. Bậc 100: mỗi nhiệm vụ 10.000 EXP. Mỗi bước tăng cấp 2–100 nhận 100 triệu đơn vị tiền game hiển thị một lần, tách reward mission. Không trả grant vì level 1 hoặc EXP thêm ở cap 100.

Đo các tỷ lệ bằng cửa sổ 15 phút game mặc định (3 phút thực); bậc cuối có thể yêu cầu 60 phút game (12 phút thực). Các điều kiện dân cư/utility phải giữ đủ cửa sổ; denominator bằng 0 không đạt. Người mới có nhiệm vụ thao tác và chuyến đầu để thấy kết quả ngay. Hạn chế các yêu cầu chờ ngày/tháng trong chuỗi chính ở tỷ lệ 1:5.

Counters sự kiện đếm từ lúc mission mở; mục tiêu state hiện tại có thể công nhận hạ tầng đã xây tốt. Công khai policy này trong UI. Không bắt phá-xây lại công trình cũ để hoàn thành. Coverage utility = cư dân/hộ đủ lượng được cấp qua network hợp lệ; employment = employed/labor force; transit share = chuyến transit hoàn tất/tổng chuyến phù hợp; satisfaction theo core. Đổi định nghĩa chỉ qua rule version. Doanh thu/profit missions dùng giao dịch đã đối chiếu; grants/loans không là sales/profit.

| Bậc | Nhiệm vụ A | Nhiệm vụ B | Nhiệm vụ C |
|---:|---|---|---|
| 1 | Nối 100 m đường với cổng vùng | Cấp điện và nước cho khu khởi đầu | Đón 10 cư dân có nhà |
| 2 | Có 20 cư dân có chỗ ở | Tạo 5 việc làm được nhận | Hoàn tất 5 chuyến đi làm |
| 3 | Có 30 cư dân | Có 1 cửa hàng đang mở | Hoàn tất 10 lượt mua hàng |
| 4 | Có 40 cư dân | Xử lý nước thải cho 80% hộ | Hoàn tất 1 chuyến thu gom rác |
| 5 | Có 50 cư dân | Tạo 10 việc làm được nhận | Có 1 công viên đón 10 lượt khách |
| 6 | Có 60 cư dân | Có clinic đủ staff | Hoàn tất 5 lượt khám |
| 7 | Có 75 cư dân | Có 1 trường nhận 10 học sinh | Hoàn tất 10 lượt đến lớp |
| 8 | Có 90 cư dân | Có lực lượng cứu hỏa sẵn sàng | Hoàn tất 1 diễn tập phản ứng |
| 9 | Có 100 cư dân | Có đồn cảnh sát đủ staff | Hoàn tất 10 lượt tuần tra |
| 10 | Điện/nước đủ cho 90% hộ | Nâng cấp 1 nhà lên cấp 2 | Hoàn tất 50 chuyến có đích |
| 11 | Có 125 cư dân | Có 1 kho được nối đường | Giao 10 tấn hàng tới kho |
| 12 | Có 150 cư dân | Có 1 xưởng hoạt động | Giao 5 batch sản phẩm |
| 13 | Có 175 cư dân | Có tuyến bus 3 điểm dừng | Hoàn tất 20 chuyến đi bus |
| 14 | Có 200 cư dân | Có 5 điểm qua đường hợp lệ | Hoàn tất 50 chuyến đi bộ |
| 15 | Có 225 cư dân | Có 50 lao động có việc | Nâng 3 nhà lên cấp 2 |
| 16 | Có 250 cư dân | Có tuyến xe đạp 500 m liên thông | Hoàn tất 20 chuyến xe đạp |
| 17 | Có 275 cư dân | Có parking 20 chỗ | Hoàn tất 20 lượt đỗ/trả phí |
| 18 | Có 300 cư dân | Mua thêm 1 lô đất 200 m | Nối đường tới lô mới |
| 19 | Có 325 cư dân | Thu gom rác cho 90% hộ | Giao 5 tấn rác tới cơ sở xử lý |
| 20 | Có 350 cư dân | Employment đạt 75% | Cân đối 100 giao dịch ledger |
| 21 | Có 400 cư dân | Mở district thứ hai | Có 2 khu ở được cấp utility |
| 22 | Có 450 cư dân | Có nhà trẻ nhận 10 trẻ | Hoàn tất 20 lượt đưa/đón |
| 23 | Có 500 cư dân | Có thư viện hoạt động | Phục vụ 30 lượt đọc sách |
| 24 | Có 550 cư dân | Có nông trại/biến thể nhập nông sản | Nhận 5 tấn nông sản hợp lệ |
| 25 | Có 600 cư dân | Có xưởng thực phẩm | Giao 5 tấn thực phẩm tới cửa hàng |
| 26 | Có 650 cư dân | Có 2 tuyến bus hoạt động | Hoàn tất 100 chuyến đi bus |
| 27 | Có 700 cư dân | Nâng 5 nhà lên cấp 2 | Giữ điện/nước đủ 95% hộ |
| 28 | Có 750 cư dân | Có 2 clinic đủ staff | Xử lý 30 lượt khám |
| 29 | Có 800 cư dân | Có xe tải và tuyến giao hợp lệ | Hoàn tất 20 đơn hàng |
| 30 | Có 850 cư dân | Transit share đạt 10% | Satisfaction đạt 60/100 |
| 31 | Có 900 cư dân | Có trường nghề hoạt động | Nhận 30 học viên vào học |
| 32 | Có 1.000 cư dân | Có nhà xã hội 10 căn được thuê | Có 20 người được bố trí nhà |
| 33 | Có 1.100 cư dân | Có trung tâm thể thao | Phục vụ 50 lượt hoạt động |
| 34 | Có 1.200 cư dân | Có lâm trường/nguồn gỗ nhập | Giao 10 tấn gỗ tới xưởng |
| 35 | Có 1.300 cư dân | Có xưởng vật liệu | Giao vật tư tới 3 công trường |
| 36 | Có 1.400 cư dân | Có 1 kho lạnh | Giao 10 batch không hỏng |
| 37 | Có 1.500 cư dân | Mua thêm 3 lô đất | Hoàn tất 500 m đường liên thông |
| 38 | Có 1.600 cư dân | Có 3 tuyến bus hoạt động | Hoàn tất 200 chuyến bus |
| 39 | Có 1.700 cư dân | Nâng 2 nhà lên cấp 3 | Có 10 hộ dùng tiện ích nâng cấp |
| 40 | Có 1.800 cư dân | Employment đạt 80% | Satisfaction đạt 65/100 |
| 41 | Có 1.900 cư dân | Có bệnh viện đủ ca trực | Phục vụ 50 bệnh nhân hợp lệ |
| 42 | Có 2.000 cư dân | Có cơ sở chăm sóc người cao tuổi | Phục vụ 10 người đủ điều kiện |
| 43 | Có 2.100 cư dân | Có dịch vụ nghĩa trang/hỏa táng | Hoàn tất kiểm tra readiness |
| 44 | Có 2.200 cư dân | Có trung tâm tái chế | Xử lý 10 tấn input có cân đối |
| 45 | Có 2.300 cư dân | Có roof solar hoặc solar farm | Phát 500 kWh điện được ghi nhận |
| 46 | Có 2.400 cư dân | Có pin lưu trữ nối grid | Nạp/xả 200 kWh không tạo dư |
| 47 | Có 2.500 cư dân | Có 1 ga hành khách đủ staff | Hoàn tất 50 chuyến tàu hành khách |
| 48 | Có 2.600 cư dân | Có park-and-ride | Hoàn tất 30 chuyến đổi car → transit |
| 49 | Có 2.700 cư dân | Có 1 tuyến tram hoạt động | Hoàn tất 100 chuyến đi tram |
| 50 | Có 2.800 cư dân | Transit share đạt 15% | Điện/nước đủ 97% hộ |
| 51 | Có 2.900 cư dân | Có ga hàng hóa hoạt động | Chuyển 50 tấn hàng qua rail |
| 52 | Có 3.000 cư dân | Có 3 chuỗi sản xuất khác nhau | Hoàn tất 50 đơn hàng sản xuất |
| 53 | Có 3.100 cư dân | Có mỏ/nguồn quặng nhập | Giao 20 tấn input tới luyện kim |
| 54 | Có 3.200 cư dân | Có nhà máy luyện kim | Giao 10 tấn output hợp lệ |
| 55 | Có 3.300 cư dân | Có nhà máy điện tử | Giao 100 sản phẩm |
| 56 | Có 3.400 cư dân | Có nhà máy dược | Giao 200 đơn vị thuốc |
| 57 | Có 3.500 cư dân | Nâng 3 công trình công lên cấp 2 | Giữ staffing đạt 90% định biên |
| 58 | Có 3.600 cư dân | Có mạng viễn thông | Có 200 thuê bao hoạt động |
| 59 | Có 3.700 cư dân | Có khu hỗn hợp 20 căn + retail | Hoàn tất 50 giao dịch retail tại khu |
| 60 | Có 3.800 cư dân | Employment đạt 85% | Satisfaction đạt 68/100 |
| 61 | Có 3.900 cư dân | Có cảng hoặc ga hàng vùng tương đương | Nhận 100 tấn hàng ngoại vùng |
| 62 | Có 4.000 cư dân | Có phà hoặc tuyến bus xuyên vùng | Hoàn tất 100 chuyến theo tuyến |
| 63 | Có 4.100 cư dân | Có khách sạn 20 phòng hoạt động | Hoàn tất 30 lượt check-in |
| 64 | Có 4.200 cư dân | Có bảo tàng hoạt động | Phục vụ 100 lượt tham quan |
| 65 | Có 4.300 cư dân | Có nhà hát hoạt động | Phục vụ 100 lượt xem |
| 66 | Có 4.400 cư dân | Có đại học đủ staff | Nhận 100 sinh viên vào học |
| 67 | Có 4.500 cư dân | Nâng 5 nhà lên cấp 3 | Giữ utility đủ sau tăng capacity |
| 68 | Có 4.600 cư dân | Có khu đi bộ 1 km liên thông | Hoàn tất 200 chuyến đi bộ qua khu |
| 69 | Có 4.700 cư dân | Có hành lang xe đạp 2 km | Hoàn tất 100 chuyến xe đạp |
| 70 | Có 4.800 cư dân | Transit share đạt 20% | Thu gom rác cho 95% hộ |
| 71 | Có 4.900 cư dân | Có hồ điều hòa và bơm hoạt động | Hoàn tất kiểm tra xả/bơm theo scenario |
| 72 | Có 5.000 cư dân | Có shelter đủ 100 chỗ | Sơ tán 50 người trong diễn tập |
| 73 | Có 5.200 cư dân | Có 2 tuyến metro hợp lệ | Hoàn tất 200 chuyến đi metro |
| 74 | Có 5.400 cư dân | Có trung tâm hội nghị | Phục vụ 200 lượt tham dự |
| 75 | Có 5.600 cư dân | Có sân vận động hoạt động | Tổ chức 1 sự kiện 500 người |
| 76 | Có 5.800 cư dân | Có 2 tuyến rail hành khách | Hoàn tất 300 chuyến tàu |
| 77 | Có 6.000 cư dân | Có sân bay vùng hoạt động | Hoàn tất 4 lượt cất/hạ cánh |
| 78 | Có 6.200 cư dân | Có 3 khách sạn hoạt động | Đón 100 khách có departure hợp lệ |
| 79 | Có 6.400 cư dân | Nâng 2 công trình công lên cấp 3 | Phục vụ 100 lượt qua capacity mới |
| 80 | Có 6.600 cư dân | Employment đạt 88% | Satisfaction đạt 70/100 |
| 81 | Có 6.800 cư dân | Nâng 3 nhà lên cấp 4 | Có đủ tiện ích cấp 4 cho các nhà |
| 82 | Có 7.000 cư dân | Có 4 district hoạt động | Utility đủ 98% hộ |
| 83 | Có 7.200 cư dân | Tái chế ít nhất 25% rác đã xử lý | Đối chiếu 100 tấn rác theo vật liệu |
| 84 | Có 7.400 cư dân | Điện tái tạo chiếm 30% lượng cấp | Giữ grid không thiếu công suất |
| 85 | Có 7.600 cư dân | Có 5 chuỗi sản xuất hoạt động | Giao 100 đơn hàng không trùng |
| 86 | Có 7.800 cư dân | Có 2 ga hàng/port terminals | Chuyển 200 tấn hàng logistics |
| 87 | Có 8.000 cư dân | Transit share đạt 25% | Hoàn tất 500 chuyến transit |
| 88 | Có 8.200 cư dân | Tiếp cận không bậc tới 10 cơ sở công | Hoàn tất 30 chuyến mobility profile |
| 89 | Có 8.400 cư dân | Nâng 5 nhà lên cấp 4 | Giữ occupancy trong capacity |
| 90 | Có 8.600 cư dân | Employment đạt 90% | Satisfaction đạt 72/100 |
| 91 | Có 8.800 cư dân | Nâng 1 nhà lên cấp 5 | Giữ đầy đủ tiện ích cấp 5 |
| 92 | Có 9.000 cư dân | Nâng 1 cơ sở công lên cấp 4 | Phục vụ 200 lượt hợp lệ |
| 93 | Có 9.200 cư dân | Có 20 lô đất mới đã mua và kết nối | Hoàn tất route xuyên 3 district |
| 94 | Có 9.400 cư dân | Khôi phục 1 vùng suy thoái theo scenario | Có cải thiện đo được theo baseline |
| 95 | Có 9.600 cư dân | Hoàn tất một đợt sơ tán/diễn tập 200 người | Trả toàn bộ người về đúng hộ |
| 96 | Có 9.800 cư dân | Transit share đạt 30% | Điện/nước đủ 99% hộ |
| 97 | Có 10.000 cư dân | Nâng 3 nhà lên cấp 5 | Giữ service readiness cho vùng |
| 98 | Có 10.000 cư dân ổn định 30 phút game | Có 1 event 1.000 người được phục vụ | Đối chiếu toàn bộ event ledger |
| 99 | Có 10.000 cư dân ổn định 60 phút game | Employment 90%, satisfaction 75/100 | Không có nhu cầu utility nghiêm trọng quá cửa sổ |
| 100 | Giữ 10.000 cư dân và utility 99% trong 60 phút game | Hoàn tất 1.000 chuyến transit + 100 đơn logistics | Hoàn tất scenario quản lý lớn, ledger và dịch vụ không sai invariant |

Các con số là thiết kế mục tiêu, cần benchmark 10.000 agent trước nghiệm thu; không dùng dân số giả để vượt nhiệm vụ. Nếu cấu hình ranked/device hỗ trợ ít hơn, phát hành rule/difficulty riêng công khai với mục tiêu phù hợp, tách BXH và giữ đủ 100 bậc; không đổi mục tiêu giữa save để farm. Các nhiệm vụ event/readiness dùng diễn tập có lịch, chi phí và tài nguyên; không buộc người chơi gây hỏa hoạn, chờ người chết hoặc bật thiên tai để lên cấp.

## Phụ lục F — Nâng nhà, khu ở và công trình bằng tiền + tiện ích

Upgrade không tự sinh cư dân hoặc tiền. Kết quả tạo căn/chỗ/công suất mới theo template; hộ/firm chọn chuyển vào theo demand và affordability. Không phải mọi asset có đủ 5 cấp: template phải có hình học, footprint, sàn, sức chứa và staffing hợp lệ cho từng cấp; nếu không nâng được, UI nói rõ.

| Cấp đích | Chi nâng so với nguyên giá xây cấp 1 | Capacity mục tiêu so với cấp 1 | Điều kiện nền |
|---:|---:|---:|---|
| 1 | Giá xây ban đầu | 1,00× | Đường/lối vào hợp lệ, điện, nước, xử lý nước thải |
| 2 | 0,25× | Tối đa 1,25× | Utility đủ; rác được thu gom; tiếp cận công viên |
| 3 | 0,45× | Tối đa 1,50× | Thêm y tế, cứu hỏa, giáo dục phù hợp; transit trong tầm đi bộ |
| 4 | 0,70× | Tối đa 1,75× | Thêm mạng viễn thông; năng lực tuyến/tiện ích đủ tải; condition ≥ 80/100 |
| 5 | 1,00× | Tối đa 2,00× | Thêm tiếp cận nâng cao, tiện ích xã hội, utility dự phòng và satisfaction ≥ 75/100 |

Chi phí là phần tăng thêm cho từng bước, không phải tổng tích lũy: nâng từ 1→3 trả 0,25P + 0,45P = 0,70P, kèm đất mở rộng, relocation, permit và xe/thiết bị nếu có. Dùng giá P của template/rule được chốt trong contract, không đổi theo mesh hiện tại để refund exploit. Dự phòng 10% theo A5; nâng tiếp chỉ khi hợp đồng trước đã nghiệm thu. Công suất tăng phải có diện tích sàn/thiết bị thật: round theo căn/phòng, không nhét thêm người vào cùng một căn vượt chuẩn template. Ví dụ nhà nhiều căn P=1.000.000 BC: nâng 1→2 =250.000 BC, dự phòng 25.000; 2→3 =450.000, dự phòng 45.000, trước khoản bổ sung khác.

Tiện ích được đánh giá từ mạng/route và năng lực thực trong 15 phút game: điện/nước ≥95% lượng cần cấp; nước thải có tuyến xử lý; rác có chuyến thu hợp lệ; cứu hỏa/y tế có crews và route ETA dưới ngưỡng template; trường có chỗ đúng nhóm tuổi; transit có chuyến đang chạy. Công viên mặc định trong 600 m đi bộ, điểm transit trong 500 m đi bộ; khoảng cách qua graph, không đường chim bay. Nếu khu không có trẻ/người cao tuổi, dùng đúng nhóm nhu cầu thay vì bắt đặt mọi loại công trình vô ích. Nêu các điều kiện chưa đạt trong inspector, có nút zoom tới điểm nghẽn.

Capacity lớn hơn kéo theo demand điện/nước/rác, staff và maintenance. Default fixed maintenance sau nâng nhân 1,15/1,35/1,60/1,90 ở cấp 2/3/4/5; phần consumption/wages theo hoạt động thật. Không tự giảm mọi chi phí khi lên cấp. Rent có thể tăng theo chất lượng/demand nhưng phải tôn trọng hợp đồng, affordability và thông báo; cư dân thiếu tiền có hành vi chuyển nhà, không biến mất.

Owner nhà tư nhân trả tiền; nút “Hỗ trợ nâng cấp” cho city hiển thị phần trợ cấp được trừ treasury, owner trả phần còn lại. Upgrade cơ sở công do city trả. Nâng “khu ở” là gói hạ tầng chung (đường, mạng utility, công viên, dịch vụ) có danh sách công trình và khối lượng; không thu thêm một giá khu trừu tượng rồi vẫn thu đủ từng công trình lần nữa. Có thể đủ tiện ích cả district mà một nhà thiếu vốn không nâng; UI phân biệt rõ.

Hợp đồng nâng có preview, escrow, crews, vật tư, thời gian theo preset; có thể giảm capacity tạm thời/relocation. Mất tiện ích sau khi nâng làm giảm chất lượng/dịch vụ và khả năng lên tiếp, không xóa các tầng hoặc thu thưởng EXP lại. Deterioration/repair là hệ thống riêng. Refund phần chưa thực hiện theo hợp đồng; không hoàn nguyên giá toàn bộ sau đã sử dụng.

Nhiệm vụ nâng cấp chỉ ghi khi nghiệm thu và capacity/geometry core đã cập nhật; receipt theo building ID/target level ngăn phá-xây hoặc reload để nhận EXP lặp. Kiểm tra thiếu vốn, thiếu utility, utility quá tải sau upgrade, chủ tư nhân không đủ tiền, hai lần click, save giữa thi công, người tạm chuyển đi và CAS cloud conflict. Population, occupancy, ledger và owner không được đổi sai.

## Phụ lục G — Giao diện đẹp hơn và bộ icon chức năng

### G1. Phong cách và bố cục

Thiết kế riêng cho Build City 26 theo phong cách trò chơi quản lý đô thị hiện đại: nền xanh than, panel bán trong suốt vừa phải, accent xanh ngọc và vàng cho tiền/EXP. Địa hình thành phố là vùng nhìn chính. Không sao chép bố cục, icon hoặc nhận diện của game khác. Không thay giao diện quản lý bằng một landing page.

Design tokens: nền `#0B1220`, panel `#152238`, panel hover `#20334C`, chữ chính `#F1F5F9`, chữ phụ `#B8C7D9`, accent `#4DE0B7`, thông tin `#73B8FF`, EXP/tiền `#F6CB66`, nguy hiểm `#FF8B85`. Chữ nhỏ trên panel phải kiểm tra độ tương phản; không đặt chữ xám tối trên nền tối. Dùng CSS variables cho màu, spacing, radius, shadow và z-index. Border 1 px nhẹ; card radius 12 px, panel 16 px. Blur chỉ dùng nơi cần, có fallback nền đặc khi thiết bị yếu hoặc không hỗ trợ. Không phủ glow/gradient lên mọi nút.

Font hỗ trợ tiếng Việt đầy đủ, dùng system font hoặc font được đóng gói đúng giấy phép. Body 14–16 px, số liệu quan trọng 18–22 px, tabular numerals cho tiền/đồng hồ; nhãn phụ tối thiểu 12 px trên desktop và 13 px trên mobile. Thống nhất spacing theo bội số 4/8 px. Tiền dài được rút gọn có định dạng tiếng Việt, tooltip mở số đầy đủ và đơn vị; không che mất dấu âm/nợ. Mặc định hiển thị đơn vị tiền theo economy config ở Lệnh 18, không đổi BC/đồng game chỉ để trang trí.

Desktop: thanh HUD trên cùng cao khoảng 60–68 px hiển thị tên thành phố, tiền, dòng tiền, dân số, level và thanh EXP. Pause, đồng hồ và tỷ lệ “1 giây thực = 5 giây game” luôn thấy được. RCI có nhãn/legend rõ, không chiếm hết HUD. Thanh dock công cụ ở dưới giữa màn hình; bảng chọn công trình bên trái khoảng 300–340 px; inspector bên phải khoảng 300–340 px có thể thu gọn. Dock chỉ hiện nhóm chức năng chính, chức năng con nằm trong panel, tránh một hàng 25 nút. Với viewport hẹp, chỉ mở một panel chính một lúc để còn nhìn map.

Góc phải trên có thông báo, nhiệm vụ và nút mở BXH; badge là số sự kiện chưa đọc thật, không có badge giả. Minimap nhỏ có thể thu gọn ở góc không bị inspector che. Cảnh báo cần hành động có nút “Đến vị trí”, không bật modal chặn thao tác mỗi lần thiếu điện.

Mobile: HUD tối đa hai hàng gọn; dock cuộn ngang hoặc chia nhóm; sheet công cụ trượt từ dưới, có các mức đóng/gọn/mở. Touch target tối thiểu 44 × 44 px. Tôn trọng safe-area-inset, tránh nút sát mép notch. Đóng sheet bằng nút rõ và gesture hợp lý; không đánh cắp pinch/pan của map khi thao tác ngoài sheet. UI game không cuộn toàn trang ngoài ý muốn.

### G2. Bộ icon SVG đồng bộ

Tạo registry icon dùng lại trong toàn app; ưu tiên SVG tự vẽ đơn giản, không cần API AI. ViewBox 24 × 24, stroke 1,8–2 px, linecap/linejoin round, kích thước hiển thị 20–24 px; toolbar có thể 28 px trong target 44–52 px. Icon sắc ở mọi DPI, không dùng ảnh raster mờ hoặc emoji làm icon chức năng chính. Không chèn SVG từ input người dùng chưa kiểm tra. Nếu dùng bộ icon bên thứ ba, xác minh giấy phép và ghi vào ASSET_LICENSES; không cài cả thư viện nặng chỉ để dùng vài icon.

| Chức năng | Hình biểu tượng đề xuất | Accent nhóm |
|---|---|---|
| Đường và giao lộ | Đường cong có vạch giữa | Xanh dương |
| Khu dân cư | Cụm nhà có mái | Xanh lá |
| Thương mại | Cửa hàng với mái hiên | Xanh dương |
| Công nghiệp | Nhà xưởng với ống khói | Vàng cam |
| Điện | Tia sét | Vàng |
| Nước | Giọt nước | Xanh cyan |
| Nước thải | Ống và mũi tên dòng chảy | Xanh teal |
| Rác/tái chế | Thùng rác hoặc ba mũi tên | Xanh lục |
| Y tế | Túi y tế có dấu cộng | Hồng đỏ |
| Cứu hỏa | Ngọn lửa với khiên | Cam đỏ |
| Cảnh sát | Khiên có ngôi sao | Xanh tím |
| Giáo dục | Sách mở | Tím |
| Bus/tram/metro | Mặt trước phương tiện, glyph phụ phân loại | Xanh cyan |
| Rail/logistics | Đầu tàu và kiện hàng | Xanh dương |
| Cảng/sân bay | Mỏ neo/máy bay | Xanh cyan |
| Công viên | Cây và ghế | Xanh lá |
| District/mở đất | Ranh lô dạng đường đứt | Xanh ngọc |
| Ngân sách | Ví hoặc cột biểu đồ | Vàng |
| Nhiệm vụ | Clipboard với dấu tích | Xanh ngọc |
| EXP/cấp độ | Huy hiệu và mũi tên lên | Vàng |
| BXH | Cúp | Vàng |
| Nâng cấp | Tòa nhà và mũi tên lên | Xanh ngọc |
| Phá dỡ | Búa hoặc xe ủi | Đỏ |
| Lưu game | Đĩa lưu với dấu tích trạng thái | Xanh ngọc |
| Cài đặt | Bánh răng | Trắng xanh |

Icon luôn có accessible label. Nút quan trọng có nhãn ngắn; desktop tooltip ghi tên, phím tắt nếu đã có và mô tả 1 dòng. Tooltip không phải cách duy nhất để hiểu nút trên mobile. Nhóm màu dùng để định hướng, trạng thái còn có hình/nhãn; không chỉ dùng đỏ/xanh để biểu đạt đủ/thiếu điều kiện.

### G3. Trạng thái tương tác và bảng công trình

Mỗi nút có idle/hover/pressed/active/focus-visible/disabled/loading; active có nền accent nhẹ + viền + nhãn rõ. Hover 120–180 ms, không làm layout dịch chuyển. Pointer cursor cho hành động; disabled giải thích do thiếu tiền, thiếu điều kiện hoặc tính năng chưa triển khai. Không giữ nút màu sáng khiến người chơi nghĩ chức năng chưa làm đã dùng được. Reduced motion tắt chuyển động không thiết yếu.

Panel xây có tiêu đề nhóm, search tiếng Việt, tabs/favorites và asset cards hai cột khi đủ chỗ. Card có preview công trình từ renderer/asset thật, tên, giá xây, chi phí vận hành và lock/unlock. Chọn card mở chi tiết footprint, công suất, staffing, utility cần, thời gian thi công và nút “Đặt công trình”. Preview không dùng ảnh của game khác; không cần ảnh AI. Giá hiển thị từ config/quote thật, không hard-code một số đẹp khác với số tiền bị trừ.

Khi đặt trên map: ghost preview đủ/không đủ điều kiện có viền + lý do; nhãn khối lượng/giá bám con trỏ nhưng không che công trình; confirm/cancel rõ. Khi đang kéo đường, hiển thị chiều dài, độ dốc và tổng chi. Thiếu tiền không trừ âm rồi mới báo lỗi. Công trình bị khóa hiển thị level/mission prerequisite đã định sẵn.

Inspector có ảnh/camera preview, tên, loại, upgrade level, trạng thái, owner; bên dưới chia overview/people hoặc staff/production/finance tùy đối tượng. Các lỗi xếp theo mức ưu tiên với đường dẫn tìm nguyên nhân. Nút nâng cấp có tiền, công suất sau nâng, điều kiện tiện ích và từng mục đạt/chưa đạt; không chỉ có nút “Upgrade” chung chung. Không dùng ảnh preview trang trí làm dữ liệu core.

Missions hiển thị từng A/B/C, progress, EXP nhận, điều kiện còn thiếu và trạng thái Đã nhận. Thanh EXP hiển thị EXP hiện tại/cần cho cấp tiếp, cap 100 rõ. Hiệu ứng lên cấp ngắn, có thể bỏ qua; reward 100 triệu đơn vị tiền game phải đã commit hợp lệ trước khi animation báo nhận thành công.

Màn tài khoản cùng ngôn ngữ hình ảnh: logo riêng, background thành phố của dự án, form dễ đọc; đăng ký giữ đúng Tên thành phố/Tài khoản/Mật khẩu, đăng nhập Tài khoản/Mật khẩu. Error inline, loading thật, trạng thái thành công từ Auth. UI BXH có hai tab cấp độ/tiền, hàng của tôi được nhấn nhẹ, số hạng/level/tiền căn thẳng và trạng thái sync rõ.

### G4. Yêu cầu triển khai và nghiệm thu UI

Kiểm tra cấu trúc hiện tại rồi sửa đúng component/CSS/renderer overlay; không bắt dự án đổi framework chỉ vì giao diện. Tách design tokens, icon registry và components button/card/panel/tooltip vừa đủ dùng, tránh viết lại core. Màu/theme lưu vào settings, không vào state kinh tế. Dữ liệu UI đọc snapshot/store đang có; handler gửi command đúng luồng cũ.

UI overlay chỉ bắt pointer trong vùng có control; phần map còn lại tiếp tục pan/orbit/zoom/raycast. Escape đóng panel hoặc hủy công cụ theo thứ tự rõ; keyboard focus không chạy camera khi nhập username/search. Modal có focus management và đóng được. Tooltip không che nút xác nhận hoặc đi ra viewport.

Browser QA trên desktop 1440 × 900, laptop 1280 × 720, tablet 768 × 1024 và mobile 390 × 844. Kiểm tra top HUD với tiền lớn/âm, chuỗi tiếng Việt dài, dock, build card, inspector, upgrade panel, missions, Auth và BXH. Kiểm tra menu không tràn màn, icons không biến thành ô vuông, mọi nút còn hoạt động, save/load đúng, camera không bị overlay chặn. Chạy build và kiểm tra chức năng liên quan; không viết test chỉ để xác nhận màu CSS. Chụp và mở xem ảnh giao diện thật trước khi báo hoàn tất, ghi rõ viewport/browser thực sự đã thử.

### G5. Thành phố đẹp đồng bộ nhưng nhẹ

**Ưu tiên đã chốt:** UI và mọi nhóm asset của thành phố đều đẹp, rõ và nhẹ. Chọn phong cách 3D stylized có tỷ lệ thống nhất: hình khối rõ, mặt đường sạch, bảng màu hài hòa, chi tiết vừa đủ. Không làm mỗi khu một phong cách khác nhau; không dùng toàn hộp đơn sắc cho nhà ở rồi dành hết chi tiết cho một công trình đặc biệt. Độ đẹp không phụ thuộc vào việc bật mọi hiệu ứng nặng.

Nhà ở có mái, mặt tiền, cửa sổ, cửa vào, ban công/hiên và cảnh quan nhỏ theo loại; có các biến thể nhà thấp, nhà phố, chung cư vừa và cao tầng. Thương mại có mái hiên, cửa kính giản lược và biển riêng của dự án. Công nghiệp có khối xưởng, kho, cổng giao hàng và thiết bị vừa đủ. Công trình y tế, giáo dục, cứu hỏa, cảnh sát, nhà ga, cảng và sân bay có hình dáng phân biệt được khi zoom vừa. Mesh cấp nâng 1–5 thể hiện thay đổi diện tích sàn/thiết bị đúng capacity, không tăng tầng chỉ vì đẹp mà core vẫn không thay đổi.

Đường có vỉa hè, vạch, crossing, dải phân cách và cây/đèn tại vị trí hợp lệ; cầu có kết cấu nhận diện, hầm có portal. Công viên có lối đi, cây, ghế và phần cây xanh; nông nghiệp có ruộng/nhà kính theo mùa; mặt nước/bờ sông/địa hình có màu và chuyển vùng tự nhiên. Người, xe và tàu dùng cùng bảng màu/tỷ lệ, nhận ra được ở góc chơi. Những chi tiết này ưu tiên shared meshes/instances; không tạo một scene graph nặng cho mỗi cửa sổ, ghế hoặc vạch đường.

Tạo khoảng 3–6 biến thể hình khối/màu cho template lặp lại, chọn bằng seed + entity ID. Biến thể được giữ sau save/load, không random màu mỗi frame. Roof, cửa sổ và bảng nhỏ có thể dùng atlas hoặc material parameters chung. Cửa sổ buổi tối dùng emissive mask/material, không tạo point light cho từng cửa sổ. Cây có vài mẫu cùng phong cách, không đặt hàng nghìn mesh lá riêng lẻ. Chi tiết gần đủ đẹp nhưng silhouette ở xa vẫn giữ loại công trình.

LOD theo khoảng cách/kích thước trên màn: gần có detail và animation; vừa bỏ chi tiết nhỏ; xa dùng mesh đơn giản giữ khối/màu; ngoài camera bỏ render. Dùng khoảng chuyển có hysteresis để không đổi LOD liên tục khi camera đứng sát ranh. Không làm nhà biến mất trong vùng nhìn chỉ để tăng FPS; giảm chi tiết trước. Công trình quan trọng/chọn hiện tại ưu tiên chi tiết và highlight gọn, không phát glow toàn thành phố.

Mức đồ họa Thấp/Vừa/Cao và Auto cùng giữ phong cách đẹp, UI/icon sắc nét. Thấp giảm bóng, chi tiết cây, particle, khoảng nhìn detail và độ phân giải render; không biến asset về ô vuông hoặc bỏ tất cả màu/đặc trưng. Mặc định Auto/Vừa, không tự bật mức cao nhất theo kích thước màn. Giữ lựa chọn thủ công và nút khôi phục Auto. Tối ưu hình ảnh không được làm mất cư dân, xe, hành trình, hàng hoặc dữ liệu đã lưu.

### G6. Ngân sách hiệu năng và kiểm tra độ mượt

**Mục tiêu nghiệm thu, phải đo trên máy cụ thể:** desktop/laptop phổ thông hướng tới 60 FPS ở Vừa; điện thoại hướng tới 30 FPS ở Thấp/Auto. Các mốc là mục tiêu thiết kế, không cam kết mọi máy/map/dân số đều đạt. Báo cấu hình, trình duyệt, viewport, chất lượng, số thực thể và cảnh đã đo; không ghi “không lag” chỉ vì map trống chạy nhanh.

- Renderer: shared geometry/material, instancing vật thể lặp, frustum/LOD/chunk culling; dispose khi không dùng, tránh rebuild cả scene khi tiền hoặc một công trình thay đổi. Hạn chế allocation trong vòng render. Cache static geometry và chỉ invalidation vùng thay đổi. Không cho asset preview, minimap và ảnh inspector mỗi phần tự chạy một animation loop/WebGL context riêng.
- Ánh sáng: một directional light chính + ambient nhẹ; shadow map chỉ khi preset cho phép, giới hạn vùng casting quanh camera và không bật bóng từng cây/người ở toàn map. Tắt mặc định reflection/refraction động, SSAO/SSR/DOF và bloom toàn màn; optional effect phải có đo chi phí. Nước dùng shader/material nhẹ có fallback, không render phản chiếu toàn scene mỗi frame.
- Độ phân giải: cap pixel ratio cấu hình, khởi tạo mục tiêu khoảng 1 trên mobile và 1–1,5 trên desktop Vừa; Cao tối đa 2 nếu thiết bị đáp ứng. Không tự nhân theo màn Retina 3×/4×. Render scale chỉ tác động cảnh 3D, DOM/icon/text giữ sắc. Auto giảm chất lượng theo thống kê nhiều giây và phục hồi có độ trễ, không nhảy mức mỗi frame.
- Texture/asset: dùng atlas và asset dùng chung; tải mesh/texture theo nhu cầu/chunk, có asset budget và cache hữu hạn. Texture mặc định thường 512–1024 px theo nội dung; chỉ tăng khi ảnh so sánh cho thấy cần. Không tải hàng trăm texture 4K cho nhà nhỏ trên màn. Có mipmaps phù hợp và ảnh preview nhỏ; không tải video nền hoặc font/icon CDN chỉ để mở một menu. Asset version/cache strategy nhất quán sau deploy.
- UI: icon SVG inline/sprite dùng chung, tránh animation vô hạn, backdrop blur nhiều lớp và shadow đắt trên hàng trăm card. Blur tắt/giảm ở Thấp. Chỉ render cards/hàng BXH đang thấy, lazy-load preview, debounce search hợp lý. HUD cập nhật theo thay đổi hoặc khoảng 250–500 ms cho số liệu; đồng hồ có display cadence riêng. Không cập nhật toàn bộ DOM/React tree cho vị trí mọi agent mỗi frame. Dữ liệu core vẫn cập nhật theo clock thật.
- Mô phỏng: Web Worker cho simulation/pathfinding theo Lệnh 16; render lấy snapshot/deltas, không serialize toàn world mỗi frame. Có budget tìm đường và dirty queues; update theo event cho agent xa nhưng giữ arrival/queue/cargo/ledger đúng. Tick vật lý cần chia nhỏ khi 1:5, không dùng bước lớn làm xe xuyên giao lộ. Khi thực sự quá tải, báo hoặc pause có kiểm soát; không lặng lẽ bỏ sự kiện để giữ chỉ số FPS đẹp.
- Input: preview và camera phản hồi ở vòng render, command kiểm tra độc lập có trạng thái processing khi cần. Xây một nhà không khóa UI để tính lại tất cả đường. Tác vụ build lớn, migrations và xuất save chia phần/offload phù hợp; giữ main thread không bị việc nặng liên tục. Autosave gộp/delay hợp lý, không upload mọi frame.

Viết docs/performance-budget.md và docs/art-direction.md, ghi preset và chỉ số đo. QA tối thiểu: map rộng trống; 1.000 cư dân; 5.000; 10.000 nếu phần core đã hỗ trợ; cảnh nhiều nhà, giao lộ đông, công viên nhiều cây, camera kéo/zoom nhanh, mở/đóng xây dựng, inspector/mission/BXH, nâng nhà và autosave. Đo FPS trung vị, p95 frame time, main-thread long tasks, worker tick time, draw calls, memory và tải asset. So sánh trước/sau cùng seed, camera, chất lượng và cửa sổ đo; ghi số liệu thiếu thay vì suy đoán.

Lặp xây/xóa, đi qua nhiều chunk, mở/đóng panel và load nhiều lần để tìm leak; bộ nhớ phải có giới hạn, không tăng mãi. Dùng fake/test data riêng cho stress UI, không ghi vào save hoặc giả score BXH. Xem screenshot mức Thấp/Vừa/Cao của cùng khu ở, dịch vụ, đường/cây/nước để bảo đảm tối ưu vẫn đẹp. Đạt mục tiêu hiệu năng rồi mới tăng detail; nếu chưa đạt thì sửa điểm nghẽn đo được. Bàn giao chức năng đang chạy cùng bằng chứng kiểm tra, không chỉ gửi ảnh mockup đẹp.

## Phụ lục H — Bản đồ Việt Nam, đủ tỉnh/thành và địa hình theo thực tế

### H1. Mục tiêu và danh mục hành chính

Người chơi chọn “Việt Nam” khi tạo thành phố: xem toàn quốc, tìm kiếm/chọn tỉnh hoặc thành phố cấp tỉnh, rồi chọn vị trí xây có dữ liệu địa hình phù hợp. Có ranh, tên, biển, đảo, sông chính và biểu diễn cao độ khi zoom tổng quan. Zoom vào vùng chơi để xây thành phố mới theo core hiện tại. Không cần dựng lại từng nhà/đường đang tồn tại ngoài đời để đáp ứng phạm vi này; các phần tái dựng hiện trạng nếu có phải tách khỏi công trình người chơi sở hữu.

Danh sách 34 đơn vị dưới đây đối chiếu trang Thông tin tỉnh thành của Cổng TTĐT Chính phủ ngày 08/10/2026. Tên và loại hành chính có version/effective date; các thay đổi thành phố Đồng Nai, Quảng Ninh, Bắc Ninh năm 2026 đã được kiểm tra qua nghị quyết có hiệu lực. Không lấy một bài tổng kết sắp xếp 2025 để mặc định mãi loại hành chính của năm 2026. Khi triển khai/deploy lại, đối chiếu nguồn hiện hành, lưu snapshot dùng cho bản game và không tự thay địa giới của bản lưu đã tạo.

| STT | Đơn vị cấp tỉnh |
|---:|---|
| 1 | Thành phố Hà Nội |
| 2 | Thành phố Hồ Chí Minh |
| 3 | Thành phố Hải Phòng |
| 4 | Thành phố Đà Nẵng |
| 5 | Thành phố Cần Thơ |
| 6 | Thành phố Huế |
| 7 | Thành phố Đồng Nai |
| 8 | Thành phố Quảng Ninh |
| 9 | Thành phố Bắc Ninh |
| 10 | Tỉnh An Giang |
| 11 | Tỉnh Cao Bằng |
| 12 | Tỉnh Cà Mau |
| 13 | Tỉnh Điện Biên |
| 14 | Tỉnh Đắk Lắk |
| 15 | Tỉnh Đồng Tháp |
| 16 | Tỉnh Gia Lai |
| 17 | Tỉnh Hà Tĩnh |
| 18 | Tỉnh Hưng Yên |
| 19 | Tỉnh Khánh Hòa |
| 20 | Tỉnh Lai Châu |
| 21 | Tỉnh Lào Cai |
| 22 | Tỉnh Lâm Đồng |
| 23 | Tỉnh Lạng Sơn |
| 24 | Tỉnh Nghệ An |
| 25 | Tỉnh Ninh Bình |
| 26 | Tỉnh Phú Thọ |
| 27 | Tỉnh Quảng Ngãi |
| 28 | Tỉnh Quảng Trị |
| 29 | Tỉnh Sơn La |
| 30 | Tỉnh Thanh Hóa |
| 31 | Tỉnh Thái Nguyên |
| 32 | Tỉnh Tuyên Quang |
| 33 | Tỉnh Tây Ninh |
| 34 | Tỉnh Vĩnh Long |

Một catalog data-driven lưu stable administrative ID từ nguồn xác minh, tên, loại, aliases tên cũ, version/date, geometry reference và các vùng khởi đầu có dữ liệu. Tên thành phố do người chơi đặt là trường riêng, không đổi nhãn địa phương thật. Tìm kiếm không dấu và aliases hỗ trợ địa danh trước sắp xếp; alias không tạo thêm một đơn vị cấp tỉnh hiện hành. Bản đồ lịch sử, nếu thêm sau, là layer có ngày riêng, không trộn ranh cũ với tên mới.

### H2. Ranh giới, biển, đảo và sông

Dùng polygon/MultiPolygon hành chính thật, giữ topology vùng liền kề, coastline và đảo. Tên đặt bằng label anchor bên trong polygon thích hợp, không dùng centroid rơi xuống biển. Số đơn vị khớp catalog; không có vùng bị thiếu, duplicated ID hoặc đè lên nhau ngoài sai số/điều kiện nguồn. Geometry chỉ được đơn giản hóa cho zoom tổng quan và giữ các đảo/phần tách quan trọng. Danh mục tên chính thức không tự cung cấp quyền sử dụng hình/geometry của một bản đồ; ghi rõ nguồn và quyền của dữ liệu không gian đã chọn.

Biển là water geometry đúng theo coastline, không phải một dải xanh chung ở cạnh phải của mọi map. Phân biệt biển, hồ, sông, cửa sông và đảo; các vùng bờ nhiều hướng phải giữ hướng thực. Đảo giữ tọa độ và mối liên hệ hành chính theo nguồn đã kiểm tra. Các quần đảo ngoài khung nhìn chính có thể dùng inset tổng quan có nhãn rõ; inset không làm đổi tọa độ thế giới hoặc khoảng cách hành trình. Không vẽ đường biên biển tùy ý từ polygon đất liền.

Sông/hồ chính lấy từ hydrography có nguồn. Sông có hướng và cao trình mặt nước phù hợp; DEM và water mask được xử lý để bờ không tạo tường dựng đứng vô lý. Dữ liệu dòng chảy/triều cần cấu hình được công bố nếu nguồn không có; không suy diễn một mô hình thủy văn chính xác từ việc có đường sông trên bản đồ. Nhãn và outline địa lý không tự cấp quyền xây trên vùng bảo tồn/mặt nước; luật vùng xây là rule riêng.

### H3. Núi, đồng bằng và cao độ thật

Nhập DEM như NASADEM/SRTM hoặc bộ tương đương được kiểm tra quyền dùng. NASA Earthdata mô tả NASADEM_HGT.001 ở độ phân giải 30 m; đây là một mức dữ liệu nền tham khảo, không đồng nghĩa tái dựng chính xác mọi taluy/ngôi nhà. Chốt dataset/version, resolution, nodata, vertical datum, nguồn và ngày lấy. Ưu tiên DEM có chất lượng phù hợp vùng và đối chiếu nguồn; không dùng ảnh màu núi làm độ cao giả.

Geo coordinates nguồn thường dùng kinh/vĩ độ; chuyển khu chơi sang hệ mét local phù hợp, giữ anchor lon/lat và transform. Lưu đơn vị/datum; không lấy chênh lệch độ kinh tuyến trực tiếp như mét. Kiểm tra scale XY và Z, đường đi/chi phí không bị co cả nước về một ô. Vertical exaggeration chỉ là tùy chọn nhìn tổng quan có ghi rõ; core slope và thi công luôn dùng cao độ vật lý, không dùng độ cao phóng đại của renderer.

Núi nằm tại nơi DEM có núi, đồng bằng ở nơi thấp/phẳng, cao nguyên có mặt bằng cao phù hợp. Không random dãy núi giữa vùng bằng hoặc làm bằng toàn vùng núi để dễ đặt nhà. Vegetation/đất/cát và màu địa hình chọn theo landcover nếu có dữ liệu; dữ liệu thiếu được ghi rõ là đơn giản hóa. Detail noise chỉ được thêm ở biên độ nhỏ đã cấu hình, không làm biến dạng bờ biển, cao độ quan trọng, dốc đường hoặc vùng ngập.

Đặc điểm gần biển/gần núi được tính theo vị trí của khu chơi bằng coastline distance, elevation, slope và landform trong bán kính đo. Một đơn vị sau sắp xếp có thể chứa nhiều kiểu địa hình; không gán mọi chunk một biome từ tên tỉnh. Preview vị trí hiển thị diện tích đất/mặt nước, độ cao min/max, độ dốc, tỷ lệ xây được và khoảng cách tới biển/sông/cổng vùng dựa trên dữ liệu thật đã tải.

Biển nước mặn và nước ngọt được tách trong rule cấp nước; cửa sông có thể cần điều kiện xử lý. Miền núi tác động route/độ dốc, chi phí đào/đắp/cầu/hầm và diện tích xây được; ven biển tác động vị trí cảng, mặt nước và hazard của preset. Các hệ số kinh tế/thời tiết là thiết kế game có config, không coi đó là dự báo thực tế tại địa chỉ người chơi chọn.

### H4. Quy mô và cách chơi trên toàn Việt Nam

Tổng quan toàn quốc dùng vector geometry/cao độ gọn và region markers. Chọn một khu xây 12,8 × 12,8 km tại vị trí georeferenced, nâng tới 25,6 km nếu đã benchmark. Có ít nhất một vùng khởi đầu hợp lệ cho mỗi đơn vị trong catalog, các lựa chọn ven biển/núi/sông chỉ hiển thị nếu lớp địa lý của vị trí hỗ trợ. Có nút xem trước và nêu phần dữ liệu đã có; không gắn biển vào lựa chọn nằm sâu trong đất liền cho đủ preset.

Country view không mô phỏng từng người/xe/nhà toàn quốc. Vùng đang chơi dùng detailed simulation; các vùng ngoài dùng region nodes cho nhập/xuất và kết nối với capacity/travel time/rule rõ. Nếu sau này hỗ trợ nhiều thành phố, mỗi city có save/owner/checkpoint riêng; chọn thành phố không cộng tiền hoặc EXP của mọi vùng vào một score. Không tự thêm multiplayer trong giai đoạn này.

Đất mua, đường/công trình và địa hình đã sửa giữ tọa độ trong local world và geographic anchor. Khu xây gần ranh tỉnh có thể thấy terrain tiếp giáp, nhưng command phải kiểm tra vùng người chơi sở hữu. Mở thêm chunk không tự san phẳng địa hình hoặc nhân tài nguyên. Cổng vùng được đặt tại tuyến có dữ liệu hoặc connector game được gắn nhãn rõ, không quảng cáo đường ngẫu nhiên là quốc lộ thật.

Chế độ “Thành phố mới trên địa hình Việt Nam” xây theo luật game; mesh riêng, không cần chép từng tòa nhà ngoài đời. Mode tái dựng hiện trạng nếu làm sau phải phân biệt building baseline và tài sản player; không cấp hàng triệu dân thật cùng tiền mặc định cho một city mới. Mission 100 bậc có biến thể hợp lệ cho nơi không biển/quặng như Lệnh 26, không bắt city miền núi xây cảng biển để lên cấp.

### H5. Pipeline dữ liệu và hiệu năng

Tiền xử lý dữ liệu địa lý ngoài game: validate boundary, clip terrain/hydro, reprojection, simplify theo zoom, sinh tiles/chunk metadata và checksum. Dùng tile assets tĩnh có cache/version; không tải GeoJSON nặng toàn quốc rồi tạo mesh toàn quốc trên main thread. Browser tải catalog + outline nhẹ trước; chunk DEM/coast/hydro tải khi chọn khu và quanh camera, có progress, retry và hủy tác vụ khi đổi vùng.

Tách data package và source/attribution khỏi game code. Nếu dùng OSM, tuân thủ ODbL và attribution cho dữ liệu/derived database theo điều kiện tương ứng. Chuẩn bị extract được phép và xử lý/caching phù hợp; không coi public tile/Overpass của cộng đồng là backend miễn phí không giới hạn cho game. Frontend không cần key API AI. Nếu nguồn thực sự cần tài khoản tải dữ liệu, hỏi đúng bước bị chặn và tiếp tục phần catalog/UI/pipeline độc lập, không hard-code secret.

DEM/resolution và draw LOD tách nhau: terrain nhiều độ phân giải, seam stitching giữa tiles, hạn chế texture và đèn như G5–G6. Dữ liệu toàn quốc lớn không nhúng hết vào bundle JavaScript. Có disk/network size budget, cache có giới hạn và cleanup phiên bản cũ; ưu tiên tải khu đang chơi trước khi tải tùy chọn. Mất mạng vẫn mở save có tiles đã cache; khu chưa có dữ liệu hiển thị trạng thái thiếu, không âm thầm thay bằng map random rồi gọi là thật.

### H6. Nghiệm thu và bảo toàn bản lưu

1. Catalog đủ 34 tên/ID đúng version; chọn/tìm/zoom được từng đơn vị, không chỉ có danh sách không liên kết map.
2. Các tỉnh/thành có polygon thật đã kiểm tra; điểm khởi đầu nằm trong phần đất/chủ quyền dữ liệu đã chọn và đủ điều kiện chơi. Kiểm tra vùng MultiPolygon/đảo, nhãn và ranh sau đơn giản hóa.
3. Chọn ít nhất 6 khu tương phản từ dữ liệu: ven biển, đảo, miền núi, cao nguyên, đồng bằng sông và vùng cửa sông. Đối chiếu coastline, elevation range, slope và anchor với cùng bộ nguồn; dùng ảnh QA để xem hình khối đúng, không xác nhận chỉ bằng mắt.
4. Tại mỗi khu, đặt đường/nhà, cầu hoặc cảng khi hợp lệ; preview chi phí phụ thuộc terrain. Không cho xây cảng ở nơi không có nước nối tuyến biển hoặc dựng nhà dưới mặt biển mà không có công trình hỗ trợ.
5. Save/load giữ địa phương, anchor, tile/dataset version, seed phần game, đất, terrain edits và công trình. Bản đồ procedural/bản 38 × 38 cũ tiếp tục mở được, không ép migration đổi sang địa phương random.
6. Benchmark country view và local view theo G6, đo tải ban đầu, dung lượng data, memory, worker/building load và FPS. Người chơi quay camera/đổi tỉnh không tạo memory leak hoặc nhiều vòng render.
7. Giao deliverable: catalog, geometry/tiles thực sự có quyền dùng, scripts preprocess, sources/license manifest, docs/vietnam-map.md, migration và bản game chọn/xây/save được. Nếu mới làm spec/catalog mà chưa tải/kiểm tra geometry/DEM, phải ghi rõ chưa hoàn thành bản đồ thực.

### H7. Nguồn đã tra cứu ngày 08/10/2026

- Danh mục hiện hành trên Cổng TTĐT Chính phủ: https://chinhphu.vn/thong-tin-tinh-thanh
- Sắp xếp cấp tỉnh năm 2025 (đối chiếu nguồn gốc ranh/tên, không dùng làm trạng thái cuối của năm 2026): https://xaydungchinhsach.chinhphu.vn/chi-tiet-34-don-vi-hanh-chinh-cap-tinh-tu-12-6-2025-119250612141845533.htm
- Đồng Nai, Nghị quyết 30/2026/QH16 có hiệu lực 30/04/2026: https://chinhphu.vn/?classid=1&docid=218009&pageid=27160
- Quảng Ninh, Nghị quyết 36/2026/QH16 có hiệu lực 01/09/2026: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-36-2026-qh16-thanh-lap-thanh-pho-quang-ninh-tu-1-9-2026-119260903082603583.htm
- Bắc Ninh, Nghị quyết 39/2026/QH16 có hiệu lực 20/09/2026: https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-39-2026-qh16-thanh-lap-thanh-pho-bac-ninh-tu-20-9-2026-11926090308214813.htm
- NASA Earthdata / LP DAAC, tham khảo catalog DEM: https://www.earthdata.nasa.gov/centers/lp-daac
- OSM Copyright and License: https://www.openstreetmap.org/copyright

Các nguồn này xác minh danh mục/hiệu lực và định hướng dữ liệu. File đặc tả chưa kèm một bộ ranh/DEM Việt Nam đã tải hoặc đã kiểm chứng; khi triển khai phải hoàn thành pipeline và ghi dataset/version/giấy phép cụ thể. Không lấy một link nguồn làm bằng chứng rằng game đã mô phỏng chính xác địa hình.

## Lệnh tiếp tục dùng sau mỗi chặng

```text
Đọc docs/implementation-status.md và file Build_City_26_Full_Codex_Prompts.md. Xác định chặng kế tiếp chưa hoàn tất, kiểm tra mã nguồn thực tế thay vì chỉ tin status. Hoàn thành chặng đó, sửa các lỗi liên quan, chạy kiểm tra phù hợp và build. Giữ Auth, bản lưu, migration và chức năng đang chạy. Báo ngắn gọn những gì đã làm, bằng chứng kiểm tra và phần còn thiếu. Tiếp tục công việc trong phạm vi đã được giao; nếu thiếu cấu hình/quyền chỉ hỏi đúng phần chặn việc và làm phần độc lập trong lúc chờ.
```

## Tài liệu kỹ thuật chính thức để tra cứu khi triển khai

- Three.js Object3D: https://threejs.org/docs/pages/Object3D.html
- Three.js InstancedMesh: https://threejs.org/docs/pages/InstancedMesh.html
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth: https://supabase.com/docs/guides/auth
- Vercel Functions limits: https://vercel.com/docs/functions/limitations
- Vite trên Vercel: https://vercel.com/docs/frameworks/frontend/vite

Giá BC và hành vi mô phỏng trong đặc tả này do thiết kế game đề xuất, không suy ra từ các tài liệu triển khai phần mềm này.
