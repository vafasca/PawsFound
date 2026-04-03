import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processLostReportEscalations, sendLostReportNotifications } from '@/lib/lost-report-notifications';

const COORDINATE_ADDRESS_REGEX = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;

async function reverseGeocodeAddress(lat: number, lng: number): Promise<string | null> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es&zoom=16`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PawsFound/1.0 (contact: pawsfound.app@gmail.com)',
        },
      }
    );

    if (timeout) clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.display_name) return null;

    const parts = String(data.display_name).split(',');
    return parts.slice(0, 4).join(',').trim();
  } catch {
    if (timeout) clearTimeout(timeout);
    return null;
  }
}

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

    await processLostReportEscalations();

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

    const incomingAddress = typeof address === 'string' ? address.trim() : '';
    const shouldReverseGeocode =
      typeof lat === 'number'
      && typeof lng === 'number'
      && (
        !incomingAddress
        || incomingAddress === 'La Paz, Bolivia'
        || incomingAddress === 'La Paz, Bolivia (default)'
        || COORDINATE_ADDRESS_REGEX.test(incomingAddress)
      );

    const resolvedAddress = shouldReverseGeocode
      ? (await reverseGeocodeAddress(lat, lng)) || incomingAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      : incomingAddress;

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
        address: resolvedAddress || null,
        reporterId,
      },
      include: {
        reporter: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (report.type === 'lost') {
      await sendLostReportNotifications(report.id, 'initial');
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
