import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';

type SubscriptionBody = {
  subscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as SubscriptionBody;
    const endpoint = body.subscription?.endpoint;
    const p256dh = body.subscription?.keys?.p256dh;
    const authKey = body.subscription?.keys?.auth;

    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 });
    }

    await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: auth.userId,
        endpoint,
        p256dh,
        auth: authKey,
      },
      update: {
        userId: auth.userId,
        p256dh,
        auth: authKey,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as { endpoint?: string };
    const endpoint = body.endpoint;
    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    await db.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: auth.userId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
  }
}
