/**
 * Trip Detail Modal Handler
 * Xử lý hiển thị chi tiết chuyến đi và tracking map
 */

let tripTrackingMap = null;
let currentTripId = null;
let tripDetailSocket = null;

/**
 * Mở modal chi tiết chuyến đi
 */
async function viewTripDetail(tripId) {
    try {
        console.log('🚀 Loading trip detail:', tripId);
        const response = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
            headers: {
                'Authorization': `Bearer ${dcApp.token}`
            }
        });

        const result = await response.json();
        console.log('📦 Trip data:', result.data);

        if (result.success) {
            currentTripId = tripId;
            displayTripDetailModal(result.data);
            
            // Mở modal
            const modalEl = document.getElementById('tripDetailModal');
            const modal = new bootstrap.Modal(modalEl);
            
            // Setup socket listeners cho trip này
            setupTripSocketListeners(tripId);

            // Khởi tạo map SAU KHI modal đã hiển thị hoàn toàn
            modalEl.addEventListener('shown.bs.modal', async function initMap() {
                console.log('🗺️ Modal shown, initializing map...');
                await initializeTripMap(result.data);
                console.log('✅ Map initialization complete');
                // Remove listener để không init lại khi mở modal lần sau
                modalEl.removeEventListener('shown.bs.modal', initMap);
            }, { once: true });

            modal.show();
        } else {
            showAlert('error', 'Không thể tải chi tiết chuyến đi');
        }
    } catch (error) {
        console.error('Load trip detail error:', error);
        showAlert('error', 'Lỗi khi tải chi tiết chuyến đi');
    }
}

/**
 * Hiển thị thông tin chuyến đi trong modal
 */
function displayTripDetailModal(trip) {
    // Cập nhật thông tin cơ bản
    document.getElementById('detail-trip-code').textContent = `#${trip.id}`;
    document.getElementById('detail-vehicle-type').textContent = getVehicleTypeLabel(trip.loai_xe);
    document.getElementById('detail-status').innerHTML = getStatusBadge(trip.trang_thai);
    document.getElementById('detail-price').textContent = formatCurrency(trip.tong_tien || trip.gia_cuoc);
    document.getElementById('detail-booking-time').textContent = formatDateTime(trip.thoi_gian_dat);
    document.getElementById('detail-pickup').textContent = trip.diem_don;
    document.getElementById('detail-destination').textContent = trip.diem_den;

    // Cập nhật thông tin tài xế
    const driverInfoCard = document.getElementById('driver-info-card');
    if (trip.tai_xe_id && trip.trang_thai !== 'cho_tai_xe') {
        driverInfoCard.style.display = 'block';
        displayDriverInfo(trip);
    } else {
        driverInfoCard.style.display = 'none';
    }

    // Completed/Cancelled message
    const completedInfo = document.getElementById('completed-trip-info');
    const completedMessage = document.getElementById('completed-message');
    
    if (trip.trang_thai === 'hoan_thanh') {
        completedInfo.style.display = 'block';
        completedInfo.className = 'alert alert-success';
        completedMessage.textContent = `Chuyến đi đã hoàn thành lúc ${formatDateTime(trip.thoi_gian_ket_thuc)}`;
    } else if (trip.trang_thai === 'da_huy' || trip.trang_thai === 'huy') {
        completedInfo.style.display = 'block';
        completedInfo.className = 'alert alert-danger';
        completedMessage.textContent = `Chuyến đi đã bị hủy`;
    } else {
        completedInfo.style.display = 'none';
    }
}

/**
 * Hiển thị thông tin tài xế
 */
function displayDriverInfo(trip) {
    const driverName = trip.ten_tai_xe || trip.tai_xe?.ten || 'Tài xế';
    const driverPhone = trip.sdt_tai_xe || trip.tai_xe?.so_dien_thoai || '';
    const driverVehicle = trip.loai_xe || '';
    const driverPlate = trip.bien_so_xe || trip.tai_xe?.bien_so_xe || '';
    const driverRating = trip.tai_xe_rating || trip.tai_xe?.rating || 0;
    const driverAvatar = trip.tai_xe_avatar || trip.tai_xe?.avatar || '';

    document.getElementById('driver-name').textContent = driverName;
    document.getElementById('driver-vehicle-type').textContent = getVehicleTypeLabel(driverVehicle);
    document.getElementById('driver-plate').textContent = driverPlate || 'Chưa có';
    
    const phoneEl = document.getElementById('driver-phone');
    if (driverPhone) {
        phoneEl.href = `tel:${driverPhone}`;
        phoneEl.textContent = driverPhone;
    } else {
        phoneEl.textContent = 'Chưa có';
        phoneEl.removeAttribute('href');
    }

    if (driverRating > 0) {
        document.getElementById('driver-rating').textContent = `${driverRating.toFixed(1)} ⭐`;
        document.getElementById('driver-rating-container').style.display = 'block';
    } else {
        document.getElementById('driver-rating-container').style.display = 'none';
    }

    const avatarEl = document.getElementById('driver-avatar');
    if (driverAvatar) {
        avatarEl.src = driverAvatar;
    } else {
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&size=100`;
    }
}

/**
 * Khởi tạo bản đồ tracking
 */
async function initializeTripMap(trip) {
    console.log('🔍 initializeTripMap called with status:', trip.trang_thai);
    
    // Kiểm tra trạng thái có cần hiển thị map không
    const shouldShowMap = ['da_nhan', 'tai_xe_da_nhan', 'dang_di', 'bat_dau'].includes(trip.trang_thai);
    console.log('📊 Should show map:', shouldShowMap);
    
    if (!shouldShowMap) {
        // Ẩn map container
        console.log('❌ Status not suitable for map, hiding...');
        document.getElementById('map-container').style.display = 'none';
        if (tripTrackingMap) {
            tripTrackingMap.destroy();
            tripTrackingMap = null;
        }
        return;
    }

    console.log('📍 Coordinates - lat_don:', trip.lat_don, 'lng_don:', trip.lng_don);
    console.log('📍 Coordinates - lat_den:', trip.lat_den, 'lng_den:', trip.lng_den);

    // Khởi tạo TripTrackingMap instance
    if (!tripTrackingMap) {
        console.log('🆕 Creating new TripTrackingMap instance');
        tripTrackingMap = new TripTrackingMap('trip-tracking-map');
    }

    // Parse coordinates
    const pickupCoords = trip.lat_don && trip.lng_don 
        ? { lat: trip.lat_don, lng: trip.lng_don }
        : null;
    const destCoords = trip.lat_den && trip.lng_den 
        ? { lat: trip.lat_den, lng: trip.lng_den }
        : null;

    console.log('🎯 Pickup coords:', pickupCoords);
    console.log('🎯 Dest coords:', destCoords);

    if (!pickupCoords || !destCoords) {
        console.warn('⚠️ Missing trip coordinates!');
        document.getElementById('map-container').style.display = 'none';
        return;
    }

    // Thêm coordinates vào trip object
    trip.diem_don_coords = `${pickupCoords.lat},${pickupCoords.lng}`;
    trip.diem_den_coords = `${destCoords.lat},${destCoords.lng}`;
    console.log('🗺️ Calling updateMap...');

    // Hiển thị map container
    document.getElementById('map-container').style.display = 'block';
    
    // Cập nhật map
    await tripTrackingMap.updateMap(trip);
    console.log('✨ Map updated successfully');

    // Request driver location nếu có tài xế
    if (trip.tai_xe_id && dcApp.socket) {
        console.log('📡 Requesting driver location...');
        dcApp.socket.emit('request-driver-location', trip.id);
    }
}

/**
 * Setup socket listeners cho trip
 */
function setupTripSocketListeners(tripId) {
    if (!dcApp.socket) return;

    // Join trip room
    dcApp.socket.emit('listen-trip-updates', tripId);

    // Listen for trip status updates
    dcApp.socket.on('trip-status-updated', handleTripStatusUpdate);

    // Listen for driver location updates
    dcApp.socket.on('driver-location-updated', handleDriverLocationUpdate);
}

/**
 * Xử lý khi trip status thay đổi
 */
async function handleTripStatusUpdate(data) {
    if (data.tripId != currentTripId) return;

    console.log('Trip status updated:', data);

    // Cập nhật trạng thái trên UI
    document.getElementById('detail-status').innerHTML = getStatusBadge(data.trang_thai);

    // Reload trip data để cập nhật đầy đủ
    try {
        const response = await fetch(`${API_BASE_URL}/trips/${data.tripId}`, {
            headers: { 'Authorization': `Bearer ${dcApp.token}` }
        });
        const result = await response.json();
        
        if (result.success) {
            displayTripDetailModal(result.data);
            await initializeTripMap(result.data);
            
            // Reload trips list
            if (typeof loadTrips === 'function') {
                loadTrips(currentPage || 1);
            }
        }
    } catch (error) {
        console.error('Error reloading trip:', error);
    }
}

/**
 * Xử lý khi driver location thay đổi
 */
function handleDriverLocationUpdate(data) {
    if (data.tripId != currentTripId) return;
    
    console.log('Driver location updated:', data.driverLocation);

    // Cập nhật marker tài xế trên map
    if (tripTrackingMap && data.driverLocation) {
        tripTrackingMap.updateDriverLocation(
            data.driverLocation.lat,
            data.driverLocation.lng
        );
    }
}

/**
 * Cleanup khi đóng modal
 */
document.getElementById('tripDetailModal').addEventListener('hidden.bs.modal', function() {
    // Cleanup map
    if (tripTrackingMap) {
        tripTrackingMap.destroy();
        tripTrackingMap = null;
    }

    // Remove socket listeners
    if (dcApp.socket) {
        dcApp.socket.off('trip-status-updated', handleTripStatusUpdate);
        dcApp.socket.off('driver-location-updated', handleDriverLocationUpdate);
    }

    currentTripId = null;
});

/**
 * Helper functions
 */
function getStatusBadge(status) {
    const statusMap = {
        'cho_tai_xe': { text: 'Đang tìm xe', class: 'bg-warning text-dark' },
        'da_nhan': { text: 'Đã nhận', class: 'bg-info text-white' },
        'tai_xe_da_nhan': { text: 'Đã nhận', class: 'bg-info text-white' },
        'dang_di': { text: 'Đang đi', class: 'bg-primary text-white' },
        'bat_dau': { text: 'Đang đi', class: 'bg-primary text-white' },
        'hoan_thanh': { text: 'Hoàn thành', class: 'bg-success text-white' },
        'da_huy': { text: 'Đã hủy', class: 'bg-danger text-white' },
        'huy': { text: 'Đã hủy', class: 'bg-danger text-white' }
    };
    const info = statusMap[status] || { text: status, class: 'bg-secondary text-white' };
    return `<span class="badge ${info.class}">${info.text}</span>`;
}

function getVehicleTypeLabel(type) {
    const typeMap = {
        'xe_may': 'Xe máy',
        'xe-may': 'Xe máy',
        'oto_4cho': 'Ô tô 4 chỗ',
        'oto-4cho': 'Ô tô 4 chỗ',
        'oto_7cho': 'Ô tô 7 chỗ',
        'oto-7cho': 'Ô tô 7 chỗ'
    };
    return typeMap[type] || type || 'Xe máy';
}

function formatCurrency(amount) {
    if (!amount) return '0 VND';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN');
}
