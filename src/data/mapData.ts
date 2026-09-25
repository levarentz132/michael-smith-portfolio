import type { Property } from '../api';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LandmarkItem {
  id: string;
  name: string;
  category: 'university' | 'mall' | 'transit' | 'hospital' | 'office' | 'attraction' | 'custom' | 'gps';
  area: string;
  city?: string;
  lat: number;
  lng: number;
  icon?: string;
  description?: string;
}

export interface PropertyWithDistance extends Property {
  coordinates: Coordinates;
  distanceKm?: number;
  distanceFormatted?: string;
  travelTimeFormatted?: string;
  walkingTimeFormatted?: string;
}

export const DEFAULT_FALLBACK_PROPERTIES: Property[] = [
  {
    id: 1,
    title: 'Highlander Greenville',
    slug: 'greenville',
    canonicalSlug: 'greenville',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.650.000 / bulan',
    priceRange: 'Rp 1.650.000 - Rp 2.200.000 / bulan',
    rawPrice: 1650000,
    location: 'Kebon Jeruk',
    kecamatan: 'Kebon Jeruk',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 3,
    availabilityStatus: 'Ready 3 kamar',
    status: 'available',
    description: 'Kos eksklusif dekat Green Ville & Tanjung Duren. Fasilitas lengkap: AC, WiFi kencang, Kamar Mandi Dalam, Water Heater.'
  },
  {
    id: 2,
    title: 'Highlander Tanjung Duren 795',
    slug: 'td795',
    canonicalSlug: 'td-795',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.500.000 / bulan',
    priceRange: 'Rp 1.500.000 - Rp 2.000.000 / bulan',
    rawPrice: 1500000,
    location: 'Grogol',
    kecamatan: 'Grogol',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 2,
    availabilityStatus: 'Ready 2 kamar',
    status: 'available',
    description: 'Sangat dekat dengan Kampus UNTAR 1 & 2, Trisakti, Mall Central Park, dan Neo Soho.'
  },
  {
    id: 3,
    title: 'Highlander Tanjung Duren 647',
    slug: 'td647',
    canonicalSlug: 'td-647',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.450.000 / bulan',
    priceRange: 'Rp 1.450.000 - Rp 1.900.000 / bulan',
    rawPrice: 1450000,
    location: 'Grogol',
    kecamatan: 'Grogol',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 4,
    availabilityStatus: 'Ready 4 kamar',
    status: 'available',
    description: 'Lokasi strategis di Tanjung Duren Barat, dekat sentra kuliner dan transportasi umum.'
  },
  {
    id: 4,
    title: 'Highlander Alpukat Tanjung Duren',
    slug: 'alpukat',
    canonicalSlug: 'alpukat',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.550.000 / bulan',
    priceRange: 'Rp 1.550.000 - Rp 2.100.000 / bulan',
    rawPrice: 1550000,
    location: 'Grogol',
    kecamatan: 'Grogol',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 1,
    availabilityStatus: 'Ready 1 kamar',
    status: 'available',
    description: 'Dekat dengan Mall Ciputra (Citraland) & Stasiun KRL Grogol.'
  },
  {
    id: 5,
    title: 'Highlander TD Guest House',
    slug: 'td-guest',
    canonicalSlug: 'td-guest',
    category: 'Guest House & Co-Living',
    type: 'kos',
    price: 'Rp 1.800.000 / bulan',
    priceRange: 'Rp 1.800.000 - Rp 2.500.000 / bulan',
    rawPrice: 1800000,
    location: 'Grogol',
    kecamatan: 'Grogol',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 2,
    availabilityStatus: 'Ready 2 kamar',
    status: 'available',
    description: 'Hunian modern dengan area santai luas, pantry bersama, dan parkiran aman.'
  },
  {
    id: 6,
    title: 'Highlander Pesing Lama',
    slug: 'pesing-lama',
    canonicalSlug: 'pesing-lama',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.300.000 / bulan',
    priceRange: 'Rp 1.300.000 - Rp 1.700.000 / bulan',
    rawPrice: 1300000,
    location: 'Kebon Jeruk',
    kecamatan: 'Kebon Jeruk',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 3,
    availabilityStatus: 'Ready 3 kamar',
    status: 'available',
    description: 'Dekat dengan Stasiun KRL Pesing & Daan Mogot.'
  },
  {
    id: 7,
    title: 'Highlander Pesing Baru',
    slug: 'pesing-baru',
    canonicalSlug: 'pesing-baru',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.350.000 / bulan',
    priceRange: 'Rp 1.350.000 - Rp 1.800.000 / bulan',
    rawPrice: 1350000,
    location: 'Kebon Jeruk',
    kecamatan: 'Kebon Jeruk',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 2,
    availabilityStatus: 'Ready 2 kamar',
    status: 'available',
    description: 'Akses cepat ke Daan Mogot, Grogol, dan Tol Lingkar Luar.'
  },
  {
    id: 8,
    title: 'Highlander Green Garden',
    slug: 'green-garden',
    canonicalSlug: 'green-garden',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.600.000 / bulan',
    priceRange: 'Rp 1.600.000 - Rp 2.100.000 / bulan',
    rawPrice: 1600000,
    location: 'Kebon Jeruk',
    kecamatan: 'Kebon Jeruk',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4570?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 2,
    availabilityStatus: 'Ready 2 kamar',
    status: 'available',
    description: 'Komplek Green Garden asri & bebas banjir, dekat RS Graha Kedoya.'
  },
  {
    id: 9,
    title: 'Highlander Sumur Bor',
    slug: 'sumur-bor',
    canonicalSlug: 'sumur-bor',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.250.000 / bulan',
    priceRange: 'Rp 1.250.000 - Rp 1.650.000 / bulan',
    rawPrice: 1250000,
    location: 'Cengkareng',
    kecamatan: 'Cengkareng',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 5,
    availabilityStatus: 'Ready 5 kamar',
    status: 'available',
    description: 'Jl. Sumur Bor Raya, dekat Mall Daan Mogot dan RSUD Cengkareng.'
  },
  {
    id: 10,
    title: 'Highlander Pedongkelan',
    slug: 'pedongkelan',
    canonicalSlug: 'pedongkelan',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.200.000 / bulan',
    priceRange: 'Rp 1.200.000 - Rp 1.600.000 / bulan',
    rawPrice: 1200000,
    location: 'Cengkareng',
    kecamatan: 'Cengkareng',
    rating: '4.7 ★',
    image: 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ba98a?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 3,
    availabilityStatus: 'Ready 3 kamar',
    status: 'available',
    description: 'Dekat Halte Busway Pedongkelan dan Universitas Satyagama.'
  },
  {
    id: 11,
    title: 'Highlander Taman Mahkota',
    slug: 'taman-mahkota',
    canonicalSlug: 'taman-mahkota',
    category: 'Airport Co-Living',
    type: 'kos',
    price: 'Rp 1.400.000 / bulan',
    priceRange: 'Rp 1.400.000 - Rp 1.950.000 / bulan',
    rawPrice: 1400000,
    location: 'Tangerang',
    kecamatan: 'Tangerang',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 4,
    availabilityStatus: 'Ready 4 kamar',
    status: 'available',
    description: 'Hanya 10 menit ke Bandara Soekarno-Hatta (CGK), sangat cocok untuk kru maskapai & karyawan bandara.'
  },
  {
    id: 12,
    title: 'Highlander Jelambar',
    slug: 'jelambar',
    canonicalSlug: 'jelambar',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.350.000 / bulan',
    priceRange: 'Rp 1.350.000 - Rp 1.800.000 / bulan',
    rawPrice: 1350000,
    location: 'Grogol',
    kecamatan: 'Grogol',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 2,
    availabilityStatus: 'Ready 2 kamar',
    status: 'available',
    description: 'Dekat Stasiun KRL Grogol & Pesing, akses cepat ke Roxy dan Daan Mogot.'
  },
  {
    id: 13,
    title: 'Highlander Rajawali Kemayoran',
    slug: 'rajawali',
    canonicalSlug: 'rajawali',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.750.000 / bulan',
    priceRange: 'Rp 1.750.000 - Rp 2.400.000 / bulan',
    rawPrice: 1750000,
    location: 'Kemayoran',
    kecamatan: 'Kemayoran',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 3,
    availabilityStatus: 'Ready 3 kamar',
    status: 'available',
    description: 'Jl. Rajawali Selatan, dekat JIExpo Kemayoran, Stasiun Rajawali, dan PRJ.'
  },
  {
    id: 14,
    title: 'Highlander Pakjo Palembang',
    slug: 'pakjo',
    canonicalSlug: 'pakjo',
    category: 'Premium Boarding Room',
    type: 'kos',
    price: 'Rp 1.200.000 / bulan',
    priceRange: 'Rp 1.200.000 - Rp 1.600.000 / bulan',
    rawPrice: 1200000,
    location: 'Palembang',
    kecamatan: 'Palembang',
    rating: '4.8 ★',
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 4,
    availabilityStatus: 'Ready 4 kamar',
    status: 'available',
    description: 'Jl. Inspektur Marzuki / Pakjo, dekat Palembang Square, Palembang Icon, dan UNSRI.'
  },
  {
    id: 15,
    title: 'Apartemen Sedayu Grand Palm',
    slug: 'apartemen-sedayu',
    canonicalSlug: 'apartemen-sedayu',
    category: 'Luxury Apartment',
    type: 'apartment',
    price: 'Rp 2.800.000 / bulan',
    priceRange: 'Rp 2.800.000 - Rp 3.500.000 / bulan',
    rawPrice: 2800000,
    location: 'Jakarta Barat',
    kecamatan: 'Jakarta Barat',
    rating: '4.9 ★',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    available: true,
    availableRooms: 2,
    availabilityStatus: 'Ready 2 unit',
    status: 'available',
    description: 'Apartemen full furnished dengan kolam renang, gym, kartu akses lift, dan keamanan 24 jam.'
  }
];

// Known coordinates mapping for Highlanderstay properties
export const KNOWN_PROPERTY_COORDINATES: Record<string, Coordinates & { defaultArea: string; addressSnippet: string }> = {
  greenville: {
    lat: -6.1742293,
    lng: 106.7781881,
    defaultArea: 'Kebon Jeruk',
    addressSnippet: 'Highlanderstay Transit Greenville Mangga, Jl. Mangga 14, Kebon Jeruk, Jakarta Barat'
  },
  green_ville: {
    lat: -6.1742293,
    lng: 106.7781881,
    defaultArea: 'Kebon Jeruk',
    addressSnippet: 'Highlanderstay Transit Greenville Mangga, Jl. Mangga 14, Kebon Jeruk, Jakarta Barat'
  },
  mangga: {
    lat: -6.1742293,
    lng: 106.7781881,
    defaultArea: 'Kebon Jeruk',
    addressSnippet: 'Highlanderstay Transit Greenville Mangga, Jl. Mangga 14, Kebon Jeruk, Jakarta Barat'
  },
  greenville_mangga: {
    lat: -6.1742293,
    lng: 106.7781881,
    defaultArea: 'Kebon Jeruk',
    addressSnippet: 'Highlanderstay Transit Greenville Mangga, Jl. Mangga 14, Kebon Jeruk, Jakarta Barat'
  },
  td795: {
    lat: -6.17351,
    lng: 106.78453,
    defaultArea: 'Grogol',
    addressSnippet: 'Jl. Tanjung Duren Barat No. 795, Grogol, Jakarta Barat'
  },
  td_795: {
    lat: -6.17351,
    lng: 106.78453,
    defaultArea: 'Grogol',
    addressSnippet: 'Jl. Tanjung Duren Barat No. 795, Grogol, Jakarta Barat'
  },
  td647: {
    lat: -6.17524,
    lng: 106.78602,
    defaultArea: 'Grogol',
    addressSnippet: 'Jl. Tanjung Duren Barat No. 647, Grogol, Jakarta Barat'
  },
  td_647: {
    lat: -6.17524,
    lng: 106.78602,
    defaultArea: 'Grogol',
    addressSnippet: 'Jl. Tanjung Duren Barat No. 647, Grogol, Jakarta Barat'
  },
  alpukat: {
    lat: -6.17405,
    lng: 106.78912,
    defaultArea: 'Grogol',
    addressSnippet: 'Jl. Alpukat, Tanjung Duren Utara, Jakarta Barat'
  },
  td_guest: {
    lat: -6.17652,
    lng: 106.78505,
    defaultArea: 'Grogol',
    addressSnippet: 'TD Guest House, Tanjung Duren, Jakarta Barat'
  },
  pesing_lama: {
    lat: -6.15904,
    lng: 106.76812,
    defaultArea: 'Kebon Jeruk',
    addressSnippet: 'Jl. Pesing Poglar / Kedoya Utara, Jakarta Barat'
  },
  pesing_baru: {
    lat: -6.15752,
    lng: 106.76954,
    defaultArea: 'Kebon Jeruk',
    addressSnippet: 'Jl. Pesing Garden / Daan Mogot, Jakarta Barat'
  },
  green_garden: {
    lat: -6.16302,
    lng: 106.76208,
    defaultArea: 'Kebon Jeruk',
    addressSnippet: 'Komplek Green Garden, Kedoya Utara, Jakarta Barat'
  },
  sumur_bor: {
    lat: -6.14805,
    lng: 106.71802,
    defaultArea: 'Cengkareng',
    addressSnippet: 'Jl. Sumur Bor Raya, Cengkareng Barat, Jakarta Barat'
  },
  pedongkelan: {
    lat: -6.15204,
    lng: 106.73809,
    defaultArea: 'Cengkareng',
    addressSnippet: 'Jl. Pedongkelan Raya, Cengkareng Timur, Jakarta Barat'
  },
  taman_mahkota: {
    lat: -6.12608,
    lng: 106.69205,
    defaultArea: 'Tangerang',
    addressSnippet: 'Perumahan Taman Mahkota, Benda, Tangerang (Dekat Bandara Soetta)'
  },
  jelambar: {
    lat: -6.16105,
    lng: 106.78712,
    defaultArea: 'Grogol',
    addressSnippet: 'Jelambar Utama, Grogol Petamburan, Jakarta Barat'
  },
  rajawali: {
    lat: -6.14702,
    lng: 106.84305,
    defaultArea: 'Kemayoran',
    addressSnippet: 'Jl. Rajawali Selatan, Kemayoran, Jakarta Pusat'
  },
  pakjo: {
    lat: -2.96805,
    lng: 104.73502,
    defaultArea: 'Palembang',
    addressSnippet: 'Jl. Inspektur Marzuki / Pakjo, Ilir Barat I, Palembang'
  },
  sedayu: {
    lat: -6.16205,
    lng: 106.71508,
    defaultArea: 'Jakarta Barat',
    addressSnippet: 'Apartemen Sedayu / Grand Palm, Daan Mogot, Jakarta Barat'
  },
  gpv: {
    lat: -6.16205,
    lng: 106.71508,
    defaultArea: 'Jakarta Barat',
    addressSnippet: 'Grand Palm Villa, Daan Mogot, Jakarta Barat'
  },
  apartemen: {
    lat: -6.16205,
    lng: 106.71508,
    defaultArea: 'Jakarta Barat',
    addressSnippet: 'Apartemen Grand Palm / Sedayu City, Jakarta Barat'
  }
};

/**
 * Extract lat/lng coordinates from Google Maps URLs
 */
export function extractCoordsFromUrl(url?: string | null): Coordinates | null {
  if (!url) return null;

  // Match Google Maps !3d-6.1234!4d106.1234 (exact pin coordinate)
  const pinMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pinMatch) {
    const lat = parseFloat(pinMatch[1]);
    const lng = parseFloat(pinMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Match @-6.1234,106.1234
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  // Match q=-6.1234,106.1234 or ll=-6.1234,106.1234
  const queryMatch = url.match(/[?&](?:q|ll|query|destination|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
  }

  return null;
}

/**
 * Resolve exact coordinates for a Property
 */
export function resolvePropertyCoordinates(property: Property, index = 0): Coordinates {
  // 1. Check if property already has lat/lng
  if (typeof (property as any).latitude === 'number' && typeof (property as any).longitude === 'number') {
    return { lat: (property as any).latitude, lng: (property as any).longitude };
  }

  // 2. Try extracting from addressUrl
  const fromUrl = extractCoordsFromUrl(property.addressUrl);
  if (fromUrl) {
    return fromUrl;
  }

  // 3. Match against known dictionary
  const lookupKey = `${property.canonicalSlug || ''} ${property.slug || ''} ${property.title || ''} ${property.location || ''} ${property.kecamatan || ''}`.toLowerCase();

  for (const [key, val] of Object.entries(KNOWN_PROPERTY_COORDINATES)) {
    const cleanKey = key.replace(/_/g, ' ');
    if (lookupKey.includes(key) || lookupKey.includes(cleanKey)) {
      return { lat: val.lat, lng: val.lng };
    }
  }

  // 4. Area-based fallback with slight deterministic jitter so pins don't overlap exactly
  const jitter = (index % 5) * 0.002 - 0.004;
  const areaKey = (property.kecamatan || property.location || '').toLowerCase();

  if (areaKey.includes('kebon jeruk') || areaKey.includes('kedoya')) {
    return { lat: -6.1685 + jitter, lng: 106.7725 + jitter };
  }
  if (areaKey.includes('grogol') || areaKey.includes('tanjung duren')) {
    return { lat: -6.1735 + jitter, lng: 106.7845 + jitter };
  }
  if (areaKey.includes('kemayoran')) {
    return { lat: -6.1470 + jitter, lng: 106.8430 + jitter };
  }
  if (areaKey.includes('cengkareng')) {
    return { lat: -6.1480 + jitter, lng: 106.7180 + jitter };
  }
  if (areaKey.includes('tangerang') || areaKey.includes('benda') || areaKey.includes('bandara')) {
    return { lat: -6.1260 + jitter, lng: 106.6920 + jitter };
  }
  if (areaKey.includes('palembang')) {
    return { lat: -2.9680 + jitter, lng: 104.7350 + jitter };
  }

  // Default Central Jakarta / Grogol center
  return { lat: -6.1750 + jitter, lng: 106.7850 + jitter };
}

/**
 * Haversine formula to calculate accurate distance between two points in km
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance in user-friendly Indonesian format (m or km)
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} meter`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Estimate travel time by motorbike / car in urban traffic
 */
export function estimateTravelTime(km: number): string {
  // ~25 km/h motor/mobil
  const minutes = Math.max(1, Math.round((km / 25) * 60));
  if (minutes < 60) {
    return `~${minutes} mnt`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `~${hours} jam ${remMin > 0 ? `${remMin} mnt` : ''}`;
}

/**
 * Estimate walking time
 */
export function estimateWalkingTime(km: number): string {
  // ~4.5 km/h jalan kaki
  const minutes = Math.max(1, Math.round((km / 4.5) * 60));
  if (minutes < 60) {
    return `~${minutes} mnt jalan kaki`;
  }
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return `~${hours} jam ${remMin > 0 ? `${remMin} mnt` : ''}`;
}

/**
 * Curated list of popular Indonesian landmarks near Highlanderstay properties
 */
export const POPULAR_LANDMARKS: LandmarkItem[] = [
  // --- UNIVERSITAS & KAMPUS ---
  {
    id: 'univ-untar-1',
    name: 'Universitas Tarumanagara (UNTAR 1)',
    category: 'university',
    area: 'Grogol, Jakarta Barat',
    lat: -6.1688,
    lng: 106.7876,
    description: 'Kampus Utama UNTAR Jl. S. Parman Grogol'
  },
  {
    id: 'univ-untar-2',
    name: 'Universitas Tarumanagara (UNTAR 2)',
    category: 'university',
    area: 'Tanjung Duren, Jakarta Barat',
    lat: -6.1718,
    lng: 106.7872,
    description: 'Kampus UNTAR 2 Tanjung Duren'
  },
  {
    id: 'univ-trisakti',
    name: 'Universitas Trisakti',
    category: 'university',
    area: 'Grogol, Jakarta Barat',
    lat: -6.1672,
    lng: 106.7892,
    description: 'Kampus A Trisakti Kyai Tapa Grogol'
  },
  {
    id: 'univ-binus-anggrek',
    name: 'BINUS University - Kampus Anggrek',
    category: 'university',
    area: 'Kebon Jeruk / Kemanggisan',
    lat: -6.2018,
    lng: 106.7822,
    description: 'Jl. Kebon Jeruk Raya No. 27'
  },
  {
    id: 'univ-binus-syahdan',
    name: 'BINUS University - Kampus Syahdan',
    category: 'university',
    area: 'Palmerah / Kemanggisan',
    lat: -6.2001,
    lng: 106.7854,
    description: 'Jl. KH. Syahdan Kemanggisan'
  },
  {
    id: 'univ-ukrida',
    name: 'UKRIDA (Univ. Kristen Krida Wacana)',
    category: 'university',
    area: 'Tanjung Duren, Jakarta Barat',
    lat: -6.1758,
    lng: 106.7824,
    description: 'Kampus 1 UKRIDA Tanjung Duren'
  },
  {
    id: 'univ-esa-unggul',
    name: 'Universitas Esa Unggul',
    category: 'university',
    area: 'Kebon Jeruk, Jakarta Barat',
    lat: -6.1887,
    lng: 106.7773,
    description: 'Jl. Arjuna Utara Kebon Jeruk'
  },
  {
    id: 'univ-mercu-buana',
    name: 'Universitas Mercu Buana',
    category: 'university',
    area: 'Meruya, Jakarta Barat',
    lat: -6.2084,
    lng: 106.7378,
    description: 'Kampus Utama Meruya Selatan'
  },
  {
    id: 'univ-ubm-ancol',
    name: 'Universitas Bunda Mulia (UBM)',
    category: 'university',
    area: 'Ancol / Pademangan',
    lat: -6.1362,
    lng: 106.8284,
    description: 'Kampus UBM Lodan Pademangan'
  },
  {
    id: 'univ-unsri-palembang',
    name: 'Universitas Sriwijaya (UNSRI Bukit)',
    category: 'university',
    area: 'Bukit Besar, Palembang',
    lat: -2.9858,
    lng: 104.7335,
    description: 'Kampus UNSRI Bukit Besar Palembang'
  },

  // --- MALL & PUSAT PERBELANJAAN ---
  {
    id: 'mall-central-park',
    name: 'Central Park Mall',
    category: 'mall',
    area: 'Tanjung Duren, Jakarta Barat',
    lat: -6.1775,
    lng: 106.7905,
    description: 'Mega Mall & Tribeca Park Tanjung Duren'
  },
  {
    id: 'mall-neo-soho',
    name: 'Neo Soho Mall & Jakarta Aquarium',
    category: 'mall',
    area: 'Tanjung Duren, Jakarta Barat',
    lat: -6.1752,
    lng: 106.7915,
    description: 'Terhubung langsung dengan Central Park'
  },
  {
    id: 'mall-taman-anggrek',
    name: 'Mall Taman Anggrek (MTA)',
    category: 'mall',
    area: 'Grogol Petamburan, Jakarta Barat',
    lat: -6.1791,
    lng: 106.7925,
    description: 'Mall legendaris dengan Ice Skating Rink'
  },
  {
    id: 'mall-ciputra',
    name: 'Mall Ciputra (Citraland Jakarta)',
    category: 'mall',
    area: 'Grogol, Jakarta Barat',
    lat: -6.1683,
    lng: 106.7865,
    description: 'Pusat belanja & kuliner Simpang Grogol'
  },
  {
    id: 'mall-puri-indah',
    name: 'Puri Indah Mall',
    category: 'mall',
    area: 'Kembangan, Jakarta Barat',
    lat: -6.1868,
    lng: 106.7348,
    description: 'CBD Puri Indah Kembangan'
  },
  {
    id: 'mall-lippo-puri',
    name: 'Lippo Mall Puri',
    category: 'mall',
    area: 'Puri Indah, Jakarta Barat',
    lat: -6.1895,
    lng: 106.7385,
    description: 'St. Moritz CBD Puri Indah'
  },
  {
    id: 'mall-daan-mogot',
    name: 'Mall Daan Mogot',
    category: 'mall',
    area: 'Kalideres / Cengkareng',
    lat: -6.1488,
    lng: 106.7032,
    description: 'Jl. Daan Mogot Raya KM 16'
  },
  {
    id: 'mall-grand-indonesia',
    name: 'Grand Indonesia & Plaza Indonesia',
    category: 'mall',
    area: 'MH Thamrin, Jakarta Pusat',
    lat: -6.1952,
    lng: 106.8208,
    description: 'Pusat belanja premium Bundaran HI'
  },
  {
    id: 'mall-palembang-icon',
    name: 'Palembang Icon Mall',
    category: 'mall',
    area: 'Ilir Barat I, Palembang',
    lat: -2.9774,
    lng: 104.7478,
    description: 'Mall modern Palembang di Jl. POM IX'
  },

  // --- STASIUN KRL, MRT & TRANSIT HUB ---
  {
    id: 'stasiun-grogol',
    name: 'Stasiun KRL Grogol',
    category: 'transit',
    area: 'Grogol, Jakarta Barat',
    lat: -6.1628,
    lng: 106.7885,
    description: 'KRL Commuter Line Tangerang - Duri'
  },
  {
    id: 'stasiun-pesing',
    name: 'Stasiun KRL Pesing',
    category: 'transit',
    area: 'Pesing / Kedoya, Jakarta Barat',
    lat: -6.1595,
    lng: 106.7688,
    description: 'KRL Commuter Line Tangerang - Duri'
  },
  {
    id: 'stasiun-taman-kota',
    name: 'Stasiun KRL Taman Kota',
    category: 'transit',
    area: 'Kembangan / Cengkareng',
    lat: -6.1548,
    lng: 106.7532,
    description: 'KRL Commuter Line Tangerang - Duri'
  },
  {
    id: 'stasiun-rawa-buaya',
    name: 'Stasiun KRL Rawa Buaya',
    category: 'transit',
    area: 'Cengkareng, Jakarta Barat',
    lat: -6.1528,
    lng: 106.7265,
    description: 'KRL Commuter Line Tangerang Line'
  },
  {
    id: 'stasiun-rajawali',
    name: 'Stasiun KRL Rajawali',
    category: 'transit',
    area: 'Kemayoran, Jakarta Pusat',
    lat: -6.1458,
    lng: 106.8402,
    description: 'KRL Commuter Line Loop Line Kemayoran'
  },
  {
    id: 'stasiun-duri',
    name: 'Stasiun Duri (Hub Transit Bandara & KRL)',
    category: 'transit',
    area: 'Tambora, Jakarta Barat',
    lat: -6.1558,
    lng: 106.8015,
    description: 'Stasiun Transit Utama & Kereta Bandara'
  },
  {
    id: 'stasiun-gambir',
    name: 'Stasiun Gambir',
    category: 'transit',
    area: 'Gambir, Jakarta Pusat',
    lat: -6.1768,
    lng: 106.8305,
    description: 'Stasiun Kereta Api Eksekutif Antarkota'
  },
  {
    id: 'bandara-soetta',
    name: 'Bandara Internasional Soekarno-Hatta (CGK)',
    category: 'transit',
    area: 'Benda, Tangerang',
    lat: -6.1275,
    lng: 106.6537,
    description: 'Bandara Utama Jakarta & Sekitarnya'
  },
  {
    id: 'terminal-kalideres',
    name: 'Terminal Bus Kalideres',
    category: 'transit',
    area: 'Kalideres, Jakarta Barat',
    lat: -6.1538,
    lng: 106.6985,
    description: 'Terminal Bus Antarkota & Transjakarta'
  },

  // --- RUMAH SAKIT & LAYANAN KESEHATAN ---
  {
    id: 'rs-royal-taruma',
    name: 'RS Royal Taruma',
    category: 'hospital',
    area: 'Daan Mogot, Jakarta Barat',
    lat: -6.1662,
    lng: 106.7825,
    description: 'Rumah Sakit Umum Daan Mogot'
  },
  {
    id: 'rs-siloam-kebon-jeruk',
    name: 'RS Siloam Kebon Jeruk',
    category: 'hospital',
    area: 'Kebon Jeruk, Jakarta Barat',
    lat: -6.1892,
    lng: 106.7725,
    description: 'Siloam Hospitals Kebon Jeruk'
  },
  {
    id: 'rs-graha-kedoya',
    name: 'RS Graha Kedoya',
    category: 'hospital',
    area: 'Kedoya Utara, Jakarta Barat',
    lat: -6.1698,
    lng: 106.7645,
    description: 'Rumah Sakit Swasta Kedoya'
  },
  {
    id: 'rs-cengkareng',
    name: 'RSUD Cengkareng',
    category: 'hospital',
    area: 'Cengkareng, Jakarta Barat',
    lat: -6.1432,
    lng: 106.7328,
    description: 'Rumah Sakit Umum Daerah Cengkareng'
  },
  {
    id: 'rs-hermina-daan-mogot',
    name: 'RS Hermina Daan Mogot',
    category: 'hospital',
    area: 'Kalideres, Jakarta Barat',
    lat: -6.1492,
    lng: 106.7115,
    description: 'Rumah Sakit Ibu & Anak Hermina'
  },

  // --- ATTRACTION & LANDMARK PUBLIK ---
  {
    id: 'monas-jakarta',
    name: 'Monumen Nasional (Monas)',
    category: 'attraction',
    area: 'Gambir, Jakarta Pusat',
    lat: -6.1754,
    lng: 106.8272,
    description: 'Ikon Monumen Nasional Republik Indonesia'
  },
  {
    id: 'jiexpo-kemayoran',
    name: 'JIExpo Kemayoran (Pekan Raya Jakarta)',
    category: 'attraction',
    area: 'Kemayoran, Jakarta Pusat',
    lat: -6.1498,
    lng: 106.8485,
    description: 'Pusat Ekshibisi & Event Terbesar Jakarta'
  },
  {
    id: 'gbk-senayan',
    name: 'Gelora Bung Karno (GBK)',
    category: 'attraction',
    area: 'Senayan, Jakarta Pusat',
    lat: -6.2185,
    lng: 106.8025,
    description: 'Kawasan Olahraga & Konser Nasional GBK'
  },
  {
    id: 'jembatan-ampera',
    name: 'Jembatan Ampera Palembang',
    category: 'attraction',
    area: 'Seberang Ulu / Ilir, Palembang',
    lat: -2.9918,
    lng: 104.7635,
    description: 'Ikon Wisata Sungai Musi Palembang'
  }
];

/**
 * Real-time Nominatim Geocoding API with caching and error handling
 */
const geocodeCache = new Map<string, LandmarkItem[]>();

export async function searchNominatimLandmarks(query: string, signal?: AbortSignal): Promise<LandmarkItem[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  const cacheKey = q.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q + ' Indonesia'
    )}&countrycodes=id&addressdetails=1&limit=6`;

    const res = await fetch(url, {
      signal,
      headers: {
        'Accept-Language': 'id,en',
        'User-Agent': 'HighlanderStay-MapSelector/1.0'
      }
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results: LandmarkItem[] = data.map((item: any) => {
      const displayName = item.display_name || '';
      const nameParts = displayName.split(',');
      const mainName = nameParts[0]?.trim() || item.name || q;
      const subArea = nameParts.slice(1, 4).join(',').trim();

      return {
        id: `nominatim-${item.place_id || Math.random()}`,
        name: mainName,
        category: 'custom',
        area: subArea || 'Indonesia',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        description: displayName
      };
    });

    geocodeCache.set(cacheKey, results);
    return results;
  } catch (err: any) {
    if (err.name === 'AbortError') return [];
    console.warn('Nominatim geocode failed, using local landmarks:', err);
    return [];
  }
}
