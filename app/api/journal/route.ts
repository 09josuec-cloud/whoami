import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const createJournalSchema = z.object({
  title: z.string().max(500).optional().nullable(),
  content: z.string(),
  mood: z.number().int().min(1).max(5).optional().nullable(),
  tags: z.array(z.string().max(100)).max(50).default([]),
  entryDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  locked: z.boolean().default(false),
});

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
      e.locked ? { ...e, content: '', tags: [], mood: null } : e
    );

    return NextResponse.json({ entries: sanitized });
  } catch (error) {
    console.error('[Journal] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
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

  const parsed = createJournalSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const body = parsed.data;

  try {
    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        title: body.title ?? null,
        content: body.content,
        mood: body.mood ?? null,
        tags: body.tags,
        entryDate: new Date(body.entryDate),
        locked: body.locked,
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('[Journal] POST error:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
