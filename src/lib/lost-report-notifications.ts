import { db } from '@/lib/db';
import { sendWebPushNotifications } from '@/lib/push-notifications';

type NotificationStage = {
  key: 'initial' | '24h' | '48h';
  type: string;
  radiusKm: number | null;
  sameCityOnly: boolean;
  title: string;
};

const STAGES: Record<NotificationStage['key'], NotificationStage> = {
  initial: {
    key: 'initial',
    type: 'report_lost_alert',
    radiusKm: 5,
    sameCityOnly: true,
    title: '🚨 Perro perdido cerca de ti',
  },
  '24h': {
    key: '24h',
    type: 'report_lost_alert_24h',
    radiusKm: 10,
    sameCityOnly: true,
    title: '🚨 Expansión de búsqueda (24h)',
  },
  '48h': {
    key: '48h',
    type: 'report_lost_alert_48h',
    radiusKm: null,
    sameCityOnly: false,
    title: '🚨 Alerta departamental (48h)',
  },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
      * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeCity(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

export async function sendLostReportNotifications(
  reportId: string,
  stageKey: NotificationStage['key'] = 'initial'
): Promise<void> {
  const stage = STAGES[stageKey];

  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      reporter: {
        select: { id: true, city: true },
      },
    },
  });

  if (!report || report.type !== 'lost' || report.status !== 'active') {
    return;
  }

  if (report.lat == null || report.lng == null) {
    return;
  }

  const city = normalizeCity(report.reporter.city);
  const sameCityFilter = stage.sameCityOnly && city
    ? { city: { equals: report.reporter.city as string, mode: 'insensitive' as const } }
    : {};

  const users = await db.user.findMany({
    where: {
      id: { not: report.reporterId },
      pushEnabled: true,
      locationSharing: true,
      ...sameCityFilter,
    },
    select: {
      id: true,
      city: true,
      reports: {
        where: {
          lat: { not: null },
          lng: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: { lat: true, lng: true },
        take: 1,
      },
    },
  });

  if (users.length === 0) {
    return;
  }

  const token = `${report.id}:${stage.key}`;
  const existing = await db.notification.findMany({
    where: {
      type: stage.type,
      data: token,
      userId: { in: users.map((u) => u.id) },
    },
    select: { userId: true },
  });
  const alreadySent = new Set(existing.map((item) => item.userId));

  const toCreate = users
    .filter((user) => !alreadySent.has(user.id))
    .map((user) => {
      const location = user.reports[0];
      if (location?.lat == null || location?.lng == null) return null;

      const distance = haversineKm(report.lat, report.lng, location.lat, location.lng);

      if (stage.radiusKm !== null && distance > stage.radiusKm) {
        return null;
      }

      const cityLabel = report.reporter.city || report.address || 'tu ciudad';
      const body = `${report.petName} fue reportado como perdido en ${report.address || cityLabel}. Distancia aproximada: ${distance.toFixed(1)} km.`;

      return {
        userId: user.id,
        title: stage.title,
        body,
        type: stage.type,
        data: token,
      };
    })
    .filter((value): value is { userId: string; title: string; body: string; type: string; data: string } => Boolean(value));

  if (toCreate.length === 0) {
    return;
  }

  await db.notification.createMany({ data: toCreate });

  await sendWebPushNotifications(
    toCreate.map((item) => ({
      userId: item.userId,
      title: item.title,
      body: item.body,
      url: `/?tab=home&reportId=${report.id}`,
      reportId: report.id,
    }))
  );
}

export async function processLostReportEscalations(): Promise<void> {
  const reports = await db.report.findMany({
    where: {
      type: 'lost',
      status: 'active',
      lat: { not: null },
      lng: { not: null },
    },
    select: { id: true, createdAt: true },
    take: 100,
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  for (const report of reports) {
    const ageHours = (now - report.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageHours >= 24) {
      await sendLostReportNotifications(report.id, '24h');
    }
    if (ageHours >= 48) {
      await sendLostReportNotifications(report.id, '48h');
    }
  }
}
