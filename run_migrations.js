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
    console.log('Altering status column to VARCHAR(50)...');
    const [res1] = await connection.query("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
    console.log('Status alter result:', res1);

    console.log('Checking approved_by column...');
    const [cols] = await connection.query("SHOW COLUMNS FROM bookings LIKE 'approved_by'");
    if (cols.length === 0) {
      console.log('Adding approved_by column...');
      const [res2] = await connection.query("ALTER TABLE bookings ADD COLUMN approved_by INT DEFAULT NULL");
      console.log('Approved_by alter result:', res2);
    } else {
      console.log('approved_by column already exists.');
    }

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}
run();
