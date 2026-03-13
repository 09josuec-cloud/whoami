import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const createReminderSchema = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().max(5000).optional(),
  dueAt: z.string(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  eventId: z.string().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        OR: [
          // Upcoming (not done, due in the future)
          { done: false, dueAt: { gte: now } },
          // Overdue (not done, past due)
          { done: false, dueAt: { lt: now } },
          // Done in the last 7 days
          { done: true, updatedAt: { gte: sevenDaysAgo } },
        ],
      },
      orderBy: { dueAt: 'asc' },
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('[Calendar] GET reminders error:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
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

  const parsed = createReminderSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const body = parsed.data;

  const dueAt = new Date(body.dueAt);
  if (isNaN(dueAt.getTime())) {
    return NextResponse.json({ error: 'Invalid dueAt date' }, { status: 400 });
  }

  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        title: body.title.trim(),
        notes: body.notes?.trim() ?? null,
        dueAt,
        repeat: body.repeat && body.repeat !== 'none' ? body.repeat : null,
        eventId: body.eventId ?? null,
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error('[Calendar] POST reminder error:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}
