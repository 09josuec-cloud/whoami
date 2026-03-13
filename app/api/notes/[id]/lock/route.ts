import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { verify } from '@node-rs/argon2';
import { rateLimit } from '@/src/lib/rate-limit';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: { pin?: string };
  try {
    body = (await req.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const note = await prisma.note.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, locked: true },
  });
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Locking a note: requires PIN if one is set, or just locks it
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { journalPin: true },
  });

  if (!user?.journalPin) {
    return NextResponse.json({ error: 'Set a PIN in Journal settings first' }, { status: 400 });
  }

  if (!body.pin) {
    return NextResponse.json({ error: 'PIN required to lock a note' }, { status: 400 });
  }

  const limit = rateLimit(`note-lock:${session.user.id}`, {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const isCorrect = await verify(user.journalPin, body.pin);
  if (!isCorrect) {
    return NextResponse.json({ success: false, attemptsLeft: limit.remaining });
  }

  const updated = await prisma.note.update({
    where: { id },
    data: { locked: true, pinAttempts: 0 },
  });

  return NextResponse.json({ success: true, note: updated });
}
