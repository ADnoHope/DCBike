# Sơ đồ ERD Tối Ưu - DCBike

## 📊 Tổng quan Database

Dự án DCBike sử dụng **13 bảng chính**, được nhóm thành 5 module chức năng:

---

## 🗂️ Cấu trúc Database theo Module

### 1️⃣ **MODULE NGƯỜI DÙNG & TÀI XẾ** (User & Driver Management)

```
┌─────────────────┐
│  nguoi_dung     │ (Users)
│  - id           │
│  - ten          │
│  - email        │
│  - so_dien_thoai│
│  - mat_khau     │
│  - loai_tai_khoan│
└────────┬────────┘
         │
         ├──────────┐
         │          │
┌────────▼────────┐ │        ┌─────────────────────┐
│  tai_xe         │ │        │ driver_registrations│ (Đăng ký chờ duyệt)
│  - id           │ │        │  - id               │
│  - nguoi_dung_id│◄┘        │  - ten              │
│  - so_bang_lai  │          │  - email            │
│  - bien_so_xe   │          │  - so_dien_thoai    │
│  - loai_xe      │          │  - trang_thai       │
│  - trang_thai   │          └─────────────────────┘
│  - bi_chan_vi_no│
└─────────────────┘
```

**Quan hệ:**
- `nguoi_dung` 1-1 `tai_xe` (một user có thể là một tài xế)
- `driver_registrations` không có FK (standalone, chờ admin duyệt)

---

### 2️⃣ **MODULE CHUYẾN ĐI** (Trip Management)

```
┌──────────────┐         ┌──────────────┐
│ nguoi_dung   │         │  tai_xe      │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │                        │
       │   ┌────────────────────┤
       │   │                    │
       └───┼───►┌──────────────┐│
           │    │  chuyen_di   ││ (Trips)
           │    │  - id        ││
           │    │  - khach_hang_id ││
           │    │  - tai_xe_id     ││
           │    │  - diem_don      ││
           │    │  - diem_den      ││
           │    │  - gia_cuoc      ││
           │    │  - tong_tien     ││
           │    │  - phuong_thuc_thanh_toan ││
           │    │  - khuyen_mai_id ││
           │    │  - trang_thai    ││
           │    └────────┬─────────┘│
           │             │          │
           │             │          │
┌──────────▼──┐    ┌─────▼──────┐  │
│ khuyen_mai  │    │ danh_gia   │  │
│  - id       │    │  - id      │  │
│  - ma_km    │    │  - chuyen_di_id │
│  - gia_tri  │    │  - diem_so │  │
│  - ngay_bd  │    │  - binh_luan│ │
│  - ngay_kt  │    └────────────┘  │
└─────────────┘                    │
                                   │
┌──────────────────────────────────┘
│
│      ┌─────────────────┐
└─────►│  doanh_thu      │ (Revenue tracking)
       │  - id           │
       │  - chuyen_di_id │
       │  - tai_xe_id    │
       │  - tong_tien    │
       │  - tien_tai_xe  │ (80%)
       │  - tien_web     │ (20%)
       │  - trang_thai   │
       └─────────────────┘
```

**Quan hệ:**
- `chuyen_di` N-1 `nguoi_dung` (khách hàng)
- `chuyen_di` N-1 `tai_xe`
- `chuyen_di` N-1 `khuyen_mai` (optional)
- `danh_gia` 1-1 `chuyen_di`
- `doanh_thu` 1-1 `chuyen_di`

---

### 3️⃣ **MODULE THANH TOÁN & NỢ** (Payment & Debt Management)

```
┌──────────────┐         ┌──────────────────┐
│  tai_xe      │         │  chuyen_di       │
└──────┬───────┘         └────────┬─────────┘
       │                          │
       │                          │
       └────────┐    ┌────────────┘
                │    │
          ┌─────▼────▼────────┐
          │  no_tai_xe        │ (Driver Debts)
          │  - id             │
          │  - tai_xe_id      │
          │  - chuyen_di_id   │
          │  - so_tien_no     │
          │  - so_tien_da_tra │
          │  - han_thanh_toan │
          │  - trang_thai     │
          └───────────────────┘
               ▲
               │
          Admin xét duyệt
          thanh toán
```

**Quan hệ:**
- `no_tai_xe` N-1 `tai_xe`
- `no_tai_xe` N-1 `chuyen_di`

**Note:** Tài xế chuyển khoản 20% doanh thu cho admin qua QR code

---

### 4️⃣ **MODULE CHAT** (Messaging System)

```
┌──────────────┐         ┌──────────────┐
│ nguoi_dung   │         │  tai_xe      │
│ (khách hàng) │         │              │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │                        │
       └────────┐    ┌──────────┘
                │    │
         ┌──────▼────▼────────┐
         │ cuoc_tro_chuyen    │ (Conversations)
         │  - id              │
         │  - khach_hang_id   │
         │  - tai_xe_id       │
         │  - chuyen_di_id    │ (optional)
         │  - trang_thai      │
         └──────────┬─────────┘
                    │
                    │ 1:N
                    │
         ┌──────────▼─────────┐
         │  tin_nhan          │ (Messages)
         │  - id              │
         │  - cuoc_tro_chuyen_id │
         │  - nguoi_gui_id    │
         │  - noi_dung        │
         │  - da_doc          │
         └────────────────────┘
```

**Quan hệ:**
- `cuoc_tro_chuyen` N-1 `nguoi_dung` (khách hàng)
- `cuoc_tro_chuyen` N-1 `tai_xe`
- `cuoc_tro_chuyen` 1-1 `chuyen_di` (optional, có thể chat trước khi có chuyến)
- `tin_nhan` N-1 `cuoc_tro_chuyen`
- `tin_nhan` N-1 `nguoi_dung` (người gửi)

---

### 5️⃣ **MODULE THÔNG BÁO** (Notification System)

```
┌──────────────┐                ┌──────────────┐         ┌──────────────┐
│ nguoi_dung   │                │  tai_xe      │         │  chuyen_di   │
└──────┬───────┘                └──────┬───────┘         └──────┬───────┘
       │                               │                        │
       │ 1:N                           │ 1:N                    │
       │          ┌────────────────────┤                        │
       │          │                    │                        │
┌──────▼──────────┴┐     ┌─────────────▼──────────┬────────────┘
│  notifications   │     │ driver_notifications   │
│  - id            │     │  - id                  │
│  - user_id       │     │  - driver_id           │
│  - trip_id       │     │  - trip_id             │
│  - title         │     │  - type                │
│  - message       │     │  - message             │
│  - type          │     │  - status              │
│  - status        │     │  - created_at          │
│  - data (JSON)   │     └────────────────────────┘
└──────────────────┘
```

**Quan hệ:**
- `notifications` N-1 `nguoi_dung` (có FK)
- `notifications` N-1 `chuyen_di` (có FK, optional)
- `driver_notifications` N-1 `tai_xe` (có FK)
- `driver_notifications` N-1 `chuyen_di` (có FK)

---

### 6️⃣ **MODULE CÀI ĐẶT** (System Settings)

```
┌─────────────────────────┐
│  cai_dat_he_thong       │ (System Settings)
│  - id                   │
│  - ten_cai_dat          │
│  - gia_tri              │
│  - mo_ta                │
└─────────────────────────┘
```

**Các thiết lập quan trọng:**
- `qr_bank_name` - Tên ngân hàng
- `qr_bank_account` - Số tài khoản
- `qr_account_holder` - Tên chủ tài khoản
- `driver_commission_rate` - Tỷ lệ hoa hồng (20%)
- `debt_payment_deadline_hours` - Hạn thanh toán (24h)

---

## 📈 Tổng kết quan hệ chính

### Quan hệ phức tạp (nhiều kết nối):
1. **nguoi_dung** → Kết nối với: `tai_xe`, `chuyen_di`, `danh_gia`, `cuoc_tro_chuyen`, `tin_nhan`, `notifications`
2. **tai_xe** → Kết nối với: `chuyen_di`, `doanh_thu`, `no_tai_xe`, `cuoc_tro_chuyen`, `driver_notifications`
3. **chuyen_di** → Trung tâm của hệ thống, kết nối với hầu hết các bảng khác

### Bảng độc lập (không có FK):
- `driver_registrations` - Standalone (chờ admin duyệt, sau đó tạo user + driver)
- `cai_dat_he_thong` - Standalone (lưu system config: QR bank, commission rate, etc.)

---

## ✅ Tối ưu đã thực hiện

### Đã xóa:
- ❌ **Bảng `thanh_toan`** - Không được sử dụng trong code, thông tin thanh toán đã tích hợp vào `chuyen_di` và `no_tai_xe`

### Giữ lại tất cả các bảng còn lại vì:
- ✅ Tất cả đều có code sử dụng
- ✅ Phục vụ các chức năng cụ thể trong dự án
- ✅ Có model và controller tương ứng

---

## 🎯 Đề xuất cải tiến trong tương lai

1. **Thêm index** cho các cột thường query:
   - `chuyen_di.trang_thai`
   - `tai_xe.trang_thai_tai_xe`
   - `nguoi_dung.loai_tai_khoan`

2. **Partition table** `tin_nhan` theo thời gian nếu data lớn

3. **Archive old data**: Chuyển các chuyến đi cũ (>6 tháng) sang bảng archive

4. **Add caching**: Redis cho các query thường xuyên (danh sách tài xế available, settings, etc.)

---

## 📝 Lưu ý

- Không còn bảng `thanh_toan` riêng biệt
- Thông tin thanh toán được tích hợp trong:
  - `chuyen_di.phuong_thuc_thanh_toan`
  - `chuyen_di.tong_tien`
  - `no_tai_xe` (cho phần hoa hồng 20%)
  - `doanh_thu` (tracking chi tiết)

---
## 🔧 Cải tiến Foreign Keys

**Đã thêm FK constraints** cho các bảng notification (chạy script [database/addForeignKeysToNotifications.js](../database/addForeignKeysToNotifications.js)):

```bash
node database/addForeignKeysToNotifications.js
```

Các FK được thêm:
- `notifications.user_id` → `nguoi_dung.id` (CASCADE)
- `notifications.trip_id` → `chuyen_di.id` (SET NULL)
- `driver_notifications.driver_id` → `tai_xe.id` (CASCADE)
- `driver_notifications.trip_id` → `chuyen_di.id` (CASCADE)

---

**Cập nhật lần cuối:** 19/12/2024
**Tổng số bảng:** 13 bảng
**Bảng đã xóa:** 1 bảng (thanh_toan)
**Cải tiến:** Đã thêm FK constraints cho notification tables