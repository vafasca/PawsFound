'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const LOCATION_CACHE_KEY = 'pawsfound:last-location';

interface CachedLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  savedAt: number;
}

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  address: string;
  loading: boolean;
  error: string | null;
  supported: boolean;
  watching: boolean;
  accuracy: number | null;
  lastUpdate: Date | null;
  heading: number | null;
  speed: number | null;
}

export function useGeolocation() {
  const readCachedLocation = (): CachedLocation | null => {
    if (typeof window === 'undefined') return null;

    try {
      const raw = window.localStorage.getItem(LOCATION_CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as CachedLocation;
      if (
        typeof parsed?.lat !== 'number' ||
        typeof parsed?.lng !== 'number' ||
        typeof parsed?.savedAt !== 'number'
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

  const cachedLocation = readCachedLocation();
  const initialCachedLocationRef = useRef<CachedLocation | null>(cachedLocation);

  const [state, setState] = useState<GeolocationState>({
    lat: cachedLocation?.lat ?? null,
    lng: cachedLocation?.lng ?? null,
    address:
      cachedLocation?.lat != null && cachedLocation?.lng != null
        ? `${cachedLocation.lat.toFixed(4)}, ${cachedLocation.lng.toFixed(4)}`
        : '',
    loading: false,
    error: null,
    supported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    watching: false,
    accuracy: cachedLocation?.accuracy ?? null,
    lastUpdate: cachedLocation?.savedAt ? new Date(cachedLocation.savedAt) : null,
    heading: cachedLocation?.heading ?? null,
    speed: cachedLocation?.speed ?? null,
  });

  const watchIdRef = useRef<number | null>(null);
  const reverseGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseGeocodeCacheRef = useRef<Map<string, string>>(new Map());
  const lastReverseRequestRef = useRef<{ key: string; ts: number } | null>(null);

  useEffect(() => {
    const initialCachedLocation = initialCachedLocationRef.current;
    if (initialCachedLocation) {
      console.info('[Geo] Loaded cached location', {
        lat: initialCachedLocation.lat,
        lng: initialCachedLocation.lng,
        ageMs: Date.now() - initialCachedLocation.savedAt,
      });
      return;
    }

    console.info('[Geo] No cached location found');
  }, []);

  const updatePosition = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;

    try {
      const payload: CachedLocation = {
        lat: latitude,
        lng: longitude,
        accuracy,
        heading,
        speed,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore location cache write errors.
    }

    setState((prev) => ({
      ...prev,
      lat: latitude,
      lng: longitude,
      address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      accuracy,
      heading,
      speed,
      loading: false,
      error: null,
      supported: true,
      lastUpdate: new Date(),
    }));
    console.info('[Geo] Position updated', {
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMsg = 'Error al obtener la ubicación';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMsg = 'Permiso de ubicación denegado. Activa el GPS en tu navegador.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMsg = 'Ubicación no disponible. Verifica que tu GPS esté activo.';
        break;
      case error.TIMEOUT:
        errorMsg = 'Tiempo de espera agotado. Intenta de nuevo.';
        break;
    }
    setState((prev) => ({ ...prev, loading: false, error: errorMsg, watching: false }));
    console.error('[Geo] Position error', { code: error.code, message: error.message, errorMsg });
  }, []);

  // Reverse geocode address with debounce
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const cached = reverseGeocodeCacheRef.current.get(key);
    if (cached) {
      setState((prev) => ({ ...prev, address: cached }));
      return;
    }

    const lastRequest = lastReverseRequestRef.current;
    if (lastRequest && lastRequest.key === key && Date.now() - lastRequest.ts < 20000) {
      return;
    }

    if (reverseGeocodeTimeoutRef.current) {
      clearTimeout(reverseGeocodeTimeoutRef.current);
    }

    lastReverseRequestRef.current = { key, ts: Date.now() };

    reverseGeocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es&zoom=16`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          const shortAddress = parts.slice(0, 3).join(',').trim();
          reverseGeocodeCacheRef.current.set(key, shortAddress);
          setState((prev) => ({ ...prev, address: shortAddress }));
        }
      } catch {
        // Keep coordinate-based address
      }
    }, 900); // debounce to reduce reverse-geocoding request rate
  }, []);

  // Auto-reverse geocode when coordinates change
  useEffect(() => {
    if (state.lat !== null && state.lng !== null) {
      reverseGeocode(state.lat, state.lng);
    }
  }, [state.lat, state.lng, reverseGeocode]);

  // Request a single location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'La geolocalización no está soportada en este navegador' }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    console.info('[Geo] Requesting single location');

    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }, [updatePosition, handleError]);

  // Start watching position (real-time GPS tracking)
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'La geolocalización no está soportada' }));
      return;
    }

    // Clear existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setState((s) => ({ ...s, loading: true, error: null, watching: true }));
    console.info('[Geo] Starting location watch');

    watchIdRef.current = navigator.geolocation.watchPosition(
      updatePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }, [updatePosition, handleError]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((s) => ({ ...s, watching: false }));
    console.info('[Geo] Stopped location watch');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
    hasLocation: state.lat !== null && state.lng !== null,
  };
}
