'use client';

import { useEffect, useState } from 'react';
import {
  X, Users, FileText, BarChart3, Search, Loader2,
  Shield, PawPrint, MessageCircle, Eye, Trash2, CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  city: string | null;
  _count: {
    pets: number;
    reports: number;
    comments: number;
  };
}

interface AdminReport {
  id: string;
  type: string;
  petName: string;
  status: string;
  createdAt: string;
  reporter: { name: string };
}

interface StatsData {
  totalReports: number;
  activeReports: number;
  totalPets: number;
  totalUsers: number;
  totalSightings: number;
  totalComments: number;
  totalChats: number;
}

type AdminTab = 'users' | 'reports' | 'stats';

export default function AdminDashboard() {
  const showAdmin = useAppStore((s) => s.showAdmin);
  const setShowAdmin = useAppStore((s) => s.setShowAdmin);
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!showAdmin) return;
    Promise.all([
      fetch('/api/auth/admin/users').then((r) => r.json()),
      fetch('/api/reports').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ])
      .then(([usersData, reportsData, statsData]) => {
        setUsers(usersData.users || []);
        setReports(reportsData.reports || []);
        setStats(statsData);
      })
      .catch(() => {
        toast.error('Error al cargar datos');
      })
      .finally(() => setLoading(false));
  }, [showAdmin]);

  const changeRole = async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/auth/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
        toast.success('Rol actualizado');
      }
    } catch {
      toast.error('Error al actualizar rol');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!showAdmin) return null;

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'reports', label: 'Reportes', icon: FileText },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  ];

  const statusLabel = (s: string) => {
    switch (s) {
      case 'active': return 'Activo';
      case 'found': return 'Encontrado';
      case 'closed': return 'Cerrado';
      default: return s;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-paw-primary text-white';
      case 'found': return 'bg-paw-tertiary text-white';
      case 'closed': return 'bg-paw-outline text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const roleColor = (r: string) => {
    switch (r) {
      case 'ADMIN': return 'bg-gradient-to-br from-paw-primary to-paw-primary-container text-white';
      case 'SHELTER': return 'bg-paw-secondary text-white';
      default: return 'bg-paw-surface-highest text-paw-on-surface-variant';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return 'hace un momento';
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-paw-bg overflow-auto">
      {/* Header with glass */}
      <div className="sticky top-0 z-10 glass shadow-ambient">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-paw-secondary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-paw-secondary" />
            </div>
            <div>
              <h1 className="font-headline text-lg font-bold text-paw-on-surface">
                Panel de Administración
              </h1>
              <p className="text-[11px] text-paw-on-surface-variant">Gestión de la plataforma</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdmin(false)}
            className="p-2 rounded-xl hover:bg-paw-surface-high transition-glass"
          >
            <X className="w-5 h-5 text-paw-on-surface-variant" />
          </button>
        </div>

        {/* Tabs — underline style */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'text-paw-secondary'
                    : 'text-paw-on-surface-variant hover:text-paw-on-surface'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-paw-secondary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-paw-secondary animate-spin" />
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="relative rounded-xl ghost-border ghost-border-focus">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-paw-outline" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar usuarios..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-paw-surface-highest text-sm text-paw-on-surface placeholder:text-paw-outline focus:outline-none border-0"
                  />
                </div>
                <div className="bg-paw-surface-low rounded-2xl shadow-ambient overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-paw-on-surface-variant text-xs">Usuario</th>
                          <th className="text-left px-4 py-3 font-semibold text-paw-on-surface-variant text-xs">Rol</th>
                          <th className="text-left px-4 py-3 font-semibold text-paw-on-surface-variant text-xs hidden sm:table-cell">Ciudad</th>
                          <th className="text-center px-4 py-3 font-semibold text-paw-on-surface-variant text-xs hidden sm:table-cell">Mascotas</th>
                          <th className="text-center px-4 py-3 font-semibold text-paw-on-surface-variant text-xs hidden sm:table-cell">Reportes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u, idx) => (
                          <tr
                            key={u.id}
                            className={`hover:bg-paw-surface-high/50 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/40'}`}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-paw-on-surface">{u.name}</p>
                                <p className="text-xs text-paw-on-surface-variant">{u.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={u.role}
                                onChange={(e) => changeRole(u.id, e.target.value)}
                                className={`text-xs font-bold px-2 py-1 rounded-full border-0 cursor-pointer appearance-none text-center ${roleColor(u.role)}`}
                              >
                                <option value="USER">USER</option>
                                <option value="SHELTER">SHELTER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-paw-on-surface-variant hidden sm:table-cell">
                              {u.city || '-'}
                            </td>
                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                              <span className="font-medium text-paw-on-surface">{u._count.pets}</span>
                            </td>
                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                              <span className="font-medium text-paw-on-surface">{u._count.reports}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {tab === 'reports' && (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="bg-paw-surface-low rounded-2xl p-4 shadow-ambient flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-paw-on-surface truncate">{r.petName}</p>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusColor(r.status)}`}>
                          {statusLabel(r.status)}
                        </span>
                        <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${r.type === 'lost' ? 'bg-paw-primary/10 text-paw-primary' : 'bg-paw-secondary/10 text-paw-secondary'}`}>
                          {r.type === 'lost' ? 'Perdido' : 'Avistado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-paw-on-surface-variant">
                        <span>Por {r.reporter?.name || 'Anónimo'}</span>
                        <span>{getTimeAgo(r.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {r.status === 'active' && (
                        <button
                          onClick={() => {
                            toast.info('Función próximamente');
                          }}
                          className="p-1.5 rounded-xl hover:bg-paw-tertiary/10 text-paw-tertiary transition-glass"
                          title="Marcar encontrado"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          toast.info('Función próximamente');
                        }}
                        className="p-1.5 rounded-xl hover:bg-paw-error/10 text-paw-error transition-glass"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats Tab */}
            {tab === 'stats' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard icon={<Users className="w-6 h-6 text-paw-secondary" />} label="Usuarios" value={stats.totalUsers} />
                  <StatCard icon={<FileText className="w-6 h-6 text-paw-primary" />} label="Reportes" value={stats.totalReports} />
                  <StatCard icon={<PawPrint className="w-6 h-6 text-paw-tertiary" />} label="Mascotas" value={stats.totalPets} />
                  <StatCard icon={<Eye className="w-6 h-6 text-paw-primary-container" />} label="Avistamientos" value={stats.totalSightings} />
                  <StatCard icon={<MessageCircle className="w-6 h-6 text-paw-secondary" />} label="Chats" value={stats.totalChats} />
                  <StatCard icon={<MessageCircle className="w-6 h-6 text-paw-on-surface-variant" />} label="Comentarios" value={stats.totalComments} />
                </div>

                {/* Growth placeholder */}
                <div className="bg-paw-surface-low rounded-2xl p-6 shadow-ambient">
                  <h3 className="font-headline text-base font-bold text-paw-on-surface mb-4">
                    Crecimiento de usuarios
                  </h3>
                  <div className="h-40 bg-paw-surface-low rounded-xl flex items-center justify-center">
                    <p className="text-sm text-paw-on-surface-variant">
                      Gráfico de crecimiento próximamente 📊
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-paw-surface-low rounded-2xl p-4 shadow-ambient">
      <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center mb-2">
        {icon}
      </div>
      <p className="font-headline text-2xl font-bold text-paw-on-surface">{value}</p>
      <p className="text-xs text-paw-on-surface-variant font-medium">{label}</p>
    </div>
  );
}
