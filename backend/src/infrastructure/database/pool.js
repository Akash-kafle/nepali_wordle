// =============================================================
// Infrastructure: MySQL2 Connection Pool
// =============================================================

const mysql = require('mysql2/promise');

let pool;

function getPool() {
  if (!pool) {
    const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL;
    
    if (connectionUri) {
      console.log('[Database] Connecting using connection URL...');
      pool = mysql.createPool(connectionUri);
    } else {
      console.log('[Database] Connecting using individual parameters...');
      pool = mysql.createPool({
        host:               process.env.DB_HOST     || 'localhost',
        port:               parseInt(process.env.DB_PORT || '3306', 10),
        user:               process.env.DB_USER     || 'root',
        password:           process.env.DB_PASSWORD  || '',
        database:           process.env.DB_NAME     || 'nepali_word_game',
        waitForConnections: true,
        connectionLimit:    10,
        queueLimit:         0,
        charset:            'utf8mb4',
        timezone:           '+00:00',
      });
    }
  }
  return pool;
}

module.exports = { getPool };

