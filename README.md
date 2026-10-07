# Vote Clock — Một bảng chung cho tất cả

Bản này dùng cấu hình Firebase project `vote-ad3bf`, không có màn hình đăng nhập. Ai mở web đều sử dụng cùng bảng `voteBoards/shared-vote-board-global`. Không cần mã mời, không cần link riêng.

## Cập nhật bản đã triển khai

1. Thay mã nguồn repository bằng nội dung ZIP này, giữ đúng thư mục `public` và `vercel.json` ở gốc dự án. Commit để Vercel triển khai lại.
2. **Bắt buộc** dán nội dung `firestore.rules` mới vào Firestore Database → Rules → Publish. Rules cũ dùng mã mời sẽ không cho phiên mới mở bảng chung.
3. Giữ Authentication → Sign-in method → **Anonymous** ở trạng thái Enable.
4. Mở lại web, nhấn Ctrl+F5. Gửi tên miền web thông thường cho mọi người.

## Đưa lên Vercel lần đầu

1. Giải nén, upload toàn bộ nội dung thư mục này lên repository GitHub.
2. Vercel → Add New → Project → Import repository.
3. Framework: **Other**. Root: thư mục có `vercel.json`. Build Command: để trống. Output Directory: **public**. Không cần Environment Variables.
4. Deploy.
5. Firebase: tạo Cloud Firestore database **(default)**, Standard edition, Production mode; publish `firestore.rules`; bật Anonymous Authentication. Thêm tên miền Vercel vào Authentication → Settings → Authorized domains. Nếu project có ứng dụng khác, hợp nhất các rules cần thiết thay vì ghi đè rules của ứng dụng đó.

## Dữ liệu và quyền

- Mọi người mở web đều có thể xem, thêm, sửa, xóa các dòng của **bảng chung**, bao gồm mail và pass. Phiên xác thực ẩn danh được tạo tự động; không giới hạn đối tượng bằng tài khoản người dùng hay mã mời.
- Chỉ đường dẫn bảng chung được mở cho mọi phiên xác thực. Các bảng riêng cũ vẫn theo quyền thành viên cũ, không bị tự mở công khai hoặc xóa.
- **Bảng chung mới ban đầu trống. Dữ liệu bảng riêng cũ và dữ liệu local không tự chuyển sang bảng chung.** Nếu trước đây đã nhập dữ liệu, cần chuyển riêng; giữ bản cũ/link cũ để lấy dữ liệu.
- Không mã hóa đầu cuối. Quản trị viên Firebase và người truy cập web có thể xem mật khẩu.
- Ai sửa cùng một ô sau cùng thì giá trị của lần ghi sau cùng được giữ. Các ô khác nhau được đồng bộ theo từng trường.
- Chờ trạng thái **Đã đồng bộ Firebase** trước khi đóng trang. Khi mất mạng/lưu lỗi, giữ tab và thử lưu lại; không bảo đảm giữ thay đổi chưa gửi nếu đóng tab.
- Firestore áp dụng quota/chi phí của project. Bộ đếm chạy trên thiết bị, không ghi Firebase mỗi giây.

## Tính năng

- Gom nhóm mail theo Người nhận, thu gọn/mở rộng, thêm mail trong nhóm.
- Mỗi mail có số giờ chờ riêng, mặc định 15; số dương tối đa 8760, hỗ trợ số lẻ như 1.5.
- Cột giờ vote riêng cho từng ngày; tự thêm ngày mới và giữ ngày cũ. Mỗi ngày giữ một giờ cho một mail.
- Bộ đếm lấy lần vote mới nhất + số giờ chờ. Ngày và giờ theo thiết bị.
- Đã bỏ tiêu đề giới thiệu, phần hướng dẫn giao diện và các nút tạo/chia sẻ bảng riêng.

## Kiểm tra

Chạy `npm test` để kiểm tra logic; không cần cài thư viện. Chạy web local bằng `python -m http.server 8000 --directory public` rồi mở http://localhost:8000 (cần internet để tải SDK).

Sau khi cài Firebase, mở tên miền ở hai trình duyệt: thêm dòng thử ở A, xác nhận B thấy dòng; sửa ô ở B, xác nhận A thấy thay đổi. Không cần gửi phần #board hay #key. Thử với dữ liệu giả trước khi dùng dữ liệu thật.

Đã kiểm tra cú pháp và logic cục bộ. Chưa kiểm thử kết nối project Firebase thật, Firestore Rules bằng Emulator hay giao diện trình duyệt trong môi trường triển khai.

Tài liệu chính thức:
- https://firebase.google.com/docs/auth/web/anonymous-auth
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/web/alt-setup
- https://vercel.com/docs/project-configuration
