'use client';

import { useCallback, useEffect, useState } from 'react';
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

export default function MapView() {
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const geo = useGeolocation();

  const parseReports = useCallback((data: unknown): ReportCard[] => {
    return Array.isArray(data)
      ? (data as ReportCard[])
      : ((data as { reports?: ReportCard[] } | null)?.reports || []);
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
    if (cached && Date.now() - cached.savedAt <= REPORTS_CACHE_TTL_MS) {
      setReports(cached.reports);
      setLoading(false);
    }

    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports?status=active', { cache: 'no-store' });
        const data = await response.json();
        const nextReports = parseReports(data);
        setReports(nextReports);
        saveReportsCache(nextReports);
      } catch {
        // Preserve current markers if there is a temporary network error.
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    const reportsInterval = window.setInterval(() => {
      fetch('/api/reports?status=active', { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => {
          const nextReports = parseReports(data);
          setReports(nextReports);
          saveReportsCache(nextReports);
        })
        .catch(() => {
          // Keep previous reports or cached data to avoid map flicker/disappearing markers.
        });
    }, REPORTS_CACHE_TTL_MS);

    return () => {
      window.clearInterval(reportsInterval);
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
      ) : reports.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-paw-surface-high gap-3">
          <MapPin className="w-12 h-12 text-paw-outline" />
          <p className="text-sm text-paw-on-surface-variant font-medium">
            No hay reportes activos en el mapa
          </p>
        </div>
      ) : (
        <MapInner
          reports={reports}
          userLat={geo.lat}
          userLng={geo.lng}
          hasLocation={geo.hasLocation}
        />
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
