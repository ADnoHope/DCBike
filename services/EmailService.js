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
      console.warn('Email service chưa được cấu hình. Vui lòng thêm EMAIL_USER và EMAIL_PASSWORD vào file .env');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
      console.log('Email service đã được cấu hình');
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
        from: `"DC Booking" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Chào mừng bạn đến với DC Booking! ',
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
                <h1>Chào mừng đến với DC Booking!</h1>
              </div>
              <div class="content">
                <h2>Xin chào ${userName}!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản DC Booking bằng Google. Chúng tôi rất vui được chào đón bạn!</p>
                
                <p><strong>Thông tin tài khoản:</strong></p>
                <ul>
                  <li>Email: ${userEmail}</li>
                  <li>Loại tài khoản: Khách hàng</li>
                  <li>Trạng thái: Đã kích hoạt</li>
                </ul>

                <p>Bạn có thể bắt đầu sử dụng dịch vụ của chúng tôi ngay bây giờ:</p>
                <ul>
                  <li>Đặt xe nhanh chóng</li>
                  <li>Theo dõi chuyến đi realtime</li>
                  <li>Đánh giá và phản hồi</li>
                  <li>Quản lý lịch sử chuyến đi</li>
                </ul>

                <a href="http://localhost:3000" class="button">Bắt đầu đặt xe ngay</a>

                <p style="margin-top: 30px;">Nếu bạn muốn trở thành tài xế, vui lòng đăng ký tài xế trong phần hồ sơ cá nhân.</p>
              </div>
              <div class="footer">
                <p>© 2025 DC Booking. Tất cả quyền được bảo lưu.</p>
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

  // Gửi email mã xác nhận reset mật khẩu
  async sendPasswordResetEmail(userEmail, userName, resetCode) {
    if (!this.isConfigured) {
      console.log('Email service chưa cấu hình, bỏ qua gửi email');
      return;
    }

    try {
      const mailOptions = {
        from: `"DC Booking" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Mã xác nhận đặt lại mật khẩu - DC Booking',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .code-box { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
              .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Đặt lại mật khẩu</h1>
              </div>
              <div class="content">
                <h2>Xin chào ${userName}!</h2>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                
                <p>Mã xác nhận của bạn là:</p>
                <div class="code-box">
                  <div class="code">${resetCode}</div>
                </div>

                <p><strong>Mã này có hiệu lực trong 15 phút.</strong></p>

                <div class="warning">
                  <strong>Lưu ý bảo mật:</strong>
                  <ul style="margin: 10px 0 0 0;">
                    <li>Không chia sẻ mã này với bất kỳ ai</li>
                    <li>DC Booking không bao giờ yêu cầu mã qua điện thoại</li>
                    <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                  </ul>
                </div>

                <p style="margin-top: 30px; color: #666;">Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
              </div>
              <div class="footer">
                <p>© 2025 DC Booking. Tất cả quyền được bảo lưu.</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Đã gửi mã reset mật khẩu đến ${userEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email reset mật khẩu:', error);
      throw error;
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
        from: `"DC Booking" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Đã nhận đơn đăng ký tài xế - DC Booking',
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
                <h1>Đơn đăng ký tài xế đã được gửi</h1>
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
                <p>© 2025 DC Booking. Tất cả quyền được bảo lưu.</p>
                <p>Nếu có thắc mắc, vui lòng liên hệ: support@dcbooking.com</p>
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
        from: `"DC Booking" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Chúc mừng! Đơn đăng ký tài xế đã được phê duyệt - DC Booking',
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
                <h1>Chúc mừng ${userName}!</h1>
                <p style="font-size: 18px; margin: 10px 0;">Đơn đăng ký tài xế đã được PHÊ DUYỆT</p>
              </div>
              <div class="content">
                <div class="success-box">
                  <h3 style="margin-top: 0;">Bạn đã chính thức trở thành tài xế DC Booking!</h3>
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
                  <strong>Mẹo:</strong> Duy trì đánh giá cao từ khách hàng để nhận được nhiều chuyến hơn và ưu tiên trong hệ thống!
                </p>
              </div>
              <div class="footer">
                <p>© 2025 DC Booking. Tất cả quyền được bảo lưu.</p>
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
        from: `"DC Booking" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Thông báo về đơn đăng ký tài xế - DC Booking',
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
                <p>Cảm ơn bạn đã quan tâm đến việc trở thành tài xế DC Booking. Sau khi xem xét kỹ lưỡng, 
                chúng tôi rất tiếc phải thông báo rằng đơn đăng ký của bạn chưa được chấp thuận lúc này.</p>
                
                <div class="reason-box">
                  <strong>Lý do:</strong>
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
                <p>© 2025 DC Booking. Tất cả quyền được bảo lưu.</p>
                <p>Email hỗ trợ: support@dcbooking.com | Hotline: 1900-6789</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Đã gửi email từ chối tài xế đến ${userEmail}`);
    } catch (error) {
      console.error('Lỗi khi gửi email từ chối:', error);
    }
  }

  // Gửi email trả lời feedback từ admin
  async sendFeedbackReply(userEmail, userName, feedbackTitle, feedbackContent, adminReply) {
    if (!this.isConfigured) {
      console.log('Email service chưa cấu hình, bỏ qua gửi email');
      return;
    }

    try {
      const currentDate = new Date().toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const mailOptions = {
        from: `"DC Booking Support" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `Re: ${feedbackTitle} - DC Booking Đã Trả Lời Phản Hồi Của Bạn`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 650px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
              .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
              .content { padding: 40px 30px; background: #ffffff; }
              .greeting { font-size: 16px; margin-bottom: 20px; }
              .greeting strong { color: #667eea; }
              .info-text { color: #666; margin-bottom: 25px; line-height: 1.8; }
              .feedback-box { background: #f8f9ff; padding: 25px; border-left: 5px solid #667eea; margin: 25px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
              .feedback-box h3 { color: #667eea; margin-top: 0; margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 8px; }
              .feedback-title { font-weight: 600; color: #333; margin-bottom: 8px; }
              .feedback-content { color: #555; line-height: 1.8; }
              .reply-box { background: linear-gradient(to right, #e8f5e9 0%, #f1f8f4 100%); padding: 25px; border-left: 5px solid #4caf50; margin: 25px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
              .reply-box h3 { color: #2e7d32; margin-top: 0; margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 8px; }
              .reply-content { color: #333; line-height: 1.8; white-space: pre-wrap; }
              .divider { height: 1px; background: linear-gradient(to right, transparent, #ddd, transparent); margin: 30px 0; }
              .cta-box { text-align: center; margin: 30px 0; }
              .button { display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: all 0.3s; }
              .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
              .footer-note { background: #f8f9fa; padding: 20px; text-align: center; color: #666; line-height: 1.8; margin-top: 20px; border-radius: 8px; }
              .footer { background: #2c3e50; color: #ecf0f1; padding: 30px; text-align: center; }
              .footer p { margin: 8px 0; font-size: 13px; }
              .footer a { color: #667eea; text-decoration: none; }
              .timestamp { color: #999; font-size: 12px; text-align: right; margin-top: 10px; font-style: italic; }
              .icon { font-size: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✉️ Phản Hồi Từ DC Booking</h1>
                <p>Chúng tôi đã trả lời phản hồi của bạn</p>
              </div>
              
              <div class="content">
                <div class="greeting">
                  Xin chào <strong>${userName}</strong>,
                </div>
                
                <p class="info-text">
                  Cảm ơn bạn đã dành thời gian gửi phản hồi cho DC Booking. 
                  Ý kiến của bạn rất quan trọng và giúp chúng tôi cải thiện dịch vụ tốt hơn mỗi ngày. 
                  Chúng tôi đã xem xét kỹ lưỡng và có câu trả lời dành cho bạn:
                </p>

                <div class="feedback-box">
                  <h3><span class="icon">📝</span> Phản hồi của bạn</h3>
                  <div class="feedback-title">Tiêu đề: ${feedbackTitle}</div>
                  <div class="feedback-content">${feedbackContent}</div>
                  <div class="timestamp">Đã gửi: ${currentDate}</div>
                </div>

                <div class="reply-box">
                  <h3><span class="icon">💬</span> Phản hồi từ đội ngũ DC Booking</h3>
                  <div class="reply-content">${adminReply}</div>
                </div>

                <div class="divider"></div>

                <div class="footer-note">
                  <strong>📌 Lưu ý:</strong><br>
                  Nếu bạn còn bất kỳ thắc mắc nào hoặc cần hỗ trợ thêm, 
                  vui lòng gửi phản hồi mới hoặc liên hệ trực tiếp với chúng tôi qua hotline.<br>
                  Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7!
                </div>

                <div class="cta-box">
                  <a href="http://localhost:3000" class="button">🚗 Tiếp tục sử dụng dịch vụ</a>
                </div>

                <p style="margin-top: 30px; color: #666;">
                  Trân trọng,<br>
                  <strong style="color: #667eea;">Đội ngũ hỗ trợ DC Booking</strong>
                </p>
              </div>

              <div class="footer">
                <p style="font-size: 16px; margin-bottom: 15px;">
                  <strong>DC Booking</strong> - Hệ thống đặt xe hàng đầu Việt Nam
                </p>
                <p>📧 Email: support@dcbooking.com | 📞 Hotline: 1900-6789</p>
                <p>🌐 Website: <a href="http://localhost:3000">dcbooking.com</a></p>
                <p style="margin-top: 20px; opacity: 0.8;">© 2025 DC Booking. Tất cả quyền được bảo lưu.</p>
                <p style="font-size: 11px; opacity: 0.7; margin-top: 15px;">
                  Email này được gửi tự động từ hệ thống DC Booking. Vui lòng không trả lời trực tiếp email này.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Đã gửi email trả lời feedback đến ${userEmail}`);
    } catch (error) {
      console.error('❌ Lỗi khi gửi email trả lời feedback:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
