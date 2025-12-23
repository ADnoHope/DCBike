const Promotion = require('../models/Promotion');
const UserVoucher = require('../models/UserVoucher');

class PromotionController {
  // Tạo khuyến mãi mới (Admin)
  static async createPromotion(req, res) {
    try {
      const {
        ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_khuyen_mai,
        gia_tri, gia_tri_toi_da, gia_tri_toi_thieu,
        ngay_bat_dau, ngay_ket_thuc, gioi_han_su_dung
      } = req.body;

      // Kiểm tra mã khuyến mãi đã tồn tại
      const existingPromotion = await Promotion.findByCode(ma_khuyen_mai);
      if (existingPromotion) {
        return res.status(400).json({
          success: false,
          message: 'Mã khuyến mãi đã tồn tại'
        });
      }

      const promotionId = await Promotion.create({
        ma_khuyen_mai,
        ten_khuyen_mai,
        mo_ta,
        loai_khuyen_mai,
        gia_tri,
        gia_tri_toi_da,
        gia_tri_toi_thieu,
        ngay_bat_dau,
        ngay_ket_thuc,
        gioi_han_su_dung
      });

      res.status(201).json({
        success: true,
        message: 'Tạo khuyến mãi thành công',
        data: { promotionId }
      });
    } catch (error) {
      console.error('Create promotion error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi tạo khuyến mãi'
      });
    }
  }

  // Kiểm tra mã khuyến mãi (bao gồm cả voucher cá nhân)
  static async validatePromotion(req, res) {
    try {
      const { ma_khuyen_mai, gia_don_hang } = req.body;

      if (!ma_khuyen_mai || !gia_don_hang) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin mã khuyến mãi hoặc giá đơn hàng'
        });
      }

      // Nếu có user đăng nhập, kiểm tra voucher cá nhân trước
      if (req.user && req.user.id) {
        try {
          // Tìm voucher cá nhân của user có mã này
          const userVouchers = await UserVoucher.getByUserId(req.user.id, false);
          const userVoucher = userVouchers.find(v => v.ma_khuyen_mai === ma_khuyen_mai);
          
          if (userVoucher) {
            // Kiểm tra voucher cá nhân
            const voucherResult = await UserVoucher.canUseVoucher(userVoucher.id, req.user.id, gia_don_hang);
            
            if (voucherResult.valid) {
              return res.json({
                success: true,
                message: 'Voucher cá nhân hợp lệ',
                data: {
                  promotion: voucherResult.voucher,
                  giam_gia: voucherResult.giam_gia,
                  isUserVoucher: true,
                  userVoucherId: userVoucher.id
                }
              });
            } else {
              return res.json({
                success: false,
                message: voucherResult.message || 'Voucher không hợp lệ',
                data: null
              });
            }
          }
        } catch (e) {
          console.debug('Error checking user voucher:', e);
          // Tiếp tục kiểm tra voucher công khai nếu không tìm thấy voucher cá nhân
        }
      }

      // Kiểm tra voucher công khai
      const result = await Promotion.validatePromotion(ma_khuyen_mai, gia_don_hang);

      res.json({
        success: result.valid,
        message: result.message,
        data: result.valid ? {
          promotion: result.promotion,
          giam_gia: result.giam_gia,
          isUserVoucher: false
        } : null
      });
    } catch (error) {
      console.error('Validate promotion error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi kiểm tra khuyến mãi'
      });
    }
  }

  // Lấy danh sách khuyến mãi đang hoạt động
  static async getActivePromotions(req, res) {
    try {
      const promotions = await Promotion.getActivePromotions();

      res.json({
        success: true,
        data: promotions
      });
    } catch (error) {
      console.error('Get active promotions error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách khuyến mãi'
      });
    }
  }

  // Lấy tất cả khuyến mãi công khai (không yêu cầu auth)
  static async getPublicPromotions(req, res) {
    try {
      const promotions = await Promotion.getAllPublic();

      res.json({
        success: true,
        data: promotions
      });
    } catch (error) {
      console.error('Get public promotions error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách khuyến mãi'
      });
    }
  }

  // Lấy danh sách tất cả khuyến mãi (Admin)
  static async getAllPromotions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const trang_thai = req.query.trang_thai;

      const result = await Promotion.getAll(page, limit, trang_thai);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get all promotions error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách khuyến mãi'
      });
    }
  }

  // Cập nhật khuyến mãi (Admin)
  static async updatePromotion(req, res) {
    try {
      const promotionId = req.params.id;
      const updateData = req.body;

      // Loại bỏ các field không được phép cập nhật
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.so_luong_su_dung;

      const updated = await Promotion.update(promotionId, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khuyến mãi'
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật khuyến mãi thành công'
      });
    } catch (error) {
      console.error('Update promotion error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi cập nhật khuyến mãi'
      });
    }
  }

  // Xóa khuyến mãi (Admin)
  static async deletePromotion(req, res) {
    try {
      const promotionId = req.params.id;

      const deleted = await Promotion.delete(promotionId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khuyến mãi'
        });
      }

      res.json({
        success: true,
        message: 'Xóa khuyến mãi thành công'
      });
    } catch (error) {
      console.error('Delete promotion error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi xóa khuyến mãi'
      });
    }
  }

  // Thống kê khuyến mãi (Admin)
  static async getPromotionStatistics(req, res) {
    try {
      const statistics = await Promotion.getStatistics();

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get promotion statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy thống kê khuyến mãi'
      });
    }
  }

  // Lấy danh sách voucher cá nhân của người dùng
  static async getUserVouchers(req, res) {
    try {
      const userId = req.user.id;
      const includeUsed = req.query.includeUsed === 'true';

      const vouchers = await UserVoucher.getByUserId(userId, includeUsed);

      res.json({
        success: true,
        data: vouchers
      });
    } catch (error) {
      console.error('Get user vouchers error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách voucher'
      });
    }
  }

  // Kiểm tra voucher cá nhân có thể sử dụng
  static async validateUserVoucher(req, res) {
    try {
      const userId = req.user.id;
      const { voucher_id, gia_don_hang } = req.body;

      if (!voucher_id || !gia_don_hang) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin voucher hoặc giá đơn hàng'
        });
      }

      const result = await UserVoucher.canUseVoucher(voucher_id, userId, gia_don_hang);

      res.json({
        success: result.valid,
        message: result.message,
        data: result.valid ? {
          voucher: result.voucher,
          giam_gia: result.giam_gia
        } : null
      });
    } catch (error) {
      console.error('Validate user voucher error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi kiểm tra voucher'
      });
    }
  }
}

module.exports = PromotionController;