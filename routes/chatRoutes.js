// routes/chatRoutes.js
// ============================================================
//  REST endpoints for In-App Chat
//  All routes are protected — user must be logged in (JWT).
//
//  POST   /api/chat/conversations                    — start or get a conversation
//  GET    /api/chat/conversations                    — get inbox (all conversations)
//  GET    /api/chat/conversations/:convId/messages   — get messages in a conversation
//  POST   /api/chat/conversations/:convId/messages   — send a message (REST fallback)
// ============================================================

const express        = require('express');
const router         = express.Router();
const ChatController = require('../controllers/chatControllers');
const { authenticate } = require('../middleware/auth');
const router = require("express").Router();
const chatController = require("../controllers/chatControllers");

router.post("/send", chatController.sendMessage);

module.exports = router;

// All chat routes require a valid JWT token
router.use(authenticate);

// Start or retrieve an existing conversation
router.post('/conversations',                           ChatController.startConversation);

// Get all conversations for the logged-in user (inbox)
router.get('/conversations',                            ChatController.getInbox);

// Get all messages inside a specific conversation
router.get('/conversations/:convId/messages',           ChatController.getMessages);

// Send a message via REST (Socket.IO is the real-time path; this is the fallback)
router.post('/conversations/:convId/messages',          ChatController.sendMessage);

module.exports = router;
