import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  LocateFixed,
  Route as RouteIcon,
  MapPin,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Eye,
  Compass
} from 'lucide-react';

interface MapUserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_STEPS = [
  {
    id: 1,
    title: 'Cari Lokasi atau Pakai GPS',
    subtitle: 'Temukan kos terdekat dari kampus, kantor, mall, atau lokasi Anda',
    badge: 'Langkah 1',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description:
      'Gunakan kolom pencarian di bagian atas untuk mengetik nama kampus (UNTAR, Trisakti, Binus), stasiun KRL, mall, atau tekan tombol GPS untuk mendeteksi posisi Anda saat ini secara otomatis.',
    visual: 'search_gps'
  },
  {
    id: 2,
    title: 'Ukur Jarak & Estimasi Waktu',
    subtitle: 'Rute otomatis & waktu tempuh motor/jalan kaki',
    badge: 'Langkah 2',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description:
      'Saat Anda memilih landmark atau menyalakan GPS, peta otomatis menarik garis rute ke kos Highlanderstay terdekat, menghitung jarak (km), serta estimasi waktu tempuh motor dan jalan kaki.',
    visual: 'distance_route'
  },
  {
    id: 3,
    title: 'Klik Pin untuk Cek Kamar & Foto',
    subtitle: 'Lihat harga sewa, ketersediaan kamar, dan galeri unit',
    badge: 'Langkah 3',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description:
      'Klik pin properti mana pun di peta untuk membuka kartu informasi. Anda dapat mengecek status kamar siap huni, harga per bulan, fasilitas lengkap, dan pratinjau foto unit.',
    visual: 'pin_interactive'
  },
  {
    id: 4,
    title: 'Chat Penjaga atau Booking Online',
    subtitle: 'Hubungi petugas survei atau amankan kamar impian',
    badge: 'Langkah 4',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description:
      'Pilih tombol "Hubungi Penjaga" untuk langsung terhubung ke WhatsApp pengelola lokasi kos, atau klik "Booking" untuk reservasi kamar secara online dalam hitungan detik.',
    visual: 'chat_booking'
  }
];

export const MapUserGuideModal: React.FC<MapUserGuideModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Reset step on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        if (currentStep < GUIDE_STEPS.length - 1) {
          setCurrentStep((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, dontShowAgain]);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('has_seen_map_guide', 'true');
      } catch (e) {
        // ignore storage errors
      }
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const stepData = GUIDE_STEPS[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 pointer-events-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-surface border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left relative"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-1.5">
                    <span>Panduan Peta Kos</span>
                  </h3>
                  <p className="text-[11px] text-muted">
                    Cara cepat mencari kos terdekat & booking kamar
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-muted hover:text-text-primary flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Tutup Panduan"
              >
                <X size={16} />
              </button>
            </div>

            {/* Visual Animated Container */}
            <div className="relative bg-gradient-to-b from-[#0e1626] to-[#080d16] p-4 sm:p-6 flex items-center justify-center min-h-[210px] sm:min-h-[230px] overflow-hidden border-b border-white/10 select-none">
              {/* Animated Map Grid Lines Background */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }}
              />

              <AnimatePresence mode="wait">
                {stepData.visual === 'search_gps' && (
                  <motion.div
                    key="visual_1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-sm flex flex-col items-center gap-3 relative z-10"
                  >
                    {/* Mock Search Bar with Animated Typing */}
                    <div className="w-full bg-surface/90 border border-amber-400/50 rounded-2xl p-2.5 shadow-lg shadow-amber-500/10 flex items-center gap-2">
                      <Search size={16} className="text-amber-400 animate-pulse shrink-0" />
                      <div className="flex-1 min-w-0 text-xs font-mono text-text-primary flex items-center">
                        <motion.span
                          initial={{ width: '0ch' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.5 }}
                          className="overflow-hidden whitespace-nowrap inline-block text-amber-300 font-bold"
                        >
                          Universitas Tarumanagara
                        </motion.span>
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="w-1.5 h-3.5 bg-amber-400 ml-0.5"
                        />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 shrink-0"
                      >
                        <LocateFixed size={11} className="text-amber-400" />
                        <span>GPS</span>
                      </motion.div>
                    </div>

                    {/* Quick Landmark Chips Animation */}
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {['UNTAR', 'Trisakti', 'Central Park', 'Binus'].map((name, i) => (
                        <motion.span
                          key={name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 * i }}
                          className={`text-[10px] px-2.5 py-1 rounded-full border ${
                            i === 0
                              ? 'bg-amber-500 text-bg font-bold border-amber-400 shadow-md shadow-amber-500/20'
                              : 'bg-white/5 border-white/10 text-muted'
                          }`}
                        >
                          📍 {name}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {stepData.visual === 'distance_route' && (
                  <motion.div
                    key="visual_2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-sm flex flex-col items-center gap-3 relative z-10"
                  >
                    {/* Route Connector Animation */}
                    <div className="w-full flex items-center justify-between px-3 relative py-2">
                      {/* Landmark Pin */}
                      <div className="flex flex-col items-center z-10">
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                          className="w-10 h-10 rounded-full bg-blue-500/30 border-2 border-blue-400 text-blue-300 flex items-center justify-center shadow-lg shadow-blue-500/30"
                        >
                          <Compass size={18} />
                        </motion.div>
                        <span className="text-[10px] font-bold text-blue-300 mt-1">Titik Anda</span>
                      </div>

                      {/* Animated Route Line */}
                      <div className="flex-1 mx-2 relative flex items-center justify-center">
                        <div className="w-full h-0.5 border-t-2 border-dashed border-amber-400/80 relative" />
                        <motion.div
                          animate={{ x: [-40, 40] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                          className="absolute w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400"
                        />
                      </div>

                      {/* Kos Pin */}
                      <div className="flex flex-col items-center z-10">
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 1.8, delay: 0.3, repeat: Infinity }}
                          className="w-10 h-10 rounded-full bg-amber-500 text-bg font-black flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-amber-300"
                        >
                          <MapPin size={18} className="fill-bg" />
                        </motion.div>
                        <span className="text-[10px] font-bold text-amber-300 mt-1">Kos Terdekat</span>
                      </div>
                    </div>

                    {/* Distance & Time Badge Banner */}
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-1.5 flex items-center gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <RouteIcon size={13} />
                        <span>1.2 km</span>
                      </div>
                      <span className="text-white/20">|</span>
                      <div className="text-text-primary font-bold">🏍️ ~4 menit</div>
                      <span className="text-white/20">|</span>
                      <div className="text-muted">🚶 ~12 menit</div>
                    </motion.div>
                  </motion.div>
                )}

                {stepData.visual === 'pin_interactive' && (
                  <motion.div
                    key="visual_3"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-sm flex flex-col items-center gap-2 relative z-10"
                  >
                    {/* Mock Interactive Property Pin Card */}
                    <motion.div
                      animate={{ scale: [0.98, 1.02, 0.98] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-full bg-surface border border-emerald-500/50 rounded-2xl p-3 shadow-xl shadow-emerald-500/10 flex items-center gap-3 text-left"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted relative shrink-0 border border-white/10">
                        <img
                          src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80"
                          alt="Room Preview"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 text-[9px] text-amber-300 font-bold flex items-center gap-0.5">
                          <Eye size={9} />
                          <span>360°</span>
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">
                            Ready 3 Kamar
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-text-primary truncate">
                          Highlander Greenville Mangga
                        </h4>
                        <div className="text-xs font-extrabold text-amber-400 mt-0.5">
                          Rp 1.650.000 / bln
                        </div>
                      </div>
                    </motion.div>

                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <span>👉 Ketuk pin di peta untuk melihat foto & info detail</span>
                    </div>
                  </motion.div>
                )}

                {stepData.visual === 'chat_booking' && (
                  <motion.div
                    key="visual_4"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-sm flex flex-col items-center gap-3 relative z-10"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {/* WhatsApp Button Mock */}
                      <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex-1 py-3 px-3 rounded-2xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/20"
                      >
                        <MessageCircle size={15} className="fill-white/20" />
                        <span>Chat Penjaga</span>
                      </motion.div>

                      {/* Booking Button Mock */}
                      <motion.div
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 1.5, delay: 0.2, repeat: Infinity }}
                        className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-bg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                      >
                        <span>Booking Online</span>
                        <ArrowRight size={14} />
                      </motion.div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Respons cepat via WhatsApp & konfirmasi booking instan</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step Content & Instructions */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${stepData.badgeColor}`}
                  >
                    {stepData.badge} dari {GUIDE_STEPS.length}
                  </span>

                  {/* Step Indicator Dots */}
                  <div className="flex items-center gap-1.5">
                    {GUIDE_STEPS.map((step, idx) => (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStep(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          currentStep === idx ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
                        }`}
                        title={`Langkah ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-text-primary pt-1">
                  {stepData.title}
                </h4>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  {stepData.description}
                </p>
              </div>

              {/* Checkbox: Jangan tampilkan lagi */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-xs text-muted">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <span>Jangan tampilkan otomatis lagi</span>
                </label>

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-muted hover:text-text-primary font-medium text-xs transition-colors"
                >
                  Lewati
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-2 pt-1">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-3 sm:px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary text-xs sm:text-sm font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <ArrowLeft size={14} />
                    <span>Sebelumnya</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-bg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>{currentStep === GUIDE_STEPS.length - 1 ? 'Mulai Eksplorasi Peta' : 'Lanjut'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
