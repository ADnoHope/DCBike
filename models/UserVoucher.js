const { pool } = require('../config/database');

class UserVoucher {
  constructor(data) {
    this.id = data.id;
    this.nguoi_dung_id = data.nguoi_dung_id;
    this.khuyen_mai_id = data.khuyen_mai_id;
    this.loai_voucher = data.loai_voucher;
    this.da_su_dung = data.da_su_dung;
    this.ngay_su_dung = data.ngay_su_dung;
    this.chuyen_di_su_dung_id = data.chuyen_di_su_dung_id;
    this.ngay_het_han = data.ngay_het_han;
    this.usage_limit = data.usage_limit || 1;
    this.times_used = data.times_used || 0;
    this.created_at = data.created_at;
  }

  // Tạo voucher cho người dùng
  static async create(voucherData) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO user_vouchers (
          nguoi_dung_id, khuyen_mai_id, loai_voucher, ngay_het_han, usage_limit
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        voucherData.nguoi_dung_id,
        voucherData.khuyen_mai_id,
        voucherData.loai_voucher,
        voucherData.ngay_het_han,
        voucherData.usage_limit || 1
      ]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Tạo voucher cho khách hàng mới
  static async createNewUserVoucher(nguoi_dung_id) {
    try {
      // Lấy thông tin voucher khách hàng mới
      const [vouchers] = await pool.execute(
        'SELECT id FROM khuyen_mai WHERE ma_khuyen_mai = ? LIMIT 1',
        ['NEW_USER_2025']
      );

      if (vouchers.length === 0) {
        throw new Error('Không tìm thấy voucher khách hàng mới');
      }

      const khuyen_mai_id = vouchers[0].id;

      // Kiểm tra xem người dùng đã có voucher này chưa
      const [existing] = await pool.execute(
        'SELECT id FROM user_vouchers WHERE nguoi_dung_id = ? AND loai_voucher = ?',
        [nguoi_dung_id, 'new_user']
      );

      if (existing.length > 0) {
        return null; // Đã có voucher rồi
      }

      // Tạo voucher mới, hết hạn sau 30 ngày
      const ngay_het_han = new Date();
      ngay_het_han.setDate(ngay_het_han.getDate() + 30);

      const voucherId = await this.create({
        nguoi_dung_id,
        khuyen_mai_id,
        loai_voucher: 'new_user',
        ngay_het_han
      });

      return voucherId;
    } catch (error) {
      throw error;
    }
  }

  // Tạo voucher thưởng khi hoàn thành 3 chuyến
  static async createReward3TripsVoucher(nguoi_dung_id) {
    try {
      // Lấy thông tin voucher thưởng 3 chuyến
      const [vouchers] = await pool.execute(
        'SELECT id FROM khuyen_mai WHERE ma_khuyen_mai = ? LIMIT 1',
        ['REWARD_3TRIPS_2025']
      );

      if (vouchers.length === 0) {
        throw new Error('Không tìm thấy voucher thưởng 3 chuyến');
      }

      const khuyen_mai_id = vouchers[0].id;

      // Tạo voucher mới, hết hạn sau 60 ngày
      const ngay_het_han = new Date();
      ngay_het_han.setDate(ngay_het_han.getDate() + 60);

      const voucherId = await this.create({
        nguoi_dung_id,
        khuyen_mai_id,
        loai_voucher: 'reward_3trips',
        ngay_het_han
      });

      return voucherId;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách voucher của người dùng
  static async getByUserId(nguoi_dung_id, includeUsed = false) {
    try {
      let query = `
        SELECT 
          uv.id, uv.nguoi_dung_id, uv.khuyen_mai_id, uv.loai_voucher,
          uv.da_su_dung, uv.ngay_su_dung, uv.chuyen_di_su_dung_id,
          uv.ngay_het_han, uv.usage_limit, uv.times_used, uv.created_at,
          km.ma_khuyen_mai, km.ten_khuyen_mai, km.mo_ta,
          km.loai_khuyen_mai, km.gia_tri, km.gia_tri_toi_da, km.gia_tri_toi_thieu
        FROM user_vouchers uv
        LEFT JOIN khuyen_mai km ON uv.khuyen_mai_id = km.id
        WHERE uv.nguoi_dung_id = ?
      `;

      const params = [nguoi_dung_id];

      if (!includeUsed) {
        query += ' AND uv.times_used < uv.usage_limit AND uv.ngay_het_han > NOW()';
      }

      query += ' ORDER BY uv.created_at DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy voucher theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          uv.id, uv.nguoi_dung_id, uv.khuyen_mai_id, uv.loai_voucher,
          uv.da_su_dung, uv.ngay_su_dung, uv.chuyen_di_su_dung_id,
          uv.ngay_het_han, uv.usage_limit, uv.times_used, uv.created_at,
          km.ma_khuyen_mai, km.ten_khuyen_mai, km.mo_ta,
          km.loai_khuyen_mai, km.gia_tri, km.gia_tri_toi_da, km.gia_tri_toi_thieu
        FROM user_vouchers uv
        LEFT JOIN khuyen_mai km ON uv.khuyen_mai_id = km.id
        WHERE uv.id = ?
      `, [id]);

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra voucher có thể sử dụng
  static async canUseVoucher(id, nguoi_dung_id, gia_don_hang) {
    try {
      const voucher = await this.findById(id);

      if (!voucher) {
        return { valid: false, message: 'Voucher không tồn tại' };
      }

      if (voucher.nguoi_dung_id !== nguoi_dung_id) {
        return { valid: false, message: 'Voucher không thuộc về bạn' };
      }

      if (voucher.times_used >= voucher.usage_limit) {
        return { valid: false, message: 'Voucher đã hết lượt sử dụng' };
      }

      const now = new Date();
      if (now > new Date(voucher.ngay_het_han)) {
        return { valid: false, message: 'Voucher đã hết hạn' };
      }

      // Kiểm tra giá trị tối thiểu
      if (voucher.gia_tri_toi_thieu && gia_don_hang < voucher.gia_tri_toi_thieu) {
        return { 
          valid: false, 
          message: `Đơn hàng tối thiểu ${voucher.gia_tri_toi_thieu.toLocaleString()}đ để sử dụng voucher này` 
        };
      }

      // Tính số tiền giảm
      let giam_gia = 0;
      if (voucher.loai_khuyen_mai === 'phan_tram') {
        giam_gia = (gia_don_hang * voucher.gia_tri) / 100;
        if (voucher.gia_tri_toi_da && giam_gia > voucher.gia_tri_toi_da) {
          giam_gia = voucher.gia_tri_toi_da;
        }
      } else {
        giam_gia = voucher.gia_tri;
      }

      return { 
        valid: true, 
        voucher, 
        giam_gia: Math.round(giam_gia),
        message: `Giảm ${giam_gia.toLocaleString()}đ` 
      };
    } catch (error) {
      throw error;
    }
  }

  // Đánh dấu voucher đã sử dụng - tăng times_used lên 1
  static async markAsUsed(id, chuyen_di_id) {
    try {
      // Tăng times_used lên 1
      const [result] = await pool.execute(`
        UPDATE user_vouchers 
        SET times_used = times_used + 1,
            ngay_su_dung = NOW(),
            chuyen_di_su_dung_id = ?,
            da_su_dung = CASE 
              WHEN times_used + 1 >= usage_limit THEN TRUE 
              ELSE da_su_dung 
            END
        WHERE id = ? AND times_used < usage_limit
      `, [chuyen_di_id, id]);

      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra xem người dùng đã hoàn thành 3 chuyến chưa
  static async checkAndCreateRewardVoucher(nguoi_dung_id) {
    try {
      // Đếm số chuyến đi đã hoàn thành
      const [tripCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM chuyen_di WHERE khach_hang_id = ? AND trang_thai = ?',
        [nguoi_dung_id, 'hoan_thanh']
      );

      const completedTrips = tripCount[0].count;

      // Nếu đã hoàn thành đúng 3 chuyến (không phải 4, 5, 6...)
      if (completedTrips === 3) {
        // Kiểm tra xem đã tặng voucher thưởng chưa
        const [existingReward] = await pool.execute(
          'SELECT id FROM user_vouchers WHERE nguoi_dung_id = ? AND loai_voucher = ?',
          [nguoi_dung_id, 'reward_3trips']
        );

        // Nếu chưa có, tạo voucher thưởng
        if (existingReward.length === 0) {
          const voucherId = await this.createReward3TripsVoucher(nguoi_dung_id);
          return { created: true, voucherId };
        }
      }

      return { created: false };
    } catch (error) {
      throw error;
    }
  }

  // Xóa voucher hết hạn (maintenance)
  static async deleteExpiredVouchers() {
    try {
      const [result] = await pool.execute(
        'DELETE FROM user_vouchers WHERE ngay_het_han < NOW() AND times_used < usage_limit'
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserVoucher;
