const { pool } = require('../config/database');

async function addGoogleIdColumn() {
  try {
    console.log('Đang thêm cột google_id vào bảng nguoi_dung...');
    
    // Kiểm tra xem cột đã tồn tại chưa
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'nguoi_dung' 
        AND COLUMN_NAME = 'google_id'
    `);

    if (columns.length > 0) {
      console.log('Cột google_id đã tồn tại trong bảng nguoi_dung');
      return;
    }

    // Thêm cột google_id
    await pool.execute(`
      ALTER TABLE nguoi_dung 
      ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER email,
      ADD INDEX idx_google_id (google_id)
    `);

    console.log('✓ Đã thêm cột google_id vào bảng nguoi_dung thành công!');
    
  } catch (error) {
    console.error('Lỗi khi thêm cột google_id:', error);
    throw error;
  }
}

// Chạy migration
addGoogleIdColumn()
  .then(() => {
    console.log('Migration hoàn tất!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration thất bại:', error);
    process.exit(1);
  });
