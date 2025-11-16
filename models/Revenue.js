const { pool } = require('../config/database');

class Revenue {
  // Tạo bản ghi doanh thu khi hoàn thành chuyến
  static async createFromTrip(tripId, driverId, totalAmount) {
    try {
      const commissionRate = 20; // 20% cho web
      const driverAmount = totalAmount * 0.8; // 80% cho tài xế
      const webAmount = totalAmount * 0.2; // 20% cho web

      const [result] = await pool.execute(`
        INSERT INTO doanh_thu (
          chuyen_di_id, 
          tai_xe_id, 
          tong_tien_chuyen, 
          tien_tai_xe, 
          tien_web, 
          phan_tram_chiet_khau
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [tripId, driverId, totalAmount, driverAmount, webAmount, commissionRate]);

      return result.insertId;
    } catch (error) {
      console.error('Create revenue error:', error);
      throw error;
    }
  }

  // Lấy tổng thu nhập tài xế
  static async getDriverRevenue(driverId, startDate = null, endDate = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as so_chuyen,
          SUM(tong_tien_chuyen) as tong_tien_chuyen,
          SUM(tien_tai_xe) as tong_thu_nhap,
          SUM(tien_web) as tong_chiet_khau
        FROM doanh_thu
        WHERE tai_xe_id = ?
      `;
      const params = [driverId];

      if (startDate && endDate) {
        query += ' AND created_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0];
    } catch (error) {
      console.error('Get driver revenue error:', error);
      throw error;
    }
  }

  // Lấy tổng doanh thu web
  static async getWebRevenue(startDate = null, endDate = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as so_chuyen,
          SUM(tong_tien_chuyen) as tong_tien_chuyen,
          SUM(tien_tai_xe) as tong_cho_tai_xe,
          SUM(tien_web) as tong_doanh_thu_web
        FROM doanh_thu
        WHERE 1=1
      `;
      const params = [];

      if (startDate && endDate) {
        query += ' AND created_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      const [rows] = await pool.execute(query, params);
      return rows[0];
    } catch (error) {
      console.error('Get web revenue error:', error);
      throw error;
    }
  }

  // Lấy doanh thu theo tháng (cho chart)
  static async getMonthlyRevenue(year) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          MONTH(created_at) as thang,
          COUNT(*) as so_chuyen,
          SUM(tong_tien_chuyen) as tong_tien,
          SUM(tien_tai_xe) as tien_tai_xe,
          SUM(tien_web) as tien_web
        FROM doanh_thu
        WHERE YEAR(created_at) = ?
        GROUP BY MONTH(created_at)
        ORDER BY thang
      `, [year]);

      return rows;
    } catch (error) {
      console.error('Get monthly revenue error:', error);
      throw error;
    }
  }

  // Lấy top tài xế có thu nhập cao nhất
  static async getTopDrivers(limit = 10, startDate = null, endDate = null) {
    try {
      let query = `
        SELECT 
          dt.tai_xe_id,
          nd.ten as ten_tai_xe,
          COUNT(*) as so_chuyen,
          SUM(dt.tong_tien_chuyen) as tong_tien_chuyen,
          SUM(dt.tien_tai_xe) as tong_thu_nhap,
          tx.bien_so_xe
        FROM doanh_thu dt
        INNER JOIN tai_xe tx ON dt.tai_xe_id = tx.id
        INNER JOIN nguoi_dung nd ON tx.nguoi_dung_id = nd.id
        WHERE 1=1
      `;
      const params = [];

      if (startDate && endDate) {
        query += ' AND dt.created_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += `
        GROUP BY dt.tai_xe_id, nd.ten, tx.bien_so_xe
        ORDER BY tong_thu_nhap DESC
        LIMIT ?
      `;
      params.push(limit);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Get top drivers error:', error);
      throw error;
    }
  }

  // Lấy lịch sử thu nhập tài xế
  static async getDriverRevenueHistory(driverId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const [rows] = await pool.execute(`
        SELECT 
          dt.*,
          cd.diem_don,
          cd.diem_den,
          cd.thoi_gian_ket_thuc
        FROM doanh_thu dt
        INNER JOIN chuyen_di cd ON dt.chuyen_di_id = cd.id
        WHERE dt.tai_xe_id = ?
        ORDER BY dt.created_at DESC
        LIMIT ? OFFSET ?
      `, [driverId, limit, offset]);

      // Count total
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM doanh_thu WHERE tai_xe_id = ?',
        [driverId]
      );

      return {
        revenues: rows,
        pagination: {
          page,
          limit,
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      console.error('Get driver revenue history error:', error);
      throw error;
    }
  }
}

module.exports = Revenue;
