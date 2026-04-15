

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const db         = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

// ─── DB Connection Test ───────────────────────────────────────────────────────
db.query('SELECT 1', (err) => {

  if (err) console.error(':x: DB connection failed:', err.message);
  else console.log(':white_check_mark: DB connected');
});



  if (err) console.error('❌ DB connection failed:', err.message);
  else console.log('✅ DB connected');
;


// ─── Serve Files ──────────────────────────────────────────────────────────────
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ─── Track Online Users ───────────────────────────────────────────────────────
const onlineUsers = new Map(); // userId → socket.id

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  const userId = parseInt(socket.handshake.query.userId);
  if (!userId) return socket.disconnect();

  onlineUsers.set(userId, socket.id);
  console.log(`User ${userId} connected`);

  // ── 1. Send last 50 messages on connect ────────────────────────────────────
  db.query(
    `SELECT * FROM message
     WHERE ID_Expediteur = ? OR ID_Destinataire = ?
     ORDER BY DateEnvoie DESC LIMIT 50`,
    [userId, userId],
    (err, rows) => {

      if (err) return console.error(':x: History error:', err.message);

      if (err) return console.error('❌ History error:', err.message);

      socket.emit('history', rows.reverse());
    }
  );

  // ── 2. Handle sending a new message ────────────────────────────────────────
  socket.on('send_message', (data) => {
    const { ID_Expediteur, ID_Destinataire, contenue } = data;
    console.log(`📨 From ${ID_Expediteur} to ${ID_Destinataire}: ${contenue}`);

    db.query(
      `INSERT INTO message (contenue, DateEnvoie, lue, ID_Expediteur, ID_Destinataire)
       VALUES (?, NOW(), 0, ?, ?)`,
      [contenue, ID_Expediteur, ID_Destinataire],
      (err, result) => {

        if (err) return console.error(':x: Insert error:', err.message);

        if (err) return console.error('❌ Insert error:', err.message);


        const msg = {
          ID:              result.insertId,  // lowercase 'd' — important!
          contenue,
          DateEnvoie:      new Date(),
          DateReception:   null,             // not seen yet
          lue:             0,                // not seen yet
          ID_Expediteur,
          ID_Destinataire,
        };

        // Send to sender and receiver
        io.emit(`msg_${ID_Destinataire}`, msg);
        io.emit(`msg_${ID_Expediteur}`, msg);
      }
    );
  });

  // ── 3. Mark message as seen ─────────────────────────────────────────────────
  socket.on('mark_seen', ({ messageId, ID_Destinataire }) => {
    db.query(
      `UPDATE message SET lue = 1, DateReception = NOW() WHERE ID = ? AND lue = 0`,
      [messageId],
      (err) => {

        if (err) return console.error(':x: Mark seen error:', err.message);


        if (err) return console.error('❌ Mark seen error:', err.message);

        console.log(`✅ Message ${messageId} marked as seen`);
        io.emit(`seen_${ID_Destinataire}`, { messageId });
      }
    );
  });

  // ── 4. Cleanup on disconnect ────────────────────────────────────────────────
  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log(`User ${userId} disconnected`);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
server.listen(3000, () => console.log('Chat server on port 3000'));