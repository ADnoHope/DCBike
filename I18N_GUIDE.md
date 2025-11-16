# Hướng dẫn áp dụng hệ thống đa ngôn ngữ (i18n)

## Bước 1: Thêm scripts vào HTML

Thêm 3 scripts này vào **trước thẻ đóng `</body>`** của mỗi trang HTML:

```html
<!-- Thêm vào trước </body> -->
<script src="/js/i18n.js"></script>
<script src="/js/language-switcher.js"></script>
<script src="/js/app.js"></script> <!-- Nếu chưa có -->
```

**Thứ tự quan trọng:**
1. `i18n.js` - Hệ thống dịch
2. `language-switcher.js` - Nút chuyển ngôn ngữ
3. `app.js` - Logic chính của app

## Bước 2: Thêm thuộc tính data-i18n vào HTML

### Navigation Menu
```html
<!-- CŨ -->
<a class="nav-link" href="#home">Trang chủ</a>

<!-- MỚI -->
<a class="nav-link" href="#home" data-i18n="nav.home">Trang chủ</a>
```

### Buttons
```html
<!-- CŨ -->
<button class="btn btn-primary">Đặt xe ngay</button>

<!-- MỚI -->
<button class="btn btn-primary">
    <span data-i18n="booking.book_now">Đặt xe ngay</span>
</button>
```

### Labels
```html
<!-- CŨ -->
<label class="form-label">Họ và tên</label>

<!-- MỚI -->
<label class="form-label" data-i18n="profile.full_name">Họ và tên</label>
```

### Headings
```html
<!-- CŨ -->
<h1>Hồ sơ cá nhân</h1>

<!-- MỚI -->
<h1 data-i18n="profile.title">Hồ sơ cá nhân</h1>
```

### Placeholders
```html
<!-- CŨ -->
<input placeholder="Nhập email">

<!-- MỚI -->
<input data-i18n-placeholder="auth.email">
```

## Bước 3: Sử dụng i18n trong JavaScript

### Hiển thị messages
```javascript
// CŨ
showAlert('success', 'Cập nhật thành công');

// MỚI
showAlert('success', i18n.t('msg.update_success'));
```

### Confirm dialogs
```javascript
// CŨ
if (confirm('Bạn có chắc chắn?')) {
    // ...
}

// MỚI
if (confirm(i18n.t('common.confirm'))) {
    // ...
}
```

### Dynamic content
```javascript
// CŨ
element.textContent = 'Khách hàng';

// MỚI
element.textContent = i18n.getAccountType('khach_hang');
```

## Bước 4: Thêm translations mới

Mở file `/public/js/i18n.js` và thêm vào object `translations`:

```javascript
const translations = {
    vi: {
        // ... existing translations
        'your.new.key': 'Nội dung tiếng Việt',
    },
    en: {
        // ... existing translations
        'your.new.key': 'English content',
    }
};
```

## Các keys translation có sẵn

### Navigation
- `nav.home` - Trang chủ / Home
- `nav.booking` - Đặt xe / Booking
- `nav.trips` - Chuyến đi / Trips
- `nav.drivers` - Tài xế / Drivers
- `nav.promotions` - Khuyến mãi / Promotions
- `nav.profile` - Hồ sơ / Profile
- `nav.logout` - Đăng xuất / Logout
- `nav.login` - Đăng nhập / Login

### Booking
- `booking.title` - Đặt xe / Book a Ride
- `booking.pickup` - Điểm đón / Pickup Location
- `booking.destination` - Điểm đến / Destination
- `booking.book_now` - Đặt xe ngay / Book Now
- `booking.estimate_price` - Giá ước tính / Estimated Price

### Trips
- `trips.title` - Chuyến đi của tôi / My Trips
- `trips.current` - Đang diễn ra / Current
- `trips.history` - Lịch sử / History
- `trips.status` - Trạng thái / Status
- `trips.cancel` - Hủy chuyến / Cancel Trip
- `trips.rate` - Đánh giá / Rate

### Auth
- `auth.login` - Đăng nhập / Login
- `auth.register` - Đăng ký / Register
- `auth.email` - Email
- `auth.password` - Mật khẩu / Password
- `auth.full_name` - Họ và tên / Full Name
- `auth.phone` - Số điện thoại / Phone Number

### Common
- `common.save` - Lưu / Save
- `common.cancel` - Hủy / Cancel
- `common.delete` - Xóa / Delete
- `common.edit` - Chỉnh sửa / Edit
- `common.view` - Xem / View
- `common.search` - Tìm kiếm / Search
- `common.loading` - Đang tải... / Loading...
- `common.submit` - Gửi / Submit
- `common.close` - Đóng / Close
- `common.confirm` - Xác nhận / Confirm

## Ví dụ hoàn chỉnh

### File HTML mẫu với i18n

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>DC Booking</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="/">DC Booking</a>
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="/" data-i18n="nav.home">Trang chủ</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/booking" data-i18n="nav.booking">Đặt xe</a>
                </li>
            </ul>
        </div>
    </nav>

    <!-- Content -->
    <div class="container mt-4">
        <h1 data-i18n="booking.title">Đặt xe</h1>
        
        <form>
            <div class="mb-3">
                <label class="form-label" data-i18n="booking.pickup">Điểm đón</label>
                <input type="text" class="form-control" data-i18n-placeholder="booking.pickup">
            </div>
            
            <button type="submit" class="btn btn-primary">
                <span data-i18n="booking.book_now">Đặt xe ngay</span>
            </button>
        </form>
    </div>

    <!-- Scripts - QUAN TRỌNG: Đúng thứ tự -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/js/i18n.js"></script>
    <script src="/js/language-switcher.js"></script>
    <script src="/js/app.js"></script>
    
    <script>
        // Sử dụng i18n trong JavaScript
        document.querySelector('form').addEventListener('submit', function(e) {
            e.preventDefault();
            alert(i18n.t('msg.update_success'));
        });
    </script>
</body>
</html>
```

## Testing

1. Mở trang web
2. Nhìn góc dưới bên phải màn hình
3. Click vào dropdown ngôn ngữ (icon 🌐)
4. Chọn "English" hoặc "Tiếng Việt"
5. Trang sẽ tự động dịch

## Lưu ý quan trọng

1. **Thứ tự script**: `i18n.js` phải load trước `language-switcher.js`
2. **data-i18n**: Dùng cho text content
3. **data-i18n-placeholder**: Dùng cho placeholder của input
4. **data-i18n-title**: Dùng cho title attribute
5. Ngôn ngữ được lưu trong `localStorage` với key `dc_booking_language`

## Troubleshooting

### Ngôn ngữ không thay đổi?
- Kiểm tra console có lỗi không
- Đảm bảo đã load đúng thứ tự scripts
- Kiểm tra `data-i18n` attribute có đúng key không

### Nút chuyển ngôn ngữ không hiện?
- Kiểm tra đã load `language-switcher.js`
- Kiểm tra Bootstrap JS đã load chưa

### Translation key không tìm thấy?
- Mở `/js/i18n.js`
- Thêm key vào cả 2 ngôn ngữ (vi và en)
