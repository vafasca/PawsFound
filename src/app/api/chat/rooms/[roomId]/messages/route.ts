import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

// GET /api/chat/rooms/[roomId]/messages - Get messages for a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { roomId } = await params;

    // Verify user is a participant
    const participant = await db.chatRoomUser.findUnique({
      where: { roomId_userId: { roomId, userId: auth.userId } },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant of this room' },
        { status: 403 }
      );
    }

    const messages = await db.chatMessage.findMany({
      where: { roomId },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages as read
    await db.chatMessage.updateMany({
      where: {
        roomId,
        senderId: { not: auth.userId },
        read: false,
      },
      data: { read: true },
    });

    // Update lastRead
    await db.chatRoomUser.update({
      where: { roomId_userId: { roomId, userId: auth.userId } },
      data: { lastRead: new Date() },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/rooms/[roomId]/messages - Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { roomId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Verify user is a participant
    const participant = await db.chatRoomUser.findUnique({
      where: { roomId_userId: { roomId, userId: auth.userId } },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant of this room' },
        { status: 403 }
      );
    }

    const message = await db.chatMessage.create({
      data: {
        content,
        roomId,
        senderId: auth.userId,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
