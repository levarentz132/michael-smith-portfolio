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
 * Resolve exact coordinates for a Property purely from API data.
 * Returns null if the property has no coordinates or valid map URL (so it is excluded from the map).
 */
export function resolvePropertyCoordinates(property: Property, _index = 0): Coordinates | null {
  const mapUrl = property.addressUrl || property.mapUrl;
  const rawLat = (property as any).latitude;
  const rawLng = (property as any).longitude;
  const parsedLat = typeof rawLat === 'number' ? rawLat : (rawLat ? parseFloat(rawLat) : NaN);
  const parsedLng = typeof rawLng === 'number' ? rawLng : (rawLng ? parseFloat(rawLng) : NaN);
  const hasCoords = !isNaN(parsedLat) && !isNaN(parsedLng);

  // 1. Direct coordinates from API
  if (hasCoords) {
    return { lat: parsedLat, lng: parsedLng };
  }

  // 2. Extract coordinates dynamically from API map/address URL
  if (mapUrl) {
    const fromUrl = extractCoordsFromUrl(mapUrl);
    if (fromUrl) {
      return fromUrl;
    }
  }

  // No coordinates and no extractable map link from API -> do NOT show on map
  return null;
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
