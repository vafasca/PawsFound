import { db } from '@/lib/db';

type PushPayload = {
  userId: string;
  title: string;
  body: string;
  url?: string;
  reportId?: string;
};

let warnedMissingGateway = false;

export async function sendWebPushNotifications(notifications: PushPayload[]): Promise<void> {
  if (notifications.length === 0) return;
  const gatewayUrl = process.env.PUSH_GATEWAY_URL;
  const gatewayToken = process.env.PUSH_GATEWAY_TOKEN;

  if (!gatewayUrl) {
    if (!warnedMissingGateway) {
      warnedMissingGateway = true;
      console.warn('PUSH_GATEWAY_URL is not configured. Push notifications are disabled.');
    }
    return;
  }

  const userIds = [...new Set(notifications.map((item) => item.userId))];
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  if (subscriptions.length === 0) return;

  const byUser = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions) {
    const arr = byUser.get(sub.userId) ?? [];
    arr.push(sub);
    byUser.set(sub.userId, arr);
  }

  const sends: Promise<unknown>[] = [];
  for (const item of notifications) {
    const subs = byUser.get(item.userId) ?? [];
    for (const sub of subs) {
      const request = fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(gatewayToken ? { Authorization: `Bearer ${gatewayToken}` } : {}),
        },
        body: JSON.stringify({
          subscription: {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          title: item.title,
          body: item.body,
          url: item.url || '/',
          reportId: item.reportId || null,
        }),
      }).then(async (res) => {
        if (res.status === 404 || res.status === 410) {
          await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
        }
      }).catch(() => {
        // ignore gateway failures to avoid blocking report creation
      });
      sends.push(request);
    }
  }

  await Promise.allSettled(sends);
}
