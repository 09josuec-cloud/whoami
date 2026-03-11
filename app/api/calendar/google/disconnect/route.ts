import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function DELETE(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Delete Google Calendar events for this user
    await prisma.calendarEvent.deleteMany({
      where: { userId, source: 'google' },
    });

    // Delete the connection record
    await prisma.calendarConnection.deleteMany({
      where: { userId, provider: 'google' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Calendar] Disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Calendar' }, { status: 500 });
  }
}
