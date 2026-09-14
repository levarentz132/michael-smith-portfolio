import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginTenant, registerTenant, verifyPhoneOtp, sendPhoneOtp } from '../api';
import type { UserSession } from '../api';
import { ShieldCheck, Mail, Lock, Phone, User, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  initialTab?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login'
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields (accepts email OR phone number)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');

  // OTP Verification state
  const [step, setStep] = useState<'auth' | 'otp'>('auth');
  const [registrationToken, setRegistrationToken] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  // Status & loading states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial tab when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setStep('auth');
      setError('');
      setSuccessMsg('');
      setOtpCode('');
      setRegistrationToken('');
    }
  }, [isOpen, initialTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Harap masukkan email/nomor telepon dan kata sandi Anda.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { session, token } = await loginTenant({
        login: loginIdentifier.trim(),
        password: loginPassword,
        device_name: 'highlanderstay-web'
      });

      localStorage.setItem('userSession', JSON.stringify(session));
      if (token) {
        localStorage.setItem('authToken', token);
      }

      onLoginSuccess(session);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login gagal. Periksa kembali email/nomor telepon dan kata sandi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword) {
      setError('Semua kolom pendaftaran wajib diisi.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Kata sandi minimal harus 8 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const regRes = await registerTenant({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        password_confirmation: regPasswordConfirm,
        otp_channel: 'whatsapp',
        device_name: 'highlanderstay-web'
      });

      setRegistrationToken(regRes.registration_token);
      setPendingPhone(regPhone.trim());
      setStep('otp');
      setSuccessMsg(regRes.message || 'Kode OTP telah dikirimkan ke WhatsApp Anda.');
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
      console.error('Register error:', err);
      setError(err.message || 'Pendaftaran gagal. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpCode || otpCode.trim().length < 4) {
      setError('Harap masukkan 6 digit kode OTP yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { session, response } = await verifyPhoneOtp({
        registration_token: registrationToken || undefined,
        login: !registrationToken ? (pendingPhone || loginIdentifier.trim()) : undefined,
        code: otpCode.trim(),
        device_name: 'highlanderstay-web'
      });

      localStorage.setItem('userSession', JSON.stringify(session));
      if (session.token) {
        localStorage.setItem('authToken', session.token);
      }

      setSuccessMsg(response.message || 'Verifikasi berhasil! Akun Anda telah aktif.');
      onLoginSuccess(session);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError(err.message || 'Kode OTP salah atau telah kadaluarsa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccessMsg('');
    setIsResendingOtp(true);
    try {
      const res = await sendPhoneOtp({
        registration_token: registrationToken || undefined,
        login: !registrationToken ? (pendingPhone || loginIdentifier.trim()) : undefined,
        channel: 'whatsapp'
      });
      setSuccessMsg(res.message || 'Kode OTP baru telah dikirimkan ke WhatsApp.');
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
      setError(err.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setIsResendingOtp(false);
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

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full max-w-md bg-surface border border-stroke rounded-[32px] p-6 sm:p-8 overflow-hidden shadow-2xl text-left"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 text-muted hover:text-text-primary text-xl transition-colors duration-200 z-20"
            >
              ✕
            </button>

            {/* Halftone Overlay & Ambient glow */}
            <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {step === 'auth' ? (
                <>
                  {/* Header */}
                  <div className="text-left border-b border-stroke/40 pb-4 mb-5">
                    <span className="text-[10px] text-muted uppercase tracking-[0.25em] font-semibold flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" /> Portal Penyewa Highlanderstay
                    </span>
                    <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-1">
                      {activeTab === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
                    </h3>
                  </div>

                  {/* Tabs: Masuk vs Daftar */}
                  <div className="grid grid-cols-2 bg-bg border border-stroke p-1 rounded-full mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2.5 transition-all duration-300 ${
                        activeTab === 'login' ? 'text-bg bg-text-primary shadow' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Masuk (Login)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2.5 transition-all duration-300 ${
                        activeTab === 'register' ? 'text-bg bg-text-primary shadow' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Daftar Akun
                    </button>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-xl mb-4 flex items-start gap-2"
                    >
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl mb-4 flex items-start gap-2"
                    >
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}

                  {/* LOGIN FORM */}
                  {activeTab === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <Mail size={12} /> Email atau Nomor WhatsApp
                        </label>
                        <input 
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="contoh@email.com atau 08123456789"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary transition-colors duration-200 font-sans"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <Lock size={12} /> Kata Sandi
                        </label>
                        <input 
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Masukkan kata sandi Anda"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary transition-colors duration-200 font-sans"
                        />
                        <span className="text-[10px] text-muted leading-tight mt-0.5">
                          Gunakan email atau nomor WhatsApp yang telah terdaftar pada HighlanderStay.
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-2 shadow-lg disabled:opacity-50"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        {isSubmitting ? 'Memproses...' : 'Masuk Akun'}
                        <ArrowRight size={14} />
                      </button>
                    </form>
                  ) : (
                    /* REGISTER FORM */
                    <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <User size={12} /> Nama Lengkap
                        </label>
                        <input 
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Nama lengkap Anda"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <Mail size={12} /> Alamat Email
                        </label>
                        <input 
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="email-anda@contoh.com"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <Phone size={12} /> No. WhatsApp Aktif
                        </label>
                        <input 
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="081234567890"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                        />
                        <span className="text-[10px] text-muted">
                          Kode OTP verifikasi akan dikirimkan ke nomor WhatsApp ini.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <Lock size={12} /> Kata Sandi
                          </label>
                          <input 
                            type="password"
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Min. 8 karakter"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <Lock size={12} /> Konfirmasi
                          </label>
                          <input 
                            type="password"
                            required
                            value={regPasswordConfirm}
                            onChange={(e) => setRegPasswordConfirm(e.target.value)}
                            placeholder="Ulangi sandi"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-2 shadow-lg disabled:opacity-50"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        {isSubmitting ? 'Mendaftarkan...' : 'Daftar Akun Penyewa'}
                        <ArrowRight size={14} />
                      </button>
                    </form>
                  )}
                </>
              ) : (
                /* OTP VERIFICATION STEP */
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-4 text-left"
                >
                  <div className="border-b border-stroke/40 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
                      <ShieldCheck size={24} />
                    </div>
                    <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold">Verifikasi Keamanan</span>
                    <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-1">
                      Verifikasi Nomor WhatsApp
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mt-1">
                      Masukkan 6 digit kode OTP yang kami kirimkan ke WhatsApp Anda ({pendingPhone || regPhone}).
                    </p>
                  </div>

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-xl flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl flex items-start gap-2">
                      <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyOtpSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5 items-center">
                      <input 
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-56 bg-bg border-2 border-stroke focus:border-emerald-400 rounded-2xl px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-text-primary focus:outline-none transition-colors"
                      />
                      <span className="text-[11px] text-muted mt-1">
                        Kode 6-digit OTP berlaku selama 10 menit
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || otpCode.length < 4}
                      className="w-full rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-emerald-500 text-bg hover:bg-emerald-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Memverifikasi...' : 'Verifikasi & Selesai'}
                      <CheckCircle2 size={15} />
                    </button>

                    <div className="flex items-center justify-between text-xs text-muted pt-2">
                      {countdown > 0 ? (
                        <span>Kirim ulang dalam <strong className="text-text-primary">{countdown} detik</strong></span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isResendingOtp}
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <RefreshCw size={12} className={isResendingOtp ? 'animate-spin' : ''} />
                          Kirim Ulang OTP
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setStep('auth');
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-muted hover:text-text-primary underline text-[11px]"
                      >
                        Kembali ke pendaftaran
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
