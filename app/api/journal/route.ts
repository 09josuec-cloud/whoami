import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');
  const tag = searchParams.get('tag');
  const mood = searchParams.get('mood');
  const q = searchParams.get('q');

  const where: Record<string, unknown> = { userId: session.user.id };

  if (monthParam && yearParam) {
    const month = parseInt(monthParam, 10);
    const year = parseInt(yearParam, 10);
    where.entryDate = {
      gte: new Date(year, month - 1, 1),
      lte: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  if (tag) {
    where.tags = { has: tag };
  }

  if (mood) {
    where.mood = parseInt(mood, 10);
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ];
  }

  try {
    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        mood: true,
        tags: true,
        locked: true,
        entryDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Strip content and tags from locked entries so they never reach the client
    const sanitized = entries.map((e) =>
      e.locked ? { ...e, content: '', tags: [], mood: null, title: null } : e
    );

    return NextResponse.json({ entries: sanitized });
  } catch (error) {
    console.error('[Journal] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

interface JournalBody {
  title?: string;
  content: string;
  mood?: number;
  tags?: string[];
  entryDate: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: JournalBody;
  try {
    body = (await req.json()) as JournalBody;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (body.content === undefined || body.content === null || !body.entryDate) {
    return NextResponse.json({ error: 'content and entryDate are required' }, { status: 400 });
  }

  if (body.mood !== undefined && (body.mood < 1 || body.mood > 5)) {
    return NextResponse.json({ error: 'mood must be between 1 and 5' }, { status: 400 });
  }

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        title: body.title ?? null,
        content: body.content,
        mood: body.mood ?? null,
        tags: body.tags ?? [],
        entryDate: new Date(body.entryDate),
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('[Journal] POST error:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
