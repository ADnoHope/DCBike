const { pool } = require('../config/database');

async function createUserVouchersTable() {
  try {
    console.log('Đang tạo bảng user_vouchers...');

    // Tạo bảng user_vouchers để lưu voucher cá nhân của từng khách hàng
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_vouchers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nguoi_dung_id INT NOT NULL,
        khuyen_mai_id INT NOT NULL,
        loai_voucher ENUM('new_user', 'reward_3trips', 'vip', 'manual') NOT NULL,
        da_su_dung BOOLEAN DEFAULT FALSE,
        ngay_su_dung DATETIME NULL,
        chuyen_di_su_dung_id INT NULL,
        ngay_het_han DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
        FOREIGN KEY (khuyen_mai_id) REFERENCES khuyen_mai(id) ON DELETE CASCADE,
        FOREIGN KEY (chuyen_di_su_dung_id) REFERENCES chuyen_di(id) ON DELETE SET NULL,
        INDEX idx_user_voucher (nguoi_dung_id, da_su_dung),
        INDEX idx_voucher_type (loai_voucher)
      )
    `);

    console.log('✓ Tạo bảng user_vouchers thành công');

    // Tạo voucher mặc định cho khách hàng mới (10% giảm giá, tối đa 20000đ)
    const [existingNewUserVoucher] = await pool.execute(
      'SELECT id FROM khuyen_mai WHERE ma_khuyen_mai = ?',
      ['NEW_USER_2025']
    );

    if (existingNewUserVoucher.length === 0) {
      await pool.execute(`
        INSERT INTO khuyen_mai (
          ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_khuyen_mai, gia_tri,
          gia_tri_toi_da, gia_tri_toi_thieu, ngay_bat_dau, ngay_ket_thuc,
          gioi_han_su_dung, trang_thai
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'NEW_USER_2025',
        'Voucher Khách Hàng Mới',
        'Giảm 10% cho khách hàng mới, tối đa 20,000đ',
        'phan_tram',
        10,
        20000,
        0,
        '2025-01-01',
        '2025-12-31',
        null,  // Không giới hạn số lượng sử dụng chung
        'hoat_dong'
      ]);
      console.log('✓ Tạo voucher mặc định cho khách hàng mới');
    }

    // Tạo voucher thưởng cho khách hàng hoàn thành 3 chuyến (15% giảm giá, tối đa 30000đ)
    const [existingRewardVoucher] = await pool.execute(
      'SELECT id FROM khuyen_mai WHERE ma_khuyen_mai = ?',
      ['REWARD_3TRIPS_2025']
    );

    if (existingRewardVoucher.length === 0) {
      await pool.execute(`
        INSERT INTO khuyen_mai (
          ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_khuyen_mai, gia_tri,
          gia_tri_toi_da, gia_tri_toi_thieu, ngay_bat_dau, ngay_ket_thuc,
          gioi_han_su_dung, trang_thai
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'REWARD_3TRIPS_2025',
        'Voucher Thưởng 3 Chuyến',
        'Giảm 15% cho khách hàng hoàn thành 3 chuyến đi, tối đa 30,000đ',
        'phan_tram',
        15,
        30000,
        0,
        '2025-01-01',
        '2025-12-31',
        null,  // Không giới hạn số lượng sử dụng chung
        'hoat_dong'
      ]);
      console.log('✓ Tạo voucher thưởng cho khách hàng hoàn thành 3 chuyến');
    }

    console.log('✓ Tạo bảng user_vouchers và các voucher mặc định thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo bảng user_vouchers:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createUserVouchersTable();
