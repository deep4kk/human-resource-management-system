import { logger } from "./logger";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER;

  if (!provider) {
    logger.warn({ to: options.to, subject: options.subject }, "Email skipped: no EMAIL_PROVIDER configured");
    return;
  }

  try {
    if (provider === "sendgrid") {
      const apiKey = process.env.SENDGRID_API_KEY;
      if (!apiKey) throw new Error("SENDGRID_API_KEY not set");
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: process.env.EMAIL_FROM || "noreply@hrms.app" },
          subject: options.subject,
          content: [
            { type: options.html ? "text/html" : "text/plain", value: options.html || options.text },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`SendGrid error ${res.status}: ${body}`);
      }
    } else if (provider === "resend") {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY not set");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "noreply@hrms.app",
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend error ${res.status}: ${body}`);
      }
    } else {
      logger.warn({ provider }, "Unknown EMAIL_PROVIDER");
    }

    logger.info({ to: options.to, subject: options.subject }, "Email sent");
  } catch (err) {
    logger.error({ err, to: options.to, subject: options.subject }, "Failed to send email");
  }
}

export function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  return sendEmail({
    to,
    subject: "Reset your HRMS password",
    text: `Click the link to reset your password: ${resetLink}\nThis link expires in 1 hour.`,
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`,
  });
}
