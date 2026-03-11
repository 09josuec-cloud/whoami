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
    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Never send content of locked entries — unlock is handled via /unlock route
    if (entry.locked) {
      return NextResponse.json({ entry: { ...entry, content: '', tags: [], mood: null } });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('[Journal] GET[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 });
  }
}

interface PatchBody {
  title?: string;
  content?: string;
  mood?: number | null;
  tags?: string[];
  locked?: boolean;
  entryDate?: string;
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
    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Block edits on locked entries (unless unlocking)
    if (entry.locked && body.locked !== false) {
      return NextResponse.json({ error: 'Entry is locked' }, { status: 403 });
    }

    if (body.mood !== undefined && body.mood !== null && (body.mood < 1 || body.mood > 5)) {
      return NextResponse.json({ error: 'mood must be between 1 and 5' }, { status: 400 });
    }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.mood !== undefined && { mood: body.mood }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.locked !== undefined && { locked: body.locked }),
        ...(body.entryDate !== undefined && { entryDate: new Date(body.entryDate) }),
      },
    });

    return NextResponse.json({ entry: updated });
  } catch (error) {
    console.error('[Journal] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const entry = await prisma.journalEntry.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Journal] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
