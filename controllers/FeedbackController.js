const Feedback = require('../models/Feedback');
const EmailService = require('../services/EmailService');

class FeedbackController {
  // User gửi feedback
  static async createFeedback(req, res) {
    try {
      const { email, ten_nguoi_gui, tieu_de, noi_dung } = req.body;

      // Validation
      if (!email || !ten_nguoi_gui || !tieu_de || !noi_dung) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ'
        });
      }

      const user_id = req.user ? req.user.id : null;

      const result = await Feedback.create({
        user_id,
        email,
        ten_nguoi_gui,
        tieu_de,
        noi_dung
      });

      res.status(201).json({
        success: true,
        message: 'Gửi phản hồi thành công! Chúng tôi sẽ trả lời bạn qua email sớm nhất.',
        data: { id: result.id }
      });
    } catch (error) {
      console.error('Create feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi phản hồi'
      });
    }
  }

  // Admin: Lấy danh sách feedback
  static async getAllFeedback(req, res) {
    try {
      const { status, limit = 50, page = 1 } = req.query;
      const offset = (page - 1) * limit;

      const feedbacks = await Feedback.getAll({
        status,
        limit: parseInt(limit),
        offset
      });

      const stats = await Feedback.getStatistics();

      res.json({
        success: true,
        data: feedbacks,
        statistics: stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Get all feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách phản hồi'
      });
    }
  }

  // Admin: Lấy chi tiết feedback
  static async getFeedbackById(req, res) {
    try {
      const { id } = req.params;

      const feedback = await Feedback.getById(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phản hồi'
        });
      }

      // Tự động đánh dấu đã đọc nếu chưa đọc
      if (feedback.trang_thai === 'chua_doc') {
        await Feedback.markAsRead(id);
        feedback.trang_thai = 'da_doc';
      }

      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      console.error('Get feedback by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết phản hồi'
      });
    }
  }

  // Admin: Trả lời feedback
  static async replyFeedback(req, res) {
    try {
      const { id } = req.params;
      const { reply } = req.body;
      const admin_id = req.user.id;

      if (!reply || reply.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập nội dung trả lời'
        });
      }

      // Lấy thông tin feedback
      const feedback = await Feedback.getById(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phản hồi'
        });
      }

      // Cập nhật trả lời vào database
      const updated = await Feedback.reply(id, admin_id, reply);

      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật trả lời'
        });
      }

      // Gửi email trả lời cho user
      try {
        await EmailService.sendFeedbackReply(
          feedback.email,
          feedback.ten_nguoi_gui,
          feedback.tieu_de,
          feedback.noi_dung,
          reply
        );

        console.log(`✅ Đã gửi email trả lời feedback #${id} tới ${feedback.email}`);
      } catch (emailError) {
        console.error('Lỗi gửi email:', emailError);
        // Không fail request nếu gửi email lỗi
      }

      res.json({
        success: true,
        message: 'Đã trả lời feedback và gửi email thành công'
      });
    } catch (error) {
      console.error('Reply feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi trả lời phản hồi'
      });
    }
  }

  // User: Lấy feedback của mình
  static async getMyFeedback(req, res) {
    try {
      const userId = req.user.id;
      const feedbacks = await Feedback.getByUserId(userId);

      res.json({
        success: true,
        data: feedbacks
      });
    } catch (error) {
      console.error('Get my feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách phản hồi của bạn'
      });
    }
  }

  // Admin: Xóa feedback
  static async deleteFeedback(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Feedback.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phản hồi'
        });
      }

      res.json({
        success: true,
        message: 'Đã xóa phản hồi'
      });
    } catch (error) {
      console.error('Delete feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa phản hồi'
      });
    }
  }

  // Lấy số lượng feedback chưa đọc (cho admin badge)
  static async getUnreadCount(req, res) {
    try {
      const count = await Feedback.countUnread();

      res.json({
        success: true,
        count
      });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy số lượng phản hồi chưa đọc'
      });
    }
  }
}

module.exports = FeedbackController;
