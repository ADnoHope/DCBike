const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'DCdb',
      charset: 'utf8mb4',
      timezone: '+07:00'
    });

    console.log('Connected to database, creating thong_bao table if not exists...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS thong_bao (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        sender_id INT NULL,
        trip_id INT NULL,
        type VARCHAR(64) NOT NULL,
        message TEXT,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (trip_id),
        FOREIGN KEY (user_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('thong_bao table ensured.');
    await connection.end();
  } catch (err) {
    console.error('Error creating thong_bao table:', err);
    process.exit(1);
  }
})();
