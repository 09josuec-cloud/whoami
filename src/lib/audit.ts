import { prisma } from "./prisma";
import { getClientIp } from "./security";

export const AuditAction = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  REGISTER: "REGISTER",
  LOGOUT: "LOGOUT",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  TWO_FACTOR_ENABLED: "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED: "TWO_FACTOR_DISABLED",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

interface AuditEventOptions {
  userId?: string;
  action: AuditActionType;
  request: Request;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function logAuthEvent({
  userId,
  action,
  request,
  metadata,
}: AuditEventOptions): Promise<void> {
  try {
    const ipAddress = getClientIp(request);
    // Truncate user agent to 500 chars to avoid DB overflow
    const userAgent =
      request.headers.get("user-agent")?.slice(0, 500) ?? undefined;

    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        ipAddress,
        userAgent,
        // Prisma 7 InputJsonValue accepts plain objects
        metadata: metadata
          ? (metadata as Record<string, string | number | boolean | null>)
          : undefined,
      },
    });
  } catch (error) {
    // Audit logging must never crash the main request — log silently
    console.error("[Audit] Failed to write audit log:", {
      action,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
