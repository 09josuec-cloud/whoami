import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as OTPAuth from "otpauth";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { rateLimit } from "@/src/lib/rate-limit";
import { logAuthEvent, AuditAction } from "@/src/lib/audit";
import { getClientIp } from "@/src/lib/security";

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must contain only digits"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limit = rateLimit(`2fa-disable:${session.user.id}:${ip}`, {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
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
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  const { code } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: "Two-factor authentication is not enabled." },
      { status: 400 }
    );
  }

  const totp = new OTPAuth.TOTP({
    issuer: "Whoami",
    label: user.email ?? "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
  });

  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    return NextResponse.json(
      { error: "Invalid verification code. Please try again." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  await logAuthEvent({
    userId: user.id,
    action: AuditAction.TWO_FACTOR_DISABLED,
    request,
    metadata: { email: user.email ?? undefined },
  });

  return NextResponse.json({
    message: "Two-factor authentication disabled successfully.",
  });
}
