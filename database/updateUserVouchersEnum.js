const { pool } = require('../config/database');

async function updateUserVouchersEnum() {
  try {
    console.log('Đang cập nhật enum loai_voucher...');

    await pool.execute(`
      ALTER TABLE user_vouchers 
      MODIFY COLUMN loai_voucher ENUM('new_user', 'reward_3trips', 'vip', 'manual') NOT NULL
    `);

    console.log('✓ Cập nhật loai_voucher thành công!');
  } catch (error) {
    console.error('Lỗi khi cập nhật:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateUserVouchersEnum();
