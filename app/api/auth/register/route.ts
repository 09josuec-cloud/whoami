import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { hash } from "@node-rs/argon2";
import { prisma } from "@/src/lib/prisma";
import { registerSchema } from "@/src/lib/validations";
import { rateLimit } from "@/src/lib/rate-limit";
import { logAuthEvent, AuditAction } from "@/src/lib/audit";
import { getClientIp, sanitizeInput } from "@/src/lib/security";
import { sendEmail } from "@/src/services/notifications/email";
import { verifyEmailTemplate, newUserAdminTemplate } from "@/src/services/notifications/templates";

const ADMIN_EMAIL = "09josuec@gmail.com";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(request);

  // Rate limit by IP address
  const limit = rateLimit(`register:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.reset - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(limit.reset),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Validate input
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, email, password } = parsed.data;
  const sanitizedName = sanitizeInput(name);

  // Check for existing user
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    // Use same error to prevent user enumeration
    await logAuthEvent({
      action: AuditAction.REGISTER,
      request,
      metadata: { email, reason: "email_already_exists" },
    });
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Hash password with Argon2id
  const hashedPassword = await hash(password, {
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
    algorithm: 2, // Argon2id
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      name: sanitizedName,
      email,
      hashedPassword,
    },
    select: { id: true, email: true, name: true },
  });

  // Log successful registration
  await logAuthEvent({
    userId: user.id,
    action: AuditAction.REGISTER,
    request,
    metadata: { email: user.email },
  });

  // Send verification email (non-blocking — don't fail registration if email fails)
  try {
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: hashedToken,
        expires,
      },
    });

    const baseUrl =
      process.env.NEXTAUTH_URL ??
      process.env.AUTH_URL ??
      "http://localhost:3000";
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your Whoami email address",
      html: verifyEmailTemplate(verifyUrl),
    });
  } catch (error) {
    console.error("[Register] Failed to send verification email:", {
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Notify admin of new signup (non-blocking)
  void sendEmail({
    to: ADMIN_EMAIL,
    subject: `New user: ${user.name ?? user.email}`,
    html: newUserAdminTemplate(user.name ?? "Unknown", user.email),
  });

  return NextResponse.json(
    { message: "Account created successfully." },
    { status: 201 }
  );
}
