import { useEffect, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Badge } from '@capawesome/capacitor-badge';

declare global {
  interface Window {
    $chatwoot?: {
      toggle: (state?: 'open' | 'close') => void;
      isOpen?: () => boolean;
      hasUnreadMessages?: boolean;
      unreadMessageCount?: number;
      setUser?: (identifier: string, user: Record<string, any>) => void;
      setCustomAttributes?: (attributes: Record<string, any>) => void;
      deleteUserSession?: () => void;
    };
    chatwootSettings?: Record<string, any>;
    chatwootSDK?: {
      run: (config: Record<string, any>) => void;
    };
  }
}

export interface LiveChatMessage {
  text: string;
  sender?: string;
  timestamp: number;
}

// Global shared state
let globalUnreadCount = 0;
let globalLastMessage: LiveChatMessage | null = null;
let globalIsChatOpen = false;
let globalIsReady = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

// Setup Android Native Notification Channel & Permissions
let isNativeSetup = false;
export async function initNativeNotificationSystem() {
  if (!Capacitor.isNativePlatform()) return;
  if (isNativeSetup) return;
  isNativeSetup = true;

  try {
    // 1. Create Android Notification Channel with Max Priority (Heads-up banner)
    await LocalNotifications.createChannel({
      id: 'highlanderstay_livechat',
      name: 'Pesan Live Chat Highlanderstay',
      description: 'Notifikasi balasan pesan langsung dari admin Highlanderstay',
      importance: 5, // High importance -> shows heads-up popup banner
      visibility: 1, // Public on lockscreen
      vibration: true,
      lights: true,
      lightColor: '#10B981',
    });

    // 2. Request Android 13+ Notification Permissions immediately
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      console.log('[LiveChat] Notification permission status:', req.display);
    }

    // 3. Handle click on native system notification to open chat
    LocalNotifications.addListener('localNotificationActionPerformed', () => {
      openLiveChat();
    });
  } catch (err) {
    console.warn('[LiveChat] Native notification setup error:', err);
  }
}

// Play pleasant notification sound via Web Audio API
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Note 1 (E6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime);
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Note 2 (G#6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1661.22, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch {
    // Audio context not allowed before user gesture or unsupported
  }
}

// Update document title for web
let originalDocTitle = typeof document !== 'undefined' ? document.title : '';

function updateDocumentTitle() {
  if (typeof document === 'undefined') return;
  if (!originalDocTitle) originalDocTitle = document.title;
  if (globalUnreadCount > 0) {
    document.title = `(${globalUnreadCount}) Pesan Baru • Highlanderstay`;
  } else if (originalDocTitle) {
    document.title = originalDocTitle;
  }
}

// Trigger native push notification on Android & badge icon
export async function triggerNativeNotifications(senderName: string, content: string, count: number) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await initNativeNotificationSystem();

    const notifId = Math.floor(Math.random() * 1000000) + 1;
    
    // 1. Android Status Bar System Notification
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: `💬 ${senderName}`,
          body: content,
          channelId: 'highlanderstay_livechat',
          schedule: { at: new Date(Date.now() + 50) },
          actionTypeId: 'OPEN_CHAT',
          extra: { type: 'chat_reply' },
        },
      ],
    });

    // 2. Set App Icon Badge Number on Android launcher
    const badgeCount = Math.max(1, count);
    try {
      await Badge.set({ count: badgeCount });
    } catch (badgeErr) {
      console.warn('[LiveChat] Badge.set error:', badgeErr);
    }
  } catch (err) {
    console.warn('[LiveChat] Native notification trigger failed:', err);
  }
}

export function handleIncomingMessageData(raw: any) {
  if (!raw) return;

  const msg = raw.data || raw.message || raw;
  const content = typeof msg === 'string' ? msg : (msg.content || msg.text || msg.message || '');
  const senderType = msg.sender?.type || msg.sender_type || '';
  const messageType = msg.message_type;

  // In Chatwoot SDK:
  // message_type === 0 (or 'incoming') -> visitor sent it
  // message_type === 1 (or 'outgoing' / 'template') -> agent/admin sent it
  // sender.type === 'contact' -> visitor
  // sender.type === 'user' / 'agent' / 'bot' / 'agent_bot' -> admin/agent
  const isFromVisitor = senderType === 'contact' || messageType === 0 || messageType === 'incoming';
  if (isFromVisitor) {
    return;
  }

  const senderName = msg.sender?.name || 'Admin Highlanderstay';

  if (content && typeof content === 'string') {
    globalUnreadCount = Math.max(1, globalUnreadCount + 1);
    globalLastMessage = {
      text: content,
      sender: senderName,
      timestamp: Date.now(),
    };

    updateDocumentTitle();

    // 1. Audio chime & vibration ALWAYS
    playNotificationChime();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300]);
      } catch {}
    }

    // 2. Native Android Notification + App Icon Badge ALWAYS
    triggerNativeNotifications(senderName, content, globalUnreadCount);

    // 3. Web Notification fallback
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(senderName, {
            body: content,
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: 'highlanderstay-chat-' + Date.now(),
          });
        } catch {}
      } else if (Notification.permission === 'default') {
        try {
          Notification.requestPermission();
        } catch {}
      }
    }

    notifyListeners();
  }
}

// Global initialization of listeners (runs once on import / boot)
let isInitialized = false;
export function initChatwootListeners() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  initNativeNotificationSystem();

  // 1. Custom Chatwoot Events
  window.addEventListener('chatwoot:ready', () => {
    globalIsReady = true;
    if (window.$chatwoot && typeof window.$chatwoot.unreadMessageCount === 'number') {
      if (window.$chatwoot.unreadMessageCount > 0) {
        globalUnreadCount = window.$chatwoot.unreadMessageCount;
        if (Capacitor.isNativePlatform()) {
          Badge.set({ count: globalUnreadCount }).catch(() => {});
        }
      }
    }
    notifyListeners();
  });

  window.addEventListener('chatwoot:on-unread-message-count-changed', (event: Event) => {
    const customEvent = event as CustomEvent<{ unreadMessageCount?: number }>;
    const count = customEvent.detail?.unreadMessageCount;
    if (typeof count === 'number') {
      const prev = globalUnreadCount;
      globalUnreadCount = count;
      updateDocumentTitle();
      if (Capacitor.isNativePlatform()) {
        if (count > 0) {
          Badge.set({ count }).catch(() => {});
          if (count > prev && !globalLastMessage) {
            triggerNativeNotifications('Admin Highlanderstay', 'Anda memiliki balasan pesan baru di live chat', count);
          }
        } else {
          Badge.clear().catch(() => {});
        }
      }
      notifyListeners();
    }
  });

  window.addEventListener('chatwoot:on-message', (event: Event) => {
    const customEvent = event as CustomEvent<any>;
    handleIncomingMessageData(customEvent.detail);
  });

  window.addEventListener('chatwoot:opened', () => {
    globalIsChatOpen = true;
    globalUnreadCount = 0;
    globalLastMessage = null;
    updateDocumentTitle();
    if (Capacitor.isNativePlatform()) {
      Badge.clear().catch(() => {});
      LocalNotifications.removeAllDeliveredNotifications().catch(() => {});
    }
    notifyListeners();
  });

  window.addEventListener('chatwoot:closed', () => {
    globalIsChatOpen = false;
    notifyListeners();
  });

  // 2. PostMessage Listener for direct iframe communication
  window.addEventListener('message', (event) => {
    try {
      let data = event.data;
      if (typeof data === 'string') {
        if (data.startsWith('chatwoot-widget:')) {
          data = JSON.parse(data.replace('chatwoot-widget:', ''));
        } else if (data.startsWith('{')) {
          data = JSON.parse(data);
        }
      }

      if (data && typeof data === 'object') {
        const eventName = data.event || data.type;
        console.log('[Chatwoot Widget Event]', eventName, data);

        if (eventName === 'on-message' || eventName === 'chatwoot:on-message' || eventName === 'message:created') {
          handleIncomingMessageData(data.data || data.message || data);
        } else if (eventName === 'onEvent') {
          if (data.eventIdentifier === 'chatwoot:on-message' || data.eventIdentifier === 'on-message') {
            handleIncomingMessageData(data.data);
          } else if (data.eventIdentifier === 'chatwoot:on-unread-message-count-changed') {
            const count = data.data?.unreadMessageCount;
            if (typeof count === 'number') {
              updateUnreadCount(count);
            }
          }
        } else if (eventName === 'handleNotificationDot') {
          const count = data.unreadMessageCount ?? (data.data?.unreadMessageCount || 1);
          if (typeof count === 'number') {
            updateUnreadCount(count);
          }
        } else if (eventName === 'playAudio' || eventName === 'setUnreadMode') {
          // Chatwoot widget triggered audio alert or unread mode for an incoming message
          const nextCount = Math.max(1, globalUnreadCount + 1);
          updateUnreadCount(nextCount);
          if (!globalLastMessage) {
            triggerNativeNotifications('Admin Highlanderstay', 'Anda memiliki balasan pesan baru di live chat', nextCount);
          }
        } else if (eventName === 'on-unread-message-count-changed') {
          const count = data.data?.unreadMessageCount ?? data.unreadMessageCount;
          if (typeof count === 'number') {
            updateUnreadCount(count);
          }
        } else if (eventName === 'chatwoot:opened' || eventName === 'opened') {
          globalIsChatOpen = true;
          globalUnreadCount = 0;
          globalLastMessage = null;
          updateDocumentTitle();
          if (Capacitor.isNativePlatform()) {
            Badge.clear().catch(() => {});
            LocalNotifications.removeAllDeliveredNotifications().catch(() => {});
          }
          notifyListeners();
        } else if (eventName === 'chatwoot:closed' || eventName === 'closed' || eventName === 'closeWindow') {
          globalIsChatOpen = false;
          notifyListeners();
        }
      }
    } catch (e) {
      // Non-JSON postMessage from other scripts
    }
  });

  // Helper to sync count
  function updateUnreadCount(count: number) {
    const prev = globalUnreadCount;
    globalUnreadCount = count;
    updateDocumentTitle();
    if (Capacitor.isNativePlatform()) {
      if (count > 0) {
        Badge.set({ count }).catch(() => {});
        if (count > prev && !globalLastMessage) {
          triggerNativeNotifications('Admin Highlanderstay', 'Anda memiliki balasan pesan baru di live chat', count);
        }
      } else {
        Badge.clear().catch(() => {});
      }
    }
    notifyListeners();
  }

  // 3. Periodic lightweight check for unread message count
  setInterval(() => {
    if (window.$chatwoot && typeof window.$chatwoot.unreadMessageCount === 'number') {
      const count = window.$chatwoot.unreadMessageCount;
      if (count !== globalUnreadCount) {
        updateUnreadCount(count);
      }
    }
  }, 2500);
}

// Dev test function exposed on window
if (typeof window !== 'undefined') {
  (window as any).testNotification = async (sender = 'Admin Highlanderstay', msg = 'Halo! Ada yang bisa kami bantu hari ini?') => {
    await triggerNativeNotifications(sender, msg, 1);
  };
}

// Auto-run initialization immediately on script load
if (typeof window !== 'undefined') {
  initChatwootListeners();
}

export function openLiveChat() {
  if (typeof window !== 'undefined' && window.$chatwoot) {
    globalIsChatOpen = true;
    globalUnreadCount = 0;
    globalLastMessage = null;
    updateDocumentTitle();
    if (Capacitor.isNativePlatform()) {
      Badge.clear().catch(() => {});
      LocalNotifications.removeAllDeliveredNotifications().catch(() => {});
    }
    notifyListeners();
    window.$chatwoot.toggle('open');
  }
}

export function closeLiveChat() {
  if (typeof window !== 'undefined' && window.$chatwoot) {
    globalIsChatOpen = false;
    notifyListeners();
    window.$chatwoot.toggle('close');
  }
}

export function toggleLiveChat() {
  if (typeof window !== 'undefined' && window.$chatwoot) {
    if (globalIsChatOpen) {
      closeLiveChat();
    } else {
      openLiveChat();
    }
  }
}

export function useLiveChat() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initChatwootListeners();

    const update = () => setTick((t) => t + 1);
    listeners.add(update);

    return () => {
      listeners.delete(update);
    };
  }, []);

  const handleOpen = useCallback(() => {
    openLiveChat();
  }, []);

  const handleClose = useCallback(() => {
    closeLiveChat();
  }, []);

  const handleToggle = useCallback(() => {
    toggleLiveChat();
  }, []);

  return {
    unreadCount: globalUnreadCount,
    isReady: globalIsReady,
    isOpen: globalIsChatOpen,
    lastMessage: globalLastMessage,
    openChat: handleOpen,
    toggleChat: handleToggle,
    closeChat: handleClose,
  };
}
