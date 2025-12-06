# Hướng dẫn cấu hình Google OAuth

## Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Application type**: Web application
6. Điền thông tin:
   - **Name**: DCBike OAuth
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000`
     - `http://your-domain.com` (production)
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/google/callback`
     - `http://your-domain.com/api/auth/google/callback` (production)
7. Click **Create** và lưu lại **Client ID** và **Client Secret**

## Bước 2: Cấu hình biến môi trường

Thêm các biến sau vào file `.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Session Secret (cho production nên đổi thành random string)
SESSION_SECRET=dcbike-secret-key-change-in-production
```

## Bước 3: Chạy migration database

```bash
node database/addGoogleIdColumn.js
```

## Bước 4: Khởi động lại server

```bash
npm start
# hoặc
npm run dev
```

## Cách sử dụng

1. Người dùng click vào nút "Đăng nhập bằng Google" trên trang chủ
2. Hệ thống chuyển hướng đến Google OAuth
3. Người dùng chọn tài khoản Google và cho phép quyền truy cập
4. Google chuyển hướng về callback URL với thông tin user
5. Hệ thống:
   - Kiểm tra xem user đã tồn tại chưa (qua google_id hoặc email)
   - Nếu chưa có: Tạo user mới với role mặc định là "khach_hang"
   - Nếu đã có: Cập nhật google_id nếu cần
   - Tạo JWT token và chuyển về trang chủ
6. Frontend lưu token vào localStorage và reload trang

## Thông tin được lấy từ Google

- **Họ tên**: `profile.displayName`
- **Email**: `profile.emails[0].value`
- **Avatar**: `profile.photos[0].value`
- **Google ID**: `profile.id`
- **Số điện thoại**: Không có (Google không cung cấp)

## Lưu ý

- User đăng ký qua Google sẽ không có mật khẩu (cột `mat_khau` sẽ là NULL)
- Role mặc định là `khach_hang`
- Nếu email đã tồn tại trong hệ thống, hệ thống sẽ liên kết tài khoản với Google ID
- Tài khoản Google luôn có `trang_thai = 'hoat_dong'`

## Bảo mật

- Không bao giờ commit file `.env` lên git
- Thay đổi `SESSION_SECRET` trước khi deploy production
- Sử dụng HTTPS cho production
- Cấu hình CORS đúng cách cho production
