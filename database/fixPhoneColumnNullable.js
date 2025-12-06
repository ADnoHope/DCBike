const { pool } = require('../config/database');

async function fixPhoneColumnNullable() {
  try {
    console.log('Đang cập nhật cột so_dien_thoai cho phép NULL...');
    
    // Cho phép cột so_dien_thoai nhận giá trị NULL
    await pool.execute(`
      ALTER TABLE nguoi_dung 
      MODIFY COLUMN so_dien_thoai VARCHAR(20) NULL
    `);

    console.log('✓ Đã cập nhật cột so_dien_thoai thành công!');
    
  } catch (error) {
    console.error('Lỗi khi cập nhật cột so_dien_thoai:', error);
    throw error;
  }
}

// Chạy migration
fixPhoneColumnNullable()
  .then(() => {
    console.log('Migration hoàn tất!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration thất bại:', error);
    process.exit(1);
  });
