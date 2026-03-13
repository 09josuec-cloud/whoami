import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        plaidItem: { userId: session.user.id },
      },
      select: { name: true, type: true, currentBalance: true },
    });

    const LIABILITY_TYPES = ['credit', 'loan', 'mortgage'];
    let assets = 0;
    let liabilities = 0;
    for (const a of bankAccounts) {
      const bal = a.currentBalance ?? 0;
      if (LIABILITY_TYPES.includes(a.type)) liabilities += bal;
      else assets += bal;
    }
    const current = assets - liabilities;

    const accounts = bankAccounts.map((a) => ({
      name: a.name,
      type: a.type,
      balance: a.currentBalance ?? 0,
      isLiability: LIABILITY_TYPES.includes(a.type),
    }));

    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id },
      select: { currentAmount: true, targetAmount: true },
    });

    const savingsTotal = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const savingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

    return NextResponse.json({ current, assets, liabilities, accounts, savingsTotal, savingsTarget });
  } catch (error) {
    console.error('[Analytics/NetWorth] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch net worth analytics' }, { status: 500 });
  }
}
