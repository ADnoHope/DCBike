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

    console.log('Connected to database, ensuring previous_loai_tai_khoan column exists...');

    // Add column if not exists
    await connection.execute(`
      ALTER TABLE nguoi_dung 
      ADD COLUMN IF NOT EXISTS previous_loai_tai_khoan VARCHAR(50) NULL;
    `);

    console.log('previous_loai_tai_khoan column ensured.');
    await connection.end();
  } catch (err) {
    console.error('Error ensuring previous_loai_tai_khoan column:', err);
    process.exit(1);
  }
})();
