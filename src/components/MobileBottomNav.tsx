import React from 'react';
import { motion } from 'framer-motion';
import { Home, MessageCircle, LogIn, Building2, MapPin } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { UserSession } from '../api';
import { useLiveChat } from '../utils/liveChat';

export interface MobileBottomNavProps {
  userSession: UserSession | null;
  isProfileOpen?: boolean;
  isLoginOpen?: boolean;
  onProfileClick: () => void;
  onLoginClick: () => void;
  onCatalogClick?: () => void;
}

export type MobileNavTab = 'home' | 'catalog' | 'map' | 'chat' | 'profile';

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  userSession,
  isProfileOpen = false,
  isLoginOpen = false,
  onProfileClick,
  onLoginClick,
  onCatalogClick,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount, openChat } = useLiveChat();

  // Determine active tab dynamically based on route and open modals
  const activeTab: MobileNavTab = React.useMemo(() => {
    if (
      isProfileOpen ||
      isLoginOpen ||
      location.pathname === '/portal' ||
      location.pathname === '/login' ||
      location.pathname === '/register' ||
      location.pathname === '/akun' ||
      location.pathname === '/profil'
    ) {
      return 'profile';
    }
    if (
      location.pathname === '/map' ||
      location.pathname === '/lokasi' ||
      location.pathname === '/peta'
    ) {
      return 'map';
    }
    if (
      location.pathname === '/katalog' ||
      location.pathname === '/kamar' ||
      location.pathname.startsWith('/kost/') ||
      location.pathname.startsWith('/apartemen/') ||
      location.pathname.startsWith('/property/')
    ) {
      return 'catalog';
    }
    if (location.pathname === '/' && !location.hash) {
      return 'home';
    }
    return 'home';
  }, [location.pathname, location.hash, isProfileOpen, isLoginOpen]);

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
    navigate('/katalog');
  };

  const handleMapClick = () => {
    if (location.pathname !== '/map') {
      navigate('/map');
    } else {
      // Already on map -> trigger a refresh / center
      window.dispatchEvent(new CustomEvent('hs-map-center'));
    }
  };

  const handleChatClick = () => {
    openChat();
  };

  const handleProfileClick = () => {
    if (userSession && onProfileClick) {
      onProfileClick();
      return;
    }
    if (!userSession && onLoginClick) {
      onLoginClick();
      return;
    }
    navigate('/portal');
  };

  const navItems = [
    {
      id: 'home' as MobileNavTab,
      label: 'Beranda',
      icon: Home,
      onClick: handleHomeClick,
    },
    {
      id: 'catalog' as MobileNavTab,
      label: 'Katalog',
      icon: Building2,
      onClick: handleCatalog,
    },
    {
      id: 'map' as MobileNavTab,
      label: 'Peta',
      icon: MapPin,
      onClick: handleMapClick,
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
      label: userSession ? 'Portal' : 'Masuk',
      icon: LogIn,
      onClick: handleProfileClick,
      isUserAvatar: Boolean(userSession),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 select-none pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)] pointer-events-none"
    >
      {/* Blur glass container */}
      <div className="relative mx-3 mb-1.5 rounded-2xl bg-[#0c0d0e]/92 backdrop-blur-2xl border border-white/15 shadow-[0_-8px_32px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.06)] p-1.5 flex items-center justify-between gap-1 pointer-events-auto">
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
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-amber-500/18 via-white/[0.08] to-white/[0.03] border border-amber-400/40 shadow-[0_0_16px_rgba(245,158,11,0.22),inset_0_1px_0_rgba(255,255,255,0.25)]"
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
                          : 'text-neutral-400 group-hover:text-neutral-200'
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
                    ? 'text-amber-300 font-bold drop-shadow-[0_1px_3px_rgba(245,158,11,0.3)]'
                    : 'text-neutral-400 font-medium group-hover:text-neutral-300'
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

