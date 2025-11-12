const Review = require('../models/Review');
const Trip = require('../models/Trip');

class ReviewController {
  // Khách hàng đánh giá tài xế cho chuyến đi đã hoàn thành
  static async createReview(req, res) {
    try {
      const user = req.user;
      if (!user || user.loai_tai_khoan !== 'khach_hang') {
        return res.status(403).json({ success: false, message: 'Chỉ khách hàng mới được đánh giá' });
      }

      const { chuyen_di_id, diem_so, nhan_xet, binh_luan } = req.body || {};
      const score = parseInt(diem_so, 10);
      const comment = nhan_xet || binh_luan || null;

      if (!chuyen_di_id || isNaN(score) || score < 1 || score > 5) {
        return res.status(400).json({ success: false, message: 'Dữ liệu đánh giá không hợp lệ' });
      }

      // Xác minh chuyến đi thuộc về khách hàng và đã hoàn thành
      const trip = await Trip.findById(chuyen_di_id);
      if (!trip) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi' });
      }
      if (Number(trip.khach_hang_id) !== Number(user.id)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền đánh giá chuyến đi này' });
      }
      if (trip.trang_thai !== 'hoan_thanh') {
        return res.status(400).json({ success: false, message: 'Chỉ có thể đánh giá chuyến đi đã hoàn thành' });
      }

      // Lưu đánh giá
      const reviewId = await Review.create({
        chuyen_di_id,
        nguoi_danh_gia_id: user.id,
        diem_so: score,
        binh_luan: comment
      });

      res.status(201).json({ success: true, message: 'Gửi đánh giá thành công', data: { reviewId } });
    } catch (err) {
      console.error('createReview error:', err);
      if (err && err.clientMessage) {
        return res.status(400).json({ success: false, message: err.clientMessage });
      }
      res.status(500).json({ success: false, message: 'Lỗi khi gửi đánh giá' });
    }
  }
}

module.exports = ReviewController;
