const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Notification = require('../models/Notification');

class TripController {
  // Tạo chuyến đi mới
  static async createTrip(req, res) {
    try {
      const {
        diem_don, diem_den, lat_don, lng_don, lat_den, lng_den,
        khoang_cach, thoi_gian_du_kien, gia_cuoc, phi_dich_vu,
        khuyen_mai_id, so_tien_giam_gia, ghi_chu
      } = req.body;

      const khach_hang_id = req.user.id;

      // Tính tổng tiền
      const tong_tien = (gia_cuoc + (phi_dich_vu || 0)) - (so_tien_giam_gia || 0);

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
        khuyen_mai_id,
        so_tien_giam_gia: so_tien_giam_gia || 0,
        ghi_chu
      };

      const tripId = await Trip.create(tripData);

      // Notify available drivers about new booking (basic broadcast)
      try {
        const availableDrivers = await Driver.findAvailableDrivers();
        if (Array.isArray(availableDrivers) && availableDrivers.length > 0) {
          for (const drv of availableDrivers) {
            try {
              // drv.nguoi_dung_id should exist after our model change
              if (drv.nguoi_dung_id) {
                await Notification.create({
                  user_id: drv.nguoi_dung_id,
                  sender_id: khach_hang_id,
                  trip_id: tripId,
                  type: 'new_booking',
                  message: `Bạn có đơn đặt xe mới (ID: ${tripId}). Vui lòng kiểm tra.`
                });
              }
            } catch (e) {
              // ignore individual notification errors
              console.warn('Notification create failed for driver', drv.id, e.message);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to notify drivers:', e.message);
      }

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
        const isOwner = trip.khach_hang_id === userId;
        const isDriver = trip.tai_xe_id && trip.tai_xe_id === userId;
        
        if (!isOwner && !isDriver) {
          return res.status(403).json({
            success: false,
            message: 'Không có quyền xem chuyến đi này'
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

      // Notify customer that driver accepted
      try {
        const updatedTrip = await Trip.findById(tripId);
        if (updatedTrip && updatedTrip.khach_hang_id) {
          await Notification.create({
            user_id: updatedTrip.khach_hang_id,
            sender_id: driver.nguoi_dung_id || null,
            trip_id: tripId,
            type: 'accepted',
            message: `Tài xế đã nhận chuyến (ID: ${tripId}). Vui lòng chờ tài xế đến.`
          });
        }
      } catch (e) {
        console.warn('Failed to notify customer about accept:', e.message);
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

      // Notify customer that driver started the trip
      try {
        const updatedTrip = await Trip.findById(tripId);
        if (updatedTrip && updatedTrip.khach_hang_id) {
          await Notification.create({
            user_id: updatedTrip.khach_hang_id,
            sender_id: driver.nguoi_dung_id || null,
            trip_id: tripId,
            type: 'started',
            message: `Tài xế đã bắt đầu chuyến (ID: ${tripId}).`
          });
        }
      } catch (e) {
        console.warn('Failed to notify customer about start:', e.message);
      }
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

      // Notify customer that trip is completed
      try {
        const updatedTrip = await Trip.findById(tripId);
        if (updatedTrip && updatedTrip.khach_hang_id) {
          await Notification.create({
            user_id: updatedTrip.khach_hang_id,
            sender_id: driver.nguoi_dung_id || null,
            trip_id: tripId,
            type: 'completed',
            message: `Chuyến (ID: ${tripId}) đã hoàn thành. Cảm ơn bạn đã sử dụng dịch vụ.`
          });
        }
      } catch (e) {
        console.warn('Failed to notify customer about complete:', e.message);
      }
      res.json({
        success: true,
        message: 'Đã hoàn thành chuyến đi'
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
      const isCustomer = trip.khach_hang_id === userId;
      const isDriver = trip.tai_xe_id && trip.tai_xe_id === userId;
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

      // Notify opposite party about cancellation
      try {
        // If the requester is the driver, notify the customer
        if (isDriver && trip.khach_hang_id) {
          const drv = await Driver.findByUserId(userId);
          await Notification.create({
            user_id: trip.khach_hang_id,
            sender_id: drv ? drv.nguoi_dung_id : null,
            trip_id: tripId,
            type: 'canceled_by_driver',
            message: `Tài xế đã hủy chuyến (ID: ${tripId}). Lý do: ${ly_do_huy || 'Không ghi'}`
          });
        }

        // If the requester is the customer, notify the driver (if assigned)
        if (isCustomer && trip.tai_xe_id) {
          // We can lookup driver by id
          const drv = await Driver.findById(trip.tai_xe_id);
          if (drv && drv.nguoi_dung_id) {
            await Notification.create({
              user_id: drv.nguoi_dung_id,
              sender_id: trip.khach_hang_id,
              trip_id: tripId,
              type: 'canceled_by_customer',
              message: `Hành khách đã hủy chuyến (ID: ${tripId}). Lý do: ${ly_do_huy || 'Không ghi'}`
            });
          }
        }
      } catch (e) {
        console.warn('Failed to notify about cancellation:', e.message);
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

  // Tài xế từ chối chuyến đi
  static async declineTrip(req, res) {
    try {
      const tripId = req.params.id;
      const userId = req.user.id;

      // Lấy thông tin tài xế
      const driver = await Driver.findByUserId(userId);
      if (!driver) {
        return res.status(403).json({ success: false, message: 'Bạn không phải là tài xế' });
      }

      // Lấy thông tin chuyến đi
      const trip = await Trip.findById(tripId);
      if (!trip) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi' });
      }

      // Nếu chuyến đã được nhận hoặc hủy thì không thể từ chối
      if (trip.trang_thai !== 'cho_tai_xe') {
        return res.status(400).json({ success: false, message: 'Chuyến không ở trạng thái chờ tài xế' });
      }

      // Do not change trip status here; drivers simply refuse and we notify customer
      try {
        await Notification.create({
          user_id: trip.khach_hang_id,
          sender_id: driver.nguoi_dung_id || null,
          trip_id: tripId,
          type: 'declined',
          message: `Tài xế đã từ chối chuyến (ID: ${tripId}). Hệ thống sẽ tìm tài xế khác.`
        });
      } catch (e) {
        console.warn('Failed to notify customer about decline:', e.message);
      }

      res.json({ success: true, message: 'Đã từ chối chuyến đi' });
    } catch (error) {
      console.error('Decline trip error:', error);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống khi từ chối chuyến' });
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