import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Star, Compass, Coffee, 
  Sparkles, Phone, Clock
} from 'lucide-react';
import { fetchSettings, type UserSession, type WebsiteSettings } from '../api';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useSEO } from '../hooks/useSEO';

export const ResortPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  
  // SEO optimization
  useSEO({
    title: 'Highlander Resort | Luxury Co-Living & Vacation Escape',
    description: 'Jelajahi keindahan tersembunyi Highlander Resort. Vila kolam pribadi mewah di tengah pemandangan pegunungan berkabut yang menakjubkan.',
    keywords: 'resort mewah, vila bogor, vacation, highland resort, liburan keluarga, private pool villa'
  });

  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error('Error parsing session', e);
      }
    }
    return null;
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadSettings = async () => {
      try {
        const data = await fetchSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadSettings();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUserSession(null);
    navigate('/');
  };

  const handleBookWhatsApp = (villaName: string) => {
    const waNumber = settings?.whatsapp_number || '628123456789';
    const text = encodeURIComponent(
      `Halo Admin Highlander Resort, saya ingin memesan villa "${villaName}" untuk liburan saya.`
    );
    window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
  };

  const villas = [
    {
      name: "Forest Vista Villa",
      price: "Rp 2.500.000",
      description: "Nikmati ketenangan hutan pinus berkabut dari teras gantung pribadi Anda.",
      size: "85 sqm",
      occupancy: "2 Dewasa",
      image: "/resort_villa.png",
      features: ["Private Jacuzzi", "Mini-bar Premium", "King Koil Bed", "Forest View"]
    },
    {
      name: "Sunset Pool Villa",
      price: "Rp 4.500.000",
      description: "Vila kolam pribadi dengan pemandangan langsung ke ufuk senja pegunungan.",
      size: "140 sqm",
      occupancy: "4 Dewasa",
      image: "/resort_hero.png",
      features: ["Private Heated Pool", "Smart Kitchen", "Bathtub Marmer", "Butlers 24/7"]
    },
    {
      name: "Horizon Sanctuary Penthouse",
      price: "Rp 6.000.000",
      description: "Mahakarya arsitektur melayang di atas bukit dengan dinding kaca 360 derajat.",
      size: "220 sqm",
      occupancy: "6 Dewasa",
      image: "/resort_hero.png",
      features: ["Infinity Skypool", "Home Cinema Room", "Wine Cellar", "Direct Heli-pad Access"]
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-text-primary selection:bg-accent/30 overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar 
        activeSection="" 
        onNavClick={(sec) => {
          if (sec === 'admin') navigate('/admin');
          else navigate(`/#${sec}`);
        }} 
        session={userSession}
        onLogout={handleLogout}
        onLoginClick={() => navigate('/')}
        settings={settings}
      />

      {/* Hero Banner Section */}
      <section className="relative h-[90vh] md:h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ 
            backgroundImage: "url('/resort_hero.png')",
          }}
        />
        {/* Dark Gold Luxury Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-black/30" />
        <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-5" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 backdrop-blur-md text-[10px] font-semibold uppercase tracking-[0.25em]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Peak of Luxury Vacation</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="text-4xl sm:text-6xl md:text-8xl font-display italic font-semibold text-text-primary mt-2"
          >
            Highlander Resort
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-sm md:text-base text-muted max-w-2xl leading-relaxed font-light"
          >
            Pelarian tersembunyi yang menyatukan arsitektur modern premium dengan ketenangan hutan tropis dan panorama pegunungan berkabut yang menakjubkan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 45 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-4"
          >
            <a
              href="#accommodations"
              className="relative group rounded-full text-xs font-semibold uppercase tracking-wider px-8 py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent shadow-lg"
            >
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" />
              Explore Accommodations
            </a>
            <button
              onClick={() => handleBookWhatsApp('General Inquiry')}
              className="text-xs uppercase tracking-[0.15em] font-semibold text-text-primary hover:text-amber-400 border border-stroke px-6 py-4 rounded-full transition-colors duration-200 backdrop-blur-md bg-white/5"
            >
              Contact Reservation
            </button>
          </motion.div>
        </div>

        {/* Floating details banner */}
        <div className="absolute bottom-10 left-6 right-6 z-20 hidden md:flex items-center justify-center">
          <div className="bg-surface/50 border border-stroke/60 rounded-full py-4 px-10 flex gap-12 backdrop-blur-lg shadow-2xl">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <span className="text-[9px] text-muted uppercase tracking-wider block">Lokasi</span>
                <span className="text-xs text-text-primary font-semibold">Bukit Sentul, West Java</span>
              </div>
            </div>
            <div className="w-px h-8 bg-stroke/60" />
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <span className="text-[9px] text-muted uppercase tracking-wider block">Elevasi</span>
                <span className="text-xs text-text-primary font-semibold">1,200 mdpl (Sejuk & Bebas Polusi)</span>
              </div>
            </div>
            <div className="w-px h-8 bg-stroke/60" />
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <span className="text-[9px] text-muted uppercase tracking-wider block">Rating Resensi</span>
                <span className="text-xs text-text-primary font-semibold">4.9/5 Luxury Sanctuary</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resort Features Section */}
      <section className="py-20 md:py-32 max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6 text-left">
            <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">Unrivaled Experience</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium leading-tight">
              Hunian Jiwa yang Dirancang dengan Keanggunan Alami.
            </h2>
            <p className="text-sm text-muted font-light leading-relaxed">
              Highlander Resort bukan sekadar tempat menginap, melainkan ruang peristirahatan eksklusif di mana kenyamanan bintang lima menyatu harmonis dengan pemandangan alam perawan. Dirancang menggunakan material premium berkelanjutan, setiap sudut vila menawarkan pencahayaan alami yang megah dan privasi mutlak.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Gourmet Dining</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">Sajian gastronomi organik dari kebun sendiri di atas tebing berkabut.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">24/7 Premium Butler</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">Pelayanan personal terdedikasi untuk memenuhi setiap kebutuhan liburan Anda.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-stroke">
            <img 
              src="/resort_hero.png" 
              alt="Resort Pool Sunset" 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-surface/80 backdrop-blur-md border border-stroke/50 p-6 rounded-2xl text-left">
              <span className="text-[9px] text-amber-500 uppercase tracking-wider block font-bold">Featured Sanctuary</span>
              <h4 className="text-base font-semibold mt-1">Organic Valley Infinity Pool</h4>
              <p className="text-xs text-muted mt-1 font-light leading-relaxed">Berenang di air pegunungan yang jernih dengan sensasi menyatu langsung bersama lautan awan pagi hari.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodations Section */}
      <section id="accommodations" className="py-20 bg-surface/30 border-y border-stroke/50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3 mb-16">
            <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">Luxury Collection</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium">Vila & Sanctuary Pilihan</h2>
            <p className="text-xs md:text-sm text-muted font-light leading-relaxed">
              Setiap vila menawarkan tata ruang luas, pemandangan pegunungan yang tidak terhalang, kolam renang pribadi, dan fasilitas eksklusif yang dirancang secara detail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {villas.map((villa, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-surface/50 border border-stroke rounded-3xl overflow-hidden shadow-xl flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={villa.image} 
                    alt={villa.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-bg/80 backdrop-blur-md border border-stroke/60 rounded-full px-4 py-1.5 text-xs text-amber-400 font-semibold">
                    {villa.price} / malam
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 text-left flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{villa.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted font-medium">
                        <span>📐 {villa.size}</span>
                        <span>•</span>
                        <span>👥 {villa.occupancy}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted leading-relaxed font-light">{villa.description}</p>
                    
                    {/* Features list */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {villa.features.map((feat, fIdx) => (
                        <span key={fIdx} className="text-[9px] font-semibold text-text-primary px-2.5 py-1 border border-stroke/60 rounded-full bg-bg/40">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookWhatsApp(villa.name)}
                    className="w-full mt-6 py-3 rounded-xl bg-text-primary text-bg hover:bg-amber-500 hover:text-white font-semibold text-xs transition-colors duration-300"
                  >
                    Pesan Villa
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Reservation Bar */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <div className="relative rounded-[32px] overflow-hidden border border-stroke bg-surface/30 p-8 sm:p-12 shadow-2xl flex flex-col items-center gap-6">
          <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-5" />
          <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">Exclusive Privilege</span>
          <h3 className="text-2xl sm:text-4xl font-display font-medium">Mulai Petualangan Mewah Anda</h3>
          <p className="text-xs sm:text-sm text-muted max-w-md leading-relaxed font-light">
            Hubungi pramutamu kami hari ini untuk penawaran khusus liburan Anda atau diskon VIP pemesanan langsung.
          </p>
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => handleBookWhatsApp('Direct Call Reservation')}
              className="relative group rounded-full text-xs font-semibold uppercase tracking-wider px-8 py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent shadow-lg flex items-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              Chat WhatsApp Admin
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};
