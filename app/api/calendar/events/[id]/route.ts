import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('[Calendar] GET event[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

interface PatchBody {
  title?: string;
  description?: string | null;
  location?: string | null;
  start?: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  recurrence?: string | null;
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
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (event.source !== 'local') {
      return NextResponse.json(
        { error: 'Edit in Google Calendar' },
        { status: 403 },
      );
    }

    const start = body.start ? new Date(body.start) : undefined;
    const end = body.end ? new Date(body.end) : undefined;

    if (start && isNaN(start.getTime())) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }
    if (end && isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
    }

    const updated = await prisma.calendarEvent.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.location !== undefined && { location: body.location }),
        ...(start && { start }),
        ...(end && { end }),
        ...(body.allDay !== undefined && { allDay: body.allDay }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.recurrence !== undefined && { recurrence: body.recurrence }),
      },
    });

    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error('[Calendar] PATCH event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (event.source !== 'local') {
      return NextResponse.json(
        { error: 'Edit in Google Calendar' },
        { status: 403 },
      );
    }

    await prisma.calendarEvent.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Calendar] DELETE event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
