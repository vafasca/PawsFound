import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// POST /api/chat/rooms - Create or find existing 1:1 chat room
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
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId is required' },
        { status: 400 }
      );
    }

    if (targetUserId === auth.userId) {
      return NextResponse.json(
        { error: 'Cannot create a chat room with yourself' },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Check for existing 1:1 room between these two users
    const existingRoom = await db.chatRoom.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [auth.userId, targetUserId] },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (existingRoom && existingRoom.participants.length === 2) {
      return NextResponse.json({ room: existingRoom });
    }

    // Create new room
    const room = await db.chatRoom.create({
      data: {
        name: `${auth.email} & ${targetUser.email}`,
        participants: {
          create: [
            { userId: auth.userId },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    console.error('Error creating chat room:', error);
    return NextResponse.json(
      { error: 'Failed to create chat room' },
      { status: 500 }
    );
  }
}

// GET /api/chat/rooms - Get all chat rooms for current user
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const rooms = await db.chatRoomUser.findMany({
      where: { userId: auth.userId },
      include: {
        room: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: {
              select: {
                messages: {
                  where: {
                    read: false,
                    senderId: { not: auth.userId },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const formattedRooms = rooms.map((rm) => ({
      ...rm.room,
      lastMessage: rm.room.messages[0] || null,
      unreadCount: rm.room._count.messages,
      lastRead: rm.lastRead,
    }));

    return NextResponse.json({ rooms: formattedRooms });
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat rooms' },
      { status: 500 }
    );
  }
}
