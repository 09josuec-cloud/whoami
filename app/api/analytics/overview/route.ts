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
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Total spent this month (Plaid: positive = debit/expense)
    const spendingAgg = await prisma.transaction.aggregate({
      where: {
        bankAccount: {
          plaidItem: { userId: session.user.id },
        },
        date: { gte: monthStart, lte: monthEnd },
        amount: { gt: 0 },
        pending: false,
      },
      _sum: { amount: true },
    });
    const totalSpentThisMonth = spendingAgg._sum.amount ?? 0;

    // Journal entries this month
    const journalEntries = await prisma.journalEntry.findMany({
      where: {
        userId: session.user.id,
        entryDate: { gte: monthStart, lte: monthEnd },
      },
      select: { mood: true, entryDate: true },
      orderBy: { entryDate: 'asc' },
    });

    const journalEntriesThisMonth = journalEntries.length;

    const moodEntries = journalEntries.filter((e) => e.mood !== null);
    const avgMoodThisMonth =
      moodEntries.length > 0
        ? moodEntries.reduce((sum, e) => sum + (e.mood ?? 0), 0) / moodEntries.length
        : null;

    // Net worth: sum of all bank account balances
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        plaidItem: { userId: session.user.id },
      },
      select: { currentBalance: true },
    });
    const netWorth = bankAccounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);

    // Journal streak: consecutive days with entries ending today
    const allEntries = await prisma.journalEntry.findMany({
      where: { userId: session.user.id },
      select: { entryDate: true },
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
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (entryDays.has(key)) {
        journalStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Upcoming reminders: due in next 7 days, not done
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const upcomingReminders = await prisma.reminder.count({
      where: {
        userId: session.user.id,
        done: false,
        dueAt: { gte: now, lte: sevenDaysLater },
      },
    });

    return NextResponse.json({
      totalSpentThisMonth,
      avgMoodThisMonth,
      journalEntriesThisMonth,
      netWorth,
      journalStreak,
      upcomingReminders,
    });
  } catch (error) {
    console.error('[Analytics/Overview] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics overview' }, { status: 500 });
  }
}
