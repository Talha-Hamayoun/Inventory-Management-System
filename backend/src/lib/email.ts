import { readSettings } from "../controllers/settings/getSettings";

function isUnset(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return true;
  return /your-gmail|your-app-password|changeme|example\.com/i.test(trimmed);
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");
  const from = process.env.SMTP_FROM?.trim();

  if (isUnset(host) || isUnset(user) || isUnset(pass)) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
    from: isUnset(from) ? user : from,
  };
}

export async function sendEmail(options: { to: string; subject: string; text: string; html?: string }) {
  const settings = await readSettings();
  const smtp = getSmtpConfig();
  const from =
    smtp?.from ||
    process.env.SMTP_FROM ||
    settings.companyEmail ||
    "noreply@inventory.local";

  if (!smtp) {
    console.info(`[email:dev] to=${options.to} subject=${options.subject}\n${options.text}`);
    return { sent: false, logged: true, reason: "smtp_not_configured" as const };
  }

  try {
    const nodemailerMod = await import("nodemailer") as {
      createTransport?: Function;
      default?: { createTransport: Function };
    };
    const createTransport = nodemailerMod.createTransport ?? nodemailerMod.default?.createTransport;
    if (!createTransport) {
      throw new Error("Nodemailer is not available");
    }

    const transporter = createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      requireTLS: smtp.port === 587,
      auth: smtp.auth,
    });

    console.info(`[email:smtp] sending via ${smtp.host} as ${smtp.auth.user} to=${options.to}`);
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text.replaceAll("\n", "<br/>"),
    });

    console.info(`[email:smtp] sent to=${options.to} subject=${options.subject}`);
    return { sent: true, logged: false };
  } catch (error) {
    console.error(`[email:smtp] failed to=${options.to}:`, error);
    console.info(`[email:dev] fallback to=${options.to} subject=${options.subject}\n${options.text}`);
    return {
      sent: false,
      logged: true,
      reason: "smtp_failed" as const,
      error: (error as Error).message,
    };
  }
}

export function otpEmail(name: string, otp: string) {
  const subject = "Your verification code";
  const text = `Hi ${name},\n\nYour email verification code is ${otp}.\nThis code expires in 10 minutes.\n\nIf you did not create an account, you can ignore this email.`;
  return { subject, text };
}

export function approvedEmail(name: string) {
  const subject = "Your account has been approved";
  const text = `Hi ${name},\n\nYour account request has been approved. You can now sign in to Inventory Management.\n\nIf you did not request this account, please contact the administrator.`;
  return { subject, text };
}

export function rejectedEmail(name: string, reason?: string | null) {
  const subject = "Your account request was not approved";
  const reasonLine = reason?.trim() ? `\nReason: ${reason.trim()}\n` : "";
  const text = `Hi ${name},\n\nYour account request has been rejected.${reasonLine}\nYou will not be able to sign in with this account.`;
  return { subject, text };
}
