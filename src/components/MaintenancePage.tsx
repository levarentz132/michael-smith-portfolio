import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  ArrowLeft,
  Building2,
  Settings,
  LogOut,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  X,
  Send,
  RefreshCw
} from 'lucide-react';
import type { UserSession, MaintenanceTicket, WebsiteSettings } from '../api';
import {
  fetchMaintenanceTickets,
  createMaintenanceTicket,
  loginTenant
} from '../api';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { LoginModal } from './LoginModal';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useLiveChat } from '../utils/liveChat';
import { useSEO } from '../hooks/useSEO';
import { useI18n } from '../utils/i18n';

export interface MaintenancePageProps {
  session: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  settings?: WebsiteSettings | null;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  session,
  onLoginSuccess,
  onLogout,
  settings
}) => {
  const navigate = useNavigate();
  const { openChat } = useLiveChat();
  const { t } = useI18n();

  useSEO({
    title: session ? `Layanan Komplain - ${session.name} | Highlanderstay` : 'Layanan Komplain & Kendala | Highlanderstay',
    description: 'Laporkan kendala fasilitas kamar, AC, kelistrikan, dan perbaikan kos cepat tanggap di Highlanderstay.',
    keywords: 'komplain fasilitas kos, lapor kendala kamar, perbaikan ac kos, tiket teknisi kos jakarta',
    canonicalUrl: 'https://highlanderstay.com/komplain',
    enabled: true
  });

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Ticket Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketLocation, setTicketLocation] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketMessage, setTicketMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Unauthenticated login state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [quickLoginPhone, setQuickLoginPhone] = useState('');
  const [quickLoginPassword, setQuickLoginPassword] = useState('');
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const [quickLoginError, setQuickLoginError] = useState('');

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '-';
    try {
      const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, y, m, d] = match;
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
          'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        const monthIndex = parseInt(m, 10) - 1;
        const dayNum = parseInt(d, 10);
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${dayNum} ${monthNames[monthIndex]} ${y}`;
        }
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const loadTicketsData = useCallback(async () => {
    if (!session?.token) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetchMaintenanceTickets(session.token);
      if (res?.tickets?.data) {
        setTickets(res.tickets.data);
      } else if (Array.isArray(res?.tickets)) {
        setTickets(res.tickets);
      }
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      setErrorMessage(err?.message || 'Gagal memuat daftar komplain kendala.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    if (session?.token) {
      loadTicketsData();
    }
  }, [session?.token, loadTicketsData]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) return;
    if (!ticketTitle.trim() || !ticketDescription.trim()) {
      setTicketMessage({ type: 'error', text: 'Judul dan deskripsi keluhan wajib diisi.' });
      return;
    }

    setIsSubmittingTicket(true);
    setTicketMessage(null);
    try {
      const res = await createMaintenanceTicket(
        {
          title: ticketTitle.trim(),
          description: ticketDescription.trim(),
          location: ticketLocation.trim() || undefined,
          priority: ticketPriority
        },
        session.token
      );

      setTicketMessage({
        type: 'success',
        text: res.message || 'Laporan kendala berhasil diajukan! Tim teknisi akan segera memeriksa.'
      });

      setTimeout(() => {
        setShowCreateModal(false);
        setTicketTitle('');
        setTicketDescription('');
        setTicketLocation('');
        setTicketMessage(null);
        loadTicketsData();
      }, 1600);
    } catch (err: any) {
      setTicketMessage({ type: 'error', text: err.message || 'Gagal mengajukan laporan kendala.' });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLoginPhone.trim() || !quickLoginPassword) {
      setQuickLoginError('Email dan kata sandi wajib diisi.');
      return;
    }
    setIsQuickLoggingIn(true);
    setQuickLoginError('');
    try {
      const response = await loginTenant({
        login: quickLoginPhone.trim(),
        password: quickLoginPassword
      });
      if (response?.session) {
        onLoginSuccess(response.session);
      }
    } catch (err: any) {
      setQuickLoginError(err?.message || 'Login gagal. Silakan periksa kembali email dan kata sandi.');
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  const openTicketsCount = tickets.filter(
    (t) => t.status === 'open' || t.status === 'in_progress' || t.status === 'pending'
  ).length;

  return (
    <div className="min-h-screen bg-[#070a12] text-text-primary flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      <Navbar
        activeSection="komplain"
        onNavClick={(sec) => {
          if (sec === 'home') navigate('/');
          else if (sec === 'work' || sec === 'katalog') navigate('/katalog');
          else if (sec === 'map') navigate('/map');
          else if (sec === 'resort') navigate('/resort');
          else if (sec === 'cart') navigate('/cart');
          else if (sec === 'akun') navigate('/akun');
          else navigate('/');
        }}
        session={session}
        onLogout={onLogout}
        onLoginClick={() => setLoginModalOpen(true)}
        onProfileClick={() => navigate('/akun')}
        onCartClick={() => navigate('/cart')}
        settings={settings}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto pt-20 sm:pt-24 md:pt-28 pb-28 px-3.5 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Link
              to="/akun"
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              title="Kembali ke Menu Akun"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
                <span>Layanan Komplain & Kendala</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">
                  Maintenance
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sampaikan keluhan fasilitas kamar, kerusakan AC, pipa air, atau kendala listrik kos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('hs-open-settings'))}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              title="Pengaturan"
            >
              <Settings size={16} />
            </button>
            {session && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <LogOut size={14} />
                <span className="hidden xs:inline">{t('portal_logout_btn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Unauthenticated View */}
        {!session ? (
          <div className="max-w-xl mx-auto my-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-sky-400/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/10">
                <Wrench size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Layanan Kendala Kamar</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Masuk ke akun Anda untuk membuat laporan perbaikan fasilitas atau mengecek status penanganan komplain Anda.
              </p>

              <div className="mb-5">
                <GoogleSignInButton
                  text="continue"
                  onSuccess={(sess) => onLoginSuccess(sess)}
                  clientId={settings?.google_client_id}
                />
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">atau dengan Email & Password</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
              </div>

              <form onSubmit={handleQuickLogin} className="space-y-3.5 text-left mb-6">
                {quickLoginError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{quickLoginError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Email</label>
                  <input
                    type="email"
                    value={quickLoginPhone}
                    onChange={(e) => setQuickLoginPhone(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kata Sandi</label>
                  <input
                    type="password"
                    value={quickLoginPassword}
                    onChange={(e) => setQuickLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isQuickLoggingIn}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isQuickLoggingIn ? 'Memproses Masuk...' : 'Masuk Sekarang'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header Action Bar */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-[#0e1320] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench size={14} className="text-sky-400" />
                  <span>Status Laporan Kendala</span>
                </span>
                <div className="text-xl sm:text-2xl font-black text-white mt-1">
                  {openTicketsCount > 0 ? `${openTicketsCount} Laporan Sedang Ditangani` : 'Semua Fasilitas Baik'}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tim teknisi kami siap membantu menangani perbaikan fasilitas kamar Anda
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 text-xs font-black shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Lapor Kendala Baru</span>
                </button>

                <button
                  type="button"
                  onClick={openChat}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  title="Hubungi Admin via Chat"
                >
                  <MessageCircle size={15} className="text-emerald-400" />
                  <span>Chat Admin Langsung</span>
                </button>
              </div>
            </div>

            {/* Tickets List */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Memuat riwayat kendala...</span>
              </div>
            ) : errorMessage ? (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={loadTicketsData}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-bold"
                >
                  Coba Lagi
                </button>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <Wrench size={36} />
                </div>
                <div className="text-base sm:text-lg font-bold text-white">Tidak Ada Tiket Kendala</div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Semua fasilitas kamar Anda dalam kondisi prima. Klik tombol di bawah ini jika terdapat kendala yang perlu kami bantu selesaikan.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
                >
                  <Plus size={14} />
                  <span>Buat Laporan Baru</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-lg space-y-2.5 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          #{t.reference || t.id}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">{t.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.description}</p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                          t.status === 'resolved' || t.status === 'closed'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : t.status === 'in_progress'
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {t.status === 'resolved'
                          ? 'Selesai'
                          : t.status === 'in_progress'
                          ? 'Diproses'
                          : 'Menunggu'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 flex-wrap">
                      <div className="flex items-center gap-3">
                        {t.location && (
                          <span className="flex items-center gap-1">
                            <Building2 size={12} className="text-slate-400" />
                            <span>{t.location}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatDate(t.created_at)}</span>
                        </span>
                      </div>

                      {t.priority && (
                        <span className="text-[10px] font-medium text-slate-400 uppercase">
                          Prioritas: {t.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Wrench size={16} className="text-sky-400" />
                    <span>Lapor Kendala / Kerusakan Kamar</span>
                  </h3>
                  <p className="text-xs text-slate-400">Tim teknisi kami akan menindaklanjuti laporan Anda</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setTicketMessage(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {ticketMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    ticketMessage.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {ticketMessage.type === 'success' ? (
                    <CheckCircle2 size={15} className="shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="shrink-0" />
                  )}
                  <span>{ticketMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Judul Kendala / Kerusakan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="Contoh: AC kamar bocor / tidak dingin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-sky-400 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Lokasi / Unit Kamar
                    </label>
                    <input
                      type="text"
                      value={ticketLocation}
                      onChange={(e) => setTicketLocation(e.target.value)}
                      placeholder="Contoh: Kamar 203 - Kamar Mandi"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tingkat Urgensi / Prioritas
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-sky-400 focus:outline-none"
                    >
                      <option value="low">Rendah (Pengecekan Biasa)</option>
                      <option value="medium">Sedang (Perlu Perbaikan)</option>
                      <option value="high">Tinggi (Mengganggu Kenyamanan)</option>
                      <option value="urgent">Mendesak (Air Mati / Korsleting Listrik)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deskripsi Lengkap Kendala <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Jelaskan secara rinci kendala yang terjadi, waktu mulai terjadi, dan detail pendukung lainnya..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-sky-400 focus:outline-none resize-none leading-relaxed"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black shadow-lg shadow-sky-500/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSubmittingTicket ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Kirim Laporan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer settings={settings} />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={(sess: UserSession) => {
          onLoginSuccess(sess);
          setLoginModalOpen(false);
        }}
      />
    </div>
  );
};
