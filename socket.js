
// socket.js
// ============================================================
//  Real-time In-App Chat using Socket.IO
//  This file is loaded by server.js and receives the `io` instance.
//
//  What it handles:
//    - Users joining their personal room  (for notifications)
//    - Users joining a conversation room  (for chat)
//    - Sending & broadcasting messages in real time
//    - Typing indicators (typing / stop_typing)
// ============================================================

const ChatModel         = require('./models/chatModels');
const NotificationModel = require('./models/notificationModels');
const db                = require('./config/db');

module.exports = (io) => {

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── 1. JOIN PERSONAL ROOM ─────────────────────────────────
    // Every logged-in user joins their own room so the server
    // can push notifications directly to them.
    // Client emits: { user_id: 5 }
    socket.on('join_user_room', ({ user_id }) => {
      if (!user_id) return;
      socket.join(`user:${user_id}`);
      console.log(`[Socket] ${socket.id} joined personal room → user:${user_id}`);
    });

    // ── 2. JOIN CONVERSATION ROOM ─────────────────────────────
    // When a user opens a chat window, they join that conversation's room.
    // Client emits: { conv_id: 12 }
    socket.on('join_conversation', ({ conv_id }) => {
      if (!conv_id) return;
      socket.join(`conv:${conv_id}`);
      console.log(`[Socket] ${socket.id} joined conversation room → conv:${conv_id}`);
    });

    // ── 3. LEAVE CONVERSATION ROOM ────────────────────────────
    // When a user closes/navigates away from a chat window.
    // Client emits: { conv_id: 12 }
    socket.on('leave_conversation', ({ conv_id }) => {
      socket.leave(`conv:${conv_id}`);
    });

    // ── 4. SEND MESSAGE (real-time path) ──────────────────────
    // Client emits: { conv_id: 12, sender_id: 5, content: "Hello!" }
    // Server:
    //   a) checks sender is a participant
    //   b) saves message to DB
    //   c) broadcasts `new_message` to the conversation room
    //   d) saves a notification for the receiver
    //   e) pushes `notification` event to the receiver's personal room
    socket.on('send_message', ({ conv_id, sender_id, content }) => {

      // Basic input guard
      if (!conv_id || !sender_id || !content || !content.trim()) return;

      const cleanContent = content.trim();

      // a) Verify the sender is actually part of this conversation
      ChatModel.isParticipant(conv_id, sender_id, (err, isMember) => {
        if (err || !isMember) {
          return socket.emit('error', {
            message: 'You are not a participant in this conversation.',
          });
        }

        // b) Save message to the database
        ChatModel.sendMessage(conv_id, sender_id, cleanContent, (err2, rows) => {
          if (err2) {
            return socket.emit('error', { message: 'Failed to save message.' });
          }

          const message = rows[0];

          // c) Broadcast the saved message to everyone in the conversation room
          //    (this includes the sender — so their UI also gets the confirmed message)
          io.to(`conv:${conv_id}`).emit('new_message', message);

          // d & e) Find the other participant and push a notification to them
          db.query(
            'SELECT buyer_id, seller_id FROM conversations WHERE conversation_id = ?',
            [conv_id],
            (err3, convRows) => {
              if (err3 || !convRows.length) return;

              const conv       = convRows[0];
              const receiverId = conv.buyer_id === sender_id
                ? conv.seller_id
                : conv.buyer_id;

              // Save notification to DB so it appears in their notification list
              NotificationModel.create(
                receiverId,
                'message',
                'New Message',
                `${message.sender_name}: ${cleanContent.slice(0, 80)}`,
                `/chat?conv=${conv_id}`,
                () => {}   // fire-and-forget
              );

              // Push real-time notification event to the receiver's personal room
              io.to(`user:${receiverId}`).emit('notification', {
                type:    'message',
                title:   'New Message',
                body:    `${message.sender_name}: ${cleanContent.slice(0, 80)}`,
                conv_id,
              });
            }
          );
        });
      });
    });

    // ── 5. TYPING INDICATORS ──────────────────────────────────
    // Client emits: { conv_id: 12, user_id: 5, user_name: "Alice" }
    socket.on('typing', (data) => {
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(`conv:${data.conv_id}`).emit('user_typing', {
        user_id:   data.user_id,
        user_name: data.user_name,
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(`conv:${data.conv_id}`).emit('user_stop_typing', {
        user_id: data.user_id,
      });
    });

    // ── 6. DISCONNECT ─────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });


    const socket = io("http://localhost:3000");
    
    // IMPORTANT: replace this with actual logged-in user ID
    const userId = window.USER_ID || 1;
    
    socket.emit("join", userId);
    
    socket.on("connect", () => {
      console.log("Connected to socket:", socket.id);
    });
    
    socket.on("receive_message", (data) => {
      console.log("New message:", data);
    });
    
    socket.on("new_notification", (data) => {
      console.log("Notification:", data);
    });
    
    socket.on("profile_updated", (data) => {
      console.log("Profile updated:", data);
    });
    
      });

};
