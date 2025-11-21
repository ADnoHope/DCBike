const { pool } = require('../config/database');

class DriverDebt {
  // Tạo khoản nợ mới cho tài xế
  static async create(debtData) {
    try {
      const {
        tai_xe_id,
        chuyen_di_id,
        so_tien_no,
        han_thanh_toan,
        ghi_chu
      } = debtData;

      const [result] = await pool.execute(
        `INSERT INTO no_tai_xe 
        (tai_xe_id, chuyen_di_id, so_tien_no, han_thanh_toan, ghi_chu) 
        VALUES (?, ?, ?, ?, ?)`,
        [tai_xe_id, chuyen_di_id, so_tien_no, han_thanh_toan, ghi_chu || null]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tổng nợ chưa trả của tài xế
  static async getTotalUnpaidDebt(tai_xe_id) {
    try {
      const [rows] = await pool.execute(
        `SELECT SUM(so_tien_no - so_tien_da_tra) as tong_no
        FROM no_tai_xe 
        WHERE tai_xe_id = ? AND trang_thai != 'da_tra'`,
        [tai_xe_id]
      );

      return rows[0]?.tong_no || 0;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách nợ của tài xế
  static async getDriverDebts(tai_xe_id, status = null) {
    try {
      let query = `
        SELECT 
          ntx.*,
          cd.diem_don,
          cd.diem_den,
          cd.tong_tien,
          cd.thoi_gian_ket_thuc
        FROM no_tai_xe ntx
        INNER JOIN chuyen_di cd ON ntx.chuyen_di_id = cd.id
        WHERE ntx.tai_xe_id = ?
      `;

      const params = [tai_xe_id];

      if (status) {
        query += ' AND ntx.trang_thai = ?';
        params.push(status);
      }

      query += ' ORDER BY ntx.ngay_phat_sinh DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Thanh toán một phần nợ
  static async payDebt(id, so_tien_tra) {
    try {
      await pool.execute(
        `UPDATE no_tai_xe 
        SET 
          so_tien_da_tra = so_tien_da_tra + ?,
          trang_thai = CASE 
            WHEN (so_tien_da_tra + ?) >= so_tien_no THEN 'da_tra'
            ELSE 'dang_tra'
          END,
          ngay_thanh_toan = CASE 
            WHEN (so_tien_da_tra + ?) >= so_tien_no THEN NOW()
            ELSE ngay_thanh_toan
          END
        WHERE id = ?`,
        [so_tien_tra, so_tien_tra, so_tien_tra, id]
      );

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra xem tài xế có nợ quá hạn không
  static async hasOverdueDebt(tai_xe_id) {
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as count 
        FROM no_tai_xe 
        WHERE tai_xe_id = ? 
        AND trang_thai != 'da_tra' 
        AND han_thanh_toan < NOW()`,
        [tai_xe_id]
      );

      return rows[0].count > 0;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái chặn tài xế nếu có nợ quá hạn
  static async updateDriverBlockStatus(tai_xe_id) {
    try {
      const hasOverdue = await this.hasOverdueDebt(tai_xe_id);

      await pool.execute(
        'UPDATE tai_xe SET bi_chan_vi_no = ? WHERE id = ?',
        [hasOverdue, tai_xe_id]
      );

      return hasOverdue;
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê nợ của tài xế
  static async getDebtStatistics(tai_xe_id) {
    try {
      const [rows] = await pool.execute(
        `SELECT 
          SUM(so_tien_no) as tong_no,
          SUM(so_tien_da_tra) as tong_da_tra,
          SUM(so_tien_no - so_tien_da_tra) as con_no,
          COUNT(*) as so_khoan_no,
          SUM(CASE WHEN trang_thai = 'chua_tra' THEN 1 ELSE 0 END) as chua_tra,
          SUM(CASE WHEN trang_thai = 'dang_tra' THEN 1 ELSE 0 END) as dang_tra,
          SUM(CASE WHEN trang_thai = 'da_tra' THEN 1 ELSE 0 END) as da_tra,
          SUM(CASE WHEN han_thanh_toan < NOW() AND trang_thai != 'da_tra' THEN 1 ELSE 0 END) as qua_han
        FROM no_tai_xe 
        WHERE tai_xe_id = ?`,
        [tai_xe_id]
      );

      return rows[0] || {};
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả khoản nợ (cho admin)
  static async getAllDebts(status = null) {
    try {
      let query = `
        SELECT 
          ntx.*,
          nd.ten as ten_tai_xe,
          nd.so_dien_thoai,
          cd.diem_don,
          cd.diem_den,
          cd.tong_tien,
          cd.thoi_gian_ket_thuc
        FROM no_tai_xe ntx
        INNER JOIN tai_xe tx ON ntx.tai_xe_id = tx.id
        INNER JOIN nguoi_dung nd ON tx.nguoi_dung_id = nd.id
        INNER JOIN chuyen_di cd ON ntx.chuyen_di_id = cd.id
      `;

      const params = [];

      if (status) {
        query += ' WHERE ntx.trang_thai = ?';
        params.push(status);
      }

      query += ' ORDER BY ntx.ngay_phat_sinh DESC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DriverDebt;
