import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const createHabitSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(10).optional().nullable(),
  color: z.string().max(50).optional(),
  frequency: z.enum(['daily', 'weekly']).optional(),
  targetDays: z.string().max(20).optional(),
});

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Compute consecutive streak ending on `today` given a sorted ascending array
 * of completed date strings (YYYY-MM-DD).
 */
function computeCurrentStreak(logDates: string[], today: string): number {
  if (logDates.length === 0) return 0;

  const dateSet = new Set(logDates);
  let streak = 0;
  const cursor = new Date(today);

  // Allow streak to include today or start from yesterday if today is not yet logged
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (dateSet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // If we haven't started counting yet (streak === 0), try yesterday
      if (streak === 0 && dateStr === today) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streak;
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
          select: { date: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    const result = habits.map((habit) => {
      const logDates = habit.logs.map((l) => l.date);
      const todayCompleted = logDates.includes(today);
      const currentStreak = computeCurrentStreak(logDates, today);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { logs: _logs, ...rest } = habit;
      return { ...rest, todayCompleted, currentStreak };
    });

    return NextResponse.json({ habits: result });
  } catch (error) {
    console.error('[Habits] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = createHabitSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, description, icon, color, frequency, targetDays } = parsed.data;

  try {
    // Place new habit at the end
    const maxOrderResult = await prisma.habit.aggregate({
      where: { userId },
      _max: { order: true },
    });
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    const habit = await prisma.habit.create({
      data: {
        userId,
        name,
        description: description ?? null,
        icon: icon ?? null,
        color: color ?? '#6366f1',
        frequency: frequency ?? 'daily',
        targetDays: targetDays ?? '1,2,3,4,5,6,7',
        order: nextOrder,
      },
    });

    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    console.error('[Habits] POST error:', error);
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}
