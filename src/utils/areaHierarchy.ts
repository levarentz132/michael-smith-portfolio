import type { Property } from '../api';

export interface PropertyAreaInfo {
  district: string;        // 'Kebon Jeruk', 'Grogol', 'Cengkareng', 'Kemayoran', etc.
  city: string;            // 'Jakarta Barat', 'Jakarta Pusat', 'Tangerang', 'Palembang', etc.
  shortCity: string;       // 'Jakbar', 'Jakpus', 'Tgr', 'Plb', etc.
  displayBadge: string;    // 'Kebon Jeruk • Jakbar', 'Tangerang', etc.
  fullAreaLabel: string;   // 'Kebon Jeruk, Jakarta Barat'
  isJakartaBarat: boolean;
  rawKecamatan?: string | null;
}

export interface AreaFilterOption {
  key: string;             // Filter key, e.g. 'all', 'Jakarta Barat', 'Kebon Jeruk'
  label: string;           // 'Semua Area', 'Jakarta Barat (Semua)', 'Kebon Jeruk'
  shortLabel: string;      // 'Semua', 'Jakbar', 'Kebon Jeruk'
  parentCity?: string;     // 'Jakarta Barat'
  isCityLevel?: boolean;   // true for 'Jakarta Barat'
}

/**
 * Standard known sub-districts and keywords belonging to Jakarta Barat.
 * Includes official kecamatan: Kebon Jeruk, Grogol Petamburan, Cengkareng, Kembangan, Palmerah, Tamansari, Tambora, Kalideres.
 */
const JAKARTA_BARAT_KEYWORDS = [
  'kebon jeruk',
  'kb. jeruk',
  'greenville',
  'green garden',
  'pesing',
  'kedoya',
  'duri kepa',
  'sukabumi utara',
  'sukabumi selatan',
  'kelapa dua',
  'grogol',
  'tanjung duren',
  'tg. duren',
  'jelambar',
  'tomang',
  'wijaya kusuma',
  'alpukat',
  'cengkareng',
  'pedongkelan',
  'sumur bor',
  'kapuk',
  'rawa buaya',
  'kembangan',
  'meruya',
  'joglo',
  'srengseng',
  'puri',
  'palmerah',
  'slipi',
  'kemanggisan',
  'kalideres',
  'semanan',
  'kamal',
  'tambora',
  'tamansari',
  'glodok',
  'kota tua',
  'daan mogot',
  'sedayu'
];

/**
 * Normalizes short city names for badges
 */
function getShortCityName(city: string): string {
  const c = city.trim();
  if (/jakarta barat/i.test(c)) return 'Jakbar';
  if (/jakarta pusat/i.test(c)) return 'Jakpus';
  if (/jakarta selatan/i.test(c)) return 'Jaksel';
  if (/jakarta utara/i.test(c)) return 'Jakut';
  if (/jakarta timur/i.test(c)) return 'Jaktim';
  if (/tangerang selatan/i.test(c)) return 'Tangsel';
  return c;
}

/**
 * Dynamically extract hierarchical area info from API property data.
 * Directly reads `prop.kecamatan`, `prop.address`, `prop.location`, and `prop.title`.
 */
export function getPropertyAreaInfo(prop: Property): PropertyAreaInfo {
  const rawKec = (prop.kecamatan || '').trim();
  const rawAddress = (prop.address || '').trim();
  const rawLocation = (prop.location || '').trim();
  const rawTitle = (prop.title || '').trim();

  const combinedLower = `${rawKec} ${rawAddress} ${rawLocation} ${rawTitle}`.toLowerCase();

  // 1. Determine District
  let district = '';

  if (rawKec) {
    const kecLower = rawKec.toLowerCase();
    // Normalize known specific API kecamatan representations
    if (kecLower.includes('palembang')) {
      district = 'Palembang';
    } else if (kecLower.includes('kebon jeruk')) {
      district = 'Kebon Jeruk';
    } else if (kecLower.includes('grogol')) {
      district = 'Grogol';
    } else if (kecLower.includes('cengkareng')) {
      district = 'Cengkareng';
    } else if (kecLower.includes('kemayoran')) {
      district = 'Kemayoran';
    } else if (kecLower.includes('tangerang')) {
      district = 'Tangerang';
    } else {
      // Direct dynamic use of kecamatan from API (e.g. 'Kembangan', 'Menteng', 'Coblong', etc.)
      district = rawKec;
    }
  } else {
    // If kecamatan is null (e.g. apartemen, kiosk, lahan, rumah), infer from address/title/location
    if (JAKARTA_BARAT_KEYWORDS.some(k => combinedLower.includes(k))) {
      if (combinedLower.includes('kebon jeruk') || combinedLower.includes('greenville') || combinedLower.includes('pesing')) {
        district = 'Kebon Jeruk';
      } else if (combinedLower.includes('grogol') || combinedLower.includes('jelambar') || combinedLower.includes('alpukat') || combinedLower.includes('tanjung duren')) {
        district = 'Grogol';
      } else if (combinedLower.includes('cengkareng') || combinedLower.includes('pedongkelan') || combinedLower.includes('sumur bor')) {
        district = 'Cengkareng';
      } else {
        district = 'Jakarta Barat';
      }
    } else if (combinedLower.includes('kemayoran') || combinedLower.includes('rajawali')) {
      district = 'Kemayoran';
    } else if (combinedLower.includes('tangerang') || combinedLower.includes('mahkota')) {
      district = 'Tangerang';
    } else if (combinedLower.includes('palembang') || combinedLower.includes('pakjo') || combinedLower.includes('pak jo')) {
      district = 'Palembang';
    } else {
      district = rawLocation || 'Jakarta Barat';
    }
  }

  // 2. Determine City / Parent Region
  let city = '';
  let isJakbar = false;

  // Check Jakarta Barat
  if (
    combinedLower.includes('jakarta barat') ||
    combinedLower.includes('jakbar') ||
    combinedLower.includes('kota jakarta barat') ||
    JAKARTA_BARAT_KEYWORDS.some(k => combinedLower.includes(k)) ||
    ['kebon jeruk', 'grogol', 'cengkareng', 'kembangan', 'palmerah', 'kalideres', 'tambora', 'tamansari'].includes(district.toLowerCase())
  ) {
    city = 'Jakarta Barat';
    isJakbar = true;
  } else if (
    combinedLower.includes('jakarta pusat') ||
    combinedLower.includes('jakpus') ||
    district.toLowerCase() === 'kemayoran' ||
    combinedLower.includes('kemayoran') ||
    combinedLower.includes('rajawali')
  ) {
    city = 'Jakarta Pusat';
  } else if (combinedLower.includes('jakarta selatan') || combinedLower.includes('jaksel')) {
    city = 'Jakarta Selatan';
  } else if (combinedLower.includes('jakarta utara') || combinedLower.includes('jakut')) {
    city = 'Jakarta Utara';
  } else if (combinedLower.includes('jakarta timur') || combinedLower.includes('jaktim')) {
    city = 'Jakarta Timur';
  } else if (combinedLower.includes('tangerang')) {
    city = 'Tangerang';
  } else if (combinedLower.includes('palembang')) {
    city = 'Palembang';
  } else {
    // Dynamic city extraction from address if present (e.g. "Kota Bandung", "Kabupaten Bogor")
    const cityMatch = rawAddress.match(/(?:Kota|Kabupaten|Kab\.)\s+([A-Za-z\s]+?)(?:,|$|\d)/i);
    if (cityMatch && cityMatch[1]) {
      city = cityMatch[1].trim();
    } else {
      city = district || rawLocation || 'Jakarta';
    }
  }

  const shortCity = getShortCityName(city);

  // 3. Format Display Badge and Labels
  let displayBadge = district;
  if (city && city.toLowerCase() !== district.toLowerCase()) {
    displayBadge = `${district} • ${shortCity}`;
  }

  const fullAreaLabel = city && city.toLowerCase() !== district.toLowerCase()
    ? `${district}, ${city}`
    : district;

  return {
    district,
    city,
    shortCity,
    displayBadge,
    fullAreaLabel,
    isJakartaBarat: isJakbar,
    rawKecamatan: prop.kecamatan
  };
}

/**
 * Returns backward-compatible string district name
 */
export function getPropertyArea(prop: Property): string {
  return getPropertyAreaInfo(prop).district;
}

/**
 * Checks whether a property matches the selected area filter.
 *
 * CRITICAL LOGIC:
 * - When selectedArea is 'Jakarta Barat' (or 'jakbar'), it INCLUDES all properties
 *   in Kebon Jeruk, Grogol, Cengkareng, and any other district in Jakarta Barat.
 * - When selectedArea is a specific district (e.g. 'Kebon Jeruk', 'Grogol', 'Cengkareng'),
 *   it matches only properties in that district.
 * - When selectedArea is 'all' or 'Semua Area', matches everything.
 */
export function propertyMatchesArea(prop: Property, selectedArea: string): boolean {
  if (!selectedArea) return true;
  const sel = selectedArea.trim().toLowerCase();
  if (sel === 'all' || sel === 'semua' || sel === 'semua area') {
    return true;
  }

  const info = getPropertyAreaInfo(prop);
  const selClean = sel.replace(/\(semua\)/i, '').trim();

  // If user selected Jakarta Barat (parent city level)
  if (selClean === 'jakarta barat' || selClean === 'jakbar' || selClean === 'jakarta-barat') {
    return info.isJakartaBarat;
  }

  // If user selected any parent city (e.g. 'Jakarta Pusat', 'Tangerang', 'Palembang', or any new city)
  if (info.city.toLowerCase() === selClean) {
    return true;
  }

  // If user selected a specific district (e.g. 'Kebon Jeruk', 'Grogol', 'Cengkareng', 'Kemayoran')
  const districtLower = info.district.toLowerCase();
  if (districtLower === selClean) {
    return true;
  }

  // Match against raw kecamatan if different
  if (info.rawKecamatan && info.rawKecamatan.toLowerCase() === selClean) {
    return true;
  }

  return false;
}

/**
 * Dynamically builds hierarchical area tabs purely from the API property list.
 * Any new area or district added to the API will automatically appear here without code changes!
 */
export function buildDynamicAreaTabs(
  properties: Property[],
  variant: 'all' | 'hot' = 'all'
): AreaFilterOption[] {
  const source = variant === 'hot'
    ? properties.filter(p => p.availableRooms && p.availableRooms > 0)
    : properties;

  const tabs: AreaFilterOption[] = [
    {
      key: 'all',
      label: variant === 'hot' ? 'Semua Area Ready' : 'Semua Area',
      shortLabel: 'Semua'
    }
  ];

  if (!source || source.length === 0) {
    return tabs;
  }

  // Group districts by their parent city
  const cityMap = new Map<string, Set<string>>();

  source.forEach(prop => {
    const info = getPropertyAreaInfo(prop);
    const c = info.city || 'Lainnya';
    if (!cityMap.has(c)) {
      cityMap.set(c, new Set());
    }
    // Only add as sub-district if it's distinct from the generic city name
    if (info.district && info.district.toLowerCase() !== c.toLowerCase()) {
      cityMap.get(c)!.add(info.district);
    }
  });

  // Sort cities: prioritize Jakarta Barat first, then other cities alphabetically
  const sortedCities = Array.from(cityMap.keys()).sort((a, b) => {
    if (a.toLowerCase() === 'jakarta barat') return -1;
    if (b.toLowerCase() === 'jakarta barat') return 1;
    return a.localeCompare(b);
  });

  sortedCities.forEach(city => {
    const districts = Array.from(cityMap.get(city) || []);

    if (districts.length > 0) {
      // City has sub-districts (e.g. Jakarta Barat has Kebon Jeruk, Grogol, Cengkareng)
      tabs.push({
        key: city,
        label: `${city} (Semua)`,
        shortLabel: getShortCityName(city),
        isCityLevel: true,
        parentCity: city
      });

      // Add child district tabs
      districts.sort().forEach(district => {
        tabs.push({
          key: district,
          label: district,
          shortLabel: district,
          parentCity: city
        });
      });
    } else {
      // City has no separate sub-districts (e.g. Tangerang, Palembang)
      tabs.push({
        key: city,
        label: city,
        shortLabel: getShortCityName(city),
        isCityLevel: false
      });
    }
  });

  return tabs;
}

/**
 * Dynamically builds a flat area string list for simple chip selectors (Peta & Katalog).
 * Automatically extracts all cities and districts from API properties.
 */
export function buildDynamicAreaList(properties: Property[]): string[] {
  const setOfAreas = new Set<string>();
  setOfAreas.add('Semua Area');

  const cityDistrictsMap = new Map<string, Set<string>>();

  properties.forEach(prop => {
    const info = getPropertyAreaInfo(prop);
    const c = info.city;
    if (!cityDistrictsMap.has(c)) {
      cityDistrictsMap.set(c, new Set());
    }
    if (info.district && info.district.toLowerCase() !== c.toLowerCase()) {
      cityDistrictsMap.get(c)!.add(info.district);
    }
  });

  // Sort cities with Jakarta Barat first
  const sortedCities = Array.from(cityDistrictsMap.keys()).sort((a, b) => {
    if (a.toLowerCase() === 'jakarta barat') return -1;
    if (b.toLowerCase() === 'jakarta barat') return 1;
    return a.localeCompare(b);
  });

  sortedCities.forEach(city => {
    setOfAreas.add(city);
    const districts = Array.from(cityDistrictsMap.get(city) || []);
    districts.sort().forEach(d => setOfAreas.add(d));
  });

  return Array.from(setOfAreas);
}

/**
 * Dynamically groups properties by their extracted district and city.
 */
export function groupPropertiesByDistrict(properties: Property[]): Array<{
  area: string;
  city: string;
  label: string;
  items: Property[];
  totalRooms: number;
}> {
  const groupsMap = new Map<string, {
    area: string;
    city: string;
    label: string;
    items: Property[];
    totalRooms: number;
  }>();

  properties.forEach(prop => {
    const info = getPropertyAreaInfo(prop);
    const key = `${info.city}__${info.district}`;

    if (!groupsMap.has(key)) {
      let label = `Kawasan ${info.district}`;
      if (info.isJakartaBarat && info.district.toLowerCase() !== 'jakarta barat') {
        label = `Kawasan ${info.district} (Jakarta Barat)`;
      } else if (info.district.toLowerCase() === 'jakarta barat') {
        label = 'Unit Lainnya di Jakarta Barat';
      } else if (info.city && info.city.toLowerCase() !== info.district.toLowerCase()) {
        label = `Kawasan ${info.district} (${info.city})`;
      }

      groupsMap.set(key, {
        area: info.district,
        city: info.city,
        label,
        items: [],
        totalRooms: 0
      });
    }

    const group = groupsMap.get(key)!;
    group.items.push(prop);
    group.totalRooms += (prop.availableRooms || 0);
  });

  // Sort groups: Jakarta Barat first, then by city and area name
  return Array.from(groupsMap.values()).sort((a, b) => {
    const aIsJakbar = a.city.toLowerCase() === 'jakarta barat';
    const bIsJakbar = b.city.toLowerCase() === 'jakarta barat';
    if (aIsJakbar && !bIsJakbar) return -1;
    if (!aIsJakbar && bIsJakbar) return 1;
    return a.area.localeCompare(b.area);
  });
}

/**
 * Dynamic visual badge styling based on district and city.
 * Provides curated colors for known regions, plus dynamic deterministic palette for new areas.
 */
export function getAreaBadgeStyles(district: string, isJakbar = false): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  ring: string;
} {
  const d = district.toLowerCase();

  if (d.includes('kebon jeruk')) {
    return {
      bg: 'bg-emerald-600/90 hover:bg-emerald-600',
      text: 'text-white',
      border: 'border-emerald-400/50',
      dot: 'bg-emerald-300',
      ring: 'ring-emerald-500/30',
    };
  }

  if (d.includes('grogol') || d.includes('tanjung duren')) {
    return {
      bg: 'bg-sky-600/90 hover:bg-sky-600',
      text: 'text-white',
      border: 'border-sky-400/50',
      dot: 'bg-sky-300',
      ring: 'ring-sky-500/30',
    };
  }

  if (d.includes('cengkareng')) {
    return {
      bg: 'bg-amber-600/90 hover:bg-amber-600',
      text: 'text-white',
      border: 'border-amber-400/50',
      dot: 'bg-amber-300',
      ring: 'ring-amber-500/30',
    };
  }

  if (d.includes('kemayoran')) {
    return {
      bg: 'bg-purple-600/90 hover:bg-purple-600',
      text: 'text-white',
      border: 'border-purple-400/50',
      dot: 'bg-purple-300',
      ring: 'ring-purple-500/30',
    };
  }

  if (d.includes('tangerang')) {
    return {
      bg: 'bg-teal-600/90 hover:bg-teal-600',
      text: 'text-white',
      border: 'border-teal-400/50',
      dot: 'bg-teal-300',
      ring: 'ring-teal-500/30',
    };
  }

  if (d.includes('palembang')) {
    return {
      bg: 'bg-rose-600/90 hover:bg-rose-600',
      text: 'text-white',
      border: 'border-rose-400/50',
      dot: 'bg-rose-300',
      ring: 'ring-rose-500/30',
    };
  }

  if (isJakbar || d.includes('jakarta')) {
    return {
      bg: 'bg-indigo-600/90 hover:bg-indigo-600',
      text: 'text-white',
      border: 'border-indigo-400/50',
      dot: 'bg-indigo-300',
      ring: 'ring-indigo-500/30',
    };
  }

  // Dynamic deterministic palette for any new future area based on char code
  const palettes = [
    { bg: 'bg-cyan-600/90 hover:bg-cyan-600', text: 'text-white', border: 'border-cyan-400/50', dot: 'bg-cyan-300', ring: 'ring-cyan-500/30' },
    { bg: 'bg-violet-600/90 hover:bg-violet-600', text: 'text-white', border: 'border-violet-400/50', dot: 'bg-violet-300', ring: 'ring-violet-500/30' },
    { bg: 'bg-fuchsia-600/90 hover:bg-fuchsia-600', text: 'text-white', border: 'border-fuchsia-400/50', dot: 'bg-fuchsia-300', ring: 'ring-fuchsia-500/30' },
    { bg: 'bg-lime-600/90 hover:bg-lime-600', text: 'text-white', border: 'border-lime-400/50', dot: 'bg-lime-300', ring: 'ring-lime-500/30' },
    { bg: 'bg-orange-600/90 hover:bg-orange-600', text: 'text-white', border: 'border-orange-400/50', dot: 'bg-orange-300', ring: 'ring-orange-500/30' },
  ];
  let hash = 0;
  for (let i = 0; i < d.length; i++) {
    hash = (hash << 5) - hash + d.charCodeAt(i);
  }
  const idx = Math.abs(hash) % palettes.length;
  return palettes[idx];
}
