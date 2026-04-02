const { validateEncryptedPayload } = require('../services/encryptionService');
const { supabase } = require('../services/db/supabaseService');

const initChatSockets = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Allow user to join specific 1-to-1 or group chat room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`[Socket] User ${socket.id} joined room: ${roomId}`);
    });

    // Handle sending message over E2EE pipe
    socket.on('send_message', async (data) => {
      try {
        const { roomId, senderId, receiverId, payload } = data;
        
        // Ensure payload is an encrypted envelope (throws on fail)
        const safePayload = validateEncryptedPayload(payload);

        // Async save to database
        const { error } = await supabase.from('messages').insert([{
          room_id: roomId,
          sender_id: senderId,
          receiver_id: receiverId,
          encrypted_text: safePayload.encryptedText,
          iv: safePayload.iv,
          salt: safePayload.salt,
          timestamp: safePayload.timestamp
        }]);

        if (error) {
          console.error('[Socket DB Error]:', error);
        }

        // Broadcast ciphertext block to everyone connected to the room (includes sender for confirmation)
        io.to(roomId).emit('receive_message', {
          roomId,
          receiverId,
          senderId,
          safePayload
        });

      } catch (err) {
        console.error('[Socket Chat Error]:', err.message);
        socket.emit('error', { error: 'Failed to process E2EE message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
};

module.exports = { initChatSockets };
