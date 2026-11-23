import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  Moon,
  Sun,
  Laptop,
  Languages,
  Bell,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Check
} from 'lucide-react';
import { useI18n, type AppLanguage } from '../utils/i18n';
import { getStoredTheme, applyTheme, type ThemeMode } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWalkthrough?: () => void;
  onReplayWalkthrough?: () => void;
  onOpenFeedback: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenWalkthrough,
  onReplayWalkthrough,
  onOpenFeedback
}) => {
  const triggerWalkthrough = onReplayWalkthrough || onOpenWalkthrough;
  const { lang, changeLanguage, t } = useI18n();
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(getStoredTheme);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hs_notif_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    setCurrentTheme(getStoredTheme());
  }, [isOpen]);

  const handleThemeChange = (mode: ThemeMode) => {
    setCurrentTheme(mode);
    applyTheme(mode);
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    changeLanguage(newLang);
  };

  const handleToggleNotifications = () => {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    try {
      localStorage.setItem('hs_notif_enabled', String(next));
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-lg bg-surface border border-stroke rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stroke/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md">
                <Settings size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary">
                  {t('settings_title')}
                </h3>
                <p className="text-xs text-muted">
                  {t('settings_desc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-muted hover:text-text-primary hover:bg-stroke/40 transition-colors"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Settings Body (Scrollable) */}
          <div className="py-4 space-y-5 overflow-y-auto pr-1">
            
            {/* 1. THEME CUSTOMIZATION (Dark / Light / System) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-wider">
                <Moon size={14} className="text-amber-400" />
                <span>{t('settings_theme')}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentTheme === 'dark'
                      ? 'bg-amber-400/15 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-stroke/30 border-stroke text-muted hover:text-text-primary hover:bg-stroke/60'
                  }`}
                >
                  <Moon size={18} />
                  <span className="text-[11px] font-bold">{t('settings_theme_dark')}</span>
                  {currentTheme === 'dark' && <Check size={12} className="text-amber-400 -mt-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentTheme === 'light'
                      ? 'bg-amber-400/15 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-stroke/30 border-stroke text-muted hover:text-text-primary hover:bg-stroke/60'
                  }`}
                >
                  <Sun size={18} />
                  <span className="text-[11px] font-bold">{t('settings_theme_light')}</span>
                  {currentTheme === 'light' && <Check size={12} className="text-amber-400 -mt-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentTheme === 'system'
                      ? 'bg-amber-400/15 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-stroke/30 border-stroke text-muted hover:text-text-primary hover:bg-stroke/60'
                  }`}
                >
                  <Laptop size={18} />
                  <span className="text-[11px] font-bold">{t('settings_theme_system')}</span>
                  {currentTheme === 'system' && <Check size={12} className="text-amber-400 -mt-0.5" />}
                </button>
              </div>
            </div>

            {/* 2. LANGUAGE SUPPORT (Indonesian / English) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary flex items-center gap-2 uppercase tracking-wider">
                <Languages size={14} className="text-blue-400" />
                <span>{t('settings_language')}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('id')}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    lang === 'id'
                      ? 'bg-blue-500/15 border-blue-400 text-blue-300 shadow-md'
                      : 'bg-stroke/30 border-stroke text-muted hover:text-text-primary hover:bg-stroke/60'
                  }`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-base">🇮🇩</span>
                    <span className="text-xs font-bold">{t('settings_lang_id')}</span>
                  </div>
                  {lang === 'id' && <Check size={14} className="text-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    lang === 'en'
                      ? 'bg-blue-500/15 border-blue-400 text-blue-300 shadow-md'
                      : 'bg-stroke/30 border-stroke text-muted hover:text-text-primary hover:bg-stroke/60'
                  }`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-base">🇺🇸</span>
                    <span className="text-xs font-bold">{t('settings_lang_en')}</span>
                  </div>
                  {lang === 'en' && <Check size={14} className="text-blue-400" />}
                </button>
              </div>
            </div>

            {/* 3. NOTIFICATIONS PREFERENCE */}
            <div className="p-3.5 rounded-2xl bg-stroke/30 border border-stroke/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                    {t('settings_notifications')}
                  </h4>
                  <p className="text-[11px] text-muted">
                    {t('settings_notif_desc')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notificationsEnabled ? 'bg-amber-400' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                    notificationsEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* 4. ACTIONS (Walkthrough & Feedback) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary block uppercase tracking-wider">
                Bantuan & Interaksi
              </label>

              {/* Replay Walkthrough */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  triggerWalkthrough?.();
                }}
                className="w-full p-3.5 rounded-2xl bg-stroke/30 hover:bg-stroke/60 border border-stroke/50 text-text-primary text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sparkles size={17} className="text-amber-400" />
                  <span>{t('settings_walkthrough_btn')}</span>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Send Feedback & Suggestions */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFeedback();
                }}
                className="w-full p-3.5 rounded-2xl bg-stroke/30 hover:bg-stroke/60 border border-stroke/50 text-text-primary text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={17} className="text-emerald-400" />
                  <span>{t('settings_feedback_btn')}</span>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>
            </div>

            {/* 5. SOSMED & KOMUNITAS */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary block uppercase tracking-wider">
                Media Sosial & Komunitas
              </label>
              <div className="grid grid-cols-5 gap-2">
                <a
                  href="https://instagram.com/highlanderstay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 hover:bg-pink-500/20 flex flex-col items-center justify-center gap-1 transition-all"
                  title="Instagram"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  <span className="text-[10px] font-semibold">IG</span>
                </a>

                <a
                  href="https://tiktok.com/@highlanderstay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 flex flex-col items-center justify-center gap-1 transition-all"
                  title="TikTok"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.48c1.37-1.37 2.14-3.23 2.14-5.17V8.5a8.28 8.28 0 0 0 4.63 1.4v-3.21Z"/>
                  </svg>
                  <span className="text-[10px] font-semibold">TikTok</span>
                </a>

                <a
                  href="https://facebook.com/highlanderstay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 flex flex-col items-center justify-center gap-1 transition-all"
                  title="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-[10px] font-semibold">FB</span>
                </a>

                <a
                  href="https://youtube.com/@highlanderstay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 flex flex-col items-center justify-center gap-1 transition-all"
                  title="YouTube"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="text-[10px] font-semibold">YT</span>
                </a>

                <a
                  href="https://wa.me/628123456789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 flex flex-col items-center justify-center gap-1 transition-all"
                  title="WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span className="text-[10px] font-semibold">WA</span>
                </a>
              </div>
            </div>

            {/* 6. APP INFO & PRIVACY */}
            <div className="pt-2 border-t border-stroke/40 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{t('settings_version')}</span>
                <span className="font-mono font-bold text-text-primary">v1.0.9 (Build 10)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted">
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <ShieldCheck size={14} />
                  <span>{t('settings_privacy')}</span>
                  <ExternalLink size={11} />
                </a>
                <span>HighlanderStay © 2026</span>
              </div>
            </div>

          </div>

          {/* Footer Close */}
          <div className="pt-3 border-t border-stroke/60 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-stroke/50 hover:bg-stroke/80 text-text-primary font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              {t('settings_close')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
