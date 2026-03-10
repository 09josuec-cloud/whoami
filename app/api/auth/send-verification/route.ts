import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";
import { rateLimit } from "@/src/lib/rate-limit";
import { getClientIp } from "@/src/lib/security";
import { sendEmail } from "@/src/services/notifications/email";
import { verifyEmailTemplate } from "@/src/services/notifications/templates";

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * ONE_HOUR_MS;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const userId = session.user.id;
  const ip = getClientIp(request);

  const limit = rateLimit(`send-verification:${userId}:${ip}`, {
    maxAttempts: 3,
    windowMs: ONE_HOUR_MS,
  });

  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json(
      { error: "Email is already verified." },
      { status: 400 }
    );
  }

  // Remove any existing verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: user.email },
  });

  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: hashedToken,
      expires,
    },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your Whoami email address",
    html: verifyEmailTemplate(verifyUrl),
  });

  return NextResponse.json({ message: "Verification email sent." });
}
