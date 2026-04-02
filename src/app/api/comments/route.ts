import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// POST /api/comments - Create a comment on a report or sighting
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, reportId, sightingId } = body;

    if (!content || (!reportId && !sightingId)) {
      return NextResponse.json(
        { error: 'Content and either reportId or sightingId are required' },
        { status: 400 }
      );
    }

    if (reportId) {
      const report = await db.report.findUnique({ where: { id: reportId } });
      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }
    }

    if (sightingId) {
      const sighting = await db.sighting.findUnique({ where: { id: sightingId } });
      if (!sighting) {
        return NextResponse.json(
          { error: 'Sighting not found' },
          { status: 404 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        content,
        authorId: auth.userId,
        reportId: reportId || null,
        sightingId: sightingId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
