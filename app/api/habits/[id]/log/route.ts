import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const logSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  note: z.string().max(500).optional().nullable(),
});

const deleteLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: habitId } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = logSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { date, note } = parsed.data;

  try {
    // Verify the habit belongs to this user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: { habitId, date },
      },
      create: {
        habitId,
        userId,
        date,
        note: note ?? null,
      },
      update: {
        note: note ?? null,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('[HabitLog] POST error:', error);
    return NextResponse.json({ error: 'Failed to log habit' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: habitId } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = deleteLogSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { date } = parsed.data;

  try {
    // Verify the habit belongs to this user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const existing = await prisma.habitLog.findFirst({
      where: { habitId, userId, date },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });
    }

    await prisma.habitLog.delete({
      where: { habitId_date: { habitId, date } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[HabitLog] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete habit log' }, { status: 500 });
  }
}
