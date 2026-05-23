import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
import { LoginModal } from './components/LoginModal';
import { AdminPanel } from './components/AdminPanel';
import { PropertyPage } from './components/PropertyPage';
import { ArticlePage } from './components/ArticlePage';
import { fetchSettings, slugify } from './api';
import type { UserSession, Property, WebsiteSettings } from './api';
import { useSEO } from './hooks/useSEO';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
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

  const showFloatingWhatsApp = location.pathname !== '/admin';

  // SEO optimization for Home Page
  useSEO({
    title: 'Highlanderstay | Kamar Kos & Apartemen Premium di Jakarta',
    description: 'Temukan rumah kos dan apartemen modern premium untuk disewa. Ruang tinggal indah yang dirancang untuk kenyamanan dan gaya hidup modern.',
    keywords: 'co-living, rumah kos, kos, sewa apartemen, Jakarta, kamar mewah, hunian sementara, hunian mahasiswa'
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
    if (sectionId === 'admin') {
      navigate('/admin');
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };


  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUserSession(null);
    navigate('/');
  };

  const handleLoginSuccess = (session: UserSession) => {
    localStorage.setItem('userSession', JSON.stringify(session));
    setUserSession(session);
    navigate('/admin');
  };

  return (
    <>
      <Routes>
        {/* Admin Panel Route */}
        <Route path="/admin" element={<AdminPanel />} />

        {/* Property Details Route */}
        <Route path="/property/:idSlug" element={<PropertyPage />} />

        {/* Article Details Route */}
        <Route path="/panduan/:idSlug" element={<ArticlePage />} />

      {/* Landing Page Route */}
      <Route path="/" element={
        <AnimatePresence mode="wait">
          {isLoading ? (
            <LoadingScreen 
              onComplete={() => setIsLoading(false)} 
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
                <SelectedWorks onPropertyClick={(id, title) => navigate(`/property/${id}-${slugify(title)}`)} />

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
                }} 
              />

              {/* Login Modal */}
              <LoginModal
                isOpen={loginOpen}
                onClose={() => setLoginOpen(false)}
                onLoginSuccess={handleLoginSuccess}
              />
            </motion.div>
          )}
        </AnimatePresence>
      } />
      </Routes>
      {showFloatingWhatsApp && (
        <FloatingWhatsApp whatsappNumber={settings?.whatsapp_number || '628123456789'} />
      )}
    </>
  );
}

function FloatingWhatsApp({ whatsappNumber }: { whatsappNumber: string }) {
  const message = encodeURIComponent("Halo Admin Highlanderstay, saya ingin bertanya tentang ruang co-living Anda.");
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgb(37,211,102,0.4)] hover:shadow-[0_8px_30px_rgb(37,211,102,0.6)] border border-[#34eb74]/30 focus:outline-none transition-all duration-300"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        y: [0, -8, 0]
      }}
      transition={{
        scale: { type: "spring", stiffness: 260, damping: 20 },
        opacity: { duration: 0.2 },
        y: {
          repeat: Infinity,
          repeatType: "reverse",
          duration: 2.5,
          ease: "easeInOut"
        }
      }}
      whileHover={{ 
        scale: 1.1,
      }}
      whileTap={{ scale: 0.95 }}
      aria-label="Chat dengan Admin di WhatsApp"
      title="Chat dengan Admin di WhatsApp"
    >
      <svg 
        viewBox="0 0 24 24" 
        className="w-7 h-7 fill-current"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </motion.a>
  );
}

export default App;
