'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '@/store/app-store';
import type { ReportCard } from './PetCard';

interface MapInnerProps {
  reports: ReportCard[];
  userLat: number | null;
  userLng: number | null;
  hasLocation: boolean;
}

const speciesLabel: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otro',
};

export default function MapInner({ reports, userLat, userLng, hasLocation }: MapInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const setSelectedReport = useAppStore((s) => s.setSelectedReport);
  const setShowDetail = useAppStore((s) => s.setShowDetail);

  // Center on user's location or default to La Paz
  const center: [number, number] =
    userLat !== null && userLng !== null
      ? [userLat, userLng]
      : [-16.4955, -68.1336];

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center]);

  // Update center when user location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hasLocation || userLat === null || userLng === null) return;

    map.setView([userLat, userLng], 14, { animate: true });
  }, [hasLocation, userLat, userLng]);

  // Add user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing user marker
    map.eachLayer((layer) => {
      if ((layer as L.Marker).options?.className === 'user-marker') {
        map.removeLayer(layer);
      }
    });

    if (hasLocation && userLat !== null && userLng !== null) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 0 0 2px #3b82f6, 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([userLat, userLng], { icon })
        .addTo(map)
        .bindPopup('<b style="font-family:Be Vietnam Pro,sans-serif;">📍 Tu ubicación</b>');
    }
  }, [hasLocation, userLat, userLng]);

  // Add report markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing report markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && (layer as L.Marker).options?.className !== 'user-marker') {
        map.removeLayer(layer);
      }
    });

    // Add markers for each report
    const markers: L.Marker[] = [];

    reports.forEach((report) => {
      if (report.lat == null || report.lng == null) return;

      const isLost = report.type === 'lost';
      const color = isLost ? '#904d00' : '#0060ac';

      const icon = L.divIcon({
        className: 'report-marker',
        html: `<div style="
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform:rotate(45deg);font-size:14px;">
            ${isLost ? '🐕' : '👁️'}
          </span>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([report.lat, report.lng], { icon }).addTo(map);
      markers.push(marker);

      const badgeText =
        report.status === 'found'
          ? 'ENCONTRADO'
          : isLost
            ? 'PERDIDO'
            : 'AVISTADO';

      const badgeColor =
        report.status === 'found'
          ? '#22c55e'
          : isLost
            ? '#904d00'
            : '#0060ac';

      const photoHtml = report.photoUrl
        ? `<img src="${report.photoUrl}" alt="${report.petName}" style="width:100%;height:80px;object-fit:cover;border-radius:8px 8px 0 0;" />`
        : `<div style="width:100%;height:80px;background:#f9e4d7;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:center;font-size:24px;">🐾</div>`;

      marker.bindPopup(
        `<div style="width:200px;font-family:'Be Vietnam Pro',sans-serif;margin:-8px;">
          ${photoHtml}
          <div style="padding:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <strong style="font-size:14px;color:#241912;">${report.petName}</strong>
              <span style="font-size:9px;font-weight:700;color:white;background:${badgeColor};padding:2px 6px;border-radius:999px;">${badgeText}</span>
            </div>
            <p style="font-size:12px;color:#564334;margin:0;">${[report.breed, speciesLabel[report.species]].filter(Boolean).join(' · ')}</p>
            ${report.address ? `<p style="font-size:11px;color:#897362;margin-top:4px;">📍 ${report.address}</p>` : ''}
            ${report._count.sightings > 0 ? `<p style="font-size:11px;color:#0060ac;margin-top:2px;">👁️ ${report._count.sightings} avistamiento${report._count.sightings > 1 ? 's' : ''}</p>` : ''}
          </div>
        </div>`,
        {
          closeButton: true,
          className: 'custom-popup',
        }
      );
    });

    // Auto-fit bounds if user has location
    if (hasLocation && markers.length > 0) {
      const allPoints = markers.map((m) => m.getLatLng());
      if (userLat !== null && userLng !== null) {
        allPoints.push(L.latLng(userLat, userLng));
      }
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }, [reports, hasLocation, userLat, userLng]);

  return <div ref={mapRef} className="w-full h-full" />;
}
