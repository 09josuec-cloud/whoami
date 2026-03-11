import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

interface PatchBody {
  title?: string;
  notes?: string | null;
  dueAt?: string;
  done?: boolean;
  repeat?: string | null;
  eventId?: string | null;
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

    const validRepeat = ['none', 'daily', 'weekly', 'monthly'];
    if (body.repeat && !validRepeat.includes(body.repeat)) {
      return NextResponse.json({ error: 'Invalid repeat value' }, { status: 400 });
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
