const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const EmailService = require('../services/EmailService');

// Chỉ cấu hình Google OAuth nếu có credentials
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Cấu hình Google OAuth Strategy
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Lấy thông tin từ Google profile
        const googleId = profile.id;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const ten = profile.displayName;
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        
        // Lấy số điện thoại nếu có (thường không có từ Google)
        const so_dien_thoai = profile.phoneNumbers && profile.phoneNumbers[0] 
          ? profile.phoneNumbers[0].value 
          : null;

        if (!email) {
          return done(new Error('Không thể lấy email từ tài khoản Google'), null);
        }

        // Tìm hoặc tạo user
        const result = await User.findOrCreateGoogleUser({
          google_id: googleId,
          email: email,
          ten: ten,
          so_dien_thoai: so_dien_thoai,
          avatar: avatar,
          loai_tai_khoan: 'khach_hang' // Mặc định là khách hàng
        });

        // Gửi email chào mừng nếu là user mới
        if (result.isNewUser) {
          EmailService.sendWelcomeEmail(email, ten).catch(err => {
            console.error('Lỗi khi gửi email chào mừng:', err);
          });
        }

        return done(null, result.user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));

  // Serialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  console.log('✓ Google OAuth đã được cấu hình');
} else {
  console.warn('⚠ Google OAuth chưa được cấu hình. Vui lòng thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào file .env');
}

module.exports = passport;
