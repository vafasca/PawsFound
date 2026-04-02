'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PawPrint, MapPin, User, Eye, Clock, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppStore } from '@/store/app-store';
import { toast } from 'sonner';
import CommentsSection from './CommentsSection';

interface Sighting {
  id: string;
  description: string | null;
  address: string | null;
  createdAt: string;
  reporter: {
    name: string;
  };
}

interface ReportDetail {
  id: string;
  type: string;
  petName: string;
  species: string;
  breed: string | null;
  color: string | null;
  uniqueMarks: string | null;
  photoUrl: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  status: string;
  createdAt: string;
  reporter: {
    name: string;
    email: string;
    phone: string | null;
  };
  _count: {
    sightings: number;
  };
  sightings: Sighting[];
}

const speciesLabel: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otro',
};

export default function PetDetailModal() {
  const selectedReport = useAppStore((s) => s.selectedReport);
  const showDetail = useAppStore((s) => s.showDetail);
  const setShowDetail = useAppStore((s) => s.setShowDetail);
  const [report, setReport] = useState<ReportDetail | null>(null);
  const loading = showDetail && !!selectedReport && !report;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReport(null);
    }
    setShowDetail(open);
  };

  useEffect(() => {
    if (!selectedReport || !showDetail) return;
    const controller = new AbortController();
    fetch(`/api/reports/${selectedReport}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar');
        return res.json();
      })
      .then((data) => setReport(data.report ?? data))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          toast.error('Error al cargar el reporte');
          handleOpenChange(false);
        }
      });
    return () => controller.abort();
  }, [selectedReport, showDetail]);

  const getBadge = () => {
    if (!report) return null;
    if (report.status === 'found') {
      return (
        <span className="status-ribbon text-green-700 shadow-ambient">
          ✨ ENCONTRADO
        </span>
      );
    }
    if (report.type === 'lost') {
      return (
        <span className="status-ribbon text-paw-primary shadow-ambient">
          PERDIDO
        </span>
      );
    }
    return (
      <span className="status-ribbon text-paw-secondary shadow-ambient">
        AVISTADO
      </span>
    );
  };

  let timeAgo = '';
  if (report) {
    try {
      timeAgo = formatDistanceToNow(new Date(report.createdAt), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      timeAgo = 'hace un momento';
    }
  }

  return (
    <Dialog open={showDetail && !!selectedReport} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 rounded-3xl gap-0 glass paw-pattern shadow-ambient-lg">
        {/* Accessible title & description — always present for Radix UI screen-reader requirement */}
        <DialogTitle className="sr-only">
          {report ? `Detalle de ${report.petName}` : 'Cargando detalle del reporte'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {report ? `Reporte de ${report.petName}` : 'Cargando información del reporte'}
        </DialogDescription>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-paw-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : report ? (
          <>
            {/* Photo — full bleed at top */}
            <div className="relative aspect-video bg-paw-surface-high -mt-1">
              {report.photoUrl ? (
                <img
                  src={report.photoUrl}
                  alt={report.petName}
                  className="w-full h-full object-cover rounded-t-3xl"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-t-3xl bg-paw-surface-high">
                  <PawPrint className="w-16 h-16 text-paw-outline-variant" />
                </div>
              )}
              <div className="absolute top-3 left-3">{getBadge()}</div>
            </div>

            <div className="p-5 space-y-4">
              {/* Visible heading */}
              <DialogHeader>
                <h2 className="font-headline text-2xl font-bold text-paw-on-surface">
                  {report.petName}
                </h2>
              </DialogHeader>

              {/* Species & Breed */}
              <div className="flex items-center gap-2 text-sm text-paw-on-surface-variant">
                <span className="px-3 py-1 bg-paw-surface-high rounded-full text-xs font-semibold">
                  {speciesLabel[report.species] || report.species}
                </span>
                {report.breed && <span>{report.breed}</span>}
              </div>

              {/* Details Grid — tonal layering, no borders */}
              <div className="grid grid-cols-2 gap-3">
                {report.color && (
                  <div className="bg-paw-surface-low rounded-xl p-3">
                    <p className="text-xs text-paw-on-surface-variant mb-0.5">Color</p>
                    <p className="text-sm font-medium text-paw-on-surface">{report.color}</p>
                  </div>
                )}
                {report.uniqueMarks && (
                  <div className="bg-paw-surface-low rounded-xl p-3 col-span-2">
                    <p className="text-xs text-paw-on-surface-variant mb-0.5">Señas Particulares</p>
                    <p className="text-sm font-medium text-paw-on-surface">{report.uniqueMarks}</p>
                  </div>
                )}
              </div>

              {/* Location — tonal card */}
              {report.address && (
                <div className="flex items-start gap-2 bg-paw-surface-low rounded-xl p-3">
                  <MapPin className="w-4 h-4 text-paw-secondary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-paw-on-surface-variant">Ubicación</p>
                    <p className="text-sm font-medium text-paw-on-surface">{report.address}</p>
                  </div>
                </div>
              )}

              {/* Reporter & Time */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-paw-on-surface-variant">
                  <User className="w-4 h-4" />
                  <span>Reportado por <strong className="text-paw-on-surface">{report.reporter?.name ?? 'Anónimo'}</strong></span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-paw-on-surface-variant">
                <Calendar className="w-4 h-4" />
                <span>{timeAgo}</span>
              </div>

              {/* Sightings */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-paw-secondary" />
                  <span className="text-sm font-medium text-paw-on-surface">
                    Avistamientos ({report._count?.sightings ?? 0})
                  </span>
                </div>

                {report.sightings && report.sightings.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                    {report.sightings.map((sighting) => {
                      let sightingTime = '';
                      try {
                        sightingTime = formatDistanceToNow(new Date(sighting.createdAt), {
                          addSuffix: true,
                          locale: es,
                        });
                      } catch {
                        sightingTime = 'hace un momento';
                      }
                      return (
                        <div
                          key={sighting.id}
                          className="bg-paw-surface-low rounded-xl p-3 space-y-1"
                        >
                          {sighting.description && (
                            <p className="text-sm text-paw-on-surface">{sighting.description}</p>
                          )}
                          {sighting.address && (
                            <div className="flex items-center gap-1 text-xs text-paw-on-surface-variant">
                              <MapPin className="w-3 h-3" />
                              <span>{sighting.address}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-paw-on-surface-variant pt-1">
                            <span>Por {sighting.reporter?.name ?? 'Anónimo'}</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{sightingTime}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-paw-on-surface-variant pl-6">
                    Aún no hay avistamientos
                  </p>
                )}
              </div>

              {/* Comments */}
              <CommentsSection reportId={report.id} />

              {/* Report Sighting Button — gradient, rounded-full */}
              <button
                onClick={() => {
                  toast.info('Función de avistamiento próximamente');
                }}
                className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-br from-paw-primary to-paw-primary-container hover:opacity-90 transition-all shadow-ambient text-sm"
              >
                Reportar Avistamiento
              </button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
