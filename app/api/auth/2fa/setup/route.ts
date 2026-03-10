import { NextRequest, NextResponse } from "next/server";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { auth } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { rateLimit } from "@/src/lib/rate-limit";
import { getClientIp } from "@/src/lib/security";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limit = rateLimit(`2fa-setup:${session.user.id}:${ip}`, {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, twoFactorEnabled: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "Two-factor authentication is already enabled." },
      { status: 400 }
    );
  }

  const totp = new OTPAuth.TOTP({
    issuer: "Whoami",
    label: user.email ?? "user",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  const uri = totp.toString();
  const secret = totp.secret.base32;

  const qrCode = await QRCode.toDataURL(uri, {
    color: {
      dark: "#e2e8f0",
      light: "#0f0f23",
    },
    width: 256,
  });

  return NextResponse.json({ secret, qrCode, uri });
}
