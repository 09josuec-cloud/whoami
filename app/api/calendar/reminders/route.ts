import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

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

interface ReminderBody {
  title: string;
  notes?: string;
  dueAt: string;
  repeat?: string;
  eventId?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ReminderBody;
  try {
    body = (await req.json()) as ReminderBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.title || !body.dueAt) {
    return NextResponse.json({ error: 'title and dueAt are required' }, { status: 400 });
  }

  const dueAt = new Date(body.dueAt);
  if (isNaN(dueAt.getTime())) {
    return NextResponse.json({ error: 'Invalid dueAt date' }, { status: 400 });
  }

  const validRepeat = ['none', 'daily', 'weekly', 'monthly'];
  if (body.repeat && !validRepeat.includes(body.repeat)) {
    return NextResponse.json({ error: 'Invalid repeat value' }, { status: 400 });
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
