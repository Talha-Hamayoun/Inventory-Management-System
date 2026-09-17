import { Context } from "hono";
import { prisma } from "../../lib/prisma";
import { issueEmailOtp } from "../../lib/emailOtp";
import { otpEmail, sendEmail } from "../../lib/email";
import type { Validator } from "../../validators";

export async function resendOtpController(c: Context) {
  try {
    const { email } = (c.req as any).valid("json") as Validator["ResendOtp"];
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.emailVerified) {
      return c.json({
        success: true,
        message: "If that email needs verification, a new code has been sent.",
      });
    }

    const issued = await issueEmailOtp(user.id);
    if (!issued.ok) {
      return c.json({
        success: false,
        message: `Please wait ${issued.retryAfter} seconds before requesting another code.`,
        retryAfter: issued.retryAfter,
      }, 429);
    }

    const mail = otpEmail(user.name, issued.code!);
    await sendEmail({ to: user.email, ...mail });

    return c.json({
      success: true,
      message: "A new verification code has been sent.",
      retryAfter: issued.retryAfter,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return c.json({ success: false, message: "Failed to resend verification code." }, 500);
  }
}
