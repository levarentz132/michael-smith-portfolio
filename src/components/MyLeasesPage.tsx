import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  Receipt,
  Wrench,
  Settings,
  LogOut,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { UserSession, TenantLease, WebsiteSettings } from '../api';
import { fetchTenantLeases, fetchTenantDashboard, loginTenant } from '../api';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { LoginModal } from './LoginModal';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useSEO } from '../hooks/useSEO';
import { useI18n } from '../utils/i18n';

export interface MyLeasesPageProps {
  session: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  settings?: WebsiteSettings | null;
}

export const MyLeasesPage: React.FC<MyLeasesPageProps> = ({
  session,
  onLoginSuccess,
  onLogout,
  settings
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  useSEO({
    title: session ? `Kamar & Sewa Aktif - ${session.name} | Highlanderstay` : 'Sewa Aktif & Kamar Saya | Highlanderstay',
    description: 'Informasi lengkap kamar sewa aktif penghuni, masa berlaku sewa, besaran deposit, dan riwayat kamar di Highlanderstay.',
    keywords: 'sewa aktif, kamar saya, kontrak sewa kos, deposit kamar kos, penghuni highlanderstay',
    canonicalUrl: 'https://highlanderstay.com/sewa',
    enabled: true
  });

  const [leases, setLeases] = useState<TenantLease[]>([]);
  const [leaseHistory, setLeaseHistory] = useState<TenantLease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Unauthenticated login modal state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [quickLoginPhone, setQuickLoginPhone] = useState('');
  const [quickLoginPassword, setQuickLoginPassword] = useState('');
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const [quickLoginError, setQuickLoginError] = useState('');

  const formatRupiah = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

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

  const loadLeasesData = useCallback(async () => {
    if (!session?.token) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [leasesRes, dashRes] = await Promise.all([
        fetchTenantLeases(session.token).catch((err) => {
          console.warn('Leases fetch notice:', err.message);
          return null;
        }),
        fetchTenantDashboard(session.token).catch((err) => {
          console.warn('Dashboard fetch notice:', err.message);
          return null;
        })
      ]);

      if (leasesRes?.current_leases) {
        setLeases(leasesRes.current_leases);
      } else if (dashRes?.active_lease) {
        setLeases([dashRes.active_lease]);
      }

      if (leasesRes?.lease_history) {
        setLeaseHistory(leasesRes.lease_history);
      }
    } catch (err: any) {
      console.error('Error loading leases:', err);
      setErrorMessage(err?.message || 'Gagal memuat data sewa kamar.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    if (session?.token) {
      loadLeasesData();
    }
  }, [session?.token, loadLeasesData]);

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

  return (
    <div className="min-h-screen bg-[#070a12] text-text-primary flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      <Navbar
        activeSection="sewa"
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
        {/* Navigation Breadcrumb & Back Header */}
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
                <span>Kamar & Sewa Aktif</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Kos Saya
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Informasi kamar yang sedang Anda sewa, masa jatuh tempo, dan fasilitas unit
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
                <Building2 size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Lihat Kamar Sewa Anda</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Masuk ke akun penghuni untuk melihat detail kontrak sewa, jatuh tempo sewa, dan informasi nomor kamar aktif Anda.
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
            {/* Leases List */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Memuat data sewa aktif...</span>
              </div>
            ) : errorMessage ? (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={loadLeasesData}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-bold"
                >
                  Coba Lagi
                </button>
              </div>
            ) : leases.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3.5 shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <Building2 size={36} />
                </div>
                <div className="text-base sm:text-lg font-bold text-white">Belum Ada Kamar Aktif</div>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                  Anda belum memiliki masa sewa aktif yang tercatat di sistem kami. Temukan kamar idaman Anda melalui katalog kos premium kami.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigate('/katalog')}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Buka Katalog Kamar</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/map')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    Peta Lokasi Kos
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {leases.map((lease) => (
                  <div
                    key={lease.id}
                    className="p-5 sm:p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          Ref: {lease.reference || `#LS-${lease.id}`}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                          {lease.unit?.name ? `Kamar ${lease.unit.name}` : 'Kamar Kos'}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 size={13} className="text-amber-400" />
                          <span>{lease.property?.name || 'Highlanderstay'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            lease.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : lease.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {lease.status === 'active' ? '● Sewa Aktif' : lease.status}
                        </span>
                      </div>
                    </div>

                    {/* Lease Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500">Harga Sewa</span>
                        <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                          {formatRupiah(lease.rent_amount)}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            / {lease.billing_label || lease.billing_cycle || 'bln'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500">Uang Jaminan (Deposit)</span>
                        <div className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5">
                          {formatRupiah(lease.deposit_amount)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500">Mulai Sewa</span>
                        <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                          {formatDate(lease.start_date)}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500">Jatuh Tempo / Selesai</span>
                        <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                          {formatDate(lease.end_date)}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons for this lease */}
                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/60 flex-wrap">
                      <Link
                        to="/tagihan"
                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                      >
                        <Receipt size={13} />
                        <span>Lihat Tagihan Sewa</span>
                      </Link>

                      <Link
                        to="/komplain"
                        className="px-3.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Wrench size={13} />
                        <span>Lapor Kendala Kamar</span>
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Lease History if any */}
                {leaseHistory.length > 0 && (
                  <div className="pt-6 border-t border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>Riwayat Sewa Sebelumnya</span>
                    </h3>
                    <div className="space-y-2">
                      {leaseHistory.map((oldLease) => (
                        <div
                          key={oldLease.id}
                          className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-300">
                              {oldLease.unit?.name ? `Kamar ${oldLease.unit.name}` : 'Unit Kos'}
                            </span>
                            <span className="text-slate-500 ml-2">
                              ({formatDate(oldLease.start_date)} - {formatDate(oldLease.end_date)})
                            </span>
                          </div>
                          <span className="text-slate-500 text-[10px] uppercase font-mono">
                            {oldLease.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer settings={settings} />

      {/* Global Login Modal fallback */}
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
