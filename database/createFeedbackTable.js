const { pool } = require('../config/database');

/**
 * Tạo bảng feedback cho chức năng phản hồi từ user đến admin
 */

async function createFeedbackTable() {
  try {
    console.log('🔄 Bắt đầu tạo bảng feedback...');

    // Tạo bảng feedback
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL COMMENT 'NULL nếu user chưa đăng nhập',
        email VARCHAR(255) NOT NULL COMMENT 'Email để nhận phản hồi',
        ten_nguoi_gui VARCHAR(255) NOT NULL COMMENT 'Tên người gửi',
        tieu_de VARCHAR(255) NOT NULL COMMENT 'Tiêu đề phản hồi',
        noi_dung TEXT NOT NULL COMMENT 'Nội dung phản hồi',
        trang_thai ENUM('chua_doc', 'da_doc', 'da_tra_loi') DEFAULT 'chua_doc',
        admin_reply TEXT NULL COMMENT 'Phản hồi của admin',
        admin_id INT NULL COMMENT 'Admin trả lời',
        replied_at TIMESTAMP NULL COMMENT 'Thời gian trả lời',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL,
        FOREIGN KEY (admin_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL,
        INDEX idx_trang_thai (trang_thai),
        INDEX idx_email (email),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Đã tạo bảng feedback thành công!');
    
    console.log('\n📊 Cấu trúc bảng feedback:');
    console.log('   - id: Primary key');
    console.log('   - user_id: FK → nguoi_dung (optional, có thể NULL)');
    console.log('   - email: Email người gửi (bắt buộc)');
    console.log('   - ten_nguoi_gui: Tên người gửi');
    console.log('   - tieu_de: Tiêu đề phản hồi');
    console.log('   - noi_dung: Nội dung chi tiết');
    console.log('   - trang_thai: chua_doc | da_doc | da_tra_loi');
    console.log('   - admin_reply: Nội dung trả lời của admin');
    console.log('   - admin_id: FK → nguoi_dung (admin)');
    console.log('   - replied_at: Thời gian trả lời');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo bảng feedback:', error);
    process.exit(1);
  }
}

// Chạy script
createFeedbackTable();
