import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const createGoalSchema = z.object({
  name: z.string().min(1).max(200),
  emoji: z.string().max(10).optional(),
  color: z.string().max(50).optional(),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
});

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = createGoalSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, emoji, color, targetAmount, currentAmount, targetDate } = parsed.data;

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
