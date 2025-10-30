const DriverRegistration = require('../models/DriverRegistration');
const Promotion = require('../models/Promotion');
const Trip = require('../models/Trip');
const { pool } = require('../config/database');

class AdminController {
  // Dashboard admin
  static async getDashboard(req, res) {
    try {
      // Thống kê đơn đăng ký tài xế
      const driverStats = await DriverRegistration.getStats();

      // Thống kê khuyến mãi
      const [promoStats] = await pool.execute(`
        SELECT 
          trang_thai,
          COUNT(*) as so_luong
        FROM khuyen_mai 
        GROUP BY trang_thai
      `);

      const promoSummary = {
        hoat_dong: 0,
        tam_dung: 0,
        het_han: 0,
        tong: 0
      };

      promoStats.forEach(row => {
        promoSummary[row.trang_thai] = row.so_luong;
        promoSummary.tong += row.so_luong;
      });

      // Tính doanh thu tháng hiện tại (từ ngày 1 đến hiện tại)
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const toMySQLDateTime = (d) => {
        // YYYY-MM-DD HH:MM:SS
        const iso = d.toISOString();
        return iso.slice(0, 19).replace('T', ' ');
      };

      const tripStats = await Trip.getStatistics(toMySQLDateTime(start), toMySQLDateTime(end));
      const monthlyRevenue = tripStats.tong_doanh_thu || 0;

      // Return shape expected by front-end (top-level fields) while keeping
      // detailed data under `data` for backward compatibility.
      res.json({
        success: true,
        pendingRegistrations: driverStats.cho_duyet || 0,
        approvedDrivers: driverStats.da_duyet || 0,
        totalVouchers: promoSummary.tong || 0,
        monthlyRevenue,
        data: {
          driverRegistrations: driverStats,
          promotions: promoSummary,
          tripStats
        }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê dashboard'
      });
    }
  }

  // === QUẢN LÝ ĐĂNG KÝ TÀI XẾ ===

  // Lấy danh sách đơn đăng ký tài xế
  static async getDriverRegistrations(req, res) {
    try {
      const { trang_thai } = req.query;
      const registrations = await DriverRegistration.getAll(trang_thai);

      res.json({
        success: true,
        data: registrations
      });
    } catch (error) {
      console.error('Get driver registrations error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đơn đăng ký'
      });
    }
  }

  // Lấy chi tiết đơn đăng ký
  static async getDriverRegistrationById(req, res) {
    try {
      const { id } = req.params;
      const registration = await DriverRegistration.getById(id);

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn đăng ký'
        });
      }

      res.json({
        success: true,
        data: registration
      });
    } catch (error) {
      console.error('Get driver registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin đơn đăng ký'
      });
    }
  }

  // Duyệt đơn đăng ký tài xế
  static async approveDriverRegistration(req, res) {
    try {
      const { id } = req.params;
      const { password = '123456' } = req.body;
      const approverId = req.user.id;

      const result = await DriverRegistration.approve(id, approverId, password);

      res.json({
        success: true,
        message: 'Đã duyệt thành công đơn đăng ký tài xế',
        data: result
      });
    } catch (error) {
      console.error('Approve driver registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi duyệt đơn đăng ký'
      });
    }
  }

  // Từ chối đơn đăng ký tài xế
  static async rejectDriverRegistration(req, res) {
    try {
      const { id } = req.params;
      const { ly_do_tu_choi } = req.body;
      const approverId = req.user.id;

      console.log('Reject request data:', { id, ly_do_tu_choi, body: req.body }); // Debug log

      if (!ly_do_tu_choi) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập lý do từ chối'
        });
      }

      await DriverRegistration.reject(id, approverId, ly_do_tu_choi);

      res.json({
        success: true,
        message: 'Đã từ chối đơn đăng ký tài xế'
      });
    } catch (error) {
      console.error('Reject driver registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi từ chối đơn đăng ký'
      });
    }
  }

  // === QUẢN LÝ VOUCHER/KHUYẾN MÃI ===

  // Tạo voucher mới
  static async createVoucher(req, res) {
    try {
      const {
        ma_khuyen_mai, ten_khuyen_mai, mo_ta,
        loai_khuyen_mai, gia_tri, gia_tri_toi_da, gia_tri_toi_thieu,
        ngay_bat_dau, ngay_ket_thuc, gioi_han_su_dung
      } = req.body;

      const created_by = req.user.id;

      // Validate required fields
      if (!ma_khuyen_mai || !ten_khuyen_mai || !loai_khuyen_mai || !gia_tri || !ngay_bat_dau || !ngay_ket_thuc) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
        });
      }

      const promotion = await Promotion.create({
        ma_khuyen_mai, ten_khuyen_mai, mo_ta,
        loai_khuyen_mai, gia_tri, gia_tri_toi_da, gia_tri_toi_thieu,
        ngay_bat_dau, ngay_ket_thuc, gioi_han_su_dung, created_by
      });

      res.status(201).json({
        success: true,
        message: 'Tạo voucher thành công',
        data: promotion
      });
    } catch (error) {
      console.error('Create voucher error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Mã voucher đã tồn tại'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo voucher'
      });
    }
  }

  // Cập nhật voucher
  static async updateVoucher(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updated = await Promotion.update(id, updateData);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy voucher'
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật voucher thành công'
      });
    } catch (error) {
      console.error('Update voucher error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật voucher'
      });
    }
  }

  // Xóa voucher
  static async deleteVoucher(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Promotion.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy voucher'
        });
      }

      res.json({
        success: true,
        message: 'Xóa voucher thành công'
      });
    } catch (error) {
      console.error('Delete voucher error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa voucher'
      });
    }
  }

  // Lấy danh sách voucher (cho admin)
  static async getVouchers(req, res) {
    try {
      const { trang_thai } = req.query;
      const vouchers = await Promotion.getAll(trang_thai);

      res.json({
        success: true,
        data: vouchers
      });
    } catch (error) {
      console.error('Get vouchers error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách voucher'
      });
    }
  }

  // Lấy voucher theo ID
  static async getVoucherById(req, res) {
    try {
      const { id } = req.params;
      const voucher = await Promotion.findById(id);

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy voucher'
        });
      }

      res.json({
        success: true,
        data: voucher
      });
    } catch (error) {
      console.error('Get voucher by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin voucher'
      });
    }
  }
}

module.exports = AdminController;