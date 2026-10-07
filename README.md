# Vote Clock — bản Firebase + Vercel

Đã điền cấu hình Firebase cho project `vote-ad3bf`. Đây là bản mã nguồn để bạn tự triển khai, không thay đổi bản web chatgpt.site trước đó.

## 1. Bật Firebase (bắt buộc)

Mở https://console.firebase.google.com/project/vote-ad3bf/overview

1. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable → Save.** Người dùng không thấy màn hình đăng nhập; ứng dụng tự tạo phiên ẩn danh để kiểm tra quyền.
2. **Build → Firestore Database → Create database**, dùng database **(default)**, Standard edition. Chọn vùng phù hợp, khởi tạo ở **Production mode**.
3. Trong **Firestore Database → Rules**, dán toàn bộ nội dung `firestore.rules`, rồi **Publish**. Rules này phục vụ riêng các đường dẫn `voteBoards`; nếu project đang có ứng dụng khác, hãy hợp nhất với rules hiện có thay vì ghi đè toàn bộ.
4. Sau khi có tên miền Vercel, vào **Authentication → Settings → Authorized domains**, thêm tên miền của bạn (chỉ tên miền, không có `https://`). Nếu API key đang được giới hạn theo website/API, cho phép tên miền mới và các API Firebase cần thiết.

Không dùng rules `allow read, write: if true`. Không cần Storage, Analytics, service-account JSON, Admin SDK hay khóa riêng cho bản này. `firebase-config.js` là cấu hình client; quyền dữ liệu do Firestore Rules kiểm soát.

## 2. Đưa lên Vercel

### Cách dùng GitHub

1. Giải nén ZIP. Đưa **nội dung bên trong** thư mục `vote-clock-firebase` lên một repository GitHub.
2. Trong Vercel chọn **Add New → Project**, import repository đó.
3. **Root Directory**: thư mục có `vercel.json` (nếu đưa cả thư mục lên GitHub thì chọn `vote-clock-firebase`).
4. **Framework Preset: Other**. **Build Command: để trống**. **Output Directory: public**. File `vercel.json` đã khai báo cấu hình này.
5. Deploy, rồi hoàn tất Authorized domains ở bước 1.

### Cách dùng dòng lệnh

Trong thư mục có `vercel.json`:

```sh
npx vercel --prod
```

Thực hiện đăng nhập Vercel theo hướng dẫn của CLI. Không upload file ZIP trực tiếp vào ô import repository.

## 3. Dùng chung cho nhiều người

- Lần đầu mở web sẽ tạo **một bảng riêng**. Bấm **Sao chép link bảng**, gửi toàn bộ link cho nhóm. Link có phần `#board=...&key=...`.
- Mọi người phải mở **cùng link đầy đủ** để dùng chung dữ liệu. Chỉ gửi tên miền sẽ không xác định bảng cần mở; trình duyệt mới sẽ tạo bảng khác.
- Không cần đăng nhập thủ công. Link chứa mã mời ngẫu nhiên; người giữ link được tham gia, xem và sửa toàn bộ bảng, bao gồm cột pass. Chỉ chia sẻ trong nhóm tin cậy.
- Mỗi người nhận có nhiều mail: nhập cùng tên vào cột Người nhận để tự gom nhóm. Bấm tên nhóm để thu gọn; **Thêm mail** trong nhóm tự điền người nhận.
- **Số giờ chờ** riêng cho mỗi mail, mặc định 15. Ví dụ `1.5` = 1 giờ 30 phút; chấp nhận số dương tối đa 8760 giờ.
- Nhập giờ trong cột ngày tương ứng. Qua ngày mới tự thêm cột, giữ lịch sử. Bộ đếm dựa trên lần vote mới nhất + số giờ chờ; đồng hồ và ngày lấy theo thiết bị.
- Mỗi ô ngày giữ một giờ vote cho mail đó. Vote nhiều lần cùng ngày sẽ thay giờ của ngày ấy; các ngày trước vẫn còn.
- Thay đổi được gom khoảng 0,5 giây trước khi lưu để giảm số lần ghi. Sửa các ô khác nhau được lưu theo từng trường; hai người sửa **cùng một ô** thì lần ghi sau cùng được giữ.
- Khi đang gõ, cập nhật từ người khác chờ bạn rời ô nhập để tránh làm gián đoạn. Bộ đếm vẫn chạy.
- Chờ dòng **Đã đồng bộ Firebase** trước khi đóng trang. Khi mất mạng/lưu lỗi, giữ tab mở và bấm Thử lưu lại. Bản này không bảo đảm khôi phục thay đổi chưa gửi khi đóng tab.
- Dữ liệu local trên tên miền chatgpt.site cũ không tự chuyển sang Vercel. Bản Firebase bắt đầu với bảng mới; không tự tải mật khẩu cũ lên mạng.

## 4. Quyền truy cập và vận hành

- Thành viên ẩn danh có thể đọc/ghi các dòng trong bảng đã tham gia bằng mã mời. Không thể liệt kê tất cả bảng hoặc đọc bảng chỉ nhờ biết API key.
- Bản này chưa có giao diện thu hồi thành viên/đổi mã mời. Người đã tham gia vẫn giữ quyền dù bạn ngừng gửi link. Khi cần tách nhóm, tạo bảng riêng mới; quản trị viên Firebase có thể xóa membership trong console.
- Không có mã hóa đầu cuối; quản trị viên project Firebase và thành viên bảng có thể xem mật khẩu. Dữ liệu hàng chỉ lưu trong bộ nhớ trang và Firestore; trình duyệt lưu phiên Firebase, link bảng gần nhất và trạng thái thu gọn nhóm.
- Nếu không muốn trình duyệt tự mở lại bảng cũ trên máy dùng chung, xóa dữ liệu website sau khi đã lưu link và đồng bộ xong.
- Firestore đọc/ghi được tính theo chính sách/quota của project. Không có cam kết sử dụng không giới hạn.

## 5. Kiểm tra sau khi cài

1. Mở link trên trình duyệt A, thêm mail thử và giờ vote, đợi Đã đồng bộ Firebase.
2. Sao chép link sang trình duyệt B hoặc cửa sổ ẩn danh; kiểm tra dòng xuất hiện.
3. Sửa Người nhận ở A và Số giờ chờ ở B; xác nhận cả hai thay đổi được giữ.
4. Xóa giờ mới nhất; kiểm tra bộ đếm quay về lần vote cũ nếu còn.
5. Kiểm tra rules bằng Firebase Rules Playground: người chưa tham gia không được đọc rows; thành viên hợp lệ được đọc/ghi; mã mời sai không được tạo membership. Một UID chỉ đọc/ghi membership của chính mình theo rules.

Chạy kiểm tra logic có sẵn, không cần cài dependencies:

```sh
npm test
```

Chạy thử web bằng HTTP thay vì nhấp đúp file HTML:

```sh
python -m http.server 8000 --directory public
```

Mở `http://localhost:8000`. Nếu cần, thêm `localhost` vào Authorized domains. SDK tải từ CDN của Firebase, nên cần internet.

Đã kiểm tra cú pháp JavaScript và logic đồng bộ theo trường, gom nhóm, giờ tùy chỉnh, qua ngày. **Chưa kiểm thử kết nối trên project Firebase thật, Rules bằng Emulator hoặc giao diện trình duyệt**; bạn cần hoàn tất cấu hình console và kiểm tra hai trình duyệt trước khi nhập dữ liệu thật.

## Cấu trúc

- `public/`: HTML, CSS trong HTML, JavaScript, cấu hình Firebase.
- `firestore.rules`: quy tắc truy cập bắt buộc publish.
- `vercel.json`: cấu hình static hosting.
- `firebase.json`, `.firebaserc`: dùng nếu muốn quản lý rules bằng Firebase CLI.
- `tests/sync.test.js`: kiểm tra logic bằng Node.js.

Tài liệu chính thức đã đối chiếu:
- https://firebase.google.com/docs/web/alt-setup
- https://firebase.google.com/docs/auth/web/anonymous-auth
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/firestore/manage-data/add-data
- https://vercel.com/docs/project-configuration
