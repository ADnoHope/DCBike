const express = require('express');
const passport = require('../config/google');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  validateUserRegistration,
  validateDriverRegistration,
  validateLogin
} = require('../middleware/validation');

const router = express.Router();

// Đăng ký khách hàng
router.post('/register/customer', validateUserRegistration, AuthController.registerCustomer);

// Đăng ký tài xế  
router.post('/register/driver', validateDriverRegistration, AuthController.registerDriver);

// Đăng ký đơn xin làm tài xế (chờ duyệt) - yêu cầu xác thực để lấy thông tin user tự động
router.post('/register-driver', authenticate, AuthController.submitDriverRegistration);

// Đăng nhập
router.post('/login', validateLogin, AuthController.login);

// Quên mật khẩu
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/verify-reset-code', AuthController.verifyResetCode);
router.post('/reset-password', AuthController.resetPassword);

// Google OAuth routes (chỉ kích hoạt nếu có credentials)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google',
    passport.authenticate('google', { 
      scope: ['profile', 'email'] 
    })
  );

  router.get('/google/callback',
    passport.authenticate('google', { 
      failureRedirect: '/index.html?error=google_auth_failed',
      session: false 
    }),
    AuthController.googleCallback
  );
} else {
  // Fallback routes nếu Google OAuth chưa được cấu hình
  router.get('/google', (req, res) => {
    res.redirect('/index.html?error=google_not_configured');
  });
  
  router.get('/google/callback', (req, res) => {
    res.redirect('/index.html?error=google_not_configured');
  });
}

// Lấy thông tin profile (yêu cầu xác thực)
router.get('/profile', authenticate, AuthController.getProfile);

// Cập nhật profile (yêu cầu xác thực)
router.put('/profile', authenticate, AuthController.updateProfile);

// Đổi mật khẩu (yêu cầu xác thực)
router.post('/change-password', authenticate, AuthController.changePassword);

// Upload avatar (yêu cầu xác thực)
router.post('/upload-avatar', authenticate, upload.single('avatar'), AuthController.uploadAvatar);

// Xóa avatar (yêu cầu xác thực)
router.delete('/delete-avatar', authenticate, AuthController.deleteAvatar);

module.exports = router;