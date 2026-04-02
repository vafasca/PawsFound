import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// PUT /api/users/preferences - Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      locale,
      pushEnabled,
      locationSharing,
      profileVisible,
      bio,
      city,
      phone,
      name,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (locale !== undefined) updateData.locale = locale;
    if (pushEnabled !== undefined) updateData.pushEnabled = pushEnabled;
    if (locationSharing !== undefined) updateData.locationSharing = locationSharing;
    if (profileVisible !== undefined) updateData.profileVisible = profileVisible;
    if (bio !== undefined) updateData.bio = bio;
    if (city !== undefined) updateData.city = city;
    if (phone !== undefined) updateData.phone = phone;
    if (name !== undefined) updateData.name = name;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: auth.userId },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
