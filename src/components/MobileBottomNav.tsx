import React from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Heart, Building2, MessageCircle, LogIn, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { UserSession } from '../api';
import { useLiveChat } from '../utils/liveChat';
import { useFavorites } from '../utils/favorites';

export interface MobileBottomNavProps {
  userSession: UserSession | null;
  isProfileOpen?: boolean;
  isLoginOpen?: boolean;
  isFavoritesOpen?: boolean;
  onProfileClick: () => void;
  onLoginClick: () => void;
  onCatalogClick?: () => void;
  onFavoritesClick?: () => void;
}

export type MobileNavTab = 'search' | 'map' | 'favorite' | 'mykos' | 'chat' | 'profile';

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  userSession,
  isProfileOpen = false,
  isLoginOpen = false,
  isFavoritesOpen = false,
  onProfileClick,
  onLoginClick,
  onFavoritesClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, openChat } = useLiveChat();
  const { favoritesCount } = useFavorites();

  // Determine active tab dynamically based on route and open modals
  const activeTab: MobileNavTab = React.useMemo(() => {
    if (location.pathname === '/map') {
      return 'map';
    }
    if (
      (location.pathname === '/akun' && location.search.includes('tab=leases')) ||
      location.pathname === '/billing'
    ) {
      return 'mykos';
    }
    if (
      isProfileOpen ||
      isLoginOpen ||
      location.pathname === '/login' ||
      location.pathname === '/register' ||
      location.pathname === '/akun' ||
      location.pathname === '/profil' ||
      location.pathname === '/portal'
    ) {
      return 'profile';
    }
    if (isFavoritesOpen) {
      return 'favorite';
    }
    if (location.pathname === '/' || location.pathname === '/katalog') {
      return 'search';
    }
    return 'search';
  }, [location.pathname, location.search, isProfileOpen, isLoginOpen, isFavoritesOpen]);

  const handleSearchClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMapClick = () => {
    navigate('/map');
  };

  const handleFavoritesClick = () => {
    if (onFavoritesClick) {
      onFavoritesClick();
    }
  };

  const handleMyKosClick = () => {
    navigate('/akun?tab=leases');
  };

  const handleChatClick = () => {
    openChat();
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
      return;
    }
    if (!userSession && onLoginClick) {
      onLoginClick();
      return;
    }
    navigate('/akun');
  };

  const navItems = [
    {
      id: 'search' as MobileNavTab,
      label: 'Cari',
      icon: Search,
      onClick: handleSearchClick,
    },
    {
      id: 'map' as MobileNavTab,
      label: 'Peta',
      icon: MapPin,
      onClick: handleMapClick,
    },
    {
      id: 'favorite' as MobileNavTab,
      label: 'Favorit',
      icon: Heart,
      onClick: handleFavoritesClick,
      badge: favoritesCount > 0 ? favoritesCount : null,
    },
    {
      id: 'mykos' as MobileNavTab,
      label: 'Kos Saya',
      icon: Building2,
      onClick: handleMyKosClick,
    },
    {
      id: 'chat' as MobileNavTab,
      label: 'Chat',
      icon: MessageCircle,
      onClick: handleChatClick,
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : null,
      isLiveChat: true,
    },
    {
      id: 'profile' as MobileNavTab,
      label: userSession ? 'Akun' : 'Masuk',
      icon: userSession ? User : LogIn,
      onClick: handleProfileClick,
      isUserAvatar: Boolean(userSession),
    },
  ];

  // Hide bottom tab bar on property detail pages so the dedicated Mamikos booking bar is visible
  if (location.pathname.startsWith('/property')) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 select-none pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] pointer-events-none"
    >
      {/* Solid dark container for maximum contrast over maps */}
      <div className="relative mx-3 mb-1.5 rounded-2xl bg-[#090d16] border border-slate-700/80 shadow-[0_-8px_32px_rgba(0,0,0,0.95)] p-1.5 flex items-center justify-between gap-1 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 group focus:outline-none"
            >
              {/* Sliding Interactive Active Box Selection with Ambient Glow */}
              {isActive && (
                <motion.div
                  layoutId="mobileNavActiveBox"
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-500/20 via-white/[0.08] to-transparent border border-amber-400/50 shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                  transition={{
                    type: 'spring',
                    stiffness: 480,
                    damping: 34,
                  }}
                >
                  {/* Subtle top indicator dot on active box */}
                  <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                </motion.div>
              )}

              {/* Icon Container with active bounce and badge */}
              <div className="relative z-10 flex items-center justify-center">
                {item.isUserAvatar && userSession ? (
                  <div className="relative">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200 ${
                        isActive
                          ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/40'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      }`}
                    >
                      {userSession.name ? userSession.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#0c0d0e]" />
                  </div>
                ) : (
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.14, 1] : 1,
                    }}
                    transition={{ duration: 0.24, ease: 'easeOut' }}
                  >
                    <Icon
                      size={19}
                      className={`transition-colors duration-200 ${
                        isActive
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'text-slate-300 group-hover:text-white'
                      }`}
                    />
                  </motion.div>
                )}

                {/* Badge (e.g. for unread chat messages or notifications) */}
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-3 min-w-4 h-4 px-1 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 text-bg text-[9px] font-black flex items-center justify-center shadow-md shadow-emerald-500/40 ring-1 ring-[#0c0d0e] animate-pulse"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </div>

              {/* Label */}
              <span
                className={`relative z-10 text-[10px] tracking-tight mt-1 transition-all duration-200 ${
                  isActive
                    ? 'text-amber-300 font-extrabold drop-shadow-[0_1px_3px_rgba(245,158,11,0.3)]'
                    : 'text-slate-300 font-semibold group-hover:text-white'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

