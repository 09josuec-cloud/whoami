import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/src/lib/prisma";
import { logAuthEvent, AuditAction } from "@/src/lib/audit";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token");

  if (!rawToken) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url)
    );
  }

  const hashedToken = createHash("sha256").update(rawToken).digest("hex");

  // Verification tokens use the hashed token as the token field
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!verificationToken) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url)
    );
  }

  if (verificationToken.expires < new Date()) {
    // Clean up expired token
    await prisma.verificationToken.delete({
      where: { token: hashedToken },
    });
    return NextResponse.redirect(
      new URL("/login?error=token_expired", request.url)
    );
  }

  // identifier stores the user's email
  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url)
    );
  }

  // Mark email as verified and delete the token
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { token: hashedToken },
  });

  await logAuthEvent({
    userId: user.id,
    action: AuditAction.EMAIL_VERIFIED,
    request,
    metadata: { email: user.email },
  });

  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${baseUrl}/login?verified=true`);
}
