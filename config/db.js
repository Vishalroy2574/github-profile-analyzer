// ============================================================
// config/db.js
// Sets up and exports a MySQL connection pool using mysql2.
// A pool is used (instead of a single connection) so multiple
// requests can be handled concurrently and efficiently.
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'github_profile_analyzer',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true, // queue requests instead of throwing when pool is full
  connectionLimit: 10,      // max simultaneous connections
  queueLimit: 0              // unlimited queueing
});

// Test the database connection on startup so failures are caught early
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release(); // return connection back to the pool
  } catch (error) {
    console.error('❌ Failed to connect to MySQL:', error.message);
    console.error('   Check your .env DB_HOST / DB_USER / DB_PASSWORD / DB_NAME values.');
    process.exit(1); // stop the app if DB is unreachable
  }
};

module.exports = { pool, testConnection };
