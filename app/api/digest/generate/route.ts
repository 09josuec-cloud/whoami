import { NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { rateLimit } from '@/src/lib/rate-limit';
import { collectDigestData, generateDigestNarrative } from '@/src/lib/digest';

export async function POST(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = rateLimit(`digest:generate:${session.user.id}`, { maxAttempts: 5, windowMs: 60 * 60 * 1000 });
  if (!limit.success) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });

  try {
    const data = await collectDigestData(session.user.id);
    const narrative = await generateDigestNarrative(data);

    return NextResponse.json({
      narrative,
      weekRange: data.weekRange,
      stats: {
        avgMood: data.avgMood,
        moodLabel: data.moodLabel,
        habitPct: data.overallHabitPct,
        totalSpend: data.totalSpend,
        journalCount: data.journalCount,
        avgSteps: data.avgSteps,
      },
    });
  } catch (err) {
    console.error('[digest/generate] error:', err);
    return NextResponse.json({ error: 'Failed to generate digest.' }, { status: 500 });
  }
}
