import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CreditCard, ShieldCheck, ChevronRight, X, Sparkles } from 'lucide-react';
import { useI18n } from '../utils/i18n';

interface AppWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppWalkthroughModal: React.FC<AppWalkthroughModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Search,
      badge: 'Jelajahi Unit',
      title: t('wt_title_1'),
      desc: t('wt_desc_1'),
      color: 'from-amber-500 to-orange-500',
      bgGlow: 'bg-amber-500/20',
      textColor: 'text-amber-400',
    },
    {
      icon: CreditCard,
      badge: 'Booking Online',
      title: t('wt_title_2'),
      desc: t('wt_desc_2'),
      color: 'from-blue-500 to-indigo-500',
      bgGlow: 'bg-blue-500/20',
      textColor: 'text-blue-400',
    },
    {
      icon: ShieldCheck,
      badge: 'Portal Penghuni',
      title: t('wt_title_3'),
      desc: t('wt_desc_3'),
      color: 'from-emerald-500 to-teal-500',
      bgGlow: 'bg-emerald-500/20',
      textColor: 'text-emerald-400',
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('hs_walkthrough_completed', 'true');
    } catch {}
    onClose();
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  const activeStep = steps[currentStep];
  const IconComponent = activeStep.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleComplete}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center select-none"
        >
          {/* Ambient colored glow */}
          <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${activeStep.bgGlow} transition-colors duration-500`} />
          <div className={`absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none ${activeStep.bgGlow} transition-colors duration-500`} />

          {/* Close button */}
          <button
            type="button"
            onClick={handleComplete}
            className="absolute top-4 right-4 p-2 rounded-full text-muted hover:text-text-primary hover:bg-stroke/40 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>

          {/* Slide Content */}
          <div className="relative pt-2 pb-4">
            {/* Step Icon Badge */}
            <div className="flex justify-center mb-6">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${activeStep.color} p-0.5 shadow-xl flex items-center justify-center`}
              >
                <div className="w-full h-full bg-surface/90 rounded-[22px] flex items-center justify-center backdrop-blur-sm">
                  <IconComponent size={36} className={activeStep.textColor} />
                </div>
              </motion.div>
            </div>

            {/* Step Category Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${activeStep.bgGlow} ${activeStep.textColor} border border-white/10 mb-3`}>
              <Sparkles size={12} />
              {activeStep.badge}
            </span>

            {/* Title & Description */}
            <motion.div
              key={`text-${currentStep}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-2.5 min-h-[110px]"
            >
              <h3 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                {activeStep.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm mx-auto">
                {activeStep.desc}
              </p>
            </motion.div>

            {/* Step Indicator Dots */}
            <div className="flex items-center justify-center gap-2 my-6">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? `w-7 bg-gradient-to-r ${activeStep.color}`
                      : 'w-2 bg-stroke hover:bg-muted/50'
                  }`}
                  aria-label={`Step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleComplete}
                className="px-4 py-2.5 text-xs font-semibold text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                {t('wt_skip')}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className={`flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r ${activeStep.color} text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/20 hover:opacity-95 active:scale-98 transition-all cursor-pointer`}
              >
                <span>{currentStep === steps.length - 1 ? t('wt_start') : t('wt_next')}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
