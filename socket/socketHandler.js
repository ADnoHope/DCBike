const jwt = require('jsonwebtoken');

// Store active connections: userId -> socket.id
const userSockets = new Map();

module.exports = function setupSocket(io) {
  // Middleware để authenticate socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Token không được cung cấp'));
      }

      // Verify JWT token
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret);
      
      // Attach user info to socket
      socket.userId = decoded.id;
      socket.userRole = decoded.loai_tai_khoan; // 'customer' hoặc 'driver' hoặc 'admin'
      socket.email = decoded.email;
      
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Token không hợp lệ'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} (${socket.userRole}) connected with socket id: ${socket.id}`);
    
    // Lưu mapping user -> socket.id
    userSockets.set(socket.userId, socket.id);
    
    // Join user vào room của mình (for targeting specific users)
    socket.join(`user-${socket.userId}`);
    socket.join(`role-${socket.userRole}`);
    
    console.log(`📍 Room assignments: user-${socket.userId}, role-${socket.userRole}`);
    
    // Broadcast online status
    socket.broadcast.emit('user-online', {
      userId: socket.userId,
      userRole: socket.userRole
    });

    // ========== NOTIFICATION EVENTS ==========

    /**
     * Khi customer tạo chuyến mới, server emit tới tất cả drivers
     * Event: 'new-trip-available'
     */
    socket.on('listen-new-trips', () => {
      console.log(`Driver ${socket.userId} listening for new trips`);
    });

    /**
     * Khi driver nhận chuyến
     * Event: 'trip-accepted'
     */
    socket.on('listen-trip-updates', (tripId) => {
      socket.join(`trip-${tripId}`);
      console.log(`User ${socket.userId} listening to trip ${tripId}`);
    });

    /**
     * Khi user (driver/customer) disconnect
     */
    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userId} disconnected`);
      userSockets.delete(socket.userId);
      
      socket.broadcast.emit('user-offline', {
        userId: socket.userId
      });
    });

    // ========== ERROR HANDLING ==========
    socket.on('error', (error) => {
      console.error('Socket error for user', socket.userId, ':', error);
    });
  });

  /**
   * Helper function để gửi notification tới specific user
   * Được gọi từ TripController
   */
  global.sendNotificationToUser = (userId, eventName, data) => {
    io.to(`user-${userId}`).emit(eventName, data);
    console.log(`📨 Sent ${eventName} to user ${userId}:`, data);
  };

  /**
   * Helper function để gửi notification tới tất cả drivers
   */
  global.notifyAllDrivers = (eventName, data) => {
    // Broadcast tới cả 'role-tai_xe' (Vietnamese) và 'role-driver' (English)
    io.to('role-tai_xe').emit(eventName, data);
    io.to('role-driver').emit(eventName, data);
    console.log(`📢 Broadcast ${eventName} to all drivers:`, data);
  };

  /**
   * Helper function để gửi notification tới room (e.g., trip room)
   */
  global.notifyRoom = (roomName, eventName, data) => {
    io.to(roomName).emit(eventName, data);
    console.log(`📣 Sent ${eventName} to room ${roomName}:`, data);
  };

  return {
    userSockets,
    sendNotificationToUser: global.sendNotificationToUser,
    notifyAllDrivers: global.notifyAllDrivers,
    notifyRoom: global.notifyRoom
  };
};
