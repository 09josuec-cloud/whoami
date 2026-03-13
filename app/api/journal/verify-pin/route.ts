import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { verify } from '@node-rs/argon2';
import { rateLimit } from '@/src/lib/rate-limit';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = rateLimit(`journal-verify:${session.user.id}`, {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.reset - Date.now()) / 1000)) } }
    );
  }

  let body: { pin?: string };
  try {
    body = (await req.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!body.pin) {
    return NextResponse.json({ error: 'PIN required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { journalPin: true },
  });

  if (!user?.journalPin) {
    return NextResponse.json({ error: 'No PIN set' }, { status: 400 });
  }

  const isCorrect = await verify(user.journalPin, body.pin);
  if (isCorrect) {
    return NextResponse.json({ success: true });
  }

  const remaining = limit.remaining;
  return NextResponse.json({ success: false, attemptsLeft: remaining });
}
