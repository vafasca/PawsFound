'use client';

import { useEffect, useState, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppStore } from '@/store/app-store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationPanel() {
  const notifications = useAppStore((s) => s.notifications);
  const setNotifications = useAppStore((s) => s.setNotifications);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setSelectedReport = useAppStore((s) => s.setSelectedReport);
  const setShowDetail = useAppStore((s) => s.setShowDetail);
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        setItems(notifs);
        const unread = notifs.filter((n: Notification) => !n.read).length;
        setNotifications(unread);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, setNotifications]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setNotifications((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (res.ok) {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setNotifications(0);
        toast.success('Todas las notificaciones marcadas como leídas');
      }
    } catch {
      toast.error('Error al marcar notificaciones');
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return 'hace un momento';
    }
  };

  const notifIcon = (type: string) => {
    switch (type) {
      case 'sighting':
        return '👁️';
      case 'comment':
        return '💬';
      case 'badge':
        return '🏆';
      case 'report':
        return '🚨';
      case 'system':
        return '📢';
      default:
        return '🔔';
    }
  };

  const openNotificationTarget = (notif: Notification) => {
    const reportId = notif.data?.split(':')?.[0];
    if (!reportId) return;
    setActiveTab('home');
    setSelectedReport(reportId);
    setShowDetail(true);
    setOpen(false);
  };

  if (!isAuthenticated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl text-paw-on-surface-variant hover:bg-paw-surface-high transition-colors">
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-paw-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-ambient community-pulse">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 rounded-2xl" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-paw-outline-variant/30">
          <h3 className="font-headline text-sm font-bold text-paw-on-surface flex items-center gap-2">
            <Bell className="w-4 h-4 text-paw-primary" />
            Notificaciones
          </h3>
          {items.some((n) => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-[11px] text-paw-primary font-medium hover:text-paw-on-primary-container transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              Marcar todas
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-paw-primary animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="w-10 h-10 text-paw-outline mb-2" />
              <p className="text-sm text-paw-on-surface-variant">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-paw-outline-variant/20">
              {items.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) {
                      markAsRead(notif.id);
                    }
                    openNotificationTarget(notif);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-paw-surface-high/50 transition-colors ${
                    !notif.read ? 'bg-paw-primary-fixed/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg shrink-0 mt-0.5">{notifIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-paw-on-surface truncate">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-paw-primary rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-paw-on-surface-variant line-clamp-2 mt-0.5">
                        {notif.body}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-paw-outline">
                          {getTimeAgo(notif.createdAt)}
                        </span>
                        {notif.read && (
                          <Check className="w-2.5 h-2.5 text-paw-outline" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
