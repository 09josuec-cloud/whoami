import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/src/services/notifications/email';
import { auth } from '@/src/lib/auth';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Only available in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const to = session?.user?.email ?? (await req.json().catch(() => ({}))).to;
  if (!to) {
    return NextResponse.json({ error: 'No recipient email' }, { status: 400 });
  }

  await sendEmail({
    to,
    subject: 'whoami — Email test ✓',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #09090b; color: #e4e4e7;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 32px;">
          <div style="width: 32px; height: 32px; background: #4f46e5; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: bold; font-size: 14px;">W</span>
          </div>
          <span style="font-weight: 600; font-size: 15px; color: #f4f4f5;">whoami</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #f4f4f5; margin: 0 0 12px;">Email is working ✓</h1>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          This test email confirms that transactional email from <strong style="color: #818cf8;">noreply@whoami.company</strong> is fully configured and delivering correctly.
        </p>
        <div style="background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px 20px; font-size: 13px; color: #71717a;">
          Sent to: ${to}<br/>
          Time: ${new Date().toUTCString()}
        </div>
        <p style="margin-top: 32px; font-size: 12px; color: #52525b;">© ${new Date().getFullYear()} whoami.company</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true, sentTo: to });
}
