const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Promotion = require('../models/Promotion');
const Revenue = require('../models/Revenue');
const DriverDebt = require('../models/DriverDebt');

class TripController {
  // Tạo chuyến đi mới
  static async createTrip(req, res) {
    try {
      const {
        diem_don, diem_den, lat_don, lng_don, lat_den, lng_den,
        khoang_cach, thoi_gian_du_kien, gia_cuoc, phi_dich_vu,
        khuyen_mai_id, ma_khuyen_mai, so_tien_giam_gia, ghi_chu,
        phuong_thuc_thanh_toan
      } = req.body;

      const khach_hang_id = req.user.id;

      // Nếu có khuyến mãi, xác nhận và tăng lượt sử dụng ngay tại server để đảm bảo đồng bộ
      let appliedPromotionId = null;
      let appliedDiscount = 0;
      let promoIdToUse = khuyen_mai_id;
      // Allow using promotion by code from client
      if (!promoIdToUse && ma_khuyen_mai) {
        try {
          const promo = await Promotion.findByCode(ma_khuyen_mai);
          if (promo) promoIdToUse = promo.id;
        } catch (e) {
          console.warn('findByCode failed', e?.message);
        }
      }

      if (promoIdToUse) {
        try {
          const baseAmount = Number(gia_cuoc) + Number(phi_dich_vu || 0);
          const result = await Promotion.useIfAvailableById(promoIdToUse, baseAmount);
          if (result && result.ok) {
            appliedPromotionId = promoIdToUse;
            appliedDiscount = result.giam_gia || 0;
          } else {
            // Không thể dùng khuyến mãi (hết lượt/hết hạn). Vẫn tiếp tục tạo chuyến nhưng bỏ voucher.
            appliedPromotionId = null;
            appliedDiscount = 0;
          }
        } catch (e) {
          console.error('Apply promotion error:', e);
          appliedPromotionId = null;
          appliedDiscount = 0;
        }
      }

      // Tính tổng tiền
      const tong_tien = (Number(gia_cuoc) + Number(phi_dich_vu || 0)) - (appliedDiscount || Number(so_tien_giam_gia || 0));

      const tripData = {
        khach_hang_id,
        diem_don,
        diem_den,
        lat_don,
        lng_don,
        lat_den,
        lng_den,
        khoang_cach,
        thoi_gian_du_kien,
        gia_cuoc,
        phi_dich_vu: phi_dich_vu || 0,
        tong_tien,
        khuyen_mai_id: appliedPromotionId,
        so_tien_giam_gia: appliedDiscount || so_tien_giam_gia || 0,
        phuong_thuc_thanh_toan: phuong_thuc_thanh_toan || 'tien_mat',
        ghi_chu
      };

      const tripId = await Trip.create(tripData);

      // Tạo thông báo cho các tài xế đang sẵn sàng
      (async () => {
        try {
          let availableDrivers = [];
          if (tripData.lat_don && tripData.lng_don) {
            // Tìm các tài xế gần nhất
            availableDrivers = await Driver.findNearestDrivers(tripData.lat_don, tripData.lng_don, 10, 10);
          }

          if (!availableDrivers || availableDrivers.length === 0) {
            // Fallback: list of available drivers
            availableDrivers = await Driver.findAvailableDrivers();
          }

          const DriverNotification = require('../models/DriverNotification');

          const msg = `Chuyến mới: ${diem_don} → ${diem_den}. Giá ${gia_cuoc} VND`;

          for (const drv of availableDrivers.slice(0, 20)) {
            try {
              await DriverNotification.create({ driver_id: drv.id, trip_id: tripId, message: msg });
            } catch (e) {
              console.debug('Notification create failed for driver', drv.id, e.message);
            }
          }
        } catch (e) {
          console.error('Error creating driver notifications:', e);
        }
      })();

      res.status(201).json({
        success: true,
        message: 'Tạo chuyến đi thành công',
        data: {
          tripId,
          ...tripData
        }
      });
    } catch (error) {
      console.error('Create trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi tạo chuyến đi'
      });
    }
  }

  // Lấy danh sách chuyến đi của người dùng
  static async getUserTrips(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.loai_tai_khoan === 'tai_xe' ? 'tai_xe' : 'khach_hang';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await Trip.getByUserId(userId, userType, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get user trips error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách chuyến đi'
      });
    }
  }

  // Lấy chi tiết chuyến đi
  static async getTripDetail(req, res) {
    try {
      const tripId = req.params.id;
      const trip = await Trip.findById(tripId);

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyến đi'
        });
      }

      // Kiểm tra quyền xem (chỉ khách hàng, tài xế của chuyến đi hoặc admin)
      const userId = req.user.id;
      const userType = req.user.loai_tai_khoan;

      if (userType !== 'admin') {
        // use numeric-safe comparisons because DB drivers/ids may come back as strings
        const isOwner = Number(trip.khach_hang_id) === Number(userId);
        let isDriver = false;

        // If the current user is a driver, resolve driver's internal id and compare
        if (userType === 'tai_xe') {
          const driver = await Driver.findByUserId(userId);
          if (driver && trip.tai_xe_id) {
            // primary check: compare trip.tai_xe_id with driver's internal id
            isDriver = Number(trip.tai_xe_id) === Number(driver.id);
          }
          // fallback: in some setups tai_xe_id may accidentally store the user's id
          if (!isDriver && trip.tai_xe_id) {
            isDriver = Number(trip.tai_xe_id) === Number(userId);
          }
        }

        if (!isOwner && !isDriver) {
          return res.status(403).json({
            success: false,
            message: 'Chỉ khi tài xế đã nhận chuyến đi mới có quyền xem chi tiết'
          });
        }
      }

      res.json({
        success: true,
        data: trip
      });
    } catch (error) {
      console.error('Get trip detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy chi tiết chuyến đi'
      });
    }
  }

  // Tài xế nhận chuyến đi
  static async acceptTrip(req, res) {
    try {
      const tripId = req.params.id;
      const userId = req.user.id;

      // Lấy thông tin tài xế
      const driver = await Driver.findByUserId(userId);
      if (!driver) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải là tài xế'
        });
      }

      // Kiểm tra nợ quá hạn
      if (driver.bi_chan_vi_no) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản của bạn đã bị khóa do có nợ quá hạn. Vui lòng thanh toán để tiếp tục nhận chuyến.'
        });
      }

      // Kiểm tra trạng thái tài xế
      if (driver.trang_thai_tai_xe !== 'san_sang') {
        return res.status(400).json({
          success: false,
          message: 'Tài xế hiện không sẵn sàng nhận chuyến'
        });
      }

      // Lấy thông tin chuyến đi
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyến đi'
        });
      }

      if (trip.trang_thai !== 'cho_tai_xe') {
        return res.status(400).json({
          success: false,
          message: 'Chuyến đi này đã được nhận hoặc đã hủy'
        });
      }

      // Cập nhật chuyến đi và trạng thái tài xế
      await Trip.updateStatus(tripId, 'da_nhan', { tai_xe_id: driver.id });
      await Driver.updateStatus(driver.id, 'dang_di');

      // Tự động tạo cuộc trò chuyện và gửi tin nhắn thông báo
      try {
        const Conversation = require('../models/Conversation');
        const Message = require('../models/Message');
        const { pool } = require('../config/database');
        
        // Lấy thông tin tài xế để có tên
        const [driverInfo] = await pool.execute(
          'SELECT nd.ten FROM nguoi_dung nd JOIN tai_xe tx ON nd.id = tx.nguoi_dung_id WHERE tx.id = ?',
          [driver.id]
        );
        const driverName = driverInfo.length ? driverInfo[0].ten : 'Tài xế';
        
        // Tạo hoặc lấy cuộc trò chuyện
        const convo = await Conversation.createForTrip({
          chuyen_di_id: tripId,
          khach_hang_id: trip.khach_hang_id,
          tai_xe_id: driver.id
        });
        
        // Gửi tin nhắn thông báo tự động
        const notificationMessage = `Xin chào! Tài xế ${driverName} đã nhận chuyến đi của bạn. Tôi sẽ đến đón bạn sớm nhất có thể.`;
        
        await Message.send({
          cuoc_tro_chuyen_id: convo.id,
          nguoi_gui_id: req.user.id, // Driver's user ID
          noi_dung: notificationMessage
        });
        
        console.log('Auto message sent to customer after accepting trip');
      } catch (chatError) {
        console.error('Auto chat message error:', chatError);
        // Không fail request nếu gửi tin nhắn lỗi
      }

      res.json({
        success: true,
        message: 'Đã nhận chuyến đi thành công'
      });
    } catch (error) {
      console.error('Accept trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi nhận chuyến đi'
      });
    }
  }

  // Bắt đầu chuyến đi
  static async startTrip(req, res) {
    try {
      const tripId = req.params.id;
      const userId = req.user.id;

      // Lấy thông tin tài xế
      const driver = await Driver.findByUserId(userId);
      if (!driver) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải là tài xế'
        });
      }

      // Lấy thông tin chuyến đi
      const trip = await Trip.findById(tripId);
      if (!trip || trip.tai_xe_id !== driver.id) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyến đi hoặc bạn không phải tài xế của chuyến này'
        });
      }

      if (trip.trang_thai !== 'da_nhan') {
        return res.status(400).json({
          success: false,
          message: 'Không thể bắt đầu chuyến đi ở trạng thái hiện tại'
        });
      }

      await Trip.updateStatus(tripId, 'dang_di');

      res.json({
        success: true,
        message: 'Đã bắt đầu chuyến đi'
      });
    } catch (error) {
      console.error('Start trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi bắt đầu chuyến đi'
      });
    }
  }

  // Hoàn thành chuyến đi
  static async completeTrip(req, res) {
    try {
      const tripId = req.params.id;
      const userId = req.user.id;

      // Lấy thông tin tài xế
      const driver = await Driver.findByUserId(userId);
      if (!driver) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải là tài xế'
        });
      }

      // Lấy thông tin chuyến đi
      const trip = await Trip.findById(tripId);
      if (!trip || trip.tai_xe_id !== driver.id) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyến đi hoặc bạn không phải tài xế của chuyến này'
        });
      }

      if (trip.trang_thai !== 'dang_di') {
        return res.status(400).json({
          success: false,
          message: 'Không thể hoàn thành chuyến đi ở trạng thái hiện tại'
        });
      }

      await Trip.updateStatus(tripId, 'hoan_thanh');
      await Driver.updateStatus(driver.id, 'san_sang');

      // Xử lý thanh toán dựa trên phương thức
      let qrData = null;
      if (trip.phuong_thuc_thanh_toan === 'tien_mat') {
        // Tiền mặt: Tạo khoản nợ 20% cho tài xế
        try {
          const { pool } = require('../config/database');
          const [settings] = await pool.execute(
            'SELECT gia_tri FROM cai_dat_he_thong WHERE ten_cai_dat = ?',
            ['driver_commission_rate']
          );
          const commissionRate = settings[0]?.gia_tri || 20;
          
          const [deadlineSettings] = await pool.execute(
            'SELECT gia_tri FROM cai_dat_he_thong WHERE ten_cai_dat = ?',
            ['debt_payment_deadline_hours']
          );
          const deadlineHours = deadlineSettings[0]?.gia_tri || 24;

          const debtAmount = (trip.tong_tien * commissionRate) / 100;
          const deadline = new Date();
          deadline.setHours(deadline.getHours() + parseInt(deadlineHours));

          await DriverDebt.create({
            tai_xe_id: driver.id,
            chuyen_di_id: tripId,
            so_tien_no: debtAmount,
            han_thanh_toan: deadline,
            ghi_chu: `Hoa hồng ${commissionRate}% từ chuyến đi #${tripId}`
          });

          // Cập nhật trạng thái chặn nếu có nợ quá hạn
          await DriverDebt.updateDriverBlockStatus(driver.id);

        } catch (debtError) {
          console.error('Create debt error:', debtError);
        }
      } else if (trip.phuong_thuc_thanh_toan === 'chuyen_khoan') {
        // Chuyển khoản: Tạo dữ liệu QR code
        try {
          const { pool } = require('../config/database');
          const [bankSettings] = await pool.execute(
            'SELECT ten_cai_dat, gia_tri FROM cai_dat_he_thong WHERE ten_cai_dat IN (?, ?, ?)',
            ['qr_bank_name', 'qr_bank_account', 'qr_account_holder']
          );

          const settings = {};
          bankSettings.forEach(s => {
            settings[s.ten_cai_dat] = s.gia_tri;
          });

          qrData = {
            bank: settings.qr_bank_name || 'Ngân hàng quốc tế VIB',
            accountNumber: settings.qr_bank_account || '228155456',
            accountHolder: settings.qr_account_holder || 'LE MANH CUONG',
            amount: trip.tong_tien,
            description: `DCBike Trip ${tripId}`
          };
        } catch (qrError) {
          console.error('Generate QR data error:', qrError);
        }
      }

      // Xóa TẤT CẢ tin nhắn và cuộc trò chuyện giữa khách hàng và tài xế
      try {
        const { pool } = require('../config/database');
        console.log('Attempting to delete all conversations and messages between:', { 
          khach_hang_id: trip.khach_hang_id, 
          tai_xe_id: driver.id 
        });
        
        // Bước 1: Lấy danh sách ID của tất cả conversation giữa customer và driver
        const [conversations] = await pool.execute(
          'SELECT id FROM cuoc_tro_chuyen WHERE khach_hang_id = ? AND tai_xe_id = ?',
          [trip.khach_hang_id, driver.id]
        );
        
        console.log('Found conversations to delete:', conversations.length);
        
        if (conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id);
          
          // Bước 2: Xóa tất cả tin nhắn trong các conversation này
          const placeholders = conversationIds.map(() => '?').join(',');
          const [messageResult] = await pool.execute(
            `DELETE FROM tin_nhan WHERE cuoc_tro_chuyen_id IN (${placeholders})`,
            conversationIds
          );
          console.log('Deleted messages:', messageResult.affectedRows);
          
          // Bước 3: Xóa tất cả conversation
          const [conversationResult] = await pool.execute(
            `DELETE FROM cuoc_tro_chuyen WHERE id IN (${placeholders})`,
            conversationIds
          );
          console.log('Deleted conversations:', conversationResult.affectedRows);
        } else {
          console.warn('No conversations found to delete');
        }
      } catch (chatDeleteError) {
        console.error('Delete conversation error:', chatDeleteError);
        // Không fail request nếu xóa chat lỗi
      }

      // Tạo bản ghi doanh thu - chiết khấu 20% cho web, 80% cho tài xế
      try {
        await Revenue.createFromTrip(tripId, driver.id, trip.tong_tien);
      } catch (revenueError) {
        console.error('Create revenue record error:', revenueError);
        // Không fail toàn bộ request nếu tạo bản ghi doanh thu lỗi
      }

      res.json({
        success: true,
        message: 'Đã hoàn thành chuyến đi',
        qrData: qrData
      });
    } catch (error) {
      console.error('Complete trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi hoàn thành chuyến đi'
      });
    }
  }

  // Hủy chuyến đi
  static async cancelTrip(req, res) {
    try {
      const tripId = req.params.id;
      const { ly_do_huy } = req.body;
      const userId = req.user.id;

      // Lấy thông tin chuyến đi
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyến đi'
        });
      }

      // Kiểm tra quyền hủy
      const isCustomer = Number(trip.khach_hang_id) === Number(userId);
      let isDriver = false;
      // If current user is a driver, resolve driver's internal id and compare
      if (req.user.loai_tai_khoan === 'tai_xe') {
        const driver = await Driver.findByUserId(userId);
        if (driver && trip.tai_xe_id) {
          isDriver = Number(trip.tai_xe_id) === Number(driver.id);
        }
      }
      const isAdmin = req.user.loai_tai_khoan === 'admin';

      if (!isCustomer && !isDriver && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền hủy chuyến đi này'
        });
      }

      // Kiểm tra trạng thái có thể hủy
      if (!['cho_tai_xe', 'da_nhan'].includes(trip.trang_thai)) {
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy chuyến đi ở trạng thái hiện tại'
        });
      }

      await Trip.updateStatus(tripId, 'huy_bo', { ly_do_huy });

      // Nếu có tài xế đã nhận, cập nhật trạng thái tài xế về sẵn sàng
      if (trip.tai_xe_id) {
        await Driver.updateStatus(trip.tai_xe_id, 'san_sang');
      }

      res.json({
        success: true,
        message: 'Đã hủy chuyến đi'
      });
    } catch (error) {
      console.error('Cancel trip error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi hủy chuyến đi'
      });
    }
  }

  // Lấy danh sách chuyến đi có sẵn cho tài xế
  static async getAvailableTrips(req, res) {
    try {
      const userId = req.user.id;
      const { lat, lng, radius = 10 } = req.query;

      // Kiểm tra quyền tài xế
      const driver = await Driver.findByUserId(userId);
      if (!driver) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải là tài xế'
        });
      }

      const trips = await Trip.getAvailableTrips(
        lat ? parseFloat(lat) : null,
        lng ? parseFloat(lng) : null,
        radius ? parseInt(radius) : 10
      );

      res.json({
        success: true,
        data: trips
      });
    } catch (error) {
      console.error('Get available trips error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách chuyến đi'
      });
    }
  }

  // Thống kê chuyến đi (Admin)
  static async getTripStatistics(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const statistics = await Trip.getStatistics(start_date, end_date);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get trip statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy thống kê'
      });
    }
  }
}

module.exports = TripController;