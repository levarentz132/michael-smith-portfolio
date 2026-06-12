import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Star, Shield, Wifi, 
  Tv, Wind, ChevronRight, Sparkles, 
  CheckCircle2, Key, Info, DoorOpen, X
} from 'lucide-react';
import { fetchPropertyById, fetchSettings, type Property, type UserSession, type WebsiteSettings } from '../api';
import { BookingModal } from './BookingModal';
import { Navbar } from './Navbar';
import { useSEO } from '../hooks/useSEO';

export const PropertyPage: React.FC = () => {
  const { idSlug } = useParams<{ idSlug: string }>();
  const id = idSlug ? parseInt(idSlug.split('-')[0]) : undefined;
  const navigate = useNavigate();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic SEO for Property Detail Page
  useSEO({
    title: property 
      ? `${property.title} | Highlanderstay`
      : 'Memuat Ruang... | Highlanderstay',
    description: property 
      ? `Jelajahi ${property.title} yang terletak di ${property.location}. ${property.description || 'Kamar kos / sewa apartemen premium di Jakarta dengan fasilitas modern.'}`
      : 'Memuat detail untuk ruang sewa premium di Highlanderstay...',
    keywords: property 
      ? `co-living, ${property.title}, kamar kos, ${property.location}, kamar sewa, hunian Jakarta`
      : 'co-living, sewa premium, kamar kos, apartemen Jakarta'
  });
  
  // Parallax Scroll State
  const [scrollY, setScrollY] = useState(0);

  // 3D Card Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });

  // Booking Modal State
  const [bookingOpen, setBookingOpen] = useState(false);

  // Lightbox Modal State for inspecting photo
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Session State (for Navbar)
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

  const loadPropertyDetails = async (propId: number) => {
    try {
      setLoading(true);
      const data = await fetchPropertyById(propId);
      setProperty(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to retrieve property details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);

    let timer: ReturnType<typeof setTimeout>;
    if (id) {
      timer = setTimeout(() => {
        loadPropertyDetails(id);
      }, 0);
    }

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [id]);

  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        const data = await fetchSettings();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings in PropertyPage', err);
      }
    };
    loadSettingsData();
  }, []);

  // Prevent body scroll and handle Escape key when lightbox state changes
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  const handleNavClick = (sectionId: string) => {
    // Since we are on a detail page, navigate to home with the hash
    navigate('/', { replace: false });
    // Wait a brief moment for mount, then scroll
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUserSession(null);
    navigate('/');
  };

  // 3D Card Tilt handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const maxTilt = 8; // degrees max tilt
    const tiltX = -((y - centerY) / centerY) * maxTilt;
    const tiltY = ((x - centerX) / centerX) * maxTilt;
    
    const spotX = (x / rect.width) * 100;
    const spotY = (y / rect.height) * 100;
    
    setTilt({ x: tiltX, y: tiltY });
    setSpotlightPos({ x: spotX, y: spotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-text-primary">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-stroke/30 border-t-text-primary animate-spin" />
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Memuat Detail...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-semibold mb-4 text-text-primary">Terjadi kesalahan</h2>
        <p className="text-muted max-w-md mb-8">{error || 'Tidak dapat memuat detail properti.'}</p>
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-text-primary text-bg font-semibold text-sm hover:scale-105 transition-all duration-300"
        >
          <ArrowLeft size={16} /> Kembali ke Beranda
        </button>
      </div>
    );
  }

  const supportsTransit = !!(property.transit3h || property.transit6h || property.transit12h || property.transit24h);
  const isAvailable = property.status !== 'booked' && (property.availableRooms ?? 1) > 0;

  return (
    <div className="min-h-screen bg-bg text-text-primary selection:bg-text-primary selection:text-bg overflow-x-hidden">
      {/* Global Navbar */}
      <Navbar 
        activeSection="work" 
        onNavClick={handleNavClick} 
        session={userSession}
        onLogout={handleLogout}
        onLoginClick={() => navigate('/')} // Redirect to home for logins
        settings={settings}
      />

      {/* Parallax Hero Header */}
      <header className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden bg-black">
        {/* Background Image Container with Parallax Offset */}
        <div 
          className="absolute inset-0 w-full h-[120%] top-[-10%] transition-transform duration-75 ease-out"
          style={{
            transform: `translate3d(0, ${scrollY * 0.35}px, 0)`,
          }}
        >
          <img 
            src={property.image} 
            alt={property.title} 
            className="w-full h-full object-cover opacity-60"
          />
          {/* Halftone / Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-black/50" />
          <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-25" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1200px] w-full mx-auto px-6 md:px-10 lg:px-16 pb-12 md:pb-16 flex flex-col items-start text-left z-10">
            {/* Back Button */}
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-bg/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full hover:bg-bg/95 hover:border-white/20 transition-all duration-300 mb-6 text-xs font-semibold uppercase tracking-wider"
            >
              <ArrowLeft size={14} /> Kembali ke Ruangan
            </button>

            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-text-primary text-bg text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                {property.category}
              </span>
              <span className="bg-bg/85 backdrop-blur-md border border-white/5 text-text-primary text-[10px] font-semibold tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                <MapPin size={10} className="text-muted" /> {property.location}
              </span>
              <span className="bg-bg/85 backdrop-blur-md border border-white/5 text-text-primary text-[10px] font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Star size={10} className="fill-amber-400 stroke-amber-400" /> {property.rating}
              </span>
            </div>

            {/* Page Heading */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-medium text-text-primary leading-tight max-w-3xl">
              {property.title}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Details Grid Container */}
      <section className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Details: Specs, Description, Map (8 Columns on desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-10">
            
            {/* Property Image Showcase */}
            <div className="bg-surface border border-stroke rounded-3xl p-3 md:p-4 overflow-hidden flex flex-col shadow-lg">
              <div className="flex items-center gap-2 mb-3 px-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span className="text-[10px] text-muted uppercase tracking-widest font-semibold text-text-primary">Galeri Showcase</span>
              </div>
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="w-full aspect-[16/10] md:aspect-video rounded-2xl overflow-hidden bg-bg relative group border border-stroke/50 cursor-zoom-in"
              >
                <img 
                  src={property.image} 
                  alt={property.title} 
                  className="w-full h-full object-contain bg-black/60 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                {/* Click to Inspect Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-350 flex items-center justify-center pointer-events-none">
                  <div className="bg-bg/85 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xl text-text-primary">
                    <span>🔍</span> Klik untuk Inspeksi Foto
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-muted mt-3 text-center italic font-light">Tampilan penuh tidak dipotong dari {property.title} (Klik untuk inspeksi)</span>
            </div>

            {/* Description & Overview */}
            <div className="bg-surface border border-stroke rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-4 text-text-primary flex items-center gap-2">
                <Info size={18} className="text-muted" /> Tentang ruang ini
              </h3>
              <p className="text-sm md:text-base text-muted font-light leading-relaxed whitespace-pre-line">
                {property.description || 'Selamat datang di pengalaman hidup premium yang dikurasi dengan indah. Dirancang dengan perhatian terhadap detail yang teliti, ruang ini menawarkan keseimbangan sempurna antara daya tarik estetika, kenyamanan nyaman, dan kenyamanan sehari-hari yang fungsional.'}
              </p>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-stroke/60">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-muted uppercase tracking-wider mb-1">Total Kamar</span>
                  <span className="text-base font-semibold text-text-primary flex items-center gap-1.5">
                    <DoorOpen size={16} className="text-muted" /> {property.rooms || '20+'}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-muted uppercase tracking-wider mb-1">Status Ketersediaan</span>
                  <span className="text-base font-semibold text-text-primary">
                    {property.availableRooms !== undefined 
                      ? `${property.availableRooms} Tersedia` 
                      : 'Sedikit kosong'}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-muted uppercase tracking-wider mb-1">Min. Transit</span>
                  <span className="text-base font-semibold text-text-primary">
                    {supportsTransit ? `${property.minTransitHours || 3} Jam` : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-muted uppercase tracking-wider mb-1">Akses Kamar</span>
                  <span className="text-base font-semibold text-text-primary flex items-center gap-1.5">
                    <Key size={15} className="text-muted" /> Kartu Kunci
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Amenities Checklist */}
            <div className="bg-surface border border-stroke rounded-3xl p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles size={18} className="text-muted" /> Fasilitas Premium Termasuk
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: <Wifi size={16} />, label: 'WiFi Fiber Berkecepatan Tinggi (hingga 100Mbps)' },
                  { icon: <Wind size={16} />, label: 'AC Dalam Kamar' },
                  { icon: <Tv size={16} />, label: 'Smart TV dengan Netflix Terpasang' },
                  { icon: <Shield size={16} />, label: 'Satpam & CCTV 24/7' },
                  { icon: <Key size={16} />, label: 'Kunci Gerbang Pintar Digital' },
                  { icon: <CheckCircle2 size={16} />, label: 'Kamar Mandi Pribadi + Air Panas' }
                ].map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3.5 bg-bg/50 border border-stroke/50 p-4 rounded-2xl">
                    <span className="w-8 h-8 rounded-full bg-stroke/50 flex items-center justify-center text-text-primary">
                      {amenity.icon}
                    </span>
                    <span className="text-xs md:text-sm font-medium text-muted">{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Styled Map Location Section */}
            <div className="bg-surface border border-stroke rounded-3xl p-6 md:p-8 overflow-hidden flex flex-col">
              <h3 className="text-lg font-semibold mb-2 text-text-primary flex items-center gap-2">
                <MapPin size={18} className="text-muted" /> Peta Lokasi
              </h3>
              <p className="text-xs text-muted mb-4 font-light">{property.address || 'Jakarta, Indonesia'}</p>

              {/* Map Link */}
              <a
                href={property.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address || property.location || 'Jakarta')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-8 rounded-2xl border border-stroke bg-surface/50 hover:bg-surface hover:border-white/10 text-xs font-semibold text-center text-blue-400 hover:text-blue-300 transition-all duration-300 flex flex-col items-center justify-center gap-3 group shadow-md"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-300">
                  <MapPin size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-text-primary text-sm font-medium">Buka Peta Lokasi</span>
                  <span className="text-muted text-[10px] uppercase tracking-wider font-light">Klik untuk melihat rute di Google Maps ↗</span>
                </div>
              </a>
            </div>

          </div>

          {/* Right Section: 3D Interactive Pricing Card (4 Columns on desktop) */}
          <div className="lg:col-span-4 sticky top-28 w-full z-20">
            {/* Perspective container */}
            <div 
              className="relative w-full rounded-3xl"
              style={{ perspective: '1000px' }}
            >
              <div
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="w-full bg-surface border border-stroke rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ease-out flex flex-col"
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${isHovered ? 1.015 : 1}, ${isHovered ? 1.015 : 1}, 1)`,
                  boxShadow: isHovered 
                    ? '0 30px 60px -15px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)' 
                    : '0 20px 40px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                  backgroundImage: isHovered 
                    ? `radial-gradient(circle 250px at ${spotlightPos.x}% ${spotlightPos.y}%, rgba(255, 255, 255, 0.05), transparent)`
                    : 'none',
                }}
              >
                {/* Accent glow line inside */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-stroke via-text-primary/30 to-stroke" />

                {/* Status Badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] text-muted uppercase tracking-widest font-semibold">Tarif Harga</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider rounded-full px-2.5 py-1 ${
                    isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {isAvailable ? 'Tersedia' : 'Penuh'}
                  </span>
                </div>

                {/* Rates Listing */}
                <div className="flex flex-col gap-6 text-left mb-8">
                  {/* Monthly Pricing */}
                  <div className="bg-bg/60 border border-stroke/60 rounded-2xl p-4 flex flex-col relative overflow-hidden">
                    {property.promoPrice && property.promoLabel && (
                      <div className="absolute top-0 right-0 bg-emerald-500/10 border-l border-b border-emerald-500/20 px-2 py-0.5 rounded-bl-xl">
                        <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider">{property.promoLabel}</span>
                      </div>
                    )}
                    <span className="text-[9px] text-muted uppercase tracking-widest font-semibold mb-1">Tarif Bulanan</span>
                    {property.promoPrice ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-sm animate-strike text-text-primary/40 font-medium">
                          Rp. {Number(property.rawPrice).toLocaleString('id-ID')} / bulan
                        </span>
                        <span className="text-2xl md:text-3xl font-display font-medium text-emerald-400 leading-none">
                          Rp. {Number(property.promoPrice).toLocaleString('id-ID')} <span className="text-xs text-muted font-normal">/ bulan</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl md:text-3xl font-display font-medium text-text-primary leading-none mb-1">
                        {property.price}
                      </span>
                    )}
                    <span className="text-[10px] text-muted font-light mt-1">Termasuk biaya pemeliharaan gedung</span>
                  </div>

                  {/* Transit (Package) Pricing */}
                  {supportsTransit ? (
                    <div className="bg-bg/60 border border-stroke/60 rounded-2xl p-4 flex flex-col relative overflow-hidden text-left">
                      <div className="absolute top-0 right-0 bg-text-primary/10 px-2.5 py-0.5 rounded-bl-xl border-l border-b border-stroke/50">
                        <span className="text-[8px] text-text-primary font-bold uppercase tracking-wider">Paket Transit</span>
                      </div>
                      <span className="text-[9px] text-muted uppercase tracking-widest font-semibold mb-2.5">Pilihan Paket Transit</span>
                      
                      <div className="overflow-hidden rounded-xl border border-stroke/40 bg-surface/30">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-stroke/30 bg-white/5">
                              <th className="py-2 px-3 text-muted font-medium">Durasi</th>
                              <th className="py-2 px-3 text-right text-muted font-medium">Tarif</th>
                            </tr>
                          </thead>
                          <tbody>
                            {property.transit3h ? (
                              <tr className="border-b border-stroke/20 last:border-0 hover:bg-white/5 transition-colors">
                                <td className="py-2 px-3 font-medium">3 Jam</td>
                                <td className="py-2 px-3 text-right text-emerald-400 font-semibold">Rp {property.transit3h.toLocaleString('id-ID')}</td>
                              </tr>
                            ) : null}
                            {property.transit6h ? (
                              <tr className="border-b border-stroke/20 last:border-0 hover:bg-white/5 transition-colors">
                                <td className="py-2 px-3 font-medium">6 Jam</td>
                                <td className="py-2 px-3 text-right text-emerald-400 font-semibold">Rp {property.transit6h.toLocaleString('id-ID')}</td>
                              </tr>
                            ) : null}
                             {property.transit12h ? (
                               <tr className="border-b border-stroke/20 last:border-0 hover:bg-white/5 transition-colors">
                                 <td className="py-2 px-3 font-medium">12 Jam</td>
                                 <td className="py-2 px-3 text-right text-emerald-400 font-semibold">Rp {property.transit12h.toLocaleString('id-ID')}</td>
                               </tr>
                             ) : null}
                             {property.transit24h ? (
                               <tr className="border-b border-stroke/20 last:border-0 hover:bg-white/5 transition-colors">
                                 <td className="py-2 px-3 font-medium">24 Jam</td>
                                 <td className="py-2 px-3 text-right text-emerald-400 font-semibold">Rp {property.transit24h.toLocaleString('id-ID')}</td>
                               </tr>
                             ) : null}
                             {!property.transit3h && !property.transit6h && !property.transit12h && !property.transit24h && property.hourlyRate ? (
                               <tr className="hover:bg-white/5 transition-colors">
                                 <td className="py-2 px-3 font-medium">Per Jam</td>
                                 <td className="py-2 px-3 text-right text-emerald-400 font-semibold">Rp {property.hourlyRate.toLocaleString('id-ID')} / jam</td>
                               </tr>
                             ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bg/30 border border-dashed border-stroke/50 rounded-2xl p-4 flex flex-col text-center opacity-70">
                      <span className="text-[9px] text-muted uppercase tracking-widest font-semibold mb-1">Pemesanan Transit</span>
                      <span className="text-xs text-muted font-medium">Properti ini tidak mendukung transit</span>
                    </div>
                  )}
                </div>

                {/* Card Info Bulletins */}
                <div className="flex flex-col gap-3.5 mb-8 text-left border-t border-stroke/50 pt-5">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] text-muted leading-tight">Persetujuan check-in instan & aktivasi kunci</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-[11px] text-muted leading-tight">Pembayaran aman & durasi fleksibel</span>
                  </div>
                  {supportsTransit && (
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={14} className="text-text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] text-muted leading-tight">Durasi transit pendek tersedia 24/7</span>
                    </div>
                  )}
                </div>

                {/* Booking Call to Action */}
                <button
                  disabled={!isAvailable}
                  onClick={() => setBookingOpen(true)}
                  className={`w-full py-4 px-6 rounded-full font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2 select-none transition-all duration-300 ${
                    isAvailable 
                      ? 'bg-text-primary text-bg hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-text-primary/10' 
                      : 'bg-stroke/50 text-muted cursor-not-allowed'
                  }`}
                >
                  {isAvailable ? (
                    <>
                      Pesan Ruang <ChevronRight size={16} />
                    </>
                  ) : (
                    'Saat Ini Tidak Tersedia'
                  )}
                </button>

                {/* WhatsApp Inquiry Button */}
                <a
                  href={`https://wa.me/${settings?.whatsapp_number || '628123456789'}?text=${encodeURIComponent(
                    `Halo Admin, saya tertarik dengan properti "${property.title}" (${property.location}). Apakah masih tersedia untuk pemesanan?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 rounded-full font-semibold text-xs md:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 mt-3 select-none transition-all duration-300 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 active:scale-[0.98] shadow-lg shadow-emerald-500/5"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-4 h-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Tanyakan via WhatsApp
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Render Booking Modal inside Property Page */}
      <BookingModal 
        isOpen={bookingOpen}
        property={property}
        onClose={() => setBookingOpen(false)}
      />

      {/* Lightbox Modal for Inspecting Photo */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              setIsLightboxOpen(false);
              setIsZoomed(false);
            }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md cursor-zoom-out select-none"
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.1 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
                setIsZoomed(false);
              }}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors z-[110] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95"
              aria-label="Close inspection"
            >
              <X size={20} />
            </motion.button>

            {/* Photo Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-[92vw] max-h-[70vh] md:max-w-[85vw] md:max-h-[75vh] rounded-2xl overflow-hidden flex items-center justify-center bg-black/40 border border-white/5 shadow-2xl"
            >
              <div
                className={`relative overflow-hidden w-full h-full flex items-center justify-center ${
                  isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
                onMouseMove={(e) => {
                  if (!isZoomed) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  setZoomPos({ x, y });
                }}
                onMouseLeave={() => {
                  if (isZoomed) {
                    setIsZoomed(false);
                  }
                }}
              >
                <img
                  src={property.image}
                  alt={property.title}
                  style={{
                    transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center',
                    transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                    transition: isZoomed ? 'transform 0.1s ease-out' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="max-w-full max-h-[70vh] md:max-h-[75vh] object-contain rounded-xl select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
              </div>
            </motion.div>

            {/* Info Caption Bar at the bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="mt-6 bg-surface/80 backdrop-blur-lg border border-stroke rounded-2xl p-4 max-w-[92vw] w-[500px] flex items-center justify-between shadow-2xl text-left"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">{property.category}</span>
                <h4 className="text-text-primary text-sm font-medium font-display leading-tight">{property.title}</h4>
                <p className="text-muted text-[10px] flex items-center gap-1">
                  <MapPin size={10} className="text-muted" /> {property.location}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="bg-bg/90 border border-stroke text-text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Star size={10} className="fill-amber-400 stroke-amber-400" /> {property.rating}
                </span>
                <span className="text-emerald-400 font-medium text-xs">
                  {property.promoPrice ? (
                    <>Rp. {Number(property.promoPrice).toLocaleString('id-ID')} <span className="text-[10px] text-muted font-normal">/ bulan</span></>
                  ) : (
                    <>{property.price}</>
                  )}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
