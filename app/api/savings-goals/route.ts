import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('[SavingsGoals] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

interface GoalBody {
  name: string;
  emoji?: string;
  color?: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: GoalBody;
  try {
    body = (await req.json()) as GoalBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, emoji, color, targetAmount, currentAmount, targetDate } = body;
  if (!name || typeof targetAmount !== 'number' || targetAmount <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const goal = await prisma.savingsGoal.create({
      data: {
        userId: session.user.id,
        name,
        emoji: emoji ?? null,
        color: color ?? null,
        targetAmount,
        currentAmount: currentAmount ?? 0,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
    });
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error('[SavingsGoals] POST error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
