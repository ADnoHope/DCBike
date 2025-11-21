const { pool } = require('../config/database');

async function addPaymentFeatures() {
  try {
    console.log('🔄 Bắt đầu cập nhật cơ sở dữ liệu cho tính năng thanh toán...');

    // 1. Thêm cột phuong_thuc_thanh_toan vào bảng chuyen_di
    const [columnsCheck] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'chuyen_di' 
      AND COLUMN_NAME = 'phuong_thuc_thanh_toan'
    `);

    if (columnsCheck.length === 0) {
      await pool.execute(`
        ALTER TABLE chuyen_di 
        ADD COLUMN phuong_thuc_thanh_toan ENUM('chuyen_khoan', 'tien_mat') DEFAULT 'tien_mat' AFTER tong_tien
      `);
      console.log('✅ Đã thêm cột phuong_thuc_thanh_toan vào bảng chuyen_di');
    } else {
      console.log('ℹ️ Cột phuong_thuc_thanh_toan đã tồn tại');
    }

    // 2. Tạo bảng nợ tài xế (driver_debts)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS no_tai_xe (
        id INT PRIMARY KEY AUTO_INCREMENT,
        tai_xe_id INT NOT NULL,
        chuyen_di_id INT NOT NULL,
        so_tien_no DECIMAL(10,2) NOT NULL,
        so_tien_da_tra DECIMAL(10,2) DEFAULT 0,
        trang_thai ENUM('chua_tra', 'dang_tra', 'da_tra') DEFAULT 'chua_tra',
        ngay_phat_sinh TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        han_thanh_toan DATETIME NOT NULL,
        ngay_thanh_toan TIMESTAMP NULL,
        ghi_chu TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tai_xe_id) REFERENCES tai_xe(id) ON DELETE CASCADE,
        FOREIGN KEY (chuyen_di_id) REFERENCES chuyen_di(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Đã tạo bảng no_tai_xe');

    // 3. Thêm cột trạng thái bị chặn vào bảng tài xế
    const [blockedCheck] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tai_xe' 
      AND COLUMN_NAME = 'bi_chan_vi_no'
    `);

    if (blockedCheck.length === 0) {
      await pool.execute(`
        ALTER TABLE tai_xe 
        ADD COLUMN bi_chan_vi_no BOOLEAN DEFAULT FALSE AFTER trang_thai_tai_xe
      `);
      console.log('✅ Đã thêm cột bi_chan_vi_no vào bảng tai_xe');
    } else {
      console.log('ℹ️ Cột bi_chan_vi_no đã tồn tại');
    }

    // 4. Thêm cột thông tin QR code vào bảng admin/system settings
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cai_dat_he_thong (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ten_cai_dat VARCHAR(100) UNIQUE NOT NULL,
        gia_tri TEXT,
        mo_ta TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Đã tạo bảng cai_dat_he_thong');

    // 5. Thêm cài đặt mặc định cho QR code
    await pool.execute(`
      INSERT INTO cai_dat_he_thong (ten_cai_dat, gia_tri, mo_ta) 
      VALUES 
        ('qr_bank_name', 'Ngân hàng quốc tế VIB', 'Tên ngân hàng nhận thanh toán'),
        ('qr_bank_account', '228155456', 'Số tài khoản ngân hàng'),
        ('qr_account_holder', 'LE MANH CUONG', 'Tên chủ tài khoản'),
        ('driver_commission_rate', '20', 'Phần trăm hoa hồng tài xế phải trả (%)'),
        ('debt_payment_deadline_hours', '24', 'Thời hạn thanh toán nợ (giờ)')
      ON DUPLICATE KEY UPDATE 
        gia_tri = VALUES(gia_tri),
        mo_ta = VALUES(mo_ta)
    `);
    console.log('✅ Đã thêm cài đặt hệ thống cho thanh toán');

    console.log('🎉 Hoàn thành cập nhật cơ sở dữ liệu!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật cơ sở dữ liệu:', error);
    process.exit(1);
  }
}

addPaymentFeatures();
