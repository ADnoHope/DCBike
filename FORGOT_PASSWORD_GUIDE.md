# Chức năng Quên Mật Khẩu - DC Bike

## Tổng quan

Hệ thống quên mật khẩu cho phép người dùng đặt lại mật khẩu thông qua email xác thực với 3 bước đơn giản.

## Luồng hoạt động

### Bước 1: Yêu cầu mã xác nhận
1. User nhấn "Quên mật khẩu?" trong form đăng nhập
2. Nhập email đã đăng ký
3. Hệ thống gửi mã xác nhận 6 số đến email
4. Mã có hiệu lực trong **15 phút**

### Bước 2: Xác thực mã
1. User nhập mã 6 số từ email
2. Hệ thống xác thực mã và thời gian hết hạn
3. Nếu hợp lệ, chuyển sang bước 3

### Bước 3: Đặt mật khẩu mới
1. User nhập mật khẩu mới (ít nhất 6 ký tự)
2. Xác nhận mật khẩu
3. Hệ thống hash và lưu mật khẩu mới
4. Xóa mã xác nhận khỏi database
5. Chuyển về form đăng nhập

## API Endpoints

### 1. Gửi mã xác nhận
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Mã xác nhận đã được gửi đến email của bạn"
}
```

### 2. Xác thực mã
```
POST /api/auth/verify-reset-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}

Response:
{
  "success": true,
  "message": "Mã xác nhận hợp lệ"
}
```

### 3. Đặt lại mật khẩu
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}

Response:
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công"
}
```

## Cấu trúc Database

### Bảng nguoi_dung
Đã thêm 2 cột:
- `reset_code` VARCHAR(10) NULL - Mã xác nhận 6 số
- `reset_code_expires` DATETIME NULL - Thời gian hết hạn

## Email Template

Email gửi bao gồm:
- Mã xác nhận 6 số (font lớn, nổi bật)
- Thời gian hiệu lực (15 phút)
- Cảnh báo bảo mật
- Hướng dẫn nếu không yêu cầu reset

## Bảo mật

1. **Mã ngẫu nhiên**: Mã 6 số được tạo ngẫu nhiên
2. **Thời gian hết hạn**: Mã chỉ có hiệu lực 15 phút
3. **Hash password**: Mật khẩu mới được hash bằng bcrypt (12 rounds)
4. **Xóa mã sau khi dùng**: Mã xác nhận bị xóa sau khi đặt lại mật khẩu thành công
5. **Validate email**: Chỉ gửi mã cho email tồn tại trong hệ thống

## Testing

### 1. Test gửi mã
```javascript
// Nhập email không tồn tại
Expected: "Email không tồn tại trong hệ thống"

// Nhập email hợp lệ
Expected: "Mã xác nhận đã được gửi đến email của bạn"
Expected: Email nhận được mã 6 số
```

### 2. Test xác thực mã
```javascript
// Nhập mã sai
Expected: "Mã xác nhận không đúng hoặc đã hết hạn"

// Nhập mã đúng nhưng quá 15 phút
Expected: "Mã xác nhận không đúng hoặc đã hết hạn"

// Nhập mã đúng trong thời gian
Expected: "Mã xác nhận hợp lệ"
```

### 3. Test đặt lại mật khẩu
```javascript
// Mật khẩu < 6 ký tự
Expected: "Mật khẩu phải có ít nhất 6 ký tự"

// Mật khẩu không khớp
Expected: "Mật khẩu xác nhận không khớp"

// Thành công
Expected: "Đặt lại mật khẩu thành công"
Expected: Có thể đăng nhập bằng mật khẩu mới
```

## Troubleshooting

### Email không gửi được
1. Kiểm tra file `.env`:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```
2. Đảm bảo đã bật 2-Step Verification và tạo App Password
3. Xem log server để kiểm tra lỗi

### Mã luôn báo hết hạn
1. Kiểm tra timezone server
2. Kiểm tra thời gian hệ thống
3. Kiểm tra cột `reset_code_expires` trong database

### UI không hiển thị
1. Clear cache trình duyệt
2. Kiểm tra console JavaScript có lỗi không
3. Reload lại trang index.html

## Files đã thay đổi

1. `services/EmailService.js` - Thêm method `sendPasswordResetEmail()`
2. `models/User.js` - Thêm methods `saveResetCode()`, `verifyResetCode()`, `resetPassword()`
3. `controllers/AuthController.js` - Thêm 3 methods: `forgotPassword()`, `verifyResetCode()`, `resetPassword()`
4. `routes/auth.js` - Thêm 3 routes mới
5. `public/index.html` - Thêm UI form quên mật khẩu và JavaScript logic
6. `database/addResetPasswordColumns.js` - Migration script

## Maintenance

- Có thể thêm cronjob để xóa các mã đã hết hạn trong database (optional)
- Monitor số lượng request reset để phát hiện abuse
- Có thể thêm rate limiting để chống spam

## Future Improvements

1. Rate limiting (giới hạn số lần gửi mã trong 1 giờ)
2. SMS verification thay vì email
3. Thêm captcha để chống bot
4. Thống kê số lần reset password theo user
5. Email notification khi password bị thay đổi
