// Sử dụng pool từ cấu hình database (mysql2/promise)
const { pool } = require('../config/database');

async function createChatTables() {
    try {
        // Tạo bảng conversations - lưu cuộc trò chuyện giữa khách hàng và tài xế
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cuoc_tro_chuyen (
                id INT PRIMARY KEY AUTO_INCREMENT,
                chuyen_di_id INT NULL,
                khach_hang_id INT NOT NULL,          -- references nguoi_dung.id
                tai_xe_id INT NOT NULL,               -- references tai_xe.id
                trang_thai ENUM('pending','active','ended') DEFAULT 'pending',
                bat_dau_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ket_thuc_luc TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (chuyen_di_id) REFERENCES chuyen_di(id) ON DELETE SET NULL,
                FOREIGN KEY (khach_hang_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
                FOREIGN KEY (tai_xe_id) REFERENCES tai_xe(id) ON DELETE CASCADE,
                UNIQUE KEY uniq_conversation_trip (chuyen_di_id),
                INDEX idx_user_driver (khach_hang_id, tai_xe_id),
                INDEX idx_status (trang_thai)
            )
        `);
        console.log('✓ Bảng cuoc_tro_chuyen đã được tạo');

        // Tạo bảng messages - lưu tin nhắn trong cuộc trò chuyện
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tin_nhan (
                id INT PRIMARY KEY AUTO_INCREMENT,
                cuoc_tro_chuyen_id INT NOT NULL,
                nguoi_gui_id INT NOT NULL,            -- references nguoi_dung.id
                noi_dung TEXT NOT NULL,
                da_doc BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cuoc_tro_chuyen_id) REFERENCES cuoc_tro_chuyen(id) ON DELETE CASCADE,
                FOREIGN KEY (nguoi_gui_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
                INDEX idx_conversation (cuoc_tro_chuyen_id),
                INDEX idx_sender (nguoi_gui_id),
                INDEX idx_read (da_doc),
                INDEX idx_created (created_at)
            )
        `);
        console.log('✓ Bảng tin_nhan đã được tạo');

        console.log('\n✓ Tất cả bảng chat (cuoc_tro_chuyen, tin_nhan) đã được tạo thành công!');
    } catch (error) {
        console.error('Lỗi khi tạo bảng chat:', error);
        throw error;
    }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
    createChatTables()
        .then(() => {
            console.log('Hoàn tất!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Lỗi:', error);
            process.exit(1);
        });
}

module.exports = createChatTables;
