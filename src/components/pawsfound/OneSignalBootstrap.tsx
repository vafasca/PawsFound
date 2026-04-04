'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

declare global {
  interface Window {
    OneSignal?: {
      init: (config: Record<string, unknown>) => Promise<void>;
      login: (externalId: string) => Promise<void>;
      logout: () => Promise<void>;
      Notifications?: {
        permission?: boolean;
        requestPermission?: () => Promise<void>;
      };
      User?: {
        PushSubscription?: {
          optOut?: () => Promise<void>;
          optIn?: () => Promise<void>;
        };
      };
    };
    OneSignalDeferred?: Array<(oneSignal: NonNullable<Window['OneSignal']>) => Promise<void> | void>;
  }
}

let oneSignalInitialized = false;

export default function OneSignalBootstrap() {
  const { isAuthenticated, user } = useAuth();
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  useEffect(() => {
    if (!appId || typeof window === 'undefined') return;

    if (!document.getElementById('onesignal-sdk')) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      if (!oneSignalInitialized) {
        await OneSignal.init({
          appId,
          serviceWorkerPath: '/sw.js',
          serviceWorkerUpdaterPath: '/sw.js',
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });
        oneSignalInitialized = true;
      }

      if (!isAuthenticated || !user?.id) {
        await OneSignal.logout().catch(() => {});
        return;
      }

      await OneSignal.login(user.id).catch(() => {});

      if (user.pushEnabled === false) {
        await OneSignal.User?.PushSubscription?.optOut?.();
        return;
      }

      await OneSignal.User?.PushSubscription?.optIn?.();

      if (OneSignal.Notifications?.permission === false) return;
      if (OneSignal.Notifications?.permission === true) return;
      await OneSignal.Notifications?.requestPermission?.();
    });
  }, [appId, isAuthenticated, user?.id, user?.pushEnabled]);

  return null;
}
