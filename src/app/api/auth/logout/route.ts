import { NextResponse } from 'next/server';

// POST /api/auth/logout
export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    response.headers.set(
      'Set-Cookie',
      'token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    );

    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Failed to log out' },
      { status: 500 }
    );
  }
}
