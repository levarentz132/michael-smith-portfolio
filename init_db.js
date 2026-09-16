import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';

dotenv.config();

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'highlanderstay',
    port: parseInt(process.env.DB_PORT || '3306'),
  });

  try {
    console.log('Ensuring all tables exist...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(500) NOT NULL,
        location_id INT DEFAULT NULL,
        map_url VARCHAR(500) DEFAULT NULL,
        type VARCHAR(50) DEFAULT 'campur',
        price INT NOT NULL,
        hourly_rate INT DEFAULT NULL,
        min_transit_hours INT DEFAULT 3,
        promo_price INT DEFAULT NULL,
        promo_label VARCHAR(100) DEFAULT NULL,
        image VARCHAR(500) DEFAULT NULL,
        available TINYINT(1) DEFAULT 1,
        description TEXT DEFAULT NULL,
        rooms INT DEFAULT 0,
        available_rooms INT DEFAULT 0,
        branch_id INT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'available',
        deposit INT DEFAULT 0,
        transit_3h INT DEFAULT NULL,
        transit_6h INT DEFAULT NULL,
        transit_12h INT DEFAULT NULL,
        transit_24h INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT NULL,
        phone VARCHAR(50) DEFAULT NULL,
        password VARCHAR(255) DEFAULT NULL,
        id_card_number VARCHAR(100) DEFAULT NULL,
        id_card_photo VARCHAR(500) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        emergency_contact VARCHAR(255) DEFAULT NULL,
        emergency_phone VARCHAR(50) DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT DEFAULT NULL,
        tenant_id INT DEFAULT NULL,
        booking_date DATE DEFAULT NULL,
        checkin_date DATE DEFAULT NULL,
        checkout_date DATE DEFAULT NULL,
        duration_months INT DEFAULT 1,
        transit_start_time DATETIME DEFAULT NULL,
        transit_end_time DATETIME DEFAULT NULL,
        monthly_rent INT DEFAULT 0,
        hourly_rate INT DEFAULT 0,
        deposit_amount INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        reference_number VARCHAR(100) DEFAULT NULL,
        booking_type VARCHAR(50) DEFAULT 'monthly',
        notes TEXT DEFAULT NULL,
        approved_by INT DEFAULT NULL,
        snap_token VARCHAR(255) DEFAULT NULL,
        payment_method VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT DEFAULT NULL,
        transaction_type VARCHAR(50) NOT NULL,
        category VARCHAR(100) DEFAULT NULL,
        amount INT NOT NULL,
        transaction_date DATETIME NOT NULL,
        description TEXT DEFAULT NULL,
        recorded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default admin if empty
    const [adminRows] = await connection.query('SELECT COUNT(*) as count FROM admins');
    if (adminRows[0].count === 0) {
      console.log('Seeding default admin...');
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await connection.query(`
        INSERT INTO admins (username, password, name, email, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['admin', hashedPassword, 'Administrator', 'admin@highlanderstay.com', 'owner', 1]);
      console.log('Default admin seeded: username=admin, password=admin123');
    }

    // Seed locations and properties from db_schema.json if locations is empty
    const [locCount] = await connection.query('SELECT COUNT(*) as count FROM locations');
    if (locCount[0].count === 0 && fs.existsSync('db_schema.json')) {
      console.log('Seeding locations and properties from db_schema.json...');
      const raw = fs.readFileSync('db_schema.json', 'utf8');
      
      const locMatch = raw.match(/--- LOCATIONS DATA ---\s*(\[[\s\S]*?\])\s*--- PROPERTIES DATA ---/);
      if (locMatch) {
        const locations = JSON.parse(locMatch[1]);
        for (const loc of locations) {
          await connection.query(
            'INSERT IGNORE INTO locations (id, name, slug, description) VALUES (?, ?, ?, ?)',
            [loc.id, loc.name, loc.slug, loc.description]
          );
        }
        console.log(`Seeded ${locations.length} locations.`);
      }

      const propMatch = raw.match(/--- PROPERTIES DATA ---\s*(\[[\s\S]*?\])\s*$/);
      if (propMatch) {
        const properties = JSON.parse(propMatch[1]);
        for (const p of properties) {
          await connection.query(
            `INSERT IGNORE INTO properties (
              id, name, location, location_id, map_url, type, price, hourly_rate, min_transit_hours,
              promo_price, promo_label, image, available, description, rooms, available_rooms,
              branch_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id, p.name, p.location, p.location_id, p.map_url, p.type, p.price, p.hourly_rate, p.min_transit_hours,
              p.promo_price, p.promo_label, p.image, p.available, p.description, p.rooms, p.available_rooms,
              p.branch_id, p.status
            ]
          );
        }
        console.log(`Seeded ${properties.length} properties.`);
      }
    }

    console.log('Database initialization completed successfully!');
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await connection.end();
  }
}

setupDatabase();
