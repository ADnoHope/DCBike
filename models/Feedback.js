const { pool } = require('../config/database');

class Feedback {
  // Tạo feedback mới
  static async create({ user_id = null, email, ten_nguoi_gui, tieu_de, noi_dung }) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO feedback (user_id, email, ten_nguoi_gui, tieu_de, noi_dung, trang_thai)
        VALUES (?, ?, ?, ?, ?, 'chua_doc')
      `, [user_id, email, ten_nguoi_gui, tieu_de, noi_dung]);

      return {
        success: true,
        id: result.insertId
      };
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  // Lấy tất cả feedback (cho admin)
  static async getAll({ status = null, limit = 50, offset = 0 }) {
    try {
      let query = `
        SELECT f.*,
               u.ten as ten_user,
               admin.ten as ten_admin
        FROM feedback f
        LEFT JOIN nguoi_dung u ON f.user_id = u.id
        LEFT JOIN nguoi_dung admin ON f.admin_id = admin.id
      `;

      const params = [];

      if (status) {
        query += ' WHERE f.trang_thai = ?';
        params.push(status);
      }

      query += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error getting all feedback:', error);
      throw error;
    }
  }

  // Lấy feedback theo ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT f.*,
               u.ten as ten_user, u.email as email_user,
               admin.ten as ten_admin
        FROM feedback f
        LEFT JOIN nguoi_dung u ON f.user_id = u.id
        LEFT JOIN nguoi_dung admin ON f.admin_id = admin.id
        WHERE f.id = ?
      `, [id]);

      return rows[0] || null;
    } catch (error) {
      console.error('Error getting feedback by ID:', error);
      throw error;
    }
  }

  // Lấy feedback của user
  static async getByUserId(userId, limit = 20) {
    try {
      const [rows] = await pool.execute(`
        SELECT f.*,
               admin.ten as ten_admin
        FROM feedback f
        LEFT JOIN nguoi_dung admin ON f.admin_id = admin.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
        LIMIT ?
      `, [userId, limit]);

      return rows;
    } catch (error) {
      console.error('Error getting feedback by user ID:', error);
      throw error;
    }
  }

  // Đánh dấu đã đọc
  static async markAsRead(id) {
    try {
      const [result] = await pool.execute(`
        UPDATE feedback
        SET trang_thai = 'da_doc'
        WHERE id = ? AND trang_thai = 'chua_doc'
      `, [id]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking feedback as read:', error);
      throw error;
    }
  }

  // Admin trả lời feedback
  static async reply(id, admin_id, admin_reply) {
    try {
      const [result] = await pool.execute(`
        UPDATE feedback
        SET admin_reply = ?,
            admin_id = ?,
            trang_thai = 'da_tra_loi',
            replied_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [admin_reply, admin_id, id]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error replying to feedback:', error);
      throw error;
    }
  }

  // Đếm feedback chưa đọc
  static async countUnread() {
    try {
      const [rows] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM feedback
        WHERE trang_thai = 'chua_doc'
      `);

      return rows[0].count;
    } catch (error) {
      console.error('Error counting unread feedback:', error);
      throw error;
    }
  }

  // Xóa feedback
  static async delete(id) {
    try {
      const [result] = await pool.execute(`
        DELETE FROM feedback WHERE id = ?
      `, [id]);

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }

  // Thống kê feedback
  static async getStatistics() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN trang_thai = 'chua_doc' THEN 1 ELSE 0 END) as chua_doc,
          SUM(CASE WHEN trang_thai = 'da_doc' THEN 1 ELSE 0 END) as da_doc,
          SUM(CASE WHEN trang_thai = 'da_tra_loi' THEN 1 ELSE 0 END) as da_tra_loi
        FROM feedback
      `);

      return rows[0];
    } catch (error) {
      console.error('Error getting feedback statistics:', error);
      throw error;
    }
  }
}

module.exports = Feedback;
