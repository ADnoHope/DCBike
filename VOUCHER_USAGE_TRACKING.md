# Cập nhật hệ thống tracking số lượng sử dụng voucher

## Tổng quan
Hệ thống đã được cập nhật để hỗ trợ voucher có thể sử dụng nhiều lần với tracking số lượng sử dụng còn lại.

## Thay đổi Database

### Bảng `user_vouchers` - Thêm 2 cột mới:
- **`usage_limit`** (INT, default=1): Số lần tối đa có thể sử dụng voucher
- **`times_used`** (INT, default=0): Số lần đã sử dụng voucher

### Migration
File: `database/addUsageLimitToUserVouchers.js`
```bash
node database/addUsageLimitToUserVouchers.js
```

## Thay đổi Backend

### 1. Model `UserVoucher.js`

#### Constructor - Thêm 2 trường mới:
```javascript
this.usage_limit = data.usage_limit || 1;
this.times_used = data.times_used || 0;
```

#### `create()` - Hỗ trợ usage_limit:
```javascript
INSERT INTO user_vouchers (
  nguoi_dung_id, khuyen_mai_id, loai_voucher, ngay_het_han, usage_limit
) VALUES (?, ?, ?, ?, ?)
```

#### `getByUserId()` - Select thêm usage_limit và times_used:
```javascript
SELECT uv.usage_limit, uv.times_used, ...
WHERE uv.times_used < uv.usage_limit  // Thay vì da_su_dung = FALSE
```

#### `canUseVoucher()` - Kiểm tra số lần sử dụng:
```javascript
if (voucher.times_used >= voucher.usage_limit) {
  return { valid: false, message: 'Voucher đã hết lượt sử dụng' };
}
```

#### `markAsUsed()` - Tăng times_used, cập nhật da_su_dung khi hết lượt:
```javascript
UPDATE user_vouchers 
SET times_used = times_used + 1,
    ngay_su_dung = NOW(),
    chuyen_di_su_dung_id = ?,
    da_su_dung = CASE 
      WHEN times_used + 1 >= usage_limit THEN TRUE 
      ELSE da_su_dung 
    END
WHERE id = ? AND times_used < usage_limit
```

### 2. Controller `AdminController.js`

#### `createPersonalVoucher()` - Thêm tham số usage_limit:
```javascript
const { usage_limit } = req.body;
const usageLimit = parseInt(usage_limit) || 1;

await UserVoucher.create({
  nguoi_dung_id: customerId,
  khuyen_mai_id: promotionId,
  loai_voucher: 'vip',
  ngay_het_han: expiryDate,
  usage_limit: usageLimit  // Mới thêm
});
```

## Thay đổi Frontend

### 1. File `admin.html`

#### Form tạo voucher - Thêm trường "Số lần sử dụng":
```html
<div class="mb-3">
    <label class="form-label">Số lần sử dụng</label>
    <input type="number" class="form-control" id="voucher-usage-limit" 
           name="usage_limit" min="1" value="1">
    <small class="text-muted">Số lần tối đa khách hàng có thể sử dụng voucher này</small>
</div>
```

#### JavaScript createVoucher() - Gửi usage_limit:
```javascript
if (isPersonal) {
  voucherData.usage_limit = document.getElementById('voucher-usage-limit').value;
}
```

## Luồng hoạt động

### Khi khách hàng đặt chuyến đi với voucher:

1. **Kiểm tra voucher** (`TripController.createTrip()`):
   ```javascript
   const voucherResult = await UserVoucher.canUseVoucher(
     user_voucher_id, khach_hang_id, baseAmount
   );
   ```
   - Kiểm tra `times_used < usage_limit`
   - Kiểm tra hạn sử dụng
   - Tính giá trị giảm

2. **Tạo chuyến đi thành công**:
   ```javascript
   const tripId = await Trip.create(tripData);
   ```

3. **Trừ số lượng voucher** (`markAsUsed()`):
   ```javascript
   if (usedUserVoucherId) {
     await UserVoucher.markAsUsed(usedUserVoucherId, tripId);
   }
   ```
   - `times_used` tăng lên 1
   - Nếu `times_used >= usage_limit` → `da_su_dung = TRUE`

## Ví dụ sử dụng

### Tạo voucher dùng 3 lần cho khách hàng VIP:
```json
POST /api/admin/vouchers/personal
{
  "ma_khuyen_mai": "VIP2025",
  "ten_khuyen_mai": "Voucher VIP",
  "loai_khuyen_mai": "phan_tram",
  "gia_tri": 15,
  "gia_tri_toi_da": 50000,
  "target_audience": "trips_count",
  "min_trips": 10,
  "validity_days": 30,
  "usage_limit": 3    // ← Voucher dùng được 3 lần
}
```

### Trạng thái voucher:
- **Lần 1**: `times_used = 1`, `usage_limit = 3` → Còn 2 lần
- **Lần 2**: `times_used = 2`, `usage_limit = 3` → Còn 1 lần
- **Lần 3**: `times_used = 3`, `usage_limit = 3`, `da_su_dung = TRUE` → Hết lượt

## API Response

### GET /api/promotions/my-vouchers
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ma_khuyen_mai": "VIP2025",
      "ten_khuyen_mai": "Voucher VIP",
      "usage_limit": 3,      // Tổng số lần
      "times_used": 1,        // Đã dùng
      "remaining": 2,         // Còn lại (tính ở frontend)
      "da_su_dung": false,    // Chưa hết lượt
      "ngay_het_han": "2025-01-24T00:00:00.000Z"
    }
  ]
}
```

## Backward Compatibility

### Voucher cũ (trước khi update):
- Tự động set `usage_limit = 1`, `times_used = 0`
- Nếu `da_su_dung = TRUE` → migration tự động set `times_used = 1`

### Voucher mới tạo không có usage_limit:
- Mặc định `usage_limit = 1` (dùng 1 lần)

## Testing Checklist

- [x] Migration database thành công
- [x] Tạo voucher mới với usage_limit
- [ ] Đặt chuyến đi với voucher → times_used tăng lên
- [ ] Đặt chuyến lần 2 với cùng voucher → times_used tiếp tục tăng
- [ ] Khi times_used = usage_limit → da_su_dung = TRUE
- [ ] Không thể dùng voucher khi times_used >= usage_limit
- [ ] API /my-vouchers trả về đúng usage_limit và times_used

## Notes

- Trường `da_su_dung` vẫn giữ lại để backward compatible
- `da_su_dung = TRUE` khi và chỉ khi `times_used >= usage_limit`
- Voucher có `usage_limit = 0` được coi là không giới hạn (nếu cần)
