type OneSignalPayload = {
  externalUserId: string;
  title: string;
  body: string;
  url?: string;
  reportId?: string;
};

const ONESIGNAL_API_URL = 'https://api.onesignal.com/notifications';

export async function sendOneSignalNotifications(items: OneSignalPayload[]): Promise<void> {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey || items.length === 0) {
    return;
  }

  const requests = items.map((item, index) => {
    const collapseKey = `${item.reportId || 'report'}-${Date.now()}-${index}`;

    return fetch(ONESIGNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        include_aliases: { external_id: [item.externalUserId] },
        target_channel: 'push',
        headings: { es: item.title, en: item.title },
        contents: { es: item.body, en: item.body },
        url: item.url || '/',
        // Avoid browser/providers collapsing multiple lost-pet alerts into a single push.
        web_push_topic: collapseKey,
        collapse_id: collapseKey,
        data: {
          reportId: item.reportId || null,
        },
      }),
    }).catch(() => {
      // Ignore OneSignal request failures to avoid blocking report creation.
    });
  });

  await Promise.allSettled(requests);
}
