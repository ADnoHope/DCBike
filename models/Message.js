const { pool } = require('../config/database');

class Message {
  constructor(row) {
    this.id = row.id;
    this.cuoc_tro_chuyen_id = row.cuoc_tro_chuyen_id;
    this.nguoi_gui_id = row.nguoi_gui_id;
    this.noi_dung = row.noi_dung;
    this.da_doc = row.da_doc;
    this.created_at = row.created_at;
  }

  static async send({ cuoc_tro_chuyen_id, nguoi_gui_id, noi_dung }) {
    const [result] = await pool.execute(
      'INSERT INTO tin_nhan (cuoc_tro_chuyen_id, nguoi_gui_id, noi_dung) VALUES (?,?,?)',
      [cuoc_tro_chuyen_id, nguoi_gui_id, noi_dung]
    );
    // Update conversation updated_at
    await pool.execute('UPDATE cuoc_tro_chuyen SET updated_at = NOW() WHERE id=?', [cuoc_tro_chuyen_id]);
    return result.insertId;
  }

  static async list({ cuoc_tro_chuyen_id, limit = 100, afterId = null }) {
    let query = 'SELECT * FROM tin_nhan WHERE cuoc_tro_chuyen_id = ?';
    const params = [cuoc_tro_chuyen_id];
    if (afterId) {
      query += ' AND id > ?';
      params.push(afterId);
    }
    query += ' ORDER BY id ASC LIMIT ?';
    params.push(limit);
    const [rows] = await pool.execute(query, params);
    return rows.map(r => new Message(r));
  }

  static async markRead({ cuoc_tro_chuyen_id, userId }) {
    await pool.execute(
      'UPDATE tin_nhan SET da_doc=TRUE WHERE cuoc_tro_chuyen_id=? AND nguoi_gui_id <> ?',
      [cuoc_tro_chuyen_id, userId]
    );
  }
}

module.exports = Message;
