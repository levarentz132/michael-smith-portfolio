import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { X, Sparkles, Download } from 'lucide-react';

export const PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=com.highlanderstay.app";

/**
 * Standard Vector Google Play Logo
 */
export const GooglePlayIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={`shrink-0 ${className}`} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32.5 28.5C30.6 30.7 29.5 34 29.5 38.4v435.2c0 4.4 1.1 7.7 3 9.9l2.2 2.2 243.8-243.8v-5.8L34.7 26.3l-2.2 2.2z" fill="#4285F4"/>
    <path d="M356.9 334.8l-78.4-78.4v-5.8l78.4-78.4 1.8 1 92.9 52.8c26.5 15 26.5 39.7 0 54.8l-92.9 52.8-1.8 1.2z" fill="#FBBC04"/>
    <path d="M358.7 333.6L278.5 253.5 34.7 497.3c8.8 9.3 23.2 10.4 39.5 1.1l284.5-164.8z" fill="#EA4335"/>
    <path d="M358.7 178.4L74.2 16.6C57.9 7.3 43.5 8.4 34.7 17.7l243.8 243.8 80.2-83.1z" fill="#34A853"/>
  </svg>
);

export interface PlayStoreBadgeProps {
  variant?: 'pill' | 'button' | 'compact' | 'outline';
  className?: string;
  subtext?: string;
}

export const PlayStoreBadge: React.FC<PlayStoreBadgeProps> = ({
  variant = 'button',
  className = '',
  subtext = 'Temukan di'
}) => {
  // If running inside the native Android app, hide install CTA
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  if (variant === 'pill') {
    return (
      <a
        href={PLAYSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/80 hover:bg-surface border border-stroke/80 hover:border-amber-400/50 text-text-primary transition-all shadow-sm active:scale-95 group select-none ${className}`}
        title="Install HighlanderStay di Google Play Store"
      >
        <GooglePlayIcon className="w-4 h-4" />
        <span className="text-[11px] font-semibold text-text-primary group-hover:text-amber-400 transition-colors">
          Google Play
        </span>
      </a>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={PLAYSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-black border border-white/15 hover:border-amber-400/60 text-white transition-all shadow active:scale-95 select-none ${className}`}
        title="Download di Google Play Store"
      >
        <GooglePlayIcon className="w-4 h-4" />
        <div className="text-left leading-none">
          <span className="block text-[8px] text-slate-400 font-semibold uppercase tracking-wider">{subtext}</span>
          <span className="block text-xs font-bold font-sans mt-0.5">Google Play</span>
        </div>
      </a>
    );
  }

  return (
    <a
      href={PLAYSTORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-black/80 hover:bg-black border border-white/20 hover:border-amber-400/80 text-white transition-all duration-300 shadow-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] active:scale-95 select-none group backdrop-blur-md ${className}`}
      title="Install HighlanderStay di Google Play Store"
    >
      <GooglePlayIcon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110 duration-200" />
      <div className="text-left leading-tight">
        <span className="block text-[9px] sm:text-[10px] text-slate-300 group-hover:text-amber-300 uppercase tracking-widest font-semibold transition-colors">
          {subtext}
        </span>
        <span className="block text-xs sm:text-sm font-bold font-sans tracking-wide text-white">
          Google Play
        </span>
      </div>
    </a>
  );
};

/**
 * Smart Floating Banner for Mobile Web Users (Browser)
 */
export const PlayStoreSmartBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('hs_dismiss_play_banner') === 'true';
    } catch {
      return false;
    }
  });

  const [isNative, setIsNative] = useState<boolean>(true);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  if (isNative || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('hs_dismiss_play_banner', 'true');
    } catch {}
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-black border-b border-amber-500/30 px-3 py-2 flex items-center justify-between gap-2 shadow-lg z-50 select-none animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-full text-slate-400 hover:text-white shrink-0 active:scale-90"
          aria-label="Tutup banner"
        >
          <X size={15} />
        </button>
        <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 p-1 flex items-center justify-center shrink-0">
          <GooglePlayIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-bold text-white truncate flex items-center gap-1">
            HighlanderStay
            <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-black font-black rounded-full uppercase">
              Play Store
            </span>
          </p>
          <p className="text-[10px] text-slate-300 truncate">
            Sewa kamar lebih mudah & cepat di aplikasi
          </p>
        </div>
      </div>

      <a
        href={PLAYSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-[11px] uppercase tracking-wider shrink-0 shadow-md active:scale-95 transition-all hover:brightness-110 flex items-center gap-1"
      >
        <Download size={12} className="stroke-[3]" />
        Install
      </a>
    </div>
  );
};

/**
 * Promotional Card for Web Feeds / Home Sections
 */
export const PlayStoreCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  if (Capacitor.isNativePlatform()) {
    return null;
  }

  return (
    <div className={`p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-black to-slate-950 border border-amber-500/30 shadow-2xl relative overflow-hidden text-left ${className}`}>
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <GooglePlayIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                <Sparkles size={11} /> Resmi di Google Play
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Pasang Aplikasi HighlanderStay
            </h3>
            <p className="text-xs text-slate-300 max-w-md mt-0.5 leading-relaxed">
              Dapatkan notifikasi tagihan real-time, ajukan komplain kendala dengan foto langsung dari ponsel, dan bayar sewa otomatis tanpa repot.
            </p>
          </div>
        </div>

        <PlayStoreBadge variant="button" subtext="Download Gratis di" className="shrink-0 w-full sm:w-auto justify-center" />
      </div>
    </div>
  );
};

