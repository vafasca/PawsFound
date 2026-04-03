'use client';

import { PawPrint, MapPin, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useEffect, useState } from 'react';
import NotificationPanel from './NotificationPanel';

export default function TopAppBar() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const setShowAdmin = useAppStore((s) => s.setShowAdmin);
  const geo = useGeolocation();
  const { isAuthenticated, user } = useAuth();
  const [showLocation, setShowLocation] = useState(false);

  useEffect(() => {
    geo.requestLocation();
    geo.startWatching();

    return () => {
      geo.stopWatching();
    };
  }, [geo.requestLocation, geo.startWatching, geo.stopWatching]);

  const tabTitles: Record<string, string> = {
    home: 'Inicio',
    map: 'Mapa',
    report: 'Reportar',
    chat: 'Chat',
    profile: 'Perfil',
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass shadow-ambient">
      <div className="flex items-center justify-between px-4 sm:px-6 h-[60px] max-w-5xl mx-auto">
        {/* Logo with gradient glow */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-paw-primary/15 to-paw-primary-container/15 rounded-xl blur-lg scale-110" />
            <div className="relative w-9 h-9 bg-gradient-to-br from-paw-primary to-paw-primary-container rounded-xl flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-headline text-lg font-bold gradient-text tracking-tight leading-none">
              PawsFound
            </h1>
            <p className="text-[10px] text-paw-on-surface-variant font-medium leading-none mt-0.5">
              Encuentra mascotas perdidas
            </p>
          </div>
          <div className="sm:hidden">
            <h1 className="font-headline text-lg font-bold gradient-text tracking-tight">
              PawsFound
            </h1>
          </div>
        </div>

        {/* Center - tab title on mobile */}
        <div className="sm:hidden absolute left-1/2 -translate-x-1/2">
          <span className="font-headline text-sm font-semibold text-paw-on-surface">
            {tabTitles[activeTab] || ''}
          </span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* GPS indicator */}
          <button
            onClick={() => setShowLocation(!showLocation)}
            className={`p-2 rounded-xl transition-glass ${
              geo.hasLocation
                ? 'text-paw-tertiary hover:bg-paw-tertiary/10'
                : 'text-paw-on-surface-variant hover:bg-paw-surface-high'
            }`}
            title={geo.hasLocation ? 'GPS activo' : 'GPS inactivo'}
          >
            <MapPin className="w-5 h-5" />
          </button>

          {/* Admin shield */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowAdmin(true)}
              className="p-2 rounded-xl text-paw-secondary hover:bg-paw-secondary/10 transition-glass"
              title="Panel de Admin"
            >
              <ShieldAlert className="w-5 h-5" />
            </button>
          )}

          {/* Notifications or Login */}
          {isAuthenticated ? (
            <NotificationPanel />
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-paw-primary to-paw-primary-container hover:opacity-90 transition-all shadow-ambient"
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Location bar - tonal shift, no border */}
      {showLocation && (
        <div className="bg-paw-surface-low/60 backdrop-blur-sm px-4 sm:px-6 py-2 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs">
            {geo.loading ? (
              <span className="text-paw-on-surface-variant">Obteniendo ubicación...</span>
            ) : geo.hasLocation ? (
              <>
                <span className="w-2 h-2 bg-paw-tertiary rounded-full community-pulse" />
                <span className="text-paw-on-surface">
                  {geo.lat?.toFixed(4)}, {geo.lng?.toFixed(4)}
                </span>
                {geo.address && (
                  <span className="text-paw-on-surface-variant">· {geo.address}</span>
                )}
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-paw-outline rounded-full" />
                <span className="text-paw-on-surface-variant">
                  GPS no disponible
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
