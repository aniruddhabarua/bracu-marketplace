// controllers/chatControllers.js
// Handles all In-App Chat HTTP requests
// Real-time delivery is handled separately by socket.js (Socket.IO)
const ChatModel = require('../models/chatModels');
const Chat = require("../models/chatModels");
const Notification = require("../models/notificationModels");

// TEMP: replace with real auth later
const CURRENT_USER_ID = 1;

exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, message } = req.body;

    if (!receiver_id || !message) {
      return res.status(400).json({ error: "Missing data" });
    }

    await Chat.saveMessage(CURRENT_USER_ID, receiver_id, message);

    // 🔔 Create notification
    await Notification.createNotification(
      receiver_id,
      "New message received",
      "chat"
    );

    // ⚡ Real-time message
    if (global.io) {
      global.io.to(String(receiver_id)).emit("receive_message", {
        sender_id: CURRENT_USER_ID,
        message
      });

      global.io.to(String(receiver_id)).emit("new_notification", {
        message: "New message received"
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const ChatController = {

  // ── POST /api/chat/conversations ─────────────────────────────
  // Start or retrieve a conversation with a seller about a listing
  // Body: { seller_id, listing_id (optional) }
  startConversation: (req, res) => {
    const buyerId   = req.user.user_id;           // set by JWT middleware
    const sellerId  = parseInt(req.body.seller_id);
    const listingId = req.body.listing_id ? parseInt(req.body.listing_id) : null;

    if (!sellerId || isNaN(sellerId))
      return res.status(400).json({ success: false, message: 'seller_id is required.' });

    if (buyerId === sellerId)
      return res.status(400).json({ success: false, message: 'You cannot message yourself.' });

    ChatModel.getOrCreateConversation(buyerId, sellerId, listingId, (err, conversation) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });

      return res.status(200).json({
        success: true,
        message: 'Conversation ready.',
        data: conversation,
      });
    });
  },
  const Chat = require("../models/chatModels");

  exports.sendMessage = async (req, res) => {
    const { receiver_id, message } = req.body;
  
    const sender_id = 1; // TEMP FIX
  
    await Chat.saveMessage(sender_id, receiver_id, message);
  
    global.io.to(String(receiver_id)).emit("receive_message", {
      sender_id,
      message
    });
  
    res.json({ success: true });
  };
  // ── GET /api/chat/conversations ───────────────────────────────
  // Get all conversations (inbox) for the logged-in user
  getInbox: (req, res) => {
    const userId = 1; // TEMP FIX

    ChatModel.getConversationsForUser(userId, (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.', error: err.message });

      return res.status(200).json({
        success: true,
        data: rows,
      });
    });
  },

  // ── GET /api/chat/conversations/:convId/messages ──────────────
  // Get all messages in a conversation (only participants can read)
  getMessages: (req, res) => {
    const userId = 1; // TEMP FIX;
    const convId = parseInt(req.params.convId);

    if (isNaN(convId))
      return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });

    // Guard: only a participant can read messages
    ChatModel.isParticipant(convId, userId, (err, isMember) => {
      if (err)      return res.status(500).json({ success: false, message: 'Database error.' });
      if (!isMember) return res.status(403).json({ success: false, message: 'Access denied.' });

      ChatModel.getMessages(convId, (err2, messages) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.', error: err2.message });

        // Mark received messages as read
        ChatModel.markAsRead(convId, userId, () => {}); // fire-and-forget

        return res.status(200).json({
          success: true,
          data: messages,
        });
      });
    });
  },

  // ── POST /api/chat/conversations/:convId/messages ─────────────
  // Send a message (REST fallback; primary path is Socket.IO in socket.js)
  // Body: { content }
  sendMessage: (req, res) => {
    const userId  = req.user.user_id;
    const convId  = parseInt(req.params.convId);
    const content = (req.body.content || '').trim();

    if (isNaN(convId))    return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
    if (!content)         return res.status(400).json({ success: false, message: 'Message content is required.' });
    if (content.length > 2000) return res.status(400).json({ success: false, message: 'Message too long (max 2000 chars).' });

    // Guard: only a participant can send messages
    ChatModel.isParticipant(convId, userId, (err, isMember) => {
      if (err)       return res.status(500).json({ success: false, message: 'Database error.' });
      if (!isMember) return res.status(403).json({ success: false, message: 'Access denied.' });

      ChatModel.sendMessage(convId, userId, content, (err2, rows) => {
        if (err2) return res.status(500).json({ success: false, message: 'Database error.', error: err2.message });

        const message = rows[0];

        // If Socket.IO is available, emit to the conversation room in real time
        // (req.io is attached in server.js)
        if (req.io) {
          req.io.to(`conv:${convId}`).emit('new_message', message);
        }

        return res.status(201).json({
          success: true,
          message: 'Message sent.',
          data: message,
        });
      });
    });
  },

};

module.exports = ChatController;
