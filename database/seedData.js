const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedData = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dc_car_booking',
      charset: 'utf8mb4'
    });

    console.log('Đang thêm dữ liệu mẫu...');

    // Hash password mẫu
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Thêm người dùng mẫu
    console.log('Thêm người dùng mẫu...');
    
    // Admin
    await connection.execute(`
      INSERT IGNORE INTO nguoi_dung (id, ten, email, so_dien_thoai, mat_khau, loai_tai_khoan)
      VALUES (1, 'Admin DC', 'admin@dc.com', '0901234567', ?, 'admin')
    `, [hashedPassword]);

    // Khách hàng
    await connection.execute(`
      INSERT IGNORE INTO nguoi_dung (id, ten, email, so_dien_thoai, mat_khau, dia_chi, loai_tai_khoan)
      VALUES 
        (2, 'Nguyễn Văn An', 'khachhang1@gmail.com', '0987654321', ?, '123 Đường ABC, Quận 1, TP.HCM', 'khach_hang'),
        (3, 'Trần Thị Bình', 'khachhang2@gmail.com', '0976543210', ?, '456 Đường XYZ, Quận 2, TP.HCM', 'khach_hang')
    `, [hashedPassword, hashedPassword]);

    // Tài xế
    await connection.execute(`
      INSERT IGNORE INTO nguoi_dung (id, ten, email, so_dien_thoai, mat_khau, dia_chi, loai_tai_khoan)
      VALUES 
        (4, 'Lê Văn Cường', 'taixe1@gmail.com', '0965432109', ?, '789 Đường DEF, Quận 3, TP.HCM', 'tai_xe'),
        (5, 'Phạm Minh Đức', 'taixe2@gmail.com', '0954321098', ?, '101 Đường GHI, Quận 4, TP.HCM', 'tai_xe')
    `, [hashedPassword, hashedPassword]);

    // Thêm thông tin tài xế
    console.log('Thêm thông tin tài xế...');
    await connection.execute(`
      INSERT IGNORE INTO tai_xe (id, nguoi_dung_id, so_bang_lai, loai_bang_lai, kinh_nghiem_lien_tuc, bien_so_xe, loai_xe, mau_xe, hang_xe, diem_danh_gia, so_luot_danh_gia)
      VALUES 
        (1, 4, 'B1123456789', 'B2', 5, '30A-12345', 'Sedan', 'Trắng', 'Toyota', 4.8, 120),
        (2, 5, 'B2987654321', 'B2', 3, '51B-67890', 'SUV', 'Đen', 'Honda', 4.6, 85)
    `);

    // Thêm khuyến mãi mẫu
    console.log('Thêm khuyến mãi mẫu...');
    await connection.execute(`
      INSERT IGNORE INTO khuyen_mai (id, ma_khuyen_mai, ten_khuyen_mai, mo_ta, loai_khuyen_mai, gia_tri, gia_tri_toi_da, gia_tri_toi_thieu, ngay_bat_dau, ngay_ket_thuc, gioi_han_su_dung)
      VALUES 
        (1, 'WELCOME20', 'Giảm giá 20% cho khách hàng mới', 'Giảm giá 20% cho chuyến đi đầu tiên', 'phan_tram', 20.00, 50000.00, 50000.00, '2024-01-01', '2024-12-31', 1000),
        (2, 'FREESHIP', 'Miễn phí vận chuyển', 'Giảm 30,000 VND phí dịch vụ', 'so_tien', 30000.00, NULL, 100000.00, '2024-01-01', '2024-12-31', 500)
    `);



    // Thêm một số chuyến đi mẫu
    console.log('Thêm chuyến đi mẫu...');
    await connection.execute(`
      INSERT IGNORE INTO chuyen_di (id, khach_hang_id, tai_xe_id, diem_don, diem_den, khoang_cach, thoi_gian_du_kien, gia_cuoc, tong_tien, trang_thai, thoi_gian_dat, thoi_gian_don, thoi_gian_bat_dau, thoi_gian_ket_thuc)
      VALUES 
        (1, 2, 1, 'Sân bay Tân Sơn Nhất', 'Bitexco Financial Tower', 8.5, 25, 150000.00, 150000.00, 'hoan_thanh', '2024-10-01 08:00:00', '2024-10-01 08:05:00', '2024-10-01 08:15:00', '2024-10-01 08:40:00'),
        (2, 3, NULL, 'Vincom Center', 'Chợ Bến Thành', 3.2, 15, 75000.00, 75000.00, 'cho_tai_xe', '2024-10-08 14:30:00', NULL, NULL, NULL)
    `);

    // Thêm thanh toán mẫu
    console.log('Thêm thanh toán mẫu...');
    await connection.execute(`
      INSERT IGNORE INTO thanh_toan (id, chuyen_di_id, so_tien, phuong_thuc_thanh_toan, trang_thai, thoi_gian_thanh_toan, ma_giao_dich)
      VALUES 
        (1, 1, 150000.00, 'the_tin_dung', 'da_thanh_toan', '2024-10-01 08:45:00', 'TXN123456789')
    `);

    // Thêm đánh giá mẫu
    console.log('Thêm đánh giá mẫu...');
    await connection.execute(`
      INSERT IGNORE INTO danh_gia (id, chuyen_di_id, nguoi_danh_gia_id, diem_so, binh_luan, loai_danh_gia)
      VALUES 
        (1, 1, 2, 5, 'Tài xế lái xe rất an toàn và thân thiện. Xe sạch sẽ.', 'danh_gia_tai_xe'),
        (2, 1, 4, 4, 'Khách hàng lịch sự, đúng giờ.', 'danh_gia_khach_hang')
    `);

    // Cập nhật vị trí tài xế mẫu
    console.log('Cập nhật vị trí tài xế...');
    await connection.execute(`
      UPDATE tai_xe SET vi_tri_hien_tai = POINT(106.6297, 10.8231) WHERE id = 1
    `);
    await connection.execute(`
      UPDATE tai_xe SET vi_tri_hien_tai = POINT(106.7017, 10.7769) WHERE id = 2
    `);

    console.log('Hoàn thành thêm dữ liệu mẫu!');
    console.log('');
    console.log('Thông tin tài khoản mẫu:');
    console.log('Admin: admin@dc.com / 123456');
    console.log('Khách hàng 1: khachhang1@gmail.com / 123456');
    console.log('Khách hàng 2: khachhang2@gmail.com / 123456');
    console.log('Tài xế 1: taixe1@gmail.com / 123456');
    console.log('Tài xế 2: taixe2@gmail.com / 123456');
    
    await connection.end();
    
  } catch (error) {
    console.error('Lỗi khi thêm dữ liệu mẫu:', error.message);
  }
};

// Chạy script
seedData();