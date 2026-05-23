import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { WebsiteSettings } from '../api';

interface BannerProps {
  onCtaClick: () => void;
  settings?: WebsiteSettings | null;
}

export const Banner: React.FC<BannerProps> = ({ onCtaClick, settings }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Mapped or Default Banners
  const slides = settings?.banners && settings.banners.length > 0
    ? settings.banners.map((url, idx) => ({ id: idx + 1, image: url }))
    : [
        {
          id: 1,
          image: settings?.banner_image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80',
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80',
        }
      ];

  // Autoplay
  useEffect(() => {
    if (isHovered || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <section className="bg-bg py-0 md:py-16 select-none">
      <div className="max-w-[1200px] mx-auto px-0 md:px-10 lg:px-16">
        
        {/* Carousel Container */}
        <div 
          className="relative overflow-hidden rounded-none md:rounded-[48px] border-y md:border border-stroke bg-surface min-h-[180px] sm:min-h-[300px] md:min-h-[450px] lg:min-h-[500px] group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="relative w-full min-h-[180px] sm:min-h-[300px] md:min-h-[450px] lg:min-h-[500px] flex flex-col items-center justify-center cursor-pointer"
              onClick={onCtaClick}
            >
              {/* Background Image (Clean Promo Graphic) */}
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                <img 
                  src={slides[currentSlide].image} 
                  alt={`Banner ${slides[currentSlide].id}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          {slides.length > 1 && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 md:px-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="w-12 h-12 rounded-full bg-surface/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-text-primary hover:bg-surface hover:scale-110 transition-all pointer-events-auto"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="w-12 h-12 rounded-full bg-surface/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-text-primary hover:bg-surface hover:scale-110 transition-all pointer-events-auto"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {/* Indicators */}
          {slides.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(index);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide 
                      ? 'w-8 h-1.5 bg-text-primary' 
                      : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
