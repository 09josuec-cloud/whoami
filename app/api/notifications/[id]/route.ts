import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    console.error('[Notifications] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
