import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  LogIn, 
  ArrowLeft, 
  ShieldCheck, 
  LogOut, 
  Building2, 
  Receipt, 
  Wrench, 
  CheckCircle2,
  Sparkles,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import type { UserSession, WebsiteSettings } from '../api';
import { fetchCart } from '../api';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { LoginModal } from './LoginModal';
import { TenantProfileModal } from './TenantProfileModal';
import { useSEO } from '../hooks/useSEO';

interface PortalPageProps {
  session: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  onSessionUpdate: (updated: UserSession) => void;
  settings?: WebsiteSettings | null;
}

export const PortalPage: React.FC<PortalPageProps> = ({
  session,
  onLoginSuccess,
  onLogout,
  onSessionUpdate,
  settings
}) => {
  const navigate = useNavigate();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<'login' | 'register'>('login');
  const [cartCount, setCartCount] = useState(0);

  useSEO({
    title: session ? `Portal Tenant (${session.name}) | Highlanderstay` : 'Masuk / Daftar Akun Tenant | Highlanderstay',
    description: 'Portal penghuni Highlanderstay: pantau status sewa kamar, tagihan invoice, bayar online, dan lapor komplain perbaikan.',
    keywords: 'portal tenant, login penghuni, bayar sewa kos, akun highlanderstay',
    canonicalUrl: 'https://highlanderstay.com/portal',
    enabled: true
  });

  const refreshCartCount = useCallback(async (e?: any) => {
    if (e?.detail?.count !== undefined && typeof e.detail.count === 'number') {
      setCartCount(e.detail.count);
      return;
    }
    try {
      const res = await fetchCart();
      setCartCount(res.cart?.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    refreshCartCount();
    window.addEventListener('cart-updated', refreshCartCount);
    window.addEventListener('storage', refreshCartCount);
    window.addEventListener('focus', refreshCartCount);
    return () => {
      window.removeEventListener('cart-updated', refreshCartCount);
      window.removeEventListener('storage', refreshCartCount);
      window.removeEventListener('focus', refreshCartCount);
    };
  }, [refreshCartCount]);

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'resort') {
      navigate('/resort');
      return;
    }
    if (sectionId === 'map' || sectionId === 'lokasi' || sectionId === 'peta') {
      navigate('/map');
      return;
    }
    if (sectionId === 'work' || sectionId === 'katalog' || sectionId === 'portfolio') {
      navigate('/katalog');
      return;
    }
    if (sectionId === 'cart' || sectionId === 'keranjang') {
      navigate('/cart');
      return;
    }
    if (sectionId === 'portal' || sectionId === 'login' || sectionId === 'akun') {
      navigate('/portal');
      return;
    }
    navigate('/');
  };

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'cart' | 'leases' | 'invoices' | 'maintenance' | 'profile'>('overview');

  const openDashboardTab = (tab: 'overview' | 'cart' | 'leases' | 'invoices' | 'maintenance' | 'profile') => {
    setDashboardTab(tab);
    setProfileModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col justify-between selection:bg-text-primary selection:text-bg">
      {/* Global Navbar */}
      <Navbar 
        activeSection="portal" 
        onNavClick={handleNavClick} 
        session={session}
        onLogout={onLogout}
        onLoginClick={() => {
          setInitialTab('login');
          setLoginModalOpen(true);
        }}
        onProfileClick={() => {
          openDashboardTab('overview');
        }}
        onCartClick={() => navigate('/cart')}
        cartCount={cartCount}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto pt-24 sm:pt-28 md:pt-32 pb-24 px-4 sm:px-6">
        {/* Top Header Navigation Bar */}
        <header className="flex items-center justify-between gap-3 mb-6 bg-surface/90 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to="/"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary hover:text-amber-400 transition-all shrink-0 active:scale-95"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold font-display text-text-primary flex items-center gap-2 truncate">
                <User size={19} className="text-amber-400 shrink-0" />
                <span>{session ? 'Portal Penghuni (Tenant)' : 'Akun & Login Penghuni'}</span>
              </h1>
              <p className="text-[11px] text-muted truncate">
                {session ? `Selamat datang, ${session.name}` : 'Akses tagihan sewa & layanan kamar praktis'}
              </p>
            </div>
          </div>

          {session && (
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden xs:inline">Keluar</span>
            </button>
          )}
        </header>

        {session ? (
          /* Logged in Tenant Dashboard */
          <div className="space-y-4">
            {/* Quick Profile Overview Card */}
            <div className="p-4 sm:p-6 rounded-3xl bg-surface/95 border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  {session.name ? session.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-text-primary truncate">{session.name}</h2>
                  <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>{session.phone || 'Nomor HP Terdaftar'}</span>
                    {session.phone_verified && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 size={11} />
                        <span>Terverifikasi</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openDashboardTab('overview')}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Buka Dashboard Lengkap</span>
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Feature Shortcuts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div
                onClick={() => openDashboardTab('leases')}
                className="p-4 sm:p-5 rounded-2xl bg-surface/80 hover:bg-surface border border-white/10 hover:border-amber-400/40 transition-all cursor-pointer space-y-2 group shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Building2 size={20} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Status Sewa Kamar</h3>
                <p className="text-[11px] text-muted leading-relaxed">Lihat tanggal jatuh tempo dan detail unit aktif Anda.</p>
              </div>

              <div
                onClick={() => openDashboardTab('invoices')}
                className="p-4 sm:p-5 rounded-2xl bg-surface/80 hover:bg-surface border border-white/10 hover:border-emerald-400/40 transition-all cursor-pointer space-y-2 group shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt size={20} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Tagihan & Pembayaran</h3>
                <p className="text-[11px] text-muted leading-relaxed">Bayar invoice bulanan instan dengan QRIS / Bank Transfer.</p>
              </div>

              <div
                onClick={() => openDashboardTab('maintenance')}
                className="p-4 sm:p-5 rounded-2xl bg-surface/80 hover:bg-surface border border-white/10 hover:border-sky-400/40 transition-all cursor-pointer space-y-2 group shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wrench size={20} />
                </div>
                <h3 className="text-sm font-bold text-text-primary">Komplain Perbaikan</h3>
                <p className="text-[11px] text-muted leading-relaxed">Lapor keluhan AC, lampu, air atau fasilitas kamar kapan saja.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Not logged in: Clean Presentation Card with Mobile-first touch targets */
          <div className="py-8 sm:py-12 px-4 sm:px-8 text-center bg-surface/80 border border-white/10 rounded-3xl shadow-2xl max-w-lg mx-auto backdrop-blur-xl">
            <div className="w-16 h-16 rounded-3xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-400/10">
              <ShieldCheck size={32} />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-3">
              <Sparkles size={12} />
              <span>Portal Mandiri Penghuni</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-display text-text-primary mb-2">Portal Penghuni Highlanderstay</h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed mb-6 max-w-sm mx-auto">
              Masuk dengan nomor WhatsApp atau email Anda untuk kemudahan cek tagihan, bayar sewa instan, dan tiket perbaikan fasilitas kamar.
            </p>

            {/* Key Value Points for Mobile */}
            <div className="grid grid-cols-1 gap-2.5 text-left mb-6 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2.5 text-xs text-muted">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>Cek tagihan sewa & tanggal jatuh tempo real-time</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted">
                <CreditCard size={15} className="text-amber-400 shrink-0" />
                <span>Bayar invoice online instan (QRIS & VA Bank)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-muted">
                <Wrench size={15} className="text-sky-400 shrink-0" />
                <span>Lapor komplain perbaikan langsung ke pengelola</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setInitialTab('login');
                  setLoginModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer min-h-[48px]"
              >
                <LogIn size={17} />
                <span>Masuk ke Akun Penghuni</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInitialTab('register');
                  setLoginModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 text-xs font-bold transition-all active:scale-95 cursor-pointer min-h-[42px]"
              >
                Daftar Akun Baru (Calon Penghuni)
              </button>

              <p className="text-[11px] text-muted text-center pt-2 leading-relaxed">
                Dengan mendaftar atau masuk, Anda menyetujui{' '}
                <Link to="/privacy-policy" className="text-amber-400 hover:underline font-semibold">
                  Syarat & Ketentuan
                </Link>{' '}
                serta{' '}
                <Link to="/privacy-policy" className="text-amber-400 hover:underline font-semibold">
                  Kebijakan Privasi
                </Link>{' '}
                kami.
              </p>
            </div>
          </div>
        )}

        {/* Embedded Full Tenant Profile Modal Handler */}
        <TenantProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          session={session}
          onLogout={onLogout}
          onSessionUpdate={onSessionUpdate}
          initialTab={dashboardTab}
        />

        {/* Login & Register Modal for Guest Mode */}
        <LoginModal
          isOpen={loginModalOpen && !session}
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={(s) => {
            onLoginSuccess(s);
            setLoginModalOpen(false);
          }}
          initialTab={initialTab}
        />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

