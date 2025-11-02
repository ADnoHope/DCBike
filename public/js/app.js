// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Main Application Class
class DCCarBooking {
    constructor() {
        this.token = localStorage.getItem('token');
        this.notifications = [];
        this._notifPoll = null;
        this.user = null;
        this.init();
    }

    async init() {
        console.log('Initializing app with token:', this.token); // Debug log
        // Check if user is logged in
        if (this.token) {
            try {
                await this.loadUserProfile();
                this.updateUI();
            } catch (error) {
                console.error('Error loading user profile:', error);
                // If profile loading fails, clear invalid token
                this.logout();
            }
        } else {
            console.log('No token found, user not logged in'); // Debug log
            this.updateUI(); // Still need to update UI for logged out state
        }

        // Set minimum datetime for pickup
        this.setMinPickupTime();
        
        // Bind event listeners
        this.bindEvents();
    }

    bindEvents() {
        // Booking form
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm) {
            bookingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.bookTrip();
            });
        }
    }

    setMinPickupTime() {
        const pickupTimeInput = document.getElementById('pickup-time');
        if (pickupTimeInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30); // Minimum 30 minutes from now
            pickupTimeInput.min = now.toISOString().slice(0, 16);
        }
    }

    // API Helper
    async apiCall(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API call failed');
        }

        return data;
    }

    // Authentication
    async loadUserProfile() {
        console.log('Loading user profile with token:', this.token); // Debug log
        const response = await this.apiCall('/auth/profile');
        console.log('Profile response:', response); // Debug log
        this.user = response.data;
        console.log('User set to:', this.user); // Debug log
        localStorage.setItem('user', JSON.stringify(this.user));
        // Start polling notifications for any logged-in user
        if (this.user) {
            this.startNotificationPoll();
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.updateUI();
        showAlert('info', 'Đăng xuất thành công!');
    }

    // Trip Management
    async bookTrip() {
        if (!this.token || !this.user) {
            showAlert('warning', 'Vui lòng đăng nhập để đặt xe');
            showAuthModal();
            return;
        }

        const pickupLocation = document.getElementById('pickup-location').value;
        const destination = document.getElementById('destination').value;
        const pickupTime = document.getElementById('pickup-time').value;
        const vehicleType = document.getElementById('vehicle-type').value;
        const notes = document.getElementById('notes').value;

        if (!pickupLocation || !destination || !pickupTime || !vehicleType) {
            showAlert('warning', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const tripData = {
                diem_don: pickupLocation,
                diem_den: destination,
                thoi_gian_don: pickupTime,
                loai_xe: vehicleType,
                ghi_chu: notes
            };

            // Apply promotion if available
            if (typeof promotionService !== 'undefined') {
                const appliedPromotion = promotionService.getAppliedPromotion();
                if (appliedPromotion) {
                    tripData.ma_khuyen_mai = appliedPromotion.ma_khuyen_mai;
                }
            }

            const response = await this.apiCall('/trips', {
                method: 'POST',
                body: JSON.stringify(tripData)
            });

            showAlert('success', 'Đặt xe thành công! Đang tìm tài xế...');
            
            // Reset form
            document.getElementById('booking-form').reset();
            if (typeof promotionService !== 'undefined') {
                promotionService.removePromotion();
            }
            
            // Reload trips
            this.loadUserTrips();

        } catch (error) {
            console.error('Book trip error:', error);
            showAlert('error', error.message || 'Đặt xe thất bại');
        }
    }

    // Load user trips
    async loadUserTrips() {
        if (!this.token) return;

        try {
            const response = await this.apiCall('/trips/user');
            if (response.success) {
                this.displayTrips(response.data.trips);
            }
        } catch (error) {
            console.error('Load trips error:', error);
        }
    }

    // Display trips
    displayTrips(trips) {
        const tripsContainer = document.getElementById('trips-list');
        if (!tripsContainer) return;

        let html = '';
        
        if (trips.length === 0) {
            html = '<div class="col-12 text-center"><p>Chưa có chuyến đi nào.</p></div>';
        } else {
            trips.forEach(trip => {
                const status = this.getStatusText(trip.trang_thai);
                const statusClass = this.getStatusClass(trip.trang_thai);
                
                html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="card-title">Chuyến đi #${trip.id}</h6>
                                    <span class="badge ${statusClass}">${status}</span>
                                </div>
                                
                                <p class="card-text">
                                    <i class="fas fa-map-marker-alt text-success me-2"></i>
                                    <strong>Từ:</strong> ${trip.diem_don}<br>
                                    <i class="fas fa-map-marker-alt text-danger me-2"></i>
                                    <strong>Đến:</strong> ${trip.diem_den}
                                </p>
                                
                                <p class="card-text">
                                    <i class="fas fa-clock me-2"></i>
                                    ${new Date(trip.thoi_gian_don).toLocaleString('vi-VN')}
                                </p>
                                
                                ${trip.gia_cuoc ? `
                                    <p class="card-text">
                                        <i class="fas fa-money-bill-wave me-2"></i>
                                        <strong>${this.formatPrice(trip.gia_cuoc)} VND</strong>
                                    </p>
                                ` : ''}

                                <div class="btn-group w-100" role="group">
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="dcApp.viewTripDetails(${trip.id})">
                                        Chi tiết
                                    </button>
                                    ${trip.trang_thai === 'hoan_thanh' ? `
                                        <button class="btn btn-sm btn-outline-warning" 
                                                onclick="if(typeof showReviewModal !== 'undefined') showReviewModal({chuyen_di_id: ${trip.id}})">
                                            Đánh giá
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        tripsContainer.innerHTML = html;
    }

    // Get status text
    getStatusText(status) {
        const statusTexts = {
            'dang_cho': 'Đang chờ',
            'da_xac_nhan': 'Đã xác nhận',
            'dang_thuc_hien': 'Đang thực hiện',
            'hoan_thanh': 'Hoàn thành',
            'da_huy': 'Đã hủy'
        };
        return statusTexts[status] || status;
    }

    // Get status class
    getStatusClass(status) {
        const statusClasses = {
            'dang_cho': 'bg-warning',
            'da_xac_nhan': 'bg-info',
            'dang_thuc_hien': 'bg-primary',
            'hoan_thanh': 'bg-success',
            'da_huy': 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    // View trip details
    async viewTripDetails(tripId) {
        try {
            const response = await this.apiCall(`/trips/${tripId}`);
            if (response.success) {
                this.showTripDetailsModal(response.data);
            }
        } catch (error) {
            showAlert('error', 'Không thể tải thông tin chuyến đi');
        }
    }

    // Show trip details modal
    showTripDetailsModal(trip) {
        // Create trip details modal content
        const modalContent = `
            <div class="modal fade" id="tripDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Chi tiết chuyến đi #${trip.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Thông tin chuyến đi</h6>
                                    <p><strong>Điểm đón:</strong> ${trip.diem_don}</p>
                                    <p><strong>Điểm đến:</strong> ${trip.diem_den}</p>
                                    <p><strong>Thời gian:</strong> ${new Date(trip.thoi_gian_don).toLocaleString('vi-VN')}</p>
                                    <p><strong>Trạng thái:</strong> <span class="badge ${this.getStatusClass(trip.trang_thai)}">${this.getStatusText(trip.trang_thai)}</span></p>
                                    ${trip.gia_cuoc ? `<p><strong>Giá cước:</strong> ${this.formatPrice(trip.gia_cuoc)} VND</p>` : ''}
                                </div>
                                <div class="col-md-6">
                                    ${trip.tai_xe_ten ? `
                                        <h6>Thông tin tài xế</h6>
                                        <p><strong>Tên:</strong> ${trip.tai_xe_ten}</p>
                                        <p><strong>SĐT:</strong> ${trip.tai_xe_sdt}</p>
                                        <p><strong>Biển số:</strong> ${trip.bien_so_xe}</p>
                                    ` : '<p>Chưa có tài xế nhận chuyến</p>'}
                                </div>
                            </div>
                            ${trip.ghi_chu ? `<p><strong>Ghi chú:</strong> ${trip.ghi_chu}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('tripDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body and show
        document.body.insertAdjacentHTML('beforeend', modalContent);
        const modal = new bootstrap.Modal(document.getElementById('tripDetailsModal'));
        modal.show();
        
        // Remove modal from DOM when hidden
        document.getElementById('tripDetailsModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    // UI Helper Methods
    updateUI() {
        console.log('updateUI called with user:', this.user); // Debug log
        const authNav = document.getElementById('auth-nav');
        const authBtn = document.getElementById('auth-btn'); // For booking page
        const signupBtn = document.getElementById('signup-btn'); // Hero signup button
        const userNav = document.getElementById('user-nav');
        const userInfo = document.getElementById('user-info'); // Alternative user nav
        const userName = document.getElementById('user-name');
        // Nav items that should be hidden for guests (keep only 'Trang chủ' + 'Đăng nhập')
        const bookingNav = document.getElementById('booking-nav');
        const tripsNav = document.getElementById('trips-nav');
        const driversNav = document.getElementById('drivers-nav');
        const promosNav = document.getElementById('promos-nav');
        const driverRegNav = document.getElementById('driverreg-nav');

        if (this.user) {
            console.log('User is logged in, updating UI'); // Debug log
            // User is logged in - hide all auth buttons
            if (authNav) authNav.classList.add('d-none');
            if (authBtn) authBtn.classList.add('d-none');
            if (signupBtn) signupBtn.classList.add('d-none');
            
            // Show user navigation
            if (userNav) userNav.classList.remove('d-none');
            if (userInfo) userInfo.classList.remove('d-none');
            if (userName) userName.textContent = this.user.ten || this.user.ho_ten;

            // Show main nav items for logged-in users
            if (bookingNav) bookingNav.classList.remove('d-none');
            if (tripsNav) tripsNav.classList.remove('d-none');
            if (driversNav) driversNav.classList.remove('d-none');
            if (promosNav) promosNav.classList.remove('d-none');
            // Hide "Đăng ký tài xế" for users who are already drivers
            if (driverRegNav) {
                if (this.user.loai_tai_khoan === 'tai_xe') {
                    driverRegNav.classList.add('d-none');
                } else {
                    driverRegNav.classList.remove('d-none');
                }
            }
            
            // Thêm link admin nếu user có role admin
            if (this.user.loai_tai_khoan === 'admin') {
                const dropdown = userNav.querySelector('.dropdown-menu');
                if (dropdown && !dropdown.querySelector('.admin-link')) {
                    const adminLink = document.createElement('li');
                    adminLink.innerHTML = '<a class="dropdown-item admin-link" href="admin.html"><i class="fas fa-cog me-2"></i>Quản trị hệ thống</a>';
                    
                    // Thêm sau item đầu tiên
                    const firstItem = dropdown.querySelector('li');
                    if (firstItem && firstItem.nextSibling) {
                        dropdown.insertBefore(adminLink, firstItem.nextSibling);
                    } else {
                        dropdown.appendChild(adminLink);
                    }
                }
            }
            
            // Load user's trips
            this.loadUserTrips();
            // Ensure notification UI is present for logged-in users
            if (this.user) {
                this.ensureNotificationIcon();
            }
        } else {
            console.log('User not logged in, showing auth buttons'); // Debug log
            // User is not logged in - show auth buttons
            if (authNav) authNav.classList.remove('d-none');
            if (authBtn) authBtn.classList.remove('d-none');
            if (signupBtn) signupBtn.classList.remove('d-none');
            
            // Hide user navigation
            if (userNav) userNav.classList.add('d-none');
            if (userInfo) userInfo.classList.add('d-none');
            // Hide main nav items for guests so only 'Trang chủ' and 'Đăng nhập' remain
            if (bookingNav) bookingNav.classList.add('d-none');
            if (tripsNav) tripsNav.classList.add('d-none');
            if (driversNav) driversNav.classList.add('d-none');
            if (promosNav) promosNav.classList.add('d-none');
            if (driverRegNav) driverRegNav.classList.add('d-none');
            
            // Remove admin link if exists
            const adminLink = document.querySelector('.admin-link');
            if (adminLink && adminLink.parentElement) {
                adminLink.parentElement.remove();
            }
            // Stop notification polling when logged out
            if (this._notifPoll) {
                clearInterval(this._notifPoll);
                this._notifPoll = null;
            }
        }
    }

    // Notifications: polling and UI
    ensureNotificationIcon() {
        // If already created, do nothing
        if (document.getElementById('notif-dropdown')) return;

        // Try to place in user menu or nav bar
        const userMenu = document.getElementById('user-menu');
        let parentList = null;
        if (userMenu && userMenu.parentElement) {
            parentList = userMenu.parentElement; // likely ul.navbar-nav
        } else {
            parentList = document.querySelector('.navbar-nav');
        }

        if (!parentList) return;

        const li = document.createElement('li');
        li.className = 'nav-item dropdown';
        li.id = 'notif-dropdown';
        li.innerHTML = `
            <a class="nav-link position-relative" href="#" id="notifToggle" role="button" data-bs-toggle="dropdown">
                <i class="fas fa-bell"></i>
                <span id="notif-badge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display:none;">0</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end p-2" aria-labelledby="notifToggle" style="min-width:320px; max-height:400px; overflow:auto;">
                <li class="dropdown-header">Thông báo</li>
                <li><hr class="dropdown-divider"></li>
                <div id="notif-list" style="max-height:300px; overflow:auto;"></div>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item text-center text-muted" href="#" id="mark-all-read">Đánh dấu tất cả đã đọc</a></li>
            </ul>
        `;

        parentList.appendChild(li);

        // Event: mark all read
        li.querySelector('#mark-all-read').addEventListener('click', async (e) => {
            e.preventDefault();
            const notifs = this.notifications.slice();
            for (const n of notifs) {
                try { await fetch(`${API_BASE_URL}/notifications/${n.id}/read`, { method: 'POST', headers: { 'Authorization': `Bearer ${this.token}` } }); } catch(e){}
            }
            this.fetchNotifications();
        });
    }

    startNotificationPoll() {
        if (this._notifPoll) return; // already polling
        // initial fetch
        this.fetchNotifications();
        this._notifPoll = setInterval(() => this.fetchNotifications(), 8000);
    }

    async fetchNotifications() {
        try {
            const res = await fetch(`${API_BASE_URL}/notifications`, { headers: { 'Authorization': `Bearer ${this.token}` } });
            if (!res.ok) return;
            const json = await res.json();
            if (json && json.success) {
                this.notifications = json.data || [];
                this.renderNotifications();
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        }
    }

    renderNotifications() {
        const badge = document.getElementById('notif-badge');
        const list = document.getElementById('notif-list');
        if (!badge || !list) return;

        const unreadCount = this.notifications.filter(n => n.is_read === 0).length;
        if (unreadCount > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = unreadCount;
        } else {
            badge.style.display = 'none';
        }

        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="p-2 text-center text-muted">Chưa có thông báo</div>';
            return;
        }

        const html = this.notifications.map(n => {
            const time = new Date(n.created_at).toLocaleString('vi-VN');
            let actions = '';
            if (n.type === 'new_booking') {
                actions = `
                    <div class="d-flex gap-2 mt-2">
                        <button class="btn btn-sm btn-success w-50" data-action="accept" data-trip="${n.trip_id}" data-id="${n.id}">Nhận</button>
                        <button class="btn btn-sm btn-outline-danger w-50" data-action="decline" data-trip="${n.trip_id}" data-id="${n.id}">Từ chối</button>
                    </div>
                `;
            }

            return `
                <div class="notif-item p-2 border-bottom" data-id="${n.id}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="small text-muted">${time}</div>
                            <div>${n.message}</div>
                        </div>
                        <div>
                            ${n.is_read ? '' : '<span class="badge bg-primary">Mới</span>'}
                        </div>
                    </div>
                    ${actions}
                </div>
            `;
        }).join('');

        list.innerHTML = html;

        // Attach event listeners for action buttons
        list.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = btn.getAttribute('data-action');
                const tripId = btn.getAttribute('data-trip');
                const notifId = btn.getAttribute('data-id');
                if (action === 'accept') {
                    await this.acceptTripFromNotification(tripId, notifId);
                } else if (action === 'decline') {
                    await this.declineTripFromNotification(tripId, notifId);
                }
            });
        });
    }

    async acceptTripFromNotification(tripId, notifId) {
        try {
            const res = await fetch(`${API_BASE_URL}/trips/${tripId}/accept`, { method: 'POST', headers: { 'Authorization': `Bearer ${this.token}` } });
            const json = await res.json();
            if (json.success) {
                showAlert('success', 'Đã nhận chuyến');
                // mark notification read
                await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, { method: 'POST', headers: { 'Authorization': `Bearer ${this.token}` } });
                this.fetchNotifications();
                this.loadUserTrips();
            } else {
                showAlert('error', json.message || 'Nhận chuyến thất bại');
            }
        } catch (error) {
            console.error('Accept from notif error:', error);
            showAlert('error', 'Lỗi khi nhận chuyến');
        }
    }

    async declineTripFromNotification(tripId, notifId) {
        try {
            const res = await fetch(`${API_BASE_URL}/trips/${tripId}/decline`, { method: 'POST', headers: { 'Authorization': `Bearer ${this.token}` } });
            const json = await res.json();
            if (json.success) {
                showAlert('info', 'Đã từ chối chuyến');
                // mark notification read
                await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, { method: 'POST', headers: { 'Authorization': `Bearer ${this.token}` } });
                this.fetchNotifications();
            } else {
                showAlert('error', json.message || 'Từ chối thất bại');
            }
        } catch (error) {
            console.error('Decline from notif error:', error);
            showAlert('error', 'Lỗi khi từ chối chuyến');
        }
    }

    // Utility Methods
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }
}

// Authentication Functions
async function login() {
    const identifier = document.getElementById('login-identifier').value;
    const password = document.getElementById('login-password').value;

    if (!identifier || !password) {
        showAlert('warning', 'Vui lòng điền đầy đủ thông tin');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: identifier,
                mat_khau: password
            })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('token', result.data.token);
            dcApp.token = result.data.token;
            dcApp.user = result.data.user;
            dcApp.updateUI();
            
            const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            authModal.hide();
            
            // Điều hướng đến trang admin nếu user có role admin
            if (result.data.user.loai_tai_khoan === 'admin') {
                showAlert('success', 'Đăng nhập thành công! Đang chuyển đến trang quản trị...');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1500);
            } else {
                showAlert('success', 'Đăng nhập thành công!');
            }
        } else {
            showAlert('error', result.message || 'Đăng nhập thất bại');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('error', 'Lỗi khi đăng nhập');
    }
}

async function register() {
    const name = document.getElementById('register-name').value;
    const roleEl = document.getElementById('register-role');
    const role = roleEl ? roleEl.value : 'khach_hang';
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (!name || !email || !phone || !password || !confirmPassword) {
        showAlert('warning', 'Vui lòng điền đầy đủ thông tin');
        return;
    }

    if (password !== confirmPassword) {
        showAlert('warning', 'Mật khẩu xác nhận không khớp');
        return;
    }

    try {
        const payload = {
            ten: name,
            email: email,
            so_dien_thoai: phone,
            mat_khau: password,
            loai_tai_khoan: role
        };

        const response = await fetch(`${API_BASE_URL}/auth/register/customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            if (role === 'tai_xe') {
                // Save token and go to driver info page to complete driver profile
                localStorage.setItem('token', result.data.token);
                dcApp.token = result.data.token;
                dcApp.user = result.data.user;
                dcApp.updateUI();
                showAlert('success', 'Tài khoản tạo thành công! Vui lòng hoàn thiện hồ sơ tài xế.');
                setTimeout(() => window.location.href = '/driver-info.html', 800);
            } else {
                showAlert('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
                toggleAuthForm(); // Switch to login form
            }
        } else {
            showAlert('error', result.message || 'Đăng ký thất bại');
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('error', 'Lỗi khi đăng ký');
    }
}

// Global Functions
function showAuthModal() {
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
}

function toggleAuthForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authModalTitle = document.getElementById('authModalTitle');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchLink = document.getElementById('auth-switch-link');

    if (loginForm.classList.contains('d-none')) {
        // Show login form
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
        authModalTitle.textContent = 'Đăng nhập';
        authSwitchText.textContent = 'Chưa có tài khoản?';
        authSwitchLink.textContent = 'Đăng ký ngay';
    } else {
        // Show register form
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
        authModalTitle.textContent = 'Đăng ký';
        authSwitchText.textContent = 'Đã có tài khoản?';
        authSwitchLink.textContent = 'Đăng nhập ngay';
    }
}

function logout() {
    dcApp.logout();
}

function showProfile() {
    showAlert('info', 'Chức năng đang được phát triển');
}

function showMyTrips() {
    if (dcApp.user) {
        dcApp.loadUserTrips();
        scrollToSection('my-trips');
        showAlert('info', 'Đã tải danh sách chuyến đi của bạn');
    } else {
        showAlert('warning', 'Vui lòng đăng nhập để xem chuyến đi');
        showAuthModal();
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function scrollToBooking() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.style.display = 'block';
        bookingForm.scrollIntoView({ behavior: 'smooth' });
    }
}

function showAlert(type, message) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert-toast');
    existingAlerts.forEach(alert => alert.remove());

    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';

    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show alert-toast position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', alertHtml);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const alert = document.querySelector('.alert-toast');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dcApp = new DCCarBooking();
    
    // Setup auth form handlers
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            register();
        });
    }
});