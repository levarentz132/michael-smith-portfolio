import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function inspect() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'highlanderstay',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    console.log('=== SHOW TABLES ===');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(tables);

    console.log('=== DESCRIBE settings ===');
    try {
      const [desc] = await connection.query('DESCRIBE settings');
      console.log(desc);
      const [rows] = await connection.query('SELECT * FROM settings');
      console.log('=== SETTINGS ROWS ===');
      console.log(rows);
    } catch (e) {
      console.log('Error describing settings:', e.message);
    }

    await connection.end();
  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
