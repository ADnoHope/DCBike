const { pool } = require('../config/database');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');

/**
 * Service tự động hủy chuyến đi khi không có tài xế nhận
 * Chuyến đi sẽ bị hủy nếu:
 * - Trạng thái: "cho_tai_xe" (chưa có tài xế nhận)
 * - Giờ đón đã quá 1 tiếng so với thời gian hiện tại
 */
class TripAutoCancel {
  /**
   * Kiểm tra và hủy các chuyến đi quá hạn
   */
  static async checkAndCancelExpiredTrips() {
    try {
      console.log('[AUTO-CANCEL] Checking for expired trips...');
      
      // Tính thời gian 1 tiếng trước (nếu giờ đón <= thời gian này mà chưa có tài xế thì hủy)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Lấy các chuyến đi chưa có tài xế nhận và giờ đón đã quá 1 tiếng
      const [expiredTrips] = await pool.execute(`
        SELECT 
          cd.*,
          nd.email as email_khach_hang,
          nd.ten as ten_khach_hang
        FROM chuyen_di cd
        JOIN nguoi_dung nd ON cd.khach_hang_id = nd.id
        WHERE cd.trang_thai = 'cho_tai_xe'
        AND cd.thoi_gian_don <= ?
        AND cd.thoi_gian_don IS NOT NULL
      `, [oneHourAgo]);

      if (expiredTrips.length === 0) {
        console.log('[AUTO-CANCEL] No expired trips found');
        return { cancelled: 0, trips: [] };
      }

      console.log(`[AUTO-CANCEL] Found ${expiredTrips.length} expired trip(s)`);

      const cancelledTrips = [];

      for (const trip of expiredTrips) {
        try {
          // Hủy chuyến đi
          await Trip.updateStatus(trip.id, 'huy_bo', {
            ly_do_huy: 'Tự động hủy do không có tài xế nhận chuyến sau 1 tiếng'
          });

          // Gửi thông báo cho khách hàng
          await Notification.create({
            user_id: trip.khach_hang_id,
            trip_id: trip.id,
            type: 'trip_auto_cancelled',
            title: 'Chuyến đi đã bị hủy tự động',
            message: `Chuyến đi #${trip.id} đã bị hủy tự động do không có tài xế nhận sau 1 tiếng. Vui lòng đặt lại chuyến đi.`,
            data: {
              trip_id: trip.id,
              diem_don: trip.diem_don,
              diem_den: trip.diem_den,
              reason: 'auto_cancel_no_driver'
            }
          });

          // Gửi real-time notification nếu có socket
          if (global.sendNotificationToUser) {
            global.sendNotificationToUser(trip.khach_hang_id, 'trip-auto-cancelled', {
              tripId: trip.id,
              message: `Chuyến đi #${trip.id} đã bị hủy tự động do không có tài xế nhận sau 1 tiếng`,
              trip: {
                id: trip.id,
                diem_don: trip.diem_don,
                diem_den: trip.diem_den
              }
            });
          }

          cancelledTrips.push({
            id: trip.id,
            diem_don: trip.diem_don,
            diem_den: trip.diem_den,
            khach_hang: trip.ten_khach_hang
          });

          console.log(`[AUTO-CANCEL] ✅ Cancelled trip #${trip.id} for customer ${trip.ten_khach_hang}`);
        } catch (error) {
          console.error(`[AUTO-CANCEL] ❌ Error cancelling trip #${trip.id}:`, error.message);
        }
      }

      return {
        cancelled: cancelledTrips.length,
        trips: cancelledTrips
      };
    } catch (error) {
      console.error('[AUTO-CANCEL] Error in checkAndCancelExpiredTrips:', error);
      throw error;
    }
  }

  /**
   * Bắt đầu chạy auto-cancel định kỳ
   * @param {number} intervalMinutes - Số phút giữa mỗi lần kiểm tra (mặc định: 5 phút)
   */
  static startAutoCancel(intervalMinutes = 5) {
    console.log(`[AUTO-CANCEL] Starting auto-cancel service (checking every ${intervalMinutes} minutes)`);
    
    // Chạy ngay lần đầu
    this.checkAndCancelExpiredTrips();
    
    // Chạy định kỳ
    const interval = setInterval(() => {
      this.checkAndCancelExpiredTrips();
    }, intervalMinutes * 60 * 1000);

    return interval;
  }

  /**
   * Dừng auto-cancel service
   */
  static stopAutoCancel(interval) {
    if (interval) {
      clearInterval(interval);
      console.log('[AUTO-CANCEL] Auto-cancel service stopped');
    }
  }
}

module.exports = TripAutoCancel;
