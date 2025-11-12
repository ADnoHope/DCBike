const express = require('express');
const { authenticate, requireCustomer } = require('../middleware/auth');
const ReviewController = require('../controllers/ReviewController');

const router = express.Router();

// Tạo đánh giá (khách hàng)
router.post('/', authenticate, requireCustomer, ReviewController.createReview);

module.exports = router;
