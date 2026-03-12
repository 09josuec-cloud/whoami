import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Go back 12 weeks
    const twelveWeeksAgo = new Date(now);
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 83); // ~12 weeks
    twelveWeeksAgo.setHours(0, 0, 0, 0);

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: session.user.id,
        entryDate: { gte: twelveWeeksAgo },
      },
      select: { entryDate: true },
      orderBy: { entryDate: 'asc' },
    });

    // Total entries (all time) for stats
    const totalEntries = await prisma.journalEntry.count({
      where: { userId: session.user.id },
    });

    // Build weekly buckets: 12 weeks from twelveWeeksAgo to now
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const weeks: { weekStart: Date; weekEnd: Date; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - 6);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const label = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`;
      weeks.push({ weekStart, weekEnd, label });
    }

    const data = weeks.map(({ weekStart, weekEnd, label }) => {
      const count = entries.filter((e) => {
        const d = new Date(e.entryDate);
        return d >= weekStart && d <= weekEnd;
      }).length;
      return { week: `Week of ${label}`, count };
    });

    const avgPerWeek = Math.round((data.reduce((s, d) => s + d.count, 0) / data.length) * 10) / 10;

    // Longest streak (all time) using all entries
    const allEntries = await prisma.journalEntry.findMany({
      where: { userId: session.user.id },
      select: { entryDate: true },
      orderBy: { entryDate: 'asc' },
    });

    const uniqueDays = [
      ...new Set(
        allEntries.map((e) => {
          const d = new Date(e.entryDate);
          return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        })
      ),
    ].sort((a, b) => a - b);

    let longestStreak = 0;
    let currentStreak = 0;
    const ONE_DAY = 86400000;

    for (let i = 0; i < uniqueDays.length; i++) {
      if (i === 0 || uniqueDays[i] - uniqueDays[i - 1] === ONE_DAY) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return NextResponse.json({ data, totalEntries, avgPerWeek, longestStreak });
  } catch (error) {
    console.error('[Analytics/Journal] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch journal analytics' }, { status: 500 });
  }
}
