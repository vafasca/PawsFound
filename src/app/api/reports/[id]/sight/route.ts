import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/reports/[id]/sight - Add a sighting to a report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const body = await request.json();
    const { description, lat, lng, address, reporterId } = body;

    if (!reporterId) {
      return NextResponse.json(
        { error: 'Missing required field: reporterId' },
        { status: 400 }
      );
    }

    // Verify the report exists
    const report = await db.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const sighting = await db.sighting.create({
      data: {
        reportId,
        description: description || null,
        lat: lat ?? null,
        lng: lng ?? null,
        address: address || null,
        reporterId,
      },
      include: {
        reporter: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update report status to active if it was closed and a new sighting comes in
    if (report.status === 'found' || report.status === 'closed') {
      await db.report.update({
        where: { id: reportId },
        data: { status: 'active' },
      });
    }

    return NextResponse.json({ sighting }, { status: 201 });
  } catch (error) {
    console.error('Error creating sighting:', error);
    return NextResponse.json(
      { error: 'Failed to create sighting' },
      { status: 500 }
    );
  }
}
