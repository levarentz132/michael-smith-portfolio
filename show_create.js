import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function showCreate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'highlanderstay',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    const [rows] = await connection.query('SHOW CREATE TABLE settings');
    console.log(rows[0]['Create Table']);

    await connection.end();
  } catch (err) {
    console.error('Failed to show create table:', err);
  }
}

showCreate();
