import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export interface CashFlowMonth {
  month: string;
  income: number;
  spending: number;
  net: number;
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
        bankAccount: { plaidItem: { userId: session.user.id } },
        date: { gte: sixMonthsAgo },
        pending: false,
        NOT: { category: 'Transfer' },
      },
      select: { date: true, amount: true },
    });

    // Build month buckets
    const monthMap = new Map<string, { income: number; spending: number }>();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, { income: 0, spending: 0 });
    }

    for (const tx of transactions) {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthMap.get(key);
      if (!bucket) continue;

      // Plaid: positive = expense/debit, negative = income/credit
      if (tx.amount > 0) {
        bucket.spending += tx.amount;
      } else {
        bucket.income += Math.abs(tx.amount);
      }
    }

    const result: CashFlowMonth[] = [];
    for (const [key, bucket] of monthMap.entries()) {
      const [yearStr, monthStr] = key.split('-');
      const monthIdx = parseInt(monthStr ?? '1', 10) - 1;
      result.push({
        month: `${monthNames[monthIdx]} ${yearStr}`,
        income: Math.round(bucket.income * 100) / 100,
        spending: Math.round(bucket.spending * 100) / 100,
        net: Math.round((bucket.income - bucket.spending) * 100) / 100,
      });
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('[Analytics/Cashflow] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch cash flow data' }, { status: 500 });
  }
}
