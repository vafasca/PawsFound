'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Eye, Camera, MapPin, Sparkles, Check,
  ChevronRight, ChevronLeft, Info, PawPrint, Loader2,
  Crosshair, Dog, Cat, Rabbit, Navigation,
  MapPinned,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useNotifications } from '@/hooks/use-notifications';

const colorOptions = [
  { value: 'Marrón/Chocolate', label: 'Marrón / Chocolate' },
  { value: 'Negro', label: 'Negro' },
  { value: 'Blanco/Crema', label: 'Blanco / Crema' },
  { value: 'Gris/Azulado', label: 'Gris / Azulado' },
  { value: 'Naranja', label: 'Naranja' },
  { value: 'Tricolor', label: 'Tricolor' },
];

const speciesOptions = [
  { value: 'dog', label: 'Perro', icon: Dog },
  { value: 'cat', label: 'Gato', icon: Cat },
  { value: 'other', label: 'Otro', icon: Rabbit },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function ReportView() {
  const reportType = useAppStore((s) => s.reportType);
  const setReportType = useAppStore((s) => s.setReportType);
  const reportStep = useAppStore((s) => s.reportStep);
  const setReportStep = useAppStore((s) => s.setReportStep);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setSelectedReport = useAppStore((s) => s.setSelectedReport);
  const setShowDetail = useAppStore((s) => s.setShowDetail);
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const { isAuthenticated, user } = useAuth();

  const [direction, setDirection] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const geo = useGeolocation();
  const notifications = useNotifications();

  const [form, setForm] = useState({
    petName: '',
    species: 'dog' as string,
    breed: '',
    color: '',
    uniqueMarks: '',
    photoFile: null as File | null,
    photoUrl: '' as string,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetReportDraft = () => {
    setForm({
      petName: '',
      species: 'dog',
      breed: '',
      color: '',
      uniqueMarks: '',
      photoFile: null,
      photoUrl: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setReportStep(1);
    setReportType('lost');
  };

  // Capture location only once when entering report flow.
  useEffect(() => {
    geo.requestLocation();
  }, [geo.requestLocation]);

  useEffect(() => {
    return () => {
      geo.stopWatching();
    };
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        photoFile: file,
        photoUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async () => {
    if (!form.photoFile) {
      toast.error('Primero sube una foto');
      return;
    }

    setAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const res = await fetch('/api/analyze-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            if (errData.code === 'ZAI_NOT_AVAILABLE' || errData.code === 'ZAI_NOT_CONFIGURED') {
              throw new Error('Análisis IA solo disponible en z.ai. Llena los datos manualmente.');
            }
            throw new Error(errData.error || 'Error en análisis');
          }

          const data = await res.json();
          const result = data.analysis || data;

          // Auto-fill form with AI suggestions
          if (result.species) {
            setForm((f) => ({ ...f, species: result.species }));
          }
          if (result.breed) {
            setForm((f) => ({ ...f, breed: result.breed }));
          }
          if (result.colors?.length) {
            setForm((f) => ({ ...f, color: result.colors[0] }));
          }
          if (result.uniqueMarks) {
            setForm((f) => ({ ...f, uniqueMarks: result.uniqueMarks }));
          }

          toast.success('Análisis completado', {
            description: 'Se han sugerido características de la mascota',
          });
        } catch {
          toast.error('No se pudo analizar la foto. Intenta de nuevo.');
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(form.photoFile);
    } catch {
      setAnalyzing(false);
    }
  };

  const nextStep = () => {
    if (reportStep < 3) {
      setDirection(1);
      setReportStep(reportStep + 1);
    }
  };

  const prevStep = () => {
    if (reportStep > 1) {
      setDirection(-1);
      setReportStep(reportStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para publicar un reporte');
      setShowAuth(true);
      return;
    }
    if (!user?.id) {
      toast.error('Error de sesión');
      return;
    }
    const normalizedPetName = form.petName.trim() || 'Sin nombre';
    const normalizedAddress = geo.address
      || (geo.lat !== null && geo.lng !== null ? `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}` : 'La Paz, Bolivia');
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          petName: normalizedPetName,
          species: form.species,
          breed: form.breed || undefined,
          color: form.color || undefined,
          uniqueMarks: form.uniqueMarks || undefined,
          photoUrl: form.photoUrl || undefined,
          lat: geo.lat ?? -16.4955,
          lng: geo.lng ?? -68.1336,
          address: normalizedAddress,
          reporterId: user?.id || '',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al publicar');
      }

      toast.success('¡Alerta publicada!', {
        description: 'Notificaremos a usuarios cercanos',
        duration: 5000,
      });

      // Always return to home and clean the report flow after a successful publish.
      resetReportDraft();
      setSelectedReport(null);
      setShowDetail(false);
      setActiveTab('home');

      // Non-critical local notification should not block navigation/reset flow.
      if (notifications.canNotify) {
        try {
          notifications.sendLocalNotification('Alerta publicada', {
            body: `Tu reporte de ${normalizedPetName} está activo. Te avisaremos si hay avistamientos.`,
            tag: `report-published-${Date.now()}`,
          });
        } catch {
          // ignore local notification failures
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al publicar';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Tipo', 'Detalles', 'Publicar'];

  const selectedSpecies = speciesOptions.find((s) => s.value === form.species);

  // Format accuracy for display
  const formatAccuracy = (meters: number | null) => {
    if (!meters) return null;
    if (meters < 10) return 'Excelente (±10m)';
    if (meters < 30) return 'Buena (±30m)';
    if (meters < 100) return 'Regular (±100m)';
    return `Baja (±${Math.round(meters)}m)`;
  };

  // Format time since last update
  const timeSinceUpdate = () => {
    if (!geo.lastUpdate) return null;
    const diff = Date.now() - geo.lastUpdate.getTime();
    if (diff < 5000) return 'Ahora';
    if (diff < 60000) return `Hace ${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)}min`;
    return geo.lastUpdate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-md mx-auto px-2 sm:px-4 py-2">
      {/* Auth guard */}
      {!isAuthenticated && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-paw-primary/10 rounded-full flex items-center justify-center mb-4">
            <PawPrint className="w-8 h-8 text-paw-primary" />
          </div>
          <h2 className="font-headline text-xl font-bold text-paw-on-surface mb-2">
            Inicia sesión para reportar
          </h2>
          <p className="text-sm text-paw-on-surface-variant mb-5">
            Necesitas una cuenta para publicar alertas de mascotas perdidas o avistadas.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-paw-primary to-paw-primary-container hover:from-paw-on-primary-container hover:to-paw-primary transition-all shadow-md text-sm"
          >
            Iniciar Sesión
          </button>
        </div>
      )}

      {isAuthenticated && (
      <>
      {/* GPS Status Bar */}
      <div className={`mb-4 rounded-2xl p-3 transition-all duration-500 ${
        geo.lat
          ? 'bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200/60'
          : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Animated GPS indicator */}
            <div className="relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                geo.lat
                  ? 'bg-blue-100'
                  : 'bg-amber-100'
              }`}>
                {geo.loading ? (
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                ) : geo.lat ? (
                  <MapPinned className="w-4 h-4 text-blue-600" />
                ) : (
                  <Navigation className="w-4 h-4 text-amber-500" />
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {geo.loading
                  ? 'Obteniendo ubicación GPS...'
                  : geo.lat
                    ? 'Ubicación detectada'
                    : 'GPS Desactivado'}
              </p>
              {geo.lat && (
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-gray-500">
                    📍 {geo.address || `${geo.lat?.toFixed(4)}, ${geo.lng?.toFixed(4)}`}
                  </p>
                  {formatAccuracy(geo.accuracy) && (
                    <span className="text-[9px] px-1 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                      {formatAccuracy(geo.accuracy)}
                    </span>
                  )}
                  {timeSinceUpdate() && (
                    <span className="text-[9px] text-gray-400">
                      {timeSinceUpdate()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => geo.requestLocation()}
              disabled={geo.loading}
              className="p-1.5 rounded-full bg-white/60 hover:bg-white transition-colors disabled:opacity-50"
              title="Recargar ubicación"
            >
              <Crosshair className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-6">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step <= reportStep
                  ? 'bg-paw-primary text-white shadow-sm'
                  : 'bg-paw-surface-high text-paw-on-surface-variant'
              }`}
            >
              {step < reportStep ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-10 sm:w-14 h-0.5 mx-1 transition-colors duration-300 ${
                  step < reportStep ? 'bg-paw-primary' : 'bg-paw-outline-variant'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex items-center justify-between mb-5 px-2">
        {stepLabels.map((label, i) => (
          <span
            key={label}
            className={`text-[11px] font-medium transition-colors ${
              i + 1 <= reportStep ? 'text-paw-primary' : 'text-paw-on-surface-variant'
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={reportStep}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Step 1: Type */}
          {reportStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="font-headline text-xl font-bold text-paw-on-surface">
                  Estamos aquí para ayudarte
                </h2>
                <p className="text-sm text-paw-on-surface-variant mt-1">
                  Respira profundo. Hagamos que la comunidad busque.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setReportType('lost')}
                  className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                    reportType === 'lost'
                      ? 'border-paw-primary bg-paw-primary-fixed shadow-sm'
                      : 'border-paw-outline-variant bg-white hover:border-paw-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        reportType === 'lost'
                          ? 'bg-paw-primary/10'
                          : 'bg-paw-surface-high'
                      }`}
                    >
                      <Search
                        className={`w-6 h-6 ${
                          reportType === 'lost'
                            ? 'text-paw-primary'
                            : 'text-paw-on-surface-variant'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-paw-on-surface">
                        Perdí una mascota
                      </h3>
                      <p className="text-sm text-paw-on-surface-variant mt-0.5">
                        Crear una alerta de desaparición
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('sighted')}
                  className={`w-full p-5 rounded-2xl border-2 transition-all duration-200 text-left ${
                    reportType === 'sighted'
                      ? 'border-paw-secondary bg-paw-secondary/5 shadow-sm'
                      : 'border-paw-outline-variant bg-white hover:border-paw-secondary/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        reportType === 'sighted'
                          ? 'bg-paw-secondary/10'
                          : 'bg-paw-surface-high'
                      }`}
                    >
                      <Eye
                        className={`w-6 h-6 ${
                          reportType === 'sighted'
                            ? 'text-paw-secondary'
                            : 'text-paw-on-surface-variant'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-paw-on-surface">
                        Vi una mascota
                      </h3>
                      <p className="text-sm text-paw-on-surface-variant mt-0.5">
                        Informar sobre un animal suelto
                        {geo.lat && (
                          <span className="block text-[11px] text-paw-primary font-medium mt-1">
                            📍 Tu ubicación se capturará automáticamente
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full mt-4 bg-paw-primary text-white font-semibold py-3.5 rounded-xl hover:bg-paw-on-primary-container transition-colors flex items-center justify-center gap-2"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Details */}
          {reportStep === 2 && (
            <div className="space-y-5">
              <h2 className="font-headline text-xl font-bold text-paw-on-surface text-center">
                Cuéntanos sobre la mascota
              </h2>

              {/* Photo Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-paw-on-surface">
                    Foto
                  </label>
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={analyzePhoto}
                      disabled={analyzing}
                      className="flex items-center gap-1 px-2.5 py-1 bg-paw-tertiary-container/20 text-paw-tertiary text-[11px] font-bold rounded-full hover:bg-paw-tertiary-container/40 transition-colors disabled:opacity-50"
                    >
                      {analyzing ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {analyzing ? 'ANALIZANDO...' : 'ANALIZAR CON IA'}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-paw-outline-variant rounded-2xl overflow-hidden hover:border-paw-primary/50 hover:bg-paw-primary-fixed/30 transition-all"
                >
                  {form.photoUrl ? (
                    <div className="relative aspect-video">
                      <img
                        src={form.photoUrl}
                        alt="Foto mascota"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                        Cambiar foto
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <div className="w-14 h-14 bg-paw-surface-high rounded-full flex items-center justify-center">
                        <Camera className="w-7 h-7 text-paw-on-surface-variant" />
                      </div>
                      <p className="text-sm text-paw-on-surface-variant font-medium">
                        Toca para subir o tomar una foto
                      </p>
                      <p className="text-xs text-paw-outline">
                        Una toma clara de su cara funciona mejor
                      </p>
                    </div>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Species */}
              <div>
                <label className="block text-sm font-medium text-paw-on-surface mb-1.5">
                  Tipo de mascota
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {speciesOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = form.species === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, species: opt.value }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-paw-primary bg-paw-primary-fixed'
                            : 'border-paw-outline-variant bg-white hover:border-paw-primary/30'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${isSelected ? 'text-paw-primary' : 'text-paw-on-surface-variant'}`}
                        />
                        <span
                          className={`text-xs font-medium ${isSelected ? 'text-paw-primary' : 'text-paw-on-surface-variant'}`}
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pet Name */}
              <div>
                <label className="block text-sm font-medium text-paw-on-surface mb-1.5">
                  Nombre de la mascota
                </label>
                <input
                  type="text"
                  value={form.petName}
                  onChange={(e) => setForm((f) => ({ ...f, petName: e.target.value }))}
                  placeholder={reportType === 'lost' ? '¿Cómo lo llamas?' : 'Nombre si lo sabes'}
                  className="w-full px-4 py-3 rounded-xl border border-paw-outline-variant bg-white text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:border-paw-primary focus:ring-2 focus:ring-paw-primary/10 transition-all"
                />
              </div>

              {/* Breed */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-paw-on-surface mb-1.5">
                  Raza
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-paw-tertiary-container/20 text-paw-tertiary text-[10px] font-bold rounded-full">
                    <Sparkles className="w-2.5 h-2.5" />
                    IA
                  </span>
                </label>
                <input
                  type="text"
                  value={form.breed}
                  onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))}
                  placeholder="Ej: Golden Retriever"
                  className="w-full px-4 py-3 rounded-xl border border-paw-outline-variant bg-white text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:border-paw-primary focus:ring-2 focus:ring-paw-primary/10 transition-all"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-paw-on-surface mb-1.5">
                  Color principal
                </label>
                <select
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-paw-outline-variant bg-white text-paw-on-surface focus:outline-none focus:border-paw-primary focus:ring-2 focus:ring-paw-primary/10 transition-all appearance-none"
                >
                  <option value="">Seleccionar color...</option>
                  {colorOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unique Marks */}
              <div>
                <label className="block text-sm font-medium text-paw-on-surface mb-1.5">
                  Señas particulares
                </label>
                <textarea
                  value={form.uniqueMarks}
                  onChange={(e) => setForm((f) => ({ ...f, uniqueMarks: e.target.value }))}
                  placeholder="Cicatrices, collares, manchas, tamaño..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-paw-outline-variant bg-white text-paw-on-surface placeholder:text-paw-outline focus:outline-none focus:border-paw-primary focus:ring-2 focus:ring-paw-primary/10 transition-all resize-none"
                />
              </div>

              {/* Location with enhanced GPS */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-paw-on-surface mb-1.5">
                  <MapPin className="w-4 h-4 text-paw-secondary" />
                  Ubicación
                  {reportType === 'sighted' && geo.lat && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-detectada
                    </span>
                  )}
                </label>
                <div className="rounded-xl overflow-hidden border border-paw-outline-variant">
                  <div className="relative bg-paw-surface-high p-4 flex items-center justify-center min-h-[100px]">
                    {geo.loading ? (
                      <div className="flex flex-col items-center gap-2 text-paw-on-surface-variant">
                        <div className="relative">
                          <Loader2 className="w-8 h-8 animate-spin text-paw-primary" />
                          <MapPin className="w-3 h-3 text-paw-primary absolute -bottom-1 left-1/2 -translate-x-1/2" />
                        </div>
                        <span className="text-sm font-medium">Detectando ubicación GPS...</span>
                      </div>
                    ) : geo.lat ? (
                      <div className="text-center">
                        <div className="relative inline-block">
                          <div className="w-12 h-12 bg-paw-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <MapPin className="w-6 h-6 text-paw-primary" />
                          </div>
                        </div>
                        <p className="text-xs text-paw-primary font-semibold">
                          📍 Ubicación capturada
                        </p>
                        <p className="text-[11px] text-paw-on-surface-variant mt-1 max-w-[200px] mx-auto">
                          {geo.address}
                        </p>
                        {geo.accuracy && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            Precisión: ±{Math.round(geo.accuracy)}m
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-paw-outline mx-auto mb-2" />
                        <p className="text-xs text-paw-on-surface-variant">
                          {geo.error || 'Ubicación no disponible'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            geo.requestLocation();
                            geo.startWatching();
                          }}
                          className="mt-2 text-xs text-paw-primary font-semibold"
                        >
                          Activar GPS
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2.5 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-paw-primary shrink-0" />
                        <span className="text-sm text-paw-on-surface truncate">
                        {geo.address || (geo.lat !== null && geo.lng !== null
                          ? `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`
                          : 'La Paz, Bolivia (default)')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {geo.watching && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => geo.requestLocation()}
                        disabled={geo.loading}
                        className="flex items-center gap-1 text-paw-secondary font-bold text-xs shrink-0 disabled:opacity-50"
                      >
                        {geo.loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Crosshair className="w-3 h-3" />
                        )}
                        GPS
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 rounded-xl border border-paw-outline-variant text-paw-on-surface-variant font-semibold hover:bg-paw-surface-high transition-colors flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-3 rounded-xl bg-paw-primary text-white font-semibold hover:bg-paw-on-primary-container transition-colors flex items-center justify-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Publish */}
          {reportStep === 3 && (
            <div className="space-y-5">
              <h2 className="font-headline text-xl font-bold text-paw-on-surface text-center">
                Revisa tu alerta
              </h2>

              {/* Summary Card */}
              <div className="bg-white rounded-2xl overflow-hidden border border-paw-outline-variant shadow-sm">
                {/* Photo */}
                <div className="aspect-video bg-paw-surface-high relative">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PawPrint className="w-12 h-12 text-paw-outline-variant" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        reportType === 'lost'
                          ? 'bg-paw-primary text-white'
                          : 'bg-paw-secondary text-white'
                      }`}
                    >
                      {reportType === 'lost' ? 'PERDIDO' : 'AVISTADO'}
                    </span>
                  </div>
                  {selectedSpecies && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5">
                      <selectedSpecies.icon className="w-4 h-4 text-paw-primary" />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="font-headline text-xl font-bold text-paw-on-surface">
                    {form.petName || 'Sin nombre'}
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5 text-sm">
                    <div className="bg-paw-surface-low rounded-xl p-2.5">
                      <p className="text-paw-on-surface-variant text-[11px] uppercase tracking-wider">Especie</p>
                      <p className="font-medium text-paw-on-surface mt-0.5">
                        {selectedSpecies?.label || 'Perro'}
                      </p>
                    </div>
                    <div className="bg-paw-surface-low rounded-xl p-2.5">
                      <p className="text-paw-on-surface-variant text-[11px] uppercase tracking-wider">Raza</p>
                      <p className="font-medium text-paw-on-surface mt-0.5">
                        {form.breed || 'No especificada'}
                      </p>
                    </div>
                    <div className="bg-paw-surface-low rounded-xl p-2.5">
                      <p className="text-paw-on-surface-variant text-[11px] uppercase tracking-wider">Color</p>
                      <p className="font-medium text-paw-on-surface mt-0.5">
                        {form.color || 'No especificado'}
                      </p>
                    </div>
                    <div className="bg-paw-surface-low rounded-xl p-2.5">
                      <p className="text-paw-on-surface-variant text-[11px] uppercase tracking-wider">Señas</p>
                      <p className="font-medium text-paw-on-surface mt-0.5 line-clamp-1">
                        {form.uniqueMarks || 'Ninguna'}
                      </p>
                    </div>
                  </div>

                  {/* Location summary with GPS status */}
                  <div className="flex items-start gap-2 pt-2 border-t border-paw-outline-variant/50">
                    <div className="relative mt-0.5">
                      <MapPin className="w-4 h-4 text-paw-secondary" />
                      {geo.watching && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-paw-on-surface font-medium">
                        {geo.address || (geo.lat !== null && geo.lng !== null
                          ? `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}`
                          : 'La Paz, Bolivia')}
                      </p>
                      {geo.lat && (
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-paw-on-surface-variant">
                            {geo.lat.toFixed(4)}, {geo.lng?.toFixed(4)}
                          </p>
                          {geo.watching && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                              GPS ACTIVO
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => geo.requestLocation()}
                      className="p-1.5 rounded-lg bg-paw-surface-high hover:bg-paw-surface-highest transition-colors"
                      title="Actualizar ubicación"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-paw-on-surface-variant" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-br from-paw-primary to-paw-primary-container hover:from-paw-on-primary-container hover:to-paw-primary transition-all shadow-lg shadow-paw-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    Publicar Alerta
                    <span className="text-xl">🚨</span>
                  </>
                )}
              </button>

              {/* Info */}
              <div className="flex items-start gap-2 bg-paw-primary-fixed/50 rounded-xl p-3">
                <Info className="w-4 h-4 text-paw-primary mt-0.5 shrink-0" />
                <p className="text-xs text-paw-on-surface-variant leading-relaxed">
                  Al publicar, notificaremos inmediatamente a personas cercanas para que
                  puedan ayudarte a encontrar a tu mascota.
                  {!notifications.canNotify && ' Activa las notificaciones para recibir alertas en tiempo real.'}
                </p>
              </div>

              {/* Notification permission */}
              {!notifications.canNotify && notifications.supported && (
                <button
                  type="button"
                  onClick={() => notifications.requestPermission()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-paw-secondary/30 text-paw-secondary text-sm font-medium hover:bg-paw-secondary/5 transition-colors"
                >
                  🔔 Activar notificaciones
                </button>
              )}

              {/* Navigation */}
              <button
                type="button"
                onClick={prevStep}
                className="w-full py-3 rounded-xl border border-paw-outline-variant text-paw-on-surface-variant font-semibold hover:bg-paw-surface-high transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Anterior
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      </>
      )}
    </div>
  );
}
