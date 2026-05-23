import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FacilityItem {
  id: number;
  title: string;
  image: string;
  rotation?: number;
}

const explorations: FacilityItem[] = [
  {
    id: 1,
    title: "Kolam Rooftop Infinity",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80",
    rotation: -4
  },
  {
    id: 2,
    title: "Lounge Bersama yang Nyaman",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    rotation: 5
  },
  {
    id: 3,
    title: "Akses Kunci Kartu Pintar",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
    rotation: -2
  },
  {
    id: 4,
    title: "WiFi Fiber Kecepatan Tinggi",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    rotation: 3
  },
  {
    id: 5,
    title: "Dapur Bersama Lengkap",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    rotation: -5
  },
  {
    id: 6,
    title: "Keamanan & CCTV 24/7",
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80",
    rotation: 4
  }
];

interface ExplorationsProps {
  settings?: any;
}

export const Explorations: React.FC<ExplorationsProps> = ({ settings }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const items: FacilityItem[] = settings?.facilities_premium && settings.facilities_premium.length > 0
    ? settings.facilities_premium
    : explorations;

  useEffect(() => {
    const container = containerRef.current;
    const pinned = pinnedRef.current;
    const leftCol = leftColRef.current;
    const rightCol = rightColRef.current;

    if (!container || !pinned || !leftCol || !rightCol) return;

    const mm = gsap.matchMedia();

    // Desktop only scroll animations (subtle column parallax)
    mm.add("(min-width: 768px)", () => {
      // Parallax effect on columns
      // Left Column scrolls slightly slower
      gsap.fromTo(leftCol,
        { y: 40 },
        {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          }
        }
      );

      // Right Column scrolls slightly faster
      gsap.fromTo(rightCol,
        { y: 80 },
        {
          y: -80,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          }
        }
      );
    });

    // Entrance animations for all screen sizes
    mm.add("all", () => {
      // Staggered text fade-in & slide-up
      gsap.fromTo(".amenity-text-item",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: container,
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );

      // Individual cards fade-in & scale-up on scroll
      const cards = gsap.utils.toArray<HTMLElement>(".amenity-card-wrapper");
      cards.forEach((card) => {
        gsap.fromTo(card,
          { opacity: 0, scale: 0.9, y: 45 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );
      });
    });

    return () => mm.revert();
  }, [items]);

  // Split calculations
  const leftItems = items.filter((_, idx) => idx % 2 === 0);
  const rightItems = items.filter((_, idx) => idx % 2 !== 0);

  return (
    <section 
      ref={containerRef} 
      id="resume" 
      className="relative min-h-screen bg-bg flex flex-col md:flex-row justify-between items-start px-6 md:px-12 lg:px-24 py-20 md:py-32 overflow-visible select-none"
    >
      {/* Layer 1: Pinned Center Left Side */}
      <div 
        ref={pinnedRef} 
        className="w-full md:w-[40%] h-auto md:h-screen flex flex-col justify-center items-start text-left mb-16 md:mb-0 z-10 md:sticky md:top-0"
      >
        <div className="flex items-center gap-2 mb-3 amenity-text-item">
          <span className="w-8 h-px bg-stroke inline-block" />
          <span className="text-xs text-muted uppercase tracking-[0.3em] font-medium">Fasilitas Modern</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-text-primary mb-6 leading-none amenity-text-item">
          Fasilitas <span className="italic font-normal">premium</span>
        </h2>
        <p className="text-sm md:text-base text-muted font-light leading-relaxed mb-8 max-w-sm amenity-text-item">
          Tinggal dengan nyaman berkat fasilitas bergaya butik, ruang dengan layanan penuh, internet fiber berkecepatan tinggi, dan keamanan standar untuk ketenangan pikiran di semua unit kami.
        </p>
        
        {/* Schedule Visit button */}
        <button 
          onClick={() => {
            const contactSection = document.getElementById('contact');
            if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
          }}
          className="relative group rounded-full text-xs font-semibold uppercase tracking-[0.15em] px-6 py-3.5 border border-stroke bg-bg hover:border-transparent text-text-primary transition-all duration-300 hover:scale-105 amenity-text-item"
        >
          <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
          Jadwalkan Kunjungan <span className="inline-block transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">→</span>
        </button>
      </div>

      {/* Layer 2: Parallax Columns Right Side */}
      <div className="w-full md:w-[50%] flex gap-6 md:gap-12 lg:gap-16 pt-10 md:pt-40 pb-40 overflow-visible">
        
        {/* Left Column */}
        <div ref={leftColRef} className="flex-1 flex flex-col gap-8 md:gap-16 lg:gap-24">
          {leftItems.map((item) => (
            <div key={item.id} className="amenity-card-wrapper w-full">
              <motion.div 
                onClick={() => setActiveImage(item.image)}
                className="relative aspect-square w-full rounded-2xl overflow-hidden border border-stroke cursor-zoom-in group shadow-lg shadow-black/20"
                initial={{ rotate: item.rotation }}
                whileHover={{ rotate: 0, scale: 1.05, y: -10, zIndex: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ transformOrigin: "center" }}
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-xs text-text-primary font-medium tracking-wide">{item.title}</span>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div ref={rightColRef} className="flex-1 flex flex-col gap-8 md:gap-16 lg:gap-24 mt-12 md:mt-24">
          {rightItems.map((item) => (
            <div key={item.id} className="amenity-card-wrapper w-full">
              <motion.div 
                onClick={() => setActiveImage(item.image)}
                className="relative aspect-square w-full rounded-2xl overflow-hidden border border-stroke cursor-zoom-in group shadow-lg shadow-black/20"
                initial={{ rotate: item.rotation }}
                whileHover={{ rotate: 0, scale: 1.05, y: -10, zIndex: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ transformOrigin: "center" }}
              >
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-xs text-text-primary font-medium tracking-wide">{item.title}</span>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Lightbox Overlay */}
      <AnimatePresence>
        {activeImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveImage(null)}
            className="fixed inset-0 bg-black/95 z-[10000] flex items-center justify-center cursor-zoom-out p-4"
          >
            <motion.button 
              className="absolute top-6 right-6 text-white text-3xl font-light hover:text-muted transition-colors duration-200"
              onClick={() => setActiveImage(null)}
            >
              ✕
            </motion.button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              src={activeImage} 
              alt="Amenity Detail" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/5"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};
