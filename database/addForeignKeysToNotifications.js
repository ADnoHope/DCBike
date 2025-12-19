const { pool } = require('../config/database');

/**
 * Script để thêm Foreign Key constraints cho các bảng notifications
 * Các bảng này hiện có quan hệ logic nhưng thiếu FK constraints
 */

async function addForeignKeys() {
  try {
    console.log('🔄 Bắt đầu thêm Foreign Key constraints...\n');

    // 1. Thêm FK cho bảng notifications
    console.log('📋 Xử lý bảng notifications...');
    
    // Kiểm tra và xóa dữ liệu không hợp lệ trước
    const [invalidNotifications] = await pool.execute(`
      SELECT n.id, n.user_id, n.trip_id
      FROM notifications n
      LEFT JOIN nguoi_dung u ON n.user_id = u.id
      WHERE u.id IS NULL
    `);
    
    if (invalidNotifications.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidNotifications.length} notifications với user_id không tồn tại`);
      await pool.execute('DELETE FROM notifications WHERE user_id NOT IN (SELECT id FROM nguoi_dung)');
      console.log('✅ Đã xóa notifications không hợp lệ');
    }

    // Xóa notifications với trip_id không tồn tại (nếu có)
    await pool.execute(`
      DELETE FROM notifications 
      WHERE trip_id IS NOT NULL 
      AND trip_id NOT IN (SELECT id FROM chuyen_di)
    `);

    // Thêm FK cho notifications
    try {
      await pool.execute(`
        ALTER TABLE notifications
        ADD CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
      `);
      console.log('✅ Đã thêm FK: notifications.user_id → nguoi_dung.id');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  FK notifications_user đã tồn tại');
      } else {
        throw err;
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE notifications
        ADD CONSTRAINT fk_notifications_trip
        FOREIGN KEY (trip_id) REFERENCES chuyen_di(id) ON DELETE SET NULL
      `);
      console.log('✅ Đã thêm FK: notifications.trip_id → chuyen_di.id');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  FK notifications_trip đã tồn tại');
      } else {
        throw err;
      }
    }

    // 2. Thêm FK cho bảng driver_notifications
    console.log('\n📋 Xử lý bảng driver_notifications...');
    
    // Kiểm tra dữ liệu không hợp lệ
    const [invalidDriverNotifs] = await pool.execute(`
      SELECT dn.id, dn.driver_id, dn.trip_id
      FROM driver_notifications dn
      LEFT JOIN tai_xe d ON dn.driver_id = d.id
      WHERE d.id IS NULL
    `);
    
    if (invalidDriverNotifs.length > 0) {
      console.log(`⚠️  Tìm thấy ${invalidDriverNotifs.length} driver_notifications với driver_id không tồn tại`);
      await pool.execute('DELETE FROM driver_notifications WHERE driver_id NOT IN (SELECT id FROM tai_xe)');
      console.log('✅ Đã xóa driver_notifications không hợp lệ');
    }

    // Xóa với trip_id không tồn tại
    await pool.execute(`
      DELETE FROM driver_notifications 
      WHERE trip_id NOT IN (SELECT id FROM chuyen_di)
    `);

    // Thêm FK cho driver_notifications
    try {
      await pool.execute(`
        ALTER TABLE driver_notifications
        ADD CONSTRAINT fk_driver_notifications_driver
        FOREIGN KEY (driver_id) REFERENCES tai_xe(id) ON DELETE CASCADE
      `);
      console.log('✅ Đã thêm FK: driver_notifications.driver_id → tai_xe.id');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  FK driver_notifications_driver đã tồn tại');
      } else {
        throw err;
      }
    }

    try {
      await pool.execute(`
        ALTER TABLE driver_notifications
        ADD CONSTRAINT fk_driver_notifications_trip
        FOREIGN KEY (trip_id) REFERENCES chuyen_di(id) ON DELETE CASCADE
      `);
      console.log('✅ Đã thêm FK: driver_notifications.trip_id → chuyen_di.id');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  FK driver_notifications_trip đã tồn tại');
      } else {
        throw err;
      }
    }

    // 3. Bảng cai_dat_he_thong không cần FK vì là standalone config table
    console.log('\n📋 Bảng cai_dat_he_thong: Không cần FK (standalone config table)');

    console.log('\n🎉 Hoàn thành! Database đã được cải thiện tính toàn vẹn dữ liệu.');
    console.log('\n📊 Tóm tắt:');
    console.log('   ✅ notifications có FK → nguoi_dung, chuyen_di');
    console.log('   ✅ driver_notifications có FK → tai_xe, chuyen_di');
    console.log('   ✅ cai_dat_he_thong giữ nguyên (config table)');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Chạy script
addForeignKeys();
