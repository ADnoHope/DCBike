const { pool } = require('../config/database');

class Notification {
  // Create a notification
  static async create({ user_id, sender_id = null, trip_id = null, type = 'info', message = '' }) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO thong_bao (user_id, sender_id, trip_id, type, message, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `, [user_id, sender_id, trip_id, type, message]);

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Get notifications for a user (most recent first)
  static async getByUser(userId, limit = 50) {
    try {
      const [rows] = await pool.execute(
        `SELECT id, user_id, sender_id, trip_id, type, message, is_read, created_at FROM thong_bao WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [userId, limit]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async markRead(notificationId) {
    try {
      const [result] = await pool.execute(`UPDATE thong_bao SET is_read = 1 WHERE id = ?`, [notificationId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Notification;
