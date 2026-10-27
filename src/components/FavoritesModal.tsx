import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MapPin, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Property } from '../api';
import { slugify } from '../api';
import { useFavorites } from '../utils/favorites';
import { getPropertyAreaInfo } from '../utils/areaHierarchy';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  onPropertyClick?: (id: number, title: string) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  properties,
  onPropertyClick,
}) => {
  const navigate = useNavigate();
  const { favoriteIds, toggle } = useFavorites();

  const favoriteProperties = useMemo(() => {
    return properties.filter((p) => p.id && favoriteIds.includes(Number(p.id)));
  }, [properties, favoriteIds]);

  const handleSelect = (id: number, title: string) => {
    onClose();
    if (onPropertyClick) {
      onPropertyClick(id, title);
    } else {
      navigate(`/property/${id}-${slugify(title)}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2.5 pb-[calc(4.85rem+env(safe-area-inset-bottom,0px))] sm:p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal Content - Floats neatly above MobileBottomNav */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-md max-h-[calc(78vh-4.85rem)] sm:max-h-[85vh] bg-[#0d111a] border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col z-10 text-white pointer-events-auto"
          >
            {/* Mobile pull handle */}
            <div className="sm:hidden w-10 h-1 rounded-full bg-slate-600/70 mx-auto mt-2 -mb-1 shrink-0" />

            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-surface/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Heart size={18} className="fill-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Kos Favorit Saya
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                      {favoriteProperties.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Daftar kos yang kamu simpan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {favoriteProperties.length === 0 ? (
                <div className="py-12 px-4 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-3 border border-white/10">
                    <Heart size={28} />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Belum Ada Kos Favorit</h4>
                  <p className="text-xs text-slate-400 max-w-xs mb-5">
                    Tandai kos yang kamu sukai dengan menekan ikon hati agar mudah dilihat kembali.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/katalog');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all"
                  >
                    Jelajahi Semua Kos
                  </button>
                </div>
              ) : (
                favoriteProperties.map((prop) => {
                  const areaInfo = getPropertyAreaInfo(prop);
                  return (
                    <div
                      key={prop.id}
                      onClick={() => prop.id && handleSelect(prop.id, prop.title)}
                      className="group relative flex gap-3 p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-amber-400/40 transition-all cursor-pointer shadow-sm"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-black/40">
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-black/75 text-emerald-400">
                          {prop.category || 'Campur'}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-medium text-amber-400 flex items-center gap-1 truncate">
                              <MapPin size={10} />
                              {areaInfo.district}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (prop.id) toggle(prop.id);
                              }}
                              className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                              title="Hapus dari favorit"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-300 line-clamp-1 mt-0.5">
                            {prop.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                            {prop.facilities && prop.facilities.length > 0
                              ? prop.facilities.slice(0, 3).join(' • ')
                              : 'WiFi • AC • Kamar Mandi Dalam'}
                          </p>
                        </div>

                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-xs font-black text-amber-400">
                            {prop.priceRange || prop.price}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 flex items-center gap-0.5 group-hover:text-amber-300 transition-colors">
                            Lihat <ArrowRight size={10} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
