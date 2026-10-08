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

export function openLiveChat() {
  if (typeof window !== 'undefined' && window.$chatwoot) {
    window.$chatwoot.toggle('open');
  }
}

export function closeLiveChat() {
  if (typeof window !== 'undefined' && window.$chatwoot) {
    window.$chatwoot.toggle('close');
  }
}

export function toggleLiveChat() {
  if (typeof window !== 'undefined' && window.$chatwoot) {
    window.$chatwoot.toggle();
  }
}

export function useLiveChat() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<{ text?: string; sender?: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.$chatwoot) {
      setIsReady(true);
      if (typeof window.$chatwoot.unreadMessageCount === 'number') {
        setUnreadCount(window.$chatwoot.unreadMessageCount);
      }
    }

    const handleReady = () => {
      setIsReady(true);
      if (window.$chatwoot && typeof window.$chatwoot.unreadMessageCount === 'number') {
        setUnreadCount(window.$chatwoot.unreadMessageCount);
      }
    };

    const handleUnreadCount = (event: Event) => {
      const customEvent = event as CustomEvent<{ unreadMessageCount?: number }>;
      const count = customEvent.detail?.unreadMessageCount ?? 0;
      setUnreadCount(count);
    };

    const handleNewMessage = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const message = customEvent.detail;
      if (message && message.message_type === 0) { // incoming from agent/admin
        setUnreadCount((prev) => prev + 1);
        setLastMessage({
          text: message.content || 'Pesan baru dari Admin',
          sender: message.sender?.name || 'Admin Highlanderstay',
        });
      }
    };

    window.addEventListener('chatwoot:ready', handleReady);
    window.addEventListener('chatwoot:on-unread-message-count-changed', handleUnreadCount);
    window.addEventListener('chatwoot:on-message', handleNewMessage);

    return () => {
      window.removeEventListener('chatwoot:ready', handleReady);
      window.removeEventListener('chatwoot:on-unread-message-count-changed', handleUnreadCount);
      window.removeEventListener('chatwoot:on-message', handleNewMessage);
    };
  }, []);

  const handleOpen = useCallback(() => {
    openLiveChat();
    setUnreadCount(0);
    setLastMessage(null);
  }, []);

  return {
    unreadCount,
    isReady,
    lastMessage,
    openChat: handleOpen,
    toggleChat: toggleLiveChat,
    closeChat: closeLiveChat,
  };
}
