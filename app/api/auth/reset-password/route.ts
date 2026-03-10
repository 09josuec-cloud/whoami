import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { hash } from "@node-rs/argon2";
import { prisma } from "@/src/lib/prisma";
import { rateLimit } from "@/src/lib/rate-limit";
import { logAuthEvent, AuditAction } from "@/src/lib/audit";
import { getClientIp } from "@/src/lib/security";

const schema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must be at most 128 characters")
    .refine((val) => /[A-Z]/.test(val), "Password must contain at least one uppercase letter")
    .refine((val) => /[a-z]/.test(val), "Password must contain at least one lowercase letter")
    .refine((val) => /[0-9]/.test(val), "Password must contain at least one number")
    .refine((val) => /[^A-Za-z0-9]/.test(val), "Password must contain at least one special character"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);

  const limit = rateLimit(`reset-password:${ip}`, {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
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

  const { token, password } = parsed.data;

  // Hash the incoming raw token to compare with stored hash
  const hashedToken = createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 }
    );
  }

  const hashedPassword = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
    algorithm: 2, // Argon2id
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  await logAuthEvent({
    userId: user.id,
    action: AuditAction.PASSWORD_CHANGE,
    request,
    metadata: { email: user.email, method: "password_reset" },
  });

  return NextResponse.json({ message: "Password reset successfully." });
}
