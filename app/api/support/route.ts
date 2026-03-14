import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/src/services/notifications/email';
import { rateLimit } from '@/src/lib/rate-limit';
import { getClientIp } from '@/src/lib/security';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  issueType: z.enum(['bug', 'account', 'billing', 'feature', 'data', 'other']),
  message: z.string().min(10).max(5000),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rl = rateLimit(ip, { maxAttempts: 3, windowMs: 60 * 60 * 1000 }); // 3 per hour
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, issueType, message } = parsed.data;

  const issueLabels: Record<string, string> = {
    bug: '🐛 Bug Report',
    account: '👤 Account Issue',
    billing: '💳 Billing Question',
    feature: '✨ Feature Request',
    data: '🔒 Data / Privacy Request',
    other: '💬 Other',
  };

  await sendEmail({
    to: 'support@whoami.company',
    subject: `[Support] ${issueLabels[issueType]} from ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#09090b;color:#e4e4e7;">
        <div style="margin-bottom:24px;">
          <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:16px;">
            <div style="width:28px;height:28px;background:#4f46e5;border-radius:6px;display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-weight:bold;font-size:12px;">W</span>
            </div>
            <span style="font-weight:600;color:#f4f4f5;font-size:14px;">whoami support</span>
          </div>
          <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#f4f4f5;">${issueLabels[issueType]}</h2>
          <p style="margin:0;color:#71717a;font-size:13px;">${new Date().toUTCString()}</p>
        </div>

        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
          <table style="width:100%;font-size:13px;">
            <tr>
              <td style="color:#71717a;padding:4px 0;width:80px;">Name</td>
              <td style="color:#e4e4e7;">${name}</td>
            </tr>
            <tr>
              <td style="color:#71717a;padding:4px 0;">Email</td>
              <td><a href="mailto:${email}" style="color:#818cf8;">${email}</a></td>
            </tr>
            <tr>
              <td style="color:#71717a;padding:4px 0;">Type</td>
              <td style="color:#e4e4e7;">${issueLabels[issueType]}</td>
            </tr>
          </table>
        </div>

        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#71717a;">Message</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#d4d4d8;white-space:pre-wrap;">${message}</p>
        </div>

        <p style="margin-top:24px;font-size:12px;color:#52525b;">
          Reply directly to this email to respond to ${name} at ${email}.
        </p>
      </div>
    `,
  });

  // Also send a confirmation to the user
  await sendEmail({
    to: email,
    subject: 'We received your message — whoami support',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#09090b;color:#e4e4e7;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
          <div style="width:32px;height:32px;background:#4f46e5;border-radius:8px;display:flex;align-items:center;justify-content:center;">
            <span style="color:white;font-weight:bold;font-size:14px;">W</span>
          </div>
          <span style="font-weight:600;font-size:15px;color:#f4f4f5;">whoami</span>
        </div>
        <h2 style="font-size:20px;font-weight:700;color:#f4f4f5;margin:0 0 12px;">We got your message, ${name}.</h2>
        <p style="color:#a1a1aa;font-size:14px;line-height:1.7;margin:0 0 20px;">
          Thanks for reaching out. We'll review your ${issueLabels[issueType].toLowerCase()} and get back to you within 24–48 hours.
        </p>
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px 20px;font-size:13px;color:#71717a;">
          <p style="margin:0 0 4px;font-weight:500;color:#a1a1aa;">Your message:</p>
          <p style="margin:0;white-space:pre-wrap;line-height:1.6;">${message.slice(0, 300)}${message.length > 300 ? '…' : ''}</p>
        </div>
        <p style="margin-top:24px;font-size:12px;color:#52525b;">© ${new Date().getFullYear()} whoami.company</p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
