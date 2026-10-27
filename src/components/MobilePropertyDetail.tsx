import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  ShieldCheck,
  FileText,
  Sparkles,
  CheckCircle2,
  DoorOpen,
  X,
  ChevronRight,
  ChevronDown,
  Droplets,
  BedDouble,
  Zap,
  Wind,
  Tv,
  Bath,
  ExternalLink,
  MessageCircle,
  Building,
  RotateCcw,
  Check,
  Layers,
  Wifi,
  Coffee,
  Car,
  Key,
  Users,
  Compass,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Property, WebsiteSettings, UserSession, AvailableRoomDetail } from '../api';
import { useFavorites, toggleFavoriteProperty } from '../utils/favorites';

export interface MobilePropertyDetailProps {
  property: Property;
  settings?: WebsiteSettings | null;
  userSession?: UserSession | null;
  selectedRoomName?: string;
  onSelectRoomName: (roomName: string) => void;
  onBookClick: () => void;
  onContactWhatsApp: (customText?: string) => void;
  onOpenPhotoLightbox: (index: number) => void;
}

export const MobilePropertyDetail: React.FC<MobilePropertyDetailProps> = ({
  property,
  settings,
  userSession: _userSession,
  selectedRoomName,
  onSelectRoomName,
  onBookClick,
  onContactWhatsApp,
  onOpenPhotoLightbox,
}) => {
  const navigate = useNavigate();
  const { favoriteIds } = useFavorites();
  const isFavorited = property.id ? favoriteIds.includes(Number(property.id)) : false;

  // Gallery State
  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Scroll position for sticky header
  const [isScrolled, setIsScrolled] = useState(false);

  // Modals & Bottom Sheets
  const [isEstimasiOpen, setIsEstimasiOpen] = useState(false);
  const [isAllFacilitiesOpen, setIsAllFacilitiesOpen] = useState(false);
  const [isRoomPickerOpen, setIsRoomPickerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Process Real Images List (no dummy photos)
  const images = useMemo(() => {
    if (property.imageUrls && property.imageUrls.length > 0) {
      return property.imageUrls.filter(Boolean);
    }
    if (property.image) {
      return [property.image];
    }
    return [];
  }, [property]);

  // Handle gallery scroll event to update counter (e.g. 2 / 6)
  const handleGalleryScroll = () => {
    if (!galleryScrollRef.current) return;
    const { scrollLeft, clientWidth } = galleryScrollRef.current;
    if (clientWidth > 0 && images.length > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setActivePhotoIdx(Math.min(Math.max(0, idx), images.length - 1));
    }
  };

  // Track scroll position for sticky top bar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 160);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Favorite toggle handler
  const handleToggleFavorite = () => {
    if (!property.id) return;
    const added = toggleFavoriteProperty(property.id);
    setToastMessage(added ? 'Tersimpan ke Favorit' : 'Dihapus dari Favorit');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Share handler
  const handleShare = async () => {
    const shareData = {
      title: property.title,
      text: `Sewa ${property.title} di ${property.location} melalui HighlanderStay`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User canceled or failed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setToastMessage('Link properti berhasil disalin!');
      setTimeout(() => setToastMessage(null), 2500);
    } catch {
      setToastMessage('Gagal menyalin link');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  // Real Available rooms list from API (no fake rooms)
  const roomDetails: AvailableRoomDetail[] = useMemo(() => {
    if (property.availableRoomDetails && property.availableRoomDetails.length > 0) {
      return property.availableRoomDetails;
    }
    if (property.availableRoomsList && property.availableRoomsList.length > 0) {
      return property.availableRoomsList.map((name, i) => ({
        id: i + 1,
        name,
        monthly_rate: property.rawPrice,
      }));
    }
    return [];
  }, [property]);

  const activeRoom = useMemo(() => {
    if (!selectedRoomName) return roomDetails[0] || null;
    return (
      roomDetails.find(
        (r) =>
          r.name.toLowerCase() === selectedRoomName.toLowerCase() ||
          `Kamar ${r.name}`.toLowerCase() === selectedRoomName.toLowerCase()
      ) || roomDetails[0] || null
    );
  }, [roomDetails, selectedRoomName]);

  // Real Pricing Calculation (no dummy hardcoding)
  const monthlyRent = useMemo(() => {
    if (activeRoom?.monthly_rate && Number(activeRoom.monthly_rate) > 0) {
      return Number(activeRoom.monthly_rate);
    }
    if (property.promoPrice && Number(property.promoPrice) > 0) {
      return Number(property.promoPrice);
    }
    if (property.rawPrice && Number(property.rawPrice) > 0) {
      return Number(property.rawPrice);
    }
    return 0;
  }, [activeRoom, property]);

  // Real Deposit from API
  const depositAmount = useMemo(() => {
    if (property.deposit_amount !== undefined && property.deposit_amount !== null) {
      return Number(property.deposit_amount);
    }
    if (property.deposit !== undefined && property.deposit !== null) {
      return Number(property.deposit);
    }
    return 0;
  }, [property]);

  const totalFirstPayment = monthlyRent + depositAmount;

  // Real Gender/Category mapping from property data
  const genderCategory = useMemo(() => {
    const titleLower = (property.title || '').toLowerCase();
    const catLower = (property.category || '').toLowerCase();
    if (titleLower.includes('putri') || catLower.includes('putri')) return 'Kos Putri';
    if (titleLower.includes('putra') || catLower.includes('putra')) return 'Kos Putra';
    if (property.type === 'apartment') return 'Apartemen';
    if (property.type === 'resort' || property.type === 'villa') return 'Villa / Resort';
    return 'Kos Campur';
  }, [property]);

  // Real Remaining Rooms count from API
  const remainingRoomsCount = property.availableRooms !== undefined && property.availableRooms !== null
    ? property.availableRooms
    : (roomDetails.length > 0 ? roomDetails.length : null);
  const isAvailable = property.status !== 'booked' && (remainingRoomsCount === null || remainingRoomsCount > 0);

  // REAL FACILITIES ONLY (No dummy fallback)
  const realFacilities: string[] = useMemo(() => {
    if (Array.isArray(property.facilities) && property.facilities.length > 0) {
      return property.facilities.filter((f) => typeof f === 'string' && f.trim().length > 0);
    }
    return [];
  }, [property.facilities]);

  const roomFacilities = useMemo(() => {
    return realFacilities.filter((f) => {
      const l = f.toLowerCase();
      return (
        l.includes('ac') ||
        l.includes('kasur') ||
        l.includes('bed') ||
        l.includes('meja') ||
        l.includes('kursi') ||
        l.includes('tv') ||
        l.includes('lemari') ||
        l.includes('storage') ||
        l.includes('wifi') ||
        l.includes('internet') ||
        l.includes('bantal') ||
        l.includes('sprei') ||
        l.includes('jendela') ||
        l.includes('ventilasi')
      );
    });
  }, [realFacilities]);

  const bathroomFacilities = useMemo(() => {
    return realFacilities.filter((f) => {
      const l = f.toLowerCase();
      return (
        l.includes('mandi') ||
        l.includes('heater') ||
        l.includes('air') ||
        l.includes('kloset') ||
        l.includes('shower') ||
        l.includes('toilet') ||
        l.includes('wastafel')
      );
    });
  }, [realFacilities]);

  const buildingFacilities = useMemo(() => {
    return realFacilities.filter((f) => {
      return !roomFacilities.includes(f) && !bathroomFacilities.includes(f);
    });
  }, [realFacilities, roomFacilities, bathroomFacilities]);

  const hasElectricityMention = useMemo(() => {
    return realFacilities.some((f) => f.toLowerCase().includes('listrik'));
  }, [realFacilities]);

  // Real Dynamic Facility Icon Picker
  const renderFacilityIcon = (facilityName: string) => {
    const l = facilityName.toLowerCase();
    if (l.includes('ac')) return <Wind size={16} className="text-cyan-400 shrink-0" />;
    if (l.includes('wifi') || l.includes('internet')) return <Wifi size={16} className="text-amber-400 shrink-0" />;
    if (l.includes('kasur') || l.includes('bed') || l.includes('bantal')) return <BedDouble size={16} className="text-emerald-400 shrink-0" />;
    if (l.includes('mandi') || l.includes('shower') || l.includes('toilet')) return <Bath size={16} className="text-blue-400 shrink-0" />;
    if (l.includes('heater') || l.includes('air panas')) return <Droplets size={16} className="text-cyan-400 shrink-0" />;
    if (l.includes('meja') || l.includes('kursi')) return <DoorOpen size={16} className="text-amber-400 shrink-0" />;
    if (l.includes('tv') || l.includes('netflix')) return <Tv size={16} className="text-purple-400 shrink-0" />;
    if (l.includes('lemari') || l.includes('storage')) return <Building size={16} className="text-slate-400 shrink-0" />;
    if (l.includes('cctv') || l.includes('keamanan') || l.includes('satpam')) return <ShieldCheck size={16} className="text-emerald-400 shrink-0" />;
    if (l.includes('parkir') || l.includes('motor') || l.includes('mobil')) return <Car size={16} className="text-orange-400 shrink-0" />;
    if (l.includes('dapur') || l.includes('masak')) return <Coffee size={16} className="text-amber-400 shrink-0" />;
    if (l.includes('listrik')) return <Zap size={16} className="text-yellow-400 shrink-0" />;
    if (l.includes('gerbang') || l.includes('kunci') || l.includes('smart lock')) return <Key size={16} className="text-indigo-400 shrink-0" />;
    return <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />;
  };

  // Real Map URLs & Coordinates
  const hasCoordinates = typeof property.latitude === 'number' && typeof property.longitude === 'number' && !isNaN(property.latitude) && !isNaN(property.longitude);
  const realAddressQuery = property.address || property.location || property.title;
  const realGoogleMapsUrl = property.addressUrl || property.mapUrl || (
    hasCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.title} ${realAddressQuery}`)}`
  );

  const realEmbedMapUrl = hasCoordinates
    ? `https://maps.google.com/maps?q=${property.latitude},${property.longitude}&hl=id&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(`${property.title} ${realAddressQuery}`)}&hl=id&z=15&output=embed`;

  // Real Owner / Branch Name
  const realOwnerTitle = property.branchId ? `HighlanderStay Cabang #${property.branchId}` : (settings?.logo_text || 'HighlanderStay Management');
  const realOwnerPhone = property.phone || settings?.whatsapp_number || null;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 pb-36 select-none font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[90] bg-slate-900/95 border border-amber-400/40 text-amber-300 text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2"
          >
            <Check size={14} className="text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP APP BAR */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 px-3 py-2.5 flex items-center justify-between gap-2 ${
          isScrolled
            ? 'bg-[#0d1322]/95 backdrop-blur-xl border-b border-white/10 shadow-lg'
            : 'bg-transparent pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isScrolled
              ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white active:scale-95'
              : 'pointer-events-auto bg-black/45 backdrop-blur-md text-white border border-white/20 active:scale-95 shadow-lg'
          }`}
          aria-label="Kembali"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Center Title + Room Selector (Only visible when scrolled) */}
        {isScrolled && (
          <div
            onClick={() => {
              if (roomDetails.length > 1) setIsRoomPickerOpen(true);
            }}
            className="flex-1 min-w-0 px-2 flex flex-col items-center justify-center cursor-pointer text-center"
          >
            <h2 className="text-xs font-bold text-white truncate max-w-[220px]">
              {property.title}
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
              <span className="truncate">
                {selectedRoomName || (activeRoom ? `Kamar ${activeRoom.name}` : 'Pilih Kamar')}
              </span>
              {roomDetails.length > 1 && <ChevronDown size={13} className="text-amber-400" />}
            </div>
          </div>
        )}

        {/* Right Action Icons: Favorite & Share */}
        <div
          className={`flex items-center gap-2 ${
            !isScrolled ? 'pointer-events-auto' : ''
          }`}
        >
          <button
            type="button"
            onClick={handleToggleFavorite}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isScrolled
                ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white'
                : 'bg-black/45 backdrop-blur-md text-white border border-white/20 shadow-lg'
            }`}
            aria-label="Simpan Favorit"
          >
            <Heart
              size={18}
              className={
                isFavorited ? 'fill-rose-500 text-rose-500' : 'text-white'
              }
            />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
              isScrolled
                ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white'
                : 'bg-black/45 backdrop-blur-md text-white border border-white/20 shadow-lg'
            }`}
            aria-label="Bagikan Properti"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* 2. HERO IMAGE GALLERY */}
      <div className="relative w-full aspect-[4/3] bg-black overflow-hidden">
        {images.length > 0 ? (
          <div
            ref={galleryScrollRef}
            onScroll={handleGalleryScroll}
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar"
          >
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                onClick={() => onOpenPhotoLightbox(idx)}
                className="w-full h-full shrink-0 snap-center relative cursor-zoom-in"
              >
                <img
                  src={imgUrl}
                  alt={`${property.title} - Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs">
            Foto properti belum diunggah
          </div>
        )}

        {/* Counter Badge on Bottom-Left: "1 / X" */}
        {images.length > 0 && (
          <div className="absolute bottom-3 left-3 z-10">
            <div className="px-2.5 py-1 rounded-md bg-black/65 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold tracking-wider">
              {activePhotoIdx + 1} / {images.length}
            </div>
          </div>
        )}

        {/* "Lihat semua foto" Button on Bottom-Right */}
        {images.length > 0 && (
          <div className="absolute bottom-3 right-3 z-10">
            <button
              type="button"
              onClick={() => onOpenPhotoLightbox(activePhotoIdx)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-xl hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Lihat semua foto</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. PRIMARY PROPERTY INFO */}
      <section className="px-4 pt-4 pb-4 bg-[#0d1322] border-b border-white/[0.08]">
        {/* Brand Tag */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-amber-400 font-extrabold text-sm tracking-wide flex items-center gap-1">
            <Sparkles size={14} className="fill-amber-400 text-amber-400" />
            Kos Andalan
          </span>
          <span className="text-[10px] text-slate-400 font-medium">• Terverifikasi</span>
        </div>

        {/* Property Title */}
        <h1 className="text-lg font-bold text-white leading-snug">
          {property.title}
        </h1>

        {/* Chips Row: [Gender/Category] · 📍 Location */}
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-md border border-white/20 bg-white/[0.04] text-xs font-medium text-slate-200">
            {genderCategory}
          </span>
          {(property.kecamatan || property.location) && (
            <span className="text-slate-400 text-xs flex items-center gap-1">
              <span>•</span>
              <MapPin size={13} className="text-amber-400" />
              <span>{property.kecamatan || property.location}</span>
            </span>
          )}
        </div>

        {/* Real Units Availability from API */}
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          {property.availabilityStatus ? (
            <span className="text-slate-300">
              Status:{' '}
              <strong className="text-emerald-400 font-bold">
                {property.availabilityStatus}
              </strong>
            </span>
          ) : isAvailable ? (
            <span className="text-slate-300">
              Tersedia:{' '}
              <strong className="text-rose-400 font-bold">
                {remainingRoomsCount !== null ? `${remainingRoomsCount} Kamar Siap Huni` : 'Kamar Siap Huni'}
              </strong>
            </span>
          ) : (
            <span className="text-rose-400 font-bold">
              Kamar Sedang Penuh
            </span>
          )}
        </div>

        {/* Description (if provided by database) */}
        {property.description && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] text-xs text-slate-300 leading-relaxed font-light">
            {property.description}
          </div>
        )}

        {/* Subtle Divider */}
        <div className="border-t border-white/[0.08] my-4" />

        {/* Real Host / Owner Section */}
        <div
          onClick={() => onContactWhatsApp()}
          className="flex items-center justify-between cursor-pointer active:opacity-80 transition-opacity"
        >
          <div>
            <h3 className="text-sm font-bold text-white">Pengelola Properti</h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {realOwnerPhone ? `WhatsApp: ${realOwnerPhone}` : 'Resmi HighlanderStay'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-right">
              <span className="text-[11px] font-black tracking-wider text-slate-200 block uppercase">
                {realOwnerTitle}
              </span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
        </div>
      </section>

      {/* 4. REAL ROOM TYPE SELECTION (Only when API provides room details) */}
      {roomDetails.length > 0 && (
        <section className="px-4 py-3 bg-[#0a0f1d] border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pilihan Tipe Kamar
            </span>
            <span className="text-[10px] text-amber-400 font-medium">
              {roomDetails.length} Pilihan Ready
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {roomDetails.map((rm) => {
              const isSelected =
                selectedRoomName === rm.name ||
                selectedRoomName === `Kamar ${rm.name}` ||
                (!selectedRoomName && rm.id === roomDetails[0].id);

              return (
                <button
                  key={rm.id || rm.name}
                  type="button"
                  onClick={() => onSelectRoomName(`Kamar ${rm.name}`)}
                  className={`px-3 py-2 rounded-xl text-left border shrink-0 transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-amber-400/20 border-amber-400 text-white font-bold shadow-md shadow-amber-400/10'
                      : 'bg-[#111827] border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <DoorOpen size={14} className={isSelected ? 'text-amber-400' : 'text-slate-400'} />
                    <span className="text-xs">Kamar {rm.name}</span>
                  </div>
                  {rm.size_sqm ? (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {rm.size_sqm} m²
                    </span>
                  ) : rm.monthly_rate ? (
                    <span className="text-[10px] text-emerald-400 block mt-0.5">
                      Rp {Number(rm.monthly_rate).toLocaleString('id-ID')}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. KEUNGGULAN KOS ANDALAN & REFUND */}
      <section className="px-4 py-5 bg-[#0d1322] border-b border-white/[0.08]">
        <h2 className="text-base font-bold text-white mb-4">
          Keunggulan Layanan
        </h2>

        <div className="space-y-4">
          {/* Benefit 1: Booking Langsung & Pembayaran Instan */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Booking Langsung & Otomatis
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Pilih kamar, jadwalkan tanggal masuk, dan bayar sewa secara instan melalui sistem digital tanpa perantara.
              </p>
            </div>
          </div>

          {/* Benefit 2: Asuransi & Keamanan Unit */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Jaminan Unit Bersih & Siap Huni
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Setiap unit diverifikasi kelayakan fasilitasnya sebelum serah terima kunci kepada penyewa.
              </p>
            </div>
          </div>

          {/* Benefit 3: Survei Kamar Langsung */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
              <MessageCircle size={18} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">
                Bisa Jadwalkan Survei Lokasi
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Ingin melihat kamar secara langsung? Klik &ldquo;Tanya Pemilik&rdquo; untuk mengatur jadwal kunjungan survei.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.08] my-4" />

        {/* Ketentuan Refund */}
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
            <RotateCcw size={18} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Ketentuan Refund & Deposit</h3>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Deposit jaminan dikembalikan 100% setelah masa sewa berakhir sesuai syarat dan ketentuan perjanjian sewa.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SPESIFIKASI & FASILITAS KAMAR (100% REAL FROM DATABASE) */}
      <section className="px-4 py-5 bg-[#0a0f1d] border-b border-white/[0.08]">
        <h2 className="text-base font-bold text-white mb-3">
          Spesifikasi tipe kamar
        </h2>

        {/* Specs: Size and Capacity (Only if present in API) */}
        <div className="space-y-3">
          {activeRoom?.size_sqm ? (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-300">
                <Layers size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Ukuran Kamar: {activeRoom.size_sqm} m²
              </span>
            </div>
          ) : null}

          {activeRoom?.floor ? (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-300">
                <Building size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Posisi: Lantai {activeRoom.floor}
              </span>
            </div>
          ) : null}

          {activeRoom?.capacity ? (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-slate-300">
                <Users size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Kapasitas Maksimal: {activeRoom.capacity} Orang
              </span>
            </div>
          ) : null}

          {hasElectricityMention && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-amber-400">
                <Zap size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                Termasuk Listrik
              </span>
            </div>
          )}

          {!activeRoom?.size_sqm && !activeRoom?.floor && !activeRoom?.capacity && !hasElectricityMention && (
            <p className="text-xs text-slate-400 italic">
              Spesifikasi detail akan diinformasikan saat pemesanan kamar.
            </p>
          )}
        </div>

        {/* Real Fasilitas Kamar */}
        {realFacilities.length > 0 && (
          <>
            <div className="border-t border-white/[0.08] my-5" />
            <h2 className="text-base font-bold text-white mb-3">
              Fasilitas kamar
            </h2>

            {roomFacilities.length > 0 ? (
              <div className="space-y-3">
                {roomFacilities.slice(0, 5).map((fac, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {renderFacilityIcon(fac)}
                    <span className="text-xs text-slate-200">{fac}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Fasilitas kamar tertera pada daftar fasilitas lengkap.
              </p>
            )}

            {/* "Lihat semua fasilitas" Button */}
            <button
              type="button"
              onClick={() => setIsAllFacilitiesOpen(true)}
              className="w-full mt-4 py-2.5 px-4 rounded-xl border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] transition-all text-xs font-bold text-white text-center flex items-center justify-center gap-1.5"
            >
              <span>Lihat semua {realFacilities.length} fasilitas properti ini</span>
              <ChevronRight size={14} />
            </button>
          </>
        )}

        {/* Real Fasilitas Kamar Mandi */}
        {bathroomFacilities.length > 0 && (
          <>
            <div className="border-t border-white/[0.08] my-5" />
            <h2 className="text-base font-bold text-white mb-3">
              Fasilitas kamar mandi
            </h2>

            <div className="space-y-3">
              {bathroomFacilities.map((fac, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {renderFacilityIcon(fac)}
                  <span className="text-xs text-slate-200">{fac}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 7. REAL MAP & LOKASI (Zero fake roads or fake hospitals) */}
      <section className="px-4 py-5 bg-[#0d1322] border-b border-white/[0.08]">
        <h2 className="text-base font-bold text-white mb-2">
          Lokasi kos dan lingkungan sekitar
        </h2>

        {/* Real Address from Database */}
        <div className="flex items-start gap-2 text-xs text-slate-300 mb-3.5">
          <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <span>{property.address || property.location || 'Alamat dikonfirmasi oleh pengelola saat survei'}</span>
        </div>

        {/* REAL MAP EMBED IFRAME */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-[#162036] border border-white/10 shadow-lg">
          <iframe
            title="Peta Lokasi Google Maps"
            src={realEmbedMapUrl}
            className="w-full h-full border-0 filter contrast-[1.05] brightness-[0.95]"
            loading="lazy"
            allowFullScreen
          />

          {/* "Buka peta" Button on Bottom-Right */}
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <a
              href={realGoogleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-xl hover:bg-slate-100 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Buka peta</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Real Directions Action Card */}
        <div className="mt-4 p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Compass size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Petunjuk Arah</p>
              <p className="text-[10px] text-slate-400 truncate">{property.location || 'Buka rute navigasi di Google Maps'}</p>
            </div>
          </div>
          <a
            href={realGoogleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shrink-0 active:scale-95 transition-all"
          >
            Buka Rute
          </a>
        </div>
      </section>

      {/* 8. KETENTUAN PENGAJUAN SEWA */}
      <section className="px-4 py-5 bg-[#0a0f1d] border-b border-white/[0.08]">
        <h2 className="text-base font-bold text-white mb-3">
          Ketentuan pengajuan sewa
        </h2>

        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>Wajib melampirkan foto KTP asli yang masih berlaku saat verifikasi profil.</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>Kapasitas kamar sesuai jumlah yang ditentukan (maksimal 2 orang per kamar).</span>
          </div>
          {depositAmount > 0 ? (
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>Deposit jaminan Rp {depositAmount.toLocaleString('id-ID')} dikembalikan 100% setelah masa sewa selesai.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>Bebas deposit jaminan awal untuk properti ini.</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span>Menjaga ketenangan dan kebersihan bersama di lingkungan hunian.</span>
          </div>
        </div>
      </section>

      {/* 9. STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]">
        {/* Real Status Strip from API */}
        <div className="bg-[#fef3c7] text-[#78350f] border-t border-amber-200/80 px-4 py-1.5 flex items-center gap-2 text-xs font-bold shadow-inner">
          <div className="w-4 h-4 rounded-full bg-amber-400/50 flex items-center justify-center shrink-0">
            <DoorOpen size={11} className="text-[#78350f]" />
          </div>
          <span className="truncate">
            Status Unit: <strong className="text-black font-extrabold">{property.availabilityStatus || (remainingRoomsCount !== null ? `Ready ${remainingRoomsCount} Kamar` : 'Tersedia')}</strong>
          </span>
        </div>

        {/* Bottom Bar: Price, Estimasi Pembayaran, Tanya Pemilik, Ajukan Sewa */}
        <div className="bg-[#0e1424] border-t border-white/10 px-4 py-3 flex items-center justify-between gap-3">
          {/* Left Column: Price & Estimasi Pembayaran Link */}
          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-white truncate">
                {monthlyRent > 0 ? `Rp ${monthlyRent.toLocaleString('id-ID')}` : (property.price || 'Rp -')}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                /bulan
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsEstimasiOpen(true)}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 text-left underline underline-offset-2 active:opacity-75 transition-opacity"
            >
              Estimasi pembayaran
            </button>
          </div>

          {/* Right Column: 2 Action Buttons Side-by-Side */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Button 1: "Tanya Pemilik" */}
            <button
              type="button"
              onClick={() =>
                onContactWhatsApp(
                  `Halo Pengelola, saya tertarik dengan properti "${property.title}" (${property.location}). Apakah masih tersedia kamar untuk disurvei?`
                )
              }
              className="px-3 py-2.5 rounded-xl border border-emerald-500 bg-transparent text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <MessageCircle size={14} className="text-emerald-400" />
              <span>Tanya Pemilik</span>
            </button>

            {/* Button 2: "Ajukan Sewa" */}
            <button
              type="button"
              disabled={!isAvailable}
              onClick={onBookClick}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg active:scale-95 transition-all ${
                isAvailable
                  ? 'bg-[#10b981] hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <span>Ajukan Sewa</span>
            </button>
          </div>
        </div>
      </div>

      {/* 10. REAL ESTIMASI PEMBAYARAN BOTTOM SHEET */}
      <AnimatePresence>
        {isEstimasiOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0e1424] border-t border-white/10 rounded-t-3xl p-5 pb-8 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-emerald-400" />
                  Rincian Estimasi Pembayaran
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEstimasiOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Biaya Sewa Pokok (1 Bulan)</span>
                  <span className="font-bold text-white">
                    Rp {monthlyRent.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span className="flex items-center gap-1">
                    Deposit Jaminan {depositAmount > 0 ? <span className="text-[10px] text-amber-400 font-semibold">(Refundable)</span> : null}
                  </span>
                  <span className="font-bold text-white">
                    {depositAmount > 0 ? `Rp ${depositAmount.toLocaleString('id-ID')}` : 'Rp 0 (Tanpa Deposit)'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Biaya Administrasi & Platform</span>
                  <span className="font-bold text-emerald-400">GRATIS</span>
                </div>

                <div className="border-t border-white/10 pt-3 flex justify-between items-center text-sm">
                  <span className="font-bold text-white">Total Estimasi Pertama</span>
                  <span className="font-extrabold text-base text-amber-400">
                    Rp {totalFirstPayment.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {depositAmount > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
                  Deposit jaminan akan dikembalikan 100% penuh kepada penyewa di akhir masa sewa apabila tidak ada tunggakan sewa atau kerusakan unit.
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsEstimasiOpen(false);
                  onBookClick();
                }}
                className="w-full mt-5 py-3 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
              >
                Lanjut Ajukan Sewa
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. LIHAT SEMUA FASILITAS BOTTOM SHEET (100% REAL FROM DATABASE) */}
      <AnimatePresence>
        {isAllFacilitiesOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg max-h-[82vh] bg-[#0e1424] border-t border-white/10 rounded-t-3xl p-5 pb-8 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  Daftar Fasilitas Properti
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAllFacilitiesOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1">
                {roomFacilities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Fasilitas Kamar
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {roomFacilities.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-2.5 text-xs text-slate-200"
                        >
                          {renderFacilityIcon(f)}
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bathroomFacilities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Fasilitas Kamar Mandi
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {bathroomFacilities.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-2.5 text-xs text-slate-200"
                        >
                          {renderFacilityIcon(f)}
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {buildingFacilities.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Fasilitas Umum & Gedung
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {buildingFacilities.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-2.5 text-xs text-slate-200"
                        >
                          {renderFacilityIcon(f)}
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {realFacilities.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    Fasilitas belum dicantumkan oleh pengelola properti.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsAllFacilitiesOpen(false)}
                className="w-full mt-4 py-2.5 rounded-xl bg-white/[0.08] text-white font-bold text-xs hover:bg-white/[0.12] active:scale-95 transition-all shrink-0"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 12. PILIH TIPE KAMAR BOTTOM SHEET */}
      <AnimatePresence>
        {isRoomPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-lg bg-[#0e1424] border-t border-white/10 rounded-t-3xl p-5 pb-8 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DoorOpen size={16} className="text-amber-400" />
                  Pilih Tipe Kamar
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRoomPickerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {roomDetails.map((rm) => {
                  const isSelected =
                    selectedRoomName === rm.name ||
                    selectedRoomName === `Kamar ${rm.name}`;

                  return (
                    <button
                      key={rm.id || rm.name}
                      type="button"
                      onClick={() => {
                        onSelectRoomName(`Kamar ${rm.name}`);
                        setIsRoomPickerOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-amber-400/20 border-amber-400 text-white font-bold'
                          : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">Kamar {rm.name}</span>
                        {rm.size_sqm && (
                          <span className="text-[10px] text-slate-400">
                            Ukuran: {rm.size_sqm} m²
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400 block">
                          Rp {Number(rm.monthly_rate || monthlyRent).toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-400">/bulan</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
