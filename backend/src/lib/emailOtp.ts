import { hash, compare } from "bcryptjs";
import { prisma } from "./prisma";

export const OTP_EXPIRY_MINUTES = 10;
export const OTP_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function issueEmailOtp(userId: number) {
  const existing = await prisma.emailOtp.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const elapsed = (Date.now() - existing.lastSentAt.getTime()) / 1000;
    if (elapsed < OTP_COOLDOWN_SECONDS) {
      return {
        ok: false as const,
        retryAfter: Math.ceil(OTP_COOLDOWN_SECONDS - elapsed),
        code: null as string | null,
      };
    }
    await prisma.emailOtp.deleteMany({ where: { userId } });
  }

  const code = generateOtpCode();
  const codeHash = await hash(code, 10);
  const now = new Date();
  await prisma.emailOtp.create({
    data: {
      userId,
      codeHash,
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000),
      lastSentAt: now,
    },
  });

  return { ok: true as const, retryAfter: OTP_COOLDOWN_SECONDS, code };
}

export async function verifyEmailOtp(userId: number, code: string) {
  const otp = await prisma.emailOtp.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { ok: false as const, message: "No verification code found. Please request a new one." };
  }
  if (otp.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.deleteMany({ where: { userId } });
    return { ok: false as const, message: "Verification code has expired. Please request a new one." };
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false as const, message: "Too many attempts. Please request a new code." };
  }

  const matches = await compare(code.trim(), otp.codeHash);
  if (!matches) {
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    });
    return { ok: false as const, message: "Invalid verification code." };
  }

  await prisma.emailOtp.deleteMany({ where: { userId } });
  return { ok: true as const, message: "Email verified successfully." };
}
