import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'neutral';
  category: 'finance' | 'journal' | 'mood' | 'goals' | 'reminders';
  title: string;
  description: string;
  metric?: string;
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();

  const currMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const insights: Insight[] = [];

  try {
    // ── 1. Overall spending: current vs previous month ──────────────────────
    const [currTxs, prevTxs] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          bankAccount: { plaidItem: { userId } },
          date: { gte: currMonthStart, lte: currMonthEnd },
          amount: { gt: 0 },
          pending: false,
          NOT: { category: 'Transfer' },
        },
        select: { amount: true, category: true },
      }),
      prisma.transaction.findMany({
        where: {
          bankAccount: { plaidItem: { userId } },
          date: { gte: prevMonthStart, lte: prevMonthEnd },
          amount: { gt: 0 },
          pending: false,
          NOT: { category: 'Transfer' },
        },
        select: { amount: true, category: true },
      }),
    ]);

    const currTotal = currTxs.reduce((s, t) => s + t.amount, 0);
    const prevTotal = prevTxs.reduce((s, t) => s + t.amount, 0);

    if (prevTotal > 0 && currTotal > 0) {
      const pctChange = ((currTotal - prevTotal) / prevTotal) * 100;
      const absChange = Math.abs(currTotal - prevTotal);
      const fmtDollar = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

      if (pctChange > 10) {
        insights.push({
          id: 'spending-up',
          type: 'warning',
          category: 'finance',
          title: 'Spending increased this month',
          description: `You've spent ${fmtDollar(absChange)} more than last month — a ${pctChange.toFixed(0)}% increase.`,
          metric: `+${pctChange.toFixed(0)}%`,
        });
      } else if (pctChange < -10) {
        insights.push({
          id: 'spending-down',
          type: 'positive',
          category: 'finance',
          title: 'Spending is down this month',
          description: `You've spent ${fmtDollar(absChange)} less than last month — a ${Math.abs(pctChange).toFixed(0)}% decrease. Keep it up.`,
          metric: `${pctChange.toFixed(0)}%`,
        });
      } else {
        insights.push({
          id: 'spending-stable',
          type: 'neutral',
          category: 'finance',
          title: 'Spending on track',
          description: `This month's spending is close to last month (${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(0)}%).`,
          metric: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(0)}%`,
        });
      }

      // ── 2. Top category change ──────────────────────────────────────────
      const currByCat: Record<string, number> = {};
      const prevByCat: Record<string, number> = {};
      for (const t of currTxs) currByCat[t.category ?? 'Other'] = (currByCat[t.category ?? 'Other'] ?? 0) + t.amount;
      for (const t of prevTxs) prevByCat[t.category ?? 'Other'] = (prevByCat[t.category ?? 'Other'] ?? 0) + t.amount;

      let biggestIncreaseCat = '';
      let biggestIncreasePct = 0;
      for (const [cat, amt] of Object.entries(currByCat)) {
        const prev = prevByCat[cat] ?? 0;
        if (prev > 20 && amt > prev) {
          const pct = ((amt - prev) / prev) * 100;
          if (pct > biggestIncreasePct) {
            biggestIncreasePct = pct;
            biggestIncreaseCat = cat;
          }
        }
      }

      if (biggestIncreaseCat && biggestIncreasePct > 25) {
        insights.push({
          id: 'category-spike',
          type: 'warning',
          category: 'finance',
          title: `${biggestIncreaseCat} spending spiked`,
          description: `Your ${biggestIncreaseCat} spending is up ${biggestIncreasePct.toFixed(0)}% compared to last month.`,
          metric: `+${biggestIncreasePct.toFixed(0)}%`,
        });
      }
    }

    // ── 3. Budget adherence ─────────────────────────────────────────────────
    const budgets = await prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      select: { category: true, amount: true },
    });

    if (budgets.length > 0) {
      const currByCat: Record<string, number> = {};
      for (const t of currTxs) currByCat[t.category ?? 'Other'] = (currByCat[t.category ?? 'Other'] ?? 0) + t.amount;

      const overBudget = budgets.filter((b) => (currByCat[b.category] ?? 0) > b.amount);
      const underBudget = budgets.filter((b) => {
        const spent = currByCat[b.category] ?? 0;
        return spent > 0 && spent < b.amount * 0.5;
      });

      if (overBudget.length > 0) {
        const worst = overBudget.sort(
          (a, b) =>
            (currByCat[b.category] ?? 0) / b.amount - (currByCat[a.category] ?? 0) / a.amount
        )[0];
        const overpct = (((currByCat[worst.category] ?? 0) - worst.amount) / worst.amount) * 100;
        insights.push({
          id: 'budget-over',
          type: 'warning',
          category: 'finance',
          title: `Over budget on ${worst.category}`,
          description: `You've exceeded your ${worst.category} budget by ${overpct.toFixed(0)}% this month.`,
          metric: `+${overpct.toFixed(0)}%`,
        });
      } else if (underBudget.length >= 2) {
        insights.push({
          id: 'budget-good',
          type: 'positive',
          category: 'finance',
          title: 'Budget looking healthy',
          description: `You're well under budget in ${underBudget.length} categories this month.`,
          metric: `${underBudget.length} categories`,
        });
      }
    }

    // ── 4. Journal streak ───────────────────────────────────────────────────
    const allEntries = await prisma.journalEntry.findMany({
      where: { userId },
      select: { entryDate: true, mood: true },
      orderBy: { entryDate: 'desc' },
    });

    const entryDaySet = new Set(
      allEntries.map((e) => {
        const d = new Date(e.entryDate);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    let streak = 0;
    const checkDate = new Date(now);
    const todayKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
    if (!entryDaySet.has(todayKey)) checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
      if (entryDaySet.has(key)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else break;
    }

    if (streak >= 7) {
      insights.push({
        id: 'journal-streak-great',
        type: 'positive',
        category: 'journal',
        title: `${streak}-day journal streak`,
        description: "You've been journaling every day. Consistency is one of the best habits you can build.",
        metric: `${streak} days`,
      });
    } else if (streak > 0) {
      insights.push({
        id: 'journal-streak',
        type: 'neutral',
        category: 'journal',
        title: `${streak}-day journal streak`,
        description: streak === 1
          ? "You journaled today. Keep it going tomorrow to build a streak."
          : `You've journaled ${streak} days in a row. Keep the momentum.`,
        metric: `${streak} days`,
      });
    } else {
      insights.push({
        id: 'journal-no-streak',
        type: 'neutral',
        category: 'journal',
        title: 'No active journal streak',
        description: "Write a journal entry today to start building your streak.",
      });
    }

    // ── 5. Mood trend: this week vs last week ───────────────────────────────
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now); fourteenDaysAgo.setDate(now.getDate() - 14);

    const recentMoodEntries = allEntries.filter(
      (e) => e.mood !== null && new Date(e.entryDate) >= sevenDaysAgo
    );
    const prevMoodEntries = allEntries.filter(
      (e) => e.mood !== null && new Date(e.entryDate) >= fourteenDaysAgo && new Date(e.entryDate) < sevenDaysAgo
    );

    if (recentMoodEntries.length >= 2 && prevMoodEntries.length >= 2) {
      const recentAvg = recentMoodEntries.reduce((s, e) => s + (e.mood ?? 0), 0) / recentMoodEntries.length;
      const prevAvg = prevMoodEntries.reduce((s, e) => s + (e.mood ?? 0), 0) / prevMoodEntries.length;
      const diff = recentAvg - prevAvg;

      if (diff >= 0.5) {
        insights.push({
          id: 'mood-up',
          type: 'positive',
          category: 'mood',
          title: 'Mood trending up',
          description: `Your average mood this week (${recentAvg.toFixed(1)}) is higher than last week (${prevAvg.toFixed(1)}).`,
          metric: `+${diff.toFixed(1)}`,
        });
      } else if (diff <= -0.5) {
        insights.push({
          id: 'mood-down',
          type: 'warning',
          category: 'mood',
          title: 'Mood trending down',
          description: `Your average mood this week (${recentAvg.toFixed(1)}) is lower than last week (${prevAvg.toFixed(1)}). Take care of yourself.`,
          metric: diff.toFixed(1),
        });
      }
    }

    // ── 6. Savings goals ────────────────────────────────────────────────────
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      select: { name: true, targetAmount: true, currentAmount: true, targetDate: true },
    });

    if (goals.length > 0) {
      // Find goal closest to completion
      const closest = goals
        .filter((g) => g.targetAmount > 0 && g.currentAmount < g.targetAmount)
        .sort((a, b) => b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount)[0];

      if (closest) {
        const pct = Math.round((closest.currentAmount / closest.targetAmount) * 100);
        if (pct >= 80) {
          insights.push({
            id: 'goal-close',
            type: 'positive',
            category: 'goals',
            title: `Almost there on "${closest.name}"`,
            description: `You're ${pct}% of the way to your goal. Just ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(closest.targetAmount - closest.currentAmount)} to go.`,
            metric: `${pct}%`,
          });
        }
      }

      // Check for goals with overdue target dates
      const overdueGoals = goals.filter(
        (g) => g.targetDate && new Date(g.targetDate) < now && g.currentAmount < g.targetAmount
      );
      if (overdueGoals.length > 0) {
        insights.push({
          id: 'goal-overdue',
          type: 'warning',
          category: 'goals',
          title: `${overdueGoals.length} goal${overdueGoals.length > 1 ? 's' : ''} past target date`,
          description: `"${overdueGoals[0].name}"${overdueGoals.length > 1 ? ` and ${overdueGoals.length - 1} other${overdueGoals.length > 2 ? 's' : ''}` : ''} passed their target date.`,
          metric: `${overdueGoals.length} goal${overdueGoals.length > 1 ? 's' : ''}`,
        });
      }
    }

    // ── 7. Overdue reminders ────────────────────────────────────────────────
    const overdueReminders = await prisma.reminder.count({
      where: { userId, done: false, dueAt: { lt: now } },
    });

    if (overdueReminders > 0) {
      insights.push({
        id: 'reminders-overdue',
        type: 'warning',
        category: 'reminders',
        title: `${overdueReminders} overdue reminder${overdueReminders > 1 ? 's' : ''}`,
        description: `You have ${overdueReminders} past-due reminder${overdueReminders > 1 ? 's' : ''} that ${overdueReminders > 1 ? 'need' : 'needs'} attention.`,
        metric: String(overdueReminders),
      });
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('[Analytics/Insights] GET error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
