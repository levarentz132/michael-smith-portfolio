import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchArticles, slugify, type Article } from '../api';

export const Journal: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const data = await fetchArticles();
        setArticles(data.slice(0, 4)); // Show the top 4 latest guides on the landing page
      } catch (err) {
        console.error('Failed to load articles:', err);
      }
    };
    loadArticles();
  }, []);
  return (
    <section id="journal" className="bg-bg py-16 md:py-24 select-none">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex justify-between items-end mb-12"
        >
          <div className="flex flex-col items-start text-left max-w-lg">
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-px bg-stroke inline-block" />
              <span className="text-xs text-muted uppercase tracking-[0.3em] font-medium">Jurnal Hunian</span>
            </div>
            {/* Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-text-primary mb-4 leading-none">
              Panduan <span className="italic font-normal">terbaru</span>
            </h2>
            {/* Subtext */}
            <p className="text-sm md:text-base text-muted font-light leading-relaxed">
              Tips dan wawasan berguna tentang kamar kos, legalitas sewa, dan dekorasi ruang.
            </p>
          </div>

          {/* Desktop Only "View all" Button */}
          <button className="hidden md:inline-flex items-center gap-2 relative group rounded-full text-xs font-semibold uppercase tracking-[0.15em] px-6 py-3.5 border border-stroke bg-bg hover:border-transparent text-text-primary transition-all duration-300 hover:scale-105">
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
            Lihat semua panduan <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
          </button>
        </motion.div>

        {/* Horizontal Journal Pills */}
        <div className="flex flex-col gap-4 mt-8 md:mt-12">
          {articles.map((article, index) => {
            const articleDate = article.created_at
              ? new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Baru';
            return (
              <motion.div
                key={article.id}
                onClick={() => navigate(`/panduan/${article.id}-${slugify(article.title)}`)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-center gap-4 sm:gap-6 p-3 sm:p-4 rounded-[32px] sm:rounded-full bg-surface/30 hover:bg-surface border border-stroke transition-all duration-500 hover:scale-[1.01] hover:border-white/10 group cursor-pointer"
              >
                {/* Small preview image */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border border-stroke">
                  <img 
                    src={article.image} 
                    alt={article.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=150&h=150&q=80';
                    }}
                  />
                </div>

                {/* Text content layout */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left pr-2 sm:pr-6">
                  <div className="flex flex-col">
                    {/* Title */}
                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-text-primary group-hover:text-white transition-colors duration-300">
                      {article.title}
                    </h3>
                    {/* Mobile specific details info */}
                    <div className="flex items-center gap-3 sm:hidden mt-1 text-[10px] text-muted">
                      <span>{articleDate}</span>
                      <span className="w-1 h-1 rounded-full bg-stroke" />
                      <span>{article.read_time}</span>
                    </div>
                  </div>

                  {/* Date & Read time (desktop style) */}
                  <div className="hidden sm:flex items-center gap-6 text-xs text-muted shrink-0">
                    <span>{articleDate}</span>
                    <span className="w-[1px] h-3 bg-stroke" />
                    <span className="bg-stroke/40 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider text-text-primary/70">{article.read_time}</span>
                  </div>
                </div>

                {/* Arrow Indicator */}
                <div className="w-10 h-10 rounded-full border border-stroke flex items-center justify-center shrink-0 group-hover:bg-text-primary group-hover:border-transparent transition-all duration-300 mr-1 sm:mr-2">
                  <span className="text-sm font-medium text-text-primary group-hover:text-bg transition-colors duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
