const { pool } = require('../config/database');

/**
 * Script để xóa các bảng không sử dụng trong dự án
 * Bảng thanh_toan không được sử dụng trong code
 * Thông tin thanh toán đã được tích hợp vào bảng chuyen_di và no_tai_xe
 */

async function removeUnusedTables() {
  try {
    console.log('🔄 Bắt đầu xóa các bảng không sử dụng...');

    // Kiểm tra xem bảng thanh_toan có tồn tại không
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'thanh_toan'
    `);

    if (tables.length > 0) {
      // Xóa bảng thanh_toan
      await pool.execute('DROP TABLE IF EXISTS thanh_toan');
      console.log('✅ Đã xóa bảng thanh_toan (không sử dụng)');
    } else {
      console.log('ℹ️ Bảng thanh_toan không tồn tại');
    }

    console.log('\n📊 Các bảng hiện tại đang được sử dụng:');
    console.log('   1. nguoi_dung - Quản lý người dùng');
    console.log('   2. tai_xe - Thông tin tài xế');
    console.log('   3. driver_registrations - Đăng ký tài xế chờ duyệt');
    console.log('   4. chuyen_di - Quản lý chuyến đi');
    console.log('   5. khuyen_mai - Khuyến mãi');
    console.log('   6. danh_gia - Đánh giá');
    console.log('   7. cuoc_tro_chuyen - Chat conversations');
    console.log('   8. tin_nhan - Messages');
    console.log('   9. doanh_thu - Theo dõi doanh thu');
    console.log('   10. no_tai_xe - Quản lý nợ tài xế');
    console.log('   11. notifications - Thông báo khách hàng');
    console.log('   12. driver_notifications - Thông báo tài xế');
    console.log('   13. cai_dat_he_thong - Cài đặt hệ thống');

    console.log('\n🎉 Hoàn thành tối ưu database!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy script
removeUnusedTables();
