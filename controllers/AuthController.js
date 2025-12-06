const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');
const User = require('../models/User');
const Driver = require('../models/Driver');
const DriverRegistration = require('../models/DriverRegistration');
const DriverDebt = require('../models/DriverDebt');
const EmailService = require('../services/EmailService');
const path = require('path');
const fs = require('fs');

class AuthController {
  // Đăng ký khách hàng
  static async registerCustomer(req, res) {
    try {
      const { ten, email, so_dien_thoai, mat_khau, dia_chi, loai_tai_khoan } = req.body;

      // Kiểm tra email đã tồn tại
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }

      // Kiểm tra số điện thoại đã tồn tại
      const existingPhone = await User.findByPhone(so_dien_thoai);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }

      // Hash mật khẩu
      const hashedPassword = await bcrypt.hash(mat_khau, 12);

      // Tạo người dùng mới
      const userType = loai_tai_khoan === 'tai_xe' ? 'tai_xe' : 'khach_hang';

      const userId = await User.create({
        ten,
        email,
        so_dien_thoai,
        mat_khau: hashedPassword,
        dia_chi,
        loai_tai_khoan: userType
      });

      // Tạo token
      const token = generateToken({ userId, email, loai_tai_khoan: userType });

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: {
          userId,
          token,
          user: {
            id: userId,
            ten,
            email,
            so_dien_thoai,
            loai_tai_khoan: userType
          }
        }
      });

      // Gửi email chào mừng nếu sử dụng Gmail
      if (email && email.toLowerCase().endsWith('@gmail.com')) {
        EmailService.sendWelcomeEmail(email, ten).catch(err => {
          console.error('Register customer welcome email error:', err);
        });
      }
    } catch (error) {
      console.error('Register customer error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi đăng ký'
      });
    }
  }

  // Đăng ký tài xế
  static async registerDriver(req, res) {
    try {
      const {
        ten, email, so_dien_thoai, mat_khau, dia_chi,
        so_bang_lai, loai_bang_lai, kinh_nghiem_lien_tuc,
        bien_so_xe, loai_xe, mau_xe, hang_xe, so_cho_ngoi
      } = req.body;

      // Kiểm tra email đã tồn tại
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }

      // Kiểm tra số điện thoại đã tồn tại
      const existingPhone = await User.findByPhone(so_dien_thoai);
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại đã được sử dụng'
        });
      }

      // Hash mật khẩu
      const hashedPassword = await bcrypt.hash(mat_khau, 12);

      // Đăng ký tài xế
      const result = await Driver.register({
        ten,
        email,
        so_dien_thoai,
        mat_khau: hashedPassword,
        dia_chi,
        so_bang_lai,
        loai_bang_lai,
        kinh_nghiem_lien_tuc,
        bien_so_xe,
        loai_xe,
        mau_xe,
        hang_xe,
        so_cho_ngoi
      });

      // Tạo token
      const token = generateToken({
        userId: result.userId,
        email,
        loai_tai_khoan: 'tai_xe'
      });

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài xế thành công',
        data: {
          userId: result.userId,
          driverId: result.driverId,
          token,
          user: {
            id: result.userId,
            ten,
            email,
            so_dien_thoai,
            loai_tai_khoan: 'tai_xe'
          }
        }
      });

      // Gửi email chào mừng nếu sử dụng Gmail
      if (email && email.toLowerCase().endsWith('@gmail.com')) {
        EmailService.sendWelcomeEmail(email, ten).catch(err => {
          console.error('Register driver welcome email error:', err);
        });
      }
    } catch (error) {
      console.error('Register driver error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi đăng ký tài xế'
      });
    }
  }

  // Đăng nhập
  static async login(req, res) {
    try {
      const { email, mat_khau } = req.body;

      // Tìm người dùng
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      // Kiểm tra mật khẩu
      const isPasswordValid = await bcrypt.compare(mat_khau, user.mat_khau);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      // Tạo token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        loai_tai_khoan: user.loai_tai_khoan
      });

      // Lấy thông tin bổ sung nếu là tài xế
      let additionalInfo = {};
      if (user.loai_tai_khoan === 'tai_xe') {
        const driverInfo = await Driver.findByUserId(user.id);
        additionalInfo.driverInfo = driverInfo;
      }

      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          token,
          user: {
            id: user.id,
            ten: user.ten,
            email: user.email,
            so_dien_thoai: user.so_dien_thoai,
            dia_chi: user.dia_chi,
            loai_tai_khoan: user.loai_tai_khoan
          },
          ...additionalInfo
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi đăng nhập'
      });
    }
  }

  // Google OAuth callback
  static async googleCallback(req, res) {
    try {
      if (!req.user) {
        return res.redirect('/index.html?error=google_auth_error');
      }

      const loaiTaiKhoan = req.user.loai_tai_khoan || 'khach_hang';
      const token = generateToken({
        userId: req.user.id,
        email: req.user.email,
        loai_tai_khoan: loaiTaiKhoan
      });

      const redirectUrl = `/index.html?google_login=success&token=${encodeURIComponent(token)}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google callback error:', error);
      return res.redirect('/index.html?error=google_auth_error');
    }
  }

  // Lấy thông tin profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Lấy thông tin bổ sung nếu là tài xế
      let additionalInfo = {};
      if (user.loai_tai_khoan === 'tai_xe') {
        const driverInfo = await Driver.findByUserId(user.id);
        additionalInfo.driverInfo = driverInfo;
      }

      // Đếm số chuyến đi của người dùng
      const { pool } = require('../config/database');
      let tripCountQuery, tripCountParams;
      
      if (user.loai_tai_khoan === 'tai_xe') {
        // Nếu là tài xế, đếm chuyến đi mà họ đã nhận
        // Join với bảng tai_xe vì tai_xe_id trong chuyen_di là ID của bảng tai_xe
        tripCountQuery = `
          SELECT COUNT(*) as total 
          FROM chuyen_di cd
          INNER JOIN tai_xe tx ON cd.tai_xe_id = tx.id
          WHERE tx.nguoi_dung_id = ?
        `;
        tripCountParams = [user.id];
      } else {
        // Nếu là khách hàng, đếm chuyến đi mà họ đã đặt
        tripCountQuery = 'SELECT COUNT(*) as total FROM chuyen_di WHERE khach_hang_id = ?';
        tripCountParams = [user.id];
      }
      
      const [tripCountResult] = await pool.execute(tripCountQuery, tripCountParams);
      const totalTrips = tripCountResult[0].total;

      // Đếm số đánh giá của người dùng
      const [reviewCountResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM danh_gia WHERE nguoi_danh_gia_id = ?',
        [user.id]
      );
      const totalReviews = reviewCountResult[0].total;

      res.json({
        success: true,
        data: {
          id: user.id,
          ten: user.ten,
          email: user.email,
          so_dien_thoai: user.so_dien_thoai,
          dia_chi: user.dia_chi,
          avatar: user.avatar,
          loai_tai_khoan: user.loai_tai_khoan,
          created_at: user.created_at,
          totalTrips: totalTrips,
          totalReviews: totalReviews,
          ...additionalInfo
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy thông tin profile'
      });
    }
  }

  // Cập nhật profile
  static async updateProfile(req, res) {
    try {
      const { ten, dia_chi, so_dien_thoai } = req.body;
      const userId = req.user.id;

      // Kiểm tra số điện thoại đã tồn tại (trừ của chính user này)
      if (so_dien_thoai) {
        const existingPhone = await User.findByPhone(so_dien_thoai);
        if (existingPhone && existingPhone.id !== userId) {
          return res.status(400).json({
            success: false,
            message: 'Số điện thoại đã được sử dụng'
          });
        }
      }

      const updateData = {};
      if (ten) updateData.ten = ten;
      if (dia_chi) updateData.dia_chi = dia_chi;
      if (so_dien_thoai) updateData.so_dien_thoai = so_dien_thoai;

      const updated = await User.update(userId, updateData);
      
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Không thể cập nhật thông tin'
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật thông tin thành công'
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi cập nhật profile'
      });
    }
  }

  // Đổi mật khẩu
  static async changePassword(req, res) {
    try {
      const { mat_khau_cu, mat_khau_moi } = req.body;
      const userId = req.user.id;

      // Lấy thông tin user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }

      // Kiểm tra mật khẩu cũ
      const isOldPasswordValid = await bcrypt.compare(mat_khau_cu, user.mat_khau);
      if (!isOldPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu cũ không đúng'
        });
      }

      // Hash mật khẩu mới
      const hashedNewPassword = await bcrypt.hash(mat_khau_moi, 12);

      // Cập nhật mật khẩu
      const updated = await User.update(userId, { mat_khau: hashedNewPassword });
      
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Không thể đổi mật khẩu'
        });
      }

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi đổi mật khẩu'
      });
    }
  }

  // Gửi đăng ký tài xế (chờ duyệt)
  static async submitDriverRegistration(req, res) {
    try {
      // Lấy thông tin user đã đăng nhập
      const userId = req.user.id;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy thông tin người dùng' 
        });
      }

      // Kiểm tra user đã là tài xế chưa
      if (user.loai_tai_khoan === 'tai_xe') {
        return res.status(400).json({ 
          success: false, 
          message: 'Bạn đã là tài xế' 
        });
      }

      // Kiểm tra nếu user trước đây là tài xế và có nợ chưa thanh toán
      const { pool } = require('../config/database');
      const [driverRecord] = await pool.execute(
        'SELECT id FROM tai_xe WHERE nguoi_dung_id = ?',
        [userId]
      );

      if (driverRecord.length > 0) {
        const driverId = driverRecord[0].id;
        
        // Kiểm tra nợ chưa thanh toán
        const [unpaidDebts] = await pool.execute(
          `SELECT 
            id, 
            chuyen_di_id, 
            so_tien_no, 
            so_tien_da_tra,
            han_thanh_toan,
            trang_thai
          FROM no_tai_xe 
          WHERE tai_xe_id = ? AND trang_thai != 'da_tra'
          ORDER BY han_thanh_toan ASC`,
          [driverId]
        );

        if (unpaidDebts.length > 0) {
          // Tính tổng nợ
          const tongNo = unpaidDebts.reduce((sum, debt) => {
            return sum + (parseFloat(debt.so_tien_no) - parseFloat(debt.so_tien_da_tra || 0));
          }, 0);

          // Kiểm tra nợ quá hạn
          const hasOverdueDebt = unpaidDebts.some(debt => 
            new Date(debt.han_thanh_toan) < new Date()
          );

          return res.status(400).json({ 
            success: false, 
            requirePayment: true,
            hasOverdueDebt,
            message: hasOverdueDebt 
              ? 'Bạn có khoản nợ quá hạn chưa thanh toán. Vui lòng thanh toán trước khi đăng ký lại tài xế.'
              : 'Bạn còn khoản nợ chưa thanh toán. Vui lòng thanh toán trước khi đăng ký lại tài xế.',
            data: {
              tongNo: Math.round(tongNo),
              soKhoanNo: unpaidDebts.length,
              driverId: driverId,
              debts: unpaidDebts.map(debt => ({
                id: debt.id,
                soTien: Math.round(parseFloat(debt.so_tien_no) - parseFloat(debt.so_tien_da_tra || 0)),
                hanThanhToan: debt.han_thanh_toan,
                trangThai: debt.trang_thai,
                quaHan: new Date(debt.han_thanh_toan) < new Date()
              }))
            }
          });
        }
      }

      // Kiểm tra đã có đơn đăng ký chưa
      const existingRegistration = await DriverRegistration.findByEmail(user.email);
      if (existingRegistration && existingRegistration.trang_thai === 'cho_duyet') {
        return res.status(400).json({ 
          success: false, 
          message: 'Bạn đã có đơn đăng ký đang chờ duyệt' 
        });
      }

      const {
        cccd,
        so_bang_lai, 
        bang_lai, 
        bien_so_xe, 
        loai_xe, 
        mau_xe, 
        hang_xe, 
        so_cho_ngoi,
        ghi_chu
      } = req.body;

      // Validate required fields
      if (!cccd || !so_bang_lai || !bang_lai || !bien_so_xe || !loai_xe || !so_cho_ngoi) {
        return res.status(400).json({ 
          success: false, 
          message: 'Thiếu thông tin bắt buộc' 
        });
      }

      // Validate số chỗ ngồi theo loại bằng lái
      const soChoNgoiNum = parseInt(so_cho_ngoi);
      
      // Xe máy (A1, A2) phải có 2 chỗ
      if ((bang_lai === 'A1' || bang_lai === 'A2') && soChoNgoiNum !== 2) {
        return res.status(400).json({ 
          success: false, 
          message: 'Xe máy (bằng A1/A2) chỉ có 2 chỗ ngồi',
          field: 'so_cho_ngoi'
        });
      }
      
      // Ô tô (B1, B2, C, D, E, FB2, FC) phải có ít nhất 4 chỗ
      if (bang_lai !== 'A1' && bang_lai !== 'A2' && soChoNgoiNum < 4) {
        return res.status(400).json({ 
          success: false, 
          message: 'Loại bằng lái không phù hợp với loại xe. Ô tô phải có tối thiểu 4 chỗ ngồi',
          field: 'so_cho_ngoi'
        });
      }

      // Tạo đơn đăng ký với thông tin từ user và form
      const registrationData = {
        ten: user.ten,
        email: user.email,
        so_dien_thoai: user.so_dien_thoai,
        dia_chi: user.dia_chi || '',
        so_bang_lai: so_bang_lai,
        loai_bang_lai: bang_lai,
        kinh_nghiem_lien_tuc: 0,
        bien_so_xe: bien_so_xe,
        loai_xe: loai_xe,
        mau_xe: mau_xe || null,
        hang_xe: hang_xe || null,
        so_cho_ngoi: so_cho_ngoi || null,
        giay_phep_kinh_doanh: null,
        anh_bang_lai: null,
        anh_cmnd: null,
        anh_xe: null,
        ghi_chu: `CCCD: ${cccd}${ghi_chu ? ' | ' + ghi_chu : ''}`
      };

      const registration = await DriverRegistration.create(registrationData);

      // Gửi email xác nhận đã nhận đơn
      EmailService.sendDriverRegistrationEmail(
        user.email,
        user.ten,
        registration
      ).catch(err => {
        console.error('Driver registration email error:', err);
      });

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài xế đã được gửi thành công. Vui lòng chờ admin duyệt.',
        data: {
          registrationId: registration.id
        }
      });
    } catch (error) {
      console.error('Driver registration submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi gửi đăng ký'
      });
    }
  }

  // Upload avatar
  static async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn file đúng'
        });
      }

      const userId = req.user.id;
      const avatarPath = `/uploads/avatars/${req.file.filename}`;

      // Lấy avatar cũ để xóa
      const user = await User.findById(userId);
      const oldAvatar = user?.avatar;

      // Cập nhật avatar mới vào database
      const updateData = { avatar: avatarPath };
      const updated = await User.update(userId, updateData);

      if (!updated) {
        // Xóa file vừa upload nếu update thất bại
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Không thể cập nhật avatar'
        });
      }

      // Xóa avatar cũ nếu có
      if (oldAvatar && oldAvatar !== '/uploads/avatars/default-avatar.svg') {
        const oldAvatarPath = path.join(__dirname, '../public', oldAvatar);
        if (fs.existsSync(oldAvatarPath)) {
          try {
            fs.unlinkSync(oldAvatarPath);
          } catch (err) {
            console.error('Error deleting old avatar:', err);
          }
        }
      }

      res.json({
        success: true,
        message: 'Cập nhật avatar thành công',
        data: {
          avatar: avatarPath
        }
      });
    } catch (error) {
      // Xóa file đã upload nếu có lỗi
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error deleting uploaded file:', err);
        }
      }

      console.error('Upload avatar error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi upload avatar'
      });
    }
  }

  // Xóa avatar
  static async deleteAvatar(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user || !user.avatar) {
        return res.status(400).json({
          success: false,
          message: 'Không có avatar để xóa'
        });
      }

      // Xóa file avatar
      if (user.avatar !== '/uploads/avatars/default-avatar.svg') {
        const avatarPath = path.join(__dirname, '../public', user.avatar);
        if (fs.existsSync(avatarPath)) {
          try {
            fs.unlinkSync(avatarPath);
          } catch (err) {
            console.error('Error deleting avatar file:', err);
          }
        }
      }

      // Cập nhật database
      await User.update(userId, { avatar: null });

      res.json({
        success: true,
        message: 'Đã xóa avatar'
      });
    } catch (error) {
      console.error('Delete avatar error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa avatar'
      });
    }
  }
}

module.exports = AuthController;
