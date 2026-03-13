import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { z } from 'zod';

const VALID_TYPES = ['steps', 'sleep', 'weight', 'water', 'calories', 'heart_rate'] as const;
type MetricType = (typeof VALID_TYPES)[number];

const upsertMetricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  type: z.enum(VALID_TYPES),
  value: z.number().finite(),
  source: z.string().max(50).optional(),
});

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Collapse a flat array of HealthMetric rows into a keyed object: { steps?, sleep?, ... }
 */
function collapseMetrics(
  rows: { type: string; value: number }[]
): Partial<Record<MetricType, number>> {
  const out: Partial<Record<MetricType, number>> = {};
  for (const row of rows) {
    out[row.type as MetricType] = row.value;
  }
  return out;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get('range');
  const dateParam = searchParams.get('date');

  try {
    // Range mode: return last N days as an array
    if (rangeParam !== null) {
      const range = parseInt(rangeParam, 10);
      if (isNaN(range) || range < 1 || range > 365) {
        return NextResponse.json(
          { error: 'range must be a number between 1 and 365' },
          { status: 400 }
        );
      }

      const since = getDateNDaysAgo(range);
      const today = getTodayString();

      const rows = await prisma.healthMetric.findMany({
        where: {
          userId,
          date: { gte: since, lte: today },
        },
        select: { date: true, type: true, value: true },
        orderBy: { date: 'asc' },
      });

      // Group rows by date
      const byDate = new Map<string, { type: string; value: number }[]>();
      for (const row of rows) {
        if (!byDate.has(row.date)) byDate.set(row.date, []);
        byDate.get(row.date)!.push({ type: row.type, value: row.value });
      }

      // Build a dense array covering every date in the range
      const results: (Partial<Record<MetricType, number>> & { date: string })[] = [];
      const cursor = new Date(since);
      const end = new Date(today);

      while (cursor <= end) {
        const dateStr = cursor.toISOString().slice(0, 10);
        const dayRows = byDate.get(dateStr) ?? [];
        results.push({ date: dateStr, ...collapseMetrics(dayRows) });
        cursor.setDate(cursor.getDate() + 1);
      }

      return NextResponse.json({ metrics: results });
    }

    // Single-date mode (default today)
    const date = dateParam ?? getTodayString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
    }

    const rows = await prisma.healthMetric.findMany({
      where: { userId, date },
      select: { type: true, value: true, source: true, id: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ metrics: collapseMetrics(rows), raw: rows });
  } catch (error) {
    console.error('[HealthMetrics] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch health metrics' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = upsertMetricSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed.', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { date, type, value, source } = parsed.data;

  try {
    const metric = await prisma.healthMetric.upsert({
      where: {
        userId_date_type: { userId, date, type },
      },
      create: {
        userId,
        date,
        type,
        value,
        source: source ?? 'manual',
      },
      update: {
        value,
        ...(source !== undefined && { source }),
      },
    });

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    console.error('[HealthMetrics] POST error:', error);
    return NextResponse.json({ error: 'Failed to save health metric' }, { status: 500 });
  }
}
