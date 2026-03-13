import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

const LIABILITY_TYPES = ['credit', 'loan', 'mortgage'];

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function captureSnapshot(userId: string): Promise<void> {
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { plaidItem: { userId } },
    select: { type: true, currentBalance: true },
  });

  let assets = 0;
  let liabilities = 0;
  for (const a of bankAccounts) {
    const bal = a.currentBalance ?? 0;
    if (LIABILITY_TYPES.includes(a.type)) liabilities += bal;
    else assets += bal;
  }
  const netWorth = assets - liabilities;
  const date = toDateString(new Date());

  await prisma.netWorthSnapshot.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, netWorth, assets, liabilities },
    update: { netWorth, assets, liabilities },
  });
}

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Always capture/refresh today's snapshot on fetch
    await captureSnapshot(session.user.id);

    // Return last 90 days of snapshots
    const since = new Date();
    since.setDate(since.getDate() - 89);
    const sinceStr = toDateString(since);

    const snapshots = await prisma.netWorthSnapshot.findMany({
      where: {
        userId: session.user.id,
        date: { gte: sinceStr },
      },
      orderBy: { date: 'asc' },
      select: { date: true, netWorth: true, assets: true, liabilities: true },
    });

    return NextResponse.json({ data: snapshots });
  } catch (error) {
    console.error('[Analytics/NetWorthHistory] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch net worth history' }, { status: 500 });
  }
}
