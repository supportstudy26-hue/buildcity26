# Đối chiếu phạm vi Build City 26

Đặc tả: toàn bộ Lệnh 0–28 / A–I, phiên bản nhận 09/10/2026. Đây là danh mục bắt buộc, không phải danh sách tính năng đã hoàn thành. Tiền hiển thị đồng game theo yêu cầu trực tiếp; vốn mới 100 triệu đồng thay A5. Nội bộ vẫn BC, không đổi số dư bản lưu cũ.

Tiến độ/bằng chứng: [implementation-status.md](implementation-status.md). Tiếp tục: [CODEX_HANDOFF.md](CODEX_HANDOFF.md).

## Nhóm I-01…I-20

| ID | Yêu cầu | Dependencies | Status | Module/config | UI | Save/migration | Kiểm tra/bằng chứng | Giới hạn |
|---|---|---|---|---|---|---|---|---|
| I-01 | Xây đường, giao lộ, cầu, hầm, bãi đỗ | Lệnh 3, 4, 7, 13, 20 | in_progress | src/game/core.js, systems/roads.js | Đường / inspector | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa lane/curve/hầm/parking |
| I-02 | AI giao thông và tìm đường đa phương thức | Lệnh 6, 7, 11, 21 | in_progress | src/game/systems/citizens.js, vehicles.js, roads.js | Cư dân / theo dõi | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa đa phương thức/đèn/va chạm |
| I-03 | Phân khu, nhà ở, thương mại, công nghiệp, văn phòng | Lệnh 5, 8, 12, Phụ lục F | in_progress | src/game/systems/households.js, firms.js, services.js | Phân khu | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa office/mixed/affordability |
| I-04 | Nâng cấp, mô-đun dịch vụ, công trình đặc biệt | Lệnh 13, 18, 24, Phụ lục F | in_progress | src/game/systems/construction.js | Công viên / công trường | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa tier 1–5/module trả tiền |
| I-05 | Toàn bộ dịch vụ đô thị trong I2 | Lệnh 9, 10, 23, 24 | in_progress | src/game/systems/services.js, utilities.js | Dịch vụ | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Đang dùng coverage; chưa contract I3 |
| I-06 | Sản xuất, truyền tải và mua bán điện | Lệnh 9, 12, 24 | in_progress | src/game/systems/utilities.js | Điện nước | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa kWh/nhiên liệu/cáp/nguồn đa loại |
| I-07 | Nước sạch, nước ngầm, nước thải | Lệnh 9, 24 | in_progress | src/game/systems/utilities.js | Điện nước | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa quality/pipe/tank/groundwater |
| I-08 | Vận tải hành khách và hàng hóa | Lệnh 11, 21 | in_progress | src/game/systems/roads.js | Vận tải / tuyến bus | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Bus còn tổng hợp; chưa boarding/cargo |
| I-09 | Xe đạp và hạ tầng đi bộ | Lệnh 3, 6, 7, 21 | not_started | — | Chưa có | Chưa có | Chưa chạy | Toàn nhóm chưa triển khai |
| I-10 | Cư dân, hộ gia đình và vòng đời | Lệnh 5, 6, 10, 23 | in_progress | src/game/systems/households.js, citizens.js | Cư dân | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa lifecycle/rent/trường/mua hàng |
| I-11 | Kinh tế đô thị, hộ và doanh nghiệp | Lệnh 4, 8, 12, 19 | in_progress | src/game/systems/economy.js | Ngân sách | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Municipal ledger có; chưa payroll/firm/hộ đầy đủ |
| I-12 | Tài nguyên và chuỗi sản xuất | Lệnh 8, 22 | in_progress | src/game/systems/firms.js | Phân khu công nghiệp | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa inventories/recipes/logistics |
| I-13 | Bản đồ, mở đất và chỉnh địa hình | Lệnh 2, 20, Phụ lục H | in_progress | src/game/geography/, systems/terrain.js | Bản đồ Việt Nam | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Khu xây 1,28 km; chưa full world/mua đất |
| I-14 | Khí hậu, môi trường và thiên tai | Lệnh 9, 14, 25 | in_progress | src/game/systems/services.js | Ô nhiễm / sự cố | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa weather/hydrology/evacuation |
| I-15 | Quận/khu vực và chính sách | Lệnh 14, 24 | not_started | — | Chưa có | Chưa có | Chưa chạy | Toàn nhóm chưa triển khai |
| I-16 | 100 cấp, EXP, nhiệm vụ và cây phát triển | Lệnh 18, 26, Phụ lục E | in_progress | src/config/progression.js, systems/progression.js | Nhiệm vụ | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | 14 mission casual; chưa E 300/BXH/account |
| I-17 | UI, lớp thông tin, thống kê và cảnh báo | Lệnh 15, 16, Phụ lục G | in_progress | src/app.js, src/ui/, src/icons.js | HUD / menu xây / inspector | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa toàn layers/search/graphs/mobile QA |
| I-18 | Bến cảng, cầu mở, hàng hải và ngư nghiệp | Lệnh 21, 22, 24 | not_started | — | Chưa có | Chưa có | Chưa chạy | Toàn nhóm chưa triển khai |
| I-19 | Công viên lớn, giải trí, du lịch, chợ và cứu hộ kết hợp | Lệnh 14, 23, 25 | in_progress | src/game/systems/utilities.js, render/scene-data.js | Công viên | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa visits/gate/ticket/tourism |
| I-20 | Editor, âm thanh, ảnh, tài khoản, lưu, BXH và phát hành | Lệnh 17, 19, 27, 28 | in_progress | src/services/, server/accounts.js, supabase/ | Tài khoản / lưu / Vercel | schema 6; giữ bản cũ | Kiểm thử chặng tại implementation-status; chưa chứng minh toàn nhóm | Chưa BXH/editor/audio/photo; live QA còn chưa đạt |

## Dịch vụ S01…S32

| ID | Yêu cầu/hoạt động | Dependencies | Status | Module/config | UI | Save/migration | Kiểm tra/bằng chứng | Giới hạn |
|---|---|---|---|---|---|---|---|---|
| S01 | Bảo trì đường: depot, tổ sửa, xe bảo trì; dọn tuyết ở preset phù hợp — Phát hiện xuống cấp, lên lịch, đi tới đoạn, sửa bằng vật tư/crew | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Condition phục hồi; chi phí và thời gian được ghi chưa triển khai |
| S02 | Y tế: phòng khám, bệnh viện nhỏ/lớn, cánh điều trị, viện nghiên cứu — Tiếp nhận, triage, bed/doctor/medicine, điều trị và ra viện; nghiên cứu có input/progress | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S03 | Cấp cứu: depot/garage ambulance, đội y tế và trực thăng cấp cứu — Nhận yêu cầu, dispatch, tiếp cận, đón/chuyển bệnh nhân, trả xe | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Không chữa khỏi từ xa trước khi đội tới; đủ sức chứa chưa triển khai |
| S04 | Hậu sự: nghĩa trang, nhà hỏa táng, gara xe tang — Thu nhận, vận chuyển, nhập plot/queue, xử lý theo tốc độ | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Plot có tổng giới hạn; tồn đọng ảnh hưởng hộ/khu chưa triển khai |
| S05 | Rác: điểm trung chuyển, landfill, lò đốt có phát điện, trung tâm tái chế — Thu gom theo tuyến, cân tải, phân loại/xử lý, nguyên liệu hồi/điện đúng yield | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S06 | Trường học: mầm non, tiểu học, trung học, nghề/cao đẳng, đại học — Tuyển, đường tới trường, teacher/class capacity, attendance, học và tốt nghiệp | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S07 | Học thuật: thư viện và cơ sở nghiên cứu trong campus — Mượn/đọc, chỗ dùng, nghiên cứu có staff/equipment/budget | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Visits/project output và costs đo được chưa triển khai |
| S08 | Cứu hỏa: trạm nhỏ/lớn, tower quan sát, depot trực thăng chữa cháy — Phát hiện, dispatch xe/heli, nước, tiếp cận, dập lửa, nạp lại | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S09 | Cứu nạn và cảnh báo: đội cứu hộ, trung tâm cảnh báo, shelter nhỏ/lớn — Sự kiện, báo động, evacuation routes/bus, intake shelter, supplies, rescue | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Người rời vùng nguy hiểm và vào shelter đúng chỗ chưa triển khai |
| S10 | Cảnh sát: đồn nhỏ/lớn, trụ sở, đội tuần tra — Tuần tra, tới vụ việc, điều tra giản lược, bắt/giữ/transfer đúng trạng thái | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S11 | Giam giữ: phòng tạm giữ và nhà tù — Tiếp nhận, giường, staff, chi phí, thời hạn theo luật game, thả/tái hòa nhập | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Không tự xóa cư dân phạm tội; custody/occupancy lưu được chưa triển khai |
| S12 | Phúc lợi: văn phòng trợ giúp, nhà ở xã hội, trung tâm cộng đồng — Eligibility, hồ sơ, trợ cấp trong ngân sách, tìm chỗ ở/việc và theo dõi | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Hộ nhận tiền/chỗ thật, trợ cấp không nhận lặp chưa triển khai |
| S13 | Chăm sóc: cơ sở trẻ em/người cao tuổi, trung tâm hỗ trợ tiếp cận — Care slots, ca/staff, dinh dưỡng, đi lại và phí/hỗ trợ theo hộ | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Care demand và phục vụ có hàng đợi, không nhân dân số chưa triển khai |
| S14 | Hành chính: tòa thị chính, trung tâm tài chính đô thị — Hồ sơ/policy/project capacity, khoản vay và điều kiện giao dịch vùng | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chi phí/giới hạn/modifier rõ; không nút in tiền chưa triển khai |
| S15 | Bưu chính: hòm thư, bưu cục, trung tâm phân loại, xe thư — Thư/kiện có sender/destination, pickup, sort, tuyến phát, kết nối ngoài | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Delivery event và backlog; thư không tự tới theo radius chưa triển khai |
| S16 | Viễn thông: tower, node mạng, trung tâm dữ liệu, uplink — Coverage và backhaul/throughput, thuê bao, power/staff, tải giờ cao điểm | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Quá tải/mất điện gây giảm chất lượng, bills đối chiếu chưa triển khai |
| S17 | Công viên: vườn nhỏ, quảng trường, depot bảo trì công viên — Đi tới nghỉ/chơi, occupancy, litter, staff đi bảo trì | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S18 | Thể thao/giải trí: sân thể thao, hồ bơi, phòng tập, sân vận động — Vé/member, bookings, lịch, crowd, năng lực an toàn | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S19 | Văn hóa: bảo tàng, bảo tàng hàng hải, nhà hát, nhà văn hóa — Lịch mở/show, ghế/chỗ, staff, vé, tham quan | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Khán giả thực, doanh thu từ vé đã bán chưa triển khai |
| S20 | Du lịch: khách sạn, resort, trung tâm thông tin và hội nghị — Booking, room-night, staff/linen/food, visitor itinerary, sự kiện | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Có khách lưu trú/checkout, không vượt rooms chưa triển khai |
| S21 | Công viên chuyên đề: city park lớn, zoo, amusement park, nature reserve — Gates/path, module, ticket, queue, care/safety/maintenance | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chạy ít nhất một ngày sự kiện và đo luồng khách chưa triển khai |
| S22 | Chợ: chợ dân sinh/đêm, container market, food stalls/trucks — Thuê chỗ, sourcing, storage, bán hàng, hygiene, giờ và delivery | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Inventory/cash đổi theo giao dịch, xe đỗ hợp lệ chưa triển khai |
| S23 | Điện: toàn bộ nguồn, storage, transformers và mạng trong I-06 — Phát/truyền/cấp/nhập/xuất, sửa chữa và nhiên liệu | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S24 | Nước sạch: toàn bộ pump/tank/mains trong I-07 — Lấy/trữ/cấp, giới hạn chất lượng/flow, hóa đơn | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S25 | Nước thải: outlet, treatment, sludge và mạng trong I-07 — Thu/xả/xử lý, contamination và vận chuyển byproduct | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S26 | Vận tải hành khách: depot/stop/ga/bến/airport trong I-08 — Tuyến, lịch, crew, fares, boarding, transfers | core/road/ledger; I3 | in_progress | src/config/catalog.js; src/game/systems/utilities.js, services.js | Menu xây / dịch vụ | schema 6 | tests/expanded-city.test.js + economy-services.test.js: coverage/capacity | Chưa nhân sự/queue/dispatch/arrival I3; chưa nghiệm thu S |
| S27 | Logistics: warehouse, cargo rail, port, cargo airport — Đơn, manifest, storage, loading slot, transport và giao | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Không ghi received trước arrival/unload chưa triển khai |
| S28 | Bãi đỗ/gửi xe: mặt đất, nhiều tầng, ngầm và bike parking — Tìm chỗ, reserve có TTL, đỗ, trả phí và lấy xe | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Không hai xe dùng cùng slot, có queue khi đầy chưa triển khai |
| S29 | Chống ngập: hồ điều tiết, kè, trạm bơm, gate và drainage — Giới hạn lưu lượng/điện, tích/xả, maintenance và weather input | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Khu bảo vệ chịu ảnh hưởng khác khi máy thiếu điện chưa triển khai |
| S30 | Cảng biển/phà: cảng mô-đun, bến khách/hàng, cổng/kho/bãi — Berth reservation, docking, loading và nối mạng ngoài | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Tàu chờ bến; passenger/cargo transfers đúng capacity chưa triển khai |
| S31 | Hàng hải tài nguyên: bến cá, trại nuôi, giàn dầu và nhà chế biến — Boat/tanker crew, catch/extract, stock, unloading, cold chain | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Stock giảm/hồi, hàng được giao trước khi ghi doanh thu chưa triển khai |
| S32 | Trung tâm cứu hộ kết hợp và điểm trực dịch vụ cảng — Nhiều queue độc lập và pools ambulance/fire/police/rescue hữu hạn | core/road/ledger; I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Hai incident đồng thời không double-book crew/xe chưa triển khai |

## Template con I2 (kể cả nguồn/xe tham chiếu I-06…08)

| ID | Template | Dependencies | Status | Module/config | UI | Save/migration | Cách kiểm tra/bằng chứng | Giới hạn |
|---|---|---|---|---|---|---|---|---|
| S01.01 | Depot bảo trì đường | S01/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S01.02 | Tổ sửa đường | S01/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S01.03 | Xe bảo trì | S01/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S01.04 | Dọn tuyết | S01/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S02.01 | Phòng khám | S02/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S02.02 | Bệnh viện nhỏ | S02/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S02.03 | Bệnh viện lớn | S02/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S02.04 | Cánh điều trị | S02/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S02.05 | Viện nghiên cứu y tế | S02/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S03.01 | Depot ambulance | S03/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S03.02 | Garage ambulance | S03/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S03.03 | Đội y tế | S03/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S03.04 | Trực thăng cấp cứu | S03/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S04.01 | Nghĩa trang | S04/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S04.02 | Nhà hỏa táng | S04/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S04.03 | Gara xe tang | S04/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S05.01 | Điểm trung chuyển rác | S05/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S05.02 | Landfill | S05/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S05.03 | Lò đốt phát điện | S05/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S05.04 | Trung tâm tái chế | S05/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S05.05 | Xe rác | S05/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S06.01 | Mầm non | S06/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S06.02 | Tiểu học | S06/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S06.03 | Trung học | S06/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S06.04 | Trường nghề | S06/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S06.05 | Cao đẳng | S06/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S06.06 | Đại học | S06/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S07.01 | Thư viện | S07/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S07.02 | Cơ sở nghiên cứu campus | S07/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S08.01 | Trạm cứu hỏa nhỏ | S08/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S08.02 | Trạm cứu hỏa lớn | S08/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S08.03 | Tower quan sát | S08/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S08.04 | Depot trực thăng chữa cháy | S08/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S08.05 | Xe cứu hỏa | S08/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S09.01 | Đội cứu hộ | S09/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S09.02 | Trung tâm cảnh báo | S09/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S09.03 | Shelter nhỏ | S09/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S09.04 | Shelter lớn | S09/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S09.05 | Bus sơ tán | S09/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S10.01 | Đồn cảnh sát nhỏ | S10/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S10.02 | Đồn cảnh sát lớn | S10/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S10.03 | Trụ sở cảnh sát | S10/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S10.04 | Đội tuần tra | S10/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S10.05 | Xe cảnh sát | S10/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S11.01 | Phòng tạm giữ | S11/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S11.02 | Nhà tù | S11/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S12.01 | Văn phòng trợ giúp | S12/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S12.02 | Nhà ở xã hội | S12/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S12.03 | Trung tâm cộng đồng | S12/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S13.01 | Cơ sở trẻ em | S13/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S13.02 | Chăm sóc người cao tuổi | S13/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S13.03 | Trung tâm hỗ trợ tiếp cận | S13/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S14.01 | Tòa thị chính | S14/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S14.02 | Trung tâm tài chính đô thị | S14/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S15.01 | Hòm thư | S15/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S15.02 | Bưu cục | S15/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S15.03 | Trung tâm phân loại | S15/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S15.04 | Xe thư | S15/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S16.01 | Tower viễn thông | S16/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S16.02 | Node mạng | S16/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S16.03 | Trung tâm dữ liệu | S16/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S16.04 | Uplink | S16/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S16.05 | Cáp viễn thông | S16/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S17.01 | Vườn nhỏ | S17/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S17.02 | Quảng trường | S17/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S17.03 | Depot bảo trì công viên | S17/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S18.01 | Sân thể thao | S18/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S18.02 | Hồ bơi | S18/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S18.03 | Phòng tập | S18/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S18.04 | Sân vận động | S18/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S19.01 | Bảo tàng | S19/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S19.02 | Bảo tàng hàng hải | S19/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S19.03 | Nhà hát | S19/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S19.04 | Nhà văn hóa | S19/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S20.01 | Khách sạn | S20/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S20.02 | Resort | S20/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S20.03 | Trung tâm thông tin | S20/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S20.04 | Trung tâm hội nghị | S20/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S21.01 | City park lớn | S21/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S21.02 | Zoo | S21/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S21.03 | Amusement park | S21/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S21.04 | Nature reserve | S21/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S21.05 | Park gates | S21/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S21.06 | Park modules | S21/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S22.01 | Chợ dân sinh | S22/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S22.02 | Chợ đêm | S22/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S22.03 | Container market | S22/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S22.04 | Food stall | S22/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S22.05 | Food truck | S22/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.01 | Điện gió | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.02 | Điện than nhỏ | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.03 | Điện than lớn | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.04 | Điện khí | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.05 | Điện mặt trời | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.06 | Địa nhiệt | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.07 | Thủy điện | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.08 | Hạt nhân | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.09 | Nguồn dự phòng | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.10 | Pin lưu trữ | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.11 | Transformer | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.12 | Mạng cao áp | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.13 | Mạng hạ áp | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.14 | Cáp điện | S23/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S23.15 | Trạm điện khu phố | S23/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S24.01 | Bơm mặt nước | S24/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S24.02 | Bơm nước ngầm | S24/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S24.03 | Bơm nâng cao | S24/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S24.04 | Tháp nước | S24/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S24.05 | Bể chứa | S24/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S24.06 | Mains/ống nước | S24/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S24.07 | Trạm nước khu phố | S24/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S25.01 | Cửa xả | S25/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S25.02 | Treatment nhỏ | S25/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S25.03 | Treatment lớn | S25/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S25.04 | Sludge/byproduct | S25/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S25.05 | Mạng cống | S25/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.01 | Bus thường | S26/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S26.02 | Bus điện | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.03 | Bus liên tỉnh | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.04 | Taxi | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.05 | Tram | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.06 | Metro | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.07 | Tàu vùng | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.08 | Phà | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.09 | Tàu khách | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.10 | Máy bay khách | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.11 | Depot | S26/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S26.12 | Stop | S26/I3 | in_progress | src/config/catalog.js; systems/utilities.js | Nhóm xây tương ứng | schema 6 | Xem status; chưa đạt scenario I6 | Có nền giản lược; chưa toàn hoạt động I3 |
| S26.13 | Ga | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.14 | Bến | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.15 | Airport | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.16 | Runway | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.17 | Taxiway | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S26.18 | Apron | S26/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.01 | Warehouse | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.02 | Cargo rail | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.03 | Cargo port | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.04 | Cargo airport | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.05 | Truck | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.06 | Van | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.07 | Tàu hàng | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.08 | Tàu biển hàng | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S27.09 | Máy bay hàng | S27/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S28.01 | Bãi đỗ mặt đất | S28/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S28.02 | Nhà đỗ nhiều tầng | S28/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S28.03 | Bãi đỗ ngầm | S28/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S28.04 | Bike parking | S28/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S29.01 | Hồ điều tiết | S29/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S29.02 | Kè/đê | S29/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S29.03 | Trạm bơm chống ngập | S29/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S29.04 | Gate nước | S29/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S29.05 | Drainage | S29/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S30.01 | Cảng mô-đun | S30/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S30.02 | Bến khách | S30/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S30.03 | Bến hàng | S30/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S30.04 | Cổng cảng | S30/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S30.05 | Kho cảng | S30/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S30.06 | Bãi cảng | S30/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S30.07 | Bến phà | S30/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S30.08 | Thiết bị bốc dỡ | S30/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S31.01 | Bến cá | S31/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S31.02 | Trại nuôi thủy sản | S31/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S31.03 | Giàn dầu | S31/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S31.04 | Nhà chế biến thủy sản | S31/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S31.05 | Boat đánh cá | S31/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S31.06 | Tanker | S31/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S31.07 | Kho lạnh | S31/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S32.01 | Trung tâm cứu hộ kết hợp | S32/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S32.02 | Điểm trực dịch vụ cảng | S32/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S32.03 | Pool ambulance | S32/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S32.04 | Pool fire | S32/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S32.05 | Pool police | S32/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |
| S32.06 | Pool rescue | S32/I3 | not_started | — | Chưa có | Chưa có | Chưa chạy | Chưa template/handler vận hành |

Các hàng `in_progress` giữ đúng phạm vi, không được tính là dịch vụ đầy đủ đã đạt. Không hiển thị công trình chưa có handler như nút mua giả. Template/vehicle I4, đường I1, ngành I12 và module F bổ sung theo registry khi triển khai; không xóa các dòng chưa đạt.

Thống kê: 20 nhóm + 32 dịch vụ + 173 template con I2. 0 nhóm hoặc dịch vụ đầy đủ đạt nghiệm thu I (các kiểm chứng nền nằm trong implementation-status).

## Record giá và template trong A/D/I4 (không bỏ khỏi phạm vi)

| ID | Template/record | Dependencies | Status | Module/config | UI | Save/migration | Cách kiểm tra/bằng chứng | Giới hạn |
|---|---|---|---|---|---|---|---|---|
| C-A1-001 | Mặt/nền đường hai làn | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m²; không tính icon/base alias là đã đạt |
| C-A1-002 | Mặt/nền đường bốn làn | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m²; không tính icon/base alias là đã đạt |
| C-A1-003 | Mặt/nền đường sáu làn | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m²; không tính icon/base alias là đã đạt |
| C-A1-004 | Mặt/nền cao tốc | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m²; không tính icon/base alias là đã đạt |
| C-A1-005 | Vỉa hè/lối đi bộ | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m²; không tính icon/base alias là đã đạt |
| C-A1-006 | Lối xe đạp | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m²; không tính icon/base alias là đã đạt |
| C-A1-007 | Mặt/nền cầu | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m²; không tính icon/base alias là đã đạt |
| C-A1-008 | Trụ cầu | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: trụ; không tính icon/base alias là đã đạt |
| C-A1-009 | Hầm đường bộ | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m² mặt cắt quy đổi của segment; không tính icon/base alias là đã đạt |
| C-A1-010 | Portal hầm | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: đầu hầm; không tính icon/base alias là đã đạt |
| C-A1-011 | Đào/đắp đất | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m³; không tính icon/base alias là đã đạt |
| C-A1-012 | Cáp điện phân phối | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m; không tính icon/base alias là đã đạt |
| C-A1-013 | Ống nước | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m; không tính icon/base alias là đã đạt |
| C-A1-014 | Cống nước thải | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m; không tính icon/base alias là đã đạt |
| C-A1-015 | Đường ray tram hai chiều | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m tuyến; không tính icon/base alias là đã đạt |
| C-A1-016 | Metro ngầm hai chiều | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: m tuyến; không tính icon/base alias là đã đạt |
| C-A1-017 | Đèn tín hiệu | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: giao lộ; không tính icon/base alias là đã đạt |
| C-A1-018 | Điểm crossing có tín hiệu | A1/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: điểm; không tính icon/base alias là đã đạt |
| C-A2-001 | Trạm phân phối điện | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 250.000 BC; không tính icon/base alias là đã đạt |
| C-A2-002 | Turbine gió | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.000.000 BC; không tính icon/base alias là đã đạt |
| C-A2-003 | Điện mặt trời | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.200.000 BC; không tính icon/base alias là đã đạt |
| C-A2-004 | Máy phát dự phòng | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 350.000 BC; không tính icon/base alias là đã đạt |
| C-A2-005 | Trạm bơm/cấp nước | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 650.000 BC; không tính icon/base alias là đã đạt |
| C-A2-006 | Bể chứa nước | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 200.000 BC; không tính icon/base alias là đã đạt |
| C-A2-007 | Xử lý nước thải | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.200.000 BC; không tính icon/base alias là đã đạt |
| C-A2-008 | Trạm trung chuyển rác | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 300.000 BC; không tính icon/base alias là đã đạt |
| C-A2-009 | Khu xử lý/chôn lấp | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 800.000 BC; không tính icon/base alias là đã đạt |
| C-A2-010 | Trường tiểu học | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.500.000 BC; không tính icon/base alias là đã đạt |
| C-A2-011 | Trường trung học | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.500.000 BC; không tính icon/base alias là đã đạt |
| C-A2-012 | Cơ sở đại học nhỏ | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 8.000.000 BC; không tính icon/base alias là đã đạt |
| C-A2-013 | Phòng khám | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.200.000 BC; không tính icon/base alias là đã đạt |
| C-A2-014 | Bệnh viện nhỏ | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 6.000.000 BC; không tính icon/base alias là đã đạt |
| C-A2-015 | Trạm cứu hỏa | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 900.000 BC; không tính icon/base alias là đã đạt |
| C-A2-016 | Trạm cảnh sát | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 800.000 BC; không tính icon/base alias là đã đạt |
| C-A2-017 | Depot bus | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 900.000 BC; không tính icon/base alias là đã đạt |
| C-A2-018 | Điểm dừng bus | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 12.000 BC; không tính icon/base alias là đã đạt |
| C-A2-019 | Depot tram | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.500.000 BC; không tính icon/base alias là đã đạt |
| C-A2-020 | Trạm tram | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 100.000 BC; không tính icon/base alias là đã đạt |
| C-A2-021 | Depot metro | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 8.000.000 BC; không tính icon/base alias là đã đạt |
| C-A2-022 | Trạm metro | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 4.000.000 BC; không tính icon/base alias là đã đạt |
| C-A2-023 | Công viên nhỏ | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 150.000 BC; không tính icon/base alias là đã đạt |
| C-A2-024 | Bãi đỗ xe mặt đất | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 60 BC/m²; không tính icon/base alias là đã đạt |
| C-A2-025 | Nhà kho công cộng | A2/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 400.000 BC; không tính icon/base alias là đã đạt |
| C-A3-001 | Ô tô hộ gia đình | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 25.000 BC; không tính icon/base alias là đã đạt |
| C-A3-002 | Xe máy | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 3.000 BC; không tính icon/base alias là đã đạt |
| C-A3-003 | Bus tiêu chuẩn | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 180.000 BC; không tính icon/base alias là đã đạt |
| C-A3-004 | Xe tải | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 100.000 BC; không tính icon/base alias là đã đạt |
| C-A3-005 | Xe rác | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 150.000 BC; không tính icon/base alias là đã đạt |
| C-A3-006 | Xe cứu thương | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 120.000 BC; không tính icon/base alias là đã đạt |
| C-A3-007 | Xe cứu hỏa | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 250.000 BC; không tính icon/base alias là đã đạt |
| C-A3-008 | Xe cảnh sát | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 45.000 BC; không tính icon/base alias là đã đạt |
| C-A3-009 | Đoàn tram | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.200.000 BC; không tính icon/base alias là đã đạt |
| C-A3-010 | Đoàn metro | A3/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 4.500.000 BC; không tính icon/base alias là đã đạt |
| C-A4-001 | Nhà thấp tầng | A4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 900 BC/m² sàn, chưa gồm đất; không tính icon/base alias là đã đạt |
| C-A4-002 | Chung cư thấp/trung tầng | A4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.100 BC/m² sàn, chưa gồm đất; không tính icon/base alias là đã đạt |
| C-A4-003 | Chung cư cao tầng | A4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.400 BC/m² sàn, chưa gồm đất; không tính icon/base alias là đã đạt |
| C-A4-004 | Cửa hàng | A4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.000 BC/m² sàn, chưa gồm đất/tồn kho; không tính icon/base alias là đã đạt |
| C-A4-005 | Nhà xưởng | A4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 800 BC/m² sàn + equipment theo ngành; không tính icon/base alias là đã đạt |
| C-A4-006 | Kho tư nhân | A4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 600 BC/m² sàn + equipment; không tính icon/base alias là đã đạt |
| C-D-001 | Bãi park-and-ride | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 300.000; không tính icon/base alias là đã đạt |
| C-D-002 | Ga hành khách nhỏ | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.000.000; không tính icon/base alias là đã đạt |
| C-D-003 | Ga hàng hóa | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 3.000.000; không tính icon/base alias là đã đạt |
| C-D-004 | Bến phà | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 700.000; không tính icon/base alias là đã đạt |
| C-D-005 | Cảng hàng hóa nhỏ | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 8.000.000; không tính icon/base alias là đã đạt |
| C-D-006 | Sân bay vùng nhỏ | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 15.000.000; không tính icon/base alias là đã đạt |
| C-D-007 | Nông trại | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 200.000; không tính icon/base alias là đã đạt |
| C-D-008 | Nhà kính | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 500.000; không tính icon/base alias là đã đạt |
| C-D-009 | Trại chăn nuôi | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 450.000; không tính icon/base alias là đã đạt |
| C-D-010 | Cơ sở đánh cá | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 400.000; không tính icon/base alias là đã đạt |
| C-D-011 | Lâm trường | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 300.000; không tính icon/base alias là đã đạt |
| C-D-012 | Xưởng gỗ | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 800.000; không tính icon/base alias là đã đạt |
| C-D-013 | Mỏ đá/quặng nhỏ | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.500.000; không tính icon/base alias là đã đạt |
| C-D-014 | Xưởng thực phẩm | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.200.000; không tính icon/base alias là đã đạt |
| C-D-015 | Xưởng vật liệu | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.800.000; không tính icon/base alias là đã đạt |
| C-D-016 | Nhà máy luyện kim | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 4.000.000; không tính icon/base alias là đã đạt |
| C-D-017 | Nhà máy điện tử | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 3.000.000; không tính icon/base alias là đã đạt |
| C-D-018 | Nhà máy dược | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 3.500.000; không tính icon/base alias là đã đạt |
| C-D-019 | Kho lạnh | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 800.000; không tính icon/base alias là đã đạt |
| C-D-020 | Nhà trẻ | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 600.000; không tính icon/base alias là đã đạt |
| C-D-021 | Trường nghề | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.000.000; không tính icon/base alias là đã đạt |
| C-D-022 | Thư viện | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 700.000; không tính icon/base alias là đã đạt |
| C-D-023 | Cơ sở chăm sóc người cao tuổi | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.000.000; không tính icon/base alias là đã đạt |
| C-D-024 | Khu nhà xã hội | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 3.000.000; không tính icon/base alias là đã đạt |
| C-D-025 | Nghĩa trang | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 700.000; không tính icon/base alias là đã đạt |
| C-D-026 | Nhà hỏa táng | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.000.000; không tính icon/base alias là đã đạt |
| C-D-027 | Trung tâm thể thao | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.200.000; không tính icon/base alias là đã đạt |
| C-D-028 | Sân vận động nhỏ | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 5.000.000; không tính icon/base alias là đã đạt |
| C-D-029 | Bảo tàng | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.000.000; không tính icon/base alias là đã đạt |
| C-D-030 | Nhà hát | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.500.000; không tính icon/base alias là đã đạt |
| C-D-031 | Khách sạn | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.000.000; không tính icon/base alias là đã đạt |
| C-D-032 | Trung tâm hội nghị | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 3.500.000; không tính icon/base alias là đã đạt |
| C-D-033 | Pin lưu trữ | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.000.000; không tính icon/base alias là đã đạt |
| C-D-034 | Trung tâm tái chế | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.800.000; không tính icon/base alias là đã đạt |
| C-D-035 | Trạm viễn thông | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 300.000; không tính icon/base alias là đã đạt |
| C-D-036 | Hồ điều hòa | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 400.000; không tính icon/base alias là đã đạt |
| C-D-037 | Trạm bơm chống ngập | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 600.000; không tính icon/base alias là đã đạt |
| C-D-038 | Shelter | D/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 500.000; không tính icon/base alias là đã đạt |
| C-I4-001 | Trung tâm phân loại bưu chính | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.400.000; không tính icon/base alias là đã đạt |
| C-I4-002 | Node/uplink viễn thông | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 900.000; không tính icon/base alias là đã đạt |
| C-I4-003 | Trung tâm dữ liệu | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 4.000.000; không tính icon/base alias là đã đạt |
| C-I4-004 | Trung tâm tài chính đô thị | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 5.500.000; không tính icon/base alias là đã đạt |
| C-I4-005 | Depot bảo trì công viên | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 350.000; không tính icon/base alias là đã đạt |
| C-I4-006 | Trụ sở cảnh sát lớn | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 3.000.000; không tính icon/base alias là đã đạt |
| C-I4-007 | Nhà tù nhỏ | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 4.500.000; không tính icon/base alias là đã đạt |
| C-I4-008 | Viện nghiên cứu y tế | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 6.000.000; không tính icon/base alias là đã đạt |
| C-I4-009 | Tower theo dõi cháy rừng | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 180.000; không tính icon/base alias là đã đạt |
| C-I4-010 | Depot trực thăng chữa cháy | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.800.000; không tính icon/base alias là đã đạt |
| C-I4-011 | Trung tâm cảnh báo thiên tai | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.500.000; không tính icon/base alias là đã đạt |
| C-I4-012 | Shelter nhỏ | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 500.000; không tính icon/base alias là đã đạt |
| C-I4-013 | Shelter lớn | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.200.000; không tính icon/base alias là đã đạt |
| C-I4-014 | Trung tâm cứu hộ kết hợp | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 5.000.000; không tính icon/base alias là đã đạt |
| C-I4-015 | Nhà đỗ xe nhiều tầng | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.200.000; không tính icon/base alias là đã đạt |
| C-I4-016 | Bãi đỗ xe ngầm | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.000.000; không tính icon/base alias là đã đạt |
| C-I4-017 | Bãi gửi xe đạp | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 20.000; không tính icon/base alias là đã đạt |
| C-I4-018 | Cổng/cơ sở quản lý công viên lớn | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 450.000; không tính icon/base alias là đã đạt |
| C-I4-019 | Cổng và khu chăm sóc sở thú | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.500.000; không tính icon/base alias là đã đạt |
| C-I4-020 | Cổng/quản lý khu vui chơi | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.500.000; không tính icon/base alias là đã đạt |
| C-I4-021 | Cổng/trạm khu bảo tồn | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 400.000; không tính icon/base alias là đã đạt |
| C-I4-022 | Chợ/container market cơ sở | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 600.000; không tính icon/base alias là đã đạt |
| C-I4-023 | Bảo tàng hàng hải | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 2.000.000; không tính icon/base alias là đã đạt |
| C-I4-024 | Trung tâm hội nghị | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 3.500.000; không tính icon/base alias là đã đạt |
| C-I4-025 | Trạm an ninh/cứu hộ cảng | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 1.200.000; không tính icon/base alias là đã đạt |
| C-I4-026 | Bến cá nhỏ | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 700.000; không tính icon/base alias là đã đạt |
| C-I4-027 | Trại nuôi thủy sản | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 900.000; không tính icon/base alias là đã đạt |
| C-I4-028 | Giàn khai thác dầu ngoài khơi | I4/I3 | not_started | Chưa đủ record quantity/crew/input; một số mapping nền ở catalog.js | Chưa đủ flow I3 | Chưa đầy đủ | Chưa nghiệm thu theo record này | Giá yêu cầu: 12.000.000; không tính icon/base alias là đã đạt |
