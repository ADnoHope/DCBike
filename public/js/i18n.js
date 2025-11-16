// Internationalization (i18n) - Hệ thống đa ngôn ngữ cho DC Booking

const translations = {
    vi: {
        // Navigation
        'nav.home': 'Trang chủ',
        'nav.booking': 'Đặt xe',
        'nav.trips': 'Chuyến đi',
        'nav.drivers': 'Tài xế',
        'nav.promotions': 'Khuyến mãi',
        'nav.statistics': 'Thống kê',
        'nav.profile': 'Hồ sơ',
        'nav.logout': 'Đăng xuất',
        'nav.login': 'Đăng nhập',
        
        // Profile Page
        'profile.title': 'Hồ sơ cá nhân',
        'profile.quick_actions': 'Thao tác nhanh',
        'profile.book_now': 'Đặt xe ngay',
        'profile.trip_history': 'Lịch sử chuyến đi',
        'profile.view_promotions': 'Xem khuyến mãi',
        'profile.driver_dashboard': 'Dashboard tài xế',
        'profile.trips': 'Chuyến đi',
        'profile.reviews': 'Đánh giá',
        'profile.member_since': 'Năm tham gia',
        
        // Profile Tabs
        'profile.tab.info': 'Thông tin cá nhân',
        'profile.tab.security': 'Bảo mật',
        'profile.tab.history': 'Lịch sử',
        'profile.tab.settings': 'Cài đặt',
        
        // Personal Info
        'profile.full_name': 'Họ và tên',
        'profile.email': 'Email',
        'profile.phone': 'Số điện thoại',
        'profile.account_type': 'Loại tài khoản',
        'profile.address': 'Địa chỉ',
        'profile.email_readonly': 'Email không thể thay đổi',
        'profile.update_info': 'Cập nhật thông tin',
        'profile.cancel': 'Hủy',
        
        // Driver Info
        'profile.driver_info': 'Thông tin tài xế',
        'profile.license_number': 'Số bằng lái',
        'profile.license_type': 'Loại bằng lái',
        'profile.car_plate': 'Biển số xe',
        'profile.car_type': 'Loại xe',
        
        // Security
        'profile.change_password': 'Đổi mật khẩu',
        'profile.current_password': 'Mật khẩu hiện tại',
        'profile.new_password': 'Mật khẩu mới',
        'profile.confirm_password': 'Xác nhận mật khẩu mới',
        'profile.password_hint': 'Mật khẩu phải có ít nhất 6 ký tự',
        'profile.account_security': 'Bảo mật tài khoản',
        'profile.two_factor': 'Xác thực hai yếu tố',
        'profile.two_factor_desc': 'Tăng cường bảo mật với xác thực qua SMS',
        'profile.login_notifications': 'Thông báo đăng nhập',
        'profile.login_notifications_desc': 'Nhận thông báo khi có đăng nhập từ thiết bị mới',
        
        // Settings
        'profile.app_settings': 'Cài đặt ứng dụng',
        'profile.notifications': 'Thông báo',
        'profile.email_notifications': 'Nhận thông báo qua email',
        'profile.sms_notifications': 'Nhận thông báo qua SMS',
        'profile.promotion_notifications': 'Nhận thông báo khuyến mãi',
        'profile.display': 'Hiển thị',
        'profile.language': 'Ngôn ngữ',
        'profile.dark_mode': 'Chế độ tối',
        'profile.danger_zone': 'Vùng nguy hiểm',
        'profile.danger_zone_desc': 'Các hành động này không thể hoàn tác',
        'profile.delete_account': 'Xóa tài khoản',
        
        // Trip History
        'profile.recent_trips': 'Lịch sử chuyến đi',
        'profile.view_all': 'Xem tất cả',
        'profile.no_trips': 'Chưa có chuyến đi nào',
        'profile.loading_trips': 'Đang tải lịch sử chuyến đi...',
        
        // Account Types
        'account.customer': 'Khách hàng',
        'account.driver': 'Tài xế',
        'account.admin': 'Quản trị viên',
        
        // Trip Status
        'trip.pending': 'Chờ xác nhận',
        'trip.confirmed': 'Đã xác nhận',
        'trip.in_progress': 'Đang thực hiện',
        'trip.completed': 'Hoàn thành',
        'trip.cancelled': 'Đã hủy',
        
        // Messages
        'msg.login_required': 'Vui lòng đăng nhập để xem hồ sơ',
        'msg.update_success': 'Cập nhật thông tin thành công',
        'msg.update_error': 'Không thể cập nhật thông tin',
        'msg.password_changed': 'Đổi mật khẩu thành công',
        'msg.password_error': 'Không thể đổi mật khẩu',
        'msg.current_password_wrong': 'Mật khẩu cũ không đúng',
        'msg.password_mismatch': 'Mật khẩu xác nhận không khớp',
        'msg.password_too_short': 'Mật khẩu mới phải có ít nhất 6 ký tự',
        'msg.fill_required': 'Vui lòng điền đầy đủ thông tin bắt buộc',
        'msg.avatar_uploading': 'Đang upload avatar...',
        'msg.avatar_success': 'Cập nhật avatar thành công',
        'msg.avatar_error': 'Không thể upload avatar',
        'msg.avatar_deleted': 'Đã xóa avatar',
        'msg.avatar_size_error': 'Kích thước file không được vượt quá 5MB',
        'msg.avatar_type_error': 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WEBP)',
        'msg.delete_confirm': 'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
        'msg.delete_confirm2': 'Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn. Bạn có chắc chắn?',
        'msg.delete_avatar_confirm': 'Bạn có chắc muốn xóa ảnh đại diện?',
        
        // Booking Page
        'booking.title': 'Đặt xe',
        'booking.pickup': 'Điểm đón',
        'booking.destination': 'Điểm đến',
        'booking.select_vehicle': 'Chọn loại xe',
        'booking.estimate_price': 'Giá ước tính',
        'booking.book_now': 'Đặt xe ngay',
        'booking.note': 'Ghi chú',
        'booking.payment_method': 'Phương thức thanh toán',
        'booking.cash': 'Tiền mặt',
        'booking.card': 'Thẻ',
        
        // Trips Page
        'trips.title': 'Chuyến đi của tôi',
        'trips.current': 'Đang diễn ra',
        'trips.history': 'Lịch sử',
        'trips.filter': 'Lọc theo trạng thái',
        'trips.all': 'Tất cả',
        'trips.from': 'Từ',
        'trips.to': 'Đến',
        'trips.driver': 'Tài xế',
        'trips.price': 'Giá cước',
        'trips.date': 'Ngày',
        'trips.status': 'Trạng thái',
        'trips.cancel': 'Hủy chuyến',
        'trips.rate': 'Đánh giá',
        'trips.details': 'Chi tiết',
        
        // Drivers Page
        'drivers.title': 'Danh sách tài xế',
        'drivers.available': 'Tài xế có sẵn',
        'drivers.rating': 'Đánh giá',
        'drivers.trips_completed': 'Chuyến đi hoàn thành',
        'drivers.vehicle': 'Phương tiện',
        'drivers.license': 'Bằng lái',
        'drivers.experience': 'Kinh nghiệm',
        'drivers.view_profile': 'Xem hồ sơ',
        'drivers.book': 'Đặt xe',
        
        // Promotions Page
        'promo.title': 'Khuyến mãi',
        'promo.available': 'Khuyến mãi có sẵn',
        'promo.code': 'Mã khuyến mãi',
        'promo.discount': 'Giảm giá',
        'promo.valid_until': 'Có hiệu lực đến',
        'promo.conditions': 'Điều kiện',
        'promo.use_now': 'Dùng ngay',
        'promo.copied': 'Đã sao chép mã',
        
        // Login/Register
        'auth.welcome': 'Chào mừng đến DC Booking',
        'auth.login': 'Đăng nhập',
        'auth.register': 'Đăng ký',
        'auth.email': 'Email',
        'auth.password': 'Mật khẩu',
        'auth.confirm_password': 'Xác nhận mật khẩu',
        'auth.full_name': 'Họ và tên',
        'auth.phone': 'Số điện thoại',
        'auth.address': 'Địa chỉ',
        'auth.forgot_password': 'Quên mật khẩu?',
        'auth.no_account': 'Chưa có tài khoản?',
        'auth.have_account': 'Đã có tài khoản?',
        'auth.register_customer': 'Đăng ký khách hàng',
        'auth.register_driver': 'Đăng ký tài xế',
        
        // Driver Dashboard
        'dashboard.title': 'Bảng điều khiển tài xế',
        'dashboard.today_earnings': 'Thu nhập hôm nay',
        'dashboard.total_trips': 'Tổng chuyến đi',
        'dashboard.rating': 'Đánh giá',
        'dashboard.status': 'Trạng thái',
        'dashboard.online': 'Trực tuyến',
        'dashboard.offline': 'Ngoại tuyến',
        'dashboard.busy': 'Bận',
        'dashboard.recent_trips': 'Chuyến đi gần đây',
        'dashboard.earnings': 'Thu nhập',
        
        // Admin
        'admin.title': 'Quản trị hệ thống',
        'admin.users': 'Người dùng',
        'admin.drivers': 'Tài xế',
        'admin.trips': 'Chuyến đi',
        'admin.revenue': 'Doanh thu',
        'admin.promotions': 'Khuyến mãi',
        'admin.settings': 'Cài đặt',
        'admin.approve': 'Duyệt',
        'admin.reject': 'Từ chối',
        'admin.statistics': 'Thống kê',
        
        // Common
        'common.loading': 'Đang tải...',
        'common.save': 'Lưu',
        'common.cancel': 'Hủy',
        'common.delete': 'Xóa',
        'common.edit': 'Chỉnh sửa',
        'common.view': 'Xem',
        'common.search': 'Tìm kiếm',
        'common.filter': 'Lọc',
        'common.required': 'Bắt buộc',
        'common.submit': 'Gửi',
        'common.close': 'Đóng',
        'common.confirm': 'Xác nhận',
        'common.back': 'Quay lại',
        'common.next': 'Tiếp theo',
        'common.previous': 'Trước',
        'common.select': 'Chọn',
        'common.or': 'hoặc',
        'common.and': 'và',
    },
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.booking': 'Booking',
        'nav.trips': 'Trips',
        'nav.drivers': 'Drivers',
        'nav.promotions': 'Promotions',
        'nav.statistics': 'Statistics',
        'nav.profile': 'Profile',
        'nav.logout': 'Logout',
        'nav.login': 'Login',
        
        // Profile Page
        'profile.title': 'Personal Profile',
        'profile.quick_actions': 'Quick Actions',
        'profile.book_now': 'Book Now',
        'profile.trip_history': 'Trip History',
        'profile.view_promotions': 'View Promotions',
        'profile.driver_dashboard': 'Driver Dashboard',
        'profile.trips': 'Trips',
        'profile.reviews': 'Reviews',
        'profile.member_since': 'Member Since',
        
        // Profile Tabs
        'profile.tab.info': 'Personal Information',
        'profile.tab.security': 'Security',
        'profile.tab.history': 'History',
        'profile.tab.settings': 'Settings',
        
        // Personal Info
        'profile.full_name': 'Full Name',
        'profile.email': 'Email',
        'profile.phone': 'Phone Number',
        'profile.account_type': 'Account Type',
        'profile.address': 'Address',
        'profile.email_readonly': 'Email cannot be changed',
        'profile.update_info': 'Update Information',
        'profile.cancel': 'Cancel',
        
        // Driver Info
        'profile.driver_info': 'Driver Information',
        'profile.license_number': 'License Number',
        'profile.license_type': 'License Type',
        'profile.car_plate': 'License Plate',
        'profile.car_type': 'Vehicle Type',
        
        // Security
        'profile.change_password': 'Change Password',
        'profile.current_password': 'Current Password',
        'profile.new_password': 'New Password',
        'profile.confirm_password': 'Confirm New Password',
        'profile.password_hint': 'Password must be at least 6 characters',
        'profile.account_security': 'Account Security',
        'profile.two_factor': 'Two-Factor Authentication',
        'profile.two_factor_desc': 'Enhance security with SMS verification',
        'profile.login_notifications': 'Login Notifications',
        'profile.login_notifications_desc': 'Get notified when logging in from a new device',
        
        // Settings
        'profile.app_settings': 'Application Settings',
        'profile.notifications': 'Notifications',
        'profile.email_notifications': 'Receive email notifications',
        'profile.sms_notifications': 'Receive SMS notifications',
        'profile.promotion_notifications': 'Receive promotion notifications',
        'profile.display': 'Display',
        'profile.language': 'Language',
        'profile.dark_mode': 'Dark Mode',
        'profile.danger_zone': 'Danger Zone',
        'profile.danger_zone_desc': 'These actions cannot be undone',
        'profile.delete_account': 'Delete Account',
        
        // Trip History
        'profile.recent_trips': 'Recent Trips',
        'profile.view_all': 'View All',
        'profile.no_trips': 'No trips yet',
        'profile.loading_trips': 'Loading trip history...',
        
        // Account Types
        'account.customer': 'Customer',
        'account.driver': 'Driver',
        'account.admin': 'Administrator',
        
        // Trip Status
        'trip.pending': 'Pending',
        'trip.confirmed': 'Confirmed',
        'trip.in_progress': 'In Progress',
        'trip.completed': 'Completed',
        'trip.cancelled': 'Cancelled',
        
        // Messages
        'msg.login_required': 'Please login to view profile',
        'msg.update_success': 'Information updated successfully',
        'msg.update_error': 'Unable to update information',
        'msg.password_changed': 'Password changed successfully',
        'msg.password_error': 'Unable to change password',
        'msg.current_password_wrong': 'Current password is incorrect',
        'msg.password_mismatch': 'Password confirmation does not match',
        'msg.password_too_short': 'New password must be at least 6 characters',
        'msg.fill_required': 'Please fill in all required fields',
        'msg.avatar_uploading': 'Uploading avatar...',
        'msg.avatar_success': 'Avatar updated successfully',
        'msg.avatar_error': 'Unable to upload avatar',
        'msg.avatar_deleted': 'Avatar deleted',
        'msg.avatar_size_error': 'File size must not exceed 5MB',
        'msg.avatar_type_error': 'Only image files accepted (JPEG, PNG, GIF, WEBP)',
        'msg.delete_confirm': 'Are you sure you want to delete your account? This action cannot be undone.',
        'msg.delete_confirm2': 'All your data will be permanently deleted. Are you sure?',
        'msg.delete_avatar_confirm': 'Are you sure you want to delete your avatar?',
        
        // Booking Page
        'booking.title': 'Book a Ride',
        'booking.pickup': 'Pickup Location',
        'booking.destination': 'Destination',
        'booking.select_vehicle': 'Select Vehicle',
        'booking.estimate_price': 'Estimated Price',
        'booking.book_now': 'Book Now',
        'booking.note': 'Note',
        'booking.payment_method': 'Payment Method',
        'booking.cash': 'Cash',
        'booking.card': 'Card',
        
        // Trips Page
        'trips.title': 'My Trips',
        'trips.current': 'Current',
        'trips.history': 'History',
        'trips.filter': 'Filter by Status',
        'trips.all': 'All',
        'trips.from': 'From',
        'trips.to': 'To',
        'trips.driver': 'Driver',
        'trips.price': 'Price',
        'trips.date': 'Date',
        'trips.status': 'Status',
        'trips.cancel': 'Cancel Trip',
        'trips.rate': 'Rate',
        'trips.details': 'Details',
        
        // Drivers Page
        'drivers.title': 'Drivers List',
        'drivers.available': 'Available Drivers',
        'drivers.rating': 'Rating',
        'drivers.trips_completed': 'Trips Completed',
        'drivers.vehicle': 'Vehicle',
        'drivers.license': 'License',
        'drivers.experience': 'Experience',
        'drivers.view_profile': 'View Profile',
        'drivers.book': 'Book',
        
        // Promotions Page
        'promo.title': 'Promotions',
        'promo.available': 'Available Promotions',
        'promo.code': 'Promo Code',
        'promo.discount': 'Discount',
        'promo.valid_until': 'Valid Until',
        'promo.conditions': 'Conditions',
        'promo.use_now': 'Use Now',
        'promo.copied': 'Code Copied',
        
        // Login/Register
        'auth.welcome': 'Welcome to DC Booking',
        'auth.login': 'Login',
        'auth.register': 'Register',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.confirm_password': 'Confirm Password',
        'auth.full_name': 'Full Name',
        'auth.phone': 'Phone Number',
        'auth.address': 'Address',
        'auth.forgot_password': 'Forgot Password?',
        'auth.no_account': "Don't have an account?",
        'auth.have_account': 'Already have an account?',
        'auth.register_customer': 'Register as Customer',
        'auth.register_driver': 'Register as Driver',
        
        // Driver Dashboard
        'dashboard.title': 'Driver Dashboard',
        'dashboard.today_earnings': "Today's Earnings",
        'dashboard.total_trips': 'Total Trips',
        'dashboard.rating': 'Rating',
        'dashboard.status': 'Status',
        'dashboard.online': 'Online',
        'dashboard.offline': 'Offline',
        'dashboard.busy': 'Busy',
        'dashboard.recent_trips': 'Recent Trips',
        'dashboard.earnings': 'Earnings',
        
        // Admin
        'admin.title': 'System Administration',
        'admin.users': 'Users',
        'admin.drivers': 'Drivers',
        'admin.trips': 'Trips',
        'admin.revenue': 'Revenue',
        'admin.promotions': 'Promotions',
        'admin.settings': 'Settings',
        'admin.approve': 'Approve',
        'admin.reject': 'Reject',
        'admin.statistics': 'Statistics',
        
        // Common
        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.view': 'View',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.required': 'Required',
        'common.submit': 'Submit',
        'common.close': 'Close',
        'common.confirm': 'Confirm',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.previous': 'Previous',
        'common.select': 'Select',
        'common.or': 'or',
        'common.and': 'and',
    }
};

class I18n {
    constructor() {
        this.currentLanguage = this.loadLanguage();
        this.initializeLanguage();
    }

    loadLanguage() {
        const saved = localStorage.getItem('dc_booking_language');
        return saved || 'vi';
    }

    saveLanguage(lang) {
        localStorage.setItem('dc_booking_language', lang);
        this.currentLanguage = lang;
    }

    initializeLanguage() {
        // Set the language selector if it exists
        const selector = document.getElementById('language-setting');
        if (selector) {
            selector.value = this.currentLanguage;
            selector.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
    }

    changeLanguage(lang) {
        if (!translations[lang]) {
            console.error(`Language ${lang} not supported`);
            return;
        }

        this.saveLanguage(lang);
        this.translatePage();
        
        // Show notification
        const message = lang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Changed to English';
        if (typeof showAlert === 'function') {
            showAlert('success', message);
        }
    }

    t(key) {
        const lang = translations[this.currentLanguage];
        return lang[key] || key;
    }

    translatePage() {
        // Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // Determine what to translate
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.type === 'button' || element.type === 'submit') {
                    element.value = translation;
                } else {
                    element.placeholder = translation;
                }
            } else if (element.tagName === 'OPTION') {
                element.textContent = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Translate placeholders with data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Translate titles with data-i18n-title
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLanguage;
    }

    // Helper to get account type translation
    getAccountType(type) {
        const map = {
            'khach_hang': this.t('account.customer'),
            'tai_xe': this.t('account.driver'),
            'admin': this.t('account.admin')
        };
        return map[type] || type;
    }

    // Helper to get trip status translation
    getTripStatus(status) {
        const map = {
            'cho_xac_nhan': this.t('trip.pending'),
            'da_xac_nhan': this.t('trip.confirmed'),
            'dang_thuc_hien': this.t('trip.in_progress'),
            'hoan_thanh': this.t('trip.completed'),
            'da_huy': this.t('trip.cancelled')
        };
        return map[status] || status;
    }
}

// Initialize i18n globally
const i18n = new I18n();

// Make it available globally
window.i18n = i18n;

// Auto-translate on page load
document.addEventListener('DOMContentLoaded', function() {
    i18n.translatePage();
});
