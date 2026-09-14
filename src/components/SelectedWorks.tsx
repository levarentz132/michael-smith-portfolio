import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProperties } from '../api';
import type { Property } from '../api';
import { gsap } from 'gsap';
import { SlidersHorizontal, Flame, MapPin, Building2 } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SelectedWorksProps {
  onPropertyClick: (id: number, title: string) => void;
  initialBookingFilter?: 'all' | 'monthly' | 'transit';
}

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

const AREA_DISPLAY_ORDER = [
  'Kebon Jeruk',
  'Grogol',
  'Kemayoran',
  'Cengkareng',
  'Jakarta Barat',
  'Tangerang',
  'Palembang'
];

function getAreaBadgeStyles(area: string): { bg: string; text: string; border: string; dot: string } {
  const a = area.toLowerCase();
  if (a.includes('kebon jeruk')) {
    return {
      bg: 'bg-emerald-600/90',
      text: 'text-white',
      border: 'border-emerald-400/50',
      dot: 'bg-emerald-300'
    };
  }
  if (a.includes('grogol')) {
    return {
      bg: 'bg-sky-600/90',
      text: 'text-white',
      border: 'border-sky-400/50',
      dot: 'bg-sky-300'
    };
  }
  if (a.includes('kemayoran')) {
    return {
      bg: 'bg-purple-600/90',
      text: 'text-white',
      border: 'border-purple-400/50',
      dot: 'bg-purple-300'
    };
  }
  if (a.includes('cengkareng')) {
    return {
      bg: 'bg-amber-600/90',
      text: 'text-white',
      border: 'border-amber-400/50',
      dot: 'bg-amber-300'
    };
  }
  if (a.includes('tangerang')) {
    return {
      bg: 'bg-teal-600/90',
      text: 'text-white',
      border: 'border-teal-400/50',
      dot: 'bg-teal-300'
    };
  }
  if (a.includes('palembang')) {
    return {
      bg: 'bg-rose-600/90',
      text: 'text-white',
      border: 'border-rose-400/50',
      dot: 'bg-rose-300'
    };
  }
  return {
    bg: 'bg-blue-600/90',
    text: 'text-white',
    border: 'border-blue-400/50',
    dot: 'bg-blue-300'
  };
}

interface PropertyCardProps {
  project: Property;
  index: number;
  onPropertyClick: (id: number, title: string) => void;
  isHot?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ project, index, onPropertyClick, isHot = false }) => {
  const hasRooms = Boolean(project.availableRooms && project.availableRooms > 0);
  const roomBadges = project.availableRoomsList && project.availableRoomsList.length > 0
    ? project.availableRoomsList.slice(0, 3)
    : [];
  const areaName = getPropertyArea(project);
  const badgeStyles = getAreaBadgeStyles(areaName);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      key={project.id || index}
      onClick={() => project.id && onPropertyClick(project.id, project.title)}
      className={`group relative overflow-hidden bg-surface border rounded-2xl md:rounded-3xl cursor-pointer w-full aspect-[4/3] transition-all duration-300 ${
        isHot 
          ? 'border-orange-500/40 shadow-lg shadow-orange-500/5 hover:border-orange-400 hover:shadow-orange-500/15' 
          : 'border-stroke hover:border-text-primary/30'
      }`}
    >
      {/* Property image with smooth hover scale */}
      <img 
        src={project.image} 
        alt={project.title} 
        onError={(e) => {
          (e.target as HTMLImageElement).src = project.type === 'apartment'
            ? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
            : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
        }}
        className="absolute inset-0 w-full h-full object-cover bg-black/40 transition-transform duration-700 ease-out group-hover:scale-110"
      />

      {/* Glassmorphic border light effect on hover */}
      <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-2xl md:rounded-3xl transition-colors duration-500 pointer-events-none z-20" />

      {/* Top Badge Overlay */}
      <div className="absolute top-2.5 left-2.5 right-2.5 md:top-4 md:left-4 md:right-4 flex justify-between items-start z-10 transition-all duration-300 group-hover:opacity-0 group-hover:scale-95 gap-2">
        <div className="flex flex-col gap-1.5 items-start">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Highlighted Area Tag Pill at Top Left */}
            <span className={`backdrop-blur-md text-[8px] md:text-[10px] font-extrabold uppercase px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border shadow-sm flex items-center gap-1 ${badgeStyles.bg} ${badgeStyles.text} ${badgeStyles.border}`}>
              <MapPin size={9} className="fill-white" />
              <span>{areaName}</span>
            </span>

            {/* Price Badge */}
            <span className="bg-bg/85 backdrop-blur-md text-[9px] md:text-[11px] font-bold text-text-primary px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/5 flex items-center gap-1">
              {project.promoPrice ? (
                <>
                  <span className="animate-strike text-text-primary/40 text-[7px] md:text-[10px]">
                    Rp {Math.round(Number(project.rawPrice) / 1000)}k
                  </span>
                  <span className="text-emerald-400 font-extrabold">
                    Rp {Math.round(Number(project.promoPrice) / 1000)}k
                  </span>
                </>
              ) : (
                <span>{project.priceRange || project.price.replace('Rp.', 'Rp').replace('/ month', '')}</span>
              )}
            </span>

            {/* HOT Pill Badge */}
            {isHot && (
              <span className="bg-gradient-to-r from-orange-500/90 to-rose-500/90 backdrop-blur-md text-[8px] md:text-[10px] font-extrabold text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-md shadow-orange-500/20 flex items-center gap-1">
                <Flame size={11} className="fill-white" />
                <span>HOT</span>
              </span>
            )}
          </div>

          {/* Availability Status Badge */}
          {project.availabilityStatus && (
            <span className={`backdrop-blur-md text-[8px] md:text-[10px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border flex items-center gap-1 shadow-sm ${
              hasRooms
                ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hasRooms ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{project.availabilityStatus}</span>
            </span>
          )}
        </div>

        {/* Rating Badge */}
        <span className="bg-bg/85 backdrop-blur-md text-[9px] md:text-[11px] font-bold text-text-primary px-2 py-1 md:px-2.5 md:py-1.5 rounded-full border border-white/5 flex items-center shrink-0">
          {project.rating}
        </span>
      </div>

      {/* Permanent Bottom Info Overlay (Desktop & Mobile, visible before hover) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex justify-between items-end z-10 transition-all duration-300 group-hover:opacity-0 pointer-events-none">
        <div className="text-left min-w-0 flex-1 pr-2">
          {/* Prominent Highlighted Area Badge */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider shadow-md backdrop-blur-md border ${badgeStyles.bg} ${badgeStyles.text} ${badgeStyles.border}`}>
              <MapPin size={10} className="fill-white" />
              <span>{areaName}</span>
            </span>
            {project.kecamatan && project.kecamatan.toLowerCase() !== areaName.toLowerCase() && (
              <span className="text-[9px] md:text-[10px] text-white/80 font-medium truncate drop-shadow-sm">
                • {project.kecamatan}
              </span>
            )}
          </div>

          {/* Property Title */}
          <span className="text-sm md:text-base text-white font-bold block truncate drop-shadow-md tracking-tight">
            {project.title}
          </span>

          {/* Subtitle / Available Rooms Live Preview */}
          {roomBadges.length > 0 ? (
            <span className="text-[10px] md:text-[11px] text-emerald-300 font-semibold block mt-0.5 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Kamar Ready: {roomBadges.join(', ')}{project.availableRoomsList && project.availableRoomsList.length > 3 ? ` +${project.availableRoomsList.length - 3}` : ''}</span>
            </span>
          ) : (
            <span className="text-[10px] text-white/60 block mt-0.5 truncate">
              {project.category}
            </span>
          )}
        </div>

        <span className="text-[10px] md:text-xs text-white/40 font-mono shrink-0 mb-0.5">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Hover Details Mask (Desktop) */}
      <div className="absolute inset-0 bg-bg/90 opacity-0 group-hover:opacity-100 transition-opacity duration-400 backdrop-blur-md flex flex-col justify-between p-6 md:p-8 z-20">
        {/* Category & Highlighted Area info (Slides Down) */}
        <div className="flex flex-col gap-1.5 transition-all duration-400 ease-out transform -translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${badgeStyles.bg} ${badgeStyles.text} ${badgeStyles.border}`}>
              <MapPin size={10} className="fill-white" />
              <span>Kawasan {areaName}</span>
            </span>
            <span className="text-xs text-muted uppercase tracking-[0.2em] font-semibold">{project.category}</span>
            {isHot && (
              <span className="bg-orange-500/20 text-orange-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-orange-500/30">
                Siap Huni
              </span>
            )}
          </div>
          <span className="text-[11px] text-text-primary/80 flex items-center gap-1 font-medium">
            <MapPin size={11} className="text-muted" />
            {project.location} {project.kecamatan && project.kecamatan !== project.location ? `(${project.kecamatan})` : ''}
          </span>
        </div>
        
        {/* Center Hover Label Pill */}
        <div className="flex justify-center items-center flex-1 transition-all duration-400 ease-out transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 delay-75">
          <div className="relative p-[1px] rounded-full overflow-hidden animate-gradient-shift accent-gradient shadow-xl">
            <div className="bg-white rounded-full px-5 py-3 md:px-6 md:py-3.5 flex items-center justify-center">
              <span className="text-xs text-black font-semibold uppercase tracking-wider">
                Pesan — <span className="font-display italic text-sm lowercase">{project.title}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom details row */}
        <div className="flex justify-between items-end border-t border-stroke/40 pt-4 transition-all duration-400 ease-out transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 delay-100">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-base md:text-lg text-text-primary font-bold">{project.title}</span>
              <span className="text-xs font-semibold text-emerald-400">• {areaName}</span>
            </div>
            {project.promoPrice ? (
              <span className="text-xs flex items-center gap-1.5">
                <span className="animate-strike text-muted/50">
                  Rp. {Number(project.rawPrice).toLocaleString('id-ID')}
                </span>
                <span className="text-emerald-400 font-bold">
                  Rp. {Number(project.promoPrice).toLocaleString('id-ID')}
                </span>
                <span className="text-muted">/ bulan</span>
              </span>
            ) : (
              <span className="text-xs text-muted">{project.price}</span>
            )}
          </div>
          <span className="text-xs text-muted font-mono">{String(index + 1).padStart(2, '0')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const SelectedWorks: React.FC<SelectedWorksProps> = ({ onPropertyClick, initialBookingFilter }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState<'all' | 'kos' | 'apartment'>('all');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'monthly' | 'transit'>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedHotArea, setSelectedHotArea] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialBookingFilter) {
      setBookingFilter(initialBookingFilter);
    }
  }, [initialBookingFilter]);

  const activeFiltersCount = 
    (filter !== 'all' ? 1 : 0) + 
    (bookingFilter !== 'all' ? 1 : 0) + 
    (selectedArea !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setFilter('all');
    setBookingFilter('all');
    setSelectedArea('all');
    setSelectedHotArea('all');
    setSearchTerm('');
  };

  const loadProperties = async () => {
    try {
      const data = await fetchProperties();
      setProperties(data);
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProperties();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading, properties, filter, bookingFilter, selectedArea, searchTerm]);

  // Available unique areas
  const uniqueAreas = useMemo(() => {
    const setOfAreas = new Set(properties.map(p => getPropertyArea(p)));
    const sorted = AREA_DISPLAY_ORDER.filter(a => setOfAreas.has(a));
    Array.from(setOfAreas).forEach(a => {
      if (!sorted.includes(a)) sorted.push(a);
    });
    return sorted;
  }, [properties]);

  // Base filter (type, booking, search)
  const baseFilteredProperties = useMemo(() => {
    return properties.filter(prop => {
      const matchesType = filter === 'all' ? true : prop.type === filter;
      const matchesBooking = 
        bookingFilter === 'all' ? true : 
        bookingFilter === 'transit' ? !!(prop.transit3h || prop.transit6h || prop.transit12h || prop.transit24h) : 
        true;
      const matchesSearch = searchTerm === '' ? true :
        prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prop.kecamatan && prop.kecamatan.toLowerCase().includes(searchTerm.toLowerCase())) ||
        getPropertyArea(prop).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prop.description && prop.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesBooking && matchesSearch;
    });
  }, [properties, filter, bookingFilter, searchTerm]);

  // HOT Properties (Available Rooms > 0)
  const hotProperties = useMemo(() => {
    return baseFilteredProperties.filter(p => p.availableRooms && p.availableRooms > 0);
  }, [baseFilteredProperties]);

  // Unique areas among HOT properties
  const uniqueHotAreas = useMemo(() => {
    const setOfAreas = new Set(hotProperties.map(p => getPropertyArea(p)));
    const sorted = AREA_DISPLAY_ORDER.filter(a => setOfAreas.has(a));
    Array.from(setOfAreas).forEach(a => {
      if (!sorted.includes(a)) sorted.push(a);
    });
    return sorted;
  }, [hotProperties]);

  // Total available rooms count across HOT properties
  const totalHotRooms = useMemo(() => {
    return hotProperties.reduce((sum, p) => sum + (p.availableRooms || 0), 0);
  }, [hotProperties]);

  // Filtered HOT properties by selected hot area
  const filteredHotProperties = useMemo(() => {
    if (selectedHotArea === 'all') return hotProperties;
    return hotProperties.filter(p => getPropertyArea(p).toLowerCase() === selectedHotArea.toLowerCase());
  }, [hotProperties, selectedHotArea]);

  // Grouped HOT properties by area
  const groupedHotByArea = useMemo(() => {
    const groups: { area: string; items: Property[]; totalRooms: number }[] = [];
    uniqueHotAreas.forEach(area => {
      const items = hotProperties.filter(p => getPropertyArea(p).toLowerCase() === area.toLowerCase());
      if (items.length > 0) {
        const rooms = items.reduce((sum, p) => sum + (p.availableRooms || 0), 0);
        groups.push({ area, items, totalRooms: rooms });
      }
    });
    return groups;
  }, [uniqueHotAreas, hotProperties]);

  // Properties filtered by selected area
  const areaFilteredProperties = useMemo(() => {
    if (selectedArea === 'all') return baseFilteredProperties;
    return baseFilteredProperties.filter(p => getPropertyArea(p).toLowerCase() === selectedArea.toLowerCase());
  }, [baseFilteredProperties, selectedArea]);

  // Grouped properties by area for "Semua Area" overview
  const groupedByArea = useMemo(() => {
    const groups: { area: string; items: Property[] }[] = [];
    uniqueAreas.forEach(area => {
      const items = baseFilteredProperties.filter(p => getPropertyArea(p).toLowerCase() === area.toLowerCase());
      if (items.length > 0) {
        groups.push({ area, items });
      }
    });
    return groups;
  }, [uniqueAreas, baseFilteredProperties]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="work" className="bg-bg py-16 md:py-24 select-none">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-8">
          <div className="flex flex-col items-start text-left max-w-xl">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-stroke inline-block" />
              <span className="text-xs text-muted uppercase tracking-[0.3em] font-medium">Hunian Pilihan</span>
            </div>
            {/* Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-text-primary mb-4 leading-none">
              Ruangan <span className="italic font-normal">unggulan</span>
            </h2>
            {/* Subtext */}
            <p className="text-sm md:text-base text-muted font-light leading-relaxed">
              Jelajahi unit kos dan apartemen siap huni (HOT) serta pilihan lokasi strategis di Kebon Jeruk, Grogol, Kemayoran, dan sekitarnya.
            </p>
            {/* Search Bar */}
            <div className="w-full max-w-md mt-6">
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Cari ruangan, area (Kebon Jeruk, Grogol), atau fasilitas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface border border-stroke rounded-full px-5 py-3 text-xs text-text-primary placeholder:text-muted focus:outline-none focus:border-text-primary/40 focus:ring-1 focus:ring-text-primary/10 transition-all duration-300 font-sans shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-rose-400 font-bold text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Compact Filters & Jump Buttons */}
          <div className="hidden md:flex flex-col gap-3.5 items-end shrink-0">
            {/* Section Quick-Jump Pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollToSection('hot-section')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <Flame size={13} className="text-orange-400 fill-orange-400" />
                <span>Unit HOT ({hotProperties.length})</span>
              </button>
              <button
                onClick={() => scrollToSection('area-section')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-stroke bg-surface hover:bg-stroke/40 text-text-primary text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <MapPin size={13} className="text-muted" />
                <span>Pilihan Area</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-stroke bg-surface hover:bg-bg/40 text-xs font-semibold uppercase tracking-wider text-text-primary active:scale-[0.98] transition-all duration-300 shadow-sm"
              >
                <SlidersHorizontal size={14} className="text-muted" />
                <span>Filter Tambahan</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-text-primary text-bg flex items-center justify-center text-[9px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Active Filter Summary Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center justify-end">
                <span className="text-[9px] text-muted uppercase tracking-widest font-semibold mr-1">Aktif:</span>
                {filter !== 'all' && (
                  <span className="text-[9px] font-semibold uppercase bg-stroke/50 text-text-primary px-2.5 py-1 rounded-full border border-stroke flex items-center gap-1">
                    {filter === 'kos' ? 'Kamar Kos' : 'Apartemen'}
                    <button onClick={() => setFilter('all')} className="hover:text-rose-400 font-bold ml-1">✕</button>
                  </span>
                )}
                {bookingFilter !== 'all' && (
                  <span className="text-[9px] font-semibold uppercase bg-stroke/50 text-text-primary px-2.5 py-1 rounded-full border border-stroke flex items-center gap-1">
                    {bookingFilter === 'monthly' ? 'Sewa Bulanan' : 'Sewa Transit'}
                    <button onClick={() => setBookingFilter('all')} className="hover:text-rose-400 font-bold ml-1">✕</button>
                  </span>
                )}
                {selectedArea !== 'all' && (
                  <span className="text-[9px] font-semibold uppercase bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-full border border-orange-500/30 flex items-center gap-1">
                    Area: {selectedArea}
                    <button onClick={() => setSelectedArea('all')} className="hover:text-rose-400 font-bold ml-1">✕</button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Toggle & Summary */}
        <div className="flex flex-col gap-3 w-full md:hidden mb-6">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => scrollToSection('hot-section')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-[10px] font-bold uppercase tracking-wider shrink-0"
              >
                <Flame size={11} className="text-orange-400 fill-orange-400" />
                <span>HOT ({hotProperties.length})</span>
              </button>
              <button
                onClick={() => scrollToSection('area-section')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-stroke bg-surface text-text-primary text-[10px] font-bold uppercase tracking-wider shrink-0"
              >
                <MapPin size={11} className="text-muted" />
                <span>Area</span>
              </button>
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stroke bg-surface text-[10px] font-semibold uppercase tracking-wider text-text-primary shrink-0"
            >
              <SlidersHorizontal size={12} className="text-muted" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-text-primary text-bg flex items-center justify-center text-[8px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[9px] text-muted uppercase font-semibold">Aktif:</span>
                {selectedArea !== 'all' && (
                  <span className="text-[9px] font-semibold uppercase bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30">
                    {selectedArea}
                  </span>
                )}
                {filter !== 'all' && (
                  <span className="text-[9px] font-semibold uppercase bg-stroke/50 text-text-primary px-2 py-0.5 rounded-full border border-stroke">
                    {filter === 'kos' ? 'Kos' : 'Apartemen'}
                  </span>
                )}
              </div>
              <button
                onClick={resetFilters}
                className="text-[9px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300 shrink-0"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Collapsible Filter Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden w-full bg-surface/30 border border-stroke rounded-[32px] p-5 md:p-8 flex flex-col md:grid md:grid-cols-2 gap-5 md:gap-8 mb-10 shadow-lg text-left backdrop-blur-md"
            >
              {/* Category Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Tipe Hunian:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'kos', 'apartment'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-4 py-2 transition-all duration-200 ${
                        filter === type 
                          ? 'text-bg bg-text-primary' 
                          : 'text-text-primary border border-stroke bg-bg/40 hover:bg-stroke/40'
                      }`}
                    >
                      {type === 'all' ? 'Semua Tipe' : type === 'kos' ? 'Kamar Kos' : 'Apartemen'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Type Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Durasi Sewa:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'monthly', 'transit'] as const).map((bType) => (
                    <button
                      key={bType}
                      onClick={() => setBookingFilter(bType)}
                      className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-4 py-2 transition-all duration-200 ${
                        bookingFilter === bType 
                          ? 'text-bg bg-text-primary' 
                          : 'text-text-primary border border-stroke bg-bg/40 hover:bg-stroke/40'
                      }`}
                    >
                      {bType === 'all' ? 'Semua Durasi' : bType === 'monthly' ? 'Sewa Bulanan' : 'Sewa Transit'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <div className="w-6 h-6 rounded-full border-2 border-stroke border-t-text-primary animate-spin mb-2" />
            <span className="text-[10px] uppercase tracking-wider">Memuat ruangan...</span>
          </div>
        ) : searchTerm ? (
          /* Search Results View */
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-stroke">
              <div className="text-left">
                <h3 className="text-lg md:text-xl font-display font-medium text-text-primary">
                  Hasil Pencarian untuk: <span className="italic text-text-primary font-bold">"{searchTerm}"</span>
                </h3>
                <p className="text-xs text-muted mt-1">Ditemukan {baseFilteredProperties.length} unit yang cocok</p>
              </div>
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs font-semibold text-rose-400 hover:underline"
              >
                Reset Pencarian
              </button>
            </div>

            {baseFilteredProperties.length === 0 ? (
              <div className="py-16 text-center text-muted">
                <p className="text-sm mb-4">Tidak ada ruangan yang cocok dengan kata kunci "{searchTerm}".</p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-full bg-text-primary text-bg text-xs font-semibold uppercase tracking-wider"
                >
                  Tampilkan Semua Ruangan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
                {baseFilteredProperties.map((project, index) => (
                  <PropertyCard 
                    key={project.id || index}
                    project={project}
                    index={index}
                    onPropertyClick={onPropertyClick}
                    isHot={Boolean(project.availableRooms && project.availableRooms > 0)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Structured Sections */
          <div className="flex flex-col gap-16 md:gap-24">
            
            {/* 1. HOT SECTION — KAMAR SIAP HUNI */}
            {hotProperties.length > 0 && (
              <div id="hot-section" className="scroll-mt-28">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4 pb-4 border-b border-orange-500/20 text-left">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                        <Flame size={11} className="fill-white animate-bounce" />
                        <span>HOT UNIT</span>
                      </span>
                      <span className="text-[11px] font-semibold text-orange-400/90 tracking-wide uppercase">
                        Siap Huni Hari Ini
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-display font-medium text-text-primary">
                      Kamar Siap Huni <span className="italic font-normal text-orange-400">(HOT)</span>
                    </h3>
                    <p className="text-xs md:text-sm text-muted font-light mt-1">
                      Unit pilihan dengan kamar ready yang siap langsung ditempati tanpa antre, dikelompokkan per area.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-end shrink-0">
                    <span className="px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-bold flex items-center gap-1.5">
                      <Flame size={13} className="text-orange-400 fill-orange-400" />
                      <span>{hotProperties.length} Properti Ready • {totalHotRooms} Kamar</span>
                    </span>
                  </div>
                </div>

                {/* HOT Area Selector Tabs Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
                  <button
                    onClick={() => setSelectedHotArea('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 shrink-0 flex items-center gap-1.5 ${
                      selectedHotArea === 'all'
                        ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-surface border border-orange-500/20 text-orange-300/80 hover:text-orange-200 hover:border-orange-500/40'
                    }`}
                  >
                    <Flame size={12} className={selectedHotArea === 'all' ? 'fill-white' : ''} />
                    <span>Semua Area Ready</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedHotArea === 'all' ? 'bg-black/20 text-white' : 'bg-orange-500/10 text-orange-300'}`}>
                      {hotProperties.length}
                    </span>
                  </button>

                  {uniqueHotAreas.map((area) => {
                    const areaItems = hotProperties.filter(p => getPropertyArea(p).toLowerCase() === area.toLowerCase());
                    const areaRooms = areaItems.reduce((sum, p) => sum + (p.availableRooms || 0), 0);
                    const isSelected = selectedHotArea.toLowerCase() === area.toLowerCase();
                    return (
                      <button
                        key={area}
                        onClick={() => setSelectedHotArea(area)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20'
                            : 'bg-surface border border-stroke text-muted hover:text-text-primary hover:border-stroke/80'
                        }`}
                      >
                        <MapPin size={11} className={isSelected ? 'text-white' : 'text-orange-400'} />
                        <span>{area}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/20 text-white' : 'bg-stroke/60 text-muted'}`}>
                          {areaItems.length} unit ({areaRooms} kmr)
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* HOT Grid Display */}
                {selectedHotArea === 'all' ? (
                  /* Grouped View by Area in HOT section */
                  <div className="flex flex-col gap-10">
                    {groupedHotByArea.map((group) => (
                      <div key={group.area} className="text-left">
                        {/* Area Subheading inside HOT section */}
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-orange-500/20">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400/50 animate-pulse" />
                            <h4 className="text-lg md:text-xl font-display font-medium text-text-primary">
                              Area {group.area}
                            </h4>
                            <span className="text-[11px] text-orange-300 font-semibold bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                              {group.items.length} Unit Ready • {group.totalRooms} Kamar Siap Huni
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedHotArea(group.area)}
                            className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium flex items-center gap-1"
                          >
                            Fokus Area {group.area} →
                          </button>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
                          {group.items.map((project, index) => (
                            <PropertyCard 
                              key={project.id || index}
                              project={project}
                              index={index}
                              onPropertyClick={onPropertyClick}
                              isHot={true}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Focused Area View in HOT section */
                  <div>
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-orange-500/20 text-left">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400/50" />
                        <h4 className="text-lg md:text-xl font-display font-medium text-text-primary">
                          Kamar Ready di Area: <span className="text-orange-400 font-semibold">{selectedHotArea}</span>
                        </h4>
                        <span className="text-xs text-orange-300 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                          {filteredHotProperties.length} Unit Ready
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedHotArea('all')}
                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
                      >
                        Lihat Semua Area Ready
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
                      {filteredHotProperties.map((project, index) => (
                        <PropertyCard 
                          key={project.id || index}
                          project={project}
                          index={index}
                          onPropertyClick={onPropertyClick}
                          isHot={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. AREA SECTION — PILIHAN BERDASARKAN KAWASAN */}
            <div id="area-section" className="scroll-mt-28">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4 pb-4 border-b border-stroke text-left">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex items-center gap-1 bg-surface border border-stroke text-text-primary text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                      <MapPin size={10} className="text-emerald-400" />
                      <span>Kawasan Strategis</span>
                    </span>
                    <span className="text-[11px] font-semibold text-muted tracking-wide uppercase">
                      Lokasi Unggulan
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-medium text-text-primary">
                    Pilihan Berdasarkan <span className="italic font-normal">Area & Kawasan</span>
                  </h3>
                  <p className="text-xs md:text-sm text-muted font-light mt-1">
                    Temukan hunian yang dekat dengan aktivitas Anda di Kebon Jeruk, Grogol, Kemayoran, dll.
                  </p>
                </div>
              </div>

              {/* Area Selector Tabs Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
                <button
                  onClick={() => setSelectedArea('all')}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 shrink-0 flex items-center gap-1.5 ${
                    selectedArea === 'all'
                      ? 'bg-text-primary text-bg shadow-md'
                      : 'bg-surface border border-stroke text-muted hover:text-text-primary hover:border-stroke/80'
                  }`}
                >
                  <Building2 size={13} />
                  <span>Semua Area</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedArea === 'all' ? 'bg-bg text-text-primary' : 'bg-stroke/60 text-muted'}`}>
                    {baseFilteredProperties.length}
                  </span>
                </button>

                {uniqueAreas.map((area) => {
                  const areaCount = baseFilteredProperties.filter(p => getPropertyArea(p).toLowerCase() === area.toLowerCase()).length;
                  const isSelected = selectedArea.toLowerCase() === area.toLowerCase();
                  return (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(area)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-text-primary text-bg shadow-md'
                          : 'bg-surface border border-stroke text-muted hover:text-text-primary hover:border-stroke/80'
                      }`}
                    >
                      <MapPin size={12} className={isSelected ? 'text-bg' : 'text-muted'} />
                      <span>{area}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-bg text-text-primary' : 'bg-stroke/60 text-muted'}`}>
                        {areaCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Area Content Grid */}
              {selectedArea === 'all' ? (
                /* Grouped by Area View */
                <div className="flex flex-col gap-14">
                  {groupedByArea.map((group) => (
                    <div key={group.area} className="text-left">
                      {/* Area Group Header */}
                      <div className="flex items-center justify-between mb-5 pb-2 border-b border-stroke/40">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/30" />
                          <h4 className="text-lg md:text-xl font-display font-medium text-text-primary">
                            Area {group.area}
                          </h4>
                          <span className="text-xs text-muted font-light">
                            ({group.items.length} Unit)
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedArea(group.area)}
                          className="text-xs text-muted hover:text-text-primary transition-colors font-medium flex items-center gap-1"
                        >
                          Fokus Area →
                        </button>
                      </div>

                      {/* Area Group Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
                        {group.items.map((project, index) => (
                          <PropertyCard 
                            key={project.id || index}
                            project={project}
                            index={index}
                            onPropertyClick={onPropertyClick}
                            isHot={Boolean(project.availableRooms && project.availableRooms > 0)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Specific Selected Area View */
                <div>
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-stroke/40 text-left">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <h4 className="text-lg md:text-xl font-display font-medium text-text-primary">
                        Menampilkan Unit di Area: <span className="text-emerald-400 font-semibold">{selectedArea}</span>
                      </h4>
                      <span className="text-xs text-muted">
                        ({areaFilteredProperties.length} Unit)
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedArea('all')}
                      className="text-xs text-muted hover:text-text-primary transition-colors font-medium"
                    >
                      Lihat Semua Area
                    </button>
                  </div>

                  {areaFilteredProperties.length === 0 ? (
                    <div className="py-16 text-center text-muted">
                      <p className="text-sm">Tidak ada ruangan di area {selectedArea} yang cocok dengan filter.</p>
                      <button
                        onClick={() => setSelectedArea('all')}
                        className="mt-3 text-xs text-emerald-400 underline"
                      >
                        Kembali ke Semua Area
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7">
                      {areaFilteredProperties.map((project, index) => (
                        <PropertyCard 
                          key={project.id || index}
                          project={project}
                          index={index}
                          onPropertyClick={onPropertyClick}
                          isHot={Boolean(project.availableRooms && project.availableRooms > 0)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </section>
  );
};
