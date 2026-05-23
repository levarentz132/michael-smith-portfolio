import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function seed() {
  try {
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'highlanderstay',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    const [bannersRows] = await dbConnection.query("SELECT COUNT(*) AS count FROM settings WHERE `setting_key` = 'banners'");
    if (bannersRows[0].count === 0) {
      const val = JSON.stringify([]);
      await dbConnection.query('INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?)', ['banners', val]);
      console.log('Banners setting seeded successfully!');
    } else {
      console.log('Banners setting already exists.');
    }
    await dbConnection.end();
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

seed();
