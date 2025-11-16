/**
 * Modern Notification System for DC Booking
 * Usage: showNotification(message, type, duration)
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create notification container if not exists
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
    }

    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} notification-enter`;
        
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };

        const titles = {
            success: 'Thành công',
            error: 'Lỗi',
            warning: 'Cảnh báo',
            info: 'Thông báo'
        };

        notification.innerHTML = `
            <div class="notification-icon">
                ${icons[type] || icons.info}
            </div>
            <div class="notification-content">
                <div class="notification-title">${titles[type] || titles.info}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.remove('notification-enter');
            notification.classList.add('notification-show');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        // Add click to close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    remove(notification) {
        notification.classList.remove('notification-show');
        notification.classList.add('notification-exit');
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 300);
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 3000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    // Loading notification (doesn't auto close)
    loading(message = 'Đang xử lý...') {
        const notification = document.createElement('div');
        notification.className = 'notification notification-loading notification-enter';
        
        notification.innerHTML = `
            <div class="notification-icon">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            <div class="notification-content">
                <div class="notification-title">Đang xử lý</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        this.container.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('notification-enter');
            notification.classList.add('notification-show');
        }, 10);

        return notification;
    }

    // Remove all notifications
    clearAll() {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            this.remove(notification);
        });
    }
}

// Initialize global notification system
const notificationSystem = new NotificationSystem();

// Global helper functions
function showNotification(message, type = 'info', duration = 3000) {
    return notificationSystem.show(message, type, duration);
}

function showSuccess(message, duration) {
    return notificationSystem.success(message, duration);
}

function showError(message, duration) {
    return notificationSystem.error(message, duration);
}

function showWarning(message, duration) {
    return notificationSystem.warning(message, duration);
}

function showInfo(message, duration) {
    return notificationSystem.info(message, duration);
}

function showLoading(message) {
    return notificationSystem.loading(message);
}

function hideNotification(notification) {
    if (notification) {
        notificationSystem.remove(notification);
    }
}

function clearAllNotifications() {
    notificationSystem.clearAll();
}
