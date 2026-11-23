import React from 'react';
import type { WebsiteSettings } from '../api';

export interface SocialLinksProps {
  settings?: WebsiteSettings | null;
  variant?: 'pills' | 'cards' | 'minimal';
  className?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  settings,
  variant = 'cards',
  className = ''
}) => {
  const instagramUrl = settings?.instagram_url || 'https://instagram.com/highlanderstay';
  const tiktokUrl = settings?.tiktok_url || 'https://tiktok.com/@highlanderstay';
  const facebookUrl = settings?.facebook_url || 'https://facebook.com/highlanderstay';
  const youtubeUrl = settings?.youtube_url || 'https://youtube.com/@highlanderstay';
  const whatsappUrl = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`
    : 'https://wa.me/6281234567890';

  const socialItems = [
    {
      name: 'Instagram',
      handle: '@highlanderstay',
      url: instagramUrl,
      color: 'from-fuchsia-600 to-pink-500',
      textColor: 'text-pink-400',
      bgColor: 'hover:border-pink-500/40 bg-pink-500/10',
      icon: (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      )
    },
    {
      name: 'TikTok',
      handle: '@highlanderstay',
      url: tiktokUrl,
      color: 'from-cyan-400 to-rose-500',
      textColor: 'text-cyan-400',
      bgColor: 'hover:border-cyan-500/40 bg-cyan-500/10',
      icon: (
        <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3 15.68a6.34 6.34 0 0 0 10.82 4.48c1.37-1.37 2.14-3.23 2.14-5.17V8.5a8.28 8.28 0 0 0 4.63 1.4v-3.21Z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      handle: 'HighlanderStay Official',
      url: facebookUrl,
      color: 'from-blue-600 to-blue-400',
      textColor: 'text-blue-400',
      bgColor: 'hover:border-blue-500/40 bg-blue-500/10',
      icon: (
        <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'YouTube',
      handle: 'HighlanderStay Room Tour',
      url: youtubeUrl,
      color: 'from-red-600 to-rose-500',
      textColor: 'text-rose-400',
      bgColor: 'hover:border-rose-500/40 bg-rose-500/10',
      icon: (
        <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      name: 'WhatsApp',
      handle: 'Official Support',
      url: whatsappUrl,
      color: 'from-emerald-600 to-green-500',
      textColor: 'text-emerald-400',
      bgColor: 'hover:border-emerald-500/40 bg-emerald-500/10',
      icon: (
        <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      )
    }
  ];

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 flex-wrap ${className}`}>
        {socialItems.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={item.name}
            className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${item.textColor} ${item.bgColor} transition-all active:scale-95`}
          >
            {item.icon}
          </a>
        ))}
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}>
        {socialItems.map((item) => (
          <a
            key={item.name}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shrink-0 ${item.textColor}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </a>
        ))}
      </div>
    );
  }

  // Default: cards grid layout
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 ${className}`}>
      {socialItems.map((item) => (
        <a
          key={item.name}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 ${item.bgColor} transition-all group flex flex-col justify-between active:scale-95 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${item.textColor}`}>
              {item.icon}
            </div>
            <span className="text-[10px] text-slate-500 group-hover:text-slate-300 font-mono">↗</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
              {item.name}
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.handle}</p>
          </div>
        </a>
      ))}
    </div>
  );
};

