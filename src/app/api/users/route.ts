import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/users - List all users
// GET /api/users?id=xxx - Get a single user with pets and reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('id');

    if (userId) {
      // Get a single user with their pets and reports
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: { pets: true, reports: true },
          },
          pets: {
            orderBy: { createdAt: 'desc' },
          },
          reports: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ user });
    }

    // List all users
    const users = await db.user.findMany({
      include: {
        _count: {
          select: { pets: true, reports: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
