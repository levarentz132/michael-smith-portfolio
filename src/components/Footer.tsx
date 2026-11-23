import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Hls from 'hls.js';
import { gsap } from 'gsap';
import { fetchSettings, type WebsiteSettings } from '../api';

export interface FooterProps {
  settings?: WebsiteSettings | null;
  compact?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ settings: propSettings, compact = false }) => {
  const [localSettings, setLocalSettings] = useState<WebsiteSettings | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!propSettings) {
      fetchSettings().then(setLocalSettings).catch(() => {});
    }
  }, [propSettings]);

  const activeSettings = propSettings || localSettings;

  // HLS Video initialization
  useEffect(() => {
    if (compact) return;
    const video = videoRef.current;
    if (!video) return;

    const videoSrc = "https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8";
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxMaxBufferLength: 10,
        enableWorker: true,
      });
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.log("Autoplay blocked:", err));
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoSrc;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => console.log("Autoplay blocked:", err));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [compact]);

  // GSAP Marquee animation
  useEffect(() => {
    if (compact) return;
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const ctx = gsap.context(() => {
      gsap.to(marquee, {
        xPercent: -50,
        ease: "none",
        duration: 25,
        repeat: -1
      });
    });

    return () => ctx.revert();
  }, [compact]);

  const waUrl = activeSettings?.whatsapp_number
    ? (activeSettings.whatsapp_number.startsWith('http')
        ? activeSettings.whatsapp_number
        : `https://wa.me/${activeSettings.whatsapp_number.replace(/\D/g, '')}`)
    : 'https://wa.me/628123456789';

  const socials = [
    { name: "Instagram", url: activeSettings?.instagram_url || "https://instagram.com/highlanderstay" },
    { name: "TikTok", url: activeSettings?.tiktok_url || "https://tiktok.com/@highlanderstay" },
    { name: "Facebook", url: activeSettings?.facebook_url || "https://facebook.com/highlanderstay" },
    { name: "YouTube", url: activeSettings?.youtube_url || "https://youtube.com/@highlanderstay" },
    { name: "WhatsApp", url: waUrl }
  ];

  if (compact) {
    return (
      <footer className="relative bg-bg pt-6 pb-28 md:pb-8 border-t border-stroke/30 select-none">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-10 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] sm:text-xs text-muted uppercase tracking-[0.15em] font-semibold">
              Pemesanan Dibuka untuk Juni 2026
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-6">
            <Link
              to="/map"
              className="text-[10px] sm:text-xs text-emerald-400 hover:text-emerald-300 uppercase tracking-[0.15em] font-semibold transition-colors duration-300 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Peta Lokasi / Map
            </Link>
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] sm:text-xs text-muted/80 hover:text-text-primary uppercase tracking-[0.2em] font-semibold transition-colors duration-300 px-1 py-0.5 active:scale-95"
              >
                {social.name}
              </a>
            ))}
            <a
              href="/privacy-policy"
              className="text-[10px] sm:text-xs text-amber-400 hover:text-amber-300 uppercase tracking-[0.15em] font-semibold transition-colors duration-300"
            >
              Kebijakan Privasi & Syarat
            </a>
          </div>

          <span className="text-[10px] sm:text-xs text-muted/60 text-center md:text-right">
            © {new Date().getFullYear()} Highlanderstay. Hak cipta dilindungi.
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer id="contact" className="relative bg-bg pt-20 md:pt-32 pb-28 md:pb-12 overflow-hidden select-none border-t border-stroke/30">
      
      {/* Background Video Flipped Vertically */}
      <div className="absolute inset-0 w-full h-full -z-20 overflow-hidden bg-black">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          className="absolute left-1/2 top-1/2 min-w-full min-h-full object-cover -translate-x-1/2 -translate-y-1/2 opacity-30 scale-y-[-1]"
        />
        {/* Dark overlay (heavier than hero) */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Marquee Section */}
      <div className="w-full overflow-hidden border-t border-b border-stroke/20 py-6 md:py-8 bg-surface/5 backdrop-blur-[1px] relative mb-16 md:mb-24">
        <div className="whitespace-nowrap inline-block">
          <div 
            ref={marqueeRef} 
            className="inline-block text-4xl md:text-6xl lg:text-7xl font-display font-medium tracking-widest uppercase text-text-primary/10"
          >
            {/* Duplicating text to make it loop seamlessly */}
            {Array(10).fill("HIGHLANDERSTAY • CHOOSE COMFORT • ").join("")}
            {Array(10).fill("HIGHLANDERSTAY • CHOOSE COMFORT • ").join("")}
          </div>
        </div>
      </div>

      {/* Center CTA */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-10 lg:px-16 flex flex-col items-center justify-center text-center mb-16 md:mb-32">
        <span className="text-[10px] sm:text-xs text-muted uppercase tracking-[0.3em] font-medium mb-4 sm:mb-6">Sewa Ruang Anda</span>
        
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display italic font-light text-text-primary max-w-2xl leading-tight mb-8 sm:mb-10 px-2">
          Siap menemukan <span className="font-semibold not-italic">ruang hunian estetis</span> Anda berikutnya?
        </h2>

        {/* Email button with gradient hover border */}
        <a 
          href="mailto:hello@highlanderstay.com" 
          className="relative group rounded-full text-xs sm:text-base md:text-xl font-display italic font-semibold px-6 sm:px-10 py-3.5 sm:py-5 bg-surface border border-stroke text-text-primary hover:text-white transition-all duration-300 hover:scale-105 hover:border-transparent flex items-center justify-center gap-2 max-w-[90vw] truncate shadow-lg"
        >
          {/* Accent gradient ring */}
          <span 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1.5px] accent-gradient"
            style={{
              margin: '-1.5px',
            }}
          />
          <span className="truncate">hello@highlanderstay.com</span>
          <span className="inline-block transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 font-sans not-italic text-sm shrink-0">↗</span>
        </a>
      </div>

      {/* Footer Bottom Bar */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-10 lg:px-16 border-t border-stroke/30 pt-8 pb-4 pb-safe flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Availability pulse indicator */}
        <div className="flex items-center gap-2 order-2 md:order-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] sm:text-xs text-muted uppercase tracking-[0.15em] font-semibold">Pemesanan Dibuka untuk Juni 2026</span>
        </div>

        {/* Social & Policy Links */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 order-1 md:order-2">
          <Link
            to="/map"
            className="text-[10px] sm:text-xs text-emerald-400 hover:text-emerald-300 uppercase tracking-[0.15em] font-semibold transition-colors duration-300 flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Peta Lokasi / Map
          </Link>
          {socials.map((social) => (
            <a 
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-xs text-muted/80 hover:text-text-primary uppercase tracking-[0.2em] font-semibold transition-colors duration-300"
            >
              {social.name}
            </a>
          ))}
          <a
            href="/privacy-policy"
            className="text-[10px] sm:text-xs text-amber-400 hover:text-amber-300 uppercase tracking-[0.15em] font-semibold transition-colors duration-300"
          >
            Kebijakan Privasi & Syarat
          </a>
        </div>

        {/* Copyright */}
        <span className="text-[10px] sm:text-xs text-muted/60 order-3">
          © {new Date().getFullYear()} Highlanderstay. Hak cipta dilindungi.
        </span>

      </div>

    </footer>
  );
};
