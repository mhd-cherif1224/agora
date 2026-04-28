const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const db         = require('./db');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost", "http://localhost:80", "http://localhost:443"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ─────────────────────────────────────────
// DB CONNECTION TEST
// ─────────────────────────────────────────
db.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ DB connection failed:', err.message);
    return;
  }
  console.log('✅ DB connected');
});

// ─────────────────────────────────────────
// STATIC FILES
// ─────────────────────────────────────────
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ─────────────────────────────────────────
// ONLINE USERS (optional tracking)
// ─────────────────────────────────────────
const onlineUsers = new Map();

// ─────────────────────────────────────────
// SOCKET.IO
// ─────────────────────────────────────────
io.on('connection', (socket) => {

  const userId = parseInt(socket.handshake.query.userId);

  if (!userId) {
    console.log('❌ Invalid userId');
    return socket.disconnect();
  }

  // ✅ Each user joins a private room
  socket.join(`user_${userId}`);
  onlineUsers.set(userId, socket.id);

  console.log(`✅ User ${userId} connected`);

  // ───────────────────────────────────────
  // SEND MESSAGE
  // ───────────────────────────────────────
  socket.on('send_message', (data) => {
    const { ID_Expediteur, ID_Destinataire, contenue } = data;

    if (!contenue || !ID_Expediteur || !ID_Destinataire) {
      console.log('❌ Invalid message payload');
      return;
    }

    db.query(
      `INSERT INTO message (contenue, DateEnvoie, lue, ID_Expediteur, ID_Destinataire)
       VALUES (?, NOW(), 0, ?, ?)`,
      [contenue, ID_Expediteur, ID_Destinataire],
      (err, result) => {

        if (err) {
          console.error('❌ Insert error:', err.message);
          return;
        }

        const msg = {
          ID: result.insertId,
          contenue,
          DateEnvoie: new Date(),
          lue: 0,
          ID_Expediteur,
          ID_Destinataire
        };

        // ✅ Send ONLY to sender and receiver
        io.to(`user_${ID_Expediteur}`).emit('new_message', msg);
        io.to(`user_${ID_Destinataire}`).emit('new_message', msg);
      }
    );
  });

  // ───────────────────────────────────────
  // GET CONVERSATION HISTORY
  // ───────────────────────────────────────
  socket.on('get_history', ({ otherUserId }) => {

    if (!otherUserId) return;

    db.query(
      `SELECT * FROM message
       WHERE (ID_Expediteur = ? AND ID_Destinataire = ?)
          OR (ID_Expediteur = ? AND ID_Destinataire = ?)
       ORDER BY ID ASC`,
      [userId, otherUserId, otherUserId, userId],
      (err, rows) => {

        if (err) {
          console.error('❌ History error:', err.message);
          return;
        }

        socket.emit('conversation_history', {
          otherUserId,
          messages: rows
        });
      }
    );
  });

  // ───────────────────────────────────────
  // MARK MESSAGE AS SEEN
  // ───────────────────────────────────────
  socket.on('mark_seen', ({ messageId, ID_Destinataire }) => {

    if (!messageId) return;

    db.query(
      `UPDATE message 
       SET lue = 1, DateReception = NOW() 
       WHERE ID = ?`,
      [messageId],
      (err) => {

        if (err) {
          console.error('❌ Mark seen error:', err.message);
          return;
        }

        // notify only relevant user
        io.to(`user_${ID_Destinataire}`).emit('message_seen', { messageId });
      }
    );
  });

  // ───────────────────────────────────────
  // DISCONNECT
  // ───────────────────────────────────────
  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log(`❌ User ${userId} disconnected`);
  });

});

// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────
server.listen(3000, () => {
  console.log('🚀 Chat server running on http://localhost:3000');
});