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

    const current = bankAccounts.reduce((sum, a) => sum + (a.currentBalance ?? 0), 0);

    const accounts = bankAccounts.map((a) => ({
      name: a.name,
      type: a.type,
      balance: a.currentBalance ?? 0,
    }));

    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id },
      select: { currentAmount: true, targetAmount: true },
    });

    const savingsTotal = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const savingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

    return NextResponse.json({ current, accounts, savingsTotal, savingsTarget });
  } catch (error) {
    console.error('[Analytics/NetWorth] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch net worth analytics' }, { status: 500 });
  }
}
