import React from 'react';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, LogIn, Building2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { UserSession } from '../api';

export interface MobileBottomNavProps {
  cartCount: number;
  userSession: UserSession | null;
  onCartClick: () => void;
  onProfileClick: () => void;
  onLoginClick: () => void;
  onCatalogClick?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  userSession,
  onCartClick,
  onProfileClick,
  onLoginClick,
  onCatalogClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/' && !location.hash;
  const isCatalog = location.hash === '#portfolio' || location.pathname.startsWith('/kost/') || location.pathname.startsWith('/apartemen/');

  const handleHomeClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCatalog = () => {
    if (onCatalogClick) {
      onCatalogClick();
      return;
    }
    if (location.pathname !== '/') {
      navigate('/#portfolio');
    } else {
      const el = document.getElementById('portfolio');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 select-none pb-[env(safe-area-inset-bottom,0px)]"
    >
      {/* Blur glass container */}
      <div className="relative mx-3 mb-2 rounded-2xl bg-[#0c0d0e]/90 backdrop-blur-xl border border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.6)] px-2 py-1.5 flex items-center justify-around">
        {/* Tab 1: Beranda */}
        <button
          type="button"
          onClick={handleHomeClick}
          className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
        >
          {isHome && (
            <motion.div
              layoutId="mobileNavPill"
              className="absolute inset-0 bg-white/[0.08] rounded-xl border border-white/10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <Home
            size={19}
            className={`transition-colors duration-200 ${
              isHome ? 'text-amber-400' : 'text-neutral-400'
            }`}
          />
          <span
            className={`text-[10px] font-medium mt-1 tracking-tight transition-colors duration-200 ${
              isHome ? 'text-white font-semibold' : 'text-neutral-400'
            }`}
          >
            Beranda
          </span>
        </button>

        {/* Tab 2: Katalog Kamar */}
        <button
          type="button"
          onClick={handleCatalog}
          className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
        >
          {isCatalog && (
            <motion.div
              layoutId="mobileNavPill"
              className="absolute inset-0 bg-white/[0.08] rounded-xl border border-white/10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <Building2
            size={19}
            className={`transition-colors duration-200 ${
              isCatalog ? 'text-amber-400' : 'text-neutral-400'
            }`}
          />
          <span
            className={`text-[10px] font-medium mt-1 tracking-tight transition-colors duration-200 ${
              isCatalog ? 'text-white font-semibold' : 'text-neutral-400'
            }`}
          >
            Katalog
          </span>
        </button>

        {/* Tab 3: Keranjang Booking */}
        <button
          type="button"
          onClick={onCartClick}
          className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <div className="relative">
            <ShoppingCart
              size={19}
              className="text-neutral-400 hover:text-white transition-colors duration-200"
            />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center shadow-xs"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </motion.span>
            )}
          </div>
          <span className="text-[10px] font-medium text-neutral-400 mt-1 tracking-tight">
            Keranjang
          </span>
        </button>

        {/* Tab 4: Akun / Tenant Portal */}
        <button
          type="button"
          onClick={userSession ? onProfileClick : onLoginClick}
          className="relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
        >
          {userSession ? (
            <div className="relative">
              <div className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-[10px] font-bold text-amber-300">
                {userSession.name ? userSession.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-black" />
            </div>
          ) : (
            <LogIn size={19} className="text-neutral-400" />
          )}
          <span className="text-[10px] font-medium text-neutral-400 mt-1 tracking-tight">
            {userSession ? 'Portal' : 'Masuk'}
          </span>
        </button>
      </div>
    </nav>
  );
};
