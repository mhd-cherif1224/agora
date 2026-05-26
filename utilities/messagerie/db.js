const mysql = require('mysql2');

const db = mysql.createConnection({
  host:     'localhost',
  user:     'root',
  password: '',
  database: 'Agora_BDD',
  timezone: 'Z',          // ← force UTC : les colonnes DATETIME arrivent en ISO string, pas en Date locale
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL connected');
});

module.exports = db;