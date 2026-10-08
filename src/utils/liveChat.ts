import { useEffect, useState, useCallback } from 'react';

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

// Play pleasant notification sound via Web Audio API (Zero external assets needed)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Note 1 (E6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
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
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);
  } catch {
    // Audio context not allowed before user gesture or unsupported
  }
}

// Process an incoming chat message
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

function handleIncomingMessageData(raw: any) {
  if (!raw) return;

  const msg = raw.data || raw.message || raw;
  const content = typeof msg === 'string' ? msg : (msg.content || msg.text || msg.message || '');
  const senderType = msg.sender?.type || msg.sender_type || '';
  const messageType = msg.message_type;

  // In Chatwoot SDK:
  // message_type === 0 (or 'incoming') -> visitor sent it
  // message_type === 1 (or 'outgoing' / 'template') -> agent/admin sent it
  // sender.type === 'contact' -> visitor
  // sender.type === 'user' / 'agent' / 'bot' -> admin/agent
  const isFromVisitor = senderType === 'contact' || messageType === 0 || messageType === 'incoming';
  if (isFromVisitor) {
    return;
  }

  const senderName = msg.sender?.name || (senderType === 'user' || senderType === 'agent' ? 'Admin Highlanderstay' : 'Admin Highlanderstay');

  if (content && typeof content === 'string') {
    globalUnreadCount += 1;
    globalLastMessage = {
      text: content,
      sender: senderName,
      timestamp: Date.now(),
    };

    updateDocumentTitle();

    if (!globalIsChatOpen) {
      // 1. Audio chime
      playNotificationChime();

      // 2. Mobile vibration (works directly on Android / Capacitor)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([300, 150, 300]);
        } catch {}
      }

      // 3. Request permission on interaction or show native notification if granted
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            new Notification(senderName, {
              body: content,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: 'highlanderstay-chat-' + Date.now(),
            });
          } catch {}
        } else if (Notification.permission === 'default') {
          try {
            Notification.requestPermission();
          } catch {}
        }
      }
    }

    notifyListeners();
  }
}

// Global initialization of listeners (runs once)
let isInitialized = false;
function initChatwootListeners() {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Custom Chatwoot Events
  window.addEventListener('chatwoot:ready', () => {
    globalIsReady = true;
    if (window.$chatwoot && typeof window.$chatwoot.unreadMessageCount === 'number') {
      if (window.$chatwoot.unreadMessageCount > 0) {
        globalUnreadCount = window.$chatwoot.unreadMessageCount;
      }
    }
    notifyListeners();
  });

  window.addEventListener('chatwoot:on-unread-message-count-changed', (event: Event) => {
    const customEvent = event as CustomEvent<{ unreadMessageCount?: number }>;
    const count = customEvent.detail?.unreadMessageCount;
    if (typeof count === 'number') {
      globalUnreadCount = count;
      updateDocumentTitle();
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
        if (eventName === 'on-message' || eventName === 'chatwoot:on-message') {
          handleIncomingMessageData(data.data || data.message || data);
        } else if (eventName === 'on-unread-message-count-changed') {
          const count = data.data?.unreadMessageCount ?? data.unreadMessageCount;
          if (typeof count === 'number') {
            globalUnreadCount = count;
            updateDocumentTitle();
            notifyListeners();
          }
        } else if (eventName === 'chatwoot:opened' || eventName === 'opened') {
          globalIsChatOpen = true;
          globalUnreadCount = 0;
          globalLastMessage = null;
          updateDocumentTitle();
          notifyListeners();
        } else if (eventName === 'chatwoot:closed' || eventName === 'closed') {
          globalIsChatOpen = false;
          notifyListeners();
        }
      }
    } catch {
      // Non-JSON postMessage from other extensions/scripts
    }
  });

  // 3. Periodic lightweight check for unread message count
  setInterval(() => {
    if (window.$chatwoot && typeof window.$chatwoot.unreadMessageCount === 'number') {
      if (window.$chatwoot.unreadMessageCount !== globalUnreadCount && !globalIsChatOpen) {
        globalUnreadCount = window.$chatwoot.unreadMessageCount;
        updateDocumentTitle();
        notifyListeners();
      }
    }
  }, 4000);
}

export function openLiveChat() {
  if (typeof window !== 'undefined' && window.$chatwoot) {
    globalIsChatOpen = true;
    globalUnreadCount = 0;
    globalLastMessage = null;
    updateDocumentTitle();
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
