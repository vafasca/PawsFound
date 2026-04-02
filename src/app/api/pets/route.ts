import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/pets - List all pets with owner name
export async function GET() {
  try {
    const pets = await db.pet.findMany({
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pets });
  } catch (error) {
    console.error('Error fetching pets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pets' },
      { status: 500 }
    );
  }
}

// POST /api/pets - Create a new pet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, species, breed, color, uniqueMarks, photoUrl, ownerId } = body;

    if (!name || !species || !ownerId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, species, ownerId' },
        { status: 400 }
      );
    }

    const pet = await db.pet.create({
      data: {
        name,
        species,
        breed: breed || null,
        color: color || null,
        uniqueMarks: uniqueMarks || null,
        photoUrl: photoUrl || null,
        ownerId,
      },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ pet }, { status: 201 });
  } catch (error) {
    console.error('Error creating pet:', error);
    return NextResponse.json(
      { error: 'Failed to create pet' },
      { status: 500 }
    );
  }
}
