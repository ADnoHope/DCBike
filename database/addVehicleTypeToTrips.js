const { pool } = require('../config/database');

async function addVehicleTypeToTrips() {
  try {
    console.log('Adding loai_xe column to chuyen_di table...');
    
    // Kiểm tra xem cột đã tồn tại chưa
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'chuyen_di' 
      AND COLUMN_NAME = 'loai_xe'
    `);
    
    if (columns.length > 0) {
      console.log('✅ Column loai_xe already exists in chuyen_di table');
      return;
    }
    
    // Thêm cột loai_xe vào bảng chuyen_di
    await pool.execute(`
      ALTER TABLE chuyen_di 
      ADD COLUMN loai_xe VARCHAR(50) DEFAULT 'xe_may' 
      AFTER diem_den
    `);
    
    console.log('✅ Successfully added loai_xe column to chuyen_di table');
    
    // Cập nhật dữ liệu cũ nếu có (mặc định là xe máy)
    await pool.execute(`
      UPDATE chuyen_di 
      SET loai_xe = 'xe_may' 
      WHERE loai_xe IS NULL
    `);
    
    console.log('✅ Updated existing trips with default vehicle type');
    
  } catch (error) {
    console.error('❌ Error adding loai_xe column:', error.message);
    throw error;
  }
}

// Run migration if executed directly
if (require.main === module) {
  addVehicleTypeToTrips()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addVehicleTypeToTrips;
