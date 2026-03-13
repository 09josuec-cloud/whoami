import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const today = getTodayString();

  try {
    const habits = await prisma.habit.findMany({
      where: { userId, archived: false },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        logs: {
          where: { date: today },
          select: { id: true, date: true, note: true },
        },
      },
    });

    const result = habits.map((habit) => {
      const completed = habit.logs.length > 0;
      const { logs, ...rest } = habit;
      return {
        ...rest,
        completed,
        logId: completed ? logs[0].id : null,
        note: completed ? logs[0].note : null,
      };
    });

    const completedCount = result.filter((h) => h.completed).length;
    const totalCount = result.length;

    return NextResponse.json({ habits: result, completedCount, totalCount });
  } catch (error) {
    console.error('[Habits/Today] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch today\'s habits' }, { status: 500 });
  }
}
