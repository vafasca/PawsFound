'use client';

import { PawPrint, MapPin, User, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppStore } from '@/store/app-store';

export interface ReportCard {
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
  };
  _count: {
    sightings: number;
  };
}

interface PetCardProps {
  report: ReportCard;
}

const speciesLabel: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otro',
};

export default function PetCard({ report }: PetCardProps) {
  const setSelectedReport = useAppStore((s) => s.setSelectedReport);
  const setShowDetail = useAppStore((s) => s.setShowDetail);

  const handleClick = () => {
    setSelectedReport(report.id);
    setShowDetail(true);
  };

  const getBadge = () => {
    if (report.status === 'found') {
      return (
        <span className="absolute top-3 left-3 status-ribbon text-green-700 shadow-ambient">
          ✨ ENCONTRADO
        </span>
      );
    }
    if (report.type === 'lost') {
      return (
        <span className="absolute top-3 left-3 status-ribbon text-paw-primary shadow-ambient">
          PERDIDO
        </span>
      );
    }
    return (
      <span className="absolute top-3 left-3 status-ribbon text-paw-secondary shadow-ambient">
        AVISTADO
      </span>
    );
  };

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(report.createdAt), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    timeAgo = 'hace un momento';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left bg-white rounded-2xl shadow-ambient hover:shadow-ambient-lg transition-all duration-300 overflow-hidden group hover:scale-[1.02] relative"
    >
      {/* Photo — overlaps top edge via negative margin */}
      <div className="relative aspect-video bg-paw-surface-high overflow-hidden -mt-3 rounded-t-2xl">
        {report.photoUrl ? (
          <img
            src={report.photoUrl}
            alt={report.petName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-paw-surface-high">
            <PawPrint className="w-12 h-12 text-paw-outline-variant" />
          </div>
        )}
        {getBadge()}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2 pt-5">
        <div>
          <h3 className="font-headline text-lg font-bold text-paw-on-surface">
            {report.petName}
          </h3>
          <p className="text-sm text-paw-on-surface-variant">
            {[report.breed, speciesLabel[report.species] || report.species].filter(Boolean).join(' · ')}
          </p>
        </div>

        {report.color && (
          <p className="text-sm text-paw-on-surface-variant">
            <span className="font-medium text-paw-on-surface">Color:</span> {report.color}
          </p>
        )}

        {report.uniqueMarks && (
          <p className="text-sm text-paw-on-surface-variant line-clamp-1">
            {report.uniqueMarks}
          </p>
        )}

        {report.address && (
          <div className="flex items-center gap-1.5 text-sm text-paw-on-surface-variant">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{report.address}</span>
          </div>
        )}

        {/* Bottom meta — tonal separator instead of border */}
        <div className="flex items-center justify-between pt-3 mt-1 bg-paw-surface-low/40 -mx-4 px-4 rounded-b-2xl">
          <div className="flex items-center gap-1.5 text-xs text-paw-on-surface-variant">
            <User className="w-3.5 h-3.5" />
            <span>{report.reporter.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-paw-on-surface-variant">{timeAgo}</span>
            {report._count.sightings > 0 && (
              <div className="flex items-center gap-1 text-xs text-paw-secondary">
                <Eye className="w-3.5 h-3.5" />
                <span>{report._count.sightings}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
