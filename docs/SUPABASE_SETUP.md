# Kết nối Supabase và kiểm chứng tài khoản

Project URL đã cung cấp: `https://adnmfknbskbagiahstim.supabase.co`. SDK dùng URL gốc, không dùng phần `/rest/v1/`. `.env.local` đã có key công khai của người dùng và bị Git bỏ qua.

## 1. Chạy SQL

Trong dashboard Supabase của project → **SQL Editor → New query**:

- Project mới: sao chép toàn bộ `supabase/schema.sql`, bấm Run. File đã bao gồm migration mới.
- Project đã dùng v0.1: chạy 202610070001_reliable_saves.sql, rồi 202610080002_simulation_foundation.sql. Migration không xóa hàng cũ.
- Chạy `supabase/tests/rls.sql` sau đó. Kết quả mong đợi `PASS: RLS A/B, owner spoof, guest, retry, revision conflict and delete`. Script tạo hai danh tính tạm trong transaction và rollback tất cả; không cần mật khẩu, không xóa dữ liệu đang có.

Frontend không có quyền quản trị để chạy SQL bằng publishable key. Không cần cung cấp service_role hay mật khẩu database.

## 2. Email và redirect

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

## 3. Kiểm tra với hai tài khoản thật

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
