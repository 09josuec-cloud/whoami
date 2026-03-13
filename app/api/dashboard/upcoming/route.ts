import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();

  // Window: today start → 3 days from now end
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const threeDaysEnd = new Date(todayStart);
  threeDaysEnd.setDate(threeDaysEnd.getDate() + 3);
  threeDaysEnd.setHours(23, 59, 59, 999);

  // Reminders: not done, due in next 7 days
  const sevenDaysEnd = new Date(now);
  sevenDaysEnd.setDate(sevenDaysEnd.getDate() + 7);

  try {
    const [events, reminders] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          userId,
          start: { gte: todayStart, lte: threeDaysEnd },
        },
        orderBy: { start: 'asc' },
        take: 6,
        select: { id: true, title: true, start: true, end: true, allDay: true, color: true, location: true },
      }),
      prisma.reminder.findMany({
        where: {
          userId,
          done: false,
          dueAt: { gte: now, lte: sevenDaysEnd },
        },
        orderBy: { dueAt: 'asc' },
        take: 6,
        select: { id: true, title: true, dueAt: true, notes: true },
      }),
    ]);

    return NextResponse.json({ events, reminders });
  } catch (error) {
    console.error('[Dashboard/Upcoming] GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
