import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface HeroProps {
  onSeeWorksClick: () => void;
  onReachOutClick: () => void;
}

const roles = ["Kamar Kos", "Apartemen Premium", "Ruang Co-living", "Loft Estetik"];
const videos = ["/video/room1.mp4?v=2", "/video/room2.mp4?v=2"];

export const Hero: React.FC<HeroProps> = ({ onSeeWorksClick, onReachOutClick }) => {
  const [roleIndex, setRoleIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFirstMount = useRef(true);

  const handleVideoEnded = () => {
    setVideoIndex((prev) => (prev + 1) % videos.length);
  };

  // Cycling roles
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % roles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Force autoplay & load on source cycle (workaround for React virtual-DOM muted attribute issues)
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      
      if (isFirstMount.current) {
        isFirstMount.current = false;
        // Don't call video.load() on initial mount, let browser's native autoplay run.
        // Just trigger play() to be safe.
        video.play().catch((err) => {
          console.warn("Hero video native autoplay failed on mount, waiting for interaction:", err);
        });
      } else {
        video.load();
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Hero video autoplay blocked or failed to load on cycle:", err);
          });
        }
      }
    }
  }, [videoIndex]);

  // Listener for user interaction to force play if blocked by autoplay policies
  useEffect(() => {
    const forcePlay = () => {
      const video = videoRef.current;
      if (video && video.paused) {
        video.play().catch((err) => {
          console.warn("Play on interaction failed:", err);
        });
      }
    };

    // Listen to mousemove, click, touchstart, scroll to start playing
    window.addEventListener('click', forcePlay, { once: true });
    window.addEventListener('touchstart', forcePlay, { once: true });
    window.addEventListener('scroll', forcePlay, { once: true });
    window.addEventListener('mousemove', forcePlay, { once: true });

    return () => {
      window.removeEventListener('click', forcePlay);
      window.removeEventListener('touchstart', forcePlay);
      window.removeEventListener('scroll', forcePlay);
      window.removeEventListener('mousemove', forcePlay);
    };
  }, [videoIndex]);

  // GSAP Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to(".name-reveal", {
        opacity: 1,
        y: 0,
        duration: 1.2,
        delay: 0.2
      });

      tl.to(".blur-in", {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 1,
        stagger: 0.1
      }, "-=0.9");
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="home" className="relative z-10 w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Video of Listing Property */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={videos[videoIndex]}
          autoPlay
          muted
          playsInline
          onEnded={handleVideoEnded}
          poster="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-80 scale-105"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/25" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-bg to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center flex flex-col items-center justify-center px-4 max-w-4xl mt-12 select-none">
        
        {/* Eyebrow */}
        <span className="blur-in text-xs text-muted uppercase tracking-[0.3em] mb-8 font-medium">
          Ruang Pilihan '26
        </span>

        {/* Name */}
        <h1 className="name-reveal text-6xl md:text-8xl lg:text-9xl font-display italic leading-[0.9] tracking-tight text-text-primary mb-6">
          Highlanderstay
        </h1>

        {/* Role line */}
        <div className="blur-in text-lg md:text-xl lg:text-2xl text-text-primary/90 font-light mb-4">
          Temukan{' '}
          <span 
            key={roleIndex} 
            className="font-display italic text-text-primary animate-role-fade-in inline-block font-semibold px-1"
          >
            {roles[roleIndex]}
          </span>{' '}
          di Jakarta.
        </div>

        {/* Description */}
        <p className="blur-in text-sm md:text-base text-muted max-w-md mb-12 font-light leading-relaxed">
          Rasakan kehidupan modern dengan kamar butik yang dilengkapi furniture, konektivitas berkecepatan tinggi, dan fasilitas premium yang dirancang untuk kenyamanan Anda.
        </p>

        {/* CTA Buttons */}
        <div className="blur-in inline-flex items-center gap-4">
          {/* Browse Spaces */}
          <button 
            onClick={onSeeWorksClick}
            className="relative group rounded-full text-sm font-medium px-7 py-3.5 bg-text-primary text-bg border border-transparent transition-all duration-300 hover:scale-105 hover:bg-bg hover:text-text-primary"
          >
            {/* Background Hover Border Ring */}
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1.5px] accent-gradient" style={{ margin: '-1.5px' }} />
            Jelajahi Ruangan
          </button>

          {/* Schedule Tour */}
          <button 
            onClick={onReachOutClick}
            className="relative group rounded-full text-sm font-medium px-7 py-3.5 border-2 border-stroke bg-bg text-text-primary transition-all duration-300 hover:scale-105 hover:border-transparent"
          >
            {/* Background Hover Border Ring */}
            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1.5px] accent-gradient" style={{ margin: '-1.5px' }} />
            Jadwalkan Tur
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] text-muted uppercase tracking-[0.25em] font-semibold">GULIR</span>
        <div className="w-[1px] h-10 bg-stroke/60 relative overflow-hidden rounded-full">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-text-primary animate-scroll-down" />
        </div>
      </div>
    </section>
  );
};
