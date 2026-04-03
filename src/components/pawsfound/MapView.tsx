'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Loader2 } from 'lucide-react';
import type { ReportCard } from './PetCard';
import { useGeolocation } from '@/hooks/use-geolocation';

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-paw-surface-high gap-3">
      <Loader2 className="w-8 h-8 text-paw-primary animate-spin" />
      <p className="text-sm text-paw-on-surface-variant font-medium">Cargando mapa...</p>
    </div>
  ),
});

const REPORTS_CACHE_KEY = 'pawsfound:active-reports-cache';
const REPORTS_CACHE_TTL_MS = 5 * 60 * 1000;

interface ReportsCachePayload {
  reports: ReportCard[];
  savedAt: number;
}

const normalizeReport = (report: unknown): ReportCard | null => {
  if (!report || typeof report !== 'object') return null;

  const candidate = report as Partial<ReportCard> & {
    reporter?: { name?: string | null } | null;
    _count?: { sightings?: number | null } | null;
  };

  if (typeof candidate.id !== 'string' || !candidate.id) return null;

  return {
    id: candidate.id,
    type: typeof candidate.type === 'string' ? candidate.type : 'lost',
    petName: typeof candidate.petName === 'string' ? candidate.petName : 'Mascota',
    species: typeof candidate.species === 'string' ? candidate.species : 'other',
    breed: typeof candidate.breed === 'string' ? candidate.breed : null,
    color: typeof candidate.color === 'string' ? candidate.color : null,
    uniqueMarks: typeof candidate.uniqueMarks === 'string' ? candidate.uniqueMarks : null,
    photoUrl: typeof candidate.photoUrl === 'string' ? candidate.photoUrl : null,
    lat: typeof candidate.lat === 'number' ? candidate.lat : null,
    lng: typeof candidate.lng === 'number' ? candidate.lng : null,
    address: typeof candidate.address === 'string' ? candidate.address : null,
    status: typeof candidate.status === 'string' ? candidate.status : 'active',
    createdAt:
      typeof candidate.createdAt === 'string'
        ? candidate.createdAt
        : new Date(0).toISOString(),
    reporter: {
      name:
        typeof candidate.reporter?.name === 'string' && candidate.reporter.name.trim().length > 0
          ? candidate.reporter.name
          : 'Anónimo',
    },
    _count: {
      sightings:
        typeof candidate._count?.sightings === 'number' && Number.isFinite(candidate._count.sightings)
          ? candidate._count.sightings
          : 0,
    },
  };
};

export default function MapView() {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedOnceRef = useRef(false);
  const geo = useGeolocation();

  const parseReports = useCallback((data: unknown): ReportCard[] => {
    const rawReports = Array.isArray(data)
      ? data
      : ((data as { reports?: unknown[] } | null)?.reports || []);

    return rawReports
      .map(normalizeReport)
      .filter((report): report is ReportCard => report !== null);
  }, []);

  const readReportsCache = useCallback((): ReportsCachePayload | null => {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(REPORTS_CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as ReportsCachePayload;
      if (!Array.isArray(parsed?.reports) || typeof parsed?.savedAt !== 'number') {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }, []);

  const saveReportsCache = useCallback((nextReports: ReportCard[]) => {
    if (typeof window === 'undefined') return;

    const payload: ReportsCachePayload = {
      reports: nextReports,
      savedAt: Date.now(),
    };

    try {
      window.localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore cache write errors (private mode / storage full).
    }
  }, []);

  useEffect(() => {
    geo.requestLocation();

    const locationInterval = window.setInterval(() => {
      geo.requestLocation();
    }, 5 * 60 * 1000);

    return () => {
      window.clearInterval(locationInterval);
    };
  }, [geo.requestLocation]);

  useEffect(() => {
    const cached = readReportsCache();
    if (cached && cached.reports.length > 0) {
      setReports(cached.reports);
      setLoading(false);
    }

    const fetchReports = async () => {
      try {
        const response = await fetch(`/api/reports?status=active&t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, max-age=0',
            Pragma: 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        const nextReports = parseReports(data);

        setReports((prevReports) => {
          if (nextReports.length === 0 && prevReports.length > 0) {
            return prevReports;
          }
          return nextReports;
        });

        if (nextReports.length > 0) {
          saveReportsCache(nextReports);
        }

        hasFetchedOnceRef.current = true;
      } catch {
        // Preserve current markers if there is a temporary network error.
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    const reportsInterval = window.setInterval(() => {
      fetchReports();
    }, REPORTS_CACHE_TTL_MS);

    const refreshOnVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchReports();
      }
    };

    const refreshOnFocus = () => {
      if (!hasFetchedOnceRef.current) return;
      fetchReports();
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisibility);

    return () => {
      window.clearInterval(reportsInterval);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisibility);
    };
  }, [parseReports, readReportsCache, saveReportsCache]);

  return (
    <div className="w-full h-full relative">
      {loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-paw-surface-high gap-3">
          <Loader2 className="w-8 h-8 text-paw-primary animate-spin" />
          <p className="text-sm text-paw-on-surface-variant font-medium">
            Cargando reportes...
          </p>
        </div>
      ) : (
        <>
          <MapInner
            reports={reports}
            userLat={geo.lat}
            userLng={geo.lng}
            hasLocation={geo.hasLocation}
          />

          {reports.length === 0 && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-paw-outline-variant/30 px-4 py-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-paw-outline" />
                <p className="text-sm text-paw-on-surface-variant font-medium">
                  No hay reportes activos en el mapa
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Map controls overlay */}
      <div className="absolute top-3 left-3 z-10 max-w-[200px]">
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-paw-outline-variant/30 p-2.5">
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${geo.hasLocation ? 'bg-green-500 animate-pulse' : 'bg-paw-outline'}`} />
            <span className="font-medium text-paw-on-surface">
              {reports.length} reportes activos
            </span>
          </div>
          {geo.hasLocation && (
            <p className="text-[10px] text-paw-on-surface-variant mt-1 pl-4">
              Centrado en tu ubicación
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 sm:bottom-6 sm:left-6">
        <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-paw-outline-variant/30 p-3 space-y-2">
          <p className="text-[10px] font-bold text-paw-on-surface-variant uppercase tracking-wider">Leyenda</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-paw-primary border-2 border-white shadow-sm" />
            <span className="text-paw-on-surface">Perdido</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-paw-secondary border-2 border-white shadow-sm" />
            <span className="text-paw-on-surface">Avistado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
