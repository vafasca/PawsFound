import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET /api/badges/my - Get current user's earned badges
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userBadges = await db.userBadge.findMany({
      where: { userId: auth.userId },
      include: {
        badge: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    return NextResponse.json({ badges: userBadges });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user badges' },
      { status: 500 }
    );
  }
}
