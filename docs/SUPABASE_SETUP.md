# Kết nối Supabase và kiểm chứng tài khoản

Project URL đã cung cấp: `https://adnmfknbskbagiahstim.supabase.co`. SDK dùng URL gốc, không dùng phần `/rest/v1/`. `.env.local` đã có key công khai của người dùng và bị Git bỏ qua.

## 1. Chạy SQL

Trong dashboard Supabase của project → **SQL Editor → New query**:

- Project mới: sao chép toàn bộ `supabase/schema.sql`, bấm Run. File đã bao gồm migration mới.
- Project đã dùng v0.1: chạy 202610070001_reliable_saves.sql, rồi 202610080002_simulation_foundation.sql. Migration không xóa hàng cũ.
- Chạy `supabase/tests/rls.sql` sau đó. Kết quả mong đợi `PASS: RLS A/B, owner spoof, guest, retry, revision conflict and delete`. Script tạo hai danh tính tạm trong transaction và rollback tất cả; không cần mật khẩu, không xóa dữ liệu đang có.

Frontend không có quyền quản trị để chạy SQL bằng publishable key. Không cần cung cấp service_role hay mật khẩu database.

## 2. Tài khoản mới trên Vercel

Đăng ký đúng ba ô: Tên thành phố, Tài khoản, Mật khẩu. API `/api/account` tạo Supabase Auth identity riêng không nhận email người chơi, trả JWT của chính người chơi và tạo profile/thành phố đầu tiên atomically. Không lưu mật khẩu hoặc mã dự phòng plaintext trong DB/save.

Frontend: `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY` (hoặc anon key). Server: đặt `SUPABASE_SECRET_KEY` hoặc `SUPABASE_SERVICE_ROLE_KEY` trong Vercel, bật Sensitive, Production/Preview; tuyệt đối không đặt tiền tố VITE. Server dùng lại URL/key công khai hoặc biến `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`. Muốn kiểm thử local API, nhập secret trong `.env.local` bị ignore; không cần gửi qua chat.

Project đang có schema 6: chạy migration 202610080006_username_accounts.sql và 202610080007_recovery_code_rotation.sql. Mapping/rate-limit ở schema private, RLS bật và anon/authenticated không có quyền; API quản trị chỉ service_role gọi được. Public profiles chỉ đọc profile chính mình. Cấu hình Email provider vẫn bật để đăng nhập password; tắt public sign-up nếu project chỉ phục vụ game này, Admin API vẫn tạo tài khoản. Giữ luồng email/reset cho tài khoản cũ. Nếu project dùng chung ứng dụng khác, kiểm tra trước khi đổi global signup.

Giữ mã dự phòng ở nơi riêng. Khôi phục đổi mật khẩu, tiêu thụ mã cũ, phát mã mới; RLS khóa phiên cũ ngay và global sign-out khóa refresh token. Nếu mất phản hồi sau đổi mật khẩu, thử đăng nhập bằng mật khẩu mới; thư viện có Tạo mã dự phòng mới, yêu cầu JWT và nhập lại mật khẩu. Không thể tự khôi phục nếu mất cả mật khẩu và mã.

Kiểm thử deployment thật: đặt `QA_BASE_URL` bằng domain đã Ready, `QA_ALLOW_CREATE=1`, chạy `npm run test:accounts:live`. Script tạo hai tài khoản QA riêng, thông tin xác thực chỉ giữ RAM; không in token/mật khẩu/mã. Kiểm tra register/retry, login, recovery, code rotation, JWT RLS A/B, private RPC, giả owner, hai thiết bị, conflict và xóa bản QA riêng. Hai tài khoản/first cities QA còn lại được báo tên để chủ project quản lý. Không chạy lại vô hạn.

## 3. Email và redirect cho tài khoản cũ

Authentication → Providers → Email: bật đăng ký email, xác nhận email và chính sách mật khẩu phù hợp. Authentication → URL Configuration:

```text
Site URL khi chạy local: http://127.0.0.1:5173/
Redirect URLs:
http://127.0.0.1:5173/**
http://localhost:5173/**
```

Sau khi Vercel deploy thành công, đổi Site URL thành URL production và thêm đúng URL production (ví dụ `https://domain-thuc-te.vercel.app/`). Không dùng domain ví dụ làm URL thật. QA port 5174 chỉ cần thêm redirect nếu thử email ở port này.

Trong Email Templates, giữ link dựa trên `{{ .ConfirmationURL }}` để SDK PKCE nhận callback đúng. Mở link trong trình duyệt đã gửi yêu cầu, trên đúng host (`localhost` và `127.0.0.1` là hai nơi lưu verifier khác nhau). Nếu link hết hạn hoặc mở sai trình duyệt, gửi lại xác nhận/đặt lại.

Email production: cấu hình Custom SMTP theo nhà cung cấp email của bạn. Dịch vụ mặc định có giới hạn; kiểm tra log Auth khi email không đến. Không đặt mật khẩu SMTP trong biến frontend.

Tài liệu chính thức: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates), [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 4. Kiểm tra tương thích email cũ bằng hai tài khoản thật

Tạo hai tài khoản QA A/B bằng email bạn kiểm soát trong game, mở email xác nhận. Không cần gửi mật khẩu qua chat. Tạo `.env.test.local` chỉ trên máy của bạn:

```env
QA_A_EMAIL=email-A-cua-ban
QA_A_PASSWORD=mat-khau-A
QA_B_EMAIL=email-B-cua-ban
QA_B_PASSWORD=mat-khau-B
```

Chạy `npm run test:live`. Script đăng nhập A/B, thử tạo/lưu/mở qua client thứ hai, giả owner, đọc/sửa/xóa chéo tài khoản, guest, retry cùng request, revision cũ và xóa QA. Các thành phố QA có UUID riêng và được dọn trong finally. Nếu dọn thất bại, script in UUID cần dọn; không in mật khẩu/token.

Sau đó kiểm tra bằng giao diện:

1. Đăng ký → email xác nhận → đăng nhập → gửi lại email khi cần.
2. A lưu và mở thành phố; đăng nhập A trên thiết bị thứ hai để tiếp tục. B phải có danh sách riêng.
3. Quên mật khẩu → mở email cùng trình duyệt → đặt mật khẩu mới → đăng nhập lại. Chỉ người dùng nhập mật khẩu mới.
4. Hai thiết bị cùng mở một revision: thiết bị 1 lưu, thiết bị 2 phải báo xung đột. Thiết bị 2 xuất JSON hoặc lưu bản mới rồi mở bản cloud.
5. Mất mạng: lưu trên thiết bị và hàng đợi; có mạng lại phải gửi cùng request. Với server 5xx/timeout, giữ pending và thử lại; không báo đã đồng bộ khi chưa nhận xác nhận.
6. Tạo/mở/import thành phố khác: kiểm tra Bản dự phòng trên máy. Đăng xuất chỉ thiết bị hiện tại, không làm mất các thành phố cloud.

## Trạng thái kiểm chứng hiện tại

08/10/2026: đã chạy schema và migration schema 3 trên project thật. SQL kiểm tra RLS A/B trong transaction rollback PASS, cities RLS bật với 4 owner policies, RPC nhận schema 3. Ảnh bằng chứng trong docs. Chưa kiểm chứng Auth/JWT Data API hai tài khoản hoặc email/recovery thật. Hướng dẫn email ở trên chỉ là luồng tương thích cũ; đăng ký username mới không dùng email và sẽ được triển khai bằng API server ở Lệnh 17.

09/10/2026: API username và UI đã viết, 100/100 toàn bộ tests PASS; sau bổ sung mã mới kiểm thử riêng 6/6 PASS. Migration tài khoản 006 và mã dự phòng 007 đã chạy thành công trên project thật. Chưa có secret server/GitHub push/deployment Ready hoặc QA Auth/JWT thật; các PASS account tests hiện là PGlite/injected SDK.

Database thật đã kiểm tra quyền bằng metadata query: private/profile RLS bật; authenticated không có private schema usage hoặc admin lookup RPC execute; service_role có code rotation RPC; restrictive policy khóa phiên cũ tồn tại. Ảnh docs/supabase-accounts-verified.png. Đây chưa phải kiểm chứng Auth JWT A/B thật.

### Địa phương khi đăng ký

Migration `202610090008_registration_geography.sql` đã chạy trên project thật ngày 09/10/2026. Bổ sung lựa chọn địa phương đầu tiên bất biến khi đăng ký lại cùng request; không chuyển địa hình các thành phố cũ. Function `/api/account` cần đóng kèm `public/geodata/vn-20261008/*.json` (đã có `includeFiles` trong vercel.json). Đăng ký không chọn địa phương dùng bản đồ Bình Minh. Client chỉ gửi mã region đã chọn; server kiểm catalog, kích thước/checksum và dựng save schema 6. Cần kiểm lại function trên deployment thật trước khi xác nhận đăng ký production đạt.
