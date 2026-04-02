'use client';

import { useState, useEffect, useCallback } from 'react';

interface PwaInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePwaInstall() {
  const isStandaloneInitial = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone: boolean }).standalone === true
  );

  const [state, setState] = useState<PwaInstallState>({
    isInstallable: false,
    isInstalled: isStandaloneInitial,
    isStandalone: isStandaloneInitial,
    deferredPrompt: null,
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState((s) => ({
        ...s,
        deferredPrompt: e as BeforeInstallPromptEvent,
        isInstallable: true,
      }));
    };

    const handleAppInstalled = () => {
      setState((s) => ({
        ...s,
        isInstallable: false,
        isInstalled: true,
        deferredPrompt: null,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!state.deferredPrompt) return false;

    state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setState((s) => ({
        ...s,
        isInstallable: false,
        isInstalled: true,
        deferredPrompt: null,
      }));
      return true;
    }
    return false;
  }, [state.deferredPrompt]);

  return {
    ...state,
    installApp,
    dismissInstall: () => setState((s) => ({ ...s, isInstallable: false })),
  };
}
