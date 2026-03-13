import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { createHash } from 'crypto';
import { hash } from '@node-rs/argon2';
import { rateLimit } from '@/src/lib/rate-limit';

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = rateLimit(`pin-recovery-verify:${session.user.id}`, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body: { otp?: string; newPin?: string };
  try {
    body = (await req.json()) as { otp?: string; newPin?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { otp, newPin } = body;
  if (!otp || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: 'Invalid OTP format' }, { status: 400 });
  }
  if (!newPin || !/^\d{4,6}$/.test(newPin)) {
    return NextResponse.json({ error: 'New PIN must be 4–6 digits' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pinResetToken: true, pinResetExpires: true, pinResetType: true },
  });

  if (!user?.pinResetToken || !user.pinResetExpires || !user.pinResetType) {
    return NextResponse.json({ error: 'No pending PIN reset. Request a code first.' }, { status: 400 });
  }

  if (new Date() > user.pinResetExpires) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { pinResetToken: null, pinResetExpires: null, pinResetType: null },
    });
    return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 });
  }

  const hashedOtp = hashOtp(otp);
  if (hashedOtp !== user.pinResetToken) {
    return NextResponse.json({ error: 'Incorrect code', attemptsLeft: limit.remaining }, { status: 400 });
  }

  // OTP correct — set new PIN
  const hashedPin = await hash(newPin);
  const pinField = user.pinResetType === 'journal' ? 'journalPin' : 'notesPin';

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      [pinField]: hashedPin,
      pinResetToken: null,
      pinResetExpires: null,
      pinResetType: null,
    },
  });

  return NextResponse.json({ success: true, pinType: user.pinResetType });
}
