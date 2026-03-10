import { Resend } from "resend";

export const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "Whoami <noreply@whoami.app>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailOptions): Promise<void> {
  const client = getResendClient();

  if (!client) {
    // Dev fallback — log to console instead of throwing
    console.log("[Email Dev Fallback]", {
      to,
      subject,
      html: html.slice(0, 200) + "...",
    });
    return;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
  } catch (error) {
    // Never crash the caller — email failures are non-fatal
    console.error("[Email] Failed to send email:", {
      to,
      subject,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
