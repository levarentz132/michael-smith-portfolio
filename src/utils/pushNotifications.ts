 import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token, type ActionPerformed, type PushNotificationSchema } from '@capacitor/push-notifications';
import { Badge } from '@capawesome/capacitor-badge';
import { openLiveChat } from './liveChat';

let isPushInitialized = false;

export async function initPushNotifications() {
  if (isPushInitialized || !Capacitor.isNativePlatform()) return;
  isPushInitialized = true;

  try {
    // 1. Request permissions for Push Notifications
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive !== 'granted') {
      perm = await PushNotifications.requestPermissions();
    }

    if (perm.receive !== 'granted') {
      console.warn('[FCM Push] Push notification permission not granted:', perm.receive);
      return;
    }

    // 2. Register device with FCM
    await PushNotifications.register();

    // 3. Listen for FCM Device Token
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('[FCM Push] Registered with token:', token.value);
      localStorage.setItem('fcm_device_token', token.value);

      // Send token to backend
      try {
        const sessionStr = localStorage.getItem('userSession');
        let userPhone = '';
        let userEmail = '';
        if (sessionStr) {
          try {
            const s = JSON.parse(sessionStr);
            userPhone = s.phone || s.tenant?.phone || '';
            userEmail = s.email || s.tenant?.email || '';
          } catch {}
        }

        await fetch('/api/register-push-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token.value,
            phone: userPhone,
            email: userEmail,
            platform: Capacitor.getPlatform(),
          }),
        });
      } catch (err) {
        console.warn('[FCM Push] Failed to sync token to backend:', err);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[FCM Push] Registration error:', error);
    });

    // 4. Foreground push notification received
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[FCM Push] Notification received in foreground:', notification);
      Badge.set({ count: 1 }).catch(() => {});
    });

    // 5. User tapped push notification (wakes up / opens app directly into Live Chat)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('[FCM Push] Notification action performed:', action);
      Badge.clear().catch(() => {});
      openLiveChat();
    });
  } catch (err) {
    console.warn('[FCM Push] Setup error:', err);
  }
}
