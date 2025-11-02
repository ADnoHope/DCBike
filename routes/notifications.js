const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get notifications for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await Notification.getByUser(userId);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo' });
  }
});

// Mark a notification read
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const ok = await Notification.markRead(id);
    if (ok) return res.json({ success: true });
    res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thông báo' });
  }
});

module.exports = router;
