const db = require('../config/db');

const ChatModel = {

  // ── Get or create a conversation between two users ───────────
  // A conversation is always tied to a buyer + seller (+ optionally a listing)
  getOrCreateConversation: (buyerId, sellerId, listingId, callback) => {
    const findSql = `
      SELECT * FROM conversations
      WHERE buyer_id = ? AND seller_id = ?
        AND (listing_id = ? OR (listing_id IS NULL AND ? IS NULL))
      LIMIT 1`;

    db.query(findSql, [buyerId, sellerId, listingId, listingId], (err, rows) => {
      if (err) return callback(err);

      // Already exists — return it
      if (rows.length > 0) return callback(null, rows[0]);

      // Create new conversation
      const createSql = `
        INSERT INTO conversations (buyer_id, seller_id, listing_id)
        VALUES (?, ?, ?)`;
      db.query(createSql, [buyerId, sellerId, listingId || null], (err2, result) => {
        if (err2) return callback(err2);
        // Fetch the freshly created row
        db.query('SELECT * FROM conversations WHERE conversation_id = ?',
          [result.insertId], (err3, newRows) => {
            if (err3) return callback(err3);
            callback(null, newRows[0]);
          }
        );
      });
    });
  },

  // ── Get all conversations for a user (inbox) ─────────────────
  getConversationsForUser: (userId, callback) => {
    const sql = `
      SELECT
        c.conversation_id,
        c.listing_id,
        c.last_message_at,
        -- the other person's info
        IF(c.buyer_id = ?, c.seller_id, c.buyer_id)   AS other_user_id,
        IF(c.buyer_id = ?, s.full_name, b.full_name)   AS other_user_name,
        IF(c.buyer_id = ?, s.profile_picture, b.profile_picture) AS other_user_avatar,
        -- the listing title (if linked)
        l.title AS listing_title,
        -- last message preview
        (SELECT content FROM messages
         WHERE conversation_id = c.conversation_id
         ORDER BY created_at DESC LIMIT 1)             AS last_message,
        -- unread count (messages NOT sent by me that I haven't read)
        (SELECT COUNT(*) FROM messages
         WHERE conversation_id = c.conversation_id
           AND sender_id != ?
           AND is_read = FALSE)                        AS unread_count
      FROM conversations c
      JOIN users b  ON b.user_id = c.buyer_id
      JOIN users s  ON s.user_id = c.seller_id
      LEFT JOIN listings l ON l.listing_id = c.listing_id
      WHERE c.buyer_id = ? OR c.seller_id = ?
      ORDER BY c.last_message_at DESC`;

    db.query(sql, [userId, userId, userId, userId, userId, userId], callback);
  },

  // ── Get all messages inside a conversation ────────────────────
  getMessages: (conversationId, callback) => {
    const sql = `
      SELECT
        m.message_id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.is_read,
        m.created_at,
        u.full_name        AS sender_name,
        u.profile_picture  AS sender_avatar
      FROM messages m
      JOIN users u ON u.user_id = m.sender_id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC`;
    db.query(sql, [conversationId], callback);
  },

  // ── Insert a new message ──────────────────────────────────────
  sendMessage: (conversationId, senderId, content, callback) => {
    const sql = `
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES (?, ?, ?)`;
    db.query(sql, [conversationId, senderId, content], (err, result) => {
      if (err) return callback(err);
      // Update the conversation's last_message_at timestamp
      db.query(
        'UPDATE conversations SET last_message_at = NOW() WHERE conversation_id = ?',
        [conversationId],
        () => {} // fire-and-forget
      );
      // Return the full inserted message row
      db.query(
        `SELECT m.*, u.full_name AS sender_name, u.profile_picture AS sender_avatar
         FROM messages m JOIN users u ON u.user_id = m.sender_id
         WHERE m.message_id = ?`,
        [result.insertId],
        callback
      );
    });
  },

  // ── Mark all messages in a conversation as read ───────────────
  // Only marks messages NOT sent by the reader (i.e. the ones they received)
  markAsRead: (conversationId, readerUserId, callback) => {
    const sql = `
      UPDATE messages
      SET is_read = TRUE
      WHERE conversation_id = ?
        AND sender_id != ?
        AND is_read = FALSE`;
    db.query(sql, [conversationId, readerUserId], callback);
  },

  // ── Check if a user is part of a conversation ─────────────────
  // Used to guard endpoints so users can't read others' messages
  isParticipant: (conversationId, userId, callback) => {
    const sql = `
      SELECT 1 FROM conversations
      WHERE conversation_id = ?
        AND (buyer_id = ? OR seller_id = ?)
      LIMIT 1`;
    db.query(sql, [conversationId, userId, userId], (err, rows) => {
      if (err) return callback(err, false);
      callback(null, rows.length > 0);
    });
  },

};

module.exports = ChatModel;
