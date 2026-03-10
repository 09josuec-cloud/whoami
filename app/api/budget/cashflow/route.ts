import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Build an ordered list of the last 6 months using UTC to avoid timezone boundary issues.
    // Date.UTC(year, month - N, 1) correctly rolls back across year boundaries.
    const now = new Date();
    const nowYear = now.getUTCFullYear();
    const nowMonth = now.getUTCMonth(); // 0-indexed

    const months: Array<{ key: string; label: string; start: Date; end: Date }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(nowYear, nowMonth - i, 1));
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      // End = last millisecond of the month
      const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - 1);
      months.push({ key, label, start: d, end });
    }

    const start = months[0].start;

    const transactions = await prisma.transaction.findMany({
      where: {
        bankAccount: { plaidItem: { userId: session.user.id } },
        date: { gte: start },
        pending: false,
      },
      select: { amount: true, date: true, category: true },
    });

    // Initialize map with all 6 months at zero
    const map = new Map<string, { income: number; spending: number; label: string }>();
    for (const m of months) {
      map.set(m.key, { income: 0, spending: 0, label: m.label });
    }

    for (const tx of transactions) {
      const d = new Date(tx.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
      const entry = map.get(key);
      if (!entry) continue;

      if (tx.amount < 0) {
        // Negative amount = credit/income in Plaid
        entry.income += Math.abs(tx.amount);
      } else if (tx.category !== 'Transfer') {
        entry.spending += tx.amount;
      }
    }

    const cashflow = Array.from(map.values());

    return NextResponse.json({ cashflow });
  } catch (error) {
    console.error('[Budget] cashflow error:', error);
    return NextResponse.json({ error: 'Failed to fetch cashflow' }, { status: 500 });
  }
}
