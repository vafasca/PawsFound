'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Bell, Shield, Globe, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

type SettingsSection = 'notifications' | 'privacy' | 'language' | null;

interface SettingsModalsProps {
  activeSection: SettingsSection;
  onClose: () => void;
}

const languages = [
  { value: 'es', label: 'Español', flag: '🇧🇴' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
];

export default function SettingsModals({ activeSection, onClose }: SettingsModalsProps) {
  const { user, refreshUser } = useAuth();

  if (!activeSection || !user) return null;

  const config: Record<string, { title: string; icon: React.ElementType }> = {
    notifications: { title: 'Notificaciones', icon: Bell },
    privacy: { title: 'Privacidad', icon: Shield },
    language: { title: 'Idioma', icon: Globe },
  };

  const cfg = config[activeSection];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <Dialog open={!!activeSection} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl p-6">
        <DialogTitle className="sr-only">{cfg.title}</DialogTitle>
        <DialogDescription className="sr-only">Configuración de {cfg.title.toLowerCase()}</DialogDescription>

        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-paw-primary/10 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5 text-paw-primary" />
            </div>
            <h2 className="font-headline text-lg font-bold text-paw-on-surface">
              {cfg.title}
            </h2>
          </div>
        </DialogHeader>

        {activeSection === 'notifications' && (
          <NotificationSettings user={user} refreshUser={refreshUser} />
        )}
        {activeSection === 'privacy' && (
          <PrivacySettings user={user} refreshUser={refreshUser} />
        )}
        {activeSection === 'language' && (
          <LanguageSettings user={user} refreshUser={refreshUser} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NotificationSettings({ user, refreshUser }: { user: Record<string, unknown>; refreshUser: () => Promise<void> }) {
  const [pushEnabled, setPushEnabled] = useState(user.pushEnabled ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pushEnabled }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      toast.success('Preferencias guardadas');
      refreshUser();
    } catch {
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 mt-2">
      <ToggleItem
        label="Notificaciones push"
        checked={pushEnabled}
        onChange={setPushEnabled}
      />
      <ToggleItem
        label="Alertas de mascotas perdidas cercanas"
        checked={pushEnabled}
        onChange={setPushEnabled}
      />
      <ToggleItem
        label="Nuevos avistamientos en mis reportes"
        checked={pushEnabled}
        onChange={setPushEnabled}
      />
      <ToggleItem
        label="Comentarios en mis reportes"
        checked={pushEnabled}
        onChange={setPushEnabled}
      />
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-paw-primary to-paw-primary-container disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar'}
      </button>
    </div>
  );
}

function PrivacySettings({ user, refreshUser }: { user: Record<string, unknown>; refreshUser: () => Promise<void> }) {
  const [profileVisible, setProfileVisible] = useState(user.profileVisible ?? true);
  const [locationSharing, setLocationSharing] = useState(user.locationSharing ?? false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileVisible, locationSharing }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      toast.success('Preferencias de privacidad guardadas');
      refreshUser();
    } catch {
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 mt-2">
      <ToggleItem
        label="Perfil visible para otros"
        checked={profileVisible}
        onChange={setProfileVisible}
      />
      <ToggleItem
        label="Compartir ubicación"
        checked={locationSharing}
        onChange={setLocationSharing}
      />
      <ToggleItem
        label="Mostrar email públicamente"
        checked={profileVisible}
        onChange={setProfileVisible}
      />
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-paw-primary to-paw-primary-container disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar'}
      </button>
    </div>
  );
}

function LanguageSettings({ user, refreshUser }: { user: Record<string, unknown>; refreshUser: () => Promise<void> }) {
  const [locale, setLocale] = useState((user.locale as string) || 'es');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      toast.success('Idioma cambiado');
      refreshUser();
    } catch {
      toast.error('Error al cambiar idioma');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 mt-2">
      {languages.map((lang) => (
        <button
          key={lang.value}
          onClick={() => setLocale(lang.value)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
            locale === lang.value
              ? 'border-paw-primary bg-paw-primary-fixed'
              : 'border-paw-outline-variant bg-white hover:border-paw-primary/30'
          }`}
        >
          <span className="text-xl">{lang.flag}</span>
          <span className={`text-sm font-medium ${locale === lang.value ? 'text-paw-primary' : 'text-paw-on-surface'}`}>
            {lang.label}
          </span>
          {locale === lang.value && (
            <span className="ml-auto w-5 h-5 bg-paw-primary text-white rounded-full flex items-center justify-center text-xs">✓</span>
          )}
        </button>
      ))}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-full font-semibold text-white bg-gradient-to-r from-paw-primary to-paw-primary-container disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-4"
      >
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Guardar'}
      </button>
    </div>
  );
}

function ToggleItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-paw-on-surface">{label}</span>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-paw-primary"
      />
    </div>
  );
}
