# BUILD CITY 26 — BỘ LỆNH PHÁT TRIỂN GAME WEB ĐẦY ĐỦ

## Cách dùng

Mở thư mục mã nguồn Build City 26 trong Codex và đưa file này vào cùng workspace. Gửi Lệnh 0 trước, rồi lần lượt Lệnh 1 → 20. Mỗi lệnh phải tạo ra chức năng chạy được và có bằng chứng kiểm tra. Có thể dùng lệnh tiếp tục ở cuối file để chuyển sang chặng kế tiếp.

**Yêu cầu mới đã chốt:** đăng ký đúng 3 ô **Tên thành phố · Tài khoản · Mật khẩu**, đăng nhập bằng tài khoản/mật khẩu; có **BXH cấp độ** và **BXH tiền**. Các yêu cầu này thay thế hướng đăng ký email và phạm vi không có leaderboard trong bản bàn giao trước.

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

Tạo docs/implementation-status.md để ghi từng chặng, phần đã kiểm chứng, giới hạn và việc tiếp theo. Làm theo Lệnh 1 → 20, mỗi lần hoàn thành một chặng có thể chơi được rồi kiểm tra. Giữ package-lock, cấu hình deploy, bản lưu và Auth đang hoạt động. Khi đổi schema, có migration và kiểm tra bản cũ.

Form đăng ký đúng 3 ô: Tên thành phố, Tài khoản, Mật khẩu. Không thêm email, số điện thoại hoặc ô xác nhận mật khẩu vào form này. Đăng nhập đúng 2 ô: Tài khoản, Mật khẩu. Bản cũ dùng email cần migration tương thích, không xóa tài khoản hoặc bản lưu cũ. Leaderboard là dữ liệu trực tuyến có chủ sở hữu, không phải bảng local giả lập.

Chỉ hỏi tôi khi thiếu quyền GitHub/Vercel, cấu hình Supabase hoặc quyết định thực sự chặn công việc. Trong lúc chờ, tiếp tục phần không phụ thuộc. Không ghi secret vào mã, log, bản lưu, prompt hay GitHub. Chỉ dùng publishable/anon key ở frontend.

Mỗi chặng phải có: thay đổi mã nguồn, chức năng tương tác được, kiểm tra phù hợp, một tình huống minh họa và báo cáo ngắn. Nếu còn thiếu thì ghi rõ; không đánh dấu hoàn thành chỉ vì có nút hoặc có model trang trí.
```

## Lệnh 1 — Nền mô phỏng, đồng hồ và bản lưu

```text
Tách phần core hiện tại thành các hệ thống độc lập: clock, world, roads, households, citizens, firms, vehicles, utilities, services, construction, economy, events và save. Hệ thống render đọc snapshot; không tự sửa state kinh tế. UI gửi command được validate vào core.

Dùng fixed timestep và một thứ tự cập nhật rõ ràng. Mọi khoảng cách tính bằng mét, diện tích m², điện kW/kWh, nước m³, tiền BC. Tính năng tăng tốc phải làm tăng đồng hồ mô phỏng cùng với chuyển động, lịch làm, hàng hóa và thu chi; không chỉ tăng ngày lịch trong khi xe đi ở một đồng hồ khác.

Có chế độ Quan sát để xem chuyển động ở vận tốc tự nhiên và chế độ tăng tốc để chơi. Tỷ lệ thời gian hiển thị rõ. Nếu cần nén lịch sinh hoạt, mô tả cấu hình đó trong docs/time-model.md và kiểm tra ETA, giờ làm và thời điểm đến nhất quán. Dùng lịch thực của mô phỏng cho độ dài tháng; bỏ giả định mọi tháng có 30 ngày.

Cho mỗi thực thể một ID ổn định, lưu seed của PRNG. Cùng seed và cùng command sequence phải tái tạo kết quả trong cùng phiên bản mô phỏng, trong mức sai số số học được quy định. Lưu vị trí, trạng thái, hành trình, lịch hẹn và RNG; tải lại không sinh thêm cư dân/xe hoặc trả tiền lần thứ hai.

Thiết kế command queue, domain events và transaction IDs để ngăn double-spend. Lưu stable state, không lưu object renderer, geometry, DOM hoặc toàn bộ cache tìm đường. Graph/cache được xây lại có kiểm soát sau load.

Tạo migration từ schemaVersion 1 của bản nền. Map cũ phải mở được. Mỗi ô cũ mặc định 20 × 20 m; công trình cũ được gán footprint phù hợp. Có thể chuyển số tiền cũ sang BC bằng hệ số 100 trong migration duy nhất, ghi rõ phiên bản đã chuyển và không áp dụng lại lần thứ hai. Cư dân tổng hợp cũ được phân bổ vào các hộ có sức chứa tương ứng mà không đổi tổng dân số ngoài sai số được báo cáo.

Kiểm tra: save/load giữa chuyến đi; save/load giữa xây dựng; hai lần load không tăng tiền hoặc dân số; replay một ngày không mất/nhân đôi thực thể; pause dừng mọi phần của mô phỏng; đổi tốc độ không thay đổi kết quả logic.
```

## Lệnh 2 — Bản đồ và renderer 3D riêng

```text
Nâng renderer sang Three.js theo từng bước, giữ core và bản lưu tách rời. Có bản 3D chạy được trước khi mở rộng cảnh vật. Tạo mesh riêng cho nhà, cửa hàng, nhà xưởng, công trình công cộng, người, xe và cây; không chép thiết kế có nhận diện của game khác.

Bản đồ có địa hình cao thấp, sông/hồ, bờ nước và vùng xây dựng. Dữ liệu địa hình là heightfield với đơn vị mét. Hiển thị độ dốc, cao độ và mặt nước; công trình đặt trên nền hợp lý, đường/cầu có cao độ thật. Không dựng nhà chìm vào đất hoặc xe chạy xuyên địa hình.

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

## Lệnh 20 — Kiểm chứng toàn hệ thống, GitHub và Vercel

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
