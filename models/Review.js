const { pool } = require('../config/database');

class Review {
  // Tạo đánh giá cho chuyến đi (khách hàng đánh giá tài xế)
  static async create({ chuyen_di_id, nguoi_danh_gia_id, diem_so, binh_luan }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Kiểm tra xem đã đánh giá chưa
      const [existing] = await connection.execute(`
        SELECT id FROM danh_gia 
        WHERE chuyen_di_id = ? AND nguoi_danh_gia_id = ? AND loai_danh_gia = 'danh_gia_tai_xe'
      `, [chuyen_di_id, nguoi_danh_gia_id]);

      if (existing.length > 0) {
        throw { clientMessage: 'Bạn đã đánh giá chuyến đi này rồi' };
      }

      // 2. Lấy thông tin chuyến đi để biết tai_xe_id
      const [trip] = await connection.execute(`
        SELECT tai_xe_id FROM chuyen_di WHERE id = ?
      `, [chuyen_di_id]);

      if (!trip || trip.length === 0 || !trip[0].tai_xe_id) {
        throw { clientMessage: 'Không tìm thấy chuyến đi hoặc chưa có tài xế' };
      }

      const tai_xe_id = trip[0].tai_xe_id;

      // 3. Insert đánh giá với loai_danh_gia = 'danh_gia_tai_xe'
      const [result] = await connection.execute(`
        INSERT INTO danh_gia (chuyen_di_id, nguoi_danh_gia_id, diem_so, binh_luan, loai_danh_gia)
        VALUES (?, ?, ?, ?, 'danh_gia_tai_xe')
      `, [chuyen_di_id, nguoi_danh_gia_id, diem_so, binh_luan]);

      // 4. Cập nhật điểm đánh giá trung bình của tài xế
      const [currentRating] = await connection.execute(`
        SELECT diem_danh_gia, so_luot_danh_gia FROM tai_xe WHERE id = ?
      `, [tai_xe_id]);

      if (currentRating.length > 0) {
        const current = currentRating[0];
        const totalScore = (current.diem_danh_gia * current.so_luot_danh_gia) + diem_so;
        const newCount = current.so_luot_danh_gia + 1;
        const newAverage = totalScore / newCount;

        await connection.execute(`
          UPDATE tai_xe
          SET diem_danh_gia = ?, so_luot_danh_gia = ?
          WHERE id = ?
        `, [newAverage, newCount, tai_xe_id]);
      }

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Lấy danh sách đánh giá cho tài xế
  static async getByDriverId(driverId) {
    const [rows] = await pool.execute(`
      SELECT dg.id, dg.diem_so, dg.binh_luan, dg.created_at,
             nd.id AS nguoi_danh_gia_id,
             nd.ten AS ten_nguoi_danh_gia,
             nd.avatar AS nguoi_danh_gia_avatar
      FROM danh_gia dg
      JOIN chuyen_di cd ON dg.chuyen_di_id = cd.id
      JOIN nguoi_dung nd ON dg.nguoi_danh_gia_id = nd.id
      WHERE cd.tai_xe_id = ? AND dg.loai_danh_gia = 'danh_gia_tai_xe'
      ORDER BY dg.created_at DESC
    `, [driverId]);
    return rows;
  }
}

module.exports = Review;
