import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute the current streak (consecutive days completed going back from today).
 * Accepts the full sorted-ascending array of all log dates.
 */
function computeCurrentStreak(logDates: string[], today: string): number {
  if (logDates.length === 0) return 0;
  const dateSet = new Set(logDates);
  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (dateSet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // If we haven't started counting yet, skip today and try from yesterday
      if (streak === 0 && dateStr === today) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streak;
}

/**
 * Compute the longest consecutive streak across all logged dates (sorted ascending).
 */
function computeLongestStreak(logDates: string[]): number {
  if (logDates.length === 0) return 0;

  // Sort ascending to iterate forward
  const sorted = [...logDates].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else if (diffDays > 1) {
      current = 1;
    }
    // diffDays === 0 means duplicate dates — skip (shouldn't happen due to unique constraint)
  }

  return longest;
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const today = getTodayString();
  const since30 = getDateNDaysAgo(29); // 30-day window inclusive of today

  try {
    const habits = await prisma.habit.findMany({
      where: { userId, archived: false },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        // All-time logs needed for longestStreak and totalCompleted
        logs: {
          select: { date: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    const stats = habits.map((habit) => {
      const allDates = habit.logs.map((l) => l.date);
      const last30Dates = allDates.filter((d) => d >= since30 && d <= today);

      // Completion rate: completed days in last 30 / 30
      const completionRate = Math.round((last30Dates.length / 30) * 100);

      const currentStreak = computeCurrentStreak(allDates, today);
      const longestStreak = computeLongestStreak(allDates);
      const totalCompleted = allDates.length;

      return {
        habitId: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
        completionRate,
        currentStreak,
        longestStreak,
        totalCompleted,
      };
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[Habits/Stats] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch habit stats' }, { status: 500 });
  }
}
