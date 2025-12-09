// Test Real-time Notifications Locally
// Chạy code này trong browser console để test

console.log('=== Real-time Notification Test Suite ===\n');

// Test 1: Check Socket.IO connection
console.log('TEST 1: Socket.IO Connection');
console.log('---');
console.log('✓ Socket.IO connected:', realtimeNotifications.isConnected);
console.log('✓ Socket instance:', realtimeNotifications.socket ? 'EXISTS' : 'NOT FOUND');
console.log('✓ Current notifications:', realtimeNotifications.notifications.length);
console.log('✓ Unread count:', realtimeNotifications.unreadCount);
console.log('');

// Test 2: Manually add notification
console.log('TEST 2: Add Manual Notification');
console.log('---');
realtimeNotifications.addNotification({
  id: 'test-1',
  type: 'new-trip',
  title: 'Test Notification',
  message: 'This is a test notification from console',
  icon: '<i class="fas fa-car text-warning"></i>',
  timestamp: new Date(),
  actionUrl: '#'
});
console.log('✓ Notification added');
console.log('✓ Total notifications:', realtimeNotifications.notifications.length);
console.log('✓ Unread count:', realtimeNotifications.unreadCount);
console.log('');

// Test 3: Play notification sound
console.log('TEST 3: Notification Sound');
console.log('---');
console.log('Attempting to play notification sound...');
realtimeNotifications.playNotificationSound();
console.log('✓ Sound playback triggered');
console.log('');

// Test 4: Show desktop notification
console.log('TEST 4: Desktop Notification');
console.log('---');
console.log('Desktop notification permission:', Notification.permission);
realtimeNotifications.showDesktopNotification(
  'Test Notification',
  'This is a test desktop notification'
);
console.log('✓ Desktop notification triggered');
console.log('');

// Test 5: Check user info
console.log('TEST 5: User Information');
console.log('---');
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('✓ User ID:', user.id || 'NOT SET');
console.log('✓ User Role:', user.loai_tai_khoan || 'NOT SET');
console.log('✓ Email:', user.email || 'NOT SET');
console.log('✓ Token exists:', !!token);
console.log('');

// Test 6: Simulate new trip event
console.log('TEST 6: Simulate New Trip Event');
console.log('---');
if (realtimeNotifications.socket) {
  realtimeNotifications.socket.emit('listen-new-trips');
  console.log('✓ Emitted: listen-new-trips');
  
  // Simulate incoming event
  setTimeout(() => {
    realtimeNotifications.socket.emit('new-trip-available', {
      tripId: 999,
      khach_hang_id: 123,
      diem_don: 'Test Pickup Location',
      diem_den: 'Test Destination',
      gia_cuoc: 75000,
      khoang_cach: 5.5,
      thoi_gian_du_kien: 15,
      message: 'Test new trip notification'
    });
    console.log('✓ Simulated: new-trip-available event');
  }, 500);
} else {
  console.log('✗ Socket not connected');
}
console.log('');

// Test 7: Get all notifications
console.log('TEST 7: Current Notifications List');
console.log('---');
realtimeNotifications.notifications.forEach((notif, idx) => {
  console.log(`${idx + 1}. [${notif.type}] ${notif.title}`);
  console.log(`   Message: ${notif.message}`);
  console.log(`   Time: ${realtimeNotifications.formatTime(notif.timestamp)}`);
});
console.log('');

// Test 8: Connection status
console.log('TEST 8: Connection Status');
console.log('---');
realtimeNotifications.showConnectionStatus('connected');
console.log('✓ Connection status indicator shown');
console.log('');

// Utility functions
console.log('=== UTILITY FUNCTIONS ===\n');

console.log('Usage Examples:');
console.log('');

console.log('1. Add notification manually:');
console.log('   realtimeNotifications.addNotification({');
console.log('     id: "test-2",');
console.log('     type: "trip-accepted",');
console.log('     title: "Trip Accepted",');
console.log('     message: "Driver accepted your trip",');
console.log('     icon: \'<i class="fas fa-check-circle text-success"></i>\',');
console.log('     timestamp: new Date(),');
console.log('     actionUrl: "/views/booking.html"');
console.log('   })');
console.log('');

console.log('2. Clear all notifications:');
console.log('   realtimeNotifications.clearAll()');
console.log('');

console.log('3. Mark notification as read:');
console.log('   realtimeNotifications.markAsRead("notification-id")');
console.log('');

console.log('4. Check connection status:');
console.log('   console.log(realtimeNotifications.isConnected)');
console.log('');

console.log('5. View all notifications:');
console.log('   console.log(realtimeNotifications.notifications)');
console.log('');

console.log('6. Get unread count:');
console.log('   console.log(realtimeNotifications.unreadCount)');
console.log('');

console.log('7. Emit custom event to server:');
console.log('   realtimeNotifications.socket.emit("event-name", {data})');
console.log('');

console.log('=== END TEST SUITE ===');
