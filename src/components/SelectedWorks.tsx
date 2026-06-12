import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProperties } from '../api';
import type { Property } from '../api';
import { gsap } from 'gsap';
import { SlidersHorizontal } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SelectedWorksProps {
  onPropertyClick: (id: number, title: string) => void;
  initialBookingFilter?: 'all' | 'monthly' | 'transit';
}

export const SelectedWorks: React.FC<SelectedWorksProps> = ({ onPropertyClick, initialBookingFilter }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filter, setFilter] = useState<'all' | 'kos' | 'apartment'>('all');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'monthly' | 'transit'>('all');

  useEffect(() => {
    if (initialBookingFilter) {
      setBookingFilter(initialBookingFilter);
    }
  }, [initialBookingFilter]);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const activeFiltersCount = 
    (filter !== 'all' ? 1 : 0) + 
    (bookingFilter !== 'all' ? 1 : 0) + 
    (locationFilter !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setFilter('all');
    setBookingFilter('all');
    setLocationFilter('all');
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
  }, [loading, properties, filter, bookingFilter, locationFilter, searchTerm]);

  const uniqueLocations = ['all', ...Array.from(new Set(properties.map(p => p.location)))];

  const filteredProperties = properties.filter(prop => {
    const matchesType = filter === 'all' ? true : prop.type === filter;
    const matchesLocation = locationFilter === 'all' ? true : prop.location.toLowerCase() === locationFilter.toLowerCase();
    const matchesBooking = 
      bookingFilter === 'all' ? true : 
      bookingFilter === 'transit' ? !!(prop.transit3h || prop.transit6h || prop.transit12h || prop.transit24h) : 
      bookingFilter === 'monthly' ? true : // All properties support monthly rent
      true;
    const matchesSearch = searchTerm === '' ? true :
      prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prop.description && prop.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesLocation && matchesBooking && matchesSearch;
  });





  return (
    <section id="work" className="bg-bg py-16 md:py-24 select-none">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-12 gap-8">
          <div className="flex flex-col items-start text-left max-w-lg">
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
              Temukan kamar dan apartemen premium yang indah dirancang untuk kenyamanan dan gaya hidup modern Anda.
            </p>
            {/* Search Bar */}
            <div className="w-full max-w-md mt-6">
              <div className="relative group">
                <input 
                  type="text"
                  placeholder="Cari ruangan atau lokasi..."
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

          {/* Desktop Compact Filters Toggle & Summary */}
          <div className="hidden md:flex flex-col gap-3.5 items-end shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-stroke bg-surface hover:bg-bg/40 text-xs font-semibold uppercase tracking-wider text-text-primary active:scale-[0.98] transition-all duration-300 shadow-sm"
              >
                <SlidersHorizontal size={14} className="text-muted" />
                <span>Filter Ruangan</span>
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
                {locationFilter !== 'all' && (
                  <span className="text-[9px] font-semibold uppercase bg-stroke/50 text-text-primary px-2.5 py-1 rounded-full border border-stroke flex items-center gap-1">
                    {locationFilter}
                    <button onClick={() => setLocationFilter('all')} className="hover:text-rose-400 font-bold ml-1">✕</button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Toggle & Summary */}
        <div className="flex flex-col gap-3 w-full md:hidden mb-8">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-stroke bg-surface text-xs font-semibold uppercase tracking-wider text-text-primary active:scale-[0.98] transition-all shadow-sm"
            >
              <SlidersHorizontal size={14} className="text-muted" />
              <span>Filter Ruangan</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-text-primary text-bg flex items-center justify-center text-[9px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-300"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Active Filter Summary Tags (Mobile) */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
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
              {locationFilter !== 'all' && (
                <span className="text-[9px] font-semibold uppercase bg-stroke/50 text-text-primary px-2.5 py-1 rounded-full border border-stroke flex items-center gap-1">
                  {locationFilter}
                  <button onClick={() => setLocationFilter('all')} className="hover:text-rose-400 font-bold ml-1">✕</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Filter Panel (Shared for Mobile and Desktop) */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden w-full bg-surface/30 border border-stroke rounded-[32px] p-5 md:p-8 flex flex-col md:grid md:grid-cols-3 gap-5 md:gap-8 mb-8 shadow-lg text-left backdrop-blur-md"
            >
              {/* Category Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Tipe Hunian:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'kos', 'apartment'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilter(type);
                        setLocationFilter('all');
                      }}
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

              {/* Location Filter */}
              {uniqueLocations.length > 1 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-muted uppercase tracking-widest font-bold">Lokasi Area:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueLocations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocationFilter(loc)}
                        className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-4 py-2 transition-all duration-200 ${
                          locationFilter === loc 
                            ? 'text-bg bg-text-primary' 
                            : 'text-text-primary border border-stroke bg-bg/40 hover:bg-stroke/40'
                        }`}
                      >
                        {loc === 'all' ? 'Semua Area' : loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <div className="w-6 h-6 rounded-full border-2 border-stroke border-t-text-primary animate-spin mb-2" />
            <span className="text-[10px] uppercase tracking-wider">Memuat ruangan...</span>
          </div>
        ) : (
          /* Grid layout: 2-column flex-grid on mobile, bento grid on desktop */
          <div>
            <motion.div 
              layout
              className="grid grid-cols-2 md:grid-cols-12 gap-3.5 md:gap-8 w-full"
            >
              <AnimatePresence mode="popLayout">
                {filteredProperties.map((project, index) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    key={project.id || index}
                    onClick={() => project.id && onPropertyClick(project.id, project.title)}
                    className="group relative overflow-hidden bg-surface border border-stroke rounded-2xl md:rounded-3xl cursor-pointer w-full col-span-2 md:col-span-6 lg:col-span-4 aspect-[4/3]"
                  >
                    {/* Image with scale transition */}
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="absolute inset-0 w-full h-full object-contain bg-black/40 transition-transform duration-700 ease-out group-hover:scale-110"
                    />

                    {/* Glassmorphic border light effect on hover */}
                    <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-2xl md:rounded-3xl transition-colors duration-500 pointer-events-none z-20" />

                    {/* Top Badge Overlay (Price & Rating) */}
                    <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 flex justify-between items-center z-10 transition-all duration-300 group-hover:opacity-0 group-hover:scale-95">
                      <span className="bg-bg/85 backdrop-blur-md text-[9px] md:text-[11px] font-bold text-text-primary px-2 py-1 md:px-3 md:py-1.5 rounded-full border border-white/5 flex items-center gap-1 md:gap-1.5">
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
                          <span>{project.price.replace('Rp.', 'Rp').replace('/ month', '')}</span>
                        )}
                      </span>
                      <span className="bg-bg/85 backdrop-blur-md text-[9px] md:text-[11px] font-bold text-text-primary px-1.5 py-1 md:px-2.5 md:py-1.5 rounded-full border border-white/5 flex items-center gap-0.5 md:gap-1">
                        {project.rating}
                      </span>
                    </div>

                    {/* Hover Details Mask */}
                    <div 
                      className="absolute inset-0 bg-bg/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-md flex flex-col justify-between p-8 z-10"
                    >
                      {/* Category info (Slides Down) */}
                      <div className="flex flex-col gap-1 transition-all duration-500 ease-out transform -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <span className="text-xs text-muted uppercase tracking-[0.2em] font-semibold">{project.category}</span>
                        <span className="text-[10px] text-muted tracking-wider">{project.location}</span>
                      </div>
                      
                      {/* Center Hover Label Pill (Spring Scales up) */}
                      <div className="flex justify-center items-center flex-1 transition-all duration-500 ease-out transform scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 delay-75">
                        <div className="relative p-[1px] rounded-full overflow-hidden animate-gradient-shift accent-gradient shadow-xl">
                          <div className="bg-white rounded-full px-6 py-3.5 flex items-center justify-center">
                            <span className="text-xs text-black font-semibold uppercase tracking-wider">
                              Pesan — <span className="font-display italic text-sm lowercase">{project.title}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom details row (Slides Up) */}
                      <div className="flex justify-between items-end border-t border-stroke/40 pt-4 transition-all duration-500 ease-out transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 delay-100">
                        <div className="flex flex-col text-left">
                          <span className="text-lg text-text-primary font-medium">{project.title}</span>
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
                        <span className="text-xs text-muted">0{index + 1}</span>
                      </div>
                    </div>

                    {/* Static overlay shown when NOT hovering (mobile friendly) */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-black/95 via-black/45 to-transparent flex justify-between items-end md:hidden group-hover:opacity-0 transition-opacity duration-300">
                      <div className="text-left min-w-0 flex-1">
                        <span className="text-[8px] md:text-[10px] text-white/60 uppercase tracking-widest block mb-0.5 truncate">{project.category}</span>
                        <span className="text-xs md:text-base text-white font-medium block truncate pr-1">{project.title}</span>
                        <span className="text-[9px] md:text-[11px] text-white/50 block mt-0.5 truncate pr-1">{project.location}</span>
                      </div>
                      <span className="text-[9px] md:text-xs text-white/40 shrink-0">0{index + 1}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

      </div>
    </section>
  );
};
