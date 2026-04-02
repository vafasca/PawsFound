import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports - List all reports with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type');
    const species = searchParams.get('species');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }
    if (species) {
      where.species = species;
    }
    if (status) {
      where.status = status;
    }

    const reports = await db.report.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { sightings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      petName,
      species,
      breed,
      color,
      uniqueMarks,
      photoUrl,
      lat,
      lng,
      address,
      reporterId,
    } = body;

    if (!type || !petName || !species || !reporterId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, petName, species, reporterId' },
        { status: 400 }
      );
    }

    const report = await db.report.create({
      data: {
        type,
        petName,
        species,
        breed: breed || null,
        color: color || null,
        uniqueMarks: uniqueMarks || null,
        photoUrl: photoUrl || null,
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

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
