import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface CapacitorState {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
}

export function useCapacitor(onBackPress?: () => boolean): CapacitorState {
  const [state] = useState<CapacitorState>({
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform() as 'android' | 'ios' | 'web',
  });

  useEffect(() => {
    if (!state.isNative) return;

    // Configure status bar for dark luxury theme
    const configureStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        if (state.platform === 'android') {
          await StatusBar.setBackgroundColor({ color: '#0c0d0e' });
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch (err) {
        console.warn('[Capacitor StatusBar] Failed to configure:', err);
      }
    };

    configureStatusBar();

    // Android Hardware Back Button listener
    let listenerHandle: any = null;
    const registerBackButton = async () => {
      try {
        listenerHandle = await CapApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
          // If onBackPress callback returns true (handled), don't exit app
          if (onBackPress && onBackPress()) {
            return;
          }
          if (canGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        });
      } catch (err) {
        console.warn('[Capacitor BackButton] Failed to register:', err);
      }
    };

    registerBackButton();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [state.isNative, state.platform, onBackPress]);

  return state;
}
