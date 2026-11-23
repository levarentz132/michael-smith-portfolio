import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  ArrowLeft,
  MapPin,
  Trash2,
  ArrowRight,
  Settings,
  Sparkles,
  Share2
} from 'lucide-react';
import type { Property, WebsiteSettings } from '../api';
import { fetchProperties, slugify } from '../api';
import { useFavorites } from '../utils/favorites';
import { getPropertyAreaInfo } from '../utils/areaHierarchy';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SocialLinks } from './SocialLinks';
import { useSEO } from '../hooks/useSEO';

export interface FavoritesPageProps {
  settings?: WebsiteSettings | null;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ settings }) => {
  const navigate = useNavigate();
  const { favoriteIds, toggle } = useFavorites();

  useSEO({
    title: 'Kamar Kos Favorit Saya | Highlanderstay',
    description: 'Daftar kamar kos dan apartemen yang Anda simpan sebagai favorit di Highlanderstay.',
    keywords: 'kos favorit, simpan kos, wishlist kamar kos, highlanderstay',
    canonicalUrl: 'https://highlanderstay.com/favorit',
    enabled: true
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadProps = async () => {
      try {
        const data = await fetchProperties();
        if (mounted && Array.isArray(data)) {
          setProperties(data);
        }
      } catch (err) {
        console.warn('Failed to fetch properties for favorites:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadProps();
    return () => {
      mounted = false;
    };
  }, []);

  const favoriteProperties = useMemo(() => {
    return properties.filter((p) => p.id && favoriteIds.includes(Number(p.id)));
  }, [properties, favoriteIds]);

  const formatPrice = (price?: number | string) => {
    if (!price) return 'Hubungi Kami';
    const num = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]+/g, '')) : price;
    if (isNaN(num)) return String(price);
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kamar Favorit Saya di Highlanderstay',
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan favorit berhasil disalin!');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-text-primary flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      <Navbar
        activeSection="favorit"
        onNavClick={(sec) => {
          if (sec === 'home') navigate('/');
          else if (sec === 'work' || sec === 'katalog') navigate('/katalog');
          else if (sec === 'map') navigate('/map');
          else if (sec === 'resort') navigate('/resort');
          else if (sec === 'cart') navigate('/cart');
          else if (sec === 'akun') navigate('/akun');
          else navigate('/');
        }}
        session={null}
        onLogout={() => {}}
        onLoginClick={() => navigate('/akun')}
        onProfileClick={() => navigate('/akun')}
        onCartClick={() => navigate('/cart')}
        settings={settings}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto pt-20 sm:pt-24 md:pt-28 pb-28 px-3.5 sm:px-6">
        {/* Navigation Breadcrumb & Back Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
                <span>Kamar Kos Favorit</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Heart size={11} className="fill-rose-500" />
                  <span>{favoriteProperties.length} Tersimpan</span>
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Daftar kamar dan apartemen impian yang Anda simpan untuk disewa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {favoriteProperties.length > 0 && (
              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                title="Bagikan Favorit"
              >
                <Share2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('hs-open-settings'))}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              title="Pengaturan"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>Memuat daftar favorit Anda...</span>
          </div>
        ) : favoriteProperties.length === 0 ? (
          <div className="p-8 sm:p-14 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 shadow-xl">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <Heart size={40} className="stroke-[1.5]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-white">Belum Ada Kamar Tersimpan</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Tandai kamar kos yang Anda sukai dengan menekan ikon hati agar tersimpan di halaman ini dan mudah dibandingkan sewaktu-waktu.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/katalog')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Jelajahi Katalog Kamar</span>
                <ArrowRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/map')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <MapPin size={13} className="text-amber-400" />
                <span>Lihat di Peta</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {favoriteProperties.map((prop) => {
                const areaInfo = getPropertyAreaInfo(prop);
                const coverImage = (prop as any).images?.[0] || prop.image || '/logo.png';
                const idSlug = `${prop.id}-${slugify(prop.title || 'kos')}`;

                return (
                  <div
                    key={prop.id}
                    className="p-3.5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between transition-all group overflow-hidden"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => navigate(`/property/${idSlug}`)}
                        className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 cursor-pointer mb-3"
                      >
                        <img
                          src={coverImage}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                        {/* Area badge */}
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white flex items-center gap-1">
                          <MapPin size={11} className="text-amber-400" />
                          <span>{areaInfo.district || areaInfo.city || prop.location || 'Jakarta'}</span>
                        </div>

                        {/* Unfavorite Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(Number(prop.id));
                          }}
                          className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-rose-500/80 backdrop-blur-md border border-white/10 text-rose-400 hover:text-white transition-all active:scale-90 cursor-pointer shadow-md"
                          title="Hapus dari Favorit"
                        >
                          <Heart size={15} className="fill-rose-500" />
                        </button>

                        {/* Price Tag Overlay */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-baseline justify-between text-white">
                          <div>
                            <span className="text-[10px] text-slate-300 font-medium block">Mulai dari</span>
                            <span className="text-sm font-black text-amber-400">
                              {formatPrice(prop.price)}
                            </span>
                            <span className="text-[10px] text-slate-300 ml-1">/ bln</span>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-1 px-1">
                        <h3
                          onClick={() => navigate(`/property/${idSlug}`)}
                          className="text-sm font-bold text-white hover:text-amber-400 transition-colors cursor-pointer truncate"
                          title={prop.title}
                        >
                          {prop.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          <span>{prop.location || areaInfo.fullAreaLabel || areaInfo.city}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 px-1">
                      <button
                        type="button"
                        onClick={() => toggle(Number(prop.id))}
                        className="px-2.5 py-1.5 rounded-xl hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                        <span className="text-[11px]">Hapus</span>
                      </button>

                      <Link
                        to={`/property/${idSlug}`}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-400/20 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span>Lihat Kamar</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Social Media Link Section */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <span>Ikuti Media Sosial Highlanderstay</span>
              </h3>
              <p className="text-xs text-slate-400">
                Dapatkan promo sewa terbaru, room tour video, dan tips hunian nyaman
              </p>
            </div>
          </div>

          <SocialLinks settings={settings} variant="cards" />
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
};

