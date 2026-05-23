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

    console.log('--- LOCATIONS TABLE SCHEMA ---');
    const [locSchema] = await connection.query('DESCRIBE locations');
    console.log(JSON.stringify(locSchema, null, 2));

    console.log('--- PROPERTIES TABLE SCHEMA ---');
    const [propSchema] = await connection.query('DESCRIBE properties');
    console.log(JSON.stringify(propSchema, null, 2));

    console.log('--- LOCATIONS DATA ---');
    const [locData] = await connection.query('SELECT * FROM locations');
    console.log(JSON.stringify(locData, null, 2));

    console.log('--- PROPERTIES DATA ---');
    const [propData] = await connection.query('SELECT * FROM properties');
    console.log(JSON.stringify(propData, null, 2));

    await connection.end();
  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
