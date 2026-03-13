import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const patchReminderSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().max(5000).nullable().optional(),
  dueAt: z.string().optional(),
  done: z.boolean().optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).nullable().optional(),
  eventId: z.string().nullable().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = patchReminderSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const body = parsed.data;

  try {
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const dueAt = body.dueAt ? new Date(body.dueAt) : undefined;
    if (dueAt && isNaN(dueAt.getTime())) {
      return NextResponse.json({ error: 'Invalid dueAt date' }, { status: 400 });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(dueAt && { dueAt }),
        ...(body.done !== undefined && { done: body.done }),
        ...(body.repeat !== undefined && {
          repeat: body.repeat && body.repeat !== 'none' ? body.repeat : null,
        }),
        ...(body.eventId !== undefined && { eventId: body.eventId }),
      },
    });

    // Auto-schedule next occurrence when a repeating reminder is marked done
    if (body.done === true && updated.done && reminder.repeat && reminder.repeat !== 'none') {
      const nextDue = new Date(updated.dueAt);
      if (reminder.repeat === 'daily') nextDue.setDate(nextDue.getDate() + 1);
      else if (reminder.repeat === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      else if (reminder.repeat === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

      await prisma.reminder.create({
        data: {
          userId: session.user.id,
          title: reminder.title,
          notes: reminder.notes,
          dueAt: nextDue,
          repeat: reminder.repeat,
          eventId: reminder.eventId,
        },
      });
    }

    return NextResponse.json({ reminder: updated });
  } catch (error) {
    console.error('[Calendar] PATCH reminder error:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.reminder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Calendar] DELETE reminder error:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
