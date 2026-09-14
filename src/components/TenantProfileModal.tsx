import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, ShieldCheck, AlertCircle, LogOut, Send, CheckCircle2 } from 'lucide-react';
import type { UserSession } from '../api';
import { sendPhoneOtp, verifyPhoneOtp } from '../api';

interface TenantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession | null;
  onLogout: () => void;
  onSessionUpdate?: (updatedSession: UserSession) => void;
}

export const TenantProfileModal: React.FC<TenantProfileModalProps> = ({
  isOpen,
  onClose,
  session,
  onLogout,
  onSessionUpdate
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  if (!session) return null;

  const handleSendOtp = async () => {
    if (!session.token) {
      setOtpError('Token sesi tidak tersedia. Silakan masuk kembali.');
      return;
    }
    setOtpError('');
    setOtpSuccess('');
    setIsSendingOtp(true);
    try {
      const res = await sendPhoneOtp({
        login: session.phone || session.email || '',
        channel: 'whatsapp'
      }, session.token);
      setIsVerifying(true);
      setOtpSuccess(res.message || 'Kode OTP telah dikirimkan ke WhatsApp Anda.');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setOtpError(err.message || 'Gagal mengirim kode OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.token) {
      setOtpError('Token sesi tidak tersedia.');
      return;
    }
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Masukkan 6 digit kode OTP yang valid.');
      return;
    }

    setIsSubmittingOtp(true);
    setOtpError('');
    try {
      const { session: verifiedSession, response } = await verifyPhoneOtp({
        login: session.phone || session.email || '',
        code: otpCode.trim()
      }, session.token);

      setOtpSuccess(response.message || 'Nomor WhatsApp berhasil diverifikasi!');
      const updated: UserSession = {
        ...session,
        ...verifiedSession,
        token: session.token || verifiedSession.token,
        phone_verified: true,
        phone_verified_at: response.user?.phone_verified_at || new Date().toISOString()
      };
      if (onSessionUpdate) {
        onSessionUpdate(updated);
      }
      localStorage.setItem('userSession', JSON.stringify(updated));
      setTimeout(() => {
        setIsVerifying(false);
      }, 1800);
    } catch (err: any) {
      setOtpError(err.message || 'Kode OTP salah atau telah kadaluarsa.');
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="relative w-full max-w-lg bg-surface border border-stroke rounded-[32px] p-6 sm:p-8 overflow-hidden shadow-2xl text-left"
          >
            {/* Halftone & Glow */}
            <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-muted hover:text-text-primary text-xl transition-colors duration-200 z-20"
            >
              ✕
            </button>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-stroke/40">
                <div className="w-14 h-14 rounded-2xl bg-text-primary text-bg flex items-center justify-center font-display text-2xl font-bold shadow-lg shadow-black/30">
                  {session.name ? session.name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-400">
                      Akun Penyewa
                    </span>
                    {session.phone_verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <ShieldCheck size={11} /> Terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <AlertCircle size={11} /> Belum Verifikasi
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-display font-semibold text-text-primary truncate mt-0.5">
                    {session.name}
                  </h3>
                  <p className="text-xs text-muted truncate">
                    ID #{session.id} {session.email ? `• ${session.email}` : ''}
                  </p>
                </div>
              </div>

              {/* Body Content */}
              <div className="py-6 flex flex-col gap-4">
                {/* Details list */}
                <div className="grid grid-cols-1 gap-2.5 bg-bg/60 border border-stroke/40 rounded-2xl p-4 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-stroke/20">
                    <span className="text-muted flex items-center gap-2">
                      <User size={13} className="text-text-primary/70" /> Nama Lengkap
                    </span>
                    <span className="font-semibold text-text-primary">{session.name}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-stroke/20">
                    <span className="text-muted flex items-center gap-2">
                      <Mail size={13} className="text-text-primary/70" /> Email
                    </span>
                    <span className="font-medium text-text-primary">{session.email || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-stroke/20">
                    <span className="text-muted flex items-center gap-2">
                      <Phone size={13} className="text-text-primary/70" /> No. WhatsApp
                    </span>
                    <span className="font-mono font-medium text-text-primary">{session.phone || '-'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted flex items-center gap-2">
                      <ShieldCheck size={13} className="text-text-primary/70" /> Status WhatsApp
                    </span>
                    <span>
                      {session.phone_verified ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Aktif & Terverifikasi
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <AlertCircle size={13} /> Belum Diverifikasi
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Verification Action Box (if unverified) */}
                {!session.phone_verified && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
                        <AlertCircle size={18} />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-xs font-semibold text-amber-300">
                          Verifikasi Nomor WhatsApp Anda
                        </h4>
                        <p className="text-[11px] text-muted leading-relaxed mt-0.5">
                          Dapatkan pembaruan status booking instan dan konfirmasi langsung ke nomor WhatsApp Anda.
                        </p>

                        {!isVerifying ? (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Send size={12} />
                            {isSendingOtp ? 'Mengirim OTP...' : 'Kirim Kode OTP WhatsApp'}
                          </button>
                        ) : (
                          <form onSubmit={handleVerifyOtp} className="mt-3 flex flex-col gap-2.5">
                            {otpSuccess && (
                              <div className="text-[11px] text-emerald-400 font-medium">
                                {otpSuccess}
                              </div>
                            )}
                            {otpError && (
                              <div className="text-[11px] text-rose-400 font-medium">
                                {otpError}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="6 Digit OTP"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                className="w-36 bg-bg border border-stroke rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-text-primary focus:outline-none focus:border-amber-400"
                              />
                              <button
                                type="submit"
                                disabled={isSubmittingOtp || otpCode.length < 4}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-bg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                              >
                                {isSubmittingOtp ? 'Memverifikasi...' : 'Verifikasi'}
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted">
                              {countdown > 0 ? (
                                <span>Kirim ulang dalam {countdown}s</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleSendOtp}
                                  disabled={isSendingOtp}
                                  className="text-amber-400 hover:underline"
                                >
                                  Kirim ulang kode OTP
                                </button>
                              )}
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-stroke/40 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold border border-stroke text-muted hover:text-text-primary hover:border-white/20 transition-all"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                >
                  <LogOut size={13} />
                  Keluar Akun
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
