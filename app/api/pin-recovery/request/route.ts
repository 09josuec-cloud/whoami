import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { randomBytes, createHash } from 'crypto';
import { rateLimit } from '@/src/lib/rate-limit';
import { sendEmail } from '@/src/services/notifications/email';
import { sendSms } from '@/src/lib/sms';

const OTP_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function generateOtp(): string {
  // 6-digit numeric OTP
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = rateLimit(`pin-recovery:${session.user.id}`, {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  let body: { pinType?: string; method?: string };
  try {
    body = (await req.json()) as { pinType?: string; method?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { pinType, method } = body;
  if (!pinType || !['journal', 'notes'].includes(pinType)) {
    return NextResponse.json({ error: 'pinType must be journal or notes' }, { status: 400 });
  }
  if (!method || !['email', 'sms'].includes(method)) {
    return NextResponse.json({ error: 'method must be email or sms' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, phone: true, phoneVerified: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (method === 'sms') {
    if (!user.phone || !user.phoneVerified) {
      return NextResponse.json(
        { error: 'No verified phone number on file. Add one in Settings first.' },
        { status: 400 }
      );
    }
  }

  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);
  const expires = new Date(Date.now() + OTP_EXPIRY_MS);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      pinResetToken: hashedOtp,
      pinResetExpires: expires,
      pinResetType: pinType,
    },
  });

  const pinLabel = pinType === 'journal' ? 'Journal' : 'Notes';

  if (method === 'email') {
    await sendEmail({
      to: user.email,
      subject: `Your Whoami ${pinLabel} PIN reset code`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#09090b;color:#f4f4f5;border-radius:16px;">
          <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Reset your ${pinLabel} PIN</h2>
          <p style="color:#a1a1aa;font-size:14px;margin-bottom:24px;">Enter this code in the app to reset your ${pinLabel} PIN. It expires in 15 minutes.</p>
          <div style="background:#1c1c1f;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:8px;font-family:monospace;color:#818cf8;">${otp}</span>
          </div>
          <p style="color:#52525b;font-size:12px;">If you didn't request this, ignore this email. Your PIN won't change.</p>
        </div>
      `,
    });
    return NextResponse.json({ success: true, method: 'email', maskedEmail: maskEmail(user.email) });
  }

  // SMS
  await sendSms(user.phone!, `Your Whoami ${pinLabel} PIN reset code: ${otp}. Expires in 15 minutes.`);
  return NextResponse.json({ success: true, method: 'sms', maskedPhone: maskPhone(user.phone!) });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local.slice(0, 2) + '***';
  return `${masked}@${domain}`;
}

function maskPhone(phone: string): string {
  return '***-***-' + phone.slice(-4);
}
