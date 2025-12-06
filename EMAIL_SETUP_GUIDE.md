# Hướng dẫn cấu hình Email Service

## Tính năng gửi email

Hệ thống sẽ tự động gửi email thông báo trong các trường hợp sau:

1. **Đăng ký bằng Google thành công** - Email chào mừng
2. **Đăng ký làm tài xế** - Email xác nhận đã nhận đơn
3. **Admin phê duyệt tài xế** - Email thông báo đã được phê duyệt
4. **Admin từ chối tài xế** - Email thông báo từ chối kèm lý do

## Cấu hình Gmail

### Bước 1: Bật xác thực 2 bước (2-Step Verification)

1. Truy cập: https://myaccount.google.com/security
2. Tìm mục **"2-Step Verification"** và bật nó lên
3. Làm theo hướng dẫn để hoàn tất

### Bước 2: Tạo App Password

1. Sau khi bật 2-Step Verification, truy cập: https://myaccount.google.com/apppasswords
2. Chọn **"Select app"** → Chọn **"Mail"**
3. Chọn **"Select device"** → Chọn **"Other (Custom name)"**
4. Nhập tên: `DCBike` hoặc tên bạn muốn
5. Click **"Generate"**
6. Google sẽ hiển thị một mật khẩu 16 ký tự (ví dụ: `abcd efgh ijkl mnop`)
7. **Copy mật khẩu này** (bỏ khoảng trắng)

### Bước 3: Cập nhật file .env

Mở file `.env` và cập nhật các dòng sau:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com           # ← Thay bằng email Gmail của bạn
EMAIL_PASSWORD=abcdefghijklmnop           # ← Thay bằng App Password (16 ký tự, không có khoảng trắng)
```

**Ví dụ thực tế:**
```env
EMAIL_SERVICE=gmail
EMAIL_USER=dcbike.service@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

### Bước 4: Khởi động lại server

```bash
npm start
```

Nếu cấu hình đúng, bạn sẽ thấy: `✓ Email service đã được cấu hình`

## Sử dụng dịch vụ email khác (không phải Gmail)

Nếu bạn muốn dùng email service khác, cập nhật file `.env`:

### Outlook/Hotmail:
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo:
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-app-password
```

### SMTP tùy chỉnh:
Nếu muốn dùng SMTP server riêng, cập nhật `services/EmailService.js`:

```javascript
this.transporter = nodemailer.createTransporter({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Kiểm tra hoạt động

### Test 1: Đăng ký bằng Google
1. Đăng xuất nếu đang đăng nhập
2. Click "Đăng nhập bằng Google"
3. Chọn tài khoản Google (chưa đăng ký trước đó)
4. Kiểm tra hộp thư email → Bạn sẽ nhận được email chào mừng

### Test 2: Đăng ký làm tài xế
1. Đăng nhập vào hệ thống
2. Vào Profile → Đăng ký làm tài xế
3. Điền đầy đủ thông tin và gửi
4. Kiểm tra email → Bạn sẽ nhận được email xác nhận

### Test 3: Admin duyệt/từ chối
1. Đăng nhập bằng tài khoản admin
2. Vào quản lý đơn đăng ký tài xế
3. Phê duyệt hoặc từ chối một đơn
4. User sẽ nhận được email thông báo

## Xử lý lỗi

### Lỗi: "Email service chưa được cấu hình"
- Kiểm tra file `.env` đã có `EMAIL_USER` và `EMAIL_PASSWORD` chưa
- Khởi động lại server

### Lỗi: "Invalid login" hoặc "Authentication failed"
- App Password bị sai hoặc hết hạn
- Tạo lại App Password mới
- Đảm bảo đã bật 2-Step Verification

### Lỗi: "535-5.7.8 Username and Password not accepted"
- Gmail đang chặn
- Vào https://myaccount.google.com/lesssecureapps và bật "Allow less secure apps" (không khuyến nghị)
- **Hoặc tốt hơn:** Sử dụng App Password như hướng dẫn ở trên

### Email không gửi được nhưng không báo lỗi
- Kiểm tra console log để xem có lỗi không
- Email có thể vào spam folder
- Kiểm tra quota gửi email của Gmail (500 email/ngày cho tài khoản thường)

## Lưu ý quan trọng

⚠️ **BẢO MẬT:**
- **KHÔNG BAO GIỜ** commit file `.env` lên Git
- App Password có quyền như mật khẩu thật, giữ bí mật
- Nếu lộ App Password, xóa ngay và tạo cái mới

📊 **GIỚI HẠN GMAIL:**
- Gmail free: 500 email/ngày
- G Suite/Workspace: 2000 email/ngày
- Nếu vượt quota, email sẽ bị trì hoãn

🎨 **TÙY CHỈNH:**
- Template email nằm trong `services/EmailService.js`
- Bạn có thể chỉnh sửa HTML, CSS để thay đổi giao diện email
- Logo và màu sắc có thể tùy chỉnh theo thương hiệu

## Tắt chức năng email (tạm thời)

Nếu chưa muốn dùng email, chỉ cần không cấu hình hoặc để giá trị placeholder:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

Hệ thống sẽ bỏ qua gửi email và in log: `Email service chưa cấu hình, bỏ qua gửi email`

## Support

Nếu gặp vấn đề, kiểm tra:
1. Console log của server
2. Gmail account settings
3. App Password còn hiệu lực không
4. File `.env` syntax đúng chưa
