'use client';

import { useState, useEffect, useCallback } from 'react';

interface NotificationState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    supported: typeof window !== 'undefined' && 'Notification' in window,
    permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default',
    subscribed: false,
  });

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;

    const permission = await Notification.requestPermission();
    setState((s) => ({ ...s, permission }));
    return permission === 'granted';
  }, []);

  const sendLocalNotification = useCallback(
    (title: string, options?: NotificationOptions & { url?: string }) => {
      if (state.permission !== 'granted') return;

      const notification = new Notification(title, {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100],
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        if (options?.url) {
          window.location.href = options.url;
        }
        notification.close();
      };
    },
    [state.permission]
  );

  const notifyNearbyPets = useCallback(
    (count: number) => {
      if (count === 0) return;
      sendLocalNotification(
        `🐾 ${count} mascota${count > 1 ? 's' : ''} cerca de ti`,
        {
          body: `${count} reporte${count > 1 ? 's' : ''} activo${count > 1 ? 's' : ''} en tu zona. Ayuda a encontrarlos.`,
          tag: 'nearby-pets',
          url: '/?tab=map',
        }
      );
    },
    [sendLocalNotification]
  );

  const notifyNewSighting = useCallback(
    (petName: string) => {
      sendLocalNotification(`¡Avistamiento de ${petName}!`, {
        body: `Alguien vio a ${petName} cerca de tu ubicación. Revisa el reporte.`,
        tag: `sighting-${petName}`,
        url: '/?tab=home',
      });
    },
    [sendLocalNotification]
  );

  const ensurePushSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    if (state.permission !== 'granted') return false;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const key = Uint8Array.from(
          atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')),
          (char) => char.charCodeAt(0)
        );
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
      }

      await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      setState((s) => ({ ...s, subscribed: true }));
      return true;
    } catch {
      return false;
    }
  }, [state.permission]);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
    notifyNearbyPets,
    notifyNewSighting,
    ensurePushSubscription,
    canNotify: state.supported && state.permission === 'granted',
  };
}
