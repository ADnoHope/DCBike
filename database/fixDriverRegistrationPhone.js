const { pool } = require('../config/database');

async function fixDriverRegistrationPhone() {
  try {
    console.log('🔧 Đang sửa cột so_dien_thoai trong bảng driver_registrations...');
    
    // Cho phép cột so_dien_thoai có giá trị NULL
    await pool.execute(`
      ALTER TABLE driver_registrations 
      MODIFY COLUMN so_dien_thoai VARCHAR(20) NULL
    `);
    
    console.log('✅ Đã sửa cột so_dien_thoai thành công!');
    console.log('   Cột so_dien_thoai bây giờ có thể là NULL');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi sửa cột so_dien_thoai:', error);
    process.exit(1);
  }
}

fixDriverRegistrationPhone();
