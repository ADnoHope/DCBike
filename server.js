const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./config/google');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const { testConnection } = require('./config/database');
const setupSocket = require('./socket/socketHandler');
const TripAutoCancel = require('./services/TripAutoCancel');

const app = express();
const httpServer = http.createServer(app);
const io = socketIO(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'dcbike-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/admin.html', (req, res, next) => {
  if (req.query && req.query.allow === '1') return next();

  // Gatekeeper HTML
  return res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Checking access...</title>
      </head>
      <body>
        <p>Đang kiểm tra quyền truy cập...</p>
        <script>
          (async function(){
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                // no token -> redirect to login
                window.location.href = '/index.html';
                return;
              }

              const res = await fetch('/api/auth/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
              });

              if (!res.ok) {
                window.location.href = '/index.html';
                return;
              }

              const data = await res.json();
              // AuthController.getProfile returns user in data.data or similar
              const user = data && (data.data || data.user || data);
              if (user && user.loai_tai_khoan === 'admin') {
                // allow: reload admin.html through static with allow=1
                const nextUrl = '/admin.html?allow=1';
                window.location.href = nextUrl;
              } else {
                alert('Bạn không có quyền truy cập trang này');
                window.location.href = '/index.html';
              }
            } catch (e) {
              console.error('Gatekeeper error', e);
              window.location.href = '/index.html';
            }
          })();
        </script>
      </body>
    </html>
  `);
});


app.get('/*.html', (req, res, next) => {
  const publicPages = ['/index.html', '/', '/driver-registration.html', '/views/booking.html'];
  const reqPath = req.path;

  if (publicPages.includes(reqPath) || (req.query && req.query.allow === '1')) {
    return next();
  }

  return res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Checking access...</title>
      </head>
      <body>
        <p>Đang kiểm tra quyền truy cập...</p>
        <script>
          (async function(){
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                // no token -> redirect to home (login available there)
                window.location.href = '/index.html';
                return;
              }

              const res = await fetch('/api/auth/profile', {
                headers: { 'Authorization': 'Bearer ' + token }
              });

              if (!res.ok) {
                window.location.href = '/index.html';
                return;
              }

              // If profile is ok, reload the original page with allow=1
              // Preserve existing query parameters
              const params = new URLSearchParams(location.search);
              params.set('allow', '1');
              const nextUrl = location.pathname + '?' + params.toString() + (location.hash || '');
              window.location.href = nextUrl;
            } catch (e) {
              console.error('Gatekeeper error', e);
              window.location.href = '/index.html';
            }
          })();
        </script>
      </body>
    </html>
  `);
});

testConnection();

setupSocket(io);
global.io = io;

// Routes
app.use('/api/auth', require('./routes/auth'));

// Protect API routes (require valid token) - /api/auth remains public
const { authenticate } = require('./middleware/auth');

app.use('/api/trips', authenticate, require('./routes/trips'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/reviews', authenticate, require('./routes/reviews'));
app.use('/api/revenue', authenticate, require('./routes/revenue'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/admin', authenticate, require('./routes/admin'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/feedback', require('./routes/feedback'));

app.use(express.static(path.join(__dirname, 'public')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DC Car Booking API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Lỗi hệ thống'
  });
});

// Start server
const server = httpServer.listen(PORT, () => {
  console.log(`🚗 DC Car Booking Server đang chạy tại http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket (Socket.IO) tại ws://localhost:${PORT}`);
  
  // Khởi động service tự động hủy chuyến đi
  // Kiểm tra mỗi 5 phút
  const autoCancelInterval = TripAutoCancel.startAutoCancel(5);
  console.log(`⏰ Auto-cancel service started (checking every 5 minutes)`);
  
  // Cleanup khi server shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM signal received: closing HTTP server');
    TripAutoCancel.stopAutoCancel(autoCancelInterval);
    server.close(() => {
      console.log('👋 HTTP server closed');
    });
  });
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(` Port ${PORT} đã được sử dụng. Hãy dừng tiến trình khác hoặc đổi PORT.`);
    process.exit(1);
  }
  console.error('Unhandled server error:', err);
  process.exit(1);
});

module.exports = app;