import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { plaidClient } from '@/src/services/plaid/client';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: session.user.id },
      include: { accounts: true },
    });

    if (plaidItems.length === 0) {
      return NextResponse.json({ inflow: [], outflow: [] });
    }

    const allInflow: object[] = [];
    const allOutflow: object[] = [];

    for (const item of plaidItems) {
      try {
        const res = await plaidClient.transactionsRecurringGet({
          access_token: item.accessToken,
          options: { include_personal_finance_category: true },
        });

        allInflow.push(...res.data.inflow_streams);
        allOutflow.push(...res.data.outflow_streams);
      } catch (err) {
        console.error(`[Plaid] recurring error for item ${item.id}:`, err);
      }
    }

    return NextResponse.json({ inflow: allInflow, outflow: allOutflow });
  } catch (error) {
    console.error('[Plaid] recurring error:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 });
  }
}
