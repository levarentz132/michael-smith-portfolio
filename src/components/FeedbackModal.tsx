import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Star, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import { useLiveChat } from '../utils/liveChat';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userEmail }) => {
  const { t } = useI18n();
  const { openChat } = useLiveChat();

  const [category, setCategory] = useState<'general' | 'bug' | 'feature'>('general');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState(userEmail || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg(t('fb_empty_warn'));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Save feedback to localStorage queue
      const existing = JSON.parse(localStorage.getItem('hs_user_feedbacks') || '[]');
      const newEntry = {
        id: Date.now(),
        category,
        rating,
        message: message.trim(),
        contact: emailOrPhone.trim(),
        date: new Date().toISOString(),
        device: navigator.userAgent
      };
      existing.push(newEntry);
      localStorage.setItem('hs_user_feedbacks', JSON.stringify(existing));

      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setMessage('');
          setEmailOrPhone('');
          onClose();
        }, 2200);
      }, 600);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Gagal mengirim masukan.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-surface border border-stroke rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stroke/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-text-primary">
                  {t('fb_title')}
                </h3>
                <p className="text-xs text-muted">
                  {t('fb_desc')}
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

          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 text-center space-y-3"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-lg font-bold text-text-primary">Masukan Terkirim!</h4>
              <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto leading-relaxed">
                {t('fb_success')}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="pt-4 space-y-4">
              {/* Category Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted block">
                  {t('fb_category')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('general')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      category === 'general'
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow'
                        : 'bg-stroke/30 text-muted border-stroke hover:text-text-primary hover:bg-stroke/60'
                    }`}
                  >
                    {t('fb_cat_general')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('bug')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      category === 'bug'
                        ? 'bg-rose-500 text-white border-rose-500 font-bold shadow'
                        : 'bg-stroke/30 text-muted border-stroke hover:text-text-primary hover:bg-stroke/60'
                    }`}
                  >
                    {t('fb_cat_bug')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('feature')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      category === 'feature'
                        ? 'bg-blue-500 text-white border-blue-500 font-bold shadow'
                        : 'bg-stroke/30 text-muted border-stroke hover:text-text-primary hover:bg-stroke/60'
                    }`}
                  >
                    {t('fb_cat_feature')}
                  </button>
                </div>
              </div>

              {/* Star Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted block">
                  {t('fb_rating')}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        size={24}
                        className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-400 ml-2">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {/* Feedback Message */}
              <div className="space-y-1.5">
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('fb_placeholder')}
                  className="w-full p-3 rounded-2xl bg-bg border border-stroke text-text-primary text-xs sm:text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all placeholder:text-muted/60 resize-none"
                />
              </div>

              {/* Optional Contact */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Email / No WhatsApp (Opsional, jika ingin dihubungi)"
                  className="w-full p-3 rounded-2xl bg-bg border border-stroke text-text-primary text-xs focus:outline-none focus:border-amber-400 transition-all placeholder:text-muted/60"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Live Chat alternative */}
              <div className="p-3 rounded-2xl bg-stroke/20 border border-stroke/40 flex items-center justify-between gap-3 text-xs">
                <span className="text-muted">Butuh bantuan cepat dari admin?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openChat();
                  }}
                  className="text-amber-400 font-bold hover:underline whitespace-nowrap"
                >
                  Buka Live Chat →
                </button>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-text-primary hover:bg-stroke/30 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? t('fb_submitting') : t('fb_submit')}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
