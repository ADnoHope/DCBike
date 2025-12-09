const { pool } = require('../config/database');

class Notification {
  // Create a notification for customer
  static async create({ user_id, trip_id, type = 'trip_accepted', message = '', title = '', data = null }) {
    try {
      const [result] = await pool.execute(`
        INSERT INTO notifications (user_id, trip_id, type, message, title, data, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [user_id, trip_id, type, message, title, data ? JSON.stringify(data) : null, 'unread']);

      return result.insertId;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user (unread or all)
  static async getByUserId(userId, onlyUnread = false, limit = 50) {
    try {
      let query = 'SELECT * FROM notifications WHERE user_id = ?';
      
      if (onlyUnread) {
        query += ' AND status = "unread"';
      }
      
      query += ' ORDER BY created_at DESC LIMIT ?';
      
      const [rows] = await pool.execute(query, [userId, limit]);
      
      // Parse JSON data field
      return rows.map(row => {
        if (row.data) {
          try {
            row.data = JSON.parse(row.data);
          } catch (e) {
            console.error('Error parsing notification data:', e);
          }
        }
        return row;
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE notifications SET status = ? WHERE id = ? AND user_id = ?',
        ['read', notificationId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE notifications SET status = ? WHERE user_id = ? AND status = ?',
        ['read', userId, 'unread']
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = ?',
        [userId, 'unread']
      );
      return rows[0].count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete notification
  static async delete(notificationId, userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Delete old notifications (older than X days)
  static async deleteOldNotifications(daysOld = 30) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [daysOld]
      );
      return result.affectedRows;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}

module.exports = Notification;
