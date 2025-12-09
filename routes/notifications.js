const express = require('express');
const NotificationController = require('../controllers/NotificationController');
const { authenticate, requireDriver } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// ===== CUSTOMER NOTIFICATIONS =====
/**
 * GET /api/notifications/unread
 * Lấy tất cả thông báo chưa đọc của user
 */
router.get('/unread', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.getByUserId(userId, true, 50); // Unread, limit 50

    res.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông báo',
      error: error.message
    });
  }
});

/**
 * GET /api/notifications
 * Lấy tất cả thông báo của user (với limit)
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const notifications = await Notification.getByUserId(userId, false, limit);

    res.json({
      success: true,
      notifications: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông báo',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Đánh dấu thông báo là đã đọc
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const success = await Notification.markAsRead(notificationId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Thông báo đã được đánh dấu là đã đọc'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông báo',
      error: error.message
    });
  }
});

/**
 * PUT /api/notifications/read-all
 * Đánh dấu tất cả thông báo là đã đọc
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'Tất cả thông báo đã được đánh dấu là đã đọc',
      count: count
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật thông báo',
      error: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 * Xóa một thông báo
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const success = await Notification.delete(notificationId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Thông báo đã bị xóa'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa thông báo',
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/count/unread
 * Lấy số lượng thông báo chưa đọc
 */
router.get('/count/unread', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy số thông báo chưa đọc',
      error: error.message
    });
  }
});

// ===== DRIVER NOTIFICATIONS (keep existing routes) =====
// All routes require authentication and driver role
router.use(authenticate, requireDriver);

// GET /api/drivers/notifications/ -> list notifications for current driver
router.get('/driver', NotificationController.getNotificationsForDriver);

// POST /api/drivers/notifications/:id/seen -> mark as seen
router.post('/driver/:id/seen', NotificationController.markAsSeen);

// POST /api/drivers/notifications/:id/status -> update status (accepted/rejected)
router.post('/driver/:id/status', NotificationController.updateNotificationStatus);

module.exports = router;
