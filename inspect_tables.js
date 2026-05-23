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

    console.log('=== TENANTS SCHEMA ===');
    const [tenants] = await connection.query('DESCRIBE tenants');
    console.log(tenants);

    console.log('=== BOOKINGS SCHEMA ===');
    const [bookings] = await connection.query('DESCRIBE bookings');
    console.log(bookings);

    console.log('=== PROPERTIES SCHEMA ===');
    const [properties] = await connection.query('DESCRIBE properties');
    console.log(properties);

    await connection.end();
  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
