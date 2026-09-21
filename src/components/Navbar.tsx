import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserSession, WebsiteSettings } from '../api';
import { Menu, X, LogIn, LogOut, User, ShoppingCart } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onNavClick: (sectionId: string) => void;
  session: UserSession | null;
  onLogout: () => void;
  onLoginClick: () => void;
  onProfileClick?: () => void;
  onCartClick?: () => void;
  cartCount?: number;
  settings?: WebsiteSettings | null;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeSection, 
  onNavClick, 
  session, 
  onLogout, 
  onLoginClick,
  onProfileClick,
  onCartClick,
  cartCount,
  settings
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Beranda', target: 'home' },
    { label: 'Ruangan', target: 'work' },
    { label: 'Fasilitas', target: 'resume' },
    { label: 'Resort', target: 'resort' },
  ];

  const startColor = settings?.logo_gradient_start || '#89AACC';
  const endColor = settings?.logo_gradient_end || '#4E85BF';
  const logoText = settings?.logo_text || 'HS';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 md:pt-6 px-4">
      {/* Dynamic Promo Bar */}
      {settings?.promo_enabled === 'true' && settings?.promo_text && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 w-full max-w-[1200px] rounded-full bg-gradient-to-r from-stroke/20 via-surface/40 to-stroke/20 backdrop-blur-md border border-white/10 px-6 py-2 flex items-center justify-between shadow-md text-xs select-none"
        >
          <div className="flex items-center gap-2 text-text-primary/95 font-medium">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="truncate">{settings.promo_text}</span>
          </div>
          <div 
            className="text-[9px] text-text-primary font-bold uppercase tracking-wider border border-white/10 bg-white/5 px-2.5 py-0.5 rounded-full shrink-0"
          >
            Promo Aktif
          </div>
        </motion.div>
      )}

      {/* Main Pill Container */}
      <div 
        className={`flex items-center justify-between rounded-full backdrop-blur-md border border-white/10 bg-surface px-4 py-2 transition-all duration-300 w-full max-w-[1200px] sm:w-auto ${
          isScrolled ? 'shadow-lg shadow-black/40 border-white/15 bg-surface/95' : 'shadow-none bg-surface/80'
        }`}
      >
        {/* Logo */}
        <div 
          className="relative w-9 h-9 flex items-center justify-center rounded-full cursor-pointer overflow-hidden transition-all duration-300 hover:scale-110 hover:shadow-[0_0_12px_rgba(137,170,204,0.6)] bg-surface border border-white/10"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onClick={() => {
            onNavClick('home');
            setIsMobileMenuOpen(false);
          }}
        >
          {settings?.logo_image ? (
            <img 
              src={settings.logo_image} 
              alt="Logo" 
              className="w-full h-full object-contain p-1.5 select-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/favicon.svg';
              }}
            />
          ) : (
            <>
              <div 
                className="absolute inset-0 transition-transform duration-700 ease-in-out"
                style={{
                  background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`,
                  transform: isLogoHovered ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
              <div className="absolute inset-[2px] bg-bg rounded-full flex items-center justify-center select-none">
                <span className="font-display italic text-[13px] text-text-primary font-bold tracking-tight">{logoText}</span>
              </div>
            </>
          )}
        </div>

        {/* Divider - Desktop Only */}
        <div className="hidden sm:block w-px h-5 bg-stroke mx-3" />

        {/* Desktop Nav Links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = activeSection === link.target;
            return (
              <button
                key={link.target}
                onClick={() => onNavClick(link.target)}
                className={`text-xs sm:text-sm font-medium rounded-full px-4 py-2 transition-colors duration-300 ${
                  isActive 
                    ? 'text-text-primary bg-stroke/50' 
                    : 'text-muted hover:text-text-primary hover:bg-stroke/30'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Dividers and Buttons */}
        <div className="hidden sm:flex items-center">
          <div className="w-px h-5 bg-stroke mx-3" />

          {/* Book Now Button */}
          <a 
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              onNavClick('contact');
            }}
            className="relative group text-xs sm:text-sm font-medium rounded-full px-4 py-2 flex items-center gap-1 select-none overflow-visible mr-2"
          >
            <span 
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
              style={{
                padding: '2px',
                background: `linear-gradient(90deg, ${startColor} 0%, ${endColor} 100%)`,
                margin: '-2px',
              }}
            />
            <div className="absolute inset-0 bg-surface rounded-full -z-10" />
            <span className="text-text-primary relative flex items-center gap-1">
              Pesan Sekarang <span className="inline-block transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">↗</span>
            </span>
          </a>

          <div className="w-px h-5 bg-stroke mr-3" />

          {/* Cart Button (Desktop) */}
          {onCartClick && (
            <button
              onClick={onCartClick}
              className={`relative p-2 rounded-full border transition-all mr-2 cursor-pointer flex items-center justify-center ${
                (cartCount ?? 0) > 0
                  ? 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:bg-amber-500/20'
                  : 'text-text-primary hover:text-amber-400 border-white/10 hover:border-amber-500/40 bg-stroke/30'
              }`}
              title="Keranjang Pemesanan Kamar"
              aria-label="Keranjang Pemesanan"
            >
              <ShoppingCart size={15} />
              {(cartCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 text-[9px] font-bold font-mono bg-amber-500 text-bg rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Session / Login controls for Desktop */}
          {session ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onProfileClick ? onProfileClick() : onLoginClick()}
                className="text-xs sm:text-sm font-medium rounded-full px-4 py-2 bg-stroke/40 hover:bg-stroke/70 text-text-primary transition-colors flex items-center gap-1.5 animate-fade-in"
                title="Profil Akun Penyewa"
              >
                <User size={13} className="text-emerald-400" />
                <span className="truncate max-w-[120px]">{session.name ? session.name.split(' ')[0] : 'Penyewa'}</span>
                {session.phone_verified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="WhatsApp Terverifikasi" />
                )}
              </button>
              <button
                onClick={onLogout}
                className="text-xs sm:text-sm font-medium rounded-full px-4 py-2 hover:bg-rose-500/10 text-rose-400 transition-colors flex items-center gap-1"
                title="Keluar Akun"
              >
                <LogOut size={13} />
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="text-xs sm:text-sm font-medium rounded-full px-4 py-2 bg-text-primary text-bg hover:bg-text-primary/95 transition-colors flex items-center gap-1.5 font-semibold"
            >
              <LogIn size={13} />
              Masuk / Daftar
            </button>
          )}
        </div>

        {/* Mobile controls (Burger menu & Quick actions) */}
        <div className="flex sm:hidden items-center gap-2">
          {onCartClick && (
            <button
              onClick={onCartClick}
              className={`relative p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full border active:scale-95 transition-all ${
                (cartCount ?? 0) > 0
                  ? 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'text-text-primary border-white/10 bg-stroke/30'
              }`}
              title="Keranjang Pemesanan"
              aria-label="Keranjang Pemesanan"
            >
              <ShoppingCart size={17} />
              {(cartCount ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 text-[9px] font-bold font-mono bg-amber-500 text-bg rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {session ? (
            <button
              onClick={() => onProfileClick ? onProfileClick() : onLoginClick()}
              className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full border border-white/10 bg-stroke/30 text-text-primary relative active:scale-95 transition-transform"
              title="Profil Penyewa"
              aria-label="Profil Penyewa"
            >
              <User size={18} className="text-emerald-400" />
              {session.phone_verified && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 border border-bg" />
              )}
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full border border-white/10 bg-text-primary text-bg active:scale-95 transition-transform font-semibold"
              title="Masuk / Daftar"
              aria-label="Masuk atau Daftar"
            >
              <LogIn size={17} />
            </button>
          )}
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full border border-white/10 bg-stroke/30 text-text-primary active:scale-95 transition-transform"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (collapsible dropdown below the pill) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-[calc(100vw-32px)] max-w-sm sm:hidden mt-2 bg-surface/98 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-left z-50"
          >
            <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold px-1 mb-1">Navigasi</span>
              {navLinks.map((link) => (
                <button
                  key={link.target}
                  onClick={() => {
                    onNavClick(link.target);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-sm py-2.5 px-3.5 rounded-xl hover:bg-stroke/30 active:bg-stroke/40 text-muted hover:text-text-primary transition-colors min-h-[44px] flex items-center font-medium"
                >
                  {link.label}
                </button>
              ))}

              {onCartClick && (
                <button
                  onClick={() => {
                    onCartClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left text-sm py-2.5 px-3.5 rounded-xl hover:bg-stroke/30 active:bg-stroke/40 text-text-primary transition-colors flex justify-between items-center min-h-[44px] font-medium"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart size={15} className="text-amber-400" />
                    <span>Keranjang Booking Kos</span>
                  </span>
                  {(cartCount ?? 0) > 0 && (
                    <span className="text-[10px] bg-amber-500 text-bg px-2.5 py-0.5 rounded-full font-bold">
                      {cartCount} Kamar
                    </span>
                  )}
                </button>
              )}
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  onNavClick('contact');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left text-sm py-2.5 px-3.5 rounded-xl hover:bg-stroke/30 active:bg-stroke/40 text-muted hover:text-text-primary transition-colors flex justify-between items-center min-h-[44px] font-medium"
              >
                <span>Pesan Sekarang</span>
                <span className="text-[10px] bg-stroke/50 text-text-primary px-2.5 py-1 rounded-full font-bold">Reservasi</span>
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold px-1">Akun Penyewa</span>
              {session ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-3.5 py-2.5 text-xs text-text-primary font-medium bg-stroke/20 rounded-xl">
                    <div className="flex items-center gap-2 truncate">
                      <User size={14} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{session.name}</span>
                    </div>
                    {session.phone_verified && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold shrink-0">
                        Terverifikasi
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (onProfileClick) onProfileClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left text-sm py-2.5 px-3.5 rounded-xl bg-stroke/40 hover:bg-stroke/70 active:bg-stroke/80 text-text-primary transition-colors flex items-center gap-2.5 min-h-[44px] font-medium"
                  >
                    <User size={15} className="text-emerald-400 shrink-0" />
                    Dashboard & Profil Penyewa
                  </button>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left text-sm py-2.5 px-3.5 rounded-xl hover:bg-rose-500/10 active:bg-rose-500/20 text-rose-400 transition-colors flex items-center gap-2.5 min-h-[44px] font-medium"
                  >
                    <LogOut size={15} className="shrink-0" />
                    Keluar Akun
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center text-sm py-3 px-4 rounded-xl bg-text-primary text-bg hover:bg-text-primary/95 active:scale-[0.99] transition-all font-semibold flex items-center justify-center gap-2 min-h-[44px] shadow-lg"
                >
                  <LogIn size={15} />
                  Masuk / Daftar Akun
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
