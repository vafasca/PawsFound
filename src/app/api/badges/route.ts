import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/badges - Get all available badges
export async function GET() {
  try {
    const badges = await db.badge.findMany({
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({ badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
