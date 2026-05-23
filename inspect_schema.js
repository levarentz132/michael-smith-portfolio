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

    const [locSchema] = await connection.query('DESCRIBE locations');
    console.log('LOCATIONS_SCHEMA:', JSON.stringify(locSchema));

    const [propSchema] = await connection.query('DESCRIBE properties');
    console.log('PROPERTIES_SCHEMA:', JSON.stringify(propSchema));

    await connection.end();
  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
