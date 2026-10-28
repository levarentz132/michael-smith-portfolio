import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { loginWithGoogle, type UserSession } from '../api';

export interface GoogleSignInButtonProps {
  onSuccess: (session: UserSession) => void;
  clientId?: string | null;
  text?: 'signin' | 'signup' | 'continue';
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  clientId,
  text = 'continue',
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsClientId, setNeedsClientId] = useState(false);

  const effectiveClientId = clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const gisButtonRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services if client ID is available
  useEffect(() => {
    if (!effectiveClientId) return;

    let isMounted = true;
    const interval = setInterval(() => {
      if (!isMounted) {
        clearInterval(interval);
        return;
      }

      if (window.google?.accounts?.id) {
        clearInterval(interval);
        try {
          window.google.accounts.id.initialize({
            client_id: effectiveClientId,
            callback: async (response) => {
              if (response.credential) {
                await handleGoogleCredential(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render GIS native button if container exists
          if (gisButtonRef.current) {
            window.google.accounts.id.renderButton(gisButtonRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              text: text === 'signup' ? 'signup_with' : 'continue_with',
              shape: 'pill',
              width: 320,
              locale: 'id'
            });
          }
        } catch (e) {
          console.warn('GIS init error:', e);
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [effectiveClientId, text]);

  // Handle Google Credential Token (JWT ID Token)
  const handleGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle({ credential });
      if (res?.session) {
        onSuccess(res.session);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Google Sign-In Popup (OAuth 2.0 Token Client)
  const handleClick = () => {
    setErrorMsg(null);
    setNeedsClientId(false);

    // If Google Client ID is configured, open Google Account Chooser popup
    if (effectiveClientId) {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: effectiveClientId,
            scope: 'email profile openid',
            callback: async (tokenRes: any) => {
              if (tokenRes?.error) {
                if (tokenRes.error !== 'popup_closed_by_user') {
                  setErrorMsg(tokenRes.error_description || tokenRes.error || 'Akses Google dibatalkan.');
                }
                return;
              }

              if (tokenRes?.access_token) {
                setIsLoading(true);
                try {
                  const res = await loginWithGoogle({ access_token: tokenRes.access_token });
                  if (res?.session) {
                    onSuccess(res.session);
                  }
                } catch (e: any) {
                  setErrorMsg(e.message || 'Gagal verifikasi data akun Google.');
                } finally {
                  setIsLoading(false);
                }
              }
            }
          });

          (client as any).requestAccessToken({ prompt: 'select_account' });
          return;
        } catch (err: any) {
          console.warn('OAuth2 token client error:', err);
        }
      }

      // Fallback to GIS prompt if available
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // Direct OAuth redirect as last resort
              window.location.href = `/api/v1/auth/google/redirect`;
            }
          });
          return;
        } catch (err) {
          console.warn('GIS prompt error:', err);
        }
      }
    }

    // If client ID is missing in environment
    setNeedsClientId(true);
  };

  // Instant 1-Click Demo Google Account (Only used in dev when VITE_GOOGLE_CLIENT_ID is not configured yet)
  const handleInstantDemoLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle({
        user: {
          email: 'penghuni.google@highlanderstay.com',
          name: 'Penghuni Google (Otomatis)',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          google_id: 'g_auto_demo_user'
        }
      });
      if (res?.session) {
        onSuccess(res.session);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk akun demo.');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = text === 'signup' 
    ? 'Daftar dengan Google (Tanpa OTP)' 
    : text === 'signin' 
    ? 'Masuk dengan Google' 
    : 'Lanjutkan dengan Google';

  return (
    <div className="w-full space-y-2.5">
      {/* Official High-Impact Google Button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg hover:shadow-black/20 cursor-pointer disabled:opacity-70 group ${className}`}
      >
        {isLoading ? (
          <RefreshCw size={17} className="animate-spin text-slate-700" />
        ) : (
          /* Official Google "G" Icon */
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span className="truncate">{isLoading ? 'Menghubungkan ke Google...' : buttonText}</span>
      </button>

      {/* Hidden GIS native button container for auto-render */}
      <div ref={gisButtonRef} className="hidden" />

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span className="truncate">{errorMsg}</span>
        </div>
      )}

      {/* Notice if Google Client ID is not configured yet */}
      {needsClientId && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
            <div>
              <p className="font-bold text-amber-200">Google Client ID Belum Dikonfigurasi</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                Untuk mengambil nama, email, dan foto langsung dari Google secara otomatis, cantumkan <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">VITE_GOOGLE_CLIENT_ID</code> di file <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">.env</code>.
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between border-t border-amber-500/20">
            <span className="text-[10px] text-amber-300/70">Uji coba instan tanpa ketik:</span>
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold cursor-pointer transition-all active:scale-95 disabled:opacity-60"
            >
              1-Klik Masuk Akun Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
