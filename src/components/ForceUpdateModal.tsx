import React, { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Download, RefreshCw, ShieldAlert } from 'lucide-react';
import { PLAYSTORE_URL } from './PlayStoreBadge';

interface AppVersionResponse {
  min_version_code: number;
  latest_version_name?: string;
  force_update?: boolean;
  message?: string;
  play_store_url?: string;
}

interface ForceUpdateModalProps {
  onForceUpdateChange?: (required: boolean) => void;
}

const APP_VERSION_ENDPOINT = 'https://highlanderstay.com/api/app-version';

export const ForceUpdateModal: React.FC<ForceUpdateModalProps> = ({ onForceUpdateChange }) => {
  const [updateRequired, setUpdateRequired] = useState(false);
  const [checking, setChecking] = useState(false);
  const [installedVersion, setInstalledVersion] = useState<string>('');
  const [installedBuild, setInstalledBuild] = useState<number | null>(null);
  const [serverInfo, setServerInfo] = useState<AppVersionResponse | null>(null);

  const checkForUpdate = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;

    setChecking(true);
    try {
      const appInfo = await CapApp.getInfo();
      const currentBuild = Number(appInfo.build);
      setInstalledVersion(appInfo.version || '');
      setInstalledBuild(Number.isFinite(currentBuild) ? currentBuild : null);

      const res = await fetch(`${APP_VERSION_ENDPOINT}?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) return;
      const data: AppVersionResponse = await res.json();
      setServerInfo(data);

      const minCode = Number(data.min_version_code || 0);
      const mustUpdate =
        Boolean(data.force_update !== false) &&
        Number.isFinite(currentBuild) &&
        minCode > 0 &&
        currentBuild < minCode;

      setUpdateRequired(mustUpdate);
      onForceUpdateChange?.(mustUpdate);
    } catch (err) {
      // Fail open on transient network errors so offline users aren't falsely locked out
      console.warn('[ForceUpdate] Version check failed:', err);
    } finally {
      setChecking(false);
    }
  }, [onForceUpdateChange]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    checkForUpdate();

    let stateListener: { remove: () => Promise<void> } | null = null;
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        checkForUpdate();
      }
    })
      .then((handle) => {
        stateListener = handle;
      })
      .catch(() => {});

    return () => {
      if (stateListener) {
        stateListener.remove().catch(() => {});
      }
    };
  }, [checkForUpdate]);

  if (!updateRequired) {
    return null;
  }

  const storeUrl = serverInfo?.play_store_url || PLAYSTORE_URL;

  const handleOpenPlayStore = () => {
    window.open(storeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-update-title"
      className="fixed inset-0 z-[9999] bg-[#07090e] flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="w-full max-w-sm rounded-3xl bg-[#0e1424] border border-amber-500/30 p-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} className="text-amber-400" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-3">
          Pembaruan Wajib
        </span>

        <h2 id="force-update-title" className="text-lg font-black text-white tracking-tight">
          Update Aplikasi Diperlukan
        </h2>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {serverInfo?.message ||
            'Versi terbaru HighlanderStay telah tersedia. Silakan perbarui aplikasi melalui Google Play Store untuk melanjutkan.'}
        </p>

        <div className="mt-4 p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-[11px]">
          <div className="text-left">
            <span className="text-slate-400 block text-[10px]">Versi Terpasang</span>
            <strong className="text-white font-mono">
              v{installedVersion || '-'}{installedBuild ? ` (${installedBuild})` : ''}
            </strong>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Versi Terbaru</span>
            <strong className="text-emerald-400 font-mono">
              v{serverInfo?.latest_version_name || '-'}{serverInfo?.min_version_code ? ` (${serverInfo.min_version_code})` : ''}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenPlayStore}
          className="mt-5 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
        >
          <Download size={16} className="stroke-[2.5]" />
          <span>Update di Google Play</span>
        </button>

        <button
          type="button"
          onClick={checkForUpdate}
          disabled={checking}
          className="mt-3 w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-60"
        >
          <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
          <span>{checking ? 'Memeriksa...' : 'Periksa Ulang Versi'}</span>
        </button>
      </div>
    </div>
  );
};
