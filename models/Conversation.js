const { pool } = require('../config/database');

class Conversation {
  constructor(row) {
    this.id = row.id;
    this.chuyen_di_id = row.chuyen_di_id;
    this.khach_hang_id = row.khach_hang_id;
    this.tai_xe_id = row.tai_xe_id; // driver table id
    this.trang_thai = row.trang_thai;
    this.bat_dau_luc = row.bat_dau_luc;
    this.ket_thuc_luc = row.ket_thuc_luc;
    this.created_at = row.created_at;
    this.updated_at = row.updated_at;
  }

  static async createRequest({ khach_hang_id, tai_xe_id, chuyen_di_id = null }) {
    // Check if any conversation already exists between customer and driver (excluding trip-specific ones)
    const [existing] = await pool.execute(
      'SELECT * FROM cuoc_tro_chuyen WHERE khach_hang_id=? AND tai_xe_id=? AND chuyen_di_id IS NULL ORDER BY created_at DESC LIMIT 1',
      [khach_hang_id, tai_xe_id]
    );
    
    if (existing.length) {
      const convo = existing[0];
      // If conversation is ended, reactivate it as active
      if (convo.trang_thai === 'ended') {
        await pool.execute(
          'UPDATE cuoc_tro_chuyen SET trang_thai="active", updated_at=NOW() WHERE id=?',
          [convo.id]
        );
        return { ...convo, trang_thai: 'active' };
      }
      // If it's pending, activate it
      if (convo.trang_thai === 'pending') {
        await pool.execute(
          'UPDATE cuoc_tro_chuyen SET trang_thai="active", updated_at=NOW() WHERE id=?',
          [convo.id]
        );
        return { ...convo, trang_thai: 'active' };
      }
      // If it's active, return the existing one
      return convo;
    }

    // Create new conversation as active (customer can message immediately)
    const [result] = await pool.execute(
      'INSERT INTO cuoc_tro_chuyen (chuyen_di_id, khach_hang_id, tai_xe_id, trang_thai) VALUES (?,?,?,"active")',
      [chuyen_di_id, khach_hang_id, tai_xe_id]
    );
    return { id: result.insertId };
  }

  static async createForTrip({ chuyen_di_id, khach_hang_id, tai_xe_id }) {
    // Unique per trip
    const [existing] = await pool.execute(
      'SELECT * FROM cuoc_tro_chuyen WHERE chuyen_di_id = ? LIMIT 1',
      [chuyen_di_id]
    );
    if (existing.length) return existing[0];

    const [result] = await pool.execute(
      'INSERT INTO cuoc_tro_chuyen (chuyen_di_id, khach_hang_id, tai_xe_id, trang_thai) VALUES (?,?,?,"active")',
      [chuyen_di_id, khach_hang_id, tai_xe_id]
    );
    return { id: result.insertId };
  }

  static async accept(id, tai_xe_id) {
    const [rows] = await pool.execute('SELECT * FROM cuoc_tro_chuyen WHERE id = ?', [id]);
    if (!rows.length) return null;
    const convo = rows[0];
    if (convo.tai_xe_id !== tai_xe_id) {
      throw new Error('Không thể chấp nhận: không phải tài xế của cuộc trò chuyện này');
    }
    if (convo.trang_thai !== 'pending') return convo;

    await pool.execute('UPDATE cuoc_tro_chuyen SET trang_thai="active" WHERE id=?', [id]);
    return { ...convo, trang_thai: 'active' };
  }

  static async end(id, userId) {
    await pool.execute('UPDATE cuoc_tro_chuyen SET trang_thai="ended", ket_thuc_luc=NOW() WHERE id=?', [id]);
    const [rows] = await pool.execute('SELECT * FROM cuoc_tro_chuyen WHERE id=?', [id]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM cuoc_tro_chuyen WHERE id=?', [id]);
    return rows.length ? new Conversation(rows[0]) : null;
  }

  static async listByUser(userId) {
    // userId may be customer or driver user id; need join to tai_xe to match driver user id
    const [rows] = await pool.execute(`
      SELECT c.*,
             nd.ten AS ten_khach_hang,
             tx.id AS tai_xe_table_id,
             nd_tx.ten AS ten_tai_xe,
             c.trang_thai,
             (SELECT COUNT(*) FROM tin_nhan m WHERE m.cuoc_tro_chuyen_id=c.id AND m.da_doc=FALSE AND m.nguoi_gui_id <> ?) AS unread
      FROM cuoc_tro_chuyen c
      LEFT JOIN nguoi_dung nd ON c.khach_hang_id = nd.id
      LEFT JOIN tai_xe tx ON c.tai_xe_id = tx.id
      LEFT JOIN nguoi_dung nd_tx ON tx.nguoi_dung_id = nd_tx.id
      WHERE c.khach_hang_id = ? OR tx.nguoi_dung_id = ?
      ORDER BY c.updated_at DESC, c.bat_dau_luc DESC
    `, [userId, userId, userId]);
    return rows;
  }
}

module.exports = Conversation;
