import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const uploadedLogoPath = 'C:/Users/ADMIN/.gemini/antigravity-ide/brain/d62df4c3-541a-4c0d-b500-9abea96f16ae/.user_uploaded/media_1791526338306.png';
const outputDir = path.resolve('playstore-assets');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  console.log('Generating Play Store Assets...');

  // --- 1. App Icon 512x512 ---
  // Create crisp SVG containing the logo icon shape & luxury background
  const iconSvg = `
  <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#090d16" />
        <stop offset="100%" stop-color="#020617" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="50%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="15" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
    
    <!-- Subtle Inner Border -->
    <rect x="12" y="12" width="488" height="488" rx="98" fill="none" stroke="url(#goldGrad)" stroke-width="2" stroke-opacity="0.3" />

    <!-- Ambient Glow behind logo -->
    <circle cx="256" cy="256" r="140" fill="#f59e0b" opacity="0.12" filter="url(#glow)"/>

    <!-- Highlanderstay Architectural 4-Pane Arch Logo -->
    <g transform="translate(146, 136)" filter="url(#subtleShadow)">
      <!-- Top Left Arch Pane -->
      <path d="M 10 100 A 90 90 0 0 1 100 10 L 100 100 Z" fill="url(#goldGrad)" />
      <!-- Top Right Arch Pane -->
      <path d="M 120 100 L 120 10 A 90 90 0 0 1 210 100 Z" fill="url(#goldGrad)" />
      <!-- Bottom Left Square Pane -->
      <rect x="10" y="120" width="90" height="90" rx="6" fill="url(#goldGrad)" />
      <!-- Bottom Right Square Pane -->
      <rect x="120" y="120" width="90" height="90" rx="6" fill="url(#goldGrad)" />
    </g>
  </svg>
  `;

  await sharp(Buffer.from(iconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(outputDir, '1_app_icon_512x512.png'));
  console.log('✓ 1_app_icon_512x512.png generated.');

  // --- 2. Feature Graphic 1024x500 ---
  const featureSvg = `
  <svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="featBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="50%" stop-color="#020617" />
        <stop offset="100%" stop-color="#0b1120" />
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fde68a" />
        <stop offset="40%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
      </linearGradient>
      <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.8"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="1024" height="500" fill="url(#featBg)"/>

    <!-- Decorative Glow Circles -->
    <circle cx="200" cy="250" r="300" fill="url(#goldGlow)"/>
    <circle cx="850" cy="150" r="250" fill="url(#goldGlow)"/>

    <!-- Grid / Halftone Tech Lines -->
    <line x1="0" y1="100" x2="1024" y2="100" stroke="#334155" stroke-opacity="0.2" stroke-dasharray="8,8"/>
    <line x1="0" y1="250" x2="1024" y2="250" stroke="#334155" stroke-opacity="0.2" stroke-dasharray="8,8"/>
    <line x1="0" y1="400" x2="1024" y2="400" stroke="#334155" stroke-opacity="0.2" stroke-dasharray="8,8"/>

    <!-- Left: Logo & Typography -->
    <g transform="translate(80, 110)" filter="url(#shadow)">
      <!-- Logo Shape -->
      <g transform="translate(0, 30) scale(0.65)">
        <path d="M 10 100 A 90 90 0 0 1 100 10 L 100 100 Z" fill="url(#gold)" />
        <path d="M 120 100 L 120 10 A 90 90 0 0 1 210 100 Z" fill="url(#gold)" />
        <rect x="10" y="120" width="90" height="90" rx="6" fill="url(#gold)" />
        <rect x="120" y="120" width="90" height="90" rx="6" fill="url(#gold)" />
      </g>

      <g transform="translate(170, 60)">
        <text x="0" y="25" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="2">HIGHLANDERSTAY</text>
        <text x="0" y="65" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="20" fill="url(#gold)" letter-spacing="1">SEWA KOS &amp; HUNIAN EKSKLUSIF</text>
        <text x="0" y="100" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="14" fill="#94a3b8">Kamar Kos Premium • Bayar Online • Tenant Portal Mandiri</text>
      </g>
    </g>

    <!-- Right: Mockup Feature Cards -->
    <g transform="translate(620, 80)" filter="url(#shadow)">
      <!-- Card 1 -->
      <rect x="0" y="20" width="330" height="130" rx="20" fill="url(#cardGrad)" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1.5"/>
      <circle cx="45" cy="85" r="22" fill="#f59e0b" fill-opacity="0.15"/>
      <text x="45" y="92" text-anchor="middle" font-size="20" fill="#f59e0b">📍</text>
      <text x="80" y="75" font-family="system-ui, sans-serif" font-weight="700" font-size="16" fill="#f8fafc">Peta Interaktif Lokasi</text>
      <text x="80" y="98" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">Cari kos dekat kampus &amp; kantor</text>

      <!-- Card 2 -->
      <rect x="30" y="175" width="330" height="130" rx="20" fill="url(#cardGrad)" stroke="#10b981" stroke-opacity="0.3" stroke-width="1.5"/>
      <circle cx="75" cy="240" r="22" fill="#10b981" fill-opacity="0.15"/>
      <text x="75" y="247" text-anchor="middle" font-size="20" fill="#10b981">💳</text>
      <text x="110" y="230" font-family="system-ui, sans-serif" font-weight="700" font-size="16" fill="#f8fafc">Bayar Sewa &amp; QRIS Instan</text>
      <text x="110" y="253" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">Invoice otomatis &amp; konfirmasi cepat</text>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(featureSvg))
    .resize(1024, 500)
    .png()
    .toFile(path.join(outputDir, '2_feature_graphic_1024x500.png'));
  console.log('✓ 2_feature_graphic_1024x500.png generated.');

  // --- Helper function for screenshots 1080x1920 ---
  async function generateScreenshot({ filename, badge, title, subtitle, mockupType }) {
    const screenshotSvg = `
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="screenBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#020617" />
          <stop offset="50%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
        <linearGradient id="goldText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde68a" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
        <linearGradient id="phoneBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0b0f19" />
        </linearGradient>
        <filter id="phoneShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="30" stdDeviation="35" flood-color="#000000" flood-opacity="0.9"/>
        </filter>
      </defs>

      <!-- Background Canvas -->
      <rect width="1080" height="1920" fill="url(#screenBg)" />

      <!-- Ambient Glow Circle -->
      <circle cx="540" cy="400" r="450" fill="#f59e0b" fill-opacity="0.08" />

      <!-- Top Text Header -->
      <g transform="translate(540, 160)" text-anchor="middle">
        <!-- Badge -->
        <rect x="-180" y="0" width="360" height="46" rx="23" fill="#f59e0b" fill-opacity="0.12" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1.5"/>
        <text x="0" y="30" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="18" fill="url(#goldText)" letter-spacing="3">${badge.toUpperCase()}</text>

        <!-- Main Title -->
        <text x="0" y="110" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="#ffffff">${title}</text>
        <!-- Subtitle -->
        <text x="0" y="170" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="26" fill="#94a3b8">${subtitle}</text>
      </g>

      <!-- Phone Mockup Container -->
      <g transform="translate(190, 430)" filter="url(#phoneShadow)">
        <!-- Phone Outer Frame -->
        <rect x="0" y="0" width="700" height="1420" rx="60" fill="#000000" stroke="#334155" stroke-width="6"/>
        <!-- Inner Screen -->
        <rect x="15" y="15" width="670" height="1390" rx="46" fill="url(#phoneBody)"/>

        <!-- Dynamic Island / Notch -->
        <rect x="235" y="30" width="200" height="34" rx="17" fill="#000000"/>

        <!-- App UI Inside Screen -->
        <!-- App Top Bar -->
        <g transform="translate(45, 90)">
          <!-- App Small Logo -->
          <g transform="scale(0.18)">
            <path d="M 10 100 A 90 90 0 0 1 100 10 L 100 100 Z" fill="#f59e0b" />
            <path d="M 120 100 L 120 10 A 90 90 0 0 1 210 100 Z" fill="#f59e0b" />
            <rect x="10" y="120" width="90" height="90" rx="6" fill="#f59e0b" />
            <rect x="120" y="120" width="90" height="90" rx="6" fill="#f59e0b" />
          </g>
          <text x="50" y="28" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#ffffff">Highlanderstay</text>
          <circle cx="560" cy="20" r="18" fill="#334155"/>
          <text x="560" y="27" text-anchor="middle" font-size="16" fill="#f59e0b">👤</text>
        </g>

        ${getMockupContent(mockupType)}
      </g>
    </svg>
    `;

    await sharp(Buffer.from(screenshotSvg))
      .resize(1080, 1920)
      .png()
      .toFile(path.join(outputDir, filename));
    console.log(`✓ ${filename} generated.`);
  }

  function getMockupContent(type) {
    if (type === 'home') {
      return `
        <!-- Hero Section -->
        <g transform="translate(40, 160)">
          <rect x="0" y="0" width="590" height="340" rx="30" fill="#1e293b" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1.5"/>
          <text x="30" y="60" font-family="system-ui, sans-serif" font-weight="800" font-size="28" fill="#ffffff">Temukan Hunian Impian</text>
          <text x="30" y="95" font-family="system-ui, sans-serif" font-size="16" fill="#94a3b8">Kamar kos nyaman, aman &amp; fasilitas komplit</text>
          
          <!-- Search Bar -->
          <rect x="30" y="130" width="530" height="60" rx="16" fill="#0f172a" stroke="#475569" stroke-width="1"/>
          <text x="60" y="168" font-family="system-ui, sans-serif" font-size="17" fill="#64748b">🔍  Cari lokasi kampus, kota atau kos...</text>

          <!-- Quick Filters -->
          <g transform="translate(30, 220)">
            <rect x="0" y="0" width="120" height="40" rx="20" fill="#f59e0b"/><text x="60" y="26" text-anchor="middle" font-size="14" font-weight="700" fill="#020617">Semua</text>
            <rect x="135" y="0" width="120" height="40" rx="20" fill="#334155"/><text x="195" y="26" text-anchor="middle" font-size="14" font-weight="600" fill="#e2e8f0">Eksklusif</text>
            <rect x="270" y="0" width="120" height="40" rx="20" fill="#334155"/><text x="330" y="26" text-anchor="middle" font-size="14" font-weight="600" fill="#e2e8f0">Campur</text>
            <rect x="405" y="0" width="120" height="40" rx="20" fill="#334155"/><text x="465" y="26" text-anchor="middle" font-size="14" font-weight="600" fill="#e2e8f0">Putri</text>
          </g>
        </g>

        <!-- Room Listing Card 1 -->
        <g transform="translate(40, 530)">
          <rect x="0" y="0" width="590" height="380" rx="26" fill="#1e293b" stroke="#334155"/>
          <rect x="15" y="15" width="560" height="200" rx="18" fill="#334155"/>
          <text x="295" y="125" text-anchor="middle" font-size="40" fill="#f59e0b">🛏️</text>
          <text x="30" y="260" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#ffffff">Highlander Stay Kostel Premiere</text>
          <text x="30" y="290" font-family="system-ui, sans-serif" font-size="15" fill="#94a3b8">📍 Dekat Kampus • AC, WiFi, Kamar Mandi Dalam</text>
          <text x="30" y="345" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#f59e0b">Rp 1.850.000 <tspan font-size="15" fill="#94a3b8" font-weight="400">/ bulan</tspan></text>
          <rect x="420" y="310" width="140" height="45" rx="12" fill="#f59e0b"/>
          <text x="490" y="338" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="14" fill="#020617">Pesan Unit</text>
        </g>
      `;
    }

    if (type === 'catalog') {
      return `
        <!-- Catalog Header -->
        <g transform="translate(40, 160)">
          <text x="0" y="30" font-family="system-ui, sans-serif" font-weight="800" font-size="26" fill="#ffffff">Katalog Unit &amp; Kamar Tersedia</text>
          <text x="0" y="60" font-family="system-ui, sans-serif" font-size="15" fill="#94a3b8">Pilihan kamar siap huni dengan jaminan kenyamanan</text>
        </g>

        <!-- Room 1 -->
        <g transform="translate(40, 250)">
          <rect x="0" y="0" width="590" height="280" rx="22" fill="#1e293b" stroke="#334155"/>
          <rect x="20" y="20" width="220" height="240" rx="16" fill="#334155"/>
          <text x="130" y="150" text-anchor="middle" font-size="50">🛋️</text>
          <g transform="translate(260, 40)">
            <text x="0" y="20" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="#ffffff">Deluxe Queen Studio</text>
            <text x="0" y="55" font-family="system-ui, sans-serif" font-size="14" fill="#10b981" font-weight="600">● 3 Unit Tersedia</text>
            <text x="0" y="90" font-family="system-ui, sans-serif" font-size="13" fill="#94a3b8">Kasur Queen, Smart TV, Balkon</text>
            <text x="0" y="145" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#f59e0b">Rp 2.200.000</text>
            <rect x="0" y="170" width="130" height="40" rx="10" fill="#f59e0b"/>
            <text x="65" y="196" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#020617">Lihat Detail</text>
          </g>
        </g>

        <!-- Room 2 -->
        <g transform="translate(40, 560)">
          <rect x="0" y="0" width="590" height="280" rx="22" fill="#1e293b" stroke="#334155"/>
          <rect x="20" y="20" width="220" height="240" rx="16" fill="#334155"/>
          <text x="130" y="150" text-anchor="middle" font-size="50">🛏️</text>
          <g transform="translate(260, 40)">
            <text x="0" y="20" font-family="system-ui, sans-serif" font-weight="800" font-size="20" fill="#ffffff">Standard Executive</text>
            <text x="0" y="55" font-family="system-ui, sans-serif" font-size="14" fill="#10b981" font-weight="600">● 1 Unit Tersedia</text>
            <text x="0" y="90" font-family="system-ui, sans-serif" font-size="13" fill="#94a3b8">AC, Meja Kerja, Water Heater</text>
            <text x="0" y="145" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#f59e0b">Rp 1.650.000</text>
            <rect x="0" y="170" width="130" height="40" rx="10" fill="#f59e0b"/>
            <text x="65" y="196" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#020617">Lihat Detail</text>
          </g>
        </g>
      `;
    }

    if (type === 'map') {
      return `
        <!-- Map Mockup Graphic -->
        <g transform="translate(40, 160)">
          <rect x="0" y="0" width="590" height="700" rx="26" fill="#091322" stroke="#334155"/>
          
          <!-- Mock Map Roads -->
          <path d="M 0 150 Q 200 180 590 100" stroke="#1e293b" stroke-width="24" fill="none"/>
          <path d="M 180 0 L 220 700" stroke="#1e293b" stroke-width="20" fill="none"/>
          <path d="M 400 0 Q 360 400 590 550" stroke="#1e293b" stroke-width="16" fill="none"/>

          <!-- Map Pin 1 -->
          <g transform="translate(180, 240)">
            <circle cx="0" cy="0" r="30" fill="#f59e0b" fill-opacity="0.3"/>
            <circle cx="0" cy="0" r="16" fill="#f59e0b"/>
            <rect x="-80" y="-70" width="160" height="40" rx="10" fill="#020617" stroke="#f59e0b" stroke-width="1.5"/>
            <text x="0" y="-45" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#ffffff">Highlander 1 (1.2 km)</text>
          </g>

          <!-- Map Pin 2 -->
          <g transform="translate(390, 420)">
            <circle cx="0" cy="0" r="30" fill="#10b981" fill-opacity="0.3"/>
            <circle cx="0" cy="0" r="16" fill="#10b981"/>
            <rect x="-80" y="-70" width="160" height="40" rx="10" fill="#020617" stroke="#10b981" stroke-width="1.5"/>
            <text x="0" y="-45" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="13" fill="#ffffff">Highlander 2 (3.4 km)</text>
          </g>

          <!-- User GPS Location Pulse -->
          <g transform="translate(300, 560)">
            <circle cx="0" cy="0" r="28" fill="#38bdf8" fill-opacity="0.3"/>
            <circle cx="0" cy="0" r="12" fill="#38bdf8" stroke="#ffffff" stroke-width="3"/>
          </g>
        </g>
      `;
    }

    if (type === 'portal') {
      return `
        <!-- Tenant Dashboard Mockup -->
        <g transform="translate(40, 160)">
          <!-- Tenant Profile Card -->
          <rect x="0" y="0" width="590" height="150" rx="22" fill="#1e293b" stroke="#334155"/>
          <circle cx="65" cy="75" r="35" fill="#f59e0b"/>
          <text x="65" y="87" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#020617">B</text>
          <text x="125" y="65" font-family="system-ui, sans-serif" font-weight="800" font-size="22" fill="#ffffff">Budi Santoso</text>
          <text x="125" y="95" font-family="system-ui, sans-serif" font-size="14" fill="#10b981" font-weight="600">✓ Tenant Aktif • Kamar 204</text>
        </g>

        <!-- Invoice & Billing Card -->
        <g transform="translate(40, 340)">
          <rect x="0" y="0" width="590" height="230" rx="22" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
          <text x="30" y="45" font-family="system-ui, sans-serif" font-weight="800" font-size="18" fill="#f59e0b">📄 Tagihan Sewa Bulan Ini</text>
          <text x="30" y="90" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#ffffff">Rp 1.850.000</text>
          <text x="30" y="125" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8">Jatuh Tempo: 25 Oktober 2026</text>
          <rect x="30" y="150" width="530" height="50" rx="14" fill="#f59e0b"/>
          <text x="295" y="182" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#020617">Bayar Online Sekarang (QRIS / VA)</text>
        </g>

        <!-- Maintenance Ticket Card -->
        <g transform="translate(40, 600)">
          <rect x="0" y="0" width="590" height="180" rx="22" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="30" y="45" font-family="system-ui, sans-serif" font-weight="800" font-size="18" fill="#38bdf8">🔧 Tiket Komplain Perbaikan</text>
          <text x="30" y="85" font-family="system-ui, sans-serif" font-weight="700" font-size="16" fill="#ffffff">Pembersihan AC Kamar</text>
          <text x="30" y="115" font-family="system-ui, sans-serif" font-size="13" fill="#10b981">● Sedang Dikerjakan Teknisi</text>
          <rect x="400" y="70" width="160" height="40" rx="10" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="1"/>
          <text x="480" y="95" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#38bdf8">Buat Tiket Baru</text>
        </g>
      `;
    }
    return '';
  }

  const escapeXml = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Generate the 4 phone screenshots
  await generateScreenshot({
    filename: 'screenshot_1_home_1080x1920.png',
    badge: 'Hunian Eksklusif',
    title: escapeXml('Sewa Kos Jadi Mudah'),
    subtitle: escapeXml('Cari & booking kamar kos impian Anda dalam satu aplikasi'),
    mockupType: 'home'
  });

  await generateScreenshot({
    filename: 'screenshot_2_catalog_1080x1920.png',
    badge: 'Pilihan Kamar Lengkap',
    title: escapeXml('Katalog & Fasilitas Real'),
    subtitle: escapeXml('Lihat spesifikasi kamar, fasilitas komplit & ketersediaan unit'),
    mockupType: 'catalog'
  });

  await generateScreenshot({
    filename: 'screenshot_3_map_1080x1920.png',
    badge: 'Peta Lokasi Interaktif',
    title: escapeXml('Temukan Kos Terdekat'),
    subtitle: escapeXml('Eksplorasi lokasi strategis di sekitar kampus dan kantor'),
    mockupType: 'map'
  });

  await generateScreenshot({
    filename: 'screenshot_4_tenant_portal_1080x1920.png',
    badge: 'Portal Mandiri Penghuni',
    title: escapeXml('Bayar Sewa & Lapor Praktis'),
    subtitle: escapeXml('Cek tagihan invoice bulanan, bayar QRIS & ajukan komplain perbaikan'),
    mockupType: 'portal'
  });

  console.log('All Play Store assets generated successfully in playstore-assets folder!');
}

run().catch(console.error);
