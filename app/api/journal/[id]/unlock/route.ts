import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { verify } from '@node-rs/argon2';
import { rateLimit } from '@/src/lib/rate-limit';

const MAX_ATTEMPTS = 5;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Server-side rate limiting: 5 attempts per 15 min per user per entry
  const { id } = await params;
  const rlKey = `journal-unlock:${session.user.id}:${id}`;
  const limit = rateLimit(rlKey, { maxAttempts: MAX_ATTEMPTS, windowMs: 15 * 60 * 1000 });
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many PIN attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limit.reset - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: { pin?: string };
  try {
    body = (await req.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.pin) {
    return NextResponse.json({ error: 'PIN required' }, { status: 400 });
  }

  const [entry, user] = await Promise.all([
    prisma.journalEntry.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, pinAttempts: true, locked: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { journalPin: true },
    }),
  ]);

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!user?.journalPin) return NextResponse.json({ error: 'No PIN set' }, { status: 400 });

  const isCorrect = await verify(user.journalPin, body.pin);

  if (isCorrect) {
    // Reset attempt counter but keep locked: true in DB — unlock is session-only
    const fullEntry = await prisma.journalEntry.update({
      where: { id },
      data: { pinAttempts: 0 },
    });
    return NextResponse.json({ success: true, entry: fullEntry });
  }

  const newAttempts = entry.pinAttempts + 1;
  const attemptsLeft = MAX_ATTEMPTS - newAttempts;

  if (newAttempts >= MAX_ATTEMPTS) {
    await prisma.journalEntry.delete({ where: { id } });
    return NextResponse.json({ deleted: true, attemptsLeft: 0 });
  }

  await prisma.journalEntry.update({
    where: { id },
    data: { pinAttempts: newAttempts },
  });

  return NextResponse.json({ success: false, attemptsLeft });
}
