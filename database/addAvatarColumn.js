const { pool } = require('../config/database');

async function addAvatarColumn() {
  try {
    // Kiểm tra xem cột avatar đã tồn tại chưa
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'nguoi_dung' 
      AND COLUMN_NAME = 'avatar'
    `);

    if (columns.length > 0) {
      console.log('✅ Cột avatar đã tồn tại trong bảng nguoi_dung');
      process.exit(0);
    }

    // Thêm cột avatar vào bảng nguoi_dung
    await pool.execute(`
      ALTER TABLE nguoi_dung 
      ADD COLUMN avatar VARCHAR(255) NULL AFTER dia_chi
    `);

    console.log('✅ Đã thêm cột avatar vào bảng nguoi_dung thành công');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi thêm cột avatar:', error);
    process.exit(1);
  }
}

addAvatarColumn();
