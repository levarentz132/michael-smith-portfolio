import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  MapPin,
  Heart,
  Building2,
  Sparkles,
  ArrowUp,
  SlidersHorizontal,
  Gift,
  CheckCircle2,
  ShieldCheck,
  Star,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Property, WebsiteSettings } from '../api';
import { fetchProperties, fetchBanners, slugify } from '../api';
import { useFavorites } from '../utils/favorites';
import {
  getPropertyAreaInfo,
  propertyMatchesArea,
  buildDynamicAreaList,
} from '../utils/areaHierarchy';

interface MobileAppHomeProps {
  settings?: WebsiteSettings | null;
  onOpenLiveChat: () => void;
  onOpenFavorites: () => void;
  onOpenPortal: () => void;
}

export const MobileAppHome: React.FC<MobileAppHomeProps> = ({
  settings,
  onOpenLiveChat,
  onOpenFavorites,
  onOpenPortal,
}) => {
  const navigate = useNavigate();
  const { isFavorited, toggle: toggleFav, favoritesCount } = useFavorites();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Semua Area');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'campur' | 'putri' | 'putra' | 'apartment'>('all');
  const [isAreaPickerOpen, setIsAreaPickerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Flash Sale Countdown Timer (Simulates dynamic 28-day promo ticker)
  const [timeLeft, setTimeLeft] = useState({
    days: 28,
    hours: 12,
    minutes: 39,
    seconds: 9,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 380) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load properties and banners
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [propsData, bannerConfig] = await Promise.all([
          fetchProperties().catch(() => []),
          fetchBanners().catch(() => null),
        ]);
        if (isMounted) {
          setProperties(Array.isArray(propsData) ? propsData : []);
          if (bannerConfig?.banners && bannerConfig.banners.length > 0) {
            setBanners(bannerConfig.banners);
          } else {
            // Default promotional slides
            setBanners([
              {
                id: '1',
                image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
                title: 'Diskon Sewa Spesial Anak Kos!',
                eyebrow: 'Promo Ngebut',
                description: 'Hemat hingga Rp 300.000 untuk sewa 3 bulan pertama.',
              },
              {
                id: '2',
                image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
                title: 'Apartemen Modern Siap Huni',
                eyebrow: 'Eksklusif',
                description: 'Lokasi strategis dekat halte busway & stasiun MRT.',
              },
              {
                id: '3',
                image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80',
                title: 'Fasilitas Lengkap: WiFi, AC, Water Heater',
                eyebrow: 'All In One',
                description: 'Tinggal bawa koper, semua sudah tersedia.',
              },
            ]);
          }
        }
      } catch (e) {
        console.error('Failed to load mobile app home data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Banner autoplay
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Area options
  const areaOptions = useMemo(() => {
    return buildDynamicAreaList(properties);
  }, [properties]);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (selectedArea !== 'Semua Area') {
        if (!propertyMatchesArea(p, selectedArea)) return false;
      }
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'apartment' && p.type !== 'apartment') return false;
        if (selectedCategory === 'putri' && !p.category.toLowerCase().includes('putri')) return false;
        if (selectedCategory === 'putra' && !p.category.toLowerCase().includes('putra')) return false;
        if (selectedCategory === 'campur' && !p.category.toLowerCase().includes('campur')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchLoc = (p.location || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLoc) return false;
      }
      return true;
    });
  }, [properties, selectedArea, selectedCategory, searchQuery]);

  // Featured promo list (properties with promo or discounts)
  const promoProperties = useMemo(() => {
    const withPromo = properties.filter((p) => p.promoPrice || p.promoLabel);
    return withPromo.length > 0 ? withPromo : properties.slice(0, 4);
  }, [properties]);

  const handleCardClick = (p: Property) => {
    if (!p.id) return;
    navigate(`/property/${p.id}-${slugify(p.title)}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="md:hidden min-h-screen bg-[#07090e] text-white pb-24 selection:bg-amber-500 selection:text-black">
      {/* 1. STICKY TOP APP BAR (Mamikos Style) */}
      <header className="sticky top-0 z-40 bg-[#07090e]/95 backdrop-blur-xl border-b border-white/[0.08] px-3.5 pt-3 pb-2.5 shadow-md">
        {/* Top Mascot / Logo Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0d121f] border border-amber-500/40 p-1 shadow-md shadow-black/50 flex items-center justify-center shrink-0">
              <img
                src={settings?.logo_image || '/logo.png'}
                alt="HighlanderStay"
                className="w-full h-full object-contain rounded-[8px]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/favicon.svg';
                }}
              />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                HighlanderStay
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-black uppercase">
                  App
                </span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5">
                #TinggalNyaman Cari & Sewa Kos Mudah
              </p>
            </div>
          </div>

          {/* Action Icons: Notification Bell & Favorites Heart */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenFavorites}
              className="relative p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-all active:scale-95"
              aria-label="Kos Favorit"
            >
              <Heart size={18} className={favoritesCount > 0 ? 'text-rose-400 fill-rose-400' : ''} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow">
                  {favoritesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-all active:scale-95"
              aria-label="Notifikasi"
            >
              <Bell size={18} />
              <span className="absolute 1.5 top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse ring-2 ring-[#07090e]" />
            </button>
          </div>
        </div>

        {/* Search Bar Input (Exact Mamikos Floating Box) */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search size={17} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mau cari kos di mana?"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white/[0.09] transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Playstation / Category Filter Button (Matching reference icon) */}
          <button
            type="button"
            onClick={() => setIsAreaPickerOpen(true)}
            className="flex items-center justify-center p-2.5 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-500/10 border border-amber-400/40 text-amber-300 active:scale-95 transition-all shadow-sm shrink-0"
            title="Filter Kota & Area"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* City Dropdown Filter Bar */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.05]">
          <button
            type="button"
            onClick={() => setIsAreaPickerOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-300 transition-colors py-0.5 active:scale-95"
          >
            <MapPin size={13} className="text-amber-400" />
            <span className="truncate max-w-[190px]">{selectedArea}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          <span className="text-[10px] text-slate-400 font-medium">
            {filteredProperties.length} Properti Tersedia
          </span>
        </div>
      </header>

      {/* 2. PROMO NGEBUT COUNTDOWN TICKER (Screenshot 3 Reference) */}
      <div
        onClick={() => {
          setSelectedCategory('all');
          const promoEl = document.getElementById('promo-ngebut-section');
          if (promoEl) promoEl.scrollIntoView({ behavior: 'smooth' });
        }}
        className="mx-3 mt-3 p-2.5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-purple-950/70 to-slate-900 border border-rose-500/30 flex items-center justify-between gap-2 shadow-lg cursor-pointer active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
            <Zap size={11} className="fill-white" />
            PROMO NGEBUT
          </div>

          {/* Countdown Boxes */}
          <div className="flex items-center gap-1 text-[11px] font-black text-rose-300">
            <span className="px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-500/40 text-white font-mono">
              {timeLeft.days} hari
            </span>
            <span className="text-rose-400">:</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-500/40 text-white font-mono">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-rose-400">:</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-500/40 text-white font-mono">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-rose-400">:</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-500/40 text-white font-mono">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        <ChevronRight size={16} className="text-rose-400 shrink-0" />
      </div>

      {/* 3. HERO QUICK SHORTCUTS & CATEGORIES (Screenshot 2 Reference) */}
      <section className="px-3 mt-3">
        {/* Horizontal Category Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Semua Kos' },
            { id: 'campur', label: 'Campur' },
            { id: 'putri', label: 'Putri' },
            { id: 'putra', label: 'Putra' },
            { id: 'apartment', label: 'Apartemen' },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/30'
                    : 'bg-white/[0.06] text-slate-300 border border-white/10 hover:border-white/20'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Quick Shortcut Row: "Atau mau cari yang lain? Apartemen >" */}
        <div
          onClick={() => setSelectedCategory('apartment')}
          className="mt-3 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between cursor-pointer hover:bg-white/[0.07] active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Building2 size={17} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Atau mau cari yang lain?</p>
              <p className="text-xs font-bold text-white">Sewa Apartemen Premium</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </div>

        {/* Owner / Mitra Banner: "Anda Pemilik Properti? [Masuk di sini]" */}
        <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-emerald-900/60 via-emerald-800/40 to-slate-900 border border-emerald-500/40 flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-white truncate">
              Anda Pemilik Properti?
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenPortal}
            className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black uppercase tracking-wider shadow active:scale-95 transition-all shrink-0"
          >
            Masuk di sini
          </button>
        </div>
      </section>

      {/* 4. BANNER CAROUSEL (Screenshot 2 Reference) */}
      {banners.length > 0 && (
        <section className="px-3 mt-3.5">
          <div className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-black/60 border border-white/10 shadow-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBannerIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full cursor-pointer"
                onClick={() => navigate('/katalog')}
              >
                <img
                  src={banners[activeBannerIdx]?.image}
                  alt={banners[activeBannerIdx]?.title || 'Promo Banner'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3">
                  {banners[activeBannerIdx]?.eyebrow && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-400">
                      {banners[activeBannerIdx].eyebrow}
                    </span>
                  )}
                  <h3 className="text-xs sm:text-sm font-black text-white line-clamp-1">
                    {banners[activeBannerIdx]?.title}
                  </h3>
                  {banners[activeBannerIdx]?.description && (
                    <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                      {banners[activeBannerIdx].description}
                    </p>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dot Indicators */}
            <div className="absolute bottom-2 right-3 z-10 flex items-center gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeBannerIdx ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. PURPLE PROMO SECTION (Screenshot 3 Reference: PROMO NGEBUT DEALS) */}
      <section id="promo-ngebut-section" className="px-3 mt-5">
        <div className="rounded-3xl bg-gradient-to-br from-[#2f1155] via-[#1b0d36] to-[#0c051a] border border-purple-500/30 p-3.5 shadow-xl overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">Promo Ngebut Spesial</h3>
                <p className="text-[10px] text-purple-300">Potongan harga eksklusif bulan ini</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/katalog')}
              className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 active:scale-95"
            >
              Lihat Semua <ChevronRight size={13} />
            </button>
          </div>

          {/* Horizontal Card Scroll for Promo Items */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {promoProperties.map((prop) => {
              const areaInfo = getPropertyAreaInfo(prop);
              const fav = prop.id ? isFavorited(prop.id) : false;
              const roomsCount = prop.availableRooms ?? 2;

              return (
                <div
                  key={prop.id}
                  onClick={() => handleCardClick(prop)}
                  className="snap-start shrink-0 w-[240px] rounded-2xl bg-white/[0.07] border border-white/10 hover:border-purple-400/50 overflow-hidden cursor-pointer shadow-lg active:scale-[0.98] transition-all flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[16/10] bg-black/50 overflow-hidden">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80';
                      }}
                    />

                    {/* Top verified & fav */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-black/80 text-amber-400 border border-amber-400/30 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Terverifikasi
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (prop.id) toggleFav(prop.id);
                        }}
                        className="pointer-events-auto p-1.5 rounded-full bg-black/70 hover:bg-black text-white hover:text-rose-400 transition-colors shadow"
                      >
                        <Heart size={14} className={fav ? 'text-rose-500 fill-rose-500' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Body Content (Exact Mamikos Detail format) */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Gender Badge + Urgency */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-white/10 text-slate-200">
                          {prop.category || 'Campur'}
                        </span>
                        <span className="text-[10px] font-black text-rose-400">
                          Sisa {roomsCount} Kamar
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {prop.title}
                      </h4>

                      {/* Location */}
                      <p className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-amber-400 shrink-0" />
                        <span className="truncate">{areaInfo.district}</span>
                      </p>

                      {/* Facilities dot string */}
                      <p className="text-[9px] text-slate-400 line-clamp-1 mt-1">
                        {prop.facilities && prop.facilities.length > 0
                          ? prop.facilities.slice(0, 3).join(' · ')
                          : 'K. Mandi Dalam · WiFi · AC · Kloset'}
                      </p>
                    </div>

                    {/* Rating & Discount */}
                    <div className="mt-2 pt-2 border-t border-white/[0.08]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="flex items-center gap-0.5 text-[10px] font-black text-amber-300">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          {prop.rating || '4.8'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                          <Zap size={9} /> Diskon Spesial
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-white">
                          {prop.priceRange || prop.price}
                        </span>
                        <span className="text-[9px] text-slate-400">/bln</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. MAIN FEED: "Pilihan Kos Baru Buatmu >" (Screenshot 1 Reference) */}
      <section className="px-3 mt-6">
        {/* Section Header */}
        <div className="flex items-baseline justify-between mb-1">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-1">
              Pilihan Kos Baru Buatmu
              <ChevronRight size={16} className="text-slate-400" />
            </h3>
            <p className="text-[11px] text-slate-400">
              Yuk cek kos yang baru siap huni di HighlanderStay. Siapa cepat dia dapat!
            </p>
          </div>
        </div>

        {/* 2-Column Responsive Card Grid (Mamikos Style) */}
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-white/[0.04] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl bg-white/[0.03] border border-white/5 mt-3">
            <Building2 size={32} className="mx-auto text-slate-500 mb-2" />
            <p className="text-xs font-bold text-white">Tidak ada kos yang cocok</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Coba ganti kata kunci atau pilih area lain
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedArea('Semua Area');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-bold text-xs"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {filteredProperties.map((prop) => {
              const areaInfo = getPropertyAreaInfo(prop);
              const fav = prop.id ? isFavorited(prop.id) : false;
              const roomsCount = prop.availableRooms ?? 2;

              return (
                <div
                  key={prop.id}
                  onClick={() => handleCardClick(prop)}
                  className="rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:border-amber-400/40 overflow-hidden cursor-pointer shadow-sm active:scale-[0.98] transition-all flex flex-col justify-between"
                >
                  {/* Photo with badges */}
                  <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
                    <img
                      src={prop.image}
                      alt={prop.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80';
                      }}
                    />

                    {/* Top verified & fav button */}
                    <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center shadow text-[9px] font-black" title="Highlander Verified">
                        ★
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (prop.id) toggleFav(prop.id);
                        }}
                        className="p-1 rounded-full bg-black/60 hover:bg-black text-white hover:text-rose-400 transition-colors shadow"
                        aria-label="Simpan ke favorit"
                      >
                        <Heart size={13} className={fav ? 'text-rose-500 fill-rose-500' : ''} />
                      </button>
                    </div>

                    {/* Bottom Gender & Sisa Kamar */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[8px] font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-black/75 text-white">
                        {prop.category || 'Campur'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-600/90 text-white font-black">
                        Sisa {roomsCount}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-2 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Title */}
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {prop.title}
                      </h4>

                      {/* Location Area */}
                      <p className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-amber-400 shrink-0" />
                        <span className="truncate">{areaInfo.district}</span>
                      </p>

                      {/* Facilities dot string */}
                      <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                        {prop.facilities && prop.facilities.length > 0
                          ? prop.facilities.slice(0, 2).join(' · ')
                          : 'WiFi · AC · K. Mandi'}
                      </p>
                    </div>

                    {/* Promo tag & Price */}
                    <div className="mt-2 pt-1.5 border-t border-white/[0.06]">
                      <div className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 mb-0.5 truncate">
                        <Gift size={10} className="shrink-0" />
                        Diskon Sewa Bulanan
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-black text-amber-400 truncate">
                          {prop.priceRange || prop.price.replace('Rp.', 'Rp')}
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0">/bln</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 7. FLOATING "KEMBALI KE ATAS" PILL (Screenshot 1 Reference) */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40"
          >
            <button
              type="button"
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-black font-extrabold text-xs shadow-2xl shadow-black/80 hover:bg-amber-400 active:scale-95 transition-all border border-black/10"
            >
              <ArrowUp size={14} className="stroke-[2.5]" />
              Kembali ke atas
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. CITY & AREA PICKER BOTTOM SHEET */}
      <AnimatePresence>
        {isAreaPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAreaPickerOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-h-[75vh] bg-[#0c101a] border-t border-slate-700 rounded-t-3xl p-4 overflow-hidden flex flex-col z-10"
            >
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin size={16} className="text-amber-400" />
                  Pilih Kota / Area
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAreaPickerOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  Selesai
                </button>
              </div>

              {/* Area Options List */}
              <div className="overflow-y-auto space-y-1.5 py-1">
                {areaOptions.map((areaName) => {
                  const isSelected = selectedArea === areaName;
                  return (
                    <button
                      key={areaName}
                      type="button"
                      onClick={() => {
                        setSelectedArea(areaName);
                        setIsAreaPickerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                          : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>{areaName}</span>
                      {isSelected && <CheckCircle2 size={16} className="text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. NOTIFICATION SHEET */}
      <AnimatePresence>
        {notificationsOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-h-[70vh] bg-[#0c101a] border-t border-slate-700 rounded-t-3xl p-4 overflow-hidden flex flex-col z-10"
            >
              <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell size={16} className="text-amber-400" />
                  Pemberitahuan & Promo
                </h3>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  Tutup
                </button>
              </div>

              <div className="space-y-2.5 overflow-y-auto">
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Promo Berlangsung</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">Flash Sale Kamar Jakarta Barat</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Dapatkan potongan harga sewa untuk pemesanan bulan ini. Tersedia tipe Deluxe dan Executive!
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">Info Fasilitas</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">High-Speed WiFi Terpasang</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Seluruh properti Highlanderstay kini didukung koneksi internet dedicated 100Mbps.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    onOpenLiveChat();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                >
                  Tanya Admin via Live Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compact App Footer */}
      <footer className="mt-8 px-4 text-center text-slate-500 text-[11px]">
        <p className="font-semibold text-slate-400">HighlanderStay Mobile App</p>
        <p className="text-[10px] mt-0.5">Hunian Kost & Apartemen Modern di Jakarta</p>
        <button
          type="button"
          onClick={onOpenLiveChat}
          className="mt-2 text-[10px] text-amber-400/90 underline hover:text-amber-300"
        >
          Butuh Bantuan? Hubungi Customer Service
        </button>
      </footer>
    </div>
  );
};
