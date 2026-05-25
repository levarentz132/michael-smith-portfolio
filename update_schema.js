import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'highlanderstay',
    port: parseInt(process.env.DB_PORT || '3306'),
  });

  try {
    console.log('Running ALTER TABLE...');
    const [result] = await connection.query("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
    console.log('ALTER result:', result);
  } catch (err) {
    console.error('ALTER failed:', err);
  } finally {
    await connection.end();
  }
}
run();
