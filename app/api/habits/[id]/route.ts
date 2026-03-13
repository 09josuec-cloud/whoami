import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const patchHabitSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().max(50).optional(),
  frequency: z.enum(['daily', 'weekly']).optional(),
  targetDays: z.string().max(20).optional(),
  archived: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  try {
    const habit = await prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Last 30 days of logs
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const sinceStr = since.toISOString().slice(0, 10);

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: id,
        userId,
        date: { gte: sinceStr },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ habit, logs });
  } catch (error) {
    console.error('[Habits] GET[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch habit' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = patchHabitSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const body = parsed.data;

  try {
    const existing = await prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.targetDays !== undefined && { targetDays: body.targetDays }),
        ...(body.archived !== undefined && { archived: body.archived }),
        ...(body.order !== undefined && { order: body.order }),
      },
    });

    return NextResponse.json({ habit: updated });
  } catch (error) {
    console.error('[Habits] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  try {
    const existing = await prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Cascade delete logs first (in case DB doesn't enforce cascades)
    await prisma.habitLog.deleteMany({ where: { habitId: id, userId } });
    await prisma.habit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Habits] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
