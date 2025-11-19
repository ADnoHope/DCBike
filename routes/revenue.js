  const express = require('express');
const router = express.Router();
const Revenue = require('../models/Revenue');
const { authenticate, requireAdmin, requireDriver } = require('../middleware/auth');

// Admin - Lấy tổng doanh thu web
router.get('/web-revenue', authenticate, requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const revenue = await Revenue.getWebRevenue(start_date, end_date);

    res.json({
      success: true,
      data: revenue
    });
  } catch (error) {
    console.error('Get web revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy doanh thu web'
    });
  }
});

// Admin - Lấy doanh thu theo tháng
router.get('/monthly', authenticate, requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const revenue = await Revenue.getMonthlyRevenue(year);

    res.json({
      success: true,
      data: revenue
    });
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy doanh thu theo tháng'
    });
  }
});

// Admin - Lấy top tài xế
router.get('/top-drivers', authenticate, requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { start_date, end_date } = req.query;
    
    const drivers = await Revenue.getTopDrivers(limit, start_date, end_date);

    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Get top drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy top tài xế'
    });
  }
});

// Driver - Lấy thu nhập của tài xế
router.get('/my-revenue', authenticate, requireDriver, async (req, res) => {
  try {
    const userId = req.user.id;
    const Driver = require('../models/Driver');
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải là tài xế'
      });
    }

    const { start_date, end_date } = req.query;
    const revenue = await Revenue.getDriverRevenue(driver.id, start_date, end_date);

    res.json({
      success: true,
      data: revenue
    });
  } catch (error) {
    console.error('Get driver revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy thu nhập tài xế'
    });
  }
});

// Driver - Lấy lịch sử thu nhập
router.get('/my-history', authenticate, requireDriver, async (req, res) => {
  try {
    const userId = req.user.id;
    const Driver = require('../models/Driver');
    
    const driver = await Driver.findByUserId(userId);
    if (!driver) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải là tài xế'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await Revenue.getDriverRevenueHistory(driver.id, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get driver revenue history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống khi lấy lịch sử thu nhập'
    });
  }
});

module.exports = router;
