const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Cấu hình transporter
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Kiểm tra cấu hình
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠ Email service chưa được cấu hình. Vui lòng thêm EMAIL_USER và EMAIL_PASSWORD vào file .env');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
      console.log('✓ Email service đã được cấu hình');
    }
  }

  // Gửi email chào mừng khi đăng ký bằng Google
  async sendWelcomeEmail(userEmail, userName) {
    if (!this.isConfigured) {
      console.log('Email service chưa cấu hình, bỏ qua gửi email');
      return;
    }

    try {
      const mailOptions = {
        from: `"DC Bike" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Chào mừng bạn đến với DC Bike! 🚗',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Chào mừng đến với DC Bike!</h1>
              </div>
              <div class="content">
                <h2>Xin chào ${userName}!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản DC Bike bằng Google. Chúng tôi rất vui được chào đón bạn!</p>
                
                <p><strong>Thông tin tài khoản:</strong></p>
                <ul>
                  <li>Email: ${userEmail}</li>
                  <li>Loại tài khoản: Khách hàng</li>
                  <li>Trạng thái: Đã kích hoạt</li>
                </ul>

                <p>Bạn có thể bắt đầu sử dụng dịch vụ của chúng tôi ngay bây giờ:</p>
                <ul>
                  <li>✅ Đặt xe nhanh chóng</li>
                  <li>✅ Theo dõi chuyến đi realtime</li>
                  <li>✅ Đánh giá và phản hồi</li>
                  <li>✅ Quản lý lịch sử chuyến đi</li>
                </ul>

                <a href="http://localhost:3000" class="button">Bắt đầu đặt xe ngay</a>

                <p style="margin-top: 30px;">Nếu bạn muốn trở thành tài xế, vui lòng đăng ký tài xế trong phần hồ sơ cá nhân.</p>
              </div>
              <div class="footer">
                <p>© 2025 DC Bike. Tất cả quyền được bảo lưu.</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✓ Đã gửi email chào mừng đến ${userEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email chào mừng:', error);
    }
  }

  // Gửi email xác nhận đăng ký tài xế
  async sendDriverRegistrationEmail(userEmail, userName, registrationData) {
    if (!this.isConfigured) {
      console.log('Email service chưa cấu hình, bỏ qua gửi email');
      return;
    }

    try {
      const mailOptions = {
        from: `"DC Bike" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Đã nhận đơn đăng ký tài xế - DC Bike 📋',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .info-box { background: white; padding: 15px; border-left: 4px solid #f5576c; margin: 15px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📋 Đơn đăng ký tài xế đã được gửi</h1>
              </div>
              <div class="content">
                <h2>Xin chào ${userName}!</h2>
                <p>Chúng tôi đã nhận được đơn đăng ký làm tài xế của bạn. Đơn của bạn đang được xem xét.</p>
                
                <div class="info-box">
                  <strong>Thông tin đăng ký:</strong>
                  <ul>
                    <li>Số bằng lái: ${registrationData.so_bang_lai}</li>
                    <li>Loại bằng lái: ${registrationData.loai_bang_lai}</li>
                    <li>Biển số xe: ${registrationData.bien_so_xe}</li>
                    <li>Loại xe: ${registrationData.loai_xe}</li>
                    <li>Số chỗ ngồi: ${registrationData.so_cho_ngoi}</li>
                  </ul>
                </div>

                <p><strong>Quy trình xét duyệt:</strong></p>
                <ol>
                  <li>Admin sẽ xem xét hồ sơ của bạn (1-2 ngày làm việc)</li>
                  <li>Kiểm tra tính hợp lệ của giấy tờ</li>
                  <li>Gửi kết quả phê duyệt qua email</li>
                </ol>

                <p>Bạn sẽ nhận được email thông báo kết quả sớm nhất. Cảm ơn bạn đã quan tâm!</p>

                <p style="margin-top: 30px; padding: 15px; background: #fffbea; border-left: 4px solid #ffc107;">
                  <strong>Lưu ý:</strong> Vui lòng đảm bảo tất cả thông tin bạn cung cấp là chính xác. 
                  Nếu cần chỉnh sửa, vui lòng liên hệ với chúng tôi.
                </p>
              </div>
              <div class="footer">
                <p>© 2025 DC Bike. Tất cả quyền được bảo lưu.</p>
                <p>Nếu có thắc mắc, vui lòng liên hệ: support@dcbike.com</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✓ Đã gửi email xác nhận đăng ký tài xế đến ${userEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email xác nhận đăng ký tài xế:', error);
    }
  }

  // Gửi email thông báo phê duyệt tài xế
  async sendDriverApprovalEmail(userEmail, userName, vehicleInfo) {
    if (!this.isConfigured) {
      console.log('Email service chưa cấu hình, bỏ qua gửi email');
      return;
    }

    try {
      const mailOptions = {
        from: `"DC Bike" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: '✅ Chúc mừng! Đơn đăng ký tài xế đã được phê duyệt - DC Bike',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success-box { background: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 15px 0; border-radius: 5px; }
              .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Chúc mừng ${userName}!</h1>
                <p style="font-size: 18px; margin: 10px 0;">Đơn đăng ký tài xế đã được PHÊ DUYỆT</p>
              </div>
              <div class="content">
                <div class="success-box">
                  <h3 style="margin-top: 0;">🎉 Bạn đã chính thức trở thành tài xế DC Bike!</h3>
                  <p>Hồ sơ của bạn đã được xem xét và chấp thuận. Bạn có thể bắt đầu nhận chuyến ngay bây giờ!</p>
                </div>

                <p><strong>Thông tin xe của bạn:</strong></p>
                <ul>
                  <li>Biển số xe: <strong>${vehicleInfo.bien_so_xe}</strong></li>
                  <li>Loại xe: ${vehicleInfo.loai_xe}</li>
                  <li>Hãng xe: ${vehicleInfo.hang_xe}</li>
                  <li>Màu xe: ${vehicleInfo.mau_xe}</li>
                  <li>Số chỗ ngồi: ${vehicleInfo.so_cho_ngoi}</li>
                </ul>

                <p><strong>Các bước tiếp theo:</strong></p>
                <ol>
                  <li>Đăng nhập vào trang quản lý tài xế</li>
                  <li>Cập nhật trạng thái sẵn sàng nhận chuyến</li>
                  <li>Bắt đầu nhận và hoàn thành chuyến đi</li>
                  <li>Tích lũy điểm đánh giá từ khách hàng</li>
                </ol>

                <a href="http://localhost:3000/views/driver-dashboard.html" class="button">Vào trang quản lý tài xế</a>

                <p style="margin-top: 30px; padding: 15px; background: #e7f3ff; border-left: 4px solid #2196F3;">
                  <strong>💡 Mẹo:</strong> Duy trì đánh giá cao từ khách hàng để nhận được nhiều chuyến hơn và ưu tiên trong hệ thống!
                </p>
              </div>
              <div class="footer">
                <p>© 2025 DC Bike. Tất cả quyền được bảo lưu.</p>
                <p>Chúc bạn có nhiều chuyến đi thuận lợi!</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✓ Đã gửi email phê duyệt tài xế đến ${userEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email phê duyệt:', error);
    }
  }

  // Gửi email thông báo từ chối tài xế
  async sendDriverRejectionEmail(userEmail, userName, reason) {
    if (!this.isConfigured) {
      console.log('Email service chưa cấu hình, bỏ qua gửi email');
      return;
    }

    try {
      const mailOptions = {
        from: `"DC Bike" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: '❌ Thông báo về đơn đăng ký tài xế - DC Bike',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .reason-box { background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 15px 0; border-radius: 5px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Thông báo về đơn đăng ký tài xế</h1>
              </div>
              <div class="content">
                <h2>Xin chào ${userName},</h2>
                <p>Cảm ơn bạn đã quan tâm đến việc trở thành tài xế DC Bike. Sau khi xem xét kỹ lưỡng, 
                chúng tôi rất tiếc phải thông báo rằng đơn đăng ký của bạn chưa được chấp thuận lúc này.</p>
                
                <div class="reason-box">
                  <strong>📋 Lý do:</strong>
                  <p style="margin: 10px 0 0 0;">${reason || 'Hồ sơ chưa đáp ứng đủ yêu cầu của chúng tôi.'}</p>
                </div>

                <p><strong>Bạn có thể làm gì tiếp theo?</strong></p>
                <ul>
                  <li>Kiểm tra lại thông tin và giấy tờ bạn đã cung cấp</li>
                  <li>Đảm bảo tất cả thông tin là chính xác và đầy đủ</li>
                  <li>Nộp đơn đăng ký lại sau khi đã khắc phục các vấn đề</li>
                  <li>Liên hệ với chúng tôi nếu cần hỗ trợ thêm</li>
                </ul>

                <a href="http://localhost:3000/views/profile.html" class="button">Cập nhật hồ sơ và đăng ký lại</a>

                <p style="margin-top: 30px;">Chúng tôi hy vọng có cơ hội hợp tác với bạn trong tương lai. 
                Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
              </div>
              <div class="footer">
                <p>© 2025 DC Bike. Tất cả quyền được bảo lưu.</p>
                <p>Email hỗ trợ: support@dcbike.com | Hotline: 1900-xxxx</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✓ Đã gửi email từ chối tài xế đến ${userEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email từ chối:', error);
    }
  }
}

module.exports = new EmailService();
