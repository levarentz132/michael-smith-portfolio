import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Star, Compass, Coffee, 
  Sparkles, Phone, Clock, X, ChevronLeft, ChevronRight,
  Waves, Car, Trees, Dumbbell, ShowerHead, Tv
} from 'lucide-react';
import { fetchSettings, fetchProperties, type Property, type UserSession, type WebsiteSettings } from '../api';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useSEO } from '../hooks/useSEO';

export const ResortPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  
  // SEO optimization
  useSEO({
    title: 'Highlander Resort Bogor | Highlanderstay Resort Ciapus',
    description: 'Pesan Highlander Resort di Ciapus, Bogor melalui Highlanderstay. Pilihan vila keluarga, kamar nyaman, kolam renang, dan lokasi dekat Curug Nangka.',
    keywords: 'Highlander Resort, Highlanderstay Resort, Resort Highlander Bogor, Highlander Resort Ciapus, resort dekat Curug Nangka, villa keluarga Bogor',
    canonicalUrl: 'https://highlanderstay.com/resort',
    imageUrl: 'https://highlanderstay.com/resort/building-main.jpeg',
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["Hotel", "Resort"],
          "@id": "https://highlanderstay.com/resort#resort",
          "name": "Highlander Resort",
          "alternateName": ["Resort Highlander", "Highlanderstay Resort"],
          "description": "Highlander Resort adalah resort keluarga di Ciapus, Bogor, dekat Curug Nangka dengan vila, kolam renang outdoor, taman, area bermain, dan parkir.",
          "url": "https://highlanderstay.com/resort",
          "mainEntityOfPage": "https://highlanderstay.com/resort",
          "image": [
            "https://highlanderstay.com/resort/building-main.jpeg",
            "https://highlanderstay.com/resort/lobby.jpeg",
            "https://highlanderstay.com/resort/bedroom.jpeg",
            "https://highlanderstay.com/resort/pool.jpeg"
          ],
          "sameAs": ["https://www.traveloka.com/id-id/hotel/indonesia/resort-highlander-3000010034492"],
          "numberOfRooms": 9,
          "checkinTime": "14:00",
          "checkoutTime": "12:00",
          "priceRange": "Rp371.901-Rp743.802 per malam",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": 7.3,
            "reviewCount": 100,
            "bestRating": 10,
            "worstRating": 1
          },
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Jalan Raya Curug Nangka, Kp. Sinar Wangi RT 05/RW 06, Desa Sukajaya",
            "addressLocality": "Ciapus, Bogor",
            "addressRegion": "Jawa Barat",
            "postalCode": "16610",
            "addressCountry": "ID"
          },
          "amenityFeature": [
            { "@type": "LocationFeatureSpecification", "name": "Kolam renang outdoor", "value": true },
            { "@type": "LocationFeatureSpecification", "name": "Area parkir", "value": true },
            { "@type": "LocationFeatureSpecification", "name": "Taman", "value": true },
            { "@type": "LocationFeatureSpecification", "name": "Area bermain anak", "value": true }
          ]
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Highlanderstay", "item": "https://highlanderstay.com/" },
            { "@type": "ListItem", "position": 2, "name": "Highlander Resort", "item": "https://highlanderstay.com/resort" }
          ]
        }
      ]
    }
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

  const [resortProperties, setResortProperties] = useState<Property[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const resortDefaults = {
    heroEyebrow: 'Resort Alam di Kaki Gunung Salak',
    heroTitle: 'Resort Highlander',
    heroDescription: 'Tempat beristirahat yang tenang di kawasan Ciapus, Bogor, dekat Curug Nangka dengan udara sejuk, pemandangan hijau, dan ruang luas untuk liburan bersama keluarga.',
    heroImage: '/resort/building-main.jpeg',
    locationLabel: 'Ciapus, Bogor, Jawa Barat',
    elevationLabel: 'Sekitar 15 km dari pusat Bogor',
    ratingLabel: '7.3/10 Traveloka Rating (Bintang 1)',
    featureEyebrow: 'Liburan di Ciapus',
    featureTitle: 'Suasana tenang, udara sejuk, dan dekat dengan alam.',
    featureDescription: 'Resort Highlander berada di Jalan Raya Curug Nangka, Kampung Sinar Wangi, Sukajaya. Properti ini memiliki 9 kamar, kolam renang outdoor, taman, area bermain anak, area parkir, dan ruang fungsional.',
    featureImage: '/resort/pool.jpeg',
    featureCardTitle: 'Kolam Renang Outdoor',
    featureCardDescription: 'Nikmati waktu santai bersama keluarga dengan suasana hijau kawasan Gunung Salak.',
    collectionEyebrow: 'Pilihan Menginap',
    collectionTitle: 'Kamar & Vila Resort Highlander',
    collectionDescription: 'Harga berikut adalah harga mulai yang dipublikasikan OTA dan dapat berubah sesuai tanggal menginap serta ketersediaan.',
    ctaEyebrow: 'Reservasi Langsung',
    ctaTitle: 'Rencanakan Liburan Anda di Bogor',
    ctaDescription: 'Hubungi admin untuk mengecek ketersediaan kamar dan mendapatkan harga terbaru untuk tanggal menginap Anda.'
  };
  const resortPage = { ...resortDefaults, ...(settings?.resort_page || {}) };

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = async () => {
      try {
        const settingsData = await fetchSettings();
        setSettings(settingsData);
        
        const propsData = await fetchProperties();
        const configuredIds = settingsData.resort_property_ids || [];
        const filtered = configuredIds.length > 0
          ? propsData.filter(p => p.id && configuredIds.includes(p.id))
          : propsData.filter(p =>
              p.type === 'resort' ||
              p.type === 'villa' ||
              p.title.toLowerCase().includes('resort')
            );
        setResortProperties(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
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
      name: "Vila, 5 Kamar Tidur",
      price: "Cek harga",
      description: "Vila luas dengan lima kamar tidur untuk liburan keluarga besar atau rombongan di kawasan sejuk Resort Highlander.",
      size: "5 Kamar Tidur",
      occupancy: "10 Tamu",
      image: "/resort/building-main.jpeg",
      features: ["5 Tempat Tidur Queen", "Vila Privat", "Area Keluarga", "Akses Fasilitas Resort"]
    },
    {
      name: "Vila Keluarga, 2 Kamar Tidur",
      price: "Cek harga",
      description: "Vila keluarga dengan dua kamar tidur, cocok untuk keluarga kecil yang ingin menikmati suasana alam Bogor.",
      size: "2 Kamar Tidur",
      occupancy: "4 Tamu",
      image: "/resort/building-2.jpeg",
      features: ["2 Tempat Tidur Queen", "Vila Keluarga", "Teras", "Akses Fasilitas Resort"]
    },
    {
      name: "Rumah Panggung",
      price: "Mulai Rp 371.901",
      description: "Pilihan ekonomis untuk menikmati suasana alam Resort Highlander dengan fasilitas dasar yang nyaman.",
      size: "Kamar Resort",
      occupancy: "Cek Kapasitas",
      image: "/resort/bedroom.jpeg",
      features: ["Pancuran", "TV", "Air Panas", "Area Hijau"]
    },
    {
      name: "Villa Gerbang",
      price: "Mulai Rp 619.835",
      description: "Vila nyaman untuk keluarga atau grup kecil dengan akses ke fasilitas resort dan lingkungan yang sejuk.",
      size: "Vila",
      occupancy: "Cek Kapasitas",
      image: "/resort/building-2.jpeg",
      features: ["Kolam Renang", "Parkir", "Taman", "Layanan Kamar"]
    },
    {
      name: "Villa View",
      price: "Mulai Rp 743.802",
      description: "Vila dengan pemandangan pegunungan sekitar untuk pengalaman menginap yang lebih dekat dengan alam.",
      size: "Vila View",
      occupancy: "Cek Kapasitas",
      image: "/resort/building-3.jpeg",
      features: ["Mountain View", "Teras", "TV", "Sarapan Tersedia"]
    }
  ];

  const resortPhotos = [
    { src: '/resort/building-main.jpeg', label: 'Bangunan utama' },
    { src: '/resort/lobby.jpeg', label: 'Lobi' },
    { src: '/resort/bedroom.jpeg', label: 'Kamar tidur' },
    { src: '/resort/pool.jpeg', label: 'Kolam renang' },
    { src: '/resort/building-2.jpeg', label: 'Area bangunan' },
    { src: '/resort/building-3.jpeg', label: 'Bangunan resort' },
    { src: '/resort/function-room.jpeg', label: 'Ruang fungsional' }
  ];

  const managedResortListings = resortProperties.map(p => ({
    name: p.title,
    price: Number.isFinite(Number(p.promoPrice ?? p.rawPrice))
      ? `Rp ${Number(p.promoPrice ?? p.rawPrice).toLocaleString('id-ID')}`
      : p.price.replace(/\s*\/\s*(month|night|bulan|malam).*$/i, ''),
    description: p.description || 'Akomodasi Resort Highlander dengan akses ke fasilitas resort.',
    size: p.type === 'villa' ? 'Vila' : 'Kamar Resort',
    occupancy: `${p.rooms || 1} Kamar`,
    image: p.image || '/resort/building-main.jpeg',
    features: ['Wi-Fi', 'Kolam Renang', 'Parkir', 'Ciapus, Bogor']
  }));

  const accommodationListings = [...villas, ...managedResortListings].filter(
    (listing, index, listings) => listings.findIndex(item => item.name.toLowerCase() === listing.name.toLowerCase()) === index
  );

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
            backgroundImage: `url('${resortPage.heroImage || '/resort_hero.png'}')`,
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
            <span>{resortPage.heroEyebrow}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="text-4xl sm:text-6xl md:text-8xl font-display italic font-semibold text-text-primary mt-2"
          >
            {resortPage.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-sm md:text-base text-muted max-w-2xl leading-relaxed font-light"
          >
            {resortPage.heroDescription}
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
                <span className="text-xs text-text-primary font-semibold">{resortPage.locationLabel}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-stroke/60" />
            <div className="flex items-center gap-3">
              <Compass className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <span className="text-[9px] text-muted uppercase tracking-wider block">Elevasi</span>
                <span className="text-xs text-text-primary font-semibold">{resortPage.elevationLabel}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-stroke/60" />
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500" />
              <div className="text-left">
                <span className="text-[9px] text-muted uppercase tracking-wider block">Rating Resensi</span>
                <span className="text-xs text-text-primary font-semibold">{resortPage.ratingLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Property photo gallery */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 text-left">
          <div>
            <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">Galeri Properti</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium mt-3">Lihat Resort Highlander</h2>
          </div>
          <p className="text-xs text-muted max-w-sm leading-relaxed">
            Bangunan, lobi, kamar, ruang berkumpul, dan fasilitas yang tersedia di resort.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[150px] md:auto-rows-[210px] gap-3">
          {resortPhotos.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setSelectedPhoto(index)}
              className={`relative overflow-hidden rounded-lg border border-stroke group ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
              aria-label={`Buka foto ${photo.label}`}
            >
              <img
                src={photo.src}
                alt={`${photo.label} Resort Highlander`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 p-3 text-left text-xs font-semibold text-white bg-gradient-to-t from-black/80 to-transparent">
                {photo.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Resort Features Section */}
      <section className="py-20 md:py-32 max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-6 text-left">
            <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">{resortPage.featureEyebrow}</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium leading-tight">
              {resortPage.featureTitle}
            </h2>
            <p className="text-sm text-muted font-light leading-relaxed">
              {resortPage.featureDescription}
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
              src={resortPage.featureImage || '/resort_hero.png'}
              alt="Resort Pool Sunset" 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-surface/80 backdrop-blur-md border border-stroke/50 p-6 rounded-2xl text-left">
              <span className="text-[9px] text-amber-500 uppercase tracking-wider block font-bold">Featured Sanctuary</span>
              <h4 className="text-base font-semibold mt-1">{resortPage.featureCardTitle}</h4>
              <p className="text-xs text-muted mt-1 font-light leading-relaxed">{resortPage.featureCardDescription}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resort information */}
      <section className="py-20 border-y border-stroke/50 bg-surface/30">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20 text-left">
            <div>
              <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">Informasi Menginap</span>
              <h2 className="text-3xl md:text-4xl font-display font-medium mt-3">Fasilitas dan kebijakan resort</h2>
              <p className="text-sm text-muted leading-relaxed mt-5">
                Jalan Raya Curug Nangka, Kp. Sinar Wangi RT 05/RW 06, Desa Sukajaya, Bogor, Jawa Barat 16610.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-8">
                <div className="border border-stroke rounded-lg p-4">
                  <span className="text-[10px] uppercase tracking-wider text-muted">Check-in</span>
                  <p className="text-sm font-semibold mt-1">14:00 - 23:00</p>
                </div>
                <div className="border border-stroke rounded-lg p-4">
                  <span className="text-[10px] uppercase tracking-wider text-muted">Check-out</span>
                  <p className="text-sm font-semibold mt-1">Sampai 12:00</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8">
              {[
                { icon: Waves, title: 'Kolam renang outdoor' },
                { icon: Car, title: 'Area parkir' },
                { icon: Trees, title: 'Taman & area bermain' },
                { icon: Dumbbell, title: 'Pusat kebugaran' },
                { icon: ShowerHead, title: 'Pancuran & air panas' },
                { icon: Tv, title: 'TV dalam kamar' }
              ].map(({ icon: Icon, title }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold leading-relaxed pt-1">{title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accommodations Section */}
      <section id="accommodations" className="py-20 bg-surface/30 border-y border-stroke/50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-3 mb-16">
            <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">{resortPage.collectionEyebrow}</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium">{resortPage.collectionTitle}</h2>
            <p className="text-xs md:text-sm text-muted font-light leading-relaxed">
              {resortPage.collectionDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {accommodationListings.map((villa, idx) => (
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
                    {villa.price}{villa.price === 'Cek harga' ? '' : ' / malam'}
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
          <span className="text-[10px] text-amber-500 uppercase tracking-[0.25em] font-bold">{resortPage.ctaEyebrow}</span>
          <h3 className="text-2xl sm:text-4xl font-display font-medium">{resortPage.ctaTitle}</h3>
          <p className="text-xs sm:text-sm text-muted max-w-md leading-relaxed font-light">
            {resortPage.ctaDescription}
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

      {selectedPhoto !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-label="Galeri Resort Highlander"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Tutup galeri"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedPhoto((selectedPhoto - 1 + resortPhotos.length) % resortPhotos.length);
            }}
            className="absolute left-3 md:left-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <figure className="max-w-6xl max-h-full" onClick={(event) => event.stopPropagation()}>
            <img
              src={resortPhotos[selectedPhoto].src}
              alt={`${resortPhotos[selectedPhoto].label} Resort Highlander`}
              className="max-w-full max-h-[82vh] object-contain"
            />
            <figcaption className="text-center text-sm text-white/80 mt-4">
              {resortPhotos[selectedPhoto].label} · {selectedPhoto + 1} / {resortPhotos.length}
            </figcaption>
          </figure>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setSelectedPhoto((selectedPhoto + 1) % resortPhotos.length);
            }}
            className="absolute right-3 md:right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Foto berikutnya"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
