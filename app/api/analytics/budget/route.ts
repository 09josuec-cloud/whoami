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
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id, month, year },
      orderBy: { category: 'asc' },
    });

    if (budgets.length === 0) {
      return NextResponse.json({ data: [], month, year });
    }

    // Get actual spending by category for current month
    const transactions = await prisma.transaction.findMany({
      where: {
        bankAccount: {
          plaidItem: { userId: session.user.id },
        },
        date: { gte: monthStart, lte: monthEnd },
        amount: { gt: 0 },
        pending: false,
        NOT: { category: 'Transfer' },
      },
      select: { category: true, amount: true },
    });

    const actualByCategory: Record<string, number> = {};
    for (const tx of transactions) {
      const cat = tx.category ?? 'Other';
      actualByCategory[cat] = (actualByCategory[cat] ?? 0) + tx.amount;
    }

    const data = budgets.map((b) => {
      const actual = Math.round((actualByCategory[b.category] ?? 0) * 100) / 100;
      return {
        category: b.category,
        budget: b.amount,
        actual,
        over: actual > b.amount,
      };
    });

    return NextResponse.json({ data, month, year });
  } catch (error) {
    console.error('[Analytics/Budget] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch budget analytics' }, { status: 500 });
  }
}
