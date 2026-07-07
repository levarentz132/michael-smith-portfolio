import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import midtransClient from 'midtrans-client';
import crypto from 'crypto';

dotenv.config();

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Programmatically ensure the upload directory exists
const uploadDir = path.join(__dirname, 'uploads', 'properties');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `prop_${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Database Connection Check and Table Creation
async function initializeDatabase() {
  try {
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'highlanderstay',
      port: parseInt(process.env.DB_PORT || '3306'),
    });
    console.log('Connected to MySQL Database: highlanderstay');

    // Create settings table if not exists
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`setting_key\` VARCHAR(100) UNIQUE NOT NULL,
        \`setting_value\` LONGTEXT NOT NULL,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create admins table if not exists
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(100) UNIQUE NOT NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) DEFAULT NULL,
        \`role\` ENUM('owner', 'admin', 'cashier') DEFAULT 'admin',
        \`branch_id\` INT DEFAULT NULL,
        \`is_active\` TINYINT DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create articles table if not exists
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS articles (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(255) NOT NULL,
        \`content\` LONGTEXT NOT NULL,
        \`image\` VARCHAR(255) DEFAULT '',
        \`read_time\` VARCHAR(50) DEFAULT '5 menit baca',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if defaults exist, seed if missing
    const [logoRows] = await dbConnection.query("SELECT COUNT(*) AS count FROM settings WHERE `setting_key` = 'logo_text'");
    if (logoRows[0].count === 0) {
      console.log('Seeding default settings values...');
      const defaultSettings = [
        ['logo_text', JSON.stringify('HS')],
        ['logo_gradient_start', JSON.stringify('#89AACC')],
        ['logo_gradient_end', JSON.stringify('#4E85BF')],
        ['banner_eyebrow', JSON.stringify('Promo Spesial')],
        ['banner_title', JSON.stringify('Diskon <span class="italic font-normal">Early Bird</span> 20%')],
        ['banner_description', JSON.stringify('Pesan ruang impian Anda bulan ini dan nikmati potongan harga eksklusif untuk 3 bulan pertama.')],
        ['banner_image', JSON.stringify('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')],
        ['banner_cta', JSON.stringify('Klaim Promo')],
        ['promo_enabled', JSON.stringify('false')],
        ['promo_text', JSON.stringify('Promo Spesial: Gunakan kode FIRSTMO untuk diskon 10% di bulan pertama!')],
        ['logo_image', JSON.stringify('')],
        ['whatsapp_number', JSON.stringify('628123456789')],
        ['banners', JSON.stringify([])],
        ['facilities_premium', JSON.stringify([
          { id: 1, title: "Kolam Rooftop Infinity", image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80", rotation: -4 },
          { id: 2, title: "Lounge Bersama yang Nyaman", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80", rotation: 5 },
          { id: 3, title: "Akses Kunci Kartu Pintar", image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80", rotation: -2 },
          { id: 4, title: "WiFi Fiber Kecepatan Tinggi", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80", rotation: 3 },
          { id: 5, title: "Dapur Bersama Lengkap", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80", rotation: -5 },
          { id: 6, title: "Keamanan & CCTV 24/7", image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80", rotation: 4 }
        ])]
      ];
      for (const [key, val] of defaultSettings) {
        await dbConnection.query('INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `setting_value` = ?', [key, val, val]);
      }
    } else {
      // Ensure logo_image row is created if table was previously seeded
      const [logoImgRows] = await dbConnection.query("SELECT COUNT(*) AS count FROM settings WHERE `setting_key` = 'logo_image'");
      if (logoImgRows[0].count === 0) {
        const val = JSON.stringify('');
        await dbConnection.query('INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?)', ['logo_image', val]);
      }
      // Ensure whatsapp_number row is created if table was previously seeded
      const [whatsappRows] = await dbConnection.query("SELECT COUNT(*) AS count FROM settings WHERE `setting_key` = 'whatsapp_number'");
      if (whatsappRows[0].count === 0) {
        const val = JSON.stringify('628123456789');
        await dbConnection.query('INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?)', ['whatsapp_number', val]);
      }
      // Ensure banners row is created if table was previously seeded
      const [bannersRows] = await dbConnection.query("SELECT COUNT(*) AS count FROM settings WHERE `setting_key` = 'banners'");
      if (bannersRows[0].count === 0) {
        const val = JSON.stringify([]);
        await dbConnection.query('INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?)', ['banners', val]);
      }
      // Ensure facilities_premium row is created if table was previously seeded
      const [facPremiumRows] = await dbConnection.query("SELECT COUNT(*) AS count FROM settings WHERE `setting_key` = 'facilities_premium'");
      if (facPremiumRows[0].count === 0) {
        const val = JSON.stringify([
          { id: 1, title: "Kolam Rooftop Infinity", image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80", rotation: -4 },
          { id: 2, title: "Lounge Bersama yang Nyaman", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80", rotation: 5 },
          { id: 3, title: "Akses Kunci Kartu Pintar", image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80", rotation: -2 },
          { id: 4, title: "WiFi Fiber Kecepatan Tinggi", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80", rotation: 3 },
          { id: 5, title: "Dapur Bersama Lengkap", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80", rotation: -5 },
          { id: 6, title: "Keamanan & CCTV 24/7", image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80", rotation: 4 }
        ]);
        await dbConnection.query('INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?)', ['facilities_premium', val]);
      }
    }

    // Seed default articles if empty
    const [articleRows] = await dbConnection.query("SELECT COUNT(*) AS count FROM articles");
    if (articleRows[0].count === 0) {
      console.log('Seeding default articles...');
      const defaultArticles = [
        [
          "Memilih Kos yang Tepat: Boarding Pribadi vs Co-living",
          "<p>Memilih hunian sementara adalah keputusan besar yang memengaruhi kehidupan sehari-hari Anda. Bagi mahasiswa dan profesional muda, pilihan utama seringkali berkisar antara kos-kosan tradisional atau konsep modern co-living.</p><p>Co-living menawarkan ruang komunal, fasilitas bersama yang lengkap, dan rasa komunitas yang kuat, sementara boarding pribadi berfokus pada privasi penuh.</p>",
          "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
          "5 menit baca"
        ],
        [
          "Tips Tata Letak Kamar Minimalis untuk Apartemen Studio",
          "<p>Tinggal di apartemen studio menantang kita untuk kreatif dengan ruang yang terbatas. Tata letak yang cerdas dapat membuat ruangan terasa luas dan fungsional.</p><p>Gunakan furnitur multifungsi seperti tempat tidur dengan laci penyimpanan, dan batasi sekat masif untuk menjaga pencahayaan alami mengalir ke seluruh ruangan.</p>",
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
          "4 menit baca"
        ],
        [
          "Etiket Co-living & Aturan Bersama yang Penting",
          "<p>Kunci kenyamanan tinggal di ruang co-living adalah rasa saling menghargai. Etiket sederhana seperti membersihkan dapur setelah digunakan, membatasi kebisingan di malam hari, dan menjaga kebersihan ruang bersama dapat menciptakan harmoni antar penghuni.</p>",
          "https://images.unsplash.com/photo-1516116211223-5c359a36298a?auto=format&fit=crop&w=1200&q=80",
          "7 menit baca"
        ],
        [
          "Mendekorasi Ruang Sewa Tanpa Merusak Dinding",
          "<p>Ingin membuat kamar sewa Anda terasa lebih personal tanpa kehilangan uang deposit? Gunakan stiker dinding lepas-pasang, tanaman hias dalam pot, karpet bertekstur indah, dan gantungan perekat khusus yang tidak meninggalkan bekas pada dinding.</p>",
          "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&w=1200&q=80",
          "6 menit baca"
        ]
      ];
      for (const [title, content, image, read_time] of defaultArticles) {
        await dbConnection.query('INSERT INTO articles (title, content, image, read_time) VALUES (?, ?, ?, ?)', [title, content, image, read_time]);
      }
    }

    // Check if deposit column exists in properties table, add if missing
    const [propCols] = await dbConnection.query("SHOW COLUMNS FROM properties LIKE 'deposit'");
    if (propCols.length === 0) {
      console.log("Adding 'deposit' column to properties table...");
      await dbConnection.query("ALTER TABLE properties ADD COLUMN deposit INT DEFAULT 0");
    }

    // Check if transit_3h, transit_6h, transit_12h columns exist in properties table, add if missing
    const [propCols3h] = await dbConnection.query("SHOW COLUMNS FROM properties LIKE 'transit_3h'");
    if (propCols3h.length === 0) {
      console.log("Adding transit package columns to properties table...");
      await dbConnection.query("ALTER TABLE properties ADD COLUMN transit_3h INT DEFAULT NULL");
      await dbConnection.query("ALTER TABLE properties ADD COLUMN transit_6h INT DEFAULT NULL");
      await dbConnection.query("ALTER TABLE properties ADD COLUMN transit_12h INT DEFAULT NULL");
      
      const [hourlyRateCheck] = await dbConnection.query("SHOW COLUMNS FROM properties LIKE 'hourly_rate'");
      if (hourlyRateCheck.length > 0) {
        // Seed them based on existing hourly_rate if it exists
        await dbConnection.query("UPDATE properties SET transit_3h = hourly_rate * 3, transit_6h = hourly_rate * 6, transit_12h = hourly_rate * 12 WHERE hourly_rate IS NOT NULL");
      }
    }

    // Check if transit_24h column exists in properties table, add if missing
    const [propCols24h] = await dbConnection.query("SHOW COLUMNS FROM properties LIKE 'transit_24h'");
    if (propCols24h.length === 0) {
      console.log("Adding transit_24h package column to properties table...");
      await dbConnection.query("ALTER TABLE properties ADD COLUMN transit_24h INT DEFAULT NULL");
      
      const [hourlyRateCheck] = await dbConnection.query("SHOW COLUMNS FROM properties LIKE 'hourly_rate'");
      if (hourlyRateCheck.length > 0) {
        await dbConnection.query("UPDATE properties SET transit_24h = hourly_rate * 24 WHERE hourly_rate IS NOT NULL");
      } else {
        await dbConnection.query("UPDATE properties SET transit_24h = transit_12h * 2 WHERE transit_12h IS NOT NULL");
      }
    }

    // Drop legacy hourly_rate and min_transit_hours columns if they still exist
    const [hourlyRateCheck] = await dbConnection.query("SHOW COLUMNS FROM properties LIKE 'hourly_rate'");
    if (hourlyRateCheck.length > 0) {
      console.log("Dropping legacy 'hourly_rate' column from properties table...");
      await dbConnection.query("ALTER TABLE properties DROP COLUMN hourly_rate");
    }
    const [minTransitHoursCheck] = await dbConnection.query("SHOW COLUMNS FROM properties LIKE 'min_transit_hours'");
    if (minTransitHoursCheck.length > 0) {
      console.log("Dropping legacy 'min_transit_hours' column from properties table...");
      await dbConnection.query("ALTER TABLE properties DROP COLUMN min_transit_hours");
    }

    // Check if approved_by column exists in bookings table, add if missing
    const [bookingCols] = await dbConnection.query("SHOW COLUMNS FROM bookings LIKE 'approved_by'");
    if (bookingCols.length === 0) {
      console.log("Adding 'approved_by' column to bookings table...");
      await dbConnection.query("ALTER TABLE bookings ADD COLUMN approved_by INT DEFAULT NULL");
    }

    // Modify bookings status column type to VARCHAR(50) to support custom statuses
    console.log("Modifying bookings status column type to VARCHAR(50)...");
    await dbConnection.query("ALTER TABLE bookings MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");

    // Check if snap_token column exists in bookings table, add if missing
    const [snapTokenCol] = await dbConnection.query("SHOW COLUMNS FROM bookings LIKE 'snap_token'");
    if (snapTokenCol.length === 0) {
      console.log("Adding 'snap_token' column to bookings table...");
      await dbConnection.query("ALTER TABLE bookings ADD COLUMN snap_token VARCHAR(255) DEFAULT NULL");
    }

    // Check if payment_method column exists in bookings table, add if missing
    const [payMethodCol] = await dbConnection.query("SHOW COLUMNS FROM bookings LIKE 'payment_method'");
    if (payMethodCol.length === 0) {
      console.log("Adding 'payment_method' column to bookings table...");
      await dbConnection.query("ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL");
    }

    await dbConnection.end();
  } catch (error) {
    console.error('Database connection / initialization failed:', error);
  }
}

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'highlanderstay',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Run Initialization
initializeDatabase();

// Helper to parse price string to integer
function parsePrice(priceStr) {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 1500000;
  
  const cleanStr = priceStr.toLowerCase();
  
  // E.g. "Rp 3.5M / mo" -> 3500000
  const matchMillions = cleanStr.match(/(\d+(\.\d+)?)\s*m\b/);
  if (matchMillions) {
    return Math.round(parseFloat(matchMillions[1]) * 1000000);
  }
  
  // Extract all digits
  const cleanNumStr = cleanStr.replace(/[^\d]/g, '');
  const parsed = parseInt(cleanNumStr, 10);
  return isNaN(parsed) ? 1500000 : parsed;
}

// Helper to preserve local database time without timezone shifts
function formatLocalDatetime(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return dateVal;
  
  const pad = (num, size = 2) => String(num).padStart(size, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// --- API ROUTES ---

// Upload Route for Property Images
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const relativePath = `uploads/properties/${req.file.filename}`;
    res.json({ url: relativePath });
  } catch (error) {
    console.error('Error in POST /api/upload:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// 1. Properties Routes

// GET all properties joined with locations
app.get('/api/properties', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, l.name AS location_name, l.slug AS location_slug
      FROM properties p
      LEFT JOIN locations l ON p.location_id = l.id
    `);

    // Map DB rows to Frontend Property structure
    const mapped = rows.map((row, index) => {
      const isApartment = row.name.toLowerCase().includes('apartment') || row.name.toLowerCase().includes('apartemen');
      const frontendType = isApartment ? 'apartment' : 'kos';

      let category = 'Premium Boarding Room';
      if (isApartment) {
        category = 'Luxury Apartment';
      } else if (row.type) {
        const typeCapitalized = row.type.charAt(0).toUpperCase() + row.type.slice(1);
        category = `Premium Boarding Room (${typeCapitalized})`;
      }

      let formattedPrice = 'Rp. 1.500.000 / month';
      if (row.price) {
        const priceVal = parseInt(row.price, 10);
        if (!isNaN(priceVal)) {
          formattedPrice = `Rp. ${priceVal.toLocaleString('id-ID')} / month`;
        }
      }

      let imageUrl = row.image;
      if (!imageUrl) {
        imageUrl = isApartment 
          ? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
      } else if (imageUrl.startsWith('uploads/')) {
        imageUrl = `/${imageUrl}`;
      }

      const colSpan = index % 3 === 0 ? 'md:col-span-7' : 'md:col-span-5';
      const aspectRatio = index % 3 === 0 ? 'aspect-[4/3] md:aspect-[1.5/1]' : 'aspect-[4/3] md:aspect-[1.1/1]';

      return {
        id: row.id,
        title: row.name,
        category: category,
        type: frontendType,
        price: formattedPrice,
        rawPrice: row.price,
        location: row.location_name || 'Jakarta',
        address: row.location,
        rating: row.id % 2 === 0 ? '4.9 ★' : '4.8 ★',
        image: imageUrl,
        colSpan: colSpan,
        aspectRatio: aspectRatio,
        hourlyRate: null,
        minTransitHours: 3,
        transit3h: row.transit_3h,
        transit6h: row.transit_6h,
        transit12h: row.transit_12h,
        transit24h: row.transit_24h,
        mapUrl: row.map_url,
        promoPrice: row.promo_price,
        promoLabel: row.promo_label,
        available: row.available,
        description: row.description || '',
        rooms: row.rooms || 0,
        availableRooms: row.available_rooms || 0,
        branchId: row.branch_id,
        status: row.status || 'available',
        deposit: row.deposit || 0
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch properties.' });
  }
});

// GET a specific property by ID
app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT p.*, l.name AS location_name, l.slug AS location_slug
      FROM properties p
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const row = rows[0];
    const isApartment = row.name.toLowerCase().includes('apartment') || row.name.toLowerCase().includes('apartemen');
    const frontendType = isApartment ? 'apartment' : 'kos';

    let category = 'Premium Boarding Room';
    if (isApartment) {
      category = 'Luxury Apartment';
    } else if (row.type) {
      const typeCapitalized = row.type.charAt(0).toUpperCase() + row.type.slice(1);
      category = `Premium Boarding Room (${typeCapitalized})`;
    }

    let formattedPrice = 'Rp. 1.500.000 / month';
    if (row.price) {
      const priceVal = parseInt(row.price, 10);
      if (!isNaN(priceVal)) {
        formattedPrice = `Rp. ${priceVal.toLocaleString('id-ID')} / month`;
      }
    }

    let imageUrl = row.image;
    if (!imageUrl) {
      imageUrl = isApartment 
        ? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
    } else if (imageUrl.startsWith('uploads/')) {
      imageUrl = `/${imageUrl}`;
    }

    res.json({
      id: row.id,
      title: row.name,
      category: category,
      type: frontendType,
      price: formattedPrice,
      rawPrice: row.price,
      location: row.location_name || 'Jakarta',
      address: row.location,
      rating: row.id % 2 === 0 ? '4.9 ★' : '4.8 ★',
      image: imageUrl,
      hourlyRate: null,
      minTransitHours: 3,
      transit3h: row.transit_3h,
      transit6h: row.transit_6h,
      transit12h: row.transit_12h,
      transit24h: row.transit_24h,
      mapUrl: row.map_url,
      promoPrice: row.promo_price,
      promoLabel: row.promo_label,
      available: row.available,
      description: row.description || '',
      rooms: row.rooms || 0,
      availableRooms: row.available_rooms || 0,
      branchId: row.branch_id,
      status: row.status || 'available',
      deposit: row.deposit || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch property details.' });
  }
});


// POST a new property
app.post('/api/properties', async (req, res) => {
  try {
    const {
      title,
      category,
      type,
      price,
      location,
      image,
      mapUrl,
      hourlyRate,
      minTransitHours,
      transit3h,
      transit6h,
      transit12h,
      transit24h,
      promoPrice,
      promoLabel,
      available,
      description,
      rooms,
      availableRooms,
      branchId,
      status,
      deposit
    } = req.body;

    let locationId = null;
    if (location) {
      const [locRows] = await pool.query('SELECT id FROM locations WHERE name = ? OR slug = ? LIMIT 1', [location, location.toLowerCase().replace(/\s+/g, '-')]);
      if (locRows.length > 0) {
        locationId = locRows[0].id;
      } else {
        const slug = location.toLowerCase().replace(/\s+/g, '-');
        const [insertLoc] = await pool.query('INSERT INTO locations (name, slug, description) VALUES (?, ?, ?)', [location, slug, `Kawasan ${location}`]);
        locationId = insertLoc.insertId;
      }
    }

    const cleanPrice = parsePrice(price);

    const [result] = await pool.query(
      `INSERT INTO properties (
        name, location, location_id, map_url, type, price,
        promo_price, promo_label, image, available, description, rooms, available_rooms, branch_id, status, deposit,
        transit_3h, transit_6h, transit_12h, transit_24h
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        location || '',
        locationId,
        mapUrl || null,
        type || 'kos',
        cleanPrice,
        promoPrice !== undefined ? promoPrice : null,
        promoLabel || null,
        image || '',
        available !== undefined ? (available ? 1 : 0) : 1,
        description || category || '',
        rooms !== undefined ? rooms : 0,
        availableRooms !== undefined ? availableRooms : 0,
        branchId !== undefined ? branchId : null,
        status || 'available',
        deposit !== undefined ? deposit : 0,
        transit3h !== undefined ? transit3h : null,
        transit6h !== undefined ? transit6h : null,
        transit12h !== undefined ? transit12h : null,
        transit24h !== undefined ? transit24h : null
      ]
    );

    // Fetch the newly created property
    const [insertedRows] = await pool.query(`
      SELECT p.*, l.name AS location_name, l.slug AS location_slug
      FROM properties p
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.id = ?
      LIMIT 1
    `, [result.insertId]);

    if (insertedRows.length === 0) {
      return res.status(404).json({ error: 'Property not found after creation.' });
    }

    const row = insertedRows[0];
    const isApartment = row.name.toLowerCase().includes('apartment') || row.name.toLowerCase().includes('apartemen');
    const frontendType = isApartment ? 'apartment' : 'kos';

    let categoryStr = 'Premium Boarding Room';
    if (isApartment) {
      categoryStr = 'Luxury Apartment';
    } else if (row.type) {
      const typeCapitalized = row.type.charAt(0).toUpperCase() + row.type.slice(1);
      categoryStr = `Premium Boarding Room (${typeCapitalized})`;
    }

    let formattedPrice = 'Rp. 1.500.000 / month';
    if (row.price) {
      const priceVal = parseInt(row.price, 10);
      if (!isNaN(priceVal)) {
        formattedPrice = `Rp. ${priceVal.toLocaleString('id-ID')} / month`;
      }
    }

    let imageUrl = row.image;
    if (!imageUrl) {
      imageUrl = isApartment 
        ? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
    } else if (imageUrl.startsWith('uploads/')) {
      imageUrl = `/${imageUrl}`;
    }

    res.status(201).json({
      id: row.id,
      title: row.name,
      category: categoryStr,
      type: frontendType,
      price: formattedPrice,
      rawPrice: row.price,
      location: row.location_name || 'Jakarta',
      address: row.location,
      rating: row.id % 2 === 0 ? '4.9 ★' : '4.8 ★',
      image: imageUrl,
      hourlyRate: null,
      minTransitHours: 3,
      transit3h: row.transit_3h,
      transit6h: row.transit_6h,
      transit12h: row.transit_12h,
      transit24h: row.transit_24h,
      mapUrl: row.map_url,
      promoPrice: row.promo_price,
      promoLabel: row.promo_label,
      available: row.available,
      description: row.description || '',
      rooms: row.rooms || 0,
      availableRooms: row.available_rooms || 0,
      branchId: row.branch_id,
      status: row.status || 'available',
      deposit: row.deposit || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create property.' });
  }
});

// PUT (update) an existing property
app.put('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      category, 
      type, 
      price, 
      location, 
      image,
      mapUrl,
      hourlyRate,
      minTransitHours,
      transit3h,
      transit6h,
      transit12h,
      transit24h,
      promoPrice,
      promoLabel,
      available,
      description,
      rooms,
      availableRooms,
      branchId,
      status,
      deposit
    } = req.body;

    let locationId = null;
    if (location) {
      const [locRows] = await pool.query('SELECT id FROM locations WHERE name = ? OR slug = ? LIMIT 1', [location, location.toLowerCase().replace(/\s+/g, '-')]);
      if (locRows.length > 0) {
        locationId = locRows[0].id;
      } else {
        const slug = location.toLowerCase().replace(/\s+/g, '-');
        const [insertLoc] = await pool.query('INSERT INTO locations (name, slug, description) VALUES (?, ?, ?)', [location, slug, `Kawasan ${location}`]);
        locationId = insertLoc.insertId;
      }
    }

    const cleanPrice = parsePrice(price);

    await pool.query(
      `UPDATE properties 
       SET name = ?, location = ?, location_id = ?, map_url = ?, type = ?, price = ?, 
           promo_price = ?, promo_label = ?, 
           image = ?, available = ?, description = ?, rooms = ?, available_rooms = ?, 
           branch_id = ?, status = ?, deposit = ?,
           transit_3h = ?, transit_6h = ?, transit_12h = ?, transit_24h = ?
       WHERE id = ?`,
      [
        title, 
        location || '', 
        locationId, 
        mapUrl || null,
        type || 'kos',
        cleanPrice, 
        promoPrice !== undefined ? promoPrice : null,
        promoLabel || null,
        image || '', 
        available !== undefined ? (available ? 1 : 0) : 1,
        description || category || '', 
        rooms !== undefined ? rooms : 0,
        availableRooms !== undefined ? availableRooms : 0,
        branchId !== undefined ? branchId : null,
        status || 'available',
        deposit !== undefined ? deposit : 0,
        transit3h !== undefined ? transit3h : null,
        transit6h !== undefined ? transit6h : null,
        transit12h !== undefined ? transit12h : null,
        transit24h !== undefined ? transit24h : null,
        id
      ]
    );

    // Fetch the updated property with location joined
    const [updatedRows] = await pool.query(`
      SELECT p.*, l.name AS location_name, l.slug AS location_slug
      FROM properties p
      LEFT JOIN locations l ON p.location_id = l.id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (updatedRows.length === 0) {
      return res.status(404).json({ error: 'Property not found after update.' });
    }

    const row = updatedRows[0];
    const isApartment = row.name.toLowerCase().includes('apartment') || row.name.toLowerCase().includes('apartemen');
    const frontendType = isApartment ? 'apartment' : 'kos';

    let categoryStr = 'Premium Boarding Room';
    if (isApartment) {
      categoryStr = 'Luxury Apartment';
    } else if (row.type) {
      const typeCapitalized = row.type.charAt(0).toUpperCase() + row.type.slice(1);
      categoryStr = `Premium Boarding Room (${typeCapitalized})`;
    }

    let formattedPrice = 'Rp. 1.500.000 / month';
    if (row.price) {
      const priceVal = parseInt(row.price, 10);
      if (!isNaN(priceVal)) {
        formattedPrice = `Rp. ${priceVal.toLocaleString('id-ID')} / month`;
      }
    }

    let imageUrl = row.image;
    if (!imageUrl) {
      imageUrl = isApartment 
        ? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
    } else if (imageUrl.startsWith('uploads/')) {
      imageUrl = `/${imageUrl}`;
    }

    res.json({
      id: row.id,
      title: row.name,
      category: categoryStr,
      type: frontendType,
      price: formattedPrice,
      rawPrice: row.price,
      location: row.location_name || 'Jakarta',
      address: row.location,
      rating: row.id % 2 === 0 ? '4.9 ★' : '4.8 ★',
      image: imageUrl,
      hourlyRate: null,
      minTransitHours: 3,
      transit3h: row.transit_3h,
      transit6h: row.transit_6h,
      transit12h: row.transit_12h,
      transit24h: row.transit_24h,
      mapUrl: row.map_url,
      promoPrice: row.promo_price,
      promoLabel: row.promo_label,
      available: row.available,
      description: row.description || '',
      rooms: row.rooms || 0,
      availableRooms: row.available_rooms || 0,
      branchId: row.branch_id,
      status: row.status || 'available',
      deposit: row.deposit || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update property.' });
  }
});

// DELETE a property
app.delete('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM properties WHERE id = ?', [id]);
    res.json({ message: 'Property deleted successfully.', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete property.' });
  }
});

// 2. Bookings Routes

// GET all bookings joined with properties and tenants
app.get('/api/bookings', async (req, res) => {
  try {
    const tenantId = req.query.tenantId;
    let query = `
      SELECT b.*, 
             DATE_FORMAT(b.transit_start_time, '%Y-%m-%dT%H:%i:%s') AS transit_start_time,
             DATE_FORMAT(b.transit_end_time, '%Y-%m-%dT%H:%i:%s') AS transit_end_time,
             p.name AS propertyName, t.name AS tenantName, t.email AS tenantEmail, t.phone AS tenantPhone,
             t.id_card_number AS tenantIdCardNumber, t.id_card_photo AS tenantIdCardPhoto,
             t.address AS tenantAddress, t.emergency_contact AS tenantEmergencyContact,
             t.emergency_phone AS tenantEmergencyPhone,
             a.name AS approvedByName
      FROM bookings b
      LEFT JOIN properties p ON b.property_id = p.id
      LEFT JOIN tenants t ON b.tenant_id = t.id
      LEFT JOIN admins a ON b.approved_by = a.id
    `;
    const params = [];
    if (tenantId) {
      query += ` WHERE b.tenant_id = ? `;
      params.push(tenantId);
    }
    query += ` ORDER BY b.id DESC `;

    const [rows] = await pool.query(query, params);

    const mapped = rows.map(row => {
      let frontendStatus = 'pending';
      if (['confirmed', 'active', 'deposit_terbayar', 'terbayar_full'].includes(row.status)) {
        frontendStatus = 'approved';
      } else if (['expired', 'cancelled', 'cancel'].includes(row.status)) {
        frontendStatus = 'rejected';
      } else if (row.status) {
        frontendStatus = row.status;
      }

      return {
        id: row.id,
        propertyName: row.propertyName || `Property #${row.property_id}`,
        userName: row.tenantName || 'Anonymous Tenant',
        userEmail: row.tenantEmail || 'no-email@example.com',
        phone: row.tenantPhone || '',
        moveInDate: row.checkin_date ? new Date(row.checkin_date).toISOString().split('T')[0] : 'N/A',
        status: frontendStatus,
        createdAt: row.created_at,
        bookingType: row.booking_type,
        transitStartTime: row.transit_start_time || null,
        transitEndTime: row.transit_end_time || null,
        monthlyRent: row.monthly_rent,
        hourlyRate: row.hourly_rate,
        notes: row.notes,
        idCardNumber: row.tenantIdCardNumber || '',
        idCardPhoto: row.tenantIdCardPhoto || '',
        address: row.tenantAddress || '',
        emergencyContact: row.tenantEmergencyContact || '',
        emergencyPhone: row.tenantEmergencyPhone || '',
        approvedByName: row.approvedByName || null
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// POST a new booking linking/creating tenants
app.post('/api/bookings', async (req, res) => {
  try {
    const { 
      propertyName, 
      userName, 
      userEmail, 
      phone, 
      moveInDate,
      bookingType = 'monthly',
      transitDate,
      transitStartTime,
      transitEndTime,
      duration,
      tenantId: bodyTenantId,
      idCardNumber,
      idCardPhoto,
      address,
      emergencyContact,
      emergencyPhone,
      surveyDate,
      surveyTime,
      notes: bodyNotes
    } = req.body;

    if (!userName || !userEmail || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone number are required.' });
    }

    let propertyId = null;
    let rentPrice = 1500000;
    const durationHours = duration ? parseInt(duration, 10) : 3;
    let hourlyRate = null;
    let depositAmount = 50000;
    const [propRows] = await pool.query('SELECT id, price, promo_price, transit_3h, transit_6h, transit_12h, transit_24h, deposit FROM properties WHERE name = ? LIMIT 1', [propertyName]);
    if (propRows.length > 0) {
      propertyId = propRows[0].id;
      rentPrice = propRows[0].promo_price || propRows[0].price;
      const rateVal = durationHours === 3 ? propRows[0].transit_3h : durationHours === 6 ? propRows[0].transit_6h : durationHours === 12 ? propRows[0].transit_12h : durationHours === 24 ? propRows[0].transit_24h : null;
      hourlyRate = rateVal ? rateVal / durationHours : null;
      depositAmount = propRows[0].deposit !== null && propRows[0].deposit !== undefined ? propRows[0].deposit : 50000;
    } else {
      const [propRows2] = await pool.query('SELECT id, price, promo_price, transit_3h, transit_6h, transit_12h, transit_24h, deposit FROM properties WHERE name LIKE ? LIMIT 1', [`%${propertyName}%`]);
      if (propRows2.length > 0) {
        propertyId = propRows2[0].id;
        rentPrice = propRows2[0].promo_price || propRows2[0].price;
        const rateVal = durationHours === 3 ? propRows2[0].transit_3h : durationHours === 6 ? propRows2[0].transit_6h : durationHours === 12 ? propRows2[0].transit_12h : durationHours === 24 ? propRows2[0].transit_24h : null;
        hourlyRate = rateVal ? rateVal / durationHours : null;
        depositAmount = propRows2[0].deposit !== null && propRows2[0].deposit !== undefined ? propRows2[0].deposit : 50000;
      } else {
        const [propRows3] = await pool.query('SELECT id, price, promo_price, transit_3h, transit_6h, transit_12h, transit_24h, deposit FROM properties LIMIT 1');
        if (propRows3.length > 0) {
          propertyId = propRows3[0].id;
          rentPrice = propRows3[0].promo_price || propRows3[0].price;
          const rateVal = durationHours === 3 ? propRows3[0].transit_3h : durationHours === 6 ? propRows3[0].transit_6h : durationHours === 12 ? propRows3[0].transit_12h : durationHours === 24 ? propRows3[0].transit_24h : null;
          hourlyRate = rateVal ? rateVal / durationHours : null;
          depositAmount = propRows3[0].deposit !== null && propRows3[0].deposit !== undefined ? propRows3[0].deposit : 50000;
        } else {
          return res.status(404).json({ error: 'No properties available to book.' });
        }
      }
    }

    let tenantId = bodyTenantId || null;
    if (!tenantId) {
      // Check if a tenant with this email OR phone already exists
      const [existingTenant] = await pool.query(
        'SELECT id FROM tenants WHERE email = ? OR phone = ? LIMIT 1',
        [userEmail, phone]
      );
      if (existingTenant.length > 0) {
        tenantId = existingTenant[0].id;
      } else {
        // Try to create a new tenant
        try {
          const hashedPassword = bcrypt.hashSync(phone, 10);
          const [insertTenant] = await pool.query(
            `INSERT INTO tenants (name, email, phone, status, password, id_card_number, id_card_photo, address, emergency_contact, emergency_phone) 
             VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
            [userName, userEmail, phone, hashedPassword, idCardNumber || null, idCardPhoto || null, address || null, emergencyContact || null, emergencyPhone || null]
          );
          tenantId = insertTenant.insertId;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            const [existingTenantFallback] = await pool.query(
              'SELECT id FROM tenants WHERE email = ? OR phone = ? LIMIT 1',
              [userEmail, phone]
            );
            if (existingTenantFallback.length > 0) {
              tenantId = existingTenantFallback[0].id;
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
    } else {
      // Verify tenantId exists
      const [tenantCheck] = await pool.query('SELECT id FROM tenants WHERE id = ? LIMIT 1', [tenantId]);
      if (tenantCheck.length === 0) {
        return res.status(400).json({ error: 'Sesi penyewa tidak valid.' });
      }
    }

    const referenceNumber = `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    let insertQuery = '';
    let insertParams = [];

    if (bookingType === 'transit') {
      const startDateTime = `${transitDate} ${transitStartTime}:00`;
      let endDateTime = null;
      let checkoutDate = transitDate;

      if (duration) {
        const durationHours = parseFloat(duration);
        const [yr, mo, dy] = transitDate.split('-').map(Number);
        const [hr, mn] = transitStartTime.split(':').map(Number);
        const startDateObj = new Date(yr, mo - 1, dy, hr, mn, 0);
        if (!isNaN(startDateObj.getTime())) {
          const endDateObj = new Date(startDateObj.getTime() + durationHours * 60 * 60 * 1000);
          const year = endDateObj.getFullYear();
          const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(endDateObj.getDate()).padStart(2, '0');
          const hours = String(endDateObj.getHours()).padStart(2, '0');
          const minutes = String(endDateObj.getMinutes()).padStart(2, '0');
          
          endDateTime = `${year}-${month}-${day} ${hours}:${minutes}:00`;
          checkoutDate = `${year}-${month}-${day}`;
        } else {
          endDateTime = `${transitDate} ${transitEndTime || transitStartTime}:00`;
        }
      } else if (transitEndTime) {
        endDateTime = `${transitDate} ${transitEndTime}:00`;
      } else {
        endDateTime = `${transitDate} ${transitStartTime}:00`;
      }

      insertQuery = `
        INSERT INTO bookings (
          property_id, tenant_id, booking_date, checkin_date, checkout_date,
          duration_months, transit_start_time, transit_end_time,
          monthly_rent, hourly_rate, deposit_amount, status,
          reference_number, booking_type
        ) VALUES (?, ?, CURDATE(), ?, ?, 0, ?, ?, ?, ?, 0, 'pending', ?, 'transit')
      `;
      insertParams = [
        propertyId,
        tenantId,
        transitDate,
        checkoutDate,
        startDateTime,
        endDateTime,
        rentPrice,
        hourlyRate,
        referenceNumber
      ];
    } else {
      let notes = bodyNotes || null;
      if (surveyDate) {
        notes = `Survei: ${surveyDate} pukul ${surveyTime || '10:00'}`;
      }
      insertQuery = `
        INSERT INTO bookings (
          property_id, tenant_id, booking_date, checkin_date,
          monthly_rent, deposit_amount, status, reference_number, booking_type, notes
        ) VALUES (?, ?, CURDATE(), ?, ?, ?, 'pending', ?, 'monthly', ?)
      `;
      insertParams = [
        propertyId,
        tenantId,
        moveInDate || new Date().toISOString().split('T')[0],
        rentPrice,
        depositAmount,
        referenceNumber,
        notes
      ];
    }

    const [result] = await pool.query(insertQuery, insertParams);

    // Calculate Midtrans Payment Amount
    let paymentAmount = 0;
    if (bookingType === 'transit') {
      const durationHours = duration ? parseFloat(duration) : 3;
      if (propRows.length > 0) {
        const rateVal = durationHours === 3 ? propRows[0].transit_3h 
                      : durationHours === 6 ? propRows[0].transit_6h 
                      : durationHours === 12 ? propRows[0].transit_12h 
                      : durationHours === 24 ? propRows[0].transit_24h 
                      : null;
        paymentAmount = rateVal || Math.ceil(durationHours * (hourlyRate || 0));
      }
      if (!paymentAmount || paymentAmount <= 0) {
        paymentAmount = rentPrice;
      }
    } else {
      paymentAmount = depositAmount || 50000;
    }

    let snapToken = null;
    let snapRedirectUrl = null;

    if (process.env.MIDTRANS_SERVER_KEY && process.env.MIDTRANS_SERVER_KEY !== 'SB-Mid-server-placeholder') {
      try {
        const parameter = {
          transaction_details: {
            order_id: referenceNumber,
            gross_amount: paymentAmount
          },
          customer_details: {
            first_name: userName,
            email: userEmail,
            phone: phone
          },
          item_details: [
            {
              id: `${bookingType}_booking_${propertyId}`,
              price: paymentAmount,
              quantity: 1,
              name: `${bookingType === 'transit' ? 'Transit' : 'Deposit'} Booking - ${propertyName.substring(0, 30)}`
            }
          ]
        };

        const transaction = await snap.createTransaction(parameter);
        snapToken = transaction.token;
        snapRedirectUrl = transaction.redirect_url;

        // Save snap token to bookings table
        await pool.query('UPDATE bookings SET snap_token = ? WHERE id = ?', [snapToken, result.insertId]);
      } catch (snapError) {
        console.error('Error generating Midtrans Snap token:', snapError);
      }
    }

    res.status(201).json({
      id: result.insertId,
      propertyName,
      userName,
      userEmail,
      phone,
      moveInDate: bookingType === 'transit' ? transitDate : moveInDate,
      status: 'pending',
      bookingType,
      referenceNumber,
      snapToken,
      snapRedirectUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit booking.' });
  }
});

// POST Midtrans Notification Webhook
app.post('/api/midtrans-webhook', async (req, res) => {
  try {
    const notification = req.body;
    const { order_id, transaction_status, status_code, gross_amount, signature_key } = notification;

    // Verify signature key
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const payload = order_id + status_code + gross_amount + serverKey;
    const calculatedSignature = crypto.createHash('sha512').update(payload).digest('hex');

    if (calculatedSignature !== signature_key) {
      console.warn(`[Midtrans Webhook] Invalid signature key for Order ${order_id}`);
      return res.status(403).json({ error: 'Invalid signature key' });
    }

    console.log(`[Midtrans Webhook] Received status ${transaction_status} for order ${order_id}`);

    let dbStatus = 'pending';
    let isSuccess = false;

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      dbStatus = 'confirmed'; // paid and approved
      isSuccess = true;
    } else if (transaction_status === 'pending') {
      dbStatus = 'pending';
    } else if (['deny', 'expire', 'cancel'].includes(transaction_status)) {
      dbStatus = 'cancelled';
    }

    // Find the booking corresponding to this reference number
    const [bookings] = await pool.query(
      `SELECT b.*, p.name AS property_name, p.branch_id AS prop_branch_id, t.name AS tenant_name
       FROM bookings b
       LEFT JOIN properties p ON b.property_id = p.id
       LEFT JOIN tenants t ON b.tenant_id = t.id
       WHERE b.reference_number = ? LIMIT 1`,
      [order_id]
    );

    if (bookings.length > 0) {
      const booking = bookings[0];

      // Update booking status and payment method
      await pool.query('UPDATE bookings SET status = ?, payment_method = ? WHERE id = ?', [dbStatus, notification.payment_type || null, booking.id]);

      // If payment is settled and booking wasn't already confirmed, record a transaction
      if (isSuccess && booking.status !== 'confirmed' && booking.status !== 'deposit_terbayar') {
        const branchId = booking.prop_branch_id || null;
        const amount = parseFloat(gross_amount);
        const description = `Midtrans Payment - Booking #${booking.id} - ${booking.property_name || 'Space'} (Tenant: ${booking.tenant_name || 'Guest'}, Ref: ${order_id})`;
        
        await pool.query(
          `INSERT INTO transactions (branch_id, transaction_type, category, amount, transaction_date, description, recorded_by) 
           VALUES (?, 'income', 'booking', ?, CURDATE(), ?, 1)`,
          [branchId, amount, description]
        );
      }
    } else {
      console.warn(`[Midtrans Webhook] Booking not found for Order ID: ${order_id}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Midtrans Webhook Error]:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// PUT (update status) booking
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminId, idCardNumber, idCardPhoto, address, emergencyContact, emergencyPhone } = req.body;

    let dbStatus = status;
    if (status === 'approved') {
      dbStatus = 'confirmed';
    } else if (status === 'rejected') {
      dbStatus = 'cancelled';
    }

    if (status === 'approved') {
      const [bookingRows] = await pool.query(
        `SELECT b.*, p.name AS property_name, p.branch_id AS prop_branch_id,
                p.transit_3h, p.transit_6h, p.transit_12h, p.transit_24h,
                t.name AS tenant_name
         FROM bookings b
         LEFT JOIN properties p ON b.property_id = p.id
         LEFT JOIN tenants t ON b.tenant_id = t.id
         WHERE b.id = ? LIMIT 1`,
        [id]
      );

      if (bookingRows.length === 0) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      const booking = bookingRows[0];
      const tenantId = booking.tenant_id;

      if (!idCardNumber || !idCardPhoto || !address || !emergencyContact || !emergencyPhone) {
        return res.status(400).json({ error: 'Informasi identitas (KTP/Passport) dan kontak darurat wajib diisi untuk persetujuan.' });
      }

      if (tenantId) {
        await pool.query(
          `UPDATE tenants 
           SET id_card_number = ?, id_card_photo = ?, address = ?, emergency_contact = ?, emergency_phone = ? 
           WHERE id = ?`,
          [idCardNumber, idCardPhoto, address, emergencyContact, emergencyPhone, tenantId]
        );
      }

      if (booking.status !== 'confirmed') {
        if (booking.booking_type === 'transit') {
          let amount = 0;
          const start = new Date(booking.transit_start_time);
          const end = new Date(booking.transit_end_time);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          const roundedHours = Math.round(hours);

          if (roundedHours === 3 && booking.transit_3h) {
            amount = booking.transit_3h;
          } else if (roundedHours === 6 && booking.transit_6h) {
            amount = booking.transit_6h;
          } else if (roundedHours === 12 && booking.transit_12h) {
            amount = booking.transit_12h;
          } else if (roundedHours === 24 && booking.transit_24h) {
            amount = booking.transit_24h;
          } else {
            const rate = booking.hourly_rate || 0;
            amount = Math.ceil(Math.max(1, hours) * rate);
          }

          if (isNaN(amount) || amount <= 0) {
            amount = booking.transit_3h || (booking.hourly_rate || 100000) * 3;
          }

          const branchId = booking.prop_branch_id || null;
          const recordedBy = adminId || booking.created_by || 1;
          const description = `Approved Booking #${booking.id} - ${booking.property_name || 'Space'} (Tenant: ${booking.tenant_name || 'Guest'}, Ref: ${booking.reference_number || 'N/A'})`;

          await pool.query(
            `INSERT INTO transactions (branch_id, transaction_type, category, amount, transaction_date, description, recorded_by) 
             VALUES (?, 'income', 'booking', ?, CURDATE(), ?, ?)`,
            [branchId, amount, description, recordedBy]
          );
        }
      }
    }

    await pool.query('UPDATE bookings SET status = ?, approved_by = ? WHERE id = ?', [dbStatus, adminId || null, id]);
    res.json({ id, status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update booking status.' });
  }
});

// DELETE a booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ message: 'Booking deleted successfully.', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete booking.' });
  }
});

// 3. Authentication Routes

// POST Admin Login
app.post('/api/login/admin', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? LIMIT 1', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const admin = rows[0];
    if (admin.is_active === 0) {
      return res.status(403).json({ error: 'This admin account is suspended.' });
    }

    // Convert $2y$ to $2a$ if needed for compatibility
    const safeHash = admin.password.startsWith('$2y$') 
      ? admin.password.replace(/^\$2y\$/, '$2a$') 
      : admin.password;

    const isMatch = bcrypt.compareSync(password, safeHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.json({
      role: admin.role || 'admin',
      id: admin.id,
      username: admin.username,
      name: admin.name || 'Administrator',
      email: admin.email,
      branchId: admin.branch_id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// POST Tenant Login
app.post('/api/login/tenant', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM tenants WHERE email = ? LIMIT 1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const tenant = rows[0];
    if (tenant.status === 'inactive') {
      return res.status(403).json({ error: 'This tenant account is inactive.' });
    }

    if (!tenant.password) {
      return res.status(401).json({ error: 'No password set for this account. Please submit a booking first.' });
    }

    // Convert $2y$ to $2a$ if needed
    const safeHash = tenant.password.startsWith('$2y$') 
      ? tenant.password.replace(/^\$2y\$/, '$2a$') 
      : tenant.password;

    const isMatch = bcrypt.compareSync(password, safeHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      role: 'tenant',
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// GET Tenant Details
app.get('/api/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, name, email, phone, id_card_number, id_card_photo, address, emergency_contact, emergency_phone, status, created_at FROM tenants WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tenant details.' });
  }
});

// GET all tenants (with optional role-based filtering for cashiers)
app.get('/api/tenants', async (req, res) => {
  try {
    const { adminId, role } = req.query;
    let query = `
      SELECT t.*, a.name AS pic_admin_name 
      FROM tenants t 
      LEFT JOIN admins a ON t.pic_admin_id = a.id
    `;
    const params = [];

    if (role === 'cashier' && adminId) {
      query += ` WHERE t.pic_admin_id = ? `;
      params.push(adminId);
    }
    query += ` ORDER BY t.id DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tenants.' });
  }
});

// POST a new tenant manually (assign to creator admin, set phone as default password)
app.post('/api/tenants', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      id_card_number, 
      id_card_photo, 
      address, 
      emergency_contact, 
      emergency_phone, 
      status, 
      pic_admin_id 
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    const defaultPassword = phone;
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    const [result] = await pool.query(
      `INSERT INTO tenants (
        name, email, phone, id_card_number, id_card_photo, address, 
        emergency_contact, emergency_phone, status, pic_admin_id, password
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email || null,
        phone,
        id_card_number || null,
        id_card_photo || null,
        address || null,
        emergency_contact || null,
        emergency_phone || null,
        status || 'active',
        pic_admin_id || null,
        hashedPassword
      ]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      phone,
      id_card_number,
      id_card_photo,
      address,
      emergency_contact,
      emergency_phone,
      status: status || 'active',
      pic_admin_id
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A tenant with this email or phone number already exists.' });
    }
    res.status(500).json({ error: 'Failed to create tenant.' });
  }
});

// PUT (update) an existing tenant
app.put('/api/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      email, 
      phone, 
      id_card_number, 
      id_card_photo, 
      address, 
      emergency_contact, 
      emergency_phone, 
      status, 
      pic_admin_id 
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    await pool.query(
      `UPDATE tenants 
       SET name = ?, email = ?, phone = ?, id_card_number = ?, id_card_photo = ?, address = ?, 
           emergency_contact = ?, emergency_phone = ?, status = ?, pic_admin_id = ?
       WHERE id = ?`,
      [
        name,
        email || null,
        phone,
        id_card_number || null,
        id_card_photo || null,
        address || null,
        emergency_contact || null,
        emergency_phone || null,
        status || 'active',
        pic_admin_id || null,
        id
      ]
    );

    res.json({
      id: parseInt(id, 10),
      name,
      email,
      phone,
      id_card_number,
      id_card_photo,
      address,
      emergency_contact,
      emergency_phone,
      status,
      pic_admin_id
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A tenant with this email or phone number already exists.' });
    }
    res.status(500).json({ error: 'Failed to update tenant.' });
  }
});

// GET all transactions (filtered by branch/recorded_by for cashier if applicable)
app.get('/api/transactions', async (req, res) => {
  try {
    const { adminId, role, branchId } = req.query;
    let query = `
      SELECT tr.*, a.name AS recorded_by_name 
      FROM transactions tr 
      LEFT JOIN admins a ON tr.recorded_by = a.id
    `;
    const params = [];

    if (role === 'cashier') {
      if (branchId && branchId !== 'null' && branchId !== 'undefined') {
        query += ` WHERE tr.branch_id = ? OR tr.recorded_by = ? `;
        params.push(branchId, adminId);
      } else if (adminId) {
        query += ` WHERE tr.recorded_by = ? `;
        params.push(adminId);
      }
    }
    query += ` ORDER BY tr.transaction_date DESC, tr.id DESC`;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// POST a new manual transaction (billing log)
app.post('/api/transactions', async (req, res) => {
  try {
    const { 
      branch_id, 
      transaction_type, 
      category, 
      amount, 
      transaction_date, 
      description, 
      recorded_by 
    } = req.body;

    if (!transaction_type || !amount || !transaction_date || !recorded_by) {
      return res.status(400).json({ error: 'Transaction type, amount, date, and recorded_by are required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO transactions (
        branch_id, transaction_type, category, amount, transaction_date, description, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id !== undefined ? branch_id : null,
        transaction_type,
        category || null,
        amount,
        transaction_date,
        description || null,
        recorded_by
      ]
    );

    res.status(201).json({
      id: result.insertId,
      branch_id,
      transaction_type,
      category,
      amount,
      transaction_date,
      description,
      recorded_by
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
});

// GET all articles
app.get('/api/articles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articles ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles.' });
  }
});

// GET single article by ID
app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM articles WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Article not found.' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching article details:', error);
    res.status(500).json({ error: 'Failed to fetch article.' });
  }
});

// POST a new article
app.post('/api/articles', async (req, res) => {
  try {
    const { title, content, image, read_time } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    const [result] = await pool.query(
      'INSERT INTO articles (title, content, image, read_time) VALUES (?, ?, ?, ?)',
      [title, content, image || '', read_time || '5 menit baca']
    );
    res.status(201).json({
      id: result.insertId,
      title,
      content,
      image: image || '',
      read_time: read_time || '5 menit baca',
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Failed to create article.' });
  }
});

// PUT (update) an article
app.put('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image, read_time } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }
    await pool.query(
      'UPDATE articles SET title = ?, content = ?, image = ?, read_time = ? WHERE id = ?',
      [title, content, image || '', read_time || '5 menit baca', id]
    );
    res.json({
      id: parseInt(id, 10),
      title,
      content,
      image,
      read_time
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Failed to update article.' });
  }
});

// DELETE an article
app.delete('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM articles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Article deleted successfully.', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Failed to delete article.' });
  }
});

// --- ADMINS (USER MANAGEMENT) API ROUTES ---

// GET all admins (excluding password hashes)
app.get('/api/admins', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, name, email, role, branch_id, is_active, created_at FROM admins ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to fetch admin users.' });
  }
});

// POST create a new admin
app.post('/api/admins', async (req, res) => {
  try {
    const { username, password, name, email, role, branch_id, is_active } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const [result] = await pool.query(
      `INSERT INTO admins (username, password, name, email, role, branch_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        hashedPassword,
        name,
        email || null,
        role || 'admin',
        branch_id !== undefined && branch_id !== '' && branch_id !== null ? parseInt(branch_id, 10) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1
      ]
    );

    res.status(201).json({
      id: result.insertId,
      username,
      name,
      email,
      role: role || 'admin',
      branch_id: branch_id || null,
      is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    res.status(500).json({ error: 'Failed to create admin user.' });
  }
});

// PUT update an admin user
app.put('/api/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, name, email, role, branch_id, is_active } = req.body;
    if (!username || !name) {
      return res.status(400).json({ error: 'Username and name are required.' });
    }

    let updateQuery = `
      UPDATE admins 
      SET username = ?, name = ?, email = ?, role = ?, branch_id = ?, is_active = ?
    `;
    const params = [
      username,
      name,
      email || null,
      role || 'admin',
      branch_id !== undefined && branch_id !== '' && branch_id !== null ? parseInt(branch_id, 10) : null,
      is_active !== undefined ? (is_active ? 1 : 0) : 1
    ];

    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      updateQuery += `, password = ? `;
      params.push(hashedPassword);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    await pool.query(updateQuery, params);

    res.json({
      id: parseInt(id, 10),
      username,
      name,
      email,
      role,
      branch_id,
      is_active
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    res.status(500).json({ error: 'Failed to update admin user.' });
  }
});

// DELETE an admin user
app.delete('/api/admins/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM admins WHERE id = ?', [id]);
    res.json({ success: true, message: 'Admin user deleted successfully.', id: parseInt(id, 10) });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ error: 'Failed to delete admin user.' });
  }
});

// GET Website Settings
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT `setting_key`, `setting_value` FROM settings');
    const settings = {};
    rows.forEach(row => {
      let val = row.setting_value;
      try {
        val = JSON.parse(row.setting_value);
      } catch (e) {
        // Fallback to raw string if it is not valid JSON
      }
      settings[row.setting_key] = val;
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// PUT (update) Website Settings
app.put('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings object.' });
    }

    // Save each key-value pair as a JSON serialized string
    const promises = Object.entries(settings).map(([key, val]) => {
      const valStr = JSON.stringify(val);
      return pool.query(
        'INSERT INTO settings (`setting_key`, `setting_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `setting_value` = ?',
        [key, valStr, valStr]
      );
    });

    await Promise.all(promises);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from dist directory
  app.use(express.static(path.join(__dirname, 'dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start Express Server
app.listen(port, () => {
  console.log(`Express Server running on port ${port}`);
});
