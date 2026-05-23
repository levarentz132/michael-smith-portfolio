import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'highlanderstay',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    const tables = ['properties', 'tenants', 'bookings', 'admins', 'transactions'];
    for (const table of tables) {
      console.log(`=== ${table.toUpperCase()} SCHEMA ===`);
      try {
        const [schema] = await connection.query(`DESCRIBE ${table}`);
        console.log(schema);
      } catch (err) {
        console.error(`Error describing ${table}:`, err.message);
      }
    }
    
    await connection.end();
  } catch (err) {
    console.error(err);
  }
}
run();
