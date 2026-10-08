import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchBanners } from '../api';
import type { WebsiteSettings, BannerSlide, BannerConfig } from '../api';

interface BannerProps {
  onCtaClick: () => void;
  settings?: WebsiteSettings | null;
}

interface NormalizedSlide {
  id: string | number;
  image: string;
  title?: string;
  eyebrow?: string;
  description?: string;
  cta_text?: string;
  link?: string;
  badge?: string;
}

export const Banner: React.FC<BannerProps> = ({ onCtaClick, settings: propSettings }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [backendConfig, setBackendConfig] = useState<BannerConfig | null>(null);
  const navigate = useNavigate();

  // Load from backend if propSettings is null or to ensure latest backend data
  useEffect(() => {
    let isMounted = true;
    const loadBackendBanners = async () => {
      try {
        const data = await fetchBanners();
        if (isMounted) {
          setBackendConfig(data);
        }
      } catch (err) {
        console.warn('Failed to load backend banners:', err);
      }
    };

    loadBackendBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge prop settings with backend fetched config (backend config prioritized if present)
  const activeSettings = useMemo(() => {
    return {
      banner_enabled: backendConfig?.banner_enabled ?? propSettings?.banner_enabled ?? true,
      banner_autoplay_interval: backendConfig?.banner_autoplay_interval || propSettings?.banner_autoplay_interval || 5000,
      banner_eyebrow: backendConfig?.banner_eyebrow || propSettings?.banner_eyebrow || 'Promo Spesial',
      banner_title: backendConfig?.banner_title || propSettings?.banner_title || 'Diskon Early Bird 20%',
      banner_description: backendConfig?.banner_description || propSettings?.banner_description || 'Pesan ruang impian Anda bulan ini dan nikmati potongan harga eksklusif untuk 3 bulan pertama.',
      banner_cta: backendConfig?.banner_cta || propSettings?.banner_cta || 'Klaim Promo',
      banner_image: backendConfig?.banner_image || propSettings?.banner_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
      banners: (backendConfig?.banners && backendConfig.banners.length > 0) 
        ? backendConfig.banners 
        : (propSettings?.banners && propSettings.banners.length > 0 ? propSettings.banners : [])
    };
  }, [backendConfig, propSettings]);

  // Normalize slide list from backend
  const slides: NormalizedSlide[] = useMemo(() => {
    const rawBanners = activeSettings.banners;

    if (rawBanners && rawBanners.length > 0) {
      return rawBanners.map((item, idx) => {
        if (typeof item === 'string') {
          return {
            id: `slide-${idx + 1}`,
            image: item,
            eyebrow: activeSettings.banner_eyebrow,
            title: activeSettings.banner_title,
            description: activeSettings.banner_description,
            cta_text: activeSettings.banner_cta,
            link: ''
          };
        }
        const slideObj = item as BannerSlide;
        return {
          id: slideObj.id || `slide-${idx + 1}`,
          image: slideObj.image || activeSettings.banner_image,
          eyebrow: slideObj.eyebrow || activeSettings.banner_eyebrow,
          title: slideObj.title || activeSettings.banner_title,
          description: slideObj.description || activeSettings.banner_description,
          cta_text: slideObj.cta_text || activeSettings.banner_cta,
          link: slideObj.link || '',
          badge: slideObj.badge
        };
      });
    }

    // Default Fallback Slides from backend settings / premium imagery
    return [
      {
        id: 1,
        image: activeSettings.banner_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
        eyebrow: activeSettings.banner_eyebrow,
        title: activeSettings.banner_title,
        description: activeSettings.banner_description,
        cta_text: activeSettings.banner_cta
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80',
        eyebrow: 'Hunian Nyaman & Fleksibel',
        title: 'Sewa Bulanan / Tahunan Tanpa Ribet',
        description: 'Fasilitas lengkap dengan Wi-Fi cepat, kamar mandi dalam, dan akses strategis di pusat kota.',
        cta_text: 'Jelajahi Katalog'
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80',
        eyebrow: 'Co-Living Eksklusif',
        title: 'Komunitas & Keamanan 24 Jam Terjaga',
        description: 'Dilengkapi CCTV, smart card access, dan housekeeping berkala untuk kenyamanan istirahat Anda.',
        cta_text: 'Hubungi Kami'
      }
    ];
  }, [activeSettings]);

  // Autoplay loop using backend interval setting
  useEffect(() => {
    if (isHovered || slides.length <= 1) return;
    const intervalTime = Math.max(2000, Number(activeSettings.banner_autoplay_interval) || 5000);
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isHovered, slides.length, activeSettings.banner_autoplay_interval]);

  if (activeSettings.banner_enabled === false || activeSettings.banner_enabled === 'false') {
    return null;
  }

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const handleSlideAction = (slide: NormalizedSlide) => {
    if (slide.link) {
      if (slide.link.startsWith('http')) {
        window.open(slide.link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(slide.link);
      }
    } else {
      onCtaClick();
    }
  };

  const activeSlide = slides[currentSlide] || slides[0];

  return (
    <section className="bg-bg py-3 sm:py-6 md:py-10 select-none">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 md:px-10 lg:px-16">
        
        {/* Carousel Container */}
        <div 
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[36px] border border-stroke/80 bg-surface min-h-[200px] sm:min-h-[280px] md:min-h-[380px] lg:min-h-[420px] group shadow-2xl transition-all duration-300"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.id || currentSlide}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative w-full min-h-[200px] sm:min-h-[280px] md:min-h-[380px] lg:min-h-[420px] flex flex-col justify-end p-4 sm:p-7 md:p-12 cursor-pointer"
              onClick={() => handleSlideAction(activeSlide)}
            >
              {/* Background Graphic & Cover Image */}
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                <img 
                  src={activeSlide.image} 
                  alt={activeSlide.title || `Banner ${currentSlide + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="eager"
                />
                {/* Cinematic Gradient Overlays to guarantee readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg/95 via-bg/40 to-black/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/30 to-transparent" />
              </div>

              {/* Banner Text Content from Backend */}
              <div className="relative z-10 max-w-xl sm:max-w-2xl text-left space-y-1.5 sm:space-y-3">
                {/* Eyebrow Badge */}
                {activeSlide.eyebrow && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent text-[10px] sm:text-xs font-semibold tracking-wide backdrop-blur-md"
                  >
                    <Sparkles size={12} className="text-accent shrink-0 animate-pulse" />
                    <span>{activeSlide.eyebrow}</span>
                  </motion.div>
                )}

                {/* Banner Title */}
                {activeSlide.title && (
                  <motion.h2 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.45 }}
                    className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight leading-snug line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: activeSlide.title }}
                  />
                )}

                {/* Banner Description */}
                {activeSlide.description && (
                  <motion.p 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.45 }}
                    className="text-xs sm:text-sm md:text-base text-text-secondary line-clamp-2 font-normal max-w-lg leading-relaxed"
                  >
                    {activeSlide.description}
                  </motion.p>
                )}

                {/* CTA Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32, duration: 0.45 }}
                  className="pt-1 sm:pt-2 flex items-center gap-3"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlideAction(activeSlide);
                    }}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-accent text-bg font-semibold text-xs sm:text-sm hover:brightness-110 active:scale-95 transition-all duration-200 shadow-lg shadow-accent/25 group/btn"
                  >
                    <span>{activeSlide.cta_text || 'Lihat Detail'}</span>
                    <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls (Mobile touch-friendly, hover on desktop) */}
          {slides.length > 1 && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-4 md:px-6 pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-surface/80 sm:bg-surface/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-text-primary hover:bg-surface hover:scale-110 active:scale-95 transition-all pointer-events-auto shadow-lg"
                aria-label="Slide sebelumnya"
              >
                <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-surface/80 sm:bg-surface/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-text-primary hover:bg-surface hover:scale-110 active:scale-95 transition-all pointer-events-auto shadow-lg"
                aria-label="Slide berikutnya"
              >
                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {/* Slide Indicator Dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-2 sm:bottom-4 right-3 sm:right-6 flex justify-end gap-1.5 sm:gap-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(index);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide 
                      ? 'w-6 sm:w-8 h-1.5 sm:h-2 bg-accent shadow-sm shadow-accent/50' 
                      : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Pindah ke slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

