import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
  logoImage?: string;
}

const words = ["Rent", "Stay", "Live"];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete, logoImage }) => {
  const [count, setCount] = useState<number>(0);
  const [wordIndex, setWordIndex] = useState<number>(0);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 2700; // 2.7s
    let animationFrameId: number;

    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentCount = Math.floor(progress * 100);
      
      setCount(currentCount);

      // Rotate words every 900ms (900, 1800)
      const currentWordIndex = Math.min(Math.floor(elapsed / 900), words.length - 1);
      setWordIndex(currentWordIndex);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-bg flex flex-col justify-between p-6 md:p-12 overflow-hidden select-none"
    >
      {/* Top Left: Portfolio Label */}
      <div className="flex items-start justify-start pt-2">
        <motion.span 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-xs text-muted uppercase tracking-[0.3em] font-medium"
        >
          Portfolio
        </motion.span>
      </div>

      {/* Center: Animated Logo & Rotating Words */}
      <div className="flex flex-col items-center justify-center flex-1 gap-8">
        {/* Logo Card with Spinning Accent Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Dashed spinning accent ring */}
          <motion.div
            className="absolute inset-0 border-2 border-dashed border-stroke/40 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
          />
          
          {/* Entrance container */}
          <motion.div
            initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Breathing wrapper */}
            <motion.div
              animate={{
                scale: [0.9, 1.05, 0.9],
                boxShadow: [
                  "0 0 20px rgba(137, 170, 204, 0.2)",
                  "0 0 40px rgba(137, 170, 204, 0.5)",
                  "0 0 20px rgba(137, 170, 204, 0.2)"
                ]
              }}
              transition={{
                duration: 3,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror"
              }}
              className="w-24 h-24 rounded-full bg-surface border border-white/10 flex items-center justify-center overflow-hidden p-4 backdrop-blur-md"
            >
              {logoImage ? (
                <img 
                  src={logoImage} 
                  alt="Logo" 
                  className="w-full h-full object-contain select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/favicon.svg';
                  }}
                />
              ) : (
                <img 
                  src="/favicon.svg" 
                  alt="Logo" 
                  className="w-full h-full object-contain select-none"
                />
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Rotating Words */}
        <div className="h-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={wordIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.8 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-4xl md:text-6xl lg:text-7xl font-display italic text-text-primary text-center"
            >
              {words[wordIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom section: Counter & Progress Bar */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-end items-end">
          <span className="text-6xl md:text-8xl lg:text-9xl font-display text-text-primary tabular-nums leading-none tracking-tighter">
            {String(count).padStart(3, "0")}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-[3px] bg-stroke/50 relative rounded-full overflow-hidden">
          <motion.div 
            className="absolute left-0 top-0 bottom-0 accent-gradient origin-left w-full"
            style={{ 
              scaleX: count / 100,
              boxShadow: "0 0 12px rgba(137, 170, 204, 0.7)",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};
