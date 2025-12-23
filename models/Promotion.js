const { pool } = require('../config/database');

class Promotion {
  constructor(data) {
    this.id = data.id;
    this.ma_khuyen_mai = data.ma_khuyen_mai;
    this.ten_khuyen_mai = data.ten_khuyen_mai;
    this.mo_ta = data.mo_ta;
    this.loai_khuyen_mai = data.loai_khuyen_mai;
    this.gia_tri = data.gia_tri;
    this.gia_tri_toi_da = data.gia_tri_toi_da;
    this.gia_tri_toi_thieu = data.gia_tri_toi_thieu;
    this.ngay_bat_dau = data.ngay_bat_dau;
    this.ngay_ket_thuc = data.ngay_ket_thuc;
    this.so_luong = data.so_luong; // Số lượng còn lại (refactored)
    this.trang_thai = data.trang_thai;
    this.created_at = data.created_at;
  }

  // Tạo khuyến mãi mới
  static async create(promotionData) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO khuyen_mai (
          ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_khuyen_mai, gia_tri,
          gia_tri_toi_da, gia_tri_toi_thieu, ngay_bat_dau, ngay_ket_thuc,
          so_luong, trang_thai, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        promotionData.ma_khuyen_mai,
        promotionData.ten_khuyen_mai,
        promotionData.mo_ta,
        promotionData.loai_khuyen_mai,
        promotionData.gia_tri,
        promotionData.gia_tri_toi_da || null,
        promotionData.gia_tri_toi_thieu || null,
        promotionData.ngay_bat_dau,
        promotionData.ngay_ket_thuc,
        promotionData.so_luong || 999999, // Mặc định "không giới hạn"
        promotionData.trang_thai || 'hoat_dong',
        promotionData.created_by || null
      ]);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * [REFACTORED] Sử dụng voucher - Trừ 1 từ so_luong và tự động cập nhật trạng thái
   * @param {number} id - ID của voucher
   * @param {number} giaDonHang - Giá trị đơn hàng để tính giảm giá
   * @returns {object} { ok: boolean, message: string, promotion?: object, giam_gia?: number }
   */
  static async useIfAvailableById(id, giaDonHang = 0) {
    try {
      // Lấy thông tin voucher với FOR UPDATE để lock row (tránh race condition)
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // Lock row để đảm bảo không bị trừ quá số lượng
        const [rows] = await connection.execute(
          'SELECT * FROM khuyen_mai WHERE id = ? FOR UPDATE',
          [id]
        );

        if (rows.length === 0) {
          await connection.rollback();
          return { ok: false, message: 'Không tìm thấy khuyến mãi' };
        }

        const promo = rows[0];

        // Kiểm tra trạng thái
        if (promo.trang_thai !== 'hoat_dong') {
          await connection.rollback();
          return { ok: false, message: 'Khuyến mãi không hoạt động' };
        }

        // Kiểm tra thời gian
        const now = new Date();
        if (promo.ngay_bat_dau && now < new Date(promo.ngay_bat_dau)) {
          await connection.rollback();
          return { ok: false, message: 'Chưa đến thời gian áp dụng' };
        }
        if (promo.ngay_ket_thuc && now > new Date(promo.ngay_ket_thuc)) {
          await connection.rollback();
          return { ok: false, message: 'Khuyến mãi đã hết hạn' };
        }

        // Kiểm tra số lượng
        if (promo.so_luong <= 0) {
          await connection.rollback();
          return { ok: false, message: 'Voucher đã hết' };
        }

        // Kiểm tra giá trị tối thiểu
        if (promo.gia_tri_toi_thieu && giaDonHang < promo.gia_tri_toi_thieu) {
          await connection.rollback();
          return { 
            ok: false, 
            message: `Đơn hàng tối thiểu ${promo.gia_tri_toi_thieu.toLocaleString()}đ` 
          };
        }

        // Tính giảm giá
        let giam_gia = 0;
        if (promo.loai_khuyen_mai === 'phan_tram') {
          giam_gia = (Number(giaDonHang) * Number(promo.gia_tri)) / 100;
          if (promo.gia_tri_toi_da && giam_gia > Number(promo.gia_tri_toi_da)) {
            giam_gia = Number(promo.gia_tri_toi_da);
          }
        } else {
          giam_gia = Number(promo.gia_tri);
        }

        // Trừ 1 từ so_luong
        const newQuantity = promo.so_luong - 1;
        const newStatus = newQuantity <= 0 ? 'het_luot' : promo.trang_thai;

        const [updateResult] = await connection.execute(
          `UPDATE khuyen_mai 
           SET so_luong = ?, 
               trang_thai = ?
           WHERE id = ? AND so_luong > 0`,
          [newQuantity, newStatus, id]
        );

        if (updateResult.affectedRows === 0) {
          await connection.rollback();
          return { ok: false, message: 'Voucher đã hết hoặc đang được sử dụng' };
        }

        await connection.commit();
        
        console.log(`✅ Voucher ${promo.ma_khuyen_mai}: ${promo.so_luong} -> ${newQuantity} (${newStatus})`);

        return { 
          ok: true, 
          promotion: promo, 
          giam_gia: Math.round(giam_gia),
          newQuantity,
          newStatus
        };

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error('Error in useIfAvailableById:', error);
      throw error;
    }
  }

  // Tìm khuyến mãi theo ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM khuyen_mai WHERE id = ? LIMIT 1',
        [id]
      );
      return rows.length > 0 ? new Promotion(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Tìm khuyến mãi theo mã
  static async findByCode(ma_khuyen_mai) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM khuyen_mai WHERE ma_khuyen_mai = ? AND trang_thai = "hoat_dong"',
        [ma_khuyen_mai]
      );
      return rows.length > 0 ? new Promotion(rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra khuyến mãi có thể sử dụng
  static async validatePromotion(ma_khuyen_mai, gia_don_hang) {
    try {
      const promotion = await this.findByCode(ma_khuyen_mai);
      
      if (!promotion) {
        return { valid: false, message: 'Mã khuyến mãi không tồn tại' };
      }

      const now = new Date();
      const startDate = new Date(promotion.ngay_bat_dau);
      const endDate = new Date(promotion.ngay_ket_thuc);

      // Kiểm tra thời hạn
      if (now < startDate) {
        return { valid: false, message: 'Mã khuyến mãi chưa có hiệu lực' };
      }

      if (now > endDate) {
        return { valid: false, message: 'Mã khuyến mãi đã hết hạn' };
      }

      // Kiểm tra số lượng còn lại
      if (promotion.so_luong <= 0) {
        return { valid: false, message: 'Mã khuyến mãi đã hết' };
      }

      // Kiểm tra giá trị tối thiểu
      if (promotion.gia_tri_toi_thieu && gia_don_hang < promotion.gia_tri_toi_thieu) {
        return { 
          valid: false, 
          message: `Đơn hàng tối thiểu ${promotion.gia_tri_toi_thieu.toLocaleString()}đ để sử dụng mã này` 
        };
      }

      // Tính số tiền giảm
      let giam_gia = 0;
      if (promotion.loai_khuyen_mai === 'phan_tram') {
        giam_gia = (gia_don_hang * promotion.gia_tri) / 100;
        if (promotion.gia_tri_toi_da && giam_gia > promotion.gia_tri_toi_da) {
          giam_gia = promotion.gia_tri_toi_da;
        }
      } else {
        giam_gia = promotion.gia_tri;
      }

      return { 
        valid: true, 
        promotion, 
        giam_gia: Math.round(giam_gia),
        message: `Giảm ${giam_gia.toLocaleString()}đ (Còn ${promotion.so_luong} voucher)` 
      };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái voucher hết hạn
  static async updateExpiredPromotions() {
    try {
      const [result] = await pool.execute(`
        UPDATE khuyen_mai 
        SET trang_thai = 'het_han' 
        WHERE trang_thai = 'hoat_dong' 
        AND ngay_ket_thuc < NOW()
      `);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách khuyến mãi
  static async getAll(page = 1, limit = 10, trang_thai = null) {
    try {
      // Cập nhật trạng thái voucher hết hạn trước khi lấy danh sách
      await this.updateExpiredPromotions();

      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM khuyen_mai WHERE 1=1';
      const params = [];

      if (trang_thai) {
        query += ' AND trang_thai = ?';
        params.push(trang_thai);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);
      const promotions = rows.map(row => new Promotion(row));

      // Đếm tổng số
      let countQuery = 'SELECT COUNT(*) as total FROM khuyen_mai WHERE 1=1';
      const countParams = [];
      
      if (trang_thai) {
        countQuery += ' AND trang_thai = ?';
        countParams.push(trang_thai);
      }

      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;

      return {
        promotions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy khuyến mãi đang hoạt động cho khách hàng
  static async getActivePromotions() {
    try {
      // Cập nhật trạng thái voucher hết hạn trước
      await this.updateExpiredPromotions();

      const [rows] = await pool.execute(`
        SELECT * FROM khuyen_mai 
        WHERE trang_thai = 'hoat_dong' 
        AND ngay_bat_dau <= CURDATE() 
        AND ngay_ket_thuc >= CURDATE()
        AND (gioi_han_su_dung IS NULL OR so_luong_su_dung < gioi_han_su_dung)
        ORDER BY created_at DESC
      `);
      return rows.map(row => new Promotion(row));
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả khuyến mãi (public) - trả về mọi bản ghi để hiển thị trên giao diện
  static async getAllPublic() {
    try {
      // Cập nhật trạng thái voucher hết hạn trước
      await this.updateExpiredPromotions();

      const [rows] = await pool.execute(`
        SELECT * FROM khuyen_mai
        ORDER BY created_at DESC
      `);
      return rows.map(row => new Promotion(row));
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật khuyến mãi
  static async update(id, updateData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      });
      
      values.push(id);
      
      const [result] = await pool.execute(
        `UPDATE khuyen_mai SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa khuyến mãi (soft delete)
  static async delete(id) {
    try {
      // Permanently delete the promotion from database as requested
      const [result] = await pool.execute(
        'DELETE FROM khuyen_mai WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Thống kê khuyến mãi
  static async getStatistics() {
    try {
      // Thống kê theo trạng thái
      const [statusStats] = await pool.execute(`
        SELECT trang_thai, COUNT(*) as so_luong 
        FROM khuyen_mai 
        GROUP BY trang_thai
      `);

      // Top khuyến mãi được sử dụng nhiều nhất
      const [topPromotions] = await pool.execute(`
        SELECT ma_khuyen_mai, ten_khuyen_mai, so_luong_su_dung 
        FROM khuyen_mai 
        WHERE so_luong_su_dung > 0
        ORDER BY so_luong_su_dung DESC 
        LIMIT 10
      `);

      // Tổng số tiền đã giảm (ước tính)
      const [totalDiscount] = await pool.execute(`
        SELECT SUM(so_tien_giam_gia) as tong_giam_gia
        FROM chuyen_di 
        WHERE khuyen_mai_id IS NOT NULL
      `);

      return {
        trang_thai: statusStats,
        top_promotions: topPromotions,
        tong_giam_gia: totalDiscount[0].tong_giam_gia || 0
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Promotion;