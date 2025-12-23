const { pool } = require('../config/database');

async function addUsageLimitToUserVouchers() {
  try {
    console.log('Đang thêm trường usage_limit và times_used vào bảng user_vouchers...');

    // Thêm cột usage_limit (số lần có thể sử dụng)
    await pool.execute(`
      ALTER TABLE user_vouchers 
      ADD COLUMN IF NOT EXISTS usage_limit INT DEFAULT 1 COMMENT 'Số lần tối đa có thể sử dụng voucher'
    `);
    console.log('✓ Đã thêm cột usage_limit');

    // Thêm cột times_used (số lần đã sử dụng)
    await pool.execute(`
      ALTER TABLE user_vouchers 
      ADD COLUMN IF NOT EXISTS times_used INT DEFAULT 0 COMMENT 'Số lần đã sử dụng voucher'
    `);
    console.log('✓ Đã thêm cột times_used');

    // Cập nhật dữ liệu cũ: nếu da_su_dung = TRUE thì times_used = 1
    await pool.execute(`
      UPDATE user_vouchers 
      SET times_used = 1 
      WHERE da_su_dung = TRUE AND times_used = 0
    `);
    console.log('✓ Đã cập nhật times_used cho các voucher đã sử dụng');

    console.log('✓ Hoàn thành cập nhật bảng user_vouchers');
  } catch (error) {
    console.error('Lỗi khi cập nhật bảng user_vouchers:', error);
    throw error;
  }
}

// Chạy migration
if (require.main === module) {
  addUsageLimitToUserVouchers()
    .then(() => {
      console.log('Migration thành công!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration thất bại:', error);
      process.exit(1);
    });
}

module.exports = addUsageLimitToUserVouchers;
