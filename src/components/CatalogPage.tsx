import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  MapPin, 
  ArrowLeft, 
  Flame,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { fetchProperties, slugify } from '../api';
import type { Property, WebsiteSettings } from '../api';
import { useSEO } from '../hooks/useSEO';

interface CatalogPageProps {
  settings?: WebsiteSettings | null;
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

export const CatalogPage: React.FC<CatalogPageProps> = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('Semua Area');
  const [typeFilter, setTypeFilter] = useState<'all' | 'kos' | 'apartment'>('all');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);

  useSEO({
    title: 'Katalog Kamar Kos & Apartemen Siap Huni | Highlanderstay',
    description: 'Jelajahi seluruh pilihan kamar kos eksekutif dan apartemen siap huni di Kebon Jeruk, Grogol, Kemayoran, Cengkareng, dan Jakarta Barat.',
    keywords: 'katalog kos, kamar kos jakarta, sewa apartemen harian bulanan, highlanderstay',
    canonicalUrl: 'https://highlanderstay.com/katalog',
    enabled: true
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchProperties();
        if (isMounted) {
          setProperties(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load catalog properties:', err);
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

  const filteredList = properties.filter((p) => {
    if (selectedArea !== 'Semua Area') {
      const area = getPropertyArea(p);
      if (area.toLowerCase() !== selectedArea.toLowerCase()) return false;
    }
    if (typeFilter !== 'all') {
      if (typeFilter === 'apartment' && p.type !== 'apartment') return false;
      if (typeFilter === 'kos' && p.type === 'apartment') return false;
    }
    if (onlyAvailable) {
      if (!p.availableRooms || p.availableRooms <= 0) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchLoc = (p.location || '').toLowerCase().includes(q);
      const matchArea = getPropertyArea(p).toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchArea) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-bg text-text-primary pb-28 pt-4 sm:pt-6 px-3 sm:px-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-3 mb-6 bg-surface/90 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary hover:text-amber-400 transition-all shrink-0 active:scale-95"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold font-display text-text-primary flex items-center gap-2 truncate">
              <Building2 size={19} className="text-amber-400 shrink-0" />
              <span>Katalog Kamar & Unit</span>
            </h1>
            <p className="text-[11px] text-muted truncate">
              {filteredList.length} Properti Siap Huni
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/map"
            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow"
          >
            <MapPin size={14} />
            <span className="hidden xs:inline">Lihat di Peta</span>
          </Link>
        </div>
      </header>

      {/* Search & Filtering Controls */}
      <div className="space-y-3 mb-6">
        {/* Search Bar */}
        <div className="relative flex items-center bg-surface/95 border border-white/15 rounded-2xl px-3.5 py-2.5 shadow-lg focus-within:border-amber-400">
          <Search size={17} className="text-amber-400 shrink-0 mr-2.5" />
          <input
            type="text"
            placeholder="Cari nama properti, area, kampus, atau jalan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-muted/70 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-muted hover:text-rose-400 font-bold px-2 py-1 rounded-lg"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Filter Badges & Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Area Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 max-w-full">
            {AREA_DISPLAY_ORDER.map((area) => {
              const active = selectedArea === area;
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => setSelectedArea(area)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                    active
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-muted hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {area}
                </button>
              );
            })}
          </div>

          {/* Type Filter & Quick Hot Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  typeFilter === 'all' ? 'bg-amber-400 text-slate-950 shadow' : 'text-muted hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('kos')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  typeFilter === 'kos' ? 'bg-amber-400 text-slate-950 shadow' : 'text-muted hover:text-white'
                }`}
              >
                Kost
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('apartment')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  typeFilter === 'apartment' ? 'bg-amber-400 text-slate-950 shadow' : 'text-muted hover:text-white'
                }`}
              >
                Apartemen
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border ${
                onlyAvailable
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-white/5 text-muted border-white/10 hover:text-white'
              }`}
            >
              <Flame size={14} className={onlyAvailable ? 'text-emerald-400' : ''} />
              <span className="hidden xs:inline">Hanya</span> Ready
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted">
          <RefreshCw size={28} className="text-amber-400 animate-spin" />
          <p className="text-sm font-medium">Memuat katalog properti...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 text-center bg-surface/50 border border-white/10 rounded-3xl p-6">
          <Building2 size={40} className="text-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-text-primary mb-1">Tidak Ada Properti Ditemukan</h3>
          <p className="text-xs text-muted mb-4 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau pilih area lain di filter atas.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedArea('Semua Area');
              setOnlyAvailable(false);
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold shadow active:scale-95"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-5">
          {filteredList.map((prop, idx) => {
            const hasRooms = Boolean(prop.availableRooms && prop.availableRooms > 0);
            return (
              <motion.div
                key={prop.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                onClick={() => navigate(`/property/${prop.id}-${slugify(prop.title)}`)}
                className="group bg-surface/90 hover:bg-surface border border-white/10 hover:border-amber-400/50 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-slate-950">
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1">
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-amber-300 text-[8px] sm:text-[10px] font-black uppercase tracking-wider">
                      {getPropertyArea(prop)}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <span
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider shadow-md ${
                        hasRooms ? 'bg-emerald-400 text-slate-950' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {prop.availabilityStatus || (hasRooms ? `Ready ${prop.availableRooms}` : 'Full')}
                    </span>
                  </div>

                  {/* Rating / Category Pill */}
                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-medium text-slate-200 border border-white/10">
                    {prop.category}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="text-xs sm:text-base font-bold text-text-primary group-hover:text-amber-400 transition-colors line-clamp-1">
                      {prop.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted mt-0.5 sm:mt-1 flex items-center gap-1 line-clamp-1">
                      <MapPin size={11} className="text-amber-400/80 shrink-0" />
                      <span>{prop.location}</span>
                    </p>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-1.5 sm:pt-2 border-t border-white/10 flex items-center justify-between gap-1">
                    <div>
                      <span className="text-[8px] sm:text-[10px] text-muted block uppercase font-bold">Mulai</span>
                      <span className="text-xs sm:text-sm font-black text-amber-400">
                        {prop.priceRange || prop.price}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/property/${prop.id}-${slugify(prop.title)}`);
                      }}
                      className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1 shadow active:scale-95 transition-all shrink-0"
                    >
                      <span>Detail</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
