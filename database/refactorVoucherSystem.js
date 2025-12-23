const { pool } = require('../config/database');

/**
 * Refactor hệ thống Voucher/Khuyến mãi
 * 
 * Thay đổi:
 * 1. Đổi tên cột gioi_han_su_dung -> so_luong (số lượng voucher hiện có)
 * 2. so_luong NOT NULL, mặc định 999999 (không giới hạn)
 * 3. Xóa cột so_luong_su_dung (không cần nữa vì dùng so_luong)
 * 4. Thêm trạng thái 'het_luot' cho voucher hết số lượng
 */
async function refactorVoucherSystem() {
  try {
    console.log('🔄 Bắt đầu refactor hệ thống voucher...');

    // 1. Kiểm tra cột hiện tại
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM khuyen_mai
    `);
    const columnNames = columns.map(col => col.Field);
    console.log('📋 Các cột hiện tại:', columnNames);

    // 2. Backup dữ liệu trước khi sửa
    const [vouchers] = await pool.execute('SELECT * FROM khuyen_mai');
    console.log(`💾 Backup ${vouchers.length} vouchers`);

    // 3. Thêm cột so_luong tạm thời (nếu chưa có)
    if (!columnNames.includes('so_luong')) {
      console.log('➕ Thêm cột so_luong...');
      await pool.execute(`
        ALTER TABLE khuyen_mai 
        ADD COLUMN so_luong INT NOT NULL DEFAULT 999999 
        COMMENT 'Số lượng voucher còn lại'
      `);
    }

    // 4. Di chuyển dữ liệu từ gioi_han_su_dung sang so_luong
    if (columnNames.includes('gioi_han_su_dung') && columnNames.includes('so_luong_su_dung')) {
      console.log('🔄 Chuyển đổi dữ liệu...');
      
      // Tính so_luong = gioi_han_su_dung - so_luong_su_dung
      // Nếu gioi_han_su_dung = NULL -> so_luong = 999999
      await pool.execute(`
        UPDATE khuyen_mai 
        SET so_luong = CASE 
          WHEN gioi_han_su_dung IS NULL THEN 999999
          WHEN gioi_han_su_dung > so_luong_su_dung THEN gioi_han_su_dung - so_luong_su_dung
          ELSE 0
        END
      `);
      
      console.log('✅ Đã chuyển đổi số liệu');
    }

    // 5. Cập nhật trạng thái cho voucher hết số lượng
    console.log('🔄 Cập nhật trạng thái voucher hết số lượng...');
    await pool.execute(`
      UPDATE khuyen_mai 
      SET trang_thai = 'het_luot' 
      WHERE so_luong <= 0 AND trang_thai != 'het_han'
    `);

    // 6. Sửa ENUM trang_thai để thêm 'het_luot'
    console.log('🔄 Cập nhật ENUM trang_thai...');
    await pool.execute(`
      ALTER TABLE khuyen_mai 
      MODIFY COLUMN trang_thai ENUM('hoat_dong', 'tam_dung', 'het_han', 'het_luot') 
      DEFAULT 'hoat_dong'
    `);

    // 7. Xóa cột cũ không dùng nữa
    if (columnNames.includes('so_luong_su_dung')) {
      console.log('🗑️  Xóa cột so_luong_su_dung...');
      await pool.execute(`
        ALTER TABLE khuyen_mai 
        DROP COLUMN so_luong_su_dung
      `);
    }

    if (columnNames.includes('gioi_han_su_dung')) {
      console.log('🗑️  Xóa cột gioi_han_su_dung...');
      await pool.execute(`
        ALTER TABLE khuyen_mai 
        DROP COLUMN gioi_han_su_dung
      `);
    }

    // 8. Kiểm tra kết quả
    const [result] = await pool.execute(`
      SELECT ma_khuyen_mai, ten_khuyen_mai, so_luong, trang_thai 
      FROM khuyen_mai 
      ORDER BY created_at DESC
    `);
    
    console.log('\n✅ Refactor hoàn tất!');
    console.log('\n📊 Vouchers sau khi refactor:');
    console.table(result);

    return { success: true, vouchers: result };
  } catch (error) {
    console.error('❌ Lỗi khi refactor:', error);
    throw error;
  }
}

// Chạy migration
if (require.main === module) {
  refactorVoucherSystem()
    .then(() => {
      console.log('\n🎉 Migration thành công!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Migration thất bại:', error);
      process.exit(1);
    });
}

module.exports = refactorVoucherSystem;
