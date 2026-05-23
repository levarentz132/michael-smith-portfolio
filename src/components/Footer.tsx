import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { gsap } from 'gsap';

export const Footer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);

  // HLS Video initialization
  useEffect(() => {
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
  }, []);

  // GSAP Marquee animation
  useEffect(() => {
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
  }, []);

  const socials = [
    { name: "Instagram", url: "https://instagram.com" },
    { name: "LinkedIn", url: "https://linkedin.com" },
    { name: "Twitter", url: "https://twitter.com" },
    { name: "Facebook", url: "https://facebook.com" }
  ];

  return (
    <footer id="contact" className="relative bg-bg pt-20 md:pt-32 pb-8 md:pb-12 overflow-hidden select-none border-t border-stroke/30">
      
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
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 flex flex-col items-center justify-center text-center mb-20 md:mb-32">
        <span className="text-xs text-muted uppercase tracking-[0.3em] font-medium mb-6">Sewa Ruang Anda</span>
        
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-display italic font-light text-text-primary max-w-2xl leading-tight mb-10">
          Siap menemukan <span className="font-semibold not-italic">ruang hunian estetis</span> Anda berikutnya?
        </h2>

        {/* Email button with gradient hover border */}
        <a 
          href="mailto:hello@highlanderstay.com" 
          className="relative group rounded-full text-base sm:text-lg md:text-xl font-display italic font-semibold px-10 py-5 bg-surface border border-stroke text-text-primary hover:text-white transition-all duration-300 hover:scale-105 hover:border-transparent flex items-center gap-2"
        >
          {/* Accent gradient ring */}
          <span 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
            style={{
              padding: '2px',
              background: 'linear-gradient(90deg, #89AACC 0%, #4E85BF 100%)',
              margin: '-2px',
            }}
          />
          hello@highlanderstay.com <span className="inline-block transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 font-sans not-italic text-sm">↗</span>
        </a>
      </div>

      {/* Footer Bottom Bar */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 lg:px-16 border-t border-stroke/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Availability pulse indicator */}
        <div className="flex items-center gap-2 order-2 md:order-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] sm:text-xs text-muted uppercase tracking-[0.15em] font-semibold">Pemesanan Dibuka untuk Juni 2026</span>
        </div>

        {/* Social Links */}
        <div className="flex items-center gap-4 sm:gap-6 order-1 md:order-2">
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
        </div>

        {/* Copyright */}
        <span className="text-[10px] sm:text-xs text-muted/60 order-3">
          © {new Date().getFullYear()} Highlanderstay. Hak cipta dilindungi.
        </span>

      </div>

    </footer>
  );
};
