'use client';

import { useEffect, useState } from 'react';
import {
  User, MapPin, PawPrint, FileText, Heart, Settings, Bell,
  Shield, Globe, LogOut, Plus, ChevronRight, Loader2,
  MessageCircle, ShieldAlert,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import BadgesDisplay from './BadgesDisplay';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  phone: string | null;
  city: string | null;
  bio: string | null;
  _count: {
    pets: number;
    reports: number;
    comments: number;
  };
  pets: UserPet[];
  reports: UserReport[];
}

interface UserPet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  photoUrl: string | null;
}

interface UserReport {
  id: string;
  type: string;
  petName: string;
  status: string;
  createdAt: string;
  photoUrl: string | null;
}

const speciesLabel: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  other: 'Otro',
};

export default function ProfileView() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user: authUser, isAuthenticated, logout, loading: authLoading } = useAuth();
  const setShowAuth = useAppStore((s) => s.setShowAuth);
  const setShowSettings = useAppStore((s) => s.setShowSettings);
  const setShowChat = useAppStore((s) => s.setShowChat);
  const setShowAdmin = useAppStore((s) => s.setShowAdmin);
  const setShowAddPet = useAppStore((s) => s.setShowAddPet);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  useEffect(() => {
    if (!isAuthenticated || !authUser?.id) return;

    fetch(`/api/users?id=${authUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        const userData = Array.isArray(data) ? null : (data?.user || data);
        setUser(userData);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authUser?.id, refreshKey]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-paw-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="w-12 h-12 text-paw-outline mb-3" />
        <p className="text-paw-on-surface-variant mb-4">Inicia sesión para ver tu perfil</p>
        <button
          onClick={() => setShowAuth(true)}
          className="px-6 py-2.5 rounded-full font-semibold text-white bg-gradient-to-br from-paw-primary to-paw-primary-container text-sm shadow-ambient"
        >
          Iniciar Sesión
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-paw-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="w-12 h-12 text-paw-outline mb-3" />
        <p className="text-paw-on-surface-variant">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const roleBadgeGradient = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-gradient-to-br from-paw-primary to-paw-primary-container text-white';
      case 'SHELTER': return 'bg-gradient-to-br from-paw-secondary to-paw-secondary-container text-white';
      default: return 'bg-paw-surface-highest text-paw-on-surface-variant';
    }
  };

  const roleBadgeLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'SHELTER': return 'Refugio';
      default: return 'Usuario';
    }
  };

  const settingsItems = [
    { icon: Bell, label: 'Notificaciones', color: 'text-paw-primary', action: () => setShowSettings('notifications') },
    { icon: Shield, label: 'Privacidad', color: 'text-paw-secondary', action: () => setShowSettings('privacy') },
    { icon: Globe, label: 'Idioma', color: 'text-paw-tertiary', action: () => setShowSettings('language') },
    { icon: MessageCircle, label: 'Chat', color: 'text-paw-primary', action: () => { setShowChat(true); } },
  ];

  if (user.role === 'ADMIN') {
    settingsItems.push({
      icon: ShieldAlert,
      label: 'Panel de Admin',
      color: 'text-paw-secondary',
      action: () => setShowAdmin(true),
    });
  }

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada');
    setActiveTab('home');
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Profile Header — larger avatar with gradient border */}
      <div className="bg-paw-surface-low rounded-2xl p-5 flex items-center gap-4 shadow-ambient">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-paw-primary to-paw-primary-container p-[3px]">
            <div className="w-full h-full bg-paw-surface-low rounded-full flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-paw-on-surface-variant" />
              )}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-headline text-xl font-bold text-paw-on-surface truncate">
              {user.name}
            </h2>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${roleBadgeGradient(user.role)}`}>
              {roleBadgeLabel(user.role)}
            </span>
          </div>
          <p className="text-sm text-paw-on-surface-variant truncate mt-0.5">{user.email}</p>
          {user.city && (
            <div className="flex items-center gap-1 text-xs text-paw-on-surface-variant mt-1">
              <MapPin className="w-3 h-3" />
              <span>{user.city}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats — tonal cards, no borders */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paw-surface-low rounded-2xl p-3 text-center shadow-ambient">
          <PawPrint className="w-5 h-5 text-paw-primary mx-auto mb-1" />
          <p className="font-headline text-lg font-bold text-paw-on-surface">
            {user._count?.pets ?? 0}
          </p>
          <p className="text-[10px] text-paw-on-surface-variant font-medium">
            Registradas
          </p>
        </div>
        <div className="bg-paw-surface-low rounded-2xl p-3 text-center shadow-ambient">
          <FileText className="w-5 h-5 text-paw-secondary mx-auto mb-1" />
          <p className="font-headline text-lg font-bold text-paw-on-surface">
            {user._count?.reports ?? 0}
          </p>
          <p className="text-[10px] text-paw-on-surface-variant font-medium">Reportes</p>
        </div>
        <div className="bg-paw-surface-low rounded-2xl p-3 text-center shadow-ambient">
          <Heart className="w-5 h-5 text-paw-tertiary mx-auto mb-1" />
          <p className="font-headline text-lg font-bold text-paw-on-surface">
            {user._count?.comments ?? 0}
          </p>
          <p className="text-[10px] text-paw-on-surface-variant font-medium">Ayudados</p>
        </div>
      </div>

      {/* Mis Mascotas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-base font-bold text-paw-on-surface">
            Mis Mascotas
          </h3>
          <button
            onClick={() => setShowAddPet(true)}
            className="flex items-center gap-1 text-sm text-paw-primary font-semibold"
          >
            <Plus className="w-4 h-4" />
            Registrar
          </button>
        </div>

        {user.pets && user.pets.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {user.pets.map((pet) => (
              <div
                key={pet.id}
                className="shrink-0 w-36 bg-white rounded-2xl shadow-ambient overflow-hidden"
              >
                <div className="aspect-square bg-paw-surface-high">
                  {pet.photoUrl ? (
                    <img
                      src={pet.photoUrl}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PawPrint className="w-8 h-8 text-paw-outline-variant" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm text-paw-on-surface truncate">
                    {pet.name}
                  </p>
                  <p className="text-xs text-paw-on-surface-variant truncate">
                    {pet.breed || speciesLabel[pet.species] || pet.species}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-paw-surface-high rounded-full text-[10px] font-medium text-paw-on-surface-variant">
                    {speciesLabel[pet.species] || pet.species}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-paw-surface-low rounded-2xl p-6 text-center">
            <PawPrint className="w-8 h-8 text-paw-outline mx-auto mb-2" />
            <p className="text-sm text-paw-on-surface-variant">
              Aún no tienes mascotas registradas
            </p>
          </div>
        )}
      </div>

      {/* Mis Reportes */}
      <div className="space-y-3">
        <h3 className="font-headline text-base font-bold text-paw-on-surface">
          Mis Reportes
        </h3>

        {user.reports && user.reports.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
            {user.reports.map((report) => {
              const statusLabel =
                report.status === 'found'
                  ? 'Encontrado'
                  : report.status === 'active'
                    ? 'Activo'
                    : 'Cerrado';
              const statusColor =
                report.status === 'found'
                  ? 'bg-paw-tertiary'
                  : report.type === 'lost'
                    ? 'bg-paw-primary'
                    : 'bg-paw-secondary';

              return (
                <div
                  key={report.id}
                  className="flex items-center gap-3 bg-paw-surface-low rounded-xl p-3 shadow-ambient"
                >
                  <div className="w-12 h-12 bg-white rounded-xl shrink-0 overflow-hidden">
                    {report.photoUrl ? (
                      <img
                        src={report.photoUrl}
                        alt={report.petName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-paw-outline-variant" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-paw-on-surface truncate">
                      {report.petName}
                    </p>
                    <p className="text-xs text-paw-on-surface-variant">
                      {report.type === 'lost' ? 'Perdido' : 'Avistado'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-paw-surface-low rounded-2xl p-6 text-center">
            <FileText className="w-8 h-8 text-paw-outline mx-auto mb-2" />
            <p className="text-sm text-paw-on-surface-variant">
              Aún no tienes reportes
            </p>
          </div>
        )}
      </div>

      {/* Mis Insignias */}
      <div className="space-y-3">
        <h3 className="font-headline text-base font-bold text-paw-on-surface">
          Mis Insignias
        </h3>
        <BadgesDisplay />
      </div>

      {/* Settings — ghost-border instead of divider lines */}
      <div className="space-y-3">
        <h3 className="font-headline text-base font-bold text-paw-on-surface">
          Configuración
        </h3>
        <div className="bg-paw-surface-low rounded-2xl shadow-ambient overflow-hidden space-y-1">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-white/60 transition-glass"
              >
                <Icon className={`w-5 h-5 ${item.color}`} />
                <span className="text-sm text-paw-on-surface flex-1 text-left">
                  {item.label}
                </span>
                <ChevronRight className="w-4 h-4 text-paw-outline" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Logout — tonal instead of bordered */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-paw-error/5 text-paw-error font-medium hover:bg-paw-error/10 transition-glass"
      >
        <LogOut className="w-4 h-4" />
        Cerrar Sesión
      </button>
    </div>
  );
}
