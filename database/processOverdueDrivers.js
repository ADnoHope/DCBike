const { pool } = require('../config/database');
const DriverDebt = require('../models/DriverDebt');

async function processOverdueDrivers() {
  try {
    console.log('🔄 Đang kiểm tra và xử lý tài xế quá hạn thanh toán...');
    
    const result = await DriverDebt.processOverdueDrivers();
    
    console.log(`\n✅ Đã xử lý ${result.processed} tài xế quá hạn thanh toán`);
    
    if (result.drivers.length > 0) {
      console.log('\n📋 Danh sách tài xế đã bị chuyển về khách hàng:');
      result.drivers.forEach((driver, index) => {
        console.log(`\n${index + 1}. ${driver.ten} (${driver.email})`);
        console.log(`   - Số nợ quá hạn: ${driver.so_no_qua_han} khoản`);
        console.log(`   - Tổng nợ: ${driver.tong_no_qua_han.toLocaleString('vi-VN')} đ`);
      });
    } else {
      console.log('\n✅ Không có tài xế nào quá hạn thanh toán');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi xử lý tài xế quá hạn:', error);
    process.exit(1);
  }
}

processOverdueDrivers();
