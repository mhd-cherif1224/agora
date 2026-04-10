const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const db         = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  const { userId } = socket.handshake.query;
  console.log(`User ${userId} connected`);

  // Send last 50 messages on connect
  db.query(
    `SELECT * FROM messages
     WHERE id_expediter = ? OR id_receptor = ?
     ORDER BY date_sending DESC LIMIT 50`,
    [userId, userId],
    (err, rows) => {
      if (!err) socket.emit('history', rows.reverse());
    }
  );

  // Handle new message
  socket.on('send_message', (data) => {
    const { id_expediter, id_receptor, content } = data;

    db.query(
      `INSERT INTO messages
         (content, date_sending, date_reception, id_expediter, id_receptor)
       VALUES (?, NOW(), 0, ?, ?)`,
      [content, id_expediter, id_receptor],
      (err, result) => {
        if (err) return console.error(err);

        const msg = {
          id:           result.insertId,
          content,
          date_sending: new Date(),
          date_reception: false,
          id_expediter,
          id_receptor,
        };

        // Emit to sender and receiver only
        io.emit(`msg_${id_receptor}`, msg);
        io.emit(`msg_${id_expediter}`, msg);
      }
    );
  });

  // Mark message as seen
  socket.on('mark_seen', ({ messageId, id_receptor }) => {
    db.query(
      `UPDATE messages SET date_reception = 1 WHERE id = ?`,
      [messageId],
      (err) => {
        if (!err) io.emit(`seen_${id_receptor}`, { messageId });
      }
    );
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

server.listen(3000, () => console.log('Chat server on port 3000'));