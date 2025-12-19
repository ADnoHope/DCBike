/**
 * Real-time Notification System using Socket.IO
 * Tương tự Facebook notifications
 */

class RealtimeNotificationManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.notifications = [];
    this.unreadCount = 0;
    this.notificationContainer = null;
    this.notificationBell = null;
  }

  /**
   * Initialize Socket.IO connection và setup UI
   * @deprecated Use setupUI() and initSocket() separately
   */
  init(token, userRole) {
    this.setupUI();
    return this.initSocket(token, userRole);
  }

  /**
   * Initialize Socket.IO connection only (separated from UI setup)
   */
  initSocket(token, userRole) {
    // Check if Socket.IO client library is loaded
    if (typeof io === 'undefined') {
      console.error('Socket.IO client library not found. Make sure to include <script src="/socket.io/socket.io.js"></script>');
      return false;
    }

    // Kết nối tới server
    this.socket = io({
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to server via Socket.IO');
      this.isConnected = true;
      this.showConnectionStatus('connected');
      
      // Emit events để listen for notifications
      if (userRole === 'tai_xe' || userRole === 'driver') {
        this.socket.emit('listen-new-trips');
        console.log('👂 Listening for new trips...');
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this.isConnected = false;
      this.showConnectionStatus('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.showConnectionStatus('error');
    });

    // ========== NOTIFICATION EVENTS ==========

    /**
     * NEW TRIP AVAILABLE (for drivers)
     * Emitted when a customer creates a new trip
     */
    this.socket.on('new-trip-available', (data) => {
      console.log('🚗 New trip available:', data);
      this.addNotification({
        id: `trip-${data.tripId}`,
        type: 'new-trip',
        title: 'Chuyến xe mới',
        message: data.message || `${data.diem_don} → ${data.diem_den}`,
        details: data,
        icon: '<i class="fas fa-car text-warning"></i>',
        timestamp: new Date(),
        actionUrl: `/views/driver-dashboard.html?trip=${data.tripId}`
      });
      
      this.playNotificationSound();
      this.showDesktopNotification('Chuyến xe mới', data.message);
    });

    /**
     * TRIP ACCEPTED (for customers)
     * Emitted when a driver accepts the customer's trip
     */
    this.socket.on('trip-accepted', (data) => {
      console.log('✅ Trip accepted:', data);
      this.addNotification({
        id: `accepted-${data.tripId}`,
        type: 'trip-accepted',
        title: 'Tài xế đã nhận chuyến',
        message: data.message || `${data.driverName} đã nhận chuyến của bạn`,
        details: data,
        icon: '<i class="fas fa-check-circle text-success"></i>',
        timestamp: new Date(),
        actionUrl: `/views/booking.html?trip=${data.tripId}`
      });
      
      this.playNotificationSound();
      this.showDesktopNotification('Tài xế đã nhận chuyến', data.message);
    });

    /**
     * TRIP CANCEL REQUEST (for drivers)
     * Emitted when a customer requests to cancel a trip
     */
    this.socket.on('trip-cancel-request', (data) => {
      console.log('🚫 Trip cancel request:', data);
      this.addNotification({
        id: `cancel-${data.tripId}`,
        type: 'trip-cancel-request',
        title: 'Khách hàng yêu cầu hủy chuyến',
        message: data.message || `Chuyến #${data.tripId} - ${data.ly_do_huy}`,
        details: data,
        icon: '<i class="fas fa-exclamation-triangle text-danger"></i>',
        timestamp: new Date(),
        actionUrl: `/views/driver-dashboard.html`
      });
      
      this.playNotificationSound();
      this.showDesktopNotification('Khách hàng yêu cầu hủy chuyến', data.message);
    });

    /**
     * TRIP AUTO CANCELLED (for customers)
     * Emitted when a trip is automatically cancelled due to no driver accepting
     */
    this.socket.on('trip-auto-cancelled', (data) => {
      console.log('⏰ Trip auto-cancelled:', data);
      this.addNotification({
        id: `auto-cancel-${data.tripId}`,
        type: 'trip-auto-cancelled',
        title: 'Chuyến đi đã bị hủy tự động',
        message: data.message || `Chuyến #${data.tripId} đã bị hủy do không có tài xế nhận sau 1 tiếng`,
        details: data,
        icon: '<i class="fas fa-clock text-warning"></i>',
        timestamp: new Date(),
        actionUrl: `/views/trips.html`
      });
      
      this.playNotificationSound();
      this.showDesktopNotification('Chuyến đi đã bị hủy tự động', data.message);
    });

    return true;
  }

  /**
   * Setup notification UI (bell icon, notification list)
   */
  setupUI() {
    // Check if header container exists (for index.html)
    const headerContainer = document.getElementById('header-notification-container');
    const targetContainer = headerContainer || document.body;
    
    // Create notification container if not exists
    if (!document.getElementById('realtime-notification-container')) {
      const container = document.createElement('div');
      container.id = 'realtime-notification-container';
      container.className = 'realtime-notification-container';
      container.innerHTML = `
        <div class="notification-bell-container">
          <button id="notification-bell" class="notification-bell" title="Thông báo">
            <i class="fas fa-bell"></i>
            <span id="unread-badge" class="unread-badge" style="display: none;">0</span>
          </button>
        
          <!-- Notification List Popup -->
          <div id="notification-list" class="notification-list" style="display: none;">
            <div class="notification-list-header">
              <h5 class="mb-0">
                <i class="fas fa-bell me-2"></i>Thông báo
              </h5>
              <button class="btn-close btn-sm" id="close-notification-list"></button>
            </div>
            <div id="notification-list-body" class="notification-list-body">
              <div class="text-center text-muted py-4">
                <i class="fas fa-inbox fa-2x mb-2"></i>
                <p>Chưa có thông báo</p>
              </div>
            </div>
            <div class="notification-list-footer text-center">
              <a href="/views/notifications.html" class="text-decoration-none d-block py-2">
                <i class="fas fa-arrow-right me-1"></i>Xem tất cả thông báo
              </a>
            </div>
          </div>
        </div>
      `;
      targetContainer.appendChild(container);
    }

    // Get UI elements
    this.notificationBell = document.getElementById('notification-bell');
    this.notificationList = document.getElementById('notification-list');
    const closeBtn = document.getElementById('close-notification-list');

    // Bell click handler - toggle notification list
    if (this.notificationBell) {
      this.notificationBell.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
          // Show login prompt if not logged in
          this.showLoginPrompt();
          return;
        }
        
        const isHidden = this.notificationList.style.display === 'none';
        this.notificationList.style.display = isHidden ? 'block' : 'none';
      });
    }

    // Close button handler
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.notificationList.style.display = 'none';
      });
    }

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.notificationList && this.notificationBell && 
          !this.notificationList.contains(e.target) && 
          !this.notificationBell.contains(e.target)) {
        this.notificationList.style.display = 'none';
      }
    });
  }

  /**
   * Show login prompt when user is not logged in
   */
  showLoginPrompt() {
    const body = document.getElementById('notification-list-body');
    if (body) {
      body.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-sign-in-alt fa-2x mb-3 text-primary"></i>
          <p class="mb-3">Vui lòng đăng nhập để xem thông báo</p>
          <button class="btn btn-primary btn-sm" onclick="showAuthModal(); document.getElementById('notification-list').style.display='none';">
            <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập
          </button>
        </div>
      `;
    }
    this.notificationList.style.display = 'block';
  }

  /**
   * Add notification to list
   */
  addNotification(notification) {
    this.notifications.unshift(notification);
    this.unreadCount++;
    
    // Keep only last 20 notifications in memory
    if (this.notifications.length > 20) {
      this.notifications.pop();
    }

    // Update UI
    this.updateNotificationUI();
  }

  /**
   * Update notification list display
   */
  updateNotificationUI() {
    const badge = document.getElementById('unread-badge');
    const body = document.getElementById('notification-list-body');

    // Update badge count
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Update notification list body
    if (body) {
      if (this.notifications.length === 0) {
        body.innerHTML = `
          <div class="text-center text-muted py-4">
            <i class="fas fa-inbox fa-2x mb-2"></i>
            <p>Chưa có thông báo</p>
          </div>
        `;
      } else {
        body.innerHTML = this.notifications.map(notif => `
          <div class="notification-item ${notif.type}" onclick="window.location.href='${notif.actionUrl || '#'}'">
            <div class="notification-item-icon">
              ${notif.icon}
            </div>
            <div class="notification-item-content">
              <div class="notification-item-title">${notif.title}</div>
              <div class="notification-item-message">${notif.message}</div>
              <div class="notification-item-time">${this.formatTime(notif.timestamp)}</div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  /**
   * Format timestamp to relative time
   */
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    try {
      const audioUrl = '/assets/notification-sound.mp3';
      const audio = new Audio(audioUrl);
      audio.volume = 0.5;
      audio.play().catch(e => console.debug('Audio play failed:', e.message));
    } catch (e) {
      console.debug('Notification sound error:', e.message);
    }
  }

  /**
   * Show desktop notification (if permitted)
   */
  showDesktopNotification(title, message) {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            icon: '/images/logo.png',
            body: message,
            tag: 'dcbooking-notification',
            requireInteraction: false
          });
        } else if (Notification.permission !== 'denied') {
          // Ask for permission
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(title, {
                icon: '/images/logo.png',
                body: message
              });
            }
          });
        }
      }
    } catch (e) {
      console.debug('Desktop notification error:', e.message);
    }
  }

  /**
   * Show connection status indicator
   */
  showConnectionStatus(status) {
    let statusEl = document.getElementById('socket-status');
    
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'socket-status';
      statusEl.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 10px 15px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        z-index: 9999;
        display: none;
      `;
      document.body.appendChild(statusEl);
    }

    const statusConfig = {
      connected: {
        text: '🟢 Connected',
        bg: '#d4edda',
        color: '#155724'
      },
      disconnected: {
        text: '🔴 Disconnected',
        bg: '#f8d7da',
        color: '#721c24'
      },
      error: {
        text: '🟠 Connection Error',
        bg: '#fff3cd',
        color: '#856404'
      }
    };

    const config = statusConfig[status] || statusConfig.disconnected;
    statusEl.textContent = config.text;
    statusEl.style.backgroundColor = config.bg;
    statusEl.style.color = config.color;
    statusEl.style.display = 'block';

    // Auto hide after 5 seconds if connected
    if (status === 'connected') {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId) {
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.updateNotificationUI();
  }

  /**
   * Load existing notifications from database
   * Called when user logs in / reconnects
   */
  async loadExistingNotifications() {
    try {
      const response = await fetch('/api/notifications/unread', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        console.warn('Could not load existing notifications:', response.status);
        return;
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.notifications)) {
        console.log(`📦 Loaded ${result.notifications.length} existing notifications from database`);
        
        result.notifications.forEach(notif => {
          let displayNotif = {
            id: `db-${notif.id}`,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            details: notif.data || {},
            timestamp: new Date(notif.created_at),
            isFromDatabase: true
          };

          // Add icon based on type
          if (notif.type === 'trip_accepted') {
            displayNotif.icon = '<i class="fas fa-check-circle text-success"></i>';
            displayNotif.actionUrl = `/views/booking.html?trip=${notif.trip_id}`;
          } else if (notif.type === 'new_trip') {
            displayNotif.icon = '<i class="fas fa-car text-warning"></i>';
            displayNotif.actionUrl = `/views/driver-dashboard.html?trip=${notif.trip_id}`;
          } else {
            displayNotif.icon = '<i class="fas fa-info-circle text-info"></i>';
          }

          this.addNotification(displayNotif);
        });
      }
    } catch (error) {
      console.error('Error loading existing notifications:', error);
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications = [];
    this.unreadCount = 0;
    this.updateNotificationUI();
  }
}

// Export global instance
const realtimeNotifications = new RealtimeNotificationManager();
