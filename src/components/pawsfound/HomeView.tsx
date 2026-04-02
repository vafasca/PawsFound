'use client';

import { useEffect, useState } from 'react';
import { Activity, Search, CheckCircle2, PawPrint, TrendingUp, MapPin, Satellite, Navigation } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FilterBar from './FilterBar';
import PetCard, { type ReportCard } from './PetCard';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { useGeolocation } from '@/hooks/use-geolocation';

interface Stats {
  totalReports: number;
  activeReports: number;
  lostReports: number;
  sightedReports: number;
  foundReports: number;
  totalPets: number;
  totalUsers: number;
  totalSightings: number;
}

export default function HomeView() {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const filters = useAppStore((s) => s.filters);
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const geo = useGeolocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    Promise.all([
      fetch('/api/reports').then((res) => res.json()),
      fetch('/api/stats').then((res) => res.json()),
    ])
      .then(([reportsData, statsData]) => {
        const reportsList = Array.isArray(reportsData) ? reportsData : (reportsData?.reports || []);
        setReports(reportsList);
        setStats(statsData);
      })
      .catch(() => {
        setReports([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredReports = reports.filter((r) => {
    if (filters.type !== 'all' && r.type !== filters.type) return false;
    if (filters.species !== 'all' && r.species !== filters.species) return false;
    if (filters.status !== 'all' && r.status !== filters.status) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Greeting + GPS */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-paw-on-surface">
            {isAuthenticated && user ? (
              <>Hola, <span className="gradient-text">{user.name.split(' ')[0]}</span> 👋</>
            ) : '¡Bienvenido! 👋'}
          </h2>
          <p className="text-sm sm:text-base text-paw-on-surface-variant mt-1">
            {!isAuthenticated ? (
              <span>
                <button
                  onClick={() => setShowAuth(true)}
                  className="text-paw-primary font-semibold hover:underline"
                >
                  Inicia sesión
                </button>{' '}
                para reportar y ayudar
              </span>
            ) : (
              'Ayudemos a encontrar mascotas perdidas'
            )}
          </p>
        </div>
        {/* GPS Status Badge - always visible on all sizes */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
          geo.watching
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
            : geo.hasLocation
              ? 'bg-paw-tertiary/5 text-paw-tertiary'
              : 'bg-amber-50 text-amber-600 border border-amber-200/60'
        }`}>
          {geo.loading ? (
            <>
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              GPS...
            </>
          ) : geo.watching ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Satellite className="w-3 h-3" />
              <span className="hidden sm:inline">GPS Activo</span>
            </>
          ) : geo.hasLocation ? (
            <>
              <MapPin className="w-3 h-3" />
              <span className="hidden sm:inline">📍 {geo.address || 'Ubicado'}</span>
            </>
          ) : (
            <>
              <Navigation className="w-3 h-3" />
              <button
                onClick={() => { geo.requestLocation(); geo.startWatching(); }}
                className="hover:underline font-semibold"
              >
                Activar GPS
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards — tonal layering, no borders */}
      {loading && !stats ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <div className="bg-paw-surface-low rounded-2xl p-3 sm:p-4 text-center shadow-ambient">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-paw-tertiary/10 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <Activity className="w-5 h-5 text-paw-tertiary" />
            </div>
            <p className="font-headline text-xl sm:text-2xl font-bold text-paw-on-surface">
              {stats.activeReports}
            </p>
            <p className="text-[10px] sm:text-xs text-paw-on-surface-variant font-medium">Activos</p>
          </div>
          <div className="bg-paw-surface-low rounded-2xl p-3 sm:p-4 text-center shadow-ambient">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-paw-primary/10 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <Search className="w-5 h-5 text-paw-primary" />
            </div>
            <p className="font-headline text-xl sm:text-2xl font-bold text-paw-on-surface">
              {stats.lostReports}
            </p>
            <p className="text-[10px] sm:text-xs text-paw-on-surface-variant font-medium">Perdidos</p>
          </div>
          <div className="bg-paw-surface-low rounded-2xl p-3 sm:p-4 text-center shadow-ambient">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-paw-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <TrendingUp className="w-5 h-5 text-paw-secondary" />
            </div>
            <p className="font-headline text-xl sm:text-2xl font-bold text-paw-on-surface">
              {stats.sightedReports}
            </p>
            <p className="text-[10px] sm:text-xs text-paw-on-surface-variant font-medium">Avistados</p>
          </div>
          <div className="hidden sm:block bg-paw-surface-low rounded-2xl p-4 text-center shadow-ambient">
            <div className="w-10 h-10 bg-paw-tertiary/10 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <CheckCircle2 className="w-5 h-5 text-paw-tertiary" />
            </div>
            <p className="font-headline text-2xl font-bold text-paw-on-surface">
              {stats.foundReports}
            </p>
            <p className="text-xs text-paw-on-surface-variant font-medium">Encontrados</p>
          </div>
          <div className="hidden sm:block bg-paw-surface-low rounded-2xl p-4 text-center shadow-ambient">
            <div className="w-10 h-10 bg-paw-primary/10 rounded-xl flex items-center justify-center mx-auto mb-1.5">
              <PawPrint className="w-5 h-5 text-paw-primary" />
            </div>
            <p className="font-headline text-2xl font-bold text-paw-on-surface">
              {stats.totalUsers}
            </p>
            <p className="text-xs text-paw-on-surface-variant font-medium">Buscadores</p>
          </div>
        </div>
      ) : null}

      {/* Filter Bar */}
      <FilterBar />

      {/* Reports Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-headline text-lg font-bold text-paw-on-surface">
            Reportes recientes
          </h3>
          <span className="text-sm text-paw-on-surface-variant">
            {filteredReports.length} resultado{filteredReports.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-ambient">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-paw-surface-high rounded-full flex items-center justify-center mb-4">
              <PawPrint className="w-8 h-8 text-paw-outline" />
            </div>
            <p className="font-headline text-lg font-semibold text-paw-on-surface">
              No hay reportes
            </p>
            <p className="text-sm text-paw-on-surface-variant mt-1 max-w-xs">
              No se encontraron reportes con los filtros seleccionados. Intenta cambiar los filtros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <PetCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
