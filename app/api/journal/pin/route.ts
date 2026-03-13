import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { hash, verify } from '@node-rs/argon2';
import { rateLimit } from '@/src/lib/rate-limit';

export async function GET(): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { journalPin: true },
  });

  return NextResponse.json({ hasPin: !!user?.journalPin });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { pin?: string };
  try {
    body = (await req.json()) as { pin?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.pin || !/^\d{4,6}$/.test(body.pin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { journalPin: true },
  });

  if (user?.journalPin) {
    return NextResponse.json({ error: 'PIN already set' }, { status: 409 });
  }

  const hashed = await hash(body.pin);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { journalPin: hashed },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit PIN change attempts
  const pinChangeLimit = rateLimit(`journal-pin-change:${session.user.id}`, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!pinChangeLimit.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  let body: { currentPin?: string; newPin?: string };
  try {
    body = (await req.json()) as { currentPin?: string; newPin?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.currentPin || !body.newPin) {
    return NextResponse.json({ error: 'currentPin and newPin are required' }, { status: 400 });
  }

  if (!/^\d{4,6}$/.test(body.newPin)) {
    return NextResponse.json({ error: 'New PIN must be 4–6 digits' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { journalPin: true },
  });

  if (!user?.journalPin) {
    return NextResponse.json({ error: 'No PIN is set' }, { status: 400 });
  }

  const isValid = await verify(user.journalPin, body.currentPin);
  if (!isValid) {
    return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 401 });
  }

  const hashed = await hash(body.newPin);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { journalPin: hashed },
    }),
    prisma.journalEntry.updateMany({
      where: { userId: session.user.id, locked: true },
      data: { pinAttempts: 0 },
    }),
  ]);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit PIN deletion attempts
  const pinDeleteLimit = rateLimit(`journal-pin-delete:${session.user.id}`, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!pinDeleteLimit.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  let body: { currentPin?: string };
  try {
    body = (await req.json()) as { currentPin?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.currentPin) {
    return NextResponse.json({ error: 'currentPin is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { journalPin: true },
  });

  if (!user?.journalPin) {
    return NextResponse.json({ error: 'No PIN is set' }, { status: 400 });
  }

  const isValid = await verify(user.journalPin, body.currentPin);
  if (!isValid) {
    return NextResponse.json({ error: 'PIN is incorrect' }, { status: 401 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { journalPin: null },
    }),
    prisma.journalEntry.updateMany({
      where: { userId: session.user.id },
      data: { locked: false, pinAttempts: 0 },
    }),
  ]);

  return NextResponse.json({ success: true });
}
