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

    console.log('--- ADMINS TABLE SCHEMA ---');
    const [schema] = await connection.query('DESCRIBE admins');
    console.log(JSON.stringify(schema, null, 2));

    await connection.end();
  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
