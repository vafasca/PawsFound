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
  const userMarkerRef = useRef<L.Marker | null>(null);
  const reportsLayerRef = useRef<L.LayerGroup | null>(null);
  const reportMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const lastCenteredPositionRef = useRef<L.LatLng | null>(null);
  const setSelectedReport = useAppStore((s) => s.setSelectedReport);
  const setShowDetail = useAppStore((s) => s.setShowDetail);

  // Center on user's location or default to La Paz
  const getInitialCenter = (): [number, number] =>
    userLat !== null && userLng !== null
      ? [userLat, userLng]
      : [-16.4955, -68.1336];

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center = getInitialCenter();
    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
    });
    console.info('[MapInner] Map initialized', { center });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      console.info('[MapInner] Map destroyed');
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when user location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hasLocation || userLat === null || userLng === null) return;

    const nextPoint = L.latLng(userLat, userLng);
    const lastPoint = lastCenteredPositionRef.current;
    const movedMeters = lastPoint ? lastPoint.distanceTo(nextPoint) : Infinity;

    // Avoid visual flicker by re-centering only when movement is meaningful.
    if (movedMeters < 20) return;

    console.info('[MapInner] Re-centering map to user', { userLat, userLng, movedMeters });
    map.panTo([userLat, userLng], { animate: true, duration: 0.5 });
    lastCenteredPositionRef.current = nextPoint;
  }, [hasLocation, userLat, userLng]);

  // Add user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hasLocation && userLat !== null && userLng !== null) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLat, userLng]);
        console.info('[MapInner] Updated user marker', { userLat, userLng });
        return;
      }

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

      userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b style="font-family:Be Vietnam Pro,sans-serif;">📍 Tu ubicación</b>');
      console.info('[MapInner] Added user marker', { userLat, userLng });
      return;
    }

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
      console.warn('[MapInner] Removed user marker because location is unavailable');
    }
  }, [hasLocation, userLat, userLng]);

  // Add report markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    console.info('[MapInner] Rendering report markers', {
      incomingReports: reports.length,
      hasLocation,
    });

    if (!reportsLayerRef.current) {
      reportsLayerRef.current = L.layerGroup().addTo(map);
    }

    const layerGroup = reportsLayerRef.current;
    const nextMarkerIds = new Set<string>();

    reports.forEach((report) => {
      if (report.lat == null || report.lng == null) return;
      nextMarkerIds.add(report.id);

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

      const existingMarker = reportMarkersRef.current.get(report.id);
      if (existingMarker) {
        existingMarker.setLatLng([report.lat, report.lng]);
        existingMarker.setIcon(icon);
        return;
      }

      const marker = L.marker([report.lat, report.lng], { icon }).addTo(layerGroup);
      reportMarkersRef.current.set(report.id, marker);

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
            ${(report._count?.sightings ?? 0) > 0 ? `<p style="font-size:11px;color:#0060ac;margin-top:2px;">👁️ ${report._count.sightings} avistamiento${report._count.sightings > 1 ? 's' : ''}</p>` : ''}
          </div>
        </div>`,
        {
          closeButton: true,
          className: 'custom-popup',
        }
      );

      marker.on('click', () => {
        setSelectedReport(report.id);
        setShowDetail(true);
      });
    });

    reportMarkersRef.current.forEach((marker, id) => {
      if (nextMarkerIds.has(id)) return;
      layerGroup.removeLayer(marker);
      reportMarkersRef.current.delete(id);
    });
    console.info('[MapInner] Marker sync complete', {
      visibleMarkers: reportMarkersRef.current.size,
    });

    // Fit reports only when there is no user location available.
    // If user location exists, keep map behavior centered on live GPS updates.
    const visibleMarkers = Array.from(reportMarkersRef.current.values());
    if (!hasLocation && visibleMarkers.length > 0) {
      const group = L.featureGroup(visibleMarkers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    if (hasLocation && visibleMarkers.length > 0) {
      map.invalidateSize(false);
    }
  }, [reports, hasLocation, setSelectedReport, setShowDetail]);

  return <div ref={mapRef} className="w-full h-full" />;
}
