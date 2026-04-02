'use client';

import { Download, X } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';

export default function PwaInstallBanner() {
  const { isInstallable, isStandalone, installApp, dismissInstall } = usePwaInstall();

  if (!isInstallable || isStandalone) return null;

  return (
    <div className="fixed top-[60px] left-0 right-0 z-40 p-3 animate-slide-down">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-paw-outline-variant/50 p-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-paw-surface-high rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src="/icons/icon-192.png"
            alt="PawsFound"
            className="w-10 h-10 rounded-lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-headline font-bold text-sm text-paw-on-surface">
            Instalar PawsFound
          </p>
          <p className="text-xs text-paw-on-surface-variant truncate">
            Acceso rápido como app desde tu pantalla de inicio
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={installApp}
            className="flex items-center gap-1.5 px-3 py-2 bg-paw-primary text-white rounded-xl text-xs font-bold hover:bg-paw-on-primary-container transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Instalar
          </button>
          <button
            onClick={dismissInstall}
            className="p-1.5 text-paw-on-surface-variant hover:text-paw-on-surface rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
