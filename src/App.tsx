import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SelectedWorks } from './components/SelectedWorks';
import { Banner } from './components/Banner';
import { Journal } from './components/Journal';
import { Explorations } from './components/Explorations';
import { Stats } from './components/Stats';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { BookingCartModal } from './components/BookingCartModal';
import { LoginModal } from './components/LoginModal';
import { TenantProfileModal } from './components/TenantProfileModal';
import { PaymentReturnModal } from './components/PaymentReturnModal';
import { PropertyPage } from './components/PropertyPage';
import { ArticlePage } from './components/ArticlePage';
import { ResortPage } from './components/ResortPage';
import { MapSelectorPage } from './components/MapSelectorPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { CatalogPage } from './components/CatalogPage';
import { CartPage } from './components/CartPage';
import { PortalPage } from './components/PortalPage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ShoppingCart } from 'lucide-react';
import { fetchSettings, slugify, logoutTenant, fetchCart, clearCartToken } from './api';
import type { UserSession, Property, WebsiteSettings } from './api';
import { useSEO } from './hooks/useSEO';
import { useCapacitor } from './hooks/useCapacitor';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [paymentReturnOpen, setPaymentReturnOpen] = useState(false);
  const [paymentReturnInvoiceId, setPaymentReturnInvoiceId] = useState<number | null>(null);
  const [paymentReturnOrderId, setPaymentReturnOrderId] = useState<number | null>(null);
  const [paymentReturnReference, setPaymentReturnReference] = useState<string | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error('Error parsing userSession from localStorage', e);
      }
    }
    return null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Handle native Android hardware back button
  const handleNativeBackPress = useCallback(() => {
    if (paymentReturnOpen) { setPaymentReturnOpen(false); return true; }
    if (profileOpen) { setProfileOpen(false); return true; }
    if (loginOpen) { setLoginOpen(false); return true; }
    if (cartOpen) { setCartOpen(false); return true; }
    if (bookingOpen) { setBookingOpen(false); return true; }
    return false;
  }, [paymentReturnOpen, profileOpen, loginOpen, cartOpen, bookingOpen]);

  useCapacitor(handleNativeBackPress);

  // SEO optimization for Home Page
  useSEO({
    title: 'Highlanderstay | Kamar Kos & Apartemen Premium di Jakarta',
    description: 'Temukan rumah kos dan apartemen modern premium untuk disewa. Ruang tinggal indah yang dirancang untuk kenyamanan dan gaya hidup modern.',
    keywords: 'co-living, rumah kos, kos, sewa apartemen, Jakarta, kamar mewah, hunian sementara, hunian mahasiswa',
    canonicalUrl: 'https://highlanderstay.com/',
    enabled: location.pathname === '/'
  });

  // Load branding settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load website settings', err);
      }
    };
    loadSettings();
  }, []);

  // Sync Cart Count
  const refreshCartCount = useCallback(async (e?: any) => {
    if (e?.detail?.count !== undefined && typeof e.detail.count === 'number') {
      setCartCount(e.detail.count);
      return;
    }
    try {
      const res = await fetchCart();
      setCartCount(res.cart?.count || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshCartCount();

    // Listen to focus, custom, and storage events to keep cart count instantly updated everywhere
    window.addEventListener('focus', refreshCartCount);
    window.addEventListener('cart-updated', refreshCartCount);
    window.addEventListener('storage', refreshCartCount);

    return () => {
      window.removeEventListener('focus', refreshCartCount);
      window.removeEventListener('cart-updated', refreshCartCount);
      window.removeEventListener('storage', refreshCartCount);
    };
  }, [userSession, refreshCartCount]);

  // DOKU Callback / Return URL detection (/portal/billing, ?status=finish, ?order_id=..., ?reference=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const invoiceIdParam = params.get('invoice_id');
    const orderIdParam = params.get('order_id');
    const referenceParam = params.get('reference');
    const isDokuPath = location.pathname === '/portal/billing' || location.pathname === '/billing';
    const isDokuReturn = 
      isDokuPath || 
      status === 'finish' || 
      status === 'success' || 
      status === 'pending' || 
      Boolean(invoiceIdParam && (status || params.get('checkout'))) ||
      Boolean(orderIdParam || referenceParam);

    if (isDokuReturn) {
      let resolvedInvoiceId: number | null = invoiceIdParam ? parseInt(invoiceIdParam, 10) : null;
      let resolvedOrderId: number | null = orderIdParam ? parseInt(orderIdParam, 10) : null;
      let resolvedReference: string | null = referenceParam || null;

      try {
        const saved = sessionStorage.getItem('pending_doku_checkout');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.invoiceId && !resolvedInvoiceId) resolvedInvoiceId = parsed.invoiceId;
          if (parsed.orderId && !resolvedOrderId) resolvedOrderId = parsed.orderId;
          if (parsed.reference && !resolvedReference) resolvedReference = parsed.reference;
        }
      } catch (e) {
        // ignore
      }

      setPaymentReturnInvoiceId(resolvedInvoiceId);
      setPaymentReturnOrderId(resolvedOrderId);
      setPaymentReturnReference(resolvedReference);
      setPaymentReturnOpen(true);

      // Clean up URL parameters cleanly without page refresh
      const cleanPath = isDokuPath ? '/' : location.pathname;
      window.history.replaceState({}, document.title, cleanPath);
    }
  }, [location.pathname, location.search]);

  // Track active section on scroll
  useEffect(() => {
    if (isLoading) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      const sections = ['home', 'work', 'resume', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;

          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

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

    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(sectionId);
        }
      }, 150);
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await logoutTenant(token);
      }
    } catch (e) {
      console.warn('Logout API error:', e);
    }
    clearCartToken(userSession);
    localStorage.removeItem('userSession');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('pending_doku_checkout');
    setUserSession(null);
    setCartCount(0);
    setProfileOpen(false);
  };

  const handleLoginSuccess = (session: UserSession) => {
    localStorage.setItem('userSession', JSON.stringify(session));
    if (session.token) {
      localStorage.setItem('authToken', session.token);
    }
    setUserSession(session);
    setLoginOpen(false);
    setTimeout(() => {
      refreshCartCount();
    }, 100);
  };

  return (
    <>
      <Routes>
        {/* Dedicated Catalog Route */}
        <Route path="/katalog" element={<CatalogPage settings={settings} />} />
        <Route path="/kamar" element={<Navigate to="/katalog" replace />} />

        {/* Dedicated Shopping Cart Route */}
        <Route path="/cart" element={<CartPage settings={settings} onCartChange={refreshCartCount} />} />
        <Route path="/keranjang" element={<Navigate to="/cart" replace />} />

        {/* Dedicated Tenant Portal & Login Route */}
        <Route 
          path="/portal" 
          element={
            <PortalPage
              session={userSession}
              onLoginSuccess={handleLoginSuccess}
              onLogout={handleLogout}
              onSessionUpdate={(updated) => setUserSession(updated)}
              settings={settings}
            />
          } 
        />
        <Route path="/login" element={<Navigate to="/portal" replace />} />
        <Route path="/register" element={<Navigate to="/portal" replace />} />
        <Route path="/akun" element={<Navigate to="/portal" replace />} />
        <Route path="/profil" element={<Navigate to="/portal" replace />} />

        {/* Map & Nearest Property Selector Route */}
        <Route path="/map" element={<MapSelectorPage settings={settings} />} />
        <Route path="/peta" element={<Navigate to="/map" replace />} />
        <Route path="/lokasi" element={<Navigate to="/map" replace />} />

        {/* Property Details Route */}
        <Route path="/property/:idSlug" element={<PropertyPage />} />

        {/* Article Details Route */}
        <Route path="/panduan/:idSlug" element={<ArticlePage />} />

        {/* Resort Page Route */}
        <Route path="/resort" element={<ResortPage />} />

        {/* Privacy Policy Route for Meta/Facebook */}
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        {/* DOKU Hosted Checkout Callback Return Routes */}
        <Route path="/portal/billing" element={<Navigate to="/portal" replace />} />
        <Route path="/billing" element={<Navigate to="/portal" replace />} />

      {/* Landing Page Route */}
      <Route path="/" element={
        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingScreen 
              onComplete={() => {
                setIsLoading(false);
              }} 
              logoImage={settings?.logo_image || ''}
              key="loader" 
            />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full relative min-h-screen bg-bg"
            >
              {/* Navbar */}
              <Navbar 
                activeSection={activeSection} 
                onNavClick={handleNavClick} 
                session={userSession}
                onLogout={handleLogout}
                onLoginClick={() => setLoginOpen(true)}
                onProfileClick={() => setProfileOpen(true)}
                onCartClick={() => setCartOpen(true)}
                cartCount={cartCount}
                settings={settings}
              />

              {/* Sections */}
              <main>
                {/* Hero Section */}
                <Hero 
                  onSeeWorksClick={() => handleNavClick('work')} 
                  onReachOutClick={() => handleNavClick('contact')} 
                />

                {/* Banner Section */}
                <Banner onCtaClick={() => handleNavClick('contact')} settings={settings} />

                {/* Selected Works Section */}
                <SelectedWorks 
                  onPropertyClick={(id, title) => navigate(`/property/${id}-${slugify(title)}`)} 
                />

                {/* Journal Section */}
                <Journal />

                {/* Explorations (Parallax Gallery) Section */}
                <Explorations settings={settings} />

                {/* Stats Section */}
                <Stats />
              </main>

              {/* Footer / Contact Section */}
              <Footer />

              {/* Booking Form Modal */}
              <BookingModal 
                isOpen={bookingOpen} 
                property={selectedProperty} 
                onClose={() => {
                  setBookingOpen(false);
                  setSelectedProperty(null);
                  refreshCartCount();
                }} 
                onOpenCart={() => {
                  setBookingOpen(false);
                  setSelectedProperty(null);
                  setCartOpen(true);
                }}
              />

              {/* Standalone Booking Cart Modal */}
              <BookingCartModal
                isOpen={cartOpen}
                onClose={() => {
                  setCartOpen(false);
                  refreshCartCount();
                }}
                onSelectRooms={() => {
                  handleNavClick('work');
                }}
              />

              {/* Login / Register / OTP Modal */}
              <LoginModal
                isOpen={loginOpen}
                onClose={() => setLoginOpen(false)}
                onLoginSuccess={handleLoginSuccess}
              />

              {/* Tenant Profile & Phone Verification Modal */}
              <TenantProfileModal
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                session={userSession}
                onLogout={handleLogout}
                onSessionUpdate={(updated) => setUserSession(updated)}
              />

              {/* DOKU Hosted Checkout Return & Verification Modal */}
              <PaymentReturnModal
                isOpen={paymentReturnOpen}
                onClose={() => {
                  setPaymentReturnOpen(false);
                  refreshCartCount();
                }}
                token={userSession?.token}
                invoiceId={paymentReturnInvoiceId}
                orderId={paymentReturnOrderId}
                reference={paymentReturnReference}
                onPaymentSuccess={() => {
                  refreshCartCount();
                  setProfileOpen(true);
                }}
                onOpenTenantPortal={() => {
                  setPaymentReturnOpen(false);
                  refreshCartCount();
                  setProfileOpen(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      } />
      </Routes>

      {/* Mobile App Bottom Navigation Bar (Sticky on all pages including Map) */}
      <MobileBottomNav
        cartCount={cartCount}
        userSession={userSession}
        onCartClick={() => navigate('/cart')}
        onProfileClick={() => navigate('/portal')}
        onLoginClick={() => navigate('/portal')}
        onCatalogClick={() => navigate('/katalog')}
      />

      {/* Unpaid Cart Floating Reminder Toast */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && !bookingOpen && !paymentReturnOpen && !loginOpen && !profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-24 z-40 max-w-sm"
          >
            <div 
              onClick={() => setCartOpen(true)}
              className="group flex items-center justify-between gap-3 bg-surface/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-3 shadow-2xl shadow-black/60 cursor-pointer hover:border-amber-400 hover:scale-[1.02] transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                  <ShoppingCart size={17} />
                  <span className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 text-bg text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">
                    {cartCount} Kamar di Keranjang Belum Dibayar
                  </p>
                  <p className="text-[10px] text-muted truncate">
                    Klik untuk selesaikan pembayaran
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCartOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-bg font-bold text-[11px] uppercase tracking-wider shrink-0 hover:from-amber-400 hover:to-amber-500 transition-all shadow"
              >
                Bayar →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
