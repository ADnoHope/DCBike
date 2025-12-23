# Tính năng Chi tiết & Theo dõi hành trình - Hướng dẫn

## 📋 Tổng quan

Tính năng "Chi tiết & Theo dõi hành trình" cho phép khách hàng:
- Xem chi tiết chuyến đi với thông tin đầy đủ
- Theo dõi vị trí tài xế real-time trên bản đồ
- Nhận cập nhật trạng thái chuyến đi tự động

## 🎯 Các chức năng đã triển khai

### 1. **Modal Chi tiết Chuyến đi**
- **File**: `public/views/trips.html` (dòng 220-370)
- **Nội dung**:
  - Thông tin chuyến đi (mã vé, loại xe, giá, trạng thái)
  - Thông tin tài xế (tên, SĐT, biển số, rating, avatar)
  - Container bản đồ (500px height)
  - Thông báo hoàn thành/hủy chuyến

### 2. **Bản đồ Tracking (Map Logic)**
- **File**: `public/js/trip-tracking.js`
- **Class**: `TripTrackingMap`
- **Logic theo trạng thái**:

#### Trạng thái A: "Đã nhận" (`da_nhan`, `tai_xe_da_nhan`)
```javascript
- Marker xanh: Điểm đón khách
- Marker xanh dương: Vị trí tài xế hiện tại
- Route: Từ tài xế → điểm đón (màu xanh dương #3b82f6)
- Auto-fit bounds để hiển thị cả 2 marker
```

#### Trạng thái B: "Đang đi" (`dang_di`, `bat_dau`)
```javascript
- Marker xanh: Điểm đón
- Marker đỏ: Điểm đến
- Marker xanh dương: Vị trí tài xế (cập nhật real-time)
- Route: Từ điểm đón → điểm đến (màu xanh lá #10b981)
- Auto-fit bounds để hiển thị toàn bộ route
```

#### Trạng thái C: "Hoàn thành/Đã hủy" (`hoan_thanh`, `da_huy`)
```javascript
- Ẩn bản đồ hoàn toàn
- Hiển thị thông báo hoàn thành/hủy
```

### 3. **Socket Events (Real-time)**
- **File**: `socket/socketHandler.js`

#### Events mới:
```javascript
// Client emit
'listen-trip-updates': Join room trip-{tripId}
'driver-location-update': Tài xế gửi vị trí { tripId, lat, lng }
'request-driver-location': Khách yêu cầu vị trí tài xế

// Server emit
'trip-status-updated': Thông báo khi trạng thái trip thay đổi
'driver-location-updated': Broadcast vị trí tài xế đến room
'send-current-location': Yêu cầu tài xế gửi vị trí
```

### 4. **Backend Cập nhật**
- **File**: `controllers/TripController.js`

#### Emit trip-status-updated khi:
```javascript
// acceptTrip() - Tài xế nhận chuyến
global.notifyTripRoom(tripId, 'trip-status-updated', {
    tripId, trang_thai: 'da_nhan', message: 'Tài xế đã nhận chuyến'
});

// startTrip() - Bắt đầu chuyến đi
global.notifyTripRoom(tripId, 'trip-status-updated', {
    tripId, trang_thai: 'dang_di', message: 'Chuyến đi đã bắt đầu'
});

// completeTrip() - Hoàn thành chuyến đi
global.notifyTripRoom(tripId, 'trip-status-updated', {
    tripId, trang_thai: 'hoan_thanh', message: 'Chuyến đi đã hoàn thành'
});
```

### 5. **OSRM Routing Integration**
- **API**: `https://router.project-osrm.org/route/v1/driving/`
- **Miễn phí, không cần API key**
- **Chức năng**: Vẽ route tối ưu giữa 2 điểm

```javascript
async getRoute(fromLat, fromLng, toLat, toLng) {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    // Returns: GeoJSON coordinates array
}
```

## 🔧 Cách sử dụng

### Khách hàng (Customer):

1. **Xem chi tiết chuyến**:
   - Vào trang "Chuyến đi của tôi" (`/views/trips.html`)
   - Click vào bất kỳ chuyến đi nào trong danh sách
   - Modal chi tiết sẽ mở tự động

2. **Theo dõi hành trình**:
   - Khi tài xế nhận chuyến: Bản đồ hiển thị vị trí tài xế và route đến điểm đón
   - Khi bắt đầu đi: Bản đồ hiển thị route từ điểm đón → đích, cập nhật vị trí tài xế real-time
   - Khi hoàn thành: Bản đồ ẩn, hiển thị thông báo hoàn thành

3. **Cập nhật tự động**:
   - Trạng thái chuyến đi tự động cập nhật khi tài xế thay đổi
   - Không cần reload trang
   - Marker tài xế di chuyển mượt mà theo GPS

### Tài xế (Driver):

1. **Gửi vị trí real-time**:
   ```javascript
   // Trong driver dashboard, thêm code:
   if (navigator.geolocation && currentTripId) {
       navigator.geolocation.watchPosition((position) => {
           dcApp.socket.emit('driver-location-update', {
               tripId: currentTripId,
               lat: position.coords.latitude,
               lng: position.coords.longitude
           });
       });
   }
   ```

## 📁 Cấu trúc Files

```
DCBike/
├── public/
│   ├── views/
│   │   └── trips.html                 # Modal & UI
│   └── js/
│       ├── trip-tracking.js           # Map logic (TripTrackingMap class)
│       └── trip-detail-handler.js     # Modal handler & Socket listeners
├── socket/
│   └── socketHandler.js               # Socket events (driver-location-update, etc.)
└── controllers/
    └── TripController.js              # Emit trip-status-updated
```

## 🧪 Test Cases

### Test 1: Hiển thị Modal
- [ ] Click vào trip → Modal mở
- [ ] Thông tin hiển thị đầy đủ (code, giá, điểm đón/đến)
- [ ] Thông tin tài xế hiển thị (nếu có)

### Test 2: Bản đồ - Trạng thái "Đã nhận"
- [ ] Map hiển thị khi tài xế nhận chuyến
- [ ] Marker xanh (pickup) và xanh dương (driver) hiển thị
- [ ] Route vẽ từ driver → pickup
- [ ] Map fit bounds tự động

### Test 3: Bản đồ - Trạng thái "Đang đi"
- [ ] Map hiển thị route từ pickup → destination
- [ ] Marker tài xế hiển thị
- [ ] Driver location cập nhật real-time khi socket emit

### Test 4: Bản đồ - Trạng thái "Hoàn thành"
- [ ] Map ẩn hoàn toàn
- [ ] Thông báo "Hoàn thành" hiển thị

### Test 5: Socket Real-time
- [ ] Tài xế accept → Status tự động cập nhật "Đã nhận"
- [ ] Tài xế start → Status cập nhật "Đang đi", map thay đổi
- [ ] Tài xế complete → Status "Hoàn thành", map ẩn
- [ ] Driver location update → Marker di chuyển

## 🐛 Troubleshooting

### Bản đồ không hiển thị:
```javascript
// Check console errors
// Kiểm tra Leaflet đã load:
console.log(typeof L); // Should be "object"

// Kiểm tra coordinates hợp lệ:
console.log(trip.lat_don, trip.lng_don); // Should be numbers
```

### Socket không kết nối:
```javascript
// Check socket connection
console.log(dcApp.socket?.connected); // Should be true

// Check room joined
dcApp.socket.emit('listen-trip-updates', tripId);
```

### Route không vẽ được:
```javascript
// OSRM có thể bị rate limit
// Fallback: Vẽ đường thẳng
if (!routeCoords) {
    L.polyline([
        [fromLat, fromLng],
        [toLat, toLng]
    ], { color: 'blue' }).addTo(map);
}
```

## 🚀 Nâng cấp trong tương lai

1. **Offline Map**: Cache tiles để dùng offline
2. **ETA Calculation**: Hiển thị thời gian còn lại đến đích
3. **Traffic Layer**: Hiển thị tình hình giao thông
4. **Driver Avatar**: Custom icon với avatar thật
5. **Route Replay**: Xem lại route đã đi (cho completed trips)

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. Browser console (F12) → Xem errors
2. Network tab → Kiểm tra API calls
3. Server logs → Xem socket events
4. Database → Kiểm tra coordinates đã lưu đúng chưa

---

**Người phát triển**: GitHub Copilot  
**Ngày hoàn thành**: 24/12/2025  
**Version**: 1.0
