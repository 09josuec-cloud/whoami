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

  try {
    // Journal streak — consecutive days with entries up to today
    const allEntries = await prisma.journalEntry.findMany({
      where: { userId },
      select: { entryDate: true, mood: true },
      orderBy: { entryDate: 'desc' },
    });

    const entryDays = new Set(
      allEntries.map((e) => {
        const d = new Date(e.entryDate);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    let journalStreak = 0;
    const checkDate = new Date(now);
    const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (!entryDays.has(todayKey)) checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (entryDays.has(key)) {
        journalStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Avg mood — last 30 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const moodEntries = allEntries.filter(
      (e) => e.mood !== null && new Date(e.entryDate) >= thirtyDaysAgo
    );
    const avgMood =
      moodEntries.length > 0
        ? moodEntries.reduce((s, e) => s + (e.mood ?? 0), 0) / moodEntries.length
        : null;

    // Steps today
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const stepsMetric = await prisma.healthMetric.findUnique({
      where: { userId_date_type: { userId, date: todayStr, type: 'steps' } },
      select: { value: true },
    });
    const todaySteps = stepsMetric?.value ?? null;

    // Upcoming reminders count (next 7 days, not done)
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const upcomingReminders = await prisma.reminder.count({
      where: { userId, done: false, dueAt: { gte: now, lte: sevenDaysLater } },
    });

    return NextResponse.json({ journalStreak, avgMood, todaySteps, upcomingReminders });
  } catch (error) {
    console.error('[Dashboard/LifeStats] GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
