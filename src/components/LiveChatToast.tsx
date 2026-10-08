import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLiveChat } from '../utils/liveChat';

export const LiveChatToast: React.FC = () => {
  const { lastMessage, isOpen, openChat } = useLiveChat();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastMessage && !isOpen) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [lastMessage, isOpen]);

  if (!visible || !lastMessage || isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 z-[9999] max-w-sm pointer-events-auto"
      >
        <div 
          onClick={() => {
            setVisible(false);
            openChat();
          }}
          className="group relative flex items-start gap-3 bg-slate-900/98 backdrop-blur-2xl border-2 border-emerald-500/60 rounded-2xl p-3.5 shadow-2xl shadow-emerald-950/50 cursor-pointer hover:border-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          {/* Pulsing Avatar Icon */}
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 mt-0.5">
            <MessageCircle size={18} className="fill-emerald-400/20" />
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
            <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-5 text-left">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-black text-emerald-400 truncate">
                {lastMessage.sender || 'Admin Highlanderstay'}
              </span>
              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
            </div>
            <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-medium">
              {lastMessage.text}
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider group-hover:underline">
              <span>Buka Percakapan</span>
              <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setVisible(false);
            }}
            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup Notifikasi"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
