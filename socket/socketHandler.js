const jwt = require('jsonwebtoken');
const userSockets = new Map();

module.exports = function setupSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Token không được cung cấp'));
      }
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret);
      socket.userId = decoded.id;
      socket.userRole = decoded.loai_tai_khoan;
      socket.email = decoded.email;
      
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Token không hợp lệ'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} (${socket.userRole}) connected with socket id: ${socket.id}`);
    userSockets.set(socket.userId, socket.id);
    socket.join(`user-${socket.userId}`);
    socket.join(`role-${socket.userRole}`);
    
    console.log(`Room assignments: user-${socket.userId}, role-${socket.userRole}`);
    socket.broadcast.emit('user-online', {
      userId: socket.userId,
      userRole: socket.userRole
    });
    socket.on('listen-new-trips', () => {
      console.log(`Driver ${socket.userId} listening for new trips`);
    });
    socket.on('listen-trip-updates', (tripId) => {
      socket.join(`trip-${tripId}`);
      console.log(`User ${socket.userId} listening to trip ${tripId}`);
    });
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      userSockets.delete(socket.userId);
      
      socket.broadcast.emit('user-offline', {
        userId: socket.userId
      });
    });
    socket.on('error', (error) => {
      console.error('Socket error for user', socket.userId, ':', error);
    });
  });
  global.sendNotificationToUser = (userId, eventName, data) => {
    io.to(`user-${userId}`).emit(eventName, data);
    console.log(`📨 Sent ${eventName} to user ${userId}:`, data);
  };
  global.notifyDriversByVehicleType = async (eventName, data, loai_xe) => {
    const Driver = require('../models/Driver');
    
    try {
      const matchingDrivers = await Driver.findDriversByVehicleType(loai_xe);
      
      if (matchingDrivers && matchingDrivers.length > 0) {
        matchingDrivers.forEach(driver => {
          const userId = driver.nguoi_dung_id;
          io.to(`user-${userId}`).emit(eventName, data);
        });
        
        console.log(`Sent ${eventName} to ${matchingDrivers.length} drivers with vehicle type: ${loai_xe}`);
      } else {
        console.log(`No drivers found with vehicle type: ${loai_xe}`);
      }
    } catch (error) {
      console.error('Error notifying drivers by vehicle type:', error);
    }
  };
  global.notifyAllDrivers = (eventName, data) => {
    io.to('role-tai_xe').emit(eventName, data);
    io.to('role-driver').emit(eventName, data);
    console.log(`Broadcast ${eventName} to all drivers:`, data);
  };
  global.notifyRoom = (roomName, eventName, data) => {
    io.to(roomName).emit(eventName, data);
    console.log(`Sent ${eventName} to room ${roomName}:`, data);
  };

  return {
    userSockets,
    sendNotificationToUser: global.sendNotificationToUser,
    notifyAllDrivers: global.notifyAllDrivers,
    notifyRoom: global.notifyRoom
  };
};
