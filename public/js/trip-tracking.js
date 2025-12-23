/**
 * Trip Tracking Map Manager
 * Quản lý bản đồ theo dõi hành trình cho khách hàng
 * Sử dụng Leaflet và OSRM cho routing
 */

class TripTrackingMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = {
            pickup: null,
            destination: null,
            driver: null
        };
        this.routeLayer = null;
        this.currentTrip = null;
        this.driverIcon = null;
        this.pickupIcon = null;
        this.destinationIcon = null;
        
        this.initializeIcons();
    }

    /**
     * Khởi tạo các icon marker
     */
    initializeIcons() {
        // Driver icon (xe tài xế)
        this.driverIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Pickup icon (điểm đón)
        this.pickupIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Destination icon (điểm đến)
        this.destinationIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }

    /**
     * Khởi tạo bản đồ
     */
    initializeMap() {
        if (this.map) {
            this.map.remove();
        }

        this.map = L.map(this.containerId).setView([10.8231, 106.6297], 13);
        
        // Thêm tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        return this.map;
    }

    /**
     * Parse coordinates từ string "lat,lng"
     */
    parseCoordinates(coordString) {
        if (!coordString) return null;
        const parts = coordString.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return { lat: parts[0], lng: parts[1] };
        }
        return null;
    }

    /**
     * Lấy route từ OSRM
     */
    async getRoute(fromLat, fromLng, toLat, toLng) {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return data.routes[0].geometry.coordinates;
            }
            return null;
        } catch (error) {
            console.error('Error fetching route from OSRM:', error);
            return null;
        }
    }

    /**
     * Vẽ route trên bản đồ
     */
    async drawRoute(fromLat, fromLng, toLat, toLng, color = '#2563eb') {
        // Xóa route cũ nếu có
        if (this.routeLayer) {
            this.map.removeLayer(this.routeLayer);
        }

        const routeCoords = await this.getRoute(fromLat, fromLng, toLat, toLng);
        
        if (routeCoords) {
            // Convert coordinates từ [lng, lat] sang [lat, lng] cho Leaflet
            const latLngs = routeCoords.map(coord => [coord[1], coord[0]]);
            
            this.routeLayer = L.polyline(latLngs, {
                color: color,
                weight: 5,
                opacity: 0.7
            }).addTo(this.map);

            return true;
        }
        return false;
    }

    /**
     * Cập nhật bản đồ theo trạng thái chuyến đi
     * @param {Object} trip - Thông tin chuyến đi
     * @param {Object} driverLocation - Vị trí hiện tại của tài xế {lat, lng}
     */
    async updateMap(trip, driverLocation = null) {
        console.log('🗺️ TripTrackingMap.updateMap called');
        this.currentTrip = trip;

        if (!this.map) {
            console.log('🆕 Initializing Leaflet map...');
            this.initializeMap();
            console.log('✅ Map initialized:', this.map);
        }

        // Xóa tất cả markers cũ
        Object.values(this.markers).forEach(marker => {
            if (marker) this.map.removeLayer(marker);
        });
        this.markers = { pickup: null, destination: null, driver: null };

        // Parse coordinates
        const pickupCoords = this.parseCoordinates(trip.diem_don_coords);
        const destCoords = this.parseCoordinates(trip.diem_den_coords);

        console.log('📍 Parsed pickup:', pickupCoords);
        console.log('📍 Parsed dest:', destCoords);

        if (!pickupCoords || !destCoords) {
            console.error('❌ Invalid coordinates in trip data');
            return;
        }

        const status = trip.trang_thai;
        console.log('📊 Trip status:', status);

        // Trường hợp A: Trạng thái "đã nhận" (tai_xe_da_nhan)
        if (status === 'tai_xe_da_nhan' || status === 'da_nhan') {
            console.log('🚗 Case A: Driver accepted, showing route to pickup');
            // Marker điểm đón
            this.markers.pickup = L.marker([pickupCoords.lat, pickupCoords.lng], {
                icon: this.pickupIcon
            }).addTo(this.map)
              .bindPopup('<b>Điểm đón</b><br>' + (trip.diem_don || 'Đang tải...'));

            console.log('✅ Pickup marker added');

            // Marker tài xế (nếu có vị trí)
            if (driverLocation) {
                console.log('👤 Adding driver marker at:', driverLocation);
                this.markers.driver = L.marker([driverLocation.lat, driverLocation.lng], {
                    icon: this.driverIcon
                }).addTo(this.map)
                  .bindPopup('<b>Tài xế</b><br>Đang đến điểm đón');

                // Vẽ route từ tài xế đến điểm đón
                console.log('🛣️ Drawing route from driver to pickup...');
                await this.drawRoute(
                    driverLocation.lat, driverLocation.lng,
                    pickupCoords.lat, pickupCoords.lng,
                    '#3b82f6'
                );

                // Fit bounds để hiển thị cả tài xế và điểm đón
                const bounds = L.latLngBounds([
                    [driverLocation.lat, driverLocation.lng],
                    [pickupCoords.lat, pickupCoords.lng]
                ]);
                this.map.fitBounds(bounds, { padding: [50, 50] });
            } else {
                console.log('⚠️ No driver location yet, centering on pickup');
                // Nếu chưa có vị trí tài xế, center ở điểm đón
                this.map.setView([pickupCoords.lat, pickupCoords.lng], 14);
            }

            // Update status text
            this.updateStatusText('Tài xế đang đến điểm đón của bạn...');
        }
        // Trường hợp B: Trạng thái "đang đi" (dang_di/bat_dau)
        else if (status === 'dang_di' || status === 'bat_dau') {
            // Marker điểm đón
            this.markers.pickup = L.marker([pickupCoords.lat, pickupCoords.lng], {
                icon: this.pickupIcon
            }).addTo(this.map)
              .bindPopup('<b>Điểm đón</b>');

            // Marker điểm đến
            this.markers.destination = L.marker([destCoords.lat, destCoords.lng], {
                icon: this.destinationIcon
            }).addTo(this.map)
              .bindPopup('<b>Điểm đến</b><br>' + (trip.diem_den || 'Đang tải...'));

            // Marker tài xế (nếu có vị trí)
            if (driverLocation) {
                this.markers.driver = L.marker([driverLocation.lat, driverLocation.lng], {
                    icon: this.driverIcon
                }).addTo(this.map)
                  .bindPopup('<b>Tài xế</b><br>Đang di chuyển');
            }

            // Vẽ route từ điểm đón đến điểm đến
            await this.drawRoute(
                pickupCoords.lat, pickupCoords.lng,
                destCoords.lat, destCoords.lng,
                '#10b981'
            );

            // Fit bounds để hiển thị toàn bộ route
            const boundsPoints = [[pickupCoords.lat, pickupCoords.lng], [destCoords.lat, destCoords.lng]];
            if (driverLocation) {
                boundsPoints.push([driverLocation.lat, driverLocation.lng]);
            }
            const bounds = L.latLngBounds(boundsPoints);
            this.map.fitBounds(bounds, { padding: [50, 50] });

            // Update status text
            this.updateStatusText('Đang theo dõi hành trình của bạn...');
        }
        // Trường hợp C: Hoàn thành hoặc Đã hủy - không hiển thị map
        else if (status === 'hoan_thanh' || status === 'da_huy' || status === 'huy') {
            // Ẩn map container
            this.hideMap();
            return;
        }
        // Trạng thái khác (cho_tai_xe, etc.) - không hiển thị map
        else {
            this.hideMap();
            return;
        }

        // Hiển thị map container
        console.log('🎨 Calling showMap()...');
        this.showMap();
        console.log('✨ Map display complete');
    }

    /**
     * Cập nhật vị trí tài xế real-time
     */
    updateDriverLocation(lat, lng) {
        if (!this.map) return;

        // Cập nhật hoặc tạo marker tài xế
        if (this.markers.driver) {
            // Smooth animation khi di chuyển marker
            this.markers.driver.setLatLng([lat, lng]);
        } else {
            this.markers.driver = L.marker([lat, lng], {
                icon: this.driverIcon
            }).addTo(this.map)
              .bindPopup('<b>Tài xế</b><br>Vị trí hiện tại');
        }

        // Tự động pan map để theo dõi tài xế (optional)
        // this.map.panTo([lat, lng]);
    }

    /**
     * Hiển thị map container
     */
    showMap() {
        const container = document.getElementById('map-container');
        if (container) {
            container.style.display = 'block';
            // Invalidate size để đảm bảo map render đúng
            setTimeout(() => {
                if (this.map) this.map.invalidateSize();
            }, 100);
        }
    }

    /**
     * Ẩn map container
     */
    hideMap() {
        const container = document.getElementById('map-container');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Cập nhật text trạng thái map
     */
    updateStatusText(text) {
        const statusEl = document.getElementById('map-status-text');
        if (statusEl) {
            statusEl.textContent = text;
        }
    }

    /**
     * Cleanup khi đóng modal
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers = { pickup: null, destination: null, driver: null };
        this.routeLayer = null;
        this.currentTrip = null;
    }
}

// Export để sử dụng trong trips.html
if (typeof window !== 'undefined') {
    window.TripTrackingMap = TripTrackingMap;
}
