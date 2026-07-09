import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginTenant, requestOtp, verifyOtp, registerTenant } from '../api';
import type { UserSession } from '../api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Fields
  const [registerPhone, setRegisterPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Verified Register Step 2 Fields
  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!registerPhone) {
      setError('Mohon masukkan nomor WhatsApp Anda.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await requestOtp(registerPhone);
      setOtpSent(true);
      setCountdown(60);
      alert('Kode OTP telah dikirim ke nomor WhatsApp Anda!');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError('Mohon masukkan kode OTP.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await verifyOtp(registerPhone, otpCode);
      setOtpVerified(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Kode OTP salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      let session: UserSession;
      
      if (activeTab === 'login') {
        if (!loginPhone || !loginPassword) {
          throw new Error('Mohon isi nomor WhatsApp dan kata sandi.');
        }
        session = await loginTenant(loginPhone, loginPassword);
      } else {
        if (!registerName || !registerPassword) {
          throw new Error('Mohon isi nama dan kata sandi baru Anda.');
        }
        session = await registerTenant(registerPhone, otpCode, registerName, registerPassword);
      }
      
      onLoginSuccess(session);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Operasi gagal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRegisterState = () => {
    setRegisterPhone('');
    setOtpCode('');
    setOtpSent(false);
    setOtpVerified(false);
    setRegisterName('');
    setRegisterPassword('');
    setError('');
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

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl text-left"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl transition-colors duration-200"
            >
              ✕
            </button>

            {/* Halftone Overlay */}
            <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />

            <div className="relative z-10">
              <div className="text-left border-b border-stroke/40 pb-4 mb-6">
                <span className="text-[10px] text-muted uppercase tracking-[0.25em] font-semibold">Selamat Datang</span>
                <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-1">
                  HighlanderStay
                </h3>
              </div>

              {/* Login / Register Toggle */}
              <div className="grid grid-cols-2 bg-bg border border-stroke p-1 rounded-full mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                  }}
                  className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2 transition-all duration-300 ${
                    activeTab === 'login' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                  }`}
                >
                  Masuk (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    resetRegisterState();
                  }}
                  className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2 transition-all duration-300 ${
                    activeTab === 'register' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                  }`}
                >
                  Daftar (Sign Up)
                </button>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-xl mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {activeTab === 'login' ? (
                  <>
                    {/* PHONE & PASSWORD LOGIN */}
                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Nomor WhatsApp</label>
                      <input 
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="e.g. 08123456789"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 text-left">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Kata Sandi</label>
                      <input 
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan kata sandi"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-3"
                    >
                      <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                      {isSubmitting ? 'Memproses...' : 'Masuk'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* SIGN UP FLOW */}
                    {!otpVerified ? (
                      <>
                        {/* Step 1: Request and Verify OTP */}
                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium">Nomor WhatsApp</label>
                          <div className="flex gap-2">
                            <input 
                              type="tel"
                              required
                              value={registerPhone}
                              disabled={otpSent}
                              onChange={(e) => setRegisterPhone(e.target.value)}
                              placeholder="e.g. 08123456789"
                              className="flex-1 bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200 disabled:opacity-50"
                            />
                            {!otpSent && (
                              <button
                                type="button"
                                onClick={handleRequestOtp}
                                disabled={isSubmitting}
                                className="bg-white/10 border border-white/5 hover:bg-white/15 text-text-primary text-xs font-semibold px-4 rounded-xl transition-all"
                              >
                                Kirim OTP
                              </button>
                            )}
                          </div>
                        </div>

                        {otpSent && (
                          <div className="flex flex-col gap-1.5 text-left animate-fade-in">
                            <label className="text-xs text-muted uppercase tracking-wider font-medium">Kode OTP (6 Digit)</label>
                            <input 
                              type="text"
                              required
                              maxLength={6}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="Masukkan 6 digit kode"
                              className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200 text-center tracking-[0.25em] font-bold"
                            />
                            <div className="flex justify-between items-center mt-1">
                              <button
                                type="button"
                                onClick={() => setOtpSent(false)}
                                className="text-[10px] text-blue-400 hover:underline"
                              >
                                Ganti nomor telepon
                              </button>
                              {countdown > 0 ? (
                                <span className="text-[10px] text-muted">Kirim ulang dalam {countdown}s</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleRequestOtp}
                                  className="text-[10px] text-text-primary font-semibold hover:underline"
                                >
                                  Kirim ulang OTP
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={isSubmitting || otpCode.length !== 6}
                              className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-4"
                            >
                              Verifikasi OTP
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col gap-4 animate-fade-in">
                        {/* Step 2: Name and Password Registration */}
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl mb-2 text-center">
                          ✓ Nomor WhatsApp berhasil diverifikasi!
                        </div>

                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium">Nama Lengkap</label>
                          <input 
                            type="text"
                            required
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            placeholder="Nama lengkap Anda"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5 text-left">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium">Kata Sandi Baru</label>
                          <input 
                            type="password"
                            required
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            placeholder="Masukkan kata sandi baru"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-3"
                        >
                          <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                          {isSubmitting ? 'Mendaftarkan...' : 'Daftar & Masuk'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
