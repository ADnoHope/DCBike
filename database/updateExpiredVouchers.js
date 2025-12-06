const { pool } = require('../config/database');

async function updateExpiredVouchers() {
  try {
    console.log('🔄 Đang cập nhật trạng thái voucher hết hạn...');
    
    const [result] = await pool.execute(`
      UPDATE khuyen_mai 
      SET trang_thai = 'het_han' 
      WHERE trang_thai = 'hoat_dong' 
      AND ngay_ket_thuc < NOW()
    `);
    
    console.log(`✅ Đã cập nhật ${result.affectedRows} voucher hết hạn`);
    
    // Hiển thị danh sách voucher đã cập nhật
    const [vouchers] = await pool.execute(`
      SELECT id, ma_khuyen_mai, ten_khuyen_mai, ngay_ket_thuc, trang_thai 
      FROM khuyen_mai 
      WHERE trang_thai = 'het_han'
      ORDER BY ngay_ket_thuc DESC
    `);
    
    console.log('\n📋 Danh sách voucher hết hạn:');
    vouchers.forEach(v => {
      console.log(`   - ${v.ma_khuyen_mai}: ${v.ten_khuyen_mai} (Hết hạn: ${new Date(v.ngay_ket_thuc).toLocaleDateString('vi-VN')})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

updateExpiredVouchers();
