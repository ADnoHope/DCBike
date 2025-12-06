const { pool } = require('../config/database');

async function addResetPasswordColumns() {
  try {
    console.log('🔄 Đang thêm các cột cho chức năng reset mật khẩu...');

    // Kiểm tra và thêm cột reset_code
    await pool.execute(`
      ALTER TABLE nguoi_dung 
      ADD COLUMN IF NOT EXISTS reset_code VARCHAR(10) NULL,
      ADD COLUMN IF NOT EXISTS reset_code_expires DATETIME NULL
    `);

    console.log('✅ Đã thêm cột reset_code và reset_code_expires vào bảng nguoi_dung');

    // Kiểm tra kết quả
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM nguoi_dung 
      WHERE Field IN ('reset_code', 'reset_code_expires')
    `);

    console.log('📋 Các cột đã thêm:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('✅ Migration hoàn tất!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi thêm cột:', error);
    process.exit(1);
  }
}

addResetPasswordColumns();
