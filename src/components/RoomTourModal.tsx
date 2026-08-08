import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, DoorOpen, Maximize2 } from 'lucide-react';
import Marzipano from 'marzipano';

interface RoomTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyName: string;
}

interface DemoScene {
  id: string;
  title: string;
  subtitle: string;
  yaw: number;
  pitch: number;
  image: string;
}

function createDummyPanorama(title: string, accent: string, secondary: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 4096;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const wall = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  wall.addColorStop(0, '#141820');
  wall.addColorStop(0.35, accent);
  wall.addColorStop(0.7, '#242936');
  wall.addColorStop(1, secondary);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0c0f14';
  ctx.fillRect(0, 1450, canvas.width, 598);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let x = 0; x < canvas.width; x += 256) {
    ctx.fillRect(x, 1450, 2, 598);
  }
  for (let y = 1480; y < canvas.height; y += 120) {
    ctx.fillRect(0, y, canvas.width, 2);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(280, 620, 520, 520);
  ctx.fillRect(3210, 590, 470, 500);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(340, 680, 400, 400);
  ctx.fillRect(3260, 650, 370, 380);

  ctx.fillStyle = '#202532';
  ctx.fillRect(1380, 1100, 960, 310);
  ctx.fillStyle = '#343b4c';
  ctx.fillRect(1470, 955, 780, 180);
  ctx.fillStyle = '#6f7d91';
  ctx.fillRect(1520, 990, 250, 115);
  ctx.fillRect(1960, 990, 250, 115);

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.arc(2048, 360, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(2048, 360, 72, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '700 96px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, 2048, 760);
  ctx.font = '400 44px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.fillText('Dummy 360 panorama - replace with real room photos later', 2048, 840);

  return canvas.toDataURL('image/jpeg', 0.9);
}

export const RoomTourModal: React.FC<RoomTourModalProps> = ({ isOpen, onClose, propertyName }) => {
  const panoRef = useRef<HTMLDivElement | null>(null);
  const hotspotRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const scenesRef = useRef<Array<DemoScene & { scene?: any }>>([]);
  const [activeSceneId, setActiveSceneId] = useState('bedroom');
  const [loadError, setLoadError] = useState('');

  const demoScenes = useMemo<DemoScene[]>(() => {
    if (!isOpen) return [];
    return [
      {
        id: 'bedroom',
        title: 'Office Room Demo',
        subtitle: 'Panorama asli dari foto WhatsApp',
        yaw: 0,
        pitch: 0,
        image: '/tours/office-room-demo.jpeg'
      },
      {
        id: 'bathroom',
        title: 'Bathroom Area',
        subtitle: 'Kamar mandi pribadi dan area wastafel',
        yaw: Math.PI / 4,
        pitch: 0,
        image: createDummyPanorama('Bathroom Area', '#27584f', '#323a58')
      }
    ];
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !panoRef.current || demoScenes.length === 0) return;

    let cancelled = false;
    setLoadError('');

    try {
      if (cancelled || !panoRef.current) return;

      panoRef.current.innerHTML = '';
      viewerRef.current = new Marzipano.Viewer(panoRef.current, {
        controls: { mouseViewMode: 'drag' }
      });

      const limiter = Marzipano.RectilinearView.limit.traditional(4096, Math.PI * 0.9);
      scenesRef.current = demoScenes.map((sceneData) => {
        const source = Marzipano.ImageUrlSource.fromString(sceneData.image);
        const geometry = new Marzipano.EquirectGeometry([{ width: 4096 }]);
        const view = new Marzipano.RectilinearView(
          { yaw: sceneData.yaw, pitch: sceneData.pitch, fov: Math.PI / 2.2 },
          limiter
        );
        const scene = viewerRef.current.createScene({
          source,
          geometry,
          view,
          pinFirstLevel: true
        });

        return { ...sceneData, scene };
      });

      scenesRef.current[0]?.scene.switchTo({ transitionDuration: 600 });
      setActiveSceneId(scenesRef.current[0]?.id || 'bedroom');
    } catch {
      if (!cancelled) setLoadError('Tidak bisa memuat Marzipano viewer.');
    }

    return () => {
      cancelled = true;
      if (panoRef.current) panoRef.current.innerHTML = '';
      viewerRef.current = null;
      scenesRef.current = [];
    };
  }, [isOpen, demoScenes]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const switchScene = (sceneId: string) => {
    const target = scenesRef.current.find((item) => item.id === sceneId);
    if (!target?.scene) return;
    target.scene.switchTo({ transitionDuration: 650 });
    setActiveSceneId(sceneId);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 text-text-primary flex flex-col">
      <div className="h-16 border-b border-white/10 bg-black/55 backdrop-blur-md px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">360 Room Tour</p>
            <h3 className="text-sm font-semibold truncate">{propertyName}</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors"
          aria-label="Close 360 tour"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <div ref={panoRef} className="absolute inset-0 bg-black" />
        <div ref={hotspotRef} className="hidden" />

        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="bg-surface border border-stroke rounded-2xl p-6 max-w-sm">
              <p className="text-sm text-rose-300">{loadError}</p>
            </div>
          </div>
        )}

        <div className="absolute left-4 right-4 bottom-4 md:left-6 md:right-auto md:w-[360px] bg-surface/85 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <DoorOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-widest text-muted font-bold">Dummy Scenes</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoScenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => switchScene(scene.id)}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  activeSceneId === scene.id
                    ? 'border-emerald-400/50 bg-emerald-500/10 text-text-primary'
                    : 'border-stroke bg-bg/60 text-muted hover:text-text-primary hover:bg-bg'
                }`}
              >
                <span className="block text-xs font-bold">{scene.title}</span>
                <span className="block text-[10px] mt-1 leading-snug">{scene.subtitle}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted mt-3 leading-relaxed">
            Drag untuk melihat sekeliling. Scroll/pinch untuk zoom. Data ini masih dummy dan siap diganti dengan foto 360 asli.
          </p>
        </div>
      </div>
    </div>
  );
};
