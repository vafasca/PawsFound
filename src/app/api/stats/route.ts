import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/stats - Return dashboard statistics
export async function GET() {
  try {
    const [
      totalReports,
      activeReports,
      lostReports,
      sightedReports,
      foundReports,
      totalPets,
      totalUsers,
      totalSightings,
      totalComments,
      totalChats,
    ] = await Promise.all([
      db.report.count(),
      db.report.count({ where: { status: 'active' } }),
      db.report.count({ where: { type: 'lost' } }),
      db.report.count({ where: { type: 'sighted' } }),
      db.report.count({ where: { status: 'found' } }),
      db.pet.count(),
      db.user.count(),
      db.sighting.count(),
      db.comment.count(),
      db.chatRoom.count(),
    ]);

    return NextResponse.json({
      totalReports,
      activeReports,
      lostReports,
      sightedReports,
      foundReports,
      totalPets,
      totalUsers,
      totalSightings,
      totalComments,
      totalChats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
