const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/ChatController');
const { authenticate } = require('../middleware/auth');

// All chat routes require authentication
router.use(authenticate);

// Request conversation (customer -> driver)
router.post('/request', ChatController.requestConversation);
// Accept conversation (driver)
router.post('/accept/:id', ChatController.acceptConversation);
// Send message
router.post('/send/:id', ChatController.sendMessage);
// Get messages
router.get('/messages/:id', ChatController.getMessages);
// List conversations for user
router.get('/conversations', ChatController.listConversations);
// End conversation
router.post('/end/:id', ChatController.endConversation);

module.exports = router;
