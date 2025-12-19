const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/FeedbackController');
const { authenticate } = require('../middleware/auth');

// Public routes
// User gửi feedback (không cần đăng nhập)
router.post('/', FeedbackController.createFeedback);

// Protected routes (cần đăng nhập)
// User xem feedback của mình
router.get('/my-feedback', authenticate, FeedbackController.getMyFeedback);

// Admin routes (cần quyền admin)
const adminAuth = (req, res, next) => {
  if (req.user.loai_tai_khoan !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  next();
};

// Admin: Lấy tất cả feedback
router.get('/admin/all', authenticate, adminAuth, FeedbackController.getAllFeedback);

// Admin: Lấy số lượng feedback chưa đọc
router.get('/admin/unread-count', authenticate, adminAuth, FeedbackController.getUnreadCount);

// Admin: Lấy chi tiết feedback
router.get('/admin/:id', authenticate, adminAuth, FeedbackController.getFeedbackById);

// Admin: Trả lời feedback
router.post('/admin/:id/reply', authenticate, adminAuth, FeedbackController.replyFeedback);

// Admin: Xóa feedback
router.delete('/admin/:id', authenticate, adminAuth, FeedbackController.deleteFeedback);

module.exports = router;
