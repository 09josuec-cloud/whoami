import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { count } = await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ updated: count });
  } catch (error) {
    console.error('[Notifications] mark-all-read error:', error);
    return NextResponse.json({ error: 'Failed to mark all read' }, { status: 500 });
  }
}
