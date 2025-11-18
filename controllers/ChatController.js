const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { pool } = require('../config/database');

class ChatController {
  // Khách hàng gửi yêu cầu trò chuyện tới tài xế (driver user id hoặc tai_xe table id?)
  static async requestConversation(req, res) {
    try {
      const user = req.user; // authenticated user (nguoi_dung)
      const { tai_xe_id, chuyen_di_id } = req.body; // tai_xe_id: id trong bảng tai_xe
      if (!tai_xe_id) {
        return res.status(400).json({ success: false, message: 'thiếu tai_xe_id' });
      }
      if (user.loai_tai_khoan !== 'khach_hang') {
        return res.status(403).json({ success: false, message: 'Chỉ khách hàng mới gửi yêu cầu chat' });
      }

      const convo = await Conversation.createRequest({ khach_hang_id: user.id, tai_xe_id, chuyen_di_id });
      return res.json({ success: true, data: convo, message: 'Yêu cầu trò chuyện đã được tạo (pending)' });
    } catch (error) {
      console.error('requestConversation error', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // Tài xế chấp nhận yêu cầu
  static async acceptConversation(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      if (user.loai_tai_khoan !== 'tai_xe') {
        return res.status(403).json({ success: false, message: 'Chỉ tài xế mới chấp nhận chat' });
      }

      // Lấy tai_xe table id từ user (find driver's record)
      const [driverRows] = await pool.execute('SELECT id FROM tai_xe WHERE nguoi_dung_id=?', [user.id]);
      if (!driverRows.length) return res.status(400).json({ success: false, message: 'Không tìm thấy hồ sơ tài xế' });
      const tai_xe_id = driverRows[0].id;

      const convo = await Conversation.accept(id, tai_xe_id);
      if (!convo) return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });
      return res.json({ success: true, data: convo, message: 'Đã chấp nhận cuộc trò chuyện' });
    } catch (error) {
      console.error('acceptConversation error', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // Gửi tin nhắn
  static async sendMessage(req, res) {
    try {
      const user = req.user;
      const { id } = req.params; // conversation id
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Nội dung trống' });
      }

      const convo = await Conversation.findById(id);
      if (!convo) return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });
      if (convo.trang_thai !== 'active') {
        return res.status(400).json({ success: false, message: 'Cuộc trò chuyện chưa active' });
      }

      // Kiểm tra quyền tham gia
      const [driverRows] = await pool.execute('SELECT id, nguoi_dung_id FROM tai_xe WHERE id=?', [convo.tai_xe_id]);
      const driverUserId = driverRows.length ? driverRows[0].nguoi_dung_id : null;
      if (![convo.khach_hang_id, driverUserId].includes(user.id)) {
        return res.status(403).json({ success: false, message: 'Không thuộc cuộc trò chuyện này' });
      }

      const messageId = await Message.send({ cuoc_tro_chuyen_id: convo.id, nguoi_gui_id: user.id, noi_dung: message.trim() });
      return res.json({ success: true, data: { id: messageId }, message: 'Đã gửi tin nhắn' });
    } catch (error) {
      console.error('sendMessage error', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // Lấy danh sách tin nhắn
  static async getMessages(req, res) {
    try {
      const user = req.user;
      const { id } = req.params; // conversation id
      const { after } = req.query; // after message id for incremental polling

      const convo = await Conversation.findById(id);
      if (!convo) return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });

      const [driverRows] = await pool.execute('SELECT id, nguoi_dung_id FROM tai_xe WHERE id=?', [convo.tai_xe_id]);
      const driverUserId = driverRows.length ? driverRows[0].nguoi_dung_id : null;
      if (![convo.khach_hang_id, driverUserId].includes(user.id)) {
        return res.status(403).json({ success: false, message: 'Không thuộc cuộc trò chuyện này' });
      }

      const messages = await Message.list({ cuoc_tro_chuyen_id: convo.id, afterId: after ? Number(after) : null });
      // Mark read for recipient
      await Message.markRead({ cuoc_tro_chuyen_id: convo.id, userId: user.id });
      return res.json({ success: true, data: messages });
    } catch (error) {
      console.error('getMessages error', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // Danh sách cuộc trò chuyện của user
  static async listConversations(req, res) {
    try {
      const user = req.user;
      const rows = await Conversation.listByUser(user.id);
      return res.json({ success: true, data: rows });
    } catch (error) {
      console.error('listConversations error', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // Kết thúc cuộc trò chuyện
  static async endConversation(req, res) {
    try {
      const user = req.user;
      const { id } = req.params;
      const convo = await Conversation.findById(id);
      if (!convo) return res.status(404).json({ success: false, message: 'Không tìm thấy cuộc trò chuyện' });

      const [driverRows] = await pool.execute('SELECT id, nguoi_dung_id FROM tai_xe WHERE id=?', [convo.tai_xe_id]);
      const driverUserId = driverRows.length ? driverRows[0].nguoi_dung_id : null;
      if (![convo.khach_hang_id, driverUserId].includes(user.id)) {
        return res.status(403).json({ success: false, message: 'Không thuộc cuộc trò chuyện này' });
      }

      const ended = await Conversation.end(id, user.id);
      return res.json({ success: true, data: ended, message: 'Đã kết thúc cuộc trò chuyện' });
    } catch (error) {
      console.error('endConversation error', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = ChatController;
