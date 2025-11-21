const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Lấy cài đặt thanh toán (cho tài xế)
router.get('/payment', authenticate, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const [settings] = await pool.execute(`
      SELECT ten_cai_dat, gia_tri 
      FROM cai_dat_he_thong 
      WHERE ten_cai_dat IN (?, ?, ?, ?, ?)
    `, [
      'qr_bank_name',
      'qr_bank_account', 
      'qr_account_holder',
      'driver_commission_rate',
      'debt_payment_deadline_hours'
    ]);

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.ten_cai_dat] = s.gia_tri;
    });

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống'
    });
  }
});

// Cập nhật cài đặt thanh toán (admin only)
router.post('/payment', authenticate, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.loai_tai_khoan !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có thể cập nhật cài đặt'
      });
    }

    const { 
      qr_bank_name, 
      qr_bank_account, 
      qr_account_holder,
      driver_commission_rate,
      debt_payment_deadline_hours
    } = req.body;

    const { pool } = require('../config/database');

    // Cập nhật từng cài đặt
    const updates = [
      { key: 'qr_bank_name', value: qr_bank_name },
      { key: 'qr_bank_account', value: qr_bank_account },
      { key: 'qr_account_holder', value: qr_account_holder },
      { key: 'driver_commission_rate', value: driver_commission_rate },
      { key: 'debt_payment_deadline_hours', value: debt_payment_deadline_hours }
    ];

    for (const update of updates) {
      if (update.value !== undefined) {
        await pool.execute(
          'UPDATE cai_dat_he_thong SET gia_tri = ? WHERE ten_cai_dat = ?',
          [update.value, update.key]
        );
      }
    }

    res.json({
      success: true,
      message: 'Cập nhật cài đặt thanh toán thành công'
    });
  } catch (error) {
    console.error('Update payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống'
    });
  }
});

module.exports = router;
