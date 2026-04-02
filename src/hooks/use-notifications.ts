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

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
    notifyNearbyPets,
    notifyNewSighting,
    canNotify: state.supported && state.permission === 'granted',
  };
}
