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

            {/* 5. APP INFO & PRIVACY */}
            <div className="pt-2 border-t border-stroke/40 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{t('settings_version')}</span>
                <span className="font-mono font-bold text-text-primary">v1.0.5 (Build 6)</span>
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
