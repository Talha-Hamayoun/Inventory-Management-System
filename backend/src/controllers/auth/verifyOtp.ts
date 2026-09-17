import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { verifyEmailOtp } from "../../lib/emailOtp";
import type { Validator } from "../../validators";

export async function verifyOtpController(c: Context) {
  try {
    const { email, otp } = (c.req as any).valid("json") as Validator["VerifyOtp"];
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return c.json({ success: false, message: "Invalid verification code." }, 400);
    }

    if (user.emailVerified) {
      return c.json({
        success: true,
        message: "Email verified successfully. Your account request has been submitted for approval. You will receive an email once your account is approved.",
      });
    }

    const result = await verifyEmailOtp(user.id, otp);
    if (!result.ok) {
      return c.json({ success: false, message: result.message }, 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        accountStatus: "PENDING_APPROVAL",
      },
    });

    return c.json({
      success: true,
      message: "Email verified successfully. Your account request has been submitted for approval. You will receive an email once your account is approved.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return c.json({ success: false, message: "Failed to verify code." }, 500);
  }
}
