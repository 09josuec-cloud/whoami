import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    const data = goals.map((g) => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      progress:
        g.targetAmount > 0
          ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 1000) / 10, 100)
          : 0,
      targetDate: g.targetDate ? g.targetDate.toISOString() : null,
      color: g.color ?? '#6366f1',
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[Analytics/Savings] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch savings analytics' }, { status: 500 });
  }
}
