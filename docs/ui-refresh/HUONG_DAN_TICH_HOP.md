# Tích hợp giao diện

## Dùng với game DOM/Vite/JavaScript

Copy `ui/` vào thư mục source, import CSS một lần. Vùng game cần `position:relative`, kích thước xác định và engine canvas ở phía dưới. Tạo một HUD khi mount, hủy khi rời màn chơi. Không gắn HUD vào `document.body` nếu game có viewport riêng.

```js
import './ui/bc26-ui.css';
import { createCityHud } from './ui/bc26-hud.js';

const hud = createCityHud(gameViewport, makeHudSnapshot(simulation), action => {
  // Đây là điểm nối. Tên hàm/engine phải được thay theo repository thực tế.
  dispatchGameAction(action);
});

// Subscribe dữ liệu đã chọn hoặc throttle khoảng 200–250ms, không gọi ở mỗi frame.
const unsubscribe = subscribeHudSnapshot(snapshot => hud.update(snapshot));

// Khi chọn công trình trên bản đồ, update selectedBuilding trước rồi mở bảng.
function inspectBuilding(building) {
  hud.update(makeHudSnapshot(simulation, building));
  hud.showBuilding();
}

// Cleanup khi unmount; các subscription của game phải được hủy riêng.
function cleanup() { unsubscribe(); hud.destroy(); }
```

Các hàm `makeHudSnapshot`, `dispatchGameAction`, `subscribeHudSnapshot` ở trên là hợp đồng cần viết theo game hiện tại, **không phải API có sẵn trong gói**. Adapter không biết engine của repo và không tự dựng công trình hay lưu Supabase.

## Dùng với React/Next.js

Ưu tiên chuyển các phần HUD thành React component và dùng snapshot selector/memo theo store đang có. Nếu dùng adapter trực tiếp, tạo nó trong `useEffect` với ref tới container; gọi `update` khi snapshot đổi; trả `destroy` trong cleanup. Chỉ chạy trên client, không truy cập HTMLElement/document trong SSR. `onAction` phải dùng callback/ref cập nhật để không giữ state cũ. Không vừa render lại React children vừa để adapter sở hữu cùng container.

## Ý nghĩa dữ liệu

Đọc toàn bộ `ui/bc26-hud.d.ts` khi viết adapter snapshot. Giá trị số hợp lệ là number hữu hạn, không phải chuỗi. Undefined không bị coi là zero. Một snapshot truyền vào `update` là **đầy đủ**, không phải patch.

| Trường | Đơn vị/quy tắc |
|---|---|
| money / income / expense / debt | Đơn vị tiền game; income/expense cùng kỳ ngân sách |
| budgetPeriodLabel | Ví dụ “ngày”, khớp kỳ tính tiền thật của game |
| electricity.coveragePct / water.coveragePct | Phần trăm 0–100, định nghĩa mẫu số rõ trong game; undefined nếu chưa xác định |
| capacity / demand / unit | Cùng đơn vị; MW hoặc m³/ngày chỉ khi engine thật dùng các đơn vị đó |
| population / populationDelta | Cư dân thực và tăng/giảm trong cùng kỳ đang ghi trên HUD |
| happinessPct / employmentPct / housedPct | Phần trăm 0–100 từ mô phỏng |
| xpIntoLevel / xpToNext | EXP trong cấp hiện tại / EXP để lên cấp kế tiếp; không dùng lifetimeXP thay thế |
| level | 1–100; cấp100 hiển thị thanh đầy |
| mission.current / target | Tiến độ tổng hợp của nhiệm vụ thật; điều kiện all/any phải do mission evaluator tính |
| mission.claimable / claimed | Trạng thái chính thức từ hệ thống nhiệm vụ, không chỉ dựa thanh tiến độ100% |
| selectedBuilding | Giá/lợi ích/canUpgrade/canDemolish từ engine; quyết định phải được kiểm tra lại khi hành động |
| catalogue | Catalogue thật, ID ổn định; category nhómUI không thay building kind/save ID |
| gameDateLabel / paused | Thời gian và pause thật của game; adapter không tự chạy đồng hồ |

Chỉ số %, đơn vị và giá phải được validator ở nguồn dữ liệu xác nhận. Adapter gói này không sửa dữ liệu sai thành số “đẹp”. Nếu giá trị % ngoài0–100 thì sửa adapter nguồn, không dùng clamp để che lỗi mô phỏng.

## Sự kiện giao diện

| Action | Trách nhiệm của game |
|---|---|
| save | Chụp state thật, lưu và báo loading/success/failure; không báo lưu thành công trước khi hoàn tất |
| settings / map / ranking / budget / missions | Mở phần chức năng đang có; kiểm tra tải/lỗi/empty của dữ liệu |
| layers | Mở lớp phủ; `layer` có thể là electricity hoặc water |
| pause | Áp dụng paused vào clock/worker, không chỉ đổi icon |
| build | Bắt đầu công cụ placement với ID thật; xác nhận cost/level/terrain/connectivity ở bước xây |
| upgrade | Kiểm tra điều kiện và trừ tiền/thay capacity/service đúng cơ chế |
| demolishRequest | Mở confirm; sau xác nhận mới xử lý tháo dỡ |
| claimMission | Gọi hệ thống nhận thưởng chống trùng, cập nhật snapshot từ kết quả |
| locate | Di chuyển camera tới vị trí thật theo kiểu tọa độ của game |
| tool | Kích hoạt terrain/bulldoze theo engine |

Gói này không có màn confirm phá dỡ sản xuất hay loader Supabase. Các phần đó cần nối hoặc bổ sung trong repository. Các nút map/BXH/settings/budget toàn trang chỉ phát action để mở trang/bảng hiện có; không có trang mẫu giả backend.

## Icon

48 SVG riêng có thể dùng bằng `<img src="/assets/icons/money.svg" alt="">` và đặt tên trên button. Nếu icon thể hiện ý nghĩa duy nhất, cung cấp alt phù hợp. Có thể dùng sprite `href="/assets/icons.sprite.svg#bc26-money"` trong cùng origin; HUD hiện tại dùng SVG nội tuyến để không phụ thuộc đường dẫn asset. Không thêm toàn bộ sprite và bản riêng vào cùng bản render khi không cần.

Màu duotone cố định theo loại trong file. Có thể sửa generator để đổi palette đồng loạt. Không phải PNG 3D; SVG vector là tài nguyên giao diện dùng được trực tiếp.

## Ngưỡng cảnh báo trong bản adapter

- Điện/nước <75%: “Thiếu nghiêm trọng”, màu hồng/đỏ.
- 75–<90%: “Cần cải thiện”, màu vàng.
- ≥90%: “Được phục vụ”, màu xanh.
- Chưa có dữ liệu: dấu “—”, màu chữ phụ.

Đây là quy tắc **trình bày**, không tính lại power/water hay tự cho người dân đủ dịch vụ. Điều chỉnh theo warning subsystem thực của game nếu đã có.

## Tái tạo / kiểm tra

`python3 source/build_pack.py` tái tạo SVG/danh mục/module và HTML xem thử bằng thư viện chuẩn Python. Không tự chụp screenshot.

`source/qa.cjs` dùng Playwright và Chromium để kiểm tra preview. Máy đã có các gói QA có thể chạy `node source/qa.cjs`; có thể chỉ định module bằng `BC26_PLAYWRIGHT`, `BC26_CHROMIUM`, và binary có sẵn bằng `BC26_BROWSER_PATH`. Các thư viện QA này không được import vào production game.

Ảnh chụp/QA của gói chỉ kiểm tra bản xem thử. Repo thật vẫn cần kiểm tra source adapter, quyền nhận thưởng, save/load, input canvas và hiệu năng scene3D.
