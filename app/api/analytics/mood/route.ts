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
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: session.user.id,
        entryDate: { gte: thirtyDaysAgo },
        mood: { not: null },
      },
      select: { entryDate: true, mood: true },
      orderBy: { entryDate: 'asc' },
    });

    // Group by day
    const dayMap: Map<string, number[]> = new Map();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const entry of entries) {
      const d = new Date(entry.entryDate);
      const key = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      if (!dayMap.has(key)) {
        dayMap.set(key, []);
      }
      dayMap.get(key)!.push(entry.mood!);
    }

    const data = [...dayMap.entries()].map(([date, moods]) => ({
      date,
      mood: Math.round((moods.reduce((s, m) => s + m, 0) / moods.length) * 10) / 10,
    }));

    let avgMood: number | null = null;
    let bestDay: string | null = null;
    let worstDay: string | null = null;

    if (data.length > 0) {
      const total = data.reduce((s, d) => s + d.mood, 0);
      avgMood = Math.round((total / data.length) * 10) / 10;

      const best = data.reduce((prev, cur) => (cur.mood > prev.mood ? cur : prev));
      const worst = data.reduce((prev, cur) => (cur.mood < prev.mood ? cur : prev));
      bestDay = best.date;
      worstDay = worst.date;
    }

    return NextResponse.json({ data, avgMood, bestDay, worstDay });
  } catch (error) {
    console.error('[Analytics/Mood] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch mood analytics' }, { status: 500 });
  }
}
