import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  {
    value: "450+",
    label: "Kamar Pilihan",
    description: "Ruang boarding butik dan apartemen yang terletak di area urban utama."
  },
  {
    value: "98%",
    label: "Tingkat Okupansi",
    description: "Ruang yang sangat populer dengan kepuasan dan retensi komunitas yang konsisten."
  },
  {
    value: "2.5k+",
    label: "Penghuni Bahagia",
    description: "Co-liver dan penyewa yang menikmati layanan premium dan penyewaan yang lancar."
  }
];

export const Stats: React.FC = () => {
  return (
    <section className="bg-bg py-16 md:py-24 border-t border-b border-stroke/50 select-none">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 lg:gap-16">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              className="flex flex-col items-center md:items-start text-center md:text-left"
            >
              {/* Stat Value with accent text/gradient */}
              <span className="text-6xl md:text-7xl lg:text-8xl font-display font-medium text-text-primary leading-none mb-3">
                {stat.value}
              </span>
              
              {/* Divider line */}
              <div className="w-12 h-[2px] bg-stroke/60 mb-4 accent-gradient" />
              
              {/* Stat label */}
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-text-primary mb-2">
                {stat.label}
              </h3>
              
              {/* Description */}
              <p className="text-xs md:text-sm text-muted font-light leading-relaxed max-w-[280px]">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
