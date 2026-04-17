const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const db         = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

// ─── TEST CONNEXION DB ─────────────────────────────────────────────
db.query('SELECT 1', (err) => {
  if (err) {
    console.error('❌ DB connection failed:', err.message);
    return;
  }
  console.log('✅ DB connected');
});

// ─── SERVE FILES ───────────────────────────────────────────────────
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// ─── UTILISATEURS CONNECTÉS ────────────────────────────────────────
const onlineUsers = new Map(); // userId → socket.id

// ─── SOCKET.IO ────────────────────────────────────────────────────
io.on('connection', (socket) => {

  const userId = parseInt(socket.handshake.query.userId);

  if (!userId) {
    console.log('❌ Invalid userId');
    return socket.disconnect();
  }

  onlineUsers.set(userId, socket.id);
  console.log(`✅ User ${userId} connected`);

  // ─── 1. Charger les derniers messages ───────────────────────────
  db.query(
    `SELECT * FROM message
     WHERE ID_Expediteur = ? OR ID_Destinataire = ?
     ORDER BY DateEnvoie DESC LIMIT 50`,
    [userId, userId],
    (err, rows) => {

      if (err) {
        console.error('❌ History error:', err.message);
        return;
      }

      socket.emit('history', rows.reverse());
    }
  );

  // ─── 2. Envoyer un message ──────────────────────────────────────
  socket.on('send_message', (data) => {

    const { ID_Expediteur, ID_Destinataire, contenue } = data;

    console.log(`📨 From ${ID_Expediteur} to ${ID_Destinataire}: ${contenue}`);

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
          DateReception: null,
          lue: 0,
          ID_Expediteur,
          ID_Destinataire,
        };

        // envoyer au destinataire et expéditeur
        io.emit(`msg_${ID_Destinataire}`, msg);
        io.emit(`msg_${ID_Expediteur}`, msg);
      }
    );
  });

  // ─── 3. Marquer comme vu ────────────────────────────────────────
  socket.on('mark_seen', ({ messageId, ID_Destinataire }) => {

    db.query(
      `UPDATE message 
       SET lue = 1, DateReception = NOW() 
       WHERE ID = ? AND lue = 0`,
      [messageId],
      (err) => {

        if (err) {
          console.error('❌ Mark seen error:', err.message);
          return;
        }

        console.log(`✅ Message ${messageId} marked as seen`);
        io.emit(`seen_${ID_Destinataire}`, { messageId });
      }
    );
  });

  // ─── 4. Déconnexion ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    console.log(`❌ User ${userId} disconnected`);
  });

});

// ─── LANCER SERVEUR ───────────────────────────────────────────────
server.listen(3000, () => {
  console.log('🚀 Chat server running on http://localhost:3000');
});