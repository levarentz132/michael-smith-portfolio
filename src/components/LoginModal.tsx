import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  loginTenant, 
  registerTenant, 
  verifyPhoneOtp, 
  sendPhoneOtp, 
  forgotPassword, 
  resetPassword,
  fetchCaptcha,
  type CaptchaData
} from '../api';
import type { UserSession } from '../api';
import { 
  ShieldCheck, 
  Lock, 
  Phone, 
  User,
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  KeyRound, 
  Eye, 
  EyeOff
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  initialTab?: 'login' | 'register';
}

type ModalMode = 'login' | 'register' | 'reg_otp' | 'forgot_request' | 'forgot_reset';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login'
}) => {
  const [mode, setMode] = useState<ModalMode>('login');

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields (Name, Phone and Password)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegPasswordConfirm, setShowRegPasswordConfirm] = useState(false);

  // Captcha state (Anti-Bot Security Challenge)
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // Registration OTP state
  const [registrationToken, setRegistrationToken] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [regCountdown, setRegCountdown] = useState(0);
  const [isResendingRegOtp, setIsResendingRegOtp] = useState(false);

  // Forgot Password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetTarget, setResetTarget] = useState('');
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [isResendingForgotOtp, setIsResendingForgotOtp] = useState(false);

  // Status & loading states
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const data = await fetchCaptcha();
      setCaptchaData(data);
      setCaptchaAnswer('');
    } catch (err) {
      console.warn('Captcha load error:', err);
    } finally {
      setCaptchaLoading(false);
    }
  };

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      const targetMode = initialTab === 'register' ? 'register' : 'login';
      setMode(targetMode);
      setError('');
      setSuccessMsg('');
      setOtpCode('');
      setResetOtpCode('');
      setRegistrationToken('');
      setResetToken('');
      setShowLoginPassword(false);
      setShowRegPassword(false);
      setShowRegPasswordConfirm(false);
      setShowNewPassword(false);
      setShowNewPasswordConfirm(false);
      setCaptchaAnswer('');
      if (targetMode === 'register') {
        loadCaptcha();
      }
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (mode === 'register' || mode === 'forgot_request') {
      loadCaptcha();
    }
  }, [mode]);

  // Registration countdown timer
  useEffect(() => {
    let timer: any;
    if (regCountdown > 0) {
      timer = setInterval(() => {
        setRegCountdown(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [regCountdown]);

  // Forgot password countdown timer
  useEffect(() => {
    let timer: any;
    if (forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [forgotCountdown]);

  // 1. Handle Tenant Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Harap masukkan nomor WhatsApp dan kata sandi Anda.');
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
      setError(err.message || 'Login gagal. Periksa kembali nomor WhatsApp dan kata sandi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Tenant Registration (Name, Phone and Password)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanName = regName.trim();
    const cleanPhone = regPhone.trim();

    if (!cleanName) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    if (!cleanPhone || !regPassword) {
      setError('Nomor WhatsApp dan kata sandi wajib diisi.');
      return;
    }

    if (cleanPhone.length < 9) {
      setError('Nomor WhatsApp tidak valid. Masukkan nomor yang aktif.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Kata sandi minimal harus 8 karakter.');
      return;
    }

    if (regPassword !== regPasswordConfirm) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!captchaAnswer.trim()) {
      setError('Harap hitung dan masukkan jawaban kode keamanan (Captcha).');
      return;
    }

    setIsSubmitting(true);
    try {
      const regRes = await registerTenant({
        name: cleanName,
        phone: cleanPhone,
        password: regPassword,
        password_confirmation: regPasswordConfirm,
        otp_channel: 'whatsapp',
        device_name: 'highlanderstay-web',
        captcha_key: captchaData?.captcha_key,
        captcha_answer: captchaAnswer.trim()
      });

      setRegistrationToken(regRes.registration_token);
      setPendingPhone(cleanPhone);
      setMode('reg_otp');
      setSuccessMsg(regRes.message || 'Kode OTP telah dikirimkan ke nomor WhatsApp Anda.');
      setRegCountdown(60);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Pendaftaran gagal. Silakan periksa nomor WhatsApp Anda.');
      loadCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Registration OTP Verification
  const handleVerifyRegOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otpCode || otpCode.trim().length < 4) {
      setError('Harap masukkan 6 digit kode OTP yang valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activePhone = (pendingPhone || regPhone).trim();
      const { session, response } = await verifyPhoneOtp({
        registration_token: registrationToken || undefined,
        login: activePhone || undefined,
        phone: activePhone || undefined,
        channel: 'whatsapp',
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

  // 4. Resend Registration OTP
  const handleResendRegOtp = async () => {
    setError('');
    setSuccessMsg('');
    setIsResendingRegOtp(true);
    try {
      const activePhone = (pendingPhone || regPhone).trim();
      const res = await sendPhoneOtp({
        registration_token: registrationToken || undefined,
        login: activePhone || undefined,
        phone: activePhone || undefined,
        channel: 'whatsapp'
      });
      setSuccessMsg(res.message || 'Kode OTP baru telah dikirimkan ke WhatsApp.');
      setRegCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang OTP. Silakan tunggu beberapa saat.');
    } finally {
      setIsResendingRegOtp(false);
    }
  };

  // 5. Handle Forgot Password Request (Send Reset OTP)
  const handleForgotRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanLogin = forgotIdentifier.trim();
    if (!cleanLogin) {
      setError('Harap masukkan nomor WhatsApp yang terdaftar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPassword({
        login: cleanLogin,
        channel: 'whatsapp'
      });

      setResetToken(res.reset_token);
      setResetTarget(res.target || cleanLogin);
      setMode('forgot_reset');
      setSuccessMsg(res.message || 'Kode verifikasi reset password berhasil dikirimkan via WhatsApp.');
      setForgotCountdown(60);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || 'Gagal mengirim kode reset password. Pastikan akun sudah terdaftar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Handle Reset Password with OTP
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanCode = resetOtpCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setError('Harap masukkan 6 digit kode OTP yang valid.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('Kata sandi baru minimal harus 8 karakter.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { session, message } = await resetPassword({
        reset_token: resetToken || undefined,
        login: forgotIdentifier.trim(),
        code: cleanCode,
        otp: cleanCode,
        password: newPassword,
        password_confirmation: newPasswordConfirm,
        device_name: 'highlanderstay-web'
      });

      localStorage.setItem('userSession', JSON.stringify(session));
      if (session.token) {
        localStorage.setItem('authToken', session.token);
      }

      setSuccessMsg(message || 'Password berhasil direset! Anda telah otomatis masuk.');
      onLoginSuccess(session);

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Gagal mereset kata sandi. Periksa kembali kode OTP Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Resend Forgot Password OTP
  const handleResendForgotOtp = async () => {
    setError('');
    setSuccessMsg('');
    setIsResendingForgotOtp(true);
    try {
      const res = await forgotPassword({
        login: forgotIdentifier.trim(),
        channel: 'whatsapp'
      });
      setResetToken(res.reset_token);
      setSuccessMsg(res.message || 'Kode OTP baru telah dikirimkan via WhatsApp.');
      setForgotCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang OTP. Silakan tunggu hitung mundur selesai.');
    } finally {
      setIsResendingForgotOtp(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
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
            className="relative w-full max-w-md bg-surface border border-stroke rounded-2xl sm:rounded-[32px] p-5 sm:p-8 overflow-y-auto max-h-[92vh] shadow-2xl text-left"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-5 right-5 text-muted hover:text-text-primary text-xl transition-colors duration-200 z-20"
              aria-label="Tutup"
            >
              ✕
            </button>

            {/* Halftone Overlay & Ambient glow */}
            <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">

              {/* VIEW 1: AUTH (LOGIN OR REGISTER) */}
              {(mode === 'login' || mode === 'register') && (
                <>
                  {/* Header */}
                  <div className="text-left border-b border-stroke/40 pb-4 mb-5">
                    <span className="text-[10px] text-muted uppercase tracking-[0.25em] font-semibold flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" /> Portal Penyewa Highlanderstay
                    </span>
                    <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-1">
                      {mode === 'login' ? 'Masuk ke Akun Anda' : 'Daftar Akun Baru'}
                    </h3>
                  </div>

                  {/* Tabs: Masuk vs Daftar */}
                  <div className="grid grid-cols-2 bg-bg border border-stroke p-1 rounded-full mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2.5 transition-all duration-300 ${
                        mode === 'login' ? 'text-bg bg-text-primary shadow' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Masuk (Login)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2.5 transition-all duration-300 ${
                        mode === 'register' ? 'text-bg bg-text-primary shadow' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Daftar Akun
                    </button>
                  </div>

                  {/* Error & Success Alerts */}
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

                  {/* FORM A: LOGIN */}
                  {mode === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <Phone size={12} /> Nomor WhatsApp
                        </label>
                        <input 
                          type="tel"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="contoh: 081234567890"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary transition-colors duration-200 font-sans"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <Lock size={12} /> Kata Sandi
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setMode('forgot_request');
                              setForgotIdentifier(loginIdentifier.trim());
                              setError('');
                              setSuccessMsg('');
                            }}
                            className="text-[11px] text-muted hover:text-text-primary underline font-medium transition-colors"
                          >
                            Lupa Kata Sandi?
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type={showLoginPassword ? "text" : "password"}
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Masukkan kata sandi Anda"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 pr-10 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary transition-colors duration-200 font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors"
                            tabIndex={-1}
                          >
                            {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-2 shadow-lg disabled:opacity-50 cursor-pointer"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        {isSubmitting ? 'Memproses...' : 'Masuk Akun'}
                        <ArrowRight size={14} />
                      </button>
                    </form>
                  ) : (
                    /* FORM B: REGISTER (Name, Phone & Password) */
                    <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <User size={12} /> Nama Lengkap
                        </label>
                        <input 
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="contoh: Budi Santoso"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <Phone size={12} /> Nomor WhatsApp Aktif
                        </label>
                        <input 
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="contoh: 081234567890"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                        />
                        <span className="text-[10px] text-muted">
                          Kode verifikasi OTP 6-digit akan dikirimkan ke WhatsApp ini.
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <Lock size={12} /> Kata Sandi
                        </label>
                        <div className="relative">
                          <input 
                            type={showRegPassword ? "text" : "password"}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Minimal 8 karakter"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 pr-10 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors"
                            tabIndex={-1}
                          >
                            {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                          <Lock size={12} /> Konfirmasi Kata Sandi
                        </label>
                        <div className="relative">
                          <input 
                            type={showRegPasswordConfirm ? "text" : "password"}
                            required
                            value={regPasswordConfirm}
                            onChange={(e) => setRegPasswordConfirm(e.target.value)}
                            placeholder="Ulangi kata sandi Anda"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 pr-10 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPasswordConfirm(!showRegPasswordConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors"
                            tabIndex={-1}
                          >
                            {showRegPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Anti-Bot Security Captcha Challenge */}
                      <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-surface/50 border border-stroke/70">
                        <div className="flex items-center justify-between text-xs text-muted font-medium">
                          <label className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-sky-400 font-semibold">
                            <ShieldCheck size={13} /> Verifikasi Keamanan (Anti-Bot)
                          </label>
                          <button
                            type="button"
                            onClick={loadCaptcha}
                            disabled={captchaLoading}
                            className="flex items-center gap-1 text-[11px] text-muted hover:text-text-primary transition-colors cursor-pointer"
                            title="Ganti Kode Keamanan"
                          >
                            <RefreshCw size={11} className={captchaLoading ? 'animate-spin' : ''} />
                            <span>Ganti Kode</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Visual Captcha Image / SVG Container */}
                          <div 
                            className="shrink-0 flex items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 px-2 py-1 select-none overflow-hidden"
                            style={{ minHeight: '38px', minWidth: '130px' }}
                            dangerouslySetInnerHTML={{ __html: captchaData?.svg || '<span class="text-xs text-slate-400">Memuat...</span>' }}
                          />

                          {/* Captcha Answer Input */}
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                            placeholder="Jawaban angka"
                            className="w-full bg-bg border border-stroke rounded-xl px-3 py-2.5 text-center text-base sm:text-sm font-mono font-bold text-text-primary placeholder:text-muted/40 focus:outline-none focus:border-sky-400 transition-colors"
                          />
                        </div>
                        <span className="text-[10px] text-muted">
                          Hitung hasil persamaan di samping untuk verifikasi anti-spam OTP.
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !captchaAnswer.trim()}
                        className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-2 shadow-lg disabled:opacity-50 cursor-pointer"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        {isSubmitting ? 'Mendaftarkan...' : 'Daftar dengan WhatsApp'}
                        <ArrowRight size={14} />
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* VIEW 2: REGISTRATION OTP VERIFICATION */}
              {mode === 'reg_otp' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-4 text-left"
                >
                  <div className="border-b border-stroke/40 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
                      <ShieldCheck size={24} />
                    </div>
                    <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold">Verifikasi Pendaftaran</span>
                    <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-1">
                      Verifikasi Nomor WhatsApp
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mt-1">
                      Masukkan 6 digit kode OTP yang kami kirimkan ke WhatsApp Anda (<strong>{pendingPhone || regPhone}</strong>).
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

                  <form onSubmit={handleVerifyRegOtpSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5 items-center">
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-56 bg-bg border-2 border-stroke focus:border-emerald-400 rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-text-primary focus:outline-none transition-colors"
                      />
                      <span className="text-[11px] text-muted mt-1">
                        Kode 6-digit OTP berlaku selama 10 menit
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || otpCode.length < 4}
                      className="w-full rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-emerald-500 text-bg hover:bg-emerald-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? 'Memverifikasi...' : 'Verifikasi & Selesaikan Pendaftaran'}
                      <CheckCircle2 size={15} />
                    </button>

                    <div className="flex items-center justify-between text-xs text-muted pt-2">
                      {regCountdown > 0 ? (
                        <span>Kirim ulang dalam <strong className="text-text-primary">{regCountdown}d</strong></span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendRegOtp}
                          disabled={isResendingRegOtp}
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RefreshCw size={12} className={isResendingRegOtp ? 'animate-spin' : ''} />
                          Kirim Ulang OTP
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-muted hover:text-text-primary underline text-[11px] cursor-pointer"
                      >
                        Kembali ke pendaftaran
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* VIEW 3: FORGOT PASSWORD REQUEST (ENTER PHONE / EMAIL) */}
              {mode === 'forgot_request' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-4 text-left"
                >
                  <div className="border-b border-stroke/40 pb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
                      <KeyRound size={24} />
                    </div>
                    <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold">Pemulihan Akun</span>
                    <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-1">
                      Lupa Kata Sandi?
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mt-1">
                      Masukkan nomor WhatsApp Anda yang terdaftar. Kami akan mengirimkan 6-digit kode verifikasi OTP via WhatsApp.
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

                  <form onSubmit={handleForgotRequestSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <Phone size={12} /> Nomor WhatsApp Terdaftar
                      </label>
                      <input 
                        type="tel"
                        required
                        autoFocus
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="contoh: 081234567890"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-amber-400 text-bg hover:bg-amber-300 transition-all duration-300 flex items-center justify-center gap-2 border border-transparent shadow-lg disabled:opacity-50 cursor-pointer font-bold"
                    >
                      {isSubmitting ? 'Mengirim Kode OTP...' : 'Kirim Kode OTP WhatsApp'}
                      <ArrowRight size={14} />
                    </button>

                    <div className="flex items-center justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-muted hover:text-text-primary inline-flex items-center gap-1 text-xs cursor-pointer transition-colors"
                      >
                        <ArrowLeft size={13} />
                        Kembali ke Halaman Masuk
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* VIEW 4: FORGOT PASSWORD RESET (ENTER OTP & NEW PASSWORD) */}
              {mode === 'forgot_reset' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col gap-3.5 text-left"
                >
                  <div className="border-b border-stroke/40 pb-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-2">
                      <Lock size={24} />
                    </div>
                    <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold">Verifikasi OTP & Reset</span>
                    <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-0.5">
                      Buat Kata Sandi Baru
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mt-1">
                      Masukkan kode OTP yang dikirimkan ke WhatsApp (<strong>{resetTarget || forgotIdentifier}</strong>) dan kata sandi baru Anda.
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

                  <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1 items-center bg-bg/50 border border-stroke/50 rounded-2xl p-3">
                      <label className="text-[11px] text-muted font-medium uppercase tracking-wider">
                        Kode OTP 6-Digit WhatsApp
                      </label>
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        autoFocus
                        value={resetOtpCode}
                        onChange={(e) => setResetOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-48 bg-bg border-2 border-stroke focus:border-emerald-400 rounded-xl px-3 py-2 text-center text-xl font-mono tracking-[0.5em] text-text-primary focus:outline-none transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <Lock size={12} /> Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimal 8 karakter"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 pr-10 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
                        <Lock size={12} /> Konfirmasi Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input 
                          type={showNewPasswordConfirm ? "text" : "password"}
                          required
                          value={newPasswordConfirm}
                          onChange={(e) => setNewPasswordConfirm(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 pr-10 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-text-primary font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors"
                          tabIndex={-1}
                        >
                          {showNewPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || resetOtpCode.length < 4}
                      className="w-full rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-emerald-500 text-bg hover:bg-emerald-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer mt-1"
                    >
                      {isSubmitting ? 'Mereset Kata Sandi...' : 'Simpan Sandi & Masuk Otomatis'}
                      <CheckCircle2 size={15} />
                    </button>

                    <div className="flex items-center justify-between text-xs text-muted pt-1">
                      {forgotCountdown > 0 ? (
                        <span>Kirim ulang dalam <strong className="text-text-primary">{forgotCountdown}d</strong></span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendForgotOtp}
                          disabled={isResendingForgotOtp}
                          className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RefreshCw size={12} className={isResendingForgotOtp ? 'animate-spin' : ''} />
                          Kirim Ulang OTP
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="text-muted hover:text-text-primary underline text-[11px] cursor-pointer"
                      >
                        Kembali ke Masuk
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
