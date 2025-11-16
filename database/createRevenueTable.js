const { pool } = require('../config/database');

const createRevenueTable = async () => {
  try {
    console.log('Creating revenue tracking table...');

    // Bảng theo dõi doanh thu
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS doanh_thu (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chuyen_di_id INT NOT NULL,
        tai_xe_id INT NOT NULL,
        tong_tien_chuyen DECIMAL(10,2) NOT NULL,
        tien_tai_xe DECIMAL(10,2) NOT NULL COMMENT 'Thu nhập tài xế (80%)',
        tien_web DECIMAL(10,2) NOT NULL COMMENT 'Doanh thu web (20%)',
        phan_tram_chiet_khau DECIMAL(5,2) DEFAULT 20.00 COMMENT 'Phần trăm chiết khấu',
        trang_thai ENUM('chua_thanh_toan', 'da_thanh_toan') DEFAULT 'chua_thanh_toan',
        ngay_thanh_toan TIMESTAMP NULL,
        ghi_chu TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (chuyen_di_id) REFERENCES chuyen_di(id),
        FOREIGN KEY (tai_xe_id) REFERENCES tai_xe(id),
        INDEX idx_tai_xe (tai_xe_id),
        INDEX idx_trang_thai (trang_thai),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Revenue table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating revenue table:', error);
    process.exit(1);
  }
};

createRevenueTable();
