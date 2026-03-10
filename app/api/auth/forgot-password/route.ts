import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/src/lib/prisma";
import { rateLimit } from "@/src/lib/rate-limit";
import { logAuthEvent, AuditAction } from "@/src/lib/audit";
import { getClientIp } from "@/src/lib/security";
import { sendEmail } from "@/src/services/notifications/email";
import { passwordResetTemplate } from "@/src/services/notifications/templates";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
});

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);

  // 3 requests per hour per IP
  const limit = rateLimit(`forgot-password:${ip}`, {
    maxAttempts: 3,
    windowMs: ONE_HOUR_MS,
  });

  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.reset - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // Always return success to prevent email enumeration
    return NextResponse.json({
      message:
        "If that email exists, a reset link has been sent.",
    });
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  // Always log and return success — never reveal if email exists
  if (!user) {
    await logAuthEvent({
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      request,
      metadata: { email, reason: "email_not_found" },
    });
    return NextResponse.json({
      message: "If that email exists, a reset link has been sent.",
    });
  }

  // Generate secure token
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + ONE_HOUR_MS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires,
    },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Whoami password",
    html: passwordResetTemplate(resetUrl),
  });

  await logAuthEvent({
    userId: user.id,
    action: AuditAction.PASSWORD_RESET_REQUESTED,
    request,
    metadata: { email: user.email },
  });

  return NextResponse.json({
    message: "If that email exists, a reset link has been sent.",
  });
}
