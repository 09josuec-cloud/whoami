import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { generateGoalNotification } from '@/src/lib/notifications';

interface Params {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  name?: string;
  emoji?: string;
  color?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string | null;
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.emoji !== undefined && { emoji: body.emoji }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.targetAmount !== undefined && { targetAmount: body.targetAmount }),
        ...(body.currentAmount !== undefined && { currentAmount: body.currentAmount }),
        ...(body.targetDate !== undefined && {
          targetDate: body.targetDate ? new Date(body.targetDate) : null,
        }),
      },
    });

    // Fire goal milestone/completion notifications if amount changed
    if (body.currentAmount !== undefined || body.targetAmount !== undefined) {
      await generateGoalNotification(
        session.user.id,
        updated.id,
        updated.name,
        updated.currentAmount,
        updated.targetAmount,
      );
    }

    return NextResponse.json({ goal: updated });
  } catch (error) {
    console.error('[SavingsGoals] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    await prisma.savingsGoal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SavingsGoals] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
