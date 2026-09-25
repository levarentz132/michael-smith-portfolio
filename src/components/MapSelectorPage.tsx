import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Building2,
  Flame,
  ArrowRight,
  ExternalLink,
  LocateFixed,
  Route as RouteIcon,
  Clock,
  Sparkles,
  School,
  ShoppingBag,
  Train,
  Hospital,
  ChevronRight,
  X,
  Maximize2,
  RefreshCw,
  List,
  Compass,
  ChevronLeft,
  Wifi,
  Wind,
  BedDouble,
  ShieldCheck,
  CheckCircle2,
  Eye,
  MessageCircle,
  Zap,
  Droplets,
  Car,
  ArrowLeft,
  Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchProperties, slugify } from '../api';
import type { Property, WebsiteSettings } from '../api';
import {
  resolvePropertyCoordinates,
  calculateDistanceKm,
  formatDistance,
  estimateTravelTime,
  estimateWalkingTime,
  POPULAR_LANDMARKS,
  searchNominatimLandmarks,
  DEFAULT_FALLBACK_PROPERTIES
} from '../data/mapData';
import type { LandmarkItem, PropertyWithDistance } from '../data/mapData';
import { useSEO } from '../hooks/useSEO';

interface MapSelectorPageProps {
  settings?: WebsiteSettings | null;
  onBookProperty?: (property: Property) => void;
}

const AREA_DISPLAY_ORDER = [
  'Semua Area',
  'Kebon Jeruk',
  'Grogol',
  'Kemayoran',
  'Cengkareng',
  'Jakarta Barat',
  'Tangerang',
  'Palembang'
];

function getPropertyArea(prop: Property): string {
  const loc = (prop.kecamatan || prop.location || '').trim();
  const lower = loc.toLowerCase();
  if (lower.includes('kebon jeruk') || lower.includes('greenville') || lower.includes('pesing') || lower.includes('green garden')) {
    return 'Kebon Jeruk';
  }
  if (lower.includes('grogol') || lower.includes('jelambar') || lower.includes('alpukat') || lower.includes('td')) {
    return 'Grogol';
  }
  if (lower.includes('kemayoran') || lower.includes('rajawali')) {
    return 'Kemayoran';
  }
  if (lower.includes('cengkareng') || lower.includes('pedongkelan') || lower.includes('sumur bor')) {
    return 'Cengkareng';
  }
  if (lower.includes('tangerang') || lower.includes('mahkota')) {
    return 'Tangerang';
  }
  if (lower.includes('palembang') || lower.includes('pak jo') || lower.includes('pakjo')) {
    return 'Palembang';
  }
  if (lower.includes('jakarta') || lower.includes('daan mogot') || lower.includes('sedayu') || lower.includes('apartemen')) {
    return 'Jakarta Barat';
  }
  return loc || 'Lainnya';
}

export const MapSelectorPage: React.FC<MapSelectorPageProps> = ({ settings }) => {
  const navigate = useNavigate();

  // Clean WhatsApp Number
  const adminWa = useMemo(() => {
    return (settings?.whatsapp_number || '628123456789').replace(/\D/g, '');
  }, [settings?.whatsapp_number]);

  const formatWaUrl = useCallback((phone?: string | null, propertyTitle?: string) => {
    const rawNumber = (phone || adminWa).replace(/\D/g, '');
    const cleanNumber = rawNumber.startsWith('0') ? '62' + rawNumber.slice(1) : rawNumber.startsWith('62') ? rawNumber : '62' + rawNumber;
    const msg = propertyTitle
      ? `Halo Admin / Penjaga Highlanderstay, saya tertarik dengan kamar di *${propertyTitle}*. Apakah masih tersedia unit kamar kosong?`
      : `Halo Admin Highlanderstay, saya ingin bertanya seputar rekomendasi kamar kos & apartemen yang tersedia.`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  }, [adminWa]);

  // SEO Optimization
  useSEO({
    title: 'Peta & Lokasi Kos Terdekat | Highlanderstay Jakarta',
    description: 'Cari kos dan apartemen Highlanderstay terdekat dari kampus (UNTAR, Trisakti, Binus), mall, stasiun KRL, atau lokasi Anda di Jakarta Barat, Jakarta Pusat, Tangerang & Palembang.',
    keywords: 'peta kos jakarta, kos dekat untar, kos dekat trisakti, kos dekat binus, kos dekat central park, kos grogol, kos kebon jeruk, kos kemayoran, highlanderstay map',
    canonicalUrl: 'https://highlanderstay.com/map',
    enabled: true
  });

  // Data states
  const [properties, setProperties] = useState<Property[]>([]);
  const [, setLoading] = useState(true);
  const [activeProperty, setActiveProperty] = useState<PropertyWithDistance | null>(null);

  // Gallery & Detail Summary Modal State
  const [summaryModalProperty, setSummaryModalProperty] = useState<PropertyWithDistance | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Search & Landmark states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkItem | null>(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [landmarkCategoryFilter, setLandmarkCategoryFilter] = useState<string>('all');
  const [nominatimResults, setNominatimResults] = useState<LandmarkItem[]>([]);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Filtering states
  const [selectedArea, setSelectedArea] = useState<string>('Semua Area');
  const [onlyAvailableHot, setOnlyAvailableHot] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarkMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // Load properties on mount with reliable fallback
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await fetchProperties();
        if (isMounted) {
          if (Array.isArray(data) && data.length > 0) {
            setProperties(data);
          } else {
            setProperties(DEFAULT_FALLBACK_PROPERTIES);
          }
        }
      } catch (err) {
        console.warn('Failed to load properties from API, using default property dataset:', err);
        if (isMounted) {
          setProperties(DEFAULT_FALLBACK_PROPERTIES);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute properties with coordinates & distance relative to selected landmark
  const propertiesWithDistance: PropertyWithDistance[] = useMemo(() => {
    return properties.map((prop, index) => {
      const coords = resolvePropertyCoordinates(prop, index);
      let distanceKm: number | undefined;
      let distanceFormatted: string | undefined;
      let travelTimeFormatted: string | undefined;
      let walkingTimeFormatted: string | undefined;

      if (selectedLandmark) {
        distanceKm = calculateDistanceKm(selectedLandmark.lat, selectedLandmark.lng, coords.lat, coords.lng);
        distanceFormatted = formatDistance(distanceKm);
        travelTimeFormatted = estimateTravelTime(distanceKm);
        walkingTimeFormatted = estimateWalkingTime(distanceKm);
      }

      return {
        ...prop,
        coordinates: coords,
        distanceKm,
        distanceFormatted,
        travelTimeFormatted,
        walkingTimeFormatted
      };
    });
  }, [properties, selectedLandmark]);

  // Filter & Sort properties
  const filteredProperties = useMemo(() => {
    let list = propertiesWithDistance.filter((item) => {
      if (selectedArea !== 'Semua Area') {
        const area = getPropertyArea(item);
        if (area.toLowerCase() !== selectedArea.toLowerCase()) {
          return false;
        }
      }

      if (onlyAvailableHot) {
        if (!item.availableRooms || item.availableRooms <= 0) {
          return false;
        }
      }

      return true;
    });

    list.sort((a, b) => {
      if (selectedLandmark) {
        return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
      }
      return (b.availableRooms || 0) - (a.availableRooms || 0);
    });

    return list;
  }, [propertiesWithDistance, selectedArea, onlyAvailableHot, selectedLandmark]);

  // Identify nearest property
  const nearestProperty = useMemo(() => {
    if (!selectedLandmark || filteredProperties.length === 0) return null;
    return filteredProperties[0];
  }, [selectedLandmark, filteredProperties]);

  // Debounced real-time Nominatim search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setNominatimResults([]);
      setIsSearchingGeocode(false);
      return;
    }

    const hasLocalMatches = POPULAR_LANDMARKS.some((l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.area.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (hasLocalMatches) {
      setNominatimResults([]);
    }

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearchingGeocode(true);
      const results = await searchNominatimLandmarks(searchQuery, controller.signal);
      setNominatimResults(results);
      setIsSearchingGeocode(false);
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Combined landmark suggestions
  const landmarkSuggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let local = POPULAR_LANDMARKS;

    if (landmarkCategoryFilter !== 'all') {
      local = local.filter((l) => l.category === landmarkCategoryFilter);
    }

    if (q) {
      local = local.filter((l) =>
        l.name.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        (l.description && l.description.toLowerCase().includes(q))
      );
    }

    const localNames = new Set(local.map((l) => l.name.toLowerCase()));
    const additional = nominatimResults.filter((r) => !localNames.has(r.name.toLowerCase()));

    return [...local, ...additional];
  }, [searchQuery, landmarkCategoryFilter, nominatimResults]);

  // Center/Fit Map helper
  const fitMapToProperties = useCallback((propsToFit: PropertyWithDistance[], landmark?: LandmarkItem | null) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: L.LatLngExpression[] = [];

    propsToFit.forEach((p) => {
      points.push([p.coordinates.lat, p.coordinates.lng]);
    });

    if (landmark) {
      points.push([landmark.lat, landmark.lng]);
    }

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
  }, []);

  // Initialize Leaflet Map (Full Screen Background)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    // Center on Jakarta Barat / Grogol
    const map = L.map(mapContainerRef.current, {
      center: [-6.175, 106.785],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // 100% Free OpenStreetMap Standard Bright Clear Tiles (No API key, No watermark)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (landmarkMarkerRef.current) {
      landmarkMarkerRef.current.remove();
      landmarkMarkerRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    // 1. Render Property Markers
    filteredProperties.forEach((prop, idx) => {
      const isSelected = activeProperty?.id === prop.id || (!activeProperty && idx === 0 && Boolean(selectedLandmark));
      const isNearest = Boolean(selectedLandmark && prop.id === nearestProperty?.id);
      const isHot = Boolean(prop.availableRooms && prop.availableRooms > 0);

      const priceSnippet = prop.promoPrice
        ? `Rp ${Math.round(prop.promoPrice / 1000)}k`
        : prop.priceRange
        ? prop.priceRange.split('-')[0].trim()
        : prop.price.replace('Rp.', 'Rp').replace('/ month', '').replace('/ bulan', '').trim();

      const markerHtml = `
        <div class="custom-property-pin ${isSelected ? 'is-selected' : ''} ${isNearest ? 'is-nearest' : ''} ${isHot ? 'is-hot' : ''}">
          <div class="pin-pill">
            ${isNearest ? '<span class="nearest-badge">⭐ TERDEKAT</span>' : ''}
            <div class="pin-content">
              <span class="status-dot ${isHot ? 'ready' : 'full'}"></span>
              <span class="price-text">${priceSnippet}</span>
            </div>
            ${prop.distanceFormatted ? `<div class="distance-chip">${prop.distanceFormatted}</div>` : ''}
          </div>
          <div class="pin-pointer"></div>
          <div class="pin-shadow"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'hs-leaflet-marker-wrapper',
        html: markerHtml,
        iconSize: [120, 50],
        iconAnchor: [60, 48]
      });

      const marker = L.marker([prop.coordinates.lat, prop.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isNearest ? 1000 : isSelected ? 900 : 100
      });

      marker.on('click', () => {
        setActiveProperty(prop);
        map.setView([prop.coordinates.lat, prop.coordinates.lng], Math.max(map.getZoom(), 15), { animate: true });
      });

      markersLayer.addLayer(marker);
    });

    // 2. Render Selected Landmark Marker
    if (selectedLandmark) {
      const landmarkHtml = `
        <div class="custom-landmark-pin">
          <div class="landmark-pulse"></div>
          <div class="landmark-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
          </div>
          <div class="landmark-label">
            <span class="landmark-name">${selectedLandmark.name}</span>
          </div>
        </div>
      `;

      const landmarkIcon = L.divIcon({
        className: 'hs-landmark-marker-wrapper',
        html: landmarkHtml,
        iconSize: [140, 60],
        iconAnchor: [70, 30]
      });

      const landmarkMarker = L.marker([selectedLandmark.lat, selectedLandmark.lng], {
        icon: landmarkIcon,
        zIndexOffset: 2000
      }).addTo(map);

      landmarkMarkerRef.current = landmarkMarker;

      // 3. Draw direct dashed route line to nearest property
      if (nearestProperty) {
        const line = L.polyline(
          [
            [selectedLandmark.lat, selectedLandmark.lng],
            [nearestProperty.coordinates.lat, nearestProperty.coordinates.lng]
          ],
          {
            color: '#f59e0b',
            weight: 3.5,
            dashArray: '8, 8',
            opacity: 0.85
          }
        ).addTo(map);

        routePolylineRef.current = line;
      }
    }
  }, [filteredProperties, activeProperty, selectedLandmark, nearestProperty]);

  // Handle Landmark Selection
  const handleSelectLandmark = (landmark: LandmarkItem) => {
    setSelectedLandmark(landmark);
    setSearchQuery(landmark.name);
    setAutocompleteOpen(false);
    setGpsError(null);

    const targetNearest = propertiesWithDistance.reduce((closest, curr) => {
      const d = calculateDistanceKm(landmark.lat, landmark.lng, curr.coordinates.lat, curr.coordinates.lng);
      if (!closest || d < (closest.d ?? 9999)) {
        return { ...curr, d };
      }
      return closest;
    }, null as any);

    if (targetNearest) {
      setActiveProperty(targetNearest);
      fitMapToProperties([targetNearest], landmark);
    }
  };

  // Handle GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser Anda tidak mendukung geolokasi.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const myCoords: LandmarkItem = {
          id: 'gps-current-location',
          name: '📍 Lokasi Saya (GPS Real-time)',
          category: 'gps',
          area: 'Posisi GPS Anda',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          description: 'Akurasi: ±' + Math.round(pos.coords.accuracy) + ' meter'
        };
        handleSelectLandmark(myCoords);
      },
      (err) => {
        setGpsLoading(false);
        console.warn('GPS location error:', err);
        setGpsError('Tidak dapat mengakses lokasi. Pastikan izin GPS aktif di browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Reset Search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedLandmark(null);
    setActiveProperty(null);
    setAutocompleteOpen(false);
    fitMapToProperties(filteredProperties);
  };

  // Open Property Summary Modal with Gallery
  const handleOpenSummaryModal = (prop: PropertyWithDistance) => {
    setSummaryModalProperty(prop);
    setActiveImageIndex(0);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden select-none bg-[#e5e7eb]">
      
      {/* =========================================================================
          1. FULL-SCREEN LEAFLET MAP
         ========================================================================= */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* =========================================================================
          2. UNIFIED FLOATING TOP BAR (Clean, Compact on Mobile)
         ========================================================================= */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+0.5rem)] sm:top-4 left-2.5 right-2.5 sm:left-4 sm:right-4 max-w-xl mx-auto z-40 pointer-events-auto space-y-1.5 sm:space-y-2">
        {/* Main Search & Action Bar Row */}
        <div className="relative">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-surface/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-1.5 sm:p-2 shadow-2xl shadow-black/80">
            {/* Back to Home Button */}
            <Link
              to="/"
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary hover:text-amber-400 transition-all shrink-0 flex items-center justify-center active:scale-95"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={16} />
            </Link>

            {/* Search Input */}
            <div className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white/5 rounded-xl border border-white/10 focus-within:border-amber-400">
              <Search size={14} className="text-amber-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari kampus, mall, stasiun..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setAutocompleteOpen(true);
                }}
                onFocus={() => setAutocompleteOpen(true)}
                className="w-full bg-transparent text-xs sm:text-sm text-text-primary placeholder:text-muted/70 focus:outline-none font-sans truncate min-w-0"
              />
              {isSearchingGeocode && (
                <RefreshCw size={12} className="text-amber-400 animate-spin shrink-0" />
              )}
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="text-muted hover:text-rose-400 p-0.5 rounded-full shrink-0"
                  title="Hapus"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* GPS Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={gpsLoading}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              title="Gunakan Lokasi GPS Anda"
            >
              <LocateFixed size={14} className={gpsLoading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">GPS</span>
            </button>

            {/* List Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary hover:text-amber-400 transition-all shrink-0 flex items-center justify-center active:scale-95"
              title="Lihat Daftar Semua Unit"
            >
              <List size={16} />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {autocompleteOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-full left-0 right-0 mt-2 bg-surface/98 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl p-2.5 z-50 max-h-[50vh] sm:max-h-[300px] overflow-y-auto space-y-1.5 text-left custom-scrollbar"
              >
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar border-b border-white/10">
                  {[
                    { id: 'all', label: 'Semua', icon: Compass },
                    { id: 'university', label: 'Kampus', icon: School },
                    { id: 'mall', label: 'Mall', icon: ShoppingBag },
                    { id: 'transit', label: 'Stasiun', icon: Train },
                    { id: 'hospital', label: 'RS', icon: Hospital }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setLandmarkCategoryFilter(cat.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 transition-all ${
                        landmarkCategoryFilter === cat.id
                          ? 'bg-amber-500 text-bg shadow-sm'
                          : 'bg-stroke/30 text-muted hover:text-text-primary'
                      }`}
                    >
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {landmarkSuggestions.map((landmark) => (
                  <button
                    key={landmark.id}
                    onClick={() => handleSelectLandmark(landmark)}
                    className="w-full text-left p-2 rounded-xl hover:bg-white/10 active:bg-white/15 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-text-primary truncate">{landmark.name}</div>
                      <div className="text-[10px] text-muted truncate">{landmark.area}</div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 shrink-0">Pilih →</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Horizontal Scrolling Area Chips Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 px-0.5 scroll-smooth">
          {AREA_DISPLAY_ORDER.map((area) => {
            const isActive = selectedArea === area;
            return (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 transition-all shadow-md backdrop-blur-md cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-amber-500 text-bg border border-amber-400 shadow-amber-500/20'
                    : 'bg-surface/90 border border-white/15 text-text-primary/90 hover:text-white'
                }`}
              >
                {area}
              </button>
            );
          })}

          {/* HOT filter toggle */}
          <button
            onClick={() => setOnlyAvailableHot(!onlyAvailableHot)}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0 transition-all shadow-md backdrop-blur-md cursor-pointer active:scale-95 ${
              onlyAvailableHot
                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white border border-orange-400 shadow-orange-500/30'
                : 'bg-surface/90 border border-orange-500/30 text-orange-300 hover:bg-orange-500/20'
            }`}
          >
            <Flame size={12} className={onlyAvailableHot ? 'fill-white' : 'text-orange-400'} />
            <span>Ready (HOT)</span>
          </button>
        </div>

        {/* GPS Error Notification */}
        {gpsError && (
          <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-2">
            <span>{gpsError}</span>
            <button onClick={() => setGpsError(null)} className="text-rose-300 p-0.5">
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Recenter Map & Quick WA Help Floating Buttons */}
      <div className="absolute bottom-24 sm:bottom-8 right-3 sm:right-6 z-20 pointer-events-auto flex flex-col items-end gap-2">
        {/* Quick WhatsApp Consultation Button */}
        <a
          href={formatWaUrl(undefined, undefined)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-green-500/30 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          title="Chat Admin via WhatsApp"
        >
          <MessageCircle size={16} className="fill-white/20 text-white" />
          <span className="hidden sm:inline">Tanya Admin WA</span>
        </a>

        {/* Recenter Map Button */}
        <button
          type="button"
          onClick={() => fitMapToProperties(filteredProperties, selectedLandmark)}
          className="p-2.5 sm:p-3 rounded-2xl bg-surface/95 hover:bg-surface border border-white/20 text-text-primary hover:text-amber-400 shadow-2xl backdrop-blur-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          title="Pusatkan Semua Properti"
        >
          <Maximize2 size={16} />
          <span className="hidden sm:inline">Pusatkan</span>
        </button>
      </div>

      {/* Helper Floating Hint on Mobile (Only when no card is active) */}
      {!activeProperty && !selectedLandmark && (
        <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-surface/90 backdrop-blur-xl border border-white/20 px-3.5 py-1.5 rounded-full shadow-2xl text-[11px] font-medium text-text-primary/90 flex items-center gap-1.5 whitespace-nowrap">
            <Info size={13} className="text-amber-400" />
            <span>Ketuk pin di peta untuk info & foto kamar</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          3. FLOATING PREVIEW CARD (Bottom Sheet on Mobile, Compact Card on Desktop)
         ========================================================================= */}
      <AnimatePresence>
        {(activeProperty || (selectedLandmark && nearestProperty)) && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] left-2.5 right-2.5 sm:fixed sm:bottom-6 sm:left-auto sm:right-6 sm:w-96 sm:max-w-md z-30 pointer-events-auto"
          >
            {(() => {
              const prop = activeProperty || nearestProperty!;
              const isNearest = Boolean(selectedLandmark && prop.id === nearestProperty?.id);
              const hasRooms = Boolean(prop.availableRooms && prop.availableRooms > 0);
              const roomImages = prop.imageUrls && prop.imageUrls.length > 0 ? prop.imageUrls : [prop.image];

              return (
                <div className="bg-surface/98 backdrop-blur-3xl border border-amber-500/50 rounded-3xl p-3 sm:p-4 shadow-2xl shadow-black text-left">
                  {/* Mobile Drag Indicator */}
                  <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mb-2 sm:hidden" />

                  {/* Nearest Header Banner */}
                  {isNearest && selectedLandmark && (
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                      <div className="flex items-center gap-1.5 bg-amber-500 text-bg px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider truncate">
                        <Sparkles size={11} className="fill-bg shrink-0" />
                        <span className="truncate">TERDEKAT DARI: {selectedLandmark.name}</span>
                      </div>
                      {prop.distanceFormatted && (
                        <span className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1 shrink-0">
                          <RouteIcon size={12} />
                          <span>{prop.distanceFormatted}</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2.5">
                    <div
                      onClick={() => handleOpenSummaryModal(prop)}
                      className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
                    >
                      {/* Thumbnail with Gallery indicator */}
                      <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden shrink-0 border border-white/15 bg-black/40 group-hover:border-amber-400 transition-colors">
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute top-1 left-1">
                          <span className={`text-[7.5px] font-black px-1.5 py-0.2 rounded uppercase ${
                            hasRooms ? 'bg-emerald-500 text-bg' : 'bg-rose-500 text-white'
                          }`}>
                            {hasRooms ? `${prop.availableRooms} Kmr` : 'Full'}
                          </span>
                        </div>
                        {roomImages.length > 1 && (
                          <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[8px] font-mono px-1 rounded flex items-center gap-0.5">
                            <Eye size={9} />
                            <span>{roomImages.length}</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8.5px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 truncate">
                            {getPropertyArea(prop)}
                          </span>
                          <span className="text-[10px] text-muted truncate">• {prop.category}</span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-amber-300 transition-colors truncate">
                          {prop.title}
                        </h3>

                        <p className="text-xs font-bold text-emerald-400 mt-0.5">
                          {prop.priceRange || prop.price}
                        </p>

                        {prop.travelTimeFormatted && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-300 mt-0.5 truncate">
                            <Clock size={11} className="shrink-0" />
                            <span>Motor: <strong>{prop.travelTimeFormatted}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setActiveProperty(null);
                        setSelectedLandmark(null);
                      }}
                      className="text-muted hover:text-text-primary p-1.5 rounded-full hover:bg-white/10 shrink-0"
                      title="Tutup"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenSummaryModal(prop)}
                      className="px-2.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <Eye size={12} />
                      <span>Foto & Info</span>
                    </button>

                    <a
                      href={formatWaUrl(prop.phone, prop.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                      title="Chat WhatsApp"
                    >
                      <MessageCircle size={13} className="text-emerald-400" />
                      <span>Chat WA</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => navigate(`/property/${prop.id}-${slugify(prop.title)}`)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-bg text-xs font-bold flex items-center justify-center gap-1 shadow active:scale-95 transition-all"
                    >
                      <span>Booking</span>
                      <ArrowRight size={12} />
                    </button>

                    <a
                      href={
                        prop.addressUrl ||
                        `https://www.google.com/maps/dir/?api=1&destination=${prop.coordinates.lat},${prop.coordinates.lng}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary border border-white/10 text-xs font-medium flex items-center gap-1 shrink-0 active:scale-95"
                      title="Buka rute di Google Maps"
                    >
                      <ExternalLink size={12} />
                      <span className="hidden xs:inline">Rute</span>
                    </a>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          4. INTERACTIVE ROOM GALLERY & SUMMARY MODAL (Popup directly on map)
         ========================================================================= */}
      <AnimatePresence>
        {summaryModalProperty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto"
            onClick={() => setSummaryModalProperty(null)}
          >
            {(() => {
              const prop = summaryModalProperty;
              const allImages = prop.imageUrls && prop.imageUrls.length > 0 ? prop.imageUrls : [prop.image];
              const hasRooms = Boolean(prop.availableRooms && prop.availableRooms > 0);
              const roomBadges = prop.availableRoomsList || [];

              return (
                <motion.div
                  initial={{ opacity: 0, y: 80, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 80, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl bg-surface border border-white/15 rounded-t-3xl sm:rounded-3xl max-h-[88dvh] sm:max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl text-left custom-scrollbar pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]"
                >
                  {/* Modal Header Bar */}
                  <div className="sticky top-0 bg-surface/98 backdrop-blur-2xl border-b border-white/10 p-3.5 sm:p-4 flex items-center justify-between z-20">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {getPropertyArea(prop)}
                        </span>
                        <span className="text-xs text-muted">• {prop.category}</span>
                      </div>
                      <h3 className="text-sm sm:text-lg font-bold text-text-primary truncate">
                        {prop.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => setSummaryModalProperty(null)}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-muted hover:text-white transition-colors shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
                    
                    {/* 1. ROOM PHOTO GALLERY SLIDER */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/10] sm:aspect-[1.8/1] bg-black/60 border border-white/10 group">
                      <img
                        src={allImages[activeImageIndex] || prop.image}
                        alt={`Foto kamar ${prop.title}`}
                        className="w-full h-full object-cover transition-all duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
                        }}
                      />

                      {/* Image Index Indicator */}
                      <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/15">
                        📷 {activeImageIndex + 1} / {allImages.length} Foto
                      </div>

                      {/* Room Availability Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-md ${
                          hasRooms ? 'bg-emerald-500 text-bg' : 'bg-rose-500 text-white'
                        }`}>
                          {prop.availabilityStatus || (hasRooms ? `Ready ${prop.availableRooms} Kamar` : 'Kamar Full')}
                        </span>
                      </div>

                      {/* Slider Navigation Arrows */}
                      {allImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer active:scale-95"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer active:scale-95"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Image Thumbnails Strip */}
                    {allImages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {allImages.map((imgUrl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setActiveImageIndex(i)}
                            className={`relative w-14 h-11 sm:w-16 sm:h-12 rounded-xl overflow-hidden shrink-0 border transition-all cursor-pointer ${
                              activeImageIndex === i
                                ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                                : 'border-white/10 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={imgUrl} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* 2. PRICE & DISTANCE SUMMARY BANNER */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div>
                        <span className="text-[10px] text-muted uppercase font-bold tracking-wider block mb-0.5">
                          Harga Sewa Bulanan
                        </span>
                        <div className="text-base sm:text-xl font-bold text-emerald-400">
                          {prop.priceRange || prop.price}
                        </div>
                        <span className="text-[10px] text-muted block mt-0.5">
                          Deposit: Rp {Number(prop.deposit || 500000).toLocaleString('id-ID')}
                        </span>
                      </div>

                      {prop.distanceFormatted ? (
                        <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-2.5 sm:pt-0 sm:pl-3">
                          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block mb-0.5 flex items-center gap-1">
                            <RouteIcon size={12} />
                            <span>Jarak dari Landmark</span>
                          </span>
                          <div className="text-sm sm:text-base font-bold text-text-primary font-mono">
                            {prop.distanceFormatted}
                          </div>
                          <span className="text-[10px] text-muted block mt-0.5">
                            Motor: {prop.travelTimeFormatted} • Jalan: {prop.walkingTimeFormatted}
                          </span>
                        </div>
                      ) : (
                        <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-2.5 sm:pt-0 sm:pl-3">
                          <span className="text-[10px] text-muted uppercase font-bold tracking-wider block mb-0.5">
                            Lokasi & Area
                          </span>
                          <div className="text-sm font-bold text-text-primary truncate">
                            {prop.location}
                          </div>
                          <span className="text-[10px] text-muted block mt-0.5 truncate">
                            {prop.kecamatan ? `Kec. ${prop.kecamatan}` : 'Jakarta'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3. AVAILABLE ROOMS LIST (If available) */}
                    {roomBadges.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <BedDouble size={14} className="text-amber-400" />
                          <span>Daftar Kamar Siap Huni ({roomBadges.length} Unit Ready)</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {roomBadges.map((roomName, i) => (
                            <span
                              key={i}
                              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} className="text-emerald-400" />
                              <span>{roomName}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. KEY FACILITIES GRID */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-amber-400" />
                        <span>Fasilitas Kamar & Properti</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-text-primary">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <Wind size={15} className="text-cyan-400 shrink-0" />
                          <span>AC Dingin</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <Wifi size={15} className="text-amber-400 shrink-0" />
                          <span>WiFi Kencang</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <Droplets size={15} className="text-blue-400 shrink-0" />
                          <span>K. Mandi Dalam</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <BedDouble size={15} className="text-emerald-400 shrink-0" />
                          <span>Springbed & Lemari</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <Car size={15} className="text-orange-400 shrink-0" />
                          <span>Parkiran Aman</span>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                          <Zap size={15} className="text-yellow-400 shrink-0" />
                          <span>Listrik & Air</span>
                        </div>
                      </div>
                    </div>

                    {/* 5. DESCRIPTION */}
                    {prop.description && (
                      <div className="space-y-1.5 text-left">
                        <span className="text-xs font-bold text-text-primary uppercase tracking-wider block">
                          Deskripsi Lengkap
                        </span>
                        <p className="text-xs text-muted leading-relaxed whitespace-pre-line bg-white/5 p-3 rounded-xl border border-white/5">
                          {prop.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Action Buttons */}
                  <div className="sticky bottom-0 bg-surface/98 backdrop-blur-2xl border-t border-white/10 p-3 sm:p-4 flex items-center justify-between gap-2 sm:gap-3">
                    <a
                      href={formatWaUrl(prop.phone, prop.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 active:scale-95"
                      title="Chat WhatsApp"
                    >
                      <MessageCircle size={16} className="text-emerald-400" />
                      <span>{prop.phone ? 'Chat WA Penjaga' : 'Chat WA Admin'}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setSummaryModalProperty(null);
                        navigate(`/property/${prop.id}-${slugify(prop.title)}`);
                      }}
                      className="flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-bg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                    >
                      <span>Lihat Kamar & Booking</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          5. SLIDE-OVER ALL PROPERTIES DRAWER
         ========================================================================= */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-sm bg-surface/98 backdrop-blur-3xl border-r border-white/15 z-50 p-4 flex flex-col shadow-2xl text-left pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm text-text-primary">Semua Properti ({filteredProperties.length})</h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-muted hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1 custom-scrollbar pr-1">
              {filteredProperties.map((prop, idx) => (
                <div
                  key={prop.id || idx}
                  onClick={() => {
                    setActiveProperty(prop);
                    setIsDrawerOpen(false);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView(
                        [prop.coordinates.lat, prop.coordinates.lng],
                        16,
                        { animate: true }
                      );
                    }
                  }}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-98 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-bold text-amber-400 uppercase">{getPropertyArea(prop)}</div>
                      <div className="text-xs font-bold text-text-primary truncate">{prop.title}</div>
                      <div className="text-xs font-bold text-emerald-400">{prop.priceRange || prop.price}</div>
                    </div>
                  </div>

                  <a
                    href={formatWaUrl(prop.phone, prop.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs shrink-0 active:scale-90 transition-all"
                    title="Chat WhatsApp Properti Ini"
                  >
                    <MessageCircle size={15} className="text-emerald-400" />
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
