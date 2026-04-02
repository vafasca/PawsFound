'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    address: '',
    loading: false,
    error: null,
    supported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    watching: false,
    accuracy: null,
    lastUpdate: null,
    heading: null,
    speed: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const reverseGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, accuracy, heading, speed } = position.coords;
    setState((prev) => ({
      ...prev,
      lat: latitude,
      lng: longitude,
      accuracy,
      heading,
      speed,
      loading: false,
      error: null,
      supported: true,
      lastUpdate: new Date(),
    }));
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
  }, []);

  // Reverse geocode address with debounce
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (reverseGeocodeTimeoutRef.current) {
      clearTimeout(reverseGeocodeTimeoutRef.current);
    }
    reverseGeocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es&zoom=16`
        );
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          const shortAddress = parts.slice(0, 3).join(',').trim();
          setState((prev) => ({ ...prev, address: shortAddress }));
        }
      } catch {
        // Keep coordinate-based address
      }
    }, 500); // 500ms debounce
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
