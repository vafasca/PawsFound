'use client';

import { useState, useEffect } from 'react';
import { PawPrint, Loader2, Mail, Lock, User, Eye, EyeOff, MapPin, Navigation } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { useGeolocation } from '@/hooks/use-geolocation';
import { toast } from 'sonner';

export default function AuthModal() {
  const showAuth = useAppStore((s) => s.showAuth);
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const { login, register } = useAuth();
  const geo = useGeolocation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoCity, setAutoCity] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // Auto-detect location when opening register mode
  useEffect(() => {
    if (showAuth && mode === 'register') {
      geo.requestLocation();
    }
  }, [showAuth, mode]);

  // Track address changes from GPS
  useEffect(() => {
    if (geo.address && mode === 'register') {
      setAutoCity(geo.address);
    }
  }, [geo.address, mode]);

  const resetForms = () => {
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ name: '', email: '', password: '', confirmPassword: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAutoCity('');
  };

  const handleClose = () => {
    setShowAuth(false);
    setTimeout(resetForms, 300);
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForms();
    if (newMode === 'register') {
      geo.requestLocation();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('Completa todos los campos');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginForm.email)) {
      toast.error('Ingresa un email válido');
      return;
    }
    setSubmitting(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('¡Bienvenido de vuelta! 🐾');
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.confirmPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      toast.error('Ingresa un email válido');
      return;
    }
    if (registerForm.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSubmitting(true);
    try {
      await register(
        registerForm.name,
        registerForm.email,
        registerForm.password,
        autoCity || undefined,
        geo.lat ?? undefined,
        geo.lng ?? undefined
      );
      toast.success('¡Cuenta creada con éxito! 🎉');
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrarse';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!showAuth) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay with warm gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-paw-primary/10 via-paw-on-surface/50 to-paw-on-surface/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card with glassmorphism */}
      <div className="relative w-full max-w-sm glass rounded-3xl shadow-ambient-lg p-6 animate-modal-entrance paw-pattern overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Logo with gradient glow */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-paw-primary/20 to-paw-primary-container/20 rounded-2xl blur-xl scale-125" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-paw-primary to-paw-primary-container rounded-2xl flex items-center justify-center shadow-ambient-lg">
              <PawPrint className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="font-headline text-xl font-bold text-paw-on-surface">
            PawsFound
          </h2>
          <p className="text-xs text-paw-on-surface-variant mt-0.5">
            {mode === 'login'
              ? 'Inicia sesión para continuar'
              : 'Crea tu cuenta'}
          </p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="relative rounded-xl ghost-border ghost-border-focus">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-outline" />
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-paw-surface-highest text-paw-on-surface placeholder:text-paw-outline focus:outline-none transition-all text-sm border-0"
              />
            </div>

            {/* Password */}
            <div className="relative rounded-xl ghost-border ghost-border-focus">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-outline" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Contraseña"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-paw-surface-highest text-paw-on-surface placeholder:text-paw-outline focus:outline-none transition-all text-sm border-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-paw-outline hover:text-paw-on-surface-variant"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-br from-paw-primary to-paw-primary-container hover:opacity-90 transition-all shadow-ambient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            {/* Name */}
            <div className="relative rounded-xl ghost-border ghost-border-focus">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-outline" />
              <input
                type="text"
                value={registerForm.name}
                onChange={(e) => setRegisterForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nombre completo"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-paw-surface-highest text-paw-on-surface placeholder:text-paw-outline focus:outline-none transition-all text-sm border-0"
              />
            </div>

            {/* Email */}
            <div className="relative rounded-xl ghost-border ghost-border-focus">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-outline" />
              <input
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-paw-surface-highest text-paw-on-surface placeholder:text-paw-outline focus:outline-none transition-all text-sm border-0"
              />
            </div>

            {/* GPS Location auto-detect */}
            <div className="relative rounded-xl overflow-hidden border border-paw-outline/50">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-primary z-10" />
              <div className="w-full pl-10 pr-10 py-3 bg-paw-surface-highest text-sm">
                {geo.loading ? (
                  <span className="text-paw-on-surface-variant flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Detectando ubicación...
                  </span>
                ) : autoCity ? (
                  <span className="text-paw-on-surface">
                    📍 {autoCity}
                  </span>
                ) : (
                  <span className="text-paw-outline">
                    Ciudad (se detecta automáticamente)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => geo.requestLocation()}
                disabled={geo.loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-paw-primary/10 text-paw-primary hover:bg-paw-primary/20 transition-colors disabled:opacity-50"
                title="Detectar ubicación"
              >
                <Navigation className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Password */}
            <div className="relative rounded-xl ghost-border ghost-border-focus">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-outline" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={registerForm.password}
                onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Contraseña (mín. 6 caracteres)"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-paw-surface-highest text-paw-on-surface placeholder:text-paw-outline focus:outline-none transition-all text-sm border-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-paw-outline hover:text-paw-on-surface-variant"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative rounded-xl ghost-border ghost-border-focus">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-outline" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Confirmar contraseña"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-paw-surface-highest text-paw-on-surface placeholder:text-paw-outline focus:outline-none transition-all text-sm border-0"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-paw-outline hover:text-paw-on-surface-variant"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-br from-paw-primary to-paw-primary-container hover:opacity-90 transition-all shadow-ambient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>
        )}

        {/* Toggle — no border line, tonal shift instead */}
        <div className="mt-5 pt-4 bg-paw-surface-low/40 rounded-2xl -mx-2 px-4 text-center">
          <p className="text-sm text-paw-on-surface-variant">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="ml-1 font-semibold gradient-text hover:opacity-80 transition-opacity"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-3 bg-paw-surface-low rounded-xl p-3 text-center">
          <p className="text-[11px] text-paw-on-surface-variant">
            Demo: <span className="font-mono font-medium text-paw-on-surface">admin@pawsfound.com</span> / <span className="font-mono font-medium text-paw-on-surface">admin123</span>
          </p>
        </div>

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-paw-surface-high/80 flex items-center justify-center text-paw-on-surface-variant hover:bg-paw-surface-highest transition-colors backdrop-blur-sm"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>
    </div>
  );
}
