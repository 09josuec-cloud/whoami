import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

interface MonthRow {
  month: string;
  [category: string]: string | number;
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        bankAccount: {
          plaidItem: { userId: session.user.id },
        },
        date: { gte: sixMonthsAgo },
        amount: { gt: 0 }, // Plaid: positive = expense/debit
        pending: false,
        NOT: { category: 'Transfer' },
      },
      select: { date: true, amount: true, category: true },
    });

    // Aggregate by month and category
    const monthCategoryMap: Map<string, Map<string, number>> = new Map();

    for (const tx of transactions) {
      const d = new Date(tx.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const category = tx.category ?? 'Other';

      if (!monthCategoryMap.has(monthKey)) {
        monthCategoryMap.set(monthKey, new Map());
      }
      const catMap = monthCategoryMap.get(monthKey)!;
      catMap.set(category, (catMap.get(category) ?? 0) + tx.amount);
    }

    // Find top 6 categories by total spend
    const categoryTotals: Map<string, number> = new Map();
    for (const catMap of monthCategoryMap.values()) {
      for (const [cat, amount] of catMap.entries()) {
        categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + amount);
      }
    }

    const top6 = [...categoryTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat]) => cat);

    // Build result array for last 6 months in order
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: MonthRow[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      const catMap = monthCategoryMap.get(monthKey) ?? new Map();

      const row: MonthRow = { month: monthLabel };
      for (const cat of top6) {
        row[cat] = Math.round((catMap.get(cat) ?? 0) * 100) / 100;
      }
      result.push(row);
    }

    return NextResponse.json({ data: result, categories: top6 });
  } catch (error) {
    console.error('[Analytics/Spending] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch spending analytics' }, { status: 500 });
  }
}
